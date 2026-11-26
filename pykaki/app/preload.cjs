// 웹 화면에 파일 기능을 건넨다 (window.pygaki). 경로는 프로젝트 폴더 기준, '/'로 나눈다.
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('pygaki', {
  info: () => ipcRenderer.invoke('pygaki:info'),
  list: (rel) => ipcRenderer.invoke('pygaki:list', rel),
  stat: (rel) => ipcRenderer.invoke('pygaki:stat', rel),
  read: (rel) => ipcRenderer.invoke('pygaki:read', rel),
  write: (rel, data) => ipcRenderer.invoke('pygaki:write', rel, data),
  remove: (rel) => ipcRenderer.invoke('pygaki:remove', rel), // 효과 파일(game/ui_kit/effects/*.glsl)과 글꼴(game/fonts/)만
  openFolder: (rel, make) => ipcRenderer.invoke('pygaki:openFolder', rel, !!make), // make: 없는 game 안 폴더는 만들고 엶
  placeInfo: (id) => ipcRenderer.invoke('pygaki:placeInfo', id), // 프로젝트 밖 자리('appSettings', 'renpySaves')의 경로
  openPlace: (id) => ipcRenderer.invoke('pygaki:openPlace', id),
  choose: () => ipcRenderer.invoke('pygaki:choose'),
  runGame: (always) => ipcRenderer.invoke('pygaki:runGame', !!always), // 렌파이에서 실행
  pickFile: (kind) => ipcRenderer.invoke('pygaki:pickFile', kind), // 탐색기로 그림·영상('image'), 소리('sound'), 글꼴('font'), 아이콘('icon') 고르기
  importFile: (token, dir) => ipcRenderer.invoke('pygaki:importFile', token, dir), // 밖에서 고른 파일을 game/<dir>로 복사
  pickMaskSource: () => ipcRenderer.invoke('pygaki:pickMaskSource'), // 투명 영상으로 바꿀 원본 고르기 (여러 장 가능)
  readPicked: (token) => ipcRenderer.invoke('pygaki:readPicked', token), // 위에서 고른 파일 읽기
  snapToGame: () => ipcRenderer.invoke('pygaki:snapToGame'), // 앱 창을 게임 창 옆으로
  refocus: () => ipcRenderer.invoke('pygaki:refocus'), // 알림 창(alert, confirm)을 닫은 뒤 글 칸에 커서가 다시 들어가게

  // showpy 실시간 연결 (docs/LINK.md 9장)
  liveSend: (msg) => ipcRenderer.invoke('pygaki:liveSend', msg),
  liveStatus: () => ipcRenderer.invoke('pygaki:liveStatus'),
  openTab: () => ipcRenderer.invoke('pygaki:openTab'), // 앱을 켤 때 받은 --tab, --field ({ tab, field }, pygaki editor에서 켰을 때, 한 번)
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
