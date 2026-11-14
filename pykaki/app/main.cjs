// pygaki 데스크톱 앱 (Electron, 예전 이름 PyKaki). 렌파이 프로젝트 폴더 하나를 열어 대본을 쓰고 GUI를 고친다.
//   pygaki.exe --project "C:\...\내게임"     렌파이 런처의 [pygaki로 편집]이 이렇게 부른다
//   pygaki.exe                               프로젝트 폴더를 고르는 창이 뜬다
// 화면은 웹 버전과 같은 web/index.html이고, 파일은 이 프로세스가 대신 읽고 쓴다(preload.cjs의 window.pygaki).
// 읽고 쓸 수 있는 곳은 연 프로젝트 폴더 안으로만 막는다.
const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron');
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

function open(project) {
  const win = new BrowserWindow({
    width: 1440,
    height: 900,
    title: `pygaki - ${path.basename(project)}`,
    backgroundColor: '#15171f',
    autoHideMenuBar: true,
    webPreferences: { preload: path.join(__dirname, 'preload.cjs'), contextIsolation: true, sandbox: true },
  });
  const id = win.webContents.id;
  const entry = { win, project, watcher: null, rootWatcher: null, live: null, liveTimer: null, game: null, reloading: null };
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

// 지우기: 효과 폴더의 효과 파일(game/ui_kit/effects/*.glsl)만. 다른 파일은 앱이 지우지 않는다
ipcMain.handle('pygaki:remove', (e, rel) => {
  const project = projectOf(e);
  const full = inside(project, rel);
  const where = path.relative(project, full).split(path.sep).join('/');
  if (!/^game\/ui_kit\/effects\/[^/]+\.glsl$/i.test(where)) throw new Error('효과 파일만 지울 수 있어요: ' + rel);
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

ipcMain.handle('pygaki:openFolder', (e, rel) => shell.openPath(inside(projectOf(e), rel)));

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

// ── 파일 고르기 (그림·영상·소리 카드의 [📂 파일 고르기]) ──
// 탐색기 창으로 파일 하나를 고른다. game 폴더 안이면 game 기준 경로를, 밖이면 복사할 때 쓸 표(token)를 돌려준다.
// 화면은 고른 파일의 경로를 모르고, 복사는 이 창에서 고른 파일만 한다
const PICK_KINDS = {
  image: { dir: 'images', name: '그림, 영상', ext: ['png', 'jpg', 'jpeg', 'webp', 'avif', 'webm'] },
  sound: { dir: 'audio', name: '소리', ext: ['ogg', 'opus', 'mp3', 'wav', 'flac'] },
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
// 밖에서 고른 파일을 game/<dir>/ 로 복사한다 (dir은 images, movies, audio만). 같은 이름이 있으면 _2, _3 …을 붙인다
ipcMain.handle('pygaki:importFile', (e, token, dir) => {
  const full = picked.get(token);
  if (!full) throw new Error('고른 파일을 찾지 못했어요');
  if (!['images', 'movies', 'audio'].includes(dir)) throw new Error('복사할 수 없는 자리예요: ' + dir);
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
function openOrFocus(project) {
  for (const w of windows.values())
    if (w.project.toLowerCase() === project.toLowerCase()) {
      if (w.win.isMinimized()) w.win.restore();
      w.win.focus();
      return;
    }
  open(project);
}

if (!app.requestSingleInstanceLock()) app.quit();
else {
  app.on('second-instance', async (_e, argv) => {
    const p = argProject(argv);
    if (p && isGame(p)) openOrFocus(p);
    else {
      const dir = await pickProject();
      if (dir) openOrFocus(dir);
    }
  });
  app.whenReady().then(async () => {
    let p = argProject(process.argv);
    if (!p || !isGame(p)) p = await pickProject();
    if (!p) return app.quit();
    open(p);
  });
  app.on('window-all-closed', () => app.quit());
}
