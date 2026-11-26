// pygaki 데스크톱 앱 (Electron, 예전 이름 PyKaki). 렌파이 프로젝트 폴더 하나를 열어 대본을 쓰고 GUI를 고친다.
//   pygaki.exe --project "C:\...\내게임"     렌파이 런처의 [pygaki로 편집]이 이렇게 부른다
//   pygaki.exe                               프로젝트 폴더를 고르는 창이 뜬다
// 화면은 웹 버전과 같은 web/index.html이고, 파일은 이 프로세스가 대신 읽고 쓴다(preload.cjs의 window.pygaki).
// 읽고 쓸 수 있는 곳은 연 프로젝트 폴더 안으로만 막는다.
const { app, BrowserWindow, ipcMain, dialog, shell, screen } = require('electron');
const fs = require('node:fs');
const path = require('node:path');
const net = require('node:net');
const { spawn } = require('node:child_process');

// 이름을 pygaki로 바꿔도(2026-11, 예전 PyKaki) 설정, 최근 파일, 자동 저장(IndexedDB renpy-flow-editor)이
// 든 폴더는 예전 자리(%APPDATA%\PyKaki)를 그대로 쓴다. 단일 실행 잠금보다 먼저 정해야 함
app.setPath('userData', path.join(app.getPath('appData'), 'PyKaki'));

const windows = new Map(); // webContents.id → { win, project, watcher, live, liveTimer }

// ── showpy 실시간 연결 (docs/LINK.md 9장) ──
// 게임이 개발 모드로 켜지면 game/showpy_live.json에 포트와 토큰을 적는다. 그 포트로 붙어서
// 한 줄에 JSON 하나씩 주고받고, 받은 것은 화면에 'pygaki:live'로 넘긴다.
const LIVE_FILE = 'showpy_live.json';

function liveInfo(project) {
  try {
    const d = JSON.parse(fs.readFileSync(path.join(project, 'game', LIVE_FILE), 'utf8'));
    return d && d.port && d.token ? d : null;
  } catch {
    return null;
  }
}

// 게임이 원고를 다시 읽으면(Shift+R, 자동 다시 읽기) 끊기기 직전에 {"type": "reloading"}을 보낸다.
// 그 뒤 끊긴 동안은 "게임 수정 중"으로 알린다. 게임 프로세스가 없어지거나 오래 안 붙으면 그냥 끊김으로
const RELOAD_WAIT = 120000;
const pidAlive = (pid) => {
  if (!pid) return false;
  try {
    process.kill(pid, 0);
    return true;
  } catch (e) {
    return e.code === 'EPERM';
  }
};

function liveSendStatus(entry) {
  if (entry.win.isDestroyed()) return;
  const l = entry.live;
  const on = !!(l && l.ready);
  entry.win.webContents.send('pygaki:liveStatus', { on, reloading: !on && !!entry.reloading, showpy: l?.info?.showpy ?? null });
}

// 끊겨 있는 동안 3초마다: 다시 읽는 중이던 게임이 꺼졌거나 너무 오래 걸리면 그냥 끊김으로
function reloadCheck(entry) {
  const r = entry.reloading;
  if (!r || (pidAlive(r.pid) && Date.now() - r.at < RELOAD_WAIT)) return;
  entry.reloading = null;
  liveSendStatus(entry);
}

function liveDrop(entry) {
  const l = entry.live;
  entry.live = null;
  if (l) l.sock.destroy();
  liveSendStatus(entry);
}

