// PyKaki 데스크톱 앱 확인 (GitHub Actions에서 xvfb로 돌림). 진짜 Electron으로 앱을 켜서
// 대본 자동 저장, 내보내기, showpy 받아 적기, 프로젝트 밖 쓰기 막기를 본다.
//   npx playwright@1.48.2 이 있어야 함:  node smoke.cjs
const { _electron: electron } = require('playwright');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const fail = (msg) => {
  console.error('실패: ' + msg);
  process.exit(1);
};
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
async function until(what, fn, ms = 10000) {
  const end = Date.now() + ms;
  while (Date.now() < end) {
    if (fn()) return;
    await wait(200);
  }
  fail(what);
}

(async () => {
  const proj = fs.mkdtempSync(path.join(os.tmpdir(), 'pykaki-smoke-'));
  const name = path.basename(proj);
  fs.mkdirSync(path.join(proj, 'game', 'ui_kit'), { recursive: true });
  fs.writeFileSync(path.join(proj, 'game', 'gui.rpy'), 'init python:\n    gui.init(1280, 720)\n');
  fs.writeFileSync(path.join(proj, 'game', 'options.rpy'), '');

  const app = await electron.launch({ args: ['--no-sandbox', __dirname, '--project', proj] });
  const page = await app.firstWindow();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.waitForSelector('.link-panel', { timeout: 20000 });
  const panel = await page.locator('.link-panel').innerText();
  if (!panel.includes(name)) fail('왼쪽 칸에 프로젝트 이름이 없음: ' + panel);
  console.log('켜짐:', panel.split('\n')[0]);

  const flow = path.join(proj, name + '.flow.json');
  await until('대본 파일이 자동 저장되지 않음', () => fs.existsSync(flow));
  const p = JSON.parse(fs.readFileSync(flow, 'utf8'));
  if (p.format !== 'renpy-flow') fail('대본 형식이 다름');
  if (!p.settings.renpyLink) fail('showpy가 있는 프로젝트인데 연결 설정이 꺼짐');
  console.log('자동 저장:', path.basename(flow));

  await page.keyboard.press('Control+e');
  const rpy = path.join(proj, 'game', 'script_flow.rpy');
  await until('내보내기 파일이 없음', () => fs.existsSync(rpy));
  console.log('내보내기:', fs.readFileSync(rpy, 'utf8').split('\n')[0]);

  const box = p.nodes[0].id;
  fs.writeFileSync(path.join(proj, 'game', 'showpy_inbox.json'), JSON.stringify({ format: 'showpy-inbox', version: 1, ops: [{ id: 'spsmoke1', op: 'insert', code: 'show ghost', box, end: box }] }));
  await until('showpy 기록을 받아 적지 않음', () => fs.readFileSync(flow, 'utf8').includes('spsmoke1'));
  console.log('받아 적기: 됨');

  const outside = await page.evaluate(() => window.pygaki.write('../pykaki-smoke-outside.txt', 'x').then(() => 'written', (e) => 'blocked: ' + e.message));
  if (outside === 'written' || fs.existsSync(path.join(path.dirname(proj), 'pykaki-smoke-outside.txt'))) fail('프로젝트 밖에 쓸 수 있음');
  console.log('밖에 쓰기:', outside.slice(0, 40));

  // showpy 실시간 연결 (docs/LINK.md 9장): 가짜 게임을 띄워 앱이 붙고, 상태를 보여주고, 명령을 보내는지
  const net = require('node:net');
  const got = [];
  const state = {
    type: 'state',
    where: { file: 'game/script_flow.rpy', line: 3, screens: ['say'], main_menu: false, menu: false },
    editor: { open: false, tab: null, hide_panel: true, message: '', pending: 0, tabs: [{ id: 'screen_fx', label: '화면 효과', ok: true, why: '' }], info: [] },
    title: null,
  };
  const srv = net.createServer((c) => {
    c.setEncoding('utf8');
    let buf = '';
    c.on('data', (d) => {
      buf += d;
      let i;
      while ((i = buf.indexOf('\n')) >= 0) {
        got.push(JSON.parse(buf.slice(0, i)));
        buf = buf.slice(i + 1);
      }
    });
    c.write(JSON.stringify(state) + '\n');
  });
  await new Promise((r) => srv.listen(0, '127.0.0.1', r));
  fs.writeFileSync(path.join(proj, 'game', 'showpy_live.json'), JSON.stringify({ version: 1, port: srv.address().port, token: 'smoketoken', showpy: '3.14' }));
  await until('게임에 붙지 않음 (hello 없음)', () => got.some((m) => m.hello === 'smoketoken'));
  await page.click('.view-switch button:nth-child(2)');
  await page.waitForSelector('.sp-conn.on', { timeout: 10000 });
  await page.waitForSelector('.sp-script .cur', { timeout: 10000 });
  await page.click('.sp-nav-item:has-text("인게임 화면 셰이더")');
  await until('편집기 명령을 보내지 않음', () => got.some((m) => m.cmd === 'editor' && m.tab === 'screen_fx'));
  console.log('showpy 연결: 됨, 받은 명령', got.length);
  srv.close();

  if (errors.length) fail('화면 오류: ' + errors.join(' / '));
  await app.close();
  console.log('모두 통과');
})().catch((e) => fail(e.stack || e.message));
