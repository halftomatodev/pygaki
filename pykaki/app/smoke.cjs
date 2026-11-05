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
  // 확인 창: 기본은 [취소]. acceptNext를 켜면 다음 하나만 [확인]
  const dialogs = [];
  let acceptNext = false;
  page.on('dialog', (d) => {
    dialogs.push(d.message());
    if (acceptNext) {
      acceptNext = false;
      void d.accept();
    } else void d.dismiss();
  });
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

  // 쓴 판 표시 (SPEC 9-3)
  const stamped = JSON.parse(fs.readFileSync(flow, 'utf8'));
  if (stamped.app?.by !== 'pygaki 앱' || !(stamped.app.needs >= 1) || !stamped.app.build) fail('쓴 판 표시가 없음: ' + JSON.stringify(stamped.app));
  console.log('쓴 판:', JSON.stringify(stamped.app));
  if (dialogs.some((m) => m.includes('다른 곳'))) fail('앱이 쓴 파일을 밖에서 바뀐 것으로 봄');

  // 밖(웹 PyKaki)에서 대본 파일을 고치면 다시 읽을지 묻고, [확인]이면 다시 읽음
  await wait(1500);
  const web = { ...stamped, project: { ...stamped.project, title: '웹에서 고친 제목' }, app: { by: 'PyKaki 웹', build: 'smoke', needs: 1 } };
  acceptNext = true;
  fs.writeFileSync(flow, JSON.stringify(web, null, 2));
  await until('밖에서 바뀐 대본을 다시 읽지 않음', () => dialogs.some((m) => m.includes('다른 곳')));
  await page.waitForFunction(() => document.querySelector('.ptitle')?.value === '웹에서 고친 제목', null, { timeout: 10000 });
  console.log('밖에서 바뀐 대본 다시 읽기: 됨');

  // 더 새 판에서 쓴 대본이면 경고
  const n0 = dialogs.length;
  acceptNext = true;
  fs.writeFileSync(flow, JSON.stringify({ ...web, app: { by: 'PyKaki 웹', build: 'future', needs: 99 } }, null, 2));
  await until('더 새 판 대본을 다시 읽지 않음', () => dialogs.length > n0);
  await page.waitForSelector('.link-panel .warn-text:has-text("더 새 판")', { timeout: 10000 });
  console.log('더 새 판 경고: 됨');

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
    custom_ui: {
      ok: true, why: '', cps: 30, fps: 24, max_frames: 12, playing: false, edited: [], reload_keys: ['cursor', 'ctc'],
      values: { text_cps: null, typing_sound: null, typing_volume: 1, ctc: false, ctc_frames: ['gui/ctc/ctc1.png'], ctc_hold: 2,
                cursor: false, cursor_frames: [], cursor_hold: 2, cursor_mode: 'software', cursor_hotspot: [0, 0], quick_menu: true },
    },
    // 게임 안 패널을 통째로 (ui_kit 3.16)
    panel: {
      tab: 'screen_fx', popup: null, popup_kind: null,
      body: { k: 'v', c: [{ k: 't', t: '시험 패널' }, { k: 'h', c: [{ k: 't', t: '효과:' }, { k: 'b', id: 'p.1', t: 'ASCII', on: false, ok: true }] }, { k: 'bar', id: 'p.2', r: 1, v: 0.5, s: 0.01 }] },
    },
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
    c.write(JSON.stringify({ type: 'files', audio: ['audio/type.ogg'], images: ['gui/ctc/ctc1.png', 'gui/ctc/ctc2.png'] }) + '\n');
  });
  await new Promise((r) => srv.listen(0, '127.0.0.1', r));
  fs.writeFileSync(path.join(proj, 'game', 'showpy_live.json'), JSON.stringify({ version: 1, port: srv.address().port, token: 'smoketoken', showpy: '3.14' }));
  await until('게임에 붙지 않음 (hello 없음)', () => got.some((m) => m.hello === 'smoketoken'));
  await page.click('.view-switch button:nth-child(2)');
  await page.waitForSelector('.sp-conn.on', { timeout: 10000 });
  await page.waitForSelector('.sp-script .cur', { timeout: 10000 });
  await page.click('.sp-nav-item:has-text("인게임 화면 셰이더")');
  await until('편집기 명령을 보내지 않음', () => got.some((m) => m.cmd === 'editor' && m.tab === 'screen_fx'));
  // 게임 안 패널을 통째로 그린 칸 (ui_kit 3.16): 버튼을 누르면 그 자리 번호를 보내는지
  await page.waitForSelector('.sp-mirror .sp-m-b', { timeout: 10000 });
  await page.locator('.sp-mirror .sp-m-b', { hasText: 'ASCII' }).click();
  await until('패널 버튼 명령을 보내지 않음', () => got.some((m) => m.cmd === 'panel.do' && m.id === 'p.1' && m.t === 'ASCII'));
  console.log('패널 통째로: 됨');
  // 커서, 클릭 대기, 대사 소리 칸 (ui_kit 3.15): 앱 칸이 나오고 값을 보내는지
  await page.click('.sp-nav-item:has-text("커서, 클릭 대기")');
  await page.waitForSelector('.sp-cu select', { timeout: 10000 });
  await page.selectOption('.sp-cu select', 'audio/type.ogg');
  await until('대사 소리 값을 보내지 않음', () => got.some((m) => m.cmd === 'custom_ui.set' && m.key === 'typing_sound' && m.value === 'audio/type.ogg'));
  await page.locator('.sp-cu .sp-slot').first().click();
  await page.waitForSelector('.sp-picker .sp-pick-grid button', { timeout: 10000 });
  await page.locator('.sp-picker .sp-pick-grid button').nth(1).click();
  await until('그림 칸 값을 보내지 않음', () => got.some((m) => m.cmd === 'custom_ui.set' && m.key === 'ctc_frames' && m.value?.[0] === 'gui/ctc/ctc2.png'));
  console.log('커서/대사 소리 칸: 됨');
  console.log('showpy 연결: 됨, 받은 명령', got.length);
  srv.close();

  if (errors.length) fail('화면 오류: ' + errors.join(' / '));
  await app.close();

  // 대본 파일이 여러 개면 고르게 하고, 고른 파일을 연다
  const proj2 = fs.mkdtempSync(path.join(os.tmpdir(), 'pykaki-smoke2-'));
  fs.mkdirSync(path.join(proj2, 'game'), { recursive: true });
  fs.writeFileSync(path.join(proj2, 'game', 'gui.rpy'), 'init python:\n    gui.init(1280, 720)\n');
  for (const [f, title] of [['a.flow.json', '대본 가'], ['b.flow.json', '대본 나']])
    fs.writeFileSync(path.join(proj2, f), JSON.stringify({ ...stamped, project: { ...stamped.project, title } }, null, 2));
  const app2 = await electron.launch({ args: ['--no-sandbox', __dirname, '--project', proj2] });
  const page2 = await app2.firstWindow();
  await page2.waitForSelector('.flow-pick button', { timeout: 20000 });
  if ((await page2.locator('.flow-pick button').count()) !== 2) fail('대본 고르기 칸 수가 다름');
  await page2.locator('.flow-pick button', { hasText: 'b.flow.json' }).click();
  await page2.waitForFunction(() => document.querySelector('.ptitle')?.value === '대본 나', null, { timeout: 20000 });
  if (!(await page2.locator('.link-panel').innerText()).includes('b.flow.json')) fail('왼쪽 칸에 고른 대본 파일 이름이 없음');
  await app2.close();
  console.log('대본 파일 고르기: 됨');
  console.log('모두 통과');
})().catch((e) => fail(e.stack || e.message));