// 파일이 있으면 붙는다. 이미 같은 포트에 붙어 있으면 그대로 둔다.
function liveConnect(entry) {
  const info = liveInfo(entry.project);
  if (!info) return;
  if (entry.live && entry.live.info.port === info.port && entry.live.info.token === info.token) return;
  if (entry.live) liveDrop(entry);
  const sock = net.createConnection({ host: '127.0.0.1', port: info.port });
  const l = { sock, info, buf: '', ready: false, last: {} }; // last: 종류마다 마지막으로 받은 것 (화면이 늦게 뜰 때 넘겨줌)
  entry.live = l;
  sock.setEncoding('utf8');
  sock.setNoDelay(true);
  sock.on('connect', () => {
    sock.write(JSON.stringify({ hello: info.token, client: 'pykaki' }) + '\n');
    l.ready = true;
    entry.reloading = null;
    liveSendStatus(entry);
  });
  sock.on('data', (d) => {
    l.buf += d;
    let i;
    while ((i = l.buf.indexOf('\n')) >= 0) {
      const line = l.buf.slice(0, i);
      l.buf = l.buf.slice(i + 1);
      if (!line.trim() || entry.win.isDestroyed()) continue;
      try {
        const m = JSON.parse(line);
        if (m?.type === 'state' || m?.type === 'files') l.last[m.type] = m;
        // pygaki editor에서 [pygaki 앱에서 고르기]: 앱 창을 앞으로 (화면은 [GUI 편집]의 그 칸으로)
        if (m?.type === 'open') showWin(entry.win);
        if (m?.type === 'reloading') {
          entry.reloading = { pid: info.pid, at: Date.now() };
          continue;
        }
        entry.win.webContents.send('pygaki:live', m);
      } catch {
        /* 깨진 줄은 버림 */
      }
    }
  });
  const done = () => {
    if (entry.live === l) liveDrop(entry);
  };
  sock.on('error', done);
  sock.on('close', done);
}

function argProject(argv) {
  const i = argv.indexOf('--project');
  return i >= 0 && argv[i + 1] ? path.resolve(argv[i + 1]) : null;
}

// pygaki editor의 [pygaki 앱에서 고르기]가 앱을 켤 때: --tab <게임 탭 id> [--field <칸 id>]. [GUI 편집]의 그 탭, 그 칸을 연다
// 돌려주는 값은 { tab, field } (칸이 없으면 field null) 또는 null
function argTab(argv) {
  const word = (name) => {
    const i = argv.indexOf(name);
    return i >= 0 && argv[i + 1] && /^[a-z_]+$/.test(argv[i + 1]) ? argv[i + 1] : null;
  };
  const tab = word('--tab');
  return tab ? { tab, field: word('--field') } : null;
}

function showWin(win) {
  if (win.isDestroyed()) return;
  if (win.isMinimized()) win.restore();
  win.show();
  win.focus();
}

const isGame = (dir) => {
  try {
    return fs.statSync(path.join(dir, 'game')).isDirectory();
  } catch {
    return false;
  }
};

async function pickProject(parent) {
  for (;;) {
    const r = await dialog.showOpenDialog(parent, { title: '렌파이 프로젝트 폴더를 고르세요', properties: ['openDirectory'] });
    if (r.canceled || !r.filePaths[0]) return null;
    let dir = r.filePaths[0];
    if (path.basename(dir).toLowerCase() === 'game' && !isGame(dir)) dir = path.dirname(dir);
    if (isGame(dir)) return dir;
    await dialog.showMessageBox(parent, { type: 'warning', message: '렌파이 프로젝트 폴더가 아니에요', detail: 'game 폴더가 들어 있는 프로젝트 폴더를 골라 주세요.' });
  }
}

// 프로젝트 폴더 안의 경로만 허락한다
function inside(project, rel) {
  const full = path.resolve(project, rel ?? '');
  if (full !== project && !full.startsWith(project + path.sep)) throw new Error('프로젝트 폴더 밖이에요: ' + rel);
  return full;
}

