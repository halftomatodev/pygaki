// pygaki 데스크톱 앱 핵심 흐름 시험 (GitHub Actions에서 xvfb로 돌림). smoke.cjs가 기능을 하나씩 보는 것과 달리,
// 사람이 누르는 차례대로 처음부터 끝까지 이어 본다:
//   임시 렌파이 프로젝트 열기 → [+ 캐릭터]로 캐릭터 만들기 → 상자에 그 캐릭터 대사 두 줄 → .rpy 내보내기 → game/script_flow.rpy 확인
//   npx playwright@1.48.2 이 있어야 함:  node flow_test.cjs
//   렌파이 lint까지 보려면 FLOW_LINT_SDK=<렌파이 SDK 폴더> (없으면 건너뜀. 앱에는 SDK를 넘기지 않음)
const { _electron: electron } = require('playwright');
const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

let app = null;
const fail = async (msg) => {
  console.error('실패: ' + msg);
  await app?.close().catch(() => {});
  process.exit(1);
};
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
async function until(what, fn, ms = 10000) {
  const end = Date.now() + ms;
  while (Date.now() < end) {
    if (fn()) return;
    await wait(200);
  }
  await fail(what);
}

const NAME = '앨리스';
const ID = 'alice';
const LINES = ['안녕, 나는 앨리스야.', '오늘은 "따옴표"도 넣어 볼게.'];

