// 웹 화면에 파일 기능을 건넨다 (window.pygaki). 경로는 프로젝트 폴더 기준, '/'로 나눈다.
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('pygaki', {
  info: () => ipcRenderer.invoke('pygaki:info'),
  list: (rel) => ipcRenderer.invoke('pygaki:list', rel),
  stat: (rel) => ipcRenderer.invoke('pygaki:stat', rel),
  read: (rel) => ipcRenderer.invoke('pygaki:read', rel),
  write: (rel, data) => ipcRenderer.invoke('pygaki:write', rel, data),
  remove: (rel) => ipcRenderer.invoke('pygaki:remove', rel), // 효과 파일(game/ui_kit/effects/*.glsl)만
  openFolder: (rel) => ipcRenderer.invoke('pygaki:openFolder', rel),
  choose: () => ipcRenderer.invoke('pygaki:choose'),
  runGame: (always) => ipcRenderer.invoke('pygaki:runGame', !!always), // 렌파이에서 실행
  pickFile: (kind) => ipcRenderer.invoke('pygaki:pickFile', kind), // 탐색기로 그림·영상('image') 또는 소리('sound') 고르기
  importFile: (token, dir) => ipcRenderer.invoke('pygaki:importFile', token, dir), // 밖에서 고른 파일을 game/<dir>로 복사

  // showpy 실시간 연결 (docs/LINK.md 9장)
  liveSend: (msg) => ipcRenderer.invoke('pygaki:liveSend', msg),
  liveStatus: () => ipcRenderer.invoke('pygaki:liveStatus'),
  onLive: (fn) => {
    const h = (_e, msg) => fn(msg);
    ipcRenderer.on('pygaki:live', h);
    return () => ipcRenderer.removeListener('pygaki:live', h);
  },
  onLiveStatus: (fn) => {
    const h = (_e, st) => fn(st);
    ipcRenderer.on('pygaki:liveStatus', h);
    return () => ipcRenderer.removeListener('pygaki:liveStatus', h);
  },
  onChange: (fn) => {
    const h = (_e, rel) => fn(rel);
    ipcRenderer.on('pygaki:changed', h);
    return () => ipcRenderer.removeListener('pygaki:changed', h);
  },
});