function open(project, tab = null) {
  const win = new BrowserWindow({
    width: 1440,
    height: 900,
    title: `pygaki - ${path.basename(project)}`,
    backgroundColor: '#15171f',
    autoHideMenuBar: true,
    webPreferences: { preload: path.join(__dirname, 'preload.cjs'), contextIsolation: true, sandbox: true },
  });
  const id = win.webContents.id;
  const entry = { win, project, watcher: null, rootWatcher: null, live: null, liveTimer: null, game: null, reloading: null, openTab: tab };
  windows.set(id, entry);
  // showpy가 남기는 받아 적기 파일과 미리보기 파일을 지켜본다
  try {
    entry.watcher = fs.watch(path.join(project, 'game'), (_ev, name) => {
      if (name && !win.isDestroyed()) win.webContents.send('pygaki:changed', 'game/' + String(name).replace(/\\/g, '/'));
      if (name && String(name) === LIVE_FILE) liveConnect(entry);
    });
  } catch {
    /* 지켜보기를 못 해도 창으로 돌아올 때 읽는다 */
  }
  // 대본 파일(프로젝트 폴더 맨 위의 *.flow.json)을 다른 창이나 다른 프로그램이 고치면 알린다
  try {
    entry.rootWatcher = fs.watch(project, (_ev, name) => {
      if (name && /\.flow\.json$/i.test(String(name)) && !win.isDestroyed()) win.webContents.send('pygaki:changed', String(name));
    });
  } catch {
    /* 창으로 돌아올 때 읽는다 */
  }
  // 끊겨 있으면 3초마다 다시 붙어 본다 (지켜보기를 놓쳐도)
  entry.liveTimer = setInterval(() => {
    if (!entry.live) {
      reloadCheck(entry);
      liveConnect(entry);
    }
  }, 3000);
  liveConnect(entry);
  win.on('closed', () => {
    entry.watcher?.close();
    entry.rootWatcher?.close();
    clearInterval(entry.liveTimer);
    if (entry.live) entry.live.sock.destroy();
    windows.delete(id);
  });
  // 링크는 기본 브라우저로
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (/^https?:/.test(url)) shell.openExternal(url);
    return { action: 'deny' };
  });
  win.webContents.on('will-navigate', (e, url) => {
    if (!url.startsWith('file:')) {
      e.preventDefault();
      if (/^https?:/.test(url)) shell.openExternal(url);
    }
  });
  win.on('page-title-updated', (e) => e.preventDefault());
  win.loadFile(path.join(__dirname, 'web', 'index.html'), { query: { app: '1' } });
  return win;
}

const projectOf = (e) => {
  const w = windows.get(e.sender.id);
  if (!w) throw new Error('창을 찾지 못했어요');
  return w.project;
};

ipcMain.handle('pygaki:info', (e) => {
  const project = projectOf(e);
  let flows = [];
  try {
    flows = fs.readdirSync(project).filter((n) => n.toLowerCase().endsWith('.flow.json')).sort();
  } catch {
    /* 비어 있음 */
  }
  return { project, name: path.basename(project), flows, version: app.getVersion() };
});

ipcMain.handle('pygaki:list', (e, rel) => {
  const dir = inside(projectOf(e), rel);
  try {
    return fs.readdirSync(dir, { withFileTypes: true }).map((d) => ({ name: d.name, dir: d.isDirectory() }));
  } catch {
    return null;
  }
});

ipcMain.handle('pygaki:stat', (e, rel) => {
  try {
    const s = fs.statSync(inside(projectOf(e), rel));
    return { dir: s.isDirectory(), size: s.size, mtime: s.mtimeMs };
  } catch {
    return null;
  }
});

ipcMain.handle('pygaki:read', (e, rel) => {
  try {
    return new Uint8Array(fs.readFileSync(inside(projectOf(e), rel)));
  } catch {
    return null;
  }
});

// 다 쓴 뒤 바꿔 끼워서, 쓰는 도중에 렌파이가 반쯤 쓴 파일을 읽지 않게 한다
// 동기화 프로그램, 백신, 렌파이가 그 파일을 잠깐 잡고 있으면 윈도우에서 바꿔 끼우기가 EPERM/EBUSY/EACCES로 실패한다.
// 조금씩 기다리며 다시 해 보고, 끝내 안 되면 그 파일에 바로 쓴다 (저장을 놓치는 것보다 낫다)
const BUSY = new Set(['EPERM', 'EBUSY', 'EACCES']);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
ipcMain.handle('pygaki:write', async (e, rel, data) => {
  const full = inside(projectOf(e), rel);
  fs.mkdirSync(path.dirname(full), { recursive: true });
  const tmp = full + '.pykaki-tmp';
  const buf = typeof data === 'string' ? data : Buffer.from(data);
  fs.writeFileSync(tmp, buf);
  for (const ms of [0, 40, 80, 160, 320, 640]) {
    if (ms) await sleep(ms);
    try {
      fs.renameSync(tmp, full);
      return true;
    } catch (err) {
      if (!BUSY.has(err.code)) throw err;
    }
  }
  fs.writeFileSync(full, buf);
  try {
    fs.unlinkSync(tmp);
  } catch {
    // 남은 임시 파일은 다음 저장 때 덮어쓴다
  }
  return true;
});