(async () => {
  // 1. 임시 렌파이 프로젝트 (런처의 새 프로젝트처럼 game 폴더만 있는 것)
  const proj = fs.mkdtempSync(path.join(os.tmpdir(), 'pykaki-flow-'));
  fs.mkdirSync(path.join(proj, 'game'), { recursive: true });
  fs.writeFileSync(path.join(proj, 'game', 'gui.rpy'), 'init python:\n    gui.init(1280, 720)\n');
  fs.writeFileSync(path.join(proj, 'game', 'options.rpy'), '');

  process.env.RENPY_SDK = ''; // 시험하다가 이 컴퓨터의 렌파이로 진짜 게임을 켜지 않게
  // 화면 글로 단추를 찾으니 PC 언어(리눅스 CI는 영어)와 상관없이 한국어로 켬 (i18n.ts는 고른 적 없으면 PC 언어)
  app = await electron.launch({ args: ['--no-sandbox', '--lang=' + (process.env.ZZ_LANG || 'ko'), __dirname, '--project', proj] });
  const page = await app.firstWindow();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  const dialogs = [];
  page.on('dialog', (d) => (dialogs.push(d.message()), void d.dismiss()));

  await page.waitForSelector('.sidebar .fold-all button', { timeout: 20000 });
  await page.locator('.sidebar .fold-all button', { hasText: '모두 펼치기' }).click();
  await page.waitForSelector('[data-testid="scene-tree"]', { timeout: 20000 });
  const flow = path.join(proj, path.basename(proj) + '.flow.json');
  await until('대본 파일이 자동 저장되지 않음', () => fs.existsSync(flow));
  console.log('1. 프로젝트 열림');

  // 2. 캐릭터: [+ 캐릭터] → 표시 이름·변수 이름 → ✓
  await page.getByTestId('tree-add-char').click();
  const ed = page.locator('[data-testid^="tree-char-edit-"]');
  await ed.waitFor({ timeout: 5000 });
  await ed.getByLabel('표시 이름').fill(NAME);
  await ed.getByLabel('변수 이름').fill(ID);
  await ed.getByTestId('tree-edit-done').click();
  await ed.waitFor({ state: 'detached', timeout: 5000 });
  if (!(await page.getByTestId('scene-tree').innerText()).includes(NAME)) await fail('트리에 새 캐릭터가 안 보임');
  console.log('2. 캐릭터 만듦:', NAME, '(' + ID + ')');

  // 3. 첫 상자를 더블클릭해 고치기 → 대사 버블(Alt+←)에서 캐릭터 → 글 → Ctrl+Enter로 같은 화자 새 줄 → 글 → Esc
  const boxId = JSON.parse(fs.readFileSync(flow, 'utf8')).nodes[0].id;
  const box = page.locator(`.react-flow__node[data-id="${boxId}"]`);
  await box.waitFor({ timeout: 5000 });
  await box.locator('.box-lines').dblclick();
  const field = box.locator('textarea.pl-text');
  await field.first().waitFor({ timeout: 5000 });
  await page.waitForFunction(() => document.activeElement?.matches('textarea.pl-text'), null, { timeout: 5000 });
  await page.keyboard.press('Alt+ArrowLeft');
  const opt = page.locator('.lt-opt', { hasText: NAME });
  await opt.waitFor({ timeout: 5000 });
  await opt.click();
  await opt.waitFor({ state: 'detached', timeout: 5000 });
  await page.waitForFunction(() => document.activeElement?.matches('textarea.pl-text'), null, { timeout: 5000 });
  await page.keyboard.type(LINES[0]);
  await page.keyboard.press('Control+Enter');
  await page.waitForFunction(() => document.querySelectorAll('textarea.pl-text').length === 2 && document.activeElement === document.querySelectorAll('textarea.pl-text')[1], null, { timeout: 5000 }).catch(() => fail('Ctrl+Enter로 새 줄이 안 생기거나 새 줄로 안 옮겨감'));
  await page.keyboard.type(LINES[1]);
  await page.keyboard.press('Escape');
  await box.locator('textarea.pl-text').first().waitFor({ state: 'detached', timeout: 5000 });
  const shown = await box.locator('.box-lines').innerText();
  for (const t of LINES) if (!shown.includes(t)) await fail('상자에 대사가 안 보임: ' + t + '\n' + shown);
  console.log('3. 대사 두 줄 씀');

  // 자동 저장된 대본에도 같은 것이 있는지
  await until('대본 파일에 캐릭터·대사가 안 저장됨', () => {
    const p = JSON.parse(fs.readFileSync(flow, 'utf8'));
    const ls = p.nodes.find((n) => n.id === boxId)?.lines ?? [];
    return p.characters.some((c) => c.id === ID && c.name === NAME) && LINES.every((t) => ls.some((l) => l.type === 'say' && l.who === ID && l.text === t));
  });

  // 4. .rpy 내보내기 (Ctrl+E)
  const rpy = path.join(proj, 'game', 'script_flow.rpy');
  await page.keyboard.press('Control+e');
  await until('내보내기 파일이 없음', () => fs.existsSync(rpy));
  const code = fs.readFileSync(rpy, 'utf8');
  if (!new RegExp(`^define ${ID} = Character\\("${NAME}"`, 'm').test(code)) await fail('캐릭터 define 줄이 없음:\n' + code);
  // 시작 장면: label start이거나, 다른 이름이면 config.label_overrides["start"]로 그 장면을 가리킴
  const start = code.match(/config\.label_overrides\["start"\] = "(\w+)"/)?.[1] ?? 'start';
  if (!new RegExp(`^label ${start}:`, 'm').test(code)) await fail('시작 장면(' + start + ')이 없음:\n' + code);
  const said = [`${ID} "${LINES[0]}"`, `${ID} "${LINES[1].replace(/"/g, '\\"')}"`];
  let at = -1;
  for (const s of said) {
    const i = code.indexOf(s, at + 1);
    if (i < 0 || i < at) await fail('대사 줄이 없거나 차례가 다름: ' + s + '\n' + code);
    at = i;
  }
  console.log('4. 내보냄:', path.relative(proj, rpy));

  if (errors.length) await fail('페이지 오류: ' + errors.join(' | '));
  if (dialogs.length) await fail('뜻밖의 확인 창: ' + dialogs.join(' | '));
  await app.close();

  // 5. (골라서) 렌파이 lint
  const sdk = process.env.FLOW_LINT_SDK;
  if (sdk) {
    const win = process.platform === 'win32';
    const py = win ? path.join(sdk, 'lib', 'py3-windows-x86_64', 'python.exe') : path.join(sdk, 'lib', 'py3-linux-x86_64', 'python');
    const r = spawnSync(py, [path.join(sdk, 'renpy.py'), proj, 'lint'], { encoding: 'utf8', timeout: 180000 });
    const out = (r.stdout || '') + (r.stderr || '');
    // lint는 문제가 있어도 0으로 끝난다. 문제는 "game/파일.rpy:줄 ..." 꼴로 적으니 그 줄이 있으면 실패
    if (r.status !== 0 || !out.includes('lint report') || /^game\/\S+:\d+ /m.test(out)) await fail('렌파이 lint 실패 (' + r.status + '):\n' + out);
    console.log('5. 렌파이 lint: 통과');
  } else console.log('5. 렌파이 lint: 건너뜀 (FLOW_LINT_SDK 없음)');

  fs.rmSync(proj, { recursive: true, force: true });
  console.log('핵심 흐름 시험 통과');
})().catch((e) => fail(e.stack || String(e)));
