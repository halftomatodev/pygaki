// PyKaki 데스크톱 앱 (Electron). 렌파이 프로젝트 폴더 하나를 열어 대본을 쓴다.
//   PyKaki.exe --project "C:\...\내게임"     렌파이 런처의 [PyKaki로 대본 쓰기]가 이렇게 부른다
//   PyKaki.exe                               프로젝트 폴더를 고르는 창이 뜬다
// 화면은 웹 버전과 같은 web/index.html이고, 파일은 이 프로세스가 대신 읽고 쓴다(preload.cjs의 window.pygaki).
// 읽고 쓸 수 있는 곳은 연 프로젝트 폴더 안으로만 막는다.
const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron');
const fs = require('node:fs');
const path = require('node:path');
const net = require('node:net');

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

function liveSendStatus(entry) {
  if (entry.win.isDestroyed()) return;
  const l = entry.live;
  entry.win.webContents.send('pygaki:liveStatus', { on: !!(l && l.ready), showpy: l?.info?.showpy ?? null });
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
  const l = { sock, info, buf: '', ready: false };
  entry.live = l;
  sock.setEncoding('utf8');
  sock.setNoDelay(true);
  sock.on('connect', () => {
    sock.write(JSON.stringify({ hello: info.token, client: 'pykaki' }) + '\n');
    l.ready = true;
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
        entry.win.webContents.send('pygaki:live', JSON.parse(line));
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
    title: `PyKaki - ${path.basename(project)}`,
    backgroundColor: '#15171f',
    autoHideMenuBar: true,
    webPreferences: { preload: path.join(__dirname, 'preload.cjs'), contextIsolation: true, sandbox: true },
  });
  const id = win.webContents.id;
  const entry = { win, project, watcher: null, live: null, liveTimer: null };
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
  // 끊겨 있으면 3초마다 다시 붙어 본다 (지켜보기를 놓쳐도)
  entry.liveTimer = setInterval(() => {
    if (!entry.live) liveConnect(entry);
  }, 3000);
  liveConnect(entry);
  win.on('closed', () => {
    entry.watcher?.close();
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
ipcMain.handle('pygaki:write', (e, rel, data) => {
  const full = inside(projectOf(e), rel);
  fs.mkdirSync(path.dirname(full), { recursive: true });
  const tmp = full + '.pykaki-tmp';
  fs.writeFileSync(tmp, typeof data === 'string' ? data : Buffer.from(data));
  fs.renameSync(tmp, full);
  return true;
});

ipcMain.handle('pygaki:liveSend', (e, msg) => {
  const l = windows.get(e.sender.id)?.live;
  if (!l || !l.ready) return false;
  l.sock.write(JSON.stringify(msg) + '\n');
  return true;
});

ipcMain.handle('pygaki:liveStatus', (e) => {
  const l = windows.get(e.sender.id)?.live;
  return { on: !!(l && l.ready), showpy: l?.info?.showpy ?? null };
});

ipcMain.handle('pygaki:openFolder', (e, rel) => shell.openPath(inside(projectOf(e), rel)));

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