// 지우기: 효과 폴더의 효과 파일(game/ui_kit/effects/*.glsl)과 글꼴 폴더의 글꼴(game/fonts/**.ttf|otf|ttc)만.
// 다른 파일은 앱이 지우지 않는다. 글꼴은 화면이 먼저 ui_kit_backup/fonts/에 백업한 뒤 부른다
ipcMain.handle('pygaki:remove', (e, rel) => {
  const project = projectOf(e);
  const full = inside(project, rel);
  const where = path.relative(project, full).split(path.sep).join('/');
  if (!/^game\/ui_kit\/effects\/[^/]+\.glsl$/i.test(where) && !/^game\/fonts\/.+\.(ttf|otf|ttc)$/i.test(where)) throw new Error('효과 파일과 글꼴만 지울 수 있어요: ' + rel);
  try {
    fs.unlinkSync(full);
    return true;
  } catch (err) {
    if (err.code === 'ENOENT') return false;
    throw err;
  }
});

ipcMain.handle('pygaki:liveSend', (e, msg) => {
  const l = windows.get(e.sender.id)?.live;
  if (!l || !l.ready) return false;
  l.sock.write(JSON.stringify(msg) + '\n');
  return true;
});

ipcMain.handle('pygaki:liveStatus', (e) => {
  const l = windows.get(e.sender.id)?.live;
  // 게임은 상태가 바뀔 때만 보내므로, 화면이 뜨기 전에 온 것은 여기서 넘겨준다
  const entry = windows.get(e.sender.id);
  const on = !!(l && l.ready);
  return { on, reloading: !on && !!entry?.reloading, showpy: l?.info?.showpy ?? null, last: l ? Object.values(l.last) : [] };
});

// 앱을 켤 때 받은 --tab, --field ({ tab, field }, 한 번만 넘겨줌)
ipcMain.handle('pygaki:openTab', (e) => {
  const entry = windows.get(e.sender.id);
  const t = entry?.openTab ?? null;
  if (entry) entry.openTab = null;
  return t;
});

// 폴더를 탐색기로 연다. make면 없는 폴더를 만들고 연다 (game 안만). 폴더 관리 메뉴(FolderMenu.tsx)가 씀
ipcMain.handle('pygaki:openFolder', (e, rel, make) => {
  const full = inside(projectOf(e), rel);
  if (make && !fs.existsSync(full) && String(rel).startsWith('game/')) fs.mkdirSync(full, { recursive: true });
  return shell.openPath(full);
});
// 프로젝트 밖의 정해진 자리: 앱 설정 폴더(userData), 렌파이 세이브 폴더(%APPDATA%/RenPy/<config.save_directory>)
function placeOf(project, id) {
  if (id === 'appSettings') return app.getPath('userData');
  if (id === 'renpySaves') {
    let name = null;
    try {
      const m = fs.readFileSync(path.join(project, 'game', 'options.rpy'), 'utf8').match(/^\s*define\s+config\.save_directory\s*=\s*["']([^"']+)["']/m);
      name = m && m[1];
    } catch {}
    if (!name || /[\\/]|\.\./.test(name)) return null;
    return path.join(app.getPath('appData'), 'RenPy', name);
  }
  return null;
}
ipcMain.handle('pygaki:placeInfo', (e, id) => {
  const full = placeOf(projectOf(e), id);
  return full ? { path: full, exists: fs.existsSync(full) } : null;
});
ipcMain.handle('pygaki:openPlace', (e, id) => {
  const full = placeOf(projectOf(e), id);
  if (!full) return '자리를 찾지 못했어요';
  if (!fs.existsSync(full)) return '아직 없어요 (게임을 한 번 켜면 생겨요)';
  return shell.openPath(full);
});

// ── 렌파이에서 실행 ──
// 묶음에서는 앱이 <렌파이 SDK>/pygaki/app 안에 있어서 두 칸 위에서 렌파이를 찾는다.
// 묶음 밖에서 켰으면(개발 중) 환경 변수 RENPY_SDK가 가리키는 폴더에서 찾는다.
function findRenpy() {
  const name = process.platform === 'win32' ? 'renpy.exe' : 'renpy.sh';
  for (const dir of [process.env.RENPY_SDK, path.resolve(path.dirname(process.execPath), '..', '..')]) {
    if (!dir) continue;
    const exe = path.join(dir, name);
    if (fs.existsSync(exe)) return exe;
  }
  return null;
}

// 돌려주는 값: 'started' 켰음, 'running' 이미 켜져 있어서 안 켬, 'no-sdk' 렌파이를 못 찾음, 'failed' 켜지 못함
// 켜져 있는지는 게임과의 실시간 연결(플러그인이 있는 게임)과 이 창이 켠 프로세스로 안다. always면 켜져 있어도 하나 더 켠다
ipcMain.handle('pygaki:runGame', (e, always) => {
  const entry = windows.get(e.sender.id);
  if (!entry) throw new Error('창을 찾지 못했어요');
  if (!always && ((entry.live && entry.live.ready) || entry.game)) return 'running';
  const exe = findRenpy();
  if (!exe) return 'no-sdk';
  try {
    const child = spawn(exe, [entry.project], { cwd: path.dirname(exe), detached: true, stdio: 'ignore' });
    const gone = () => {
      if (entry.game === child) entry.game = null;
    };
    child.on('error', gone);
    child.on('exit', gone);
    child.unref(); // 앱을 꺼도 게임은 그대로 둔다
    entry.game = child;
    return 'started';
  } catch {
    return 'failed';
  }
});

// ── 게임 창 옆에 붙이기 ──
// 게임 프로세스(실시간 연결 파일의 pid, 없으면 이 창이 켠 렌파이)의 창 자리를 PowerShell로 읽고(GetWindowRect, 실제 픽셀),
// 앱 창을 그 오른쪽(자리가 없으면 왼쪽) 빈 곳으로 옮긴다. 게임 창은 건드리지 않는다. 윈도우에서만
const RECT_PS = `$ErrorActionPreference='Stop'
Add-Type -Namespace P -Name W -MemberDefinition '[DllImport("user32.dll")] public static extern bool SetProcessDPIAware(); [DllImport("user32.dll")] public static extern bool GetWindowRect(System.IntPtr h, out RECT r); [DllImport("user32.dll")] public static extern bool IsIconic(System.IntPtr h); public struct RECT { public int L; public int T; public int R; public int B; }'
[P.W]::SetProcessDPIAware() | Out-Null
$h = (Get-Process -Id $env:PYGAKI_PID).MainWindowHandle
if ($h -eq 0 -or [P.W]::IsIconic($h)) { 'none'; exit }
$r = New-Object P.W+RECT
[P.W]::GetWindowRect($h, [ref]$r) | Out-Null
"$($r.L) $($r.T) $($r.R) $($r.B)"`;
function gameRect(pid) {
  return new Promise((resolve) => {
    if (process.platform !== 'win32' || !pid) return resolve(null);
    const ps = spawn('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', RECT_PS], { env: { ...process.env, PYGAKI_PID: String(pid) }, windowsHide: true });
    let out = '';
    ps.stdout.on('data', (d) => (out += d));
    ps.on('error', () => resolve(null));
    ps.on('close', () => {
      const n = out.trim().split(/\s+/).map(Number);
      if (n.length !== 4 || n.some((x) => !Number.isFinite(x))) return resolve(null);
      // 실제 픽셀 → Electron 화면 단위
      const r = screen.screenToDipRect(null, { x: n[0], y: n[1], width: n[2] - n[0], height: n[3] - n[1] });
      resolve(r.width > 50 && r.height > 50 ? r : null);
    });
  });
}
// 돌려주는 값: 'right' | 'left' | 'over'(빈 곳이 좁아 화면 오른쪽 끝에 겹쳐 둠) | 'no-game' | 'no-window'
async function snapToGame(entry) {
  const pid = entry.live?.info?.pid ?? entry.game?.pid;
  if (!pid || !pidAlive(pid)) return 'no-game';
  const g = await gameRect(pid);
  if (!g || entry.win.isDestroyed()) return 'no-window';
  const wa = screen.getDisplayMatching(g).workArea;
  const MIN = 560;
  const right = wa.x + wa.width - (g.x + g.width);
  const left = g.x - wa.x;
  const h = Math.min(wa.height, Math.max(g.height, 600));
  const y = Math.max(wa.y, Math.min(g.y, wa.y + wa.height - h));
  if (entry.win.isMaximized()) entry.win.unmaximize();
  if (right >= MIN || right >= left) {
    const w = Math.max(Math.min(right, 1400), Math.min(MIN, wa.width));
    entry.win.setBounds({ x: wa.x + wa.width - w, y, width: w, height: h });
    return right >= MIN ? 'right' : 'over';
  }
  const w = Math.min(left, 1400);
  entry.win.setBounds({ x: g.x - w, y, width: Math.max(w, MIN), height: h });
  return left >= MIN ? 'left' : 'over';
}
ipcMain.handle('pygaki:snapToGame', (e) => {
  const entry = windows.get(e.sender.id);
  return entry ? snapToGame(entry) : 'no-game';
});

// ── 파일 고르기 (그림·영상·소리 카드의 [📂 파일 고르기]) ──
// 탐색기 창으로 파일 하나를 고른다. game 폴더 안이면 game 기준 경로를, 밖이면 복사할 때 쓸 표(token)를 돌려준다.
// 화면은 고른 파일의 경로를 모르고, 복사는 이 창에서 고른 파일만 한다
const PICK_KINDS = {
  image: { dir: 'images', name: '그림, 영상', ext: ['png', 'jpg', 'jpeg', 'webp', 'avif', 'webm', 'ogv', 'mp4', 'mkv'] },
  sound: { dir: 'audio', name: '소리', ext: ['ogg', 'opus', 'mp3', 'wav', 'flac'] },
  font: { dir: 'fonts', name: '글꼴', ext: ['ttf', 'otf', 'ttc'] },
  // [아이콘] 창: 창 아이콘·exe 아이콘의 원본. 복사하지 않고 readPicked로 읽기만 한다 (ico는 exe 칸에서 그대로 씀)
  icon: { dir: 'gui', name: '아이콘 그림', ext: ['png', 'jpg', 'jpeg', 'webp', 'ico'] },
};
const picked = new Map(); // token → 고른 파일의 전체 경로
ipcMain.handle('pygaki:pickFile', async (e, kind) => {
  const k = PICK_KINDS[kind];
  if (!k) throw new Error('모르는 종류예요: ' + kind);
  const project = projectOf(e);
  const game = path.join(project, 'game');
  const start = fs.existsSync(path.join(game, k.dir)) ? path.join(game, k.dir) : game;
  const w = windows.get(e.sender.id);
  const r = await dialog.showOpenDialog(w?.win, { title: k.name + ' 파일 고르기', defaultPath: start, properties: ['openFile'], filters: [{ name: k.name, extensions: k.ext }] });
  if (r.canceled || !r.filePaths[0]) return null;
  const full = path.resolve(r.filePaths[0]);
  const name = path.basename(full);
  if (full.startsWith(game + path.sep)) return { name, rel: path.relative(game, full).split(path.sep).join('/') };
  const token = Math.random().toString(36).slice(2) + Date.now().toString(36);
  picked.set(token, full);
  return { name, token };
});
// 밖에서 고른 파일을 game/<dir>/ 로 복사한다 (dir은 images, movies, audio, fonts만). 같은 이름이 있으면 _2, _3 …을 붙인다
ipcMain.handle('pygaki:importFile', (e, token, dir) => {
  const full = picked.get(token);
  if (!full) throw new Error('고른 파일을 찾지 못했어요');
  if (!['images', 'movies', 'audio', 'fonts'].includes(dir)) throw new Error('복사할 수 없는 자리예요: ' + dir);
  picked.delete(token);
  const dest = inside(projectOf(e), path.join('game', dir));
  fs.mkdirSync(dest, { recursive: true });
  const ext = path.extname(full);
  const base = path.basename(full, ext);
  let name = base + ext;
  for (let i = 2; fs.existsSync(path.join(dest, name)); i++) name = `${base}_${i}${ext}`;
  fs.copyFileSync(full, path.join(dest, name));
  return dir + '/' + name;
});

// 투명 영상 만들기의 원본: 영상 하나, 움직이는 그림 하나, 또는 그림 여러 장(PNG 연속). 복사하지 않고 읽기만 한다
const MASK_SOURCE_EXT = ['webm', 'mp4', 'm4v', 'mkv', 'ogv', 'mov', 'gif', 'png', 'apng', 'webp', 'avif', 'jpg', 'jpeg'];
ipcMain.handle('pygaki:pickMaskSource', async (e) => {
  const game = path.join(projectOf(e), 'game');
  const w = windows.get(e.sender.id);
  const r = await dialog.showOpenDialog(w?.win, {
    title: '투명 영상으로 바꿀 파일 고르기 (그림 연속은 여러 장을 한꺼번에)',
    defaultPath: game,
    properties: ['openFile', 'multiSelections'],
    filters: [{ name: '영상, 움직이는 그림, 그림 연속', extensions: MASK_SOURCE_EXT }],
  });
  if (r.canceled || !r.filePaths.length) return null;
  return r.filePaths.map((f) => {
    const full = path.resolve(f);
    const token = Math.random().toString(36).slice(2) + Date.now().toString(36);
    picked.set(token, full);
    return { name: path.basename(full), token, size: fs.statSync(full).size };
  });
});
// 고른 파일 읽기 (pickMaskSource, pickFile로 고른 것만)
ipcMain.handle('pygaki:readPicked', (e, token) => {
  const full = picked.get(token);
  if (!full) throw new Error('고른 파일을 찾지 못했어요');
  return new Uint8Array(fs.readFileSync(full));
});

// 윈도우의 Electron은 alert/confirm을 닫은 뒤 글 칸에 커서가 안 들어가는 일이 있음 → 창 포커스를 한 번 뺐다가 돌려준다
ipcMain.handle('pygaki:refocus', (e) => {
  const win = BrowserWindow.fromWebContents(e.sender);
  if (!win || win.isDestroyed()) return;
  win.blur();
  win.focus();
  e.sender.focus();
});

// 다른 프로젝트 열기: 새 창으로
ipcMain.handle('pygaki:choose', async (e) => {
  const w = windows.get(e.sender.id);
  const dir = await pickProject(w?.win);
  if (dir) open(dir);
  return !!dir;
});

// 같은 프로젝트를 두 번 열면 있던 창을 앞으로
function openOrFocus(project, tab = null) {
  for (const w of windows.values())
    if (w.project.toLowerCase() === project.toLowerCase()) {
      showWin(w.win);
      if (tab) w.win.webContents.send('pygaki:live', { type: 'open', ...tab });
      return;
    }
  open(project, tab);
}

if (!app.requestSingleInstanceLock()) app.quit();
else {
  app.on('second-instance', async (_e, argv) => {
    const p = argProject(argv);
    if (p && isGame(p)) openOrFocus(p, argTab(argv));
    else {
      const dir = await pickProject();
      if (dir) openOrFocus(dir);
    }
  });
  app.whenReady().then(async () => {
    let p = argProject(process.argv);
    if (!p || !isGame(p)) p = await pickProject();
    if (!p) return app.quit();
    open(p, argTab(process.argv));
  });
  app.on('window-all-closed', () => app.quit());
}
