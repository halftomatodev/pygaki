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
  // 줄 끝 표시를 읽는 플러그인(ui_kit 4.5)인 것처럼: 이 이름이 있으면 표시를 줄 끝에 붙여 내보낸다 (LINK.md 2장)
  fs.mkdirSync(path.join(proj, 'game', 'ui_kit', 'engine'), { recursive: true });
  fs.writeFileSync(path.join(proj, 'game', 'ui_kit', 'engine', 'script_edit.rpy'), 'init -19 python in script_edit:\n    PK_END_MARKS = True\n');

  process.env.RENPY_SDK = ''; // 시험하다가 이 컴퓨터의 렌파이로 진짜 게임을 켜지 않게
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
  // 왼쪽 칸 카드는 켤 때마다 접혀서 시작한다 → [모두 펼치기]
  await page.waitForSelector('.sidebar .fold-all button', { timeout: 20000 });
  if ((await page.locator('.sidebar .sec.folded').count()) !== (await page.locator('.sidebar .sec.card').count())) fail('왼쪽 칸 카드가 접혀서 시작하지 않음');
  await page.locator('.sidebar .fold-all button', { hasText: '모두 펼치기' }).click();
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
  {
    const code = fs.readFileSync(rpy, 'utf8');
    if (!/\S {2}# @l:\S+$/m.test(code) || !/^label \S+: {2}# @node:\S+/m.test(code)) fail('표시가 줄 끝에 안 붙음:\n' + code);
    if (/^\s*# @(l|node):/m.test(code)) fail('줄 끝 표시 원고에 윗줄 표시가 남음:\n' + code);
    console.log('줄 끝 표시: 됨');
  }

  const box = p.nodes[0].id;
  fs.writeFileSync(path.join(proj, 'game', 'showpy_inbox.json'), JSON.stringify({ format: 'showpy-inbox', version: 1, ops: [{ id: 'spsmoke1', op: 'insert', code: 'show ghost', box, end: box }] }));
  await until('showpy 기록을 받아 적지 않음', () => fs.readFileSync(flow, 'utf8').includes('spsmoke1'));
  console.log('받아 적기: 됨');

  // 쓴 판 표시 (SPEC 9-3)
  const stamped = JSON.parse(fs.readFileSync(flow, 'utf8'));
  if (stamped.app?.by !== 'pygaki 앱' || !(stamped.app.needs >= 1) || !stamped.app.build) fail('쓴 판 표시가 없음: ' + JSON.stringify(stamped.app));
  console.log('쓴 판:', JSON.stringify(stamped.app));
  if (dialogs.some((m) => m.includes('다른 곳'))) fail('앱이 쓴 파일을 밖에서 바뀐 것으로 봄');

  // 밖(예전 웹 판, 다른 프로그램)에서 대본 파일을 고치면 다시 읽을지 묻고, [확인]이면 다시 읽음
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

  // 효과 관리 (효과 탭 2단계, src/effectsLib.ts): 모음에서 넣기 → 틀린 파일 막기 → 끄기/켜기 → 쓰인 줄 세기 → 바꾸고 빼기
  const fx = (fn, ...args) => page.evaluate(([f, a]) => window.pykakiEffects[f](...a), [fn, args]);
  const cardOf = async (name) => (await fx('catalog')).find((c) => c.name === name);
  const fxDir = path.join(proj, 'game', 'ui_kit', 'effects');
  let c = await cardOf('maskup');
  if (!c || c.source !== 'library' || c.ready) fail('넣지 않은 샘플이 모음으로 안 보임: ' + JSON.stringify(c));
  if ((await cardOf('dissolve'))?.source !== 'renpy' || (await cardOf('shake'))?.source !== 'base') fail('기본 효과의 자리가 다름');
  let r = await fx('addFromLibrary', 'maskup.glsl');
  if (!r.ok || !fs.existsSync(path.join(fxDir, 'maskup.glsl'))) fail('모음에서 넣지 못함: ' + JSON.stringify(r));
  c = await cardOf('maskup');
  if (c.source !== 'project' || !c.ready || !c.on) fail('넣은 효과가 프로젝트 효과로 안 보임: ' + JSON.stringify(c));
  r = await fx('addFromLibrary', 'maskup.glsl');
  if (r.ok || !r.exists) fail('같은 파일을 묻지 않고 다시 넣음');
  for (const [file, text] of [['bad.glsl', '@effect Bad Name\n@fragment_300\n    gl_FragColor.a *= 1.0;\n'], ['dup.glsl', '@effect dissolve 겹침\n@fragment_300\n    gl_FragColor.a *= 1.0;\n'], ['empty.glsl', '// 아무것도 없음\n'], ['../up.glsl', '']]) {
    r = await fx('addFile', file, text);
    if (r.ok) fail('틀린 효과 파일을 넣음: ' + file);
  }
  if (fs.readdirSync(fxDir).join() !== 'maskup.glsl') fail('틀린 파일을 넣다가 효과 폴더가 바뀜: ' + fs.readdirSync(fxDir));
  console.log('효과 넣기와 검사: 됨 (' + r.why.slice(0, 30) + ')');

  const offFile = path.join(fxDir, 'effects_off.txt');
  r = await fx('setOn', 'maskup', false);
  if (!r.ok || !/^maskup$/m.test(fs.readFileSync(offFile, 'utf8')) || (await cardOf('maskup')).on) fail('효과를 끄지 못함');
  fs.appendFileSync(offFile, 'someday  # 나중에 넣을 것\n');
  r = await fx('setOn', 'maskup', true);
  const offText = fs.readFileSync(offFile, 'utf8');
  if (!r.ok || /^maskup$/m.test(offText) || !offText.includes('someday  # 나중에') || !(await cardOf('maskup')).on) fail('효과를 다시 켜지 못함: ' + offText);
  console.log('효과 끄기/켜기: 됨');

  // 대본에 그 효과를 쓴 줄을 넣고(밖에서 고친 것으로), 다른 효과로 바꾸고 뺀다
  const nd = dialogs.length;
  const used = JSON.parse(JSON.stringify(web));
  used.nodes[0].lines.push({ id: 'fxsmoke1', type: 'narration', text: '효과 시험', say: { effect: 'maskup:u__duration=8|shake' } });
  acceptNext = true;
  fs.writeFileSync(flow, JSON.stringify(used, null, 2));
  await until('효과를 쓴 대본을 다시 읽지 않음', () => dialogs.length > nd);
  await page.waitForFunction(() => window.pykakiEffects.uses('effect', 'maskup').length === 1, null, { timeout: 10000 });
  if ((await cardOf('maskup')).uses !== 1) fail('쓰인 줄 수가 다름');
  r = await fx('remove', 'maskup.glsl', { maskup: 'dissolve' });
  if (!r.ok || r.changed !== 1) fail('바꾸고 빼지 못함: ' + JSON.stringify(r));
  if (fs.existsSync(path.join(fxDir, 'maskup.glsl'))) fail('뺀 효과 파일이 남아 있음');
  if (!fs.existsSync(path.join(proj, r.backup))) fail('뺀 효과 파일의 백업이 없음: ' + r.backup);
  if ((await cardOf('maskup')).source !== 'library') fail('뺀 효과가 모음으로 돌아가지 않음');
  await until('대본에 예전 효과 이름이 남음', () => {
    const t = fs.readFileSync(flow, 'utf8');
    return t.includes('"dissolve|shake"') && !t.includes('maskup');
  });
  await until('내보낸 원고에 예전 효과 이름이 남음', () => {
    const t = fs.readFileSync(rpy, 'utf8');
    return t.includes('dissolve|shake') && !t.includes('maskup');
  });
  const kept = await page.evaluate(() => window.pygaki.remove('game/gui.rpy').then(() => 'removed', (e) => 'blocked: ' + e.message));
  if (kept === 'removed' || !fs.existsSync(path.join(proj, 'game', 'gui.rpy'))) fail('효과 파일이 아닌 것을 지울 수 있음');
  console.log('효과 바꾸고 빼기: 됨, 백업', r.backup);

  // [효과] 화면 (효과 탭 3단계, src/EffectsView.tsx): 눌러서 넣기 → 샘플 → 끄기/켜기 → 빼기 → 쓰인 곳 [보기]
  const fxCard = (n) => page.locator(`.fxv-card:has(.fxv-name:text-is("${n}"))`);
  await page.click('.view-switch button:has-text("효과")');
  await fxCard('maskup').locator('button:has-text("넣기")').click();
  await until('[넣기]를 눌러도 효과 파일이 안 생김', () => fs.existsSync(path.join(fxDir, 'maskup.glsl')));
  await fxCard('maskup').locator('button:has-text("빼기")').waitFor({ timeout: 10000 });
  await page.waitForSelector('.fxv-side h3:has-text("maskup")', { timeout: 10000 }); // 넣은 효과를 고른 채로
  await page.waitForSelector('.fxv-stage canvas', { timeout: 10000 });
  await wait(800); // 샘플이 한 번 도는 동안 셰이더 오류가 없는지
  if (await page.locator('.fxv-bad').count()) fail('효과 샘플을 못 그림: ' + (await page.locator('.fxv-bad').innerText()));
  await fxCard('maskup').locator('input[type=checkbox]').click();
  await until('체크를 꺼도 끈 효과 목록에 안 적힘', () => /^maskup$/m.test(fs.readFileSync(offFile, 'utf8')));
  await page.waitForSelector('.fxv-card.off:has(.fxv-name:text-is("maskup"))', { timeout: 10000 });
  await fxCard('maskup').locator('input[type=checkbox]').click();
  await until('체크를 켜도 끈 효과 목록에 남음', () => !/^maskup$/m.test(fs.readFileSync(offFile, 'utf8')));
  await fxCard('maskup').locator('button:has-text("빼기")').click();
  await page.click('.modal button.danger:has-text("빼기")');
  await until('[빼기]를 눌러도 효과 파일이 남음', () => !fs.existsSync(path.join(fxDir, 'maskup.glsl')));
  await fxCard('maskup').locator('button:has-text("넣기")').waitFor({ timeout: 10000 });
  // 그림 효과 샘플 (효과 탭 4단계, src/fx/TransitionCanvas.tsx): 두 샘플이 셰이더 오류 없이 한 번 도는지
  await page.click('.fxv-kind button:has-text("그림 효과")');
  for (const name of ['irisin', 'bands', 'slide', 'mosaic', 'blinds']) { // 뒤의 셋은 효과 모음(showpy/effects_library)
    await fxCard(name).click();
    await page.waitForSelector(`.fxv-side h3:has-text("${name}")`, { timeout: 10000 });
    await page.waitForSelector('.fxv-pic canvas', { timeout: 10000 });
    await wait(1300);
    if (await page.locator('.fxv-bad').count()) fail('그림 효과 샘플을 못 그림: ' + name + ' ' + (await page.locator('.fxv-bad').innerText()));
    if (!(await page.locator('.fxv-code').innerText()).includes(`img_fx.use("${name}")`)) fail('그림 효과의 적는 법이 다름: ' + name);
  }
  console.log('그림 효과 샘플: 됨');
  await page.click('.fxv-kind button:has-text("글자 효과")');
  await fxCard('dissolve').click();
  await page.click('.fxv-use button:has-text("보기")');
  await page.waitForSelector('.view-switch button.on:has-text("대본 편집")', { timeout: 10000 });
  if (await page.locator('.fxv').count()) fail('쓰인 곳 [보기]를 눌러도 대본 화면으로 안 감');
  console.log('[효과] 화면: 됨');

  // 태그 상자 [더 보기]: 자간, 루비, 띄우기를 눌러 글에 태그가 들어가는지 (끝나면 글을 되돌림)
  {
    const ta = page.locator('textarea[data-tags]').first();
    await ta.waitFor({ timeout: 10000 });
    const before = await ta.inputValue();
    const taIs = async (what, want) => {
      for (let i = 0; i < 50; i++) {
        if ((await ta.inputValue()) === want) return;
        await wait(200);
      }
      fail(what + ': ' + (await ta.inputValue()));
    };
    await ta.fill('가나다라');
    await ta.focus();
    await ta.evaluate((el) => el.setSelectionRange(0, 2));
    const bar = page.locator('.tagbar');
    await bar.waitFor({ timeout: 10000 });
    if (!(await bar.locator('.tb-range').count())) await bar.locator('.tb-more').click();
    await bar.locator('.tb-range').waitFor({ timeout: 10000 });
    await bar.locator('button:text-is("넓게")').click();
    await taIs('자간 태그', '{k=1}가나{/k}다라');
    await bar.locator('button:text-is("좁게")').click();
    await taIs('자간 태그 빼기', '가나다라');
    await bar.locator('button:text-is("루비")').click();
    await taIs('루비 태그', '{rb}가나{/rb}{rt}읽는 법{/rt}다라');
    await ta.fill('가나다라');
    await ta.evaluate((el) => el.setSelectionRange(2, 2));
    await bar.locator('button:text-is("가로 띄우기")').click();
    await taIs('띄우기 태그', '가나{space=30}다라');
    // 고른 글에만 효과 (태그 상자 3단계): {shader=} 태그가 들어가고, 그 줄을 셰이더 오류 없이 그리는지
    const glWarn = [];
    const onWarn = (m) => m.text().includes('WebGL 효과를 못 그려서') && glWarn.push(m.text());
    page.on('console', onWarn);
    await ta.fill('가나다라');
    await ta.evaluate((el) => el.setSelectionRange(0, 2));
    const fxSel = bar.locator('select[title^="고른 글에만"]');
    if (await fxSel.locator('option[value="echo"]').count()) fail('외곽선 겹을 쓰는 효과(echo)가 고른 글에만 효과 목록에 있음');
    await fxSel.selectOption('shake');
    await taIs('효과 태그', '{shader=shake}가나{/shader}다라');
    // 태그 효과의 [세부 값] 막대: 움직이면 태그 안에 값이 적히고, ↺로 지워지는지
    if (!(await bar.locator('.tb-knobs').count())) await bar.locator('.tb-knobs-btn').click();
    const knob = bar.locator('.tb-knobs input[type=range]').first();
    await knob.waitFor({ timeout: 10000 });
    await knob.focus();
    await knob.press('ArrowRight');
    for (let i = 0; ; i++) {
      if (/^\{shader=shake:u__\w+=-?[\d.]+\}가나\{\/shader\}다라$/.test(await ta.inputValue())) break;
      if (i > 50) fail('태그 효과 세부 값: ' + (await ta.inputValue()));
      await wait(200);
    }
    await bar.locator('.tb-knobs label.set .fx-x').first().click();
    await taIs('태그 효과 세부 값 되돌리기', '{shader=shake}가나{/shader}다라');
    await ta.fill('가{shader=shake}나{/shader}다{shader=wave}라마{/shader}');
    await page.locator('.preview canvas.fx-canvas').first().waitFor({ state: 'attached', timeout: 10000 });
    await wait(1200);
    if (glWarn.length) fail('글의 일부에만 건 효과를 못 그림: ' + glWarn[0]);
    if (!(await page.locator('.preview canvas.fx-canvas').count())) fail('글의 일부에만 건 효과의 미리보기가 사라짐');
    page.off('console', onWarn);
    await ta.fill(before);
    console.log('태그 상자 더 보기: 됨');
  }

  // 화면 셰이더 목록 (screen_fx 5.4, LINK.md 11장): 게임 폴더에 목록 파일이 없으면 앱에 든 목록,
  // 있으면 그 파일의 것. 끈 셰이더(shaders_off.txt)는 고르는 목록에서 빠지고, 지금 고른 것이면 남는지
  {
    const names = (keep) => page.evaluate((k) => window.pykakiShaders.names(k).map((x) => x[0]), keep ?? []);
    const first = await names();
    if (first[0] !== 'none' || !first.includes('ascii') || !first.includes('vhs_crt')) fail('앱에 든 셰이더 목록이 다름: ' + first);
    const sfx = path.join(proj, 'game', 'screen_fx');
    fs.mkdirSync(sfx, { recursive: true });
    const one = (id, label) => ({ id, label, name: label, order: 1, overlay_only: false, params: { strength: ['float', 1.0] }, groups: [] });
    fs.writeFileSync(path.join(sfx, 'shader_list.json'), JSON.stringify({ version: 1, screen_fx: '5.4', shaders: [one('mono', '흑백'), one('sepia', '세피아')] }));
    fs.writeFileSync(path.join(sfx, 'shaders_off.txt'), '# 끈 셰이더\nsepia  # 설명\n');
    await page.locator('.tb-right button', { hasText: '다시 읽기' }).click();
    await page.waitForFunction(() => window.pykakiShaders.names().map((x) => x[0]).join() === 'none,mono', null, { timeout: 10000 });
    if ((await names(['sepia', 'gone'])).join() !== 'none,mono,sepia,gone') fail('끈 셰이더와 없는 셰이더를 지금 고른 것으로 남기지 않음: ' + (await names(['sepia', 'gone'])));
    // 켜기/끄기 (shaderLib.ts): shaders_off.txt에 적고, 적혀 있던 다른 줄은 그대로 두는지
    const off = await page.evaluate(() => window.pykakiShaders.setOn('mono', false));
    if (!off.ok) fail('셰이더를 끄지 못함: ' + off.why);
    const offText = fs.readFileSync(path.join(sfx, 'shaders_off.txt'), 'utf8');
    if (!/^mono$/m.test(offText) || !/^sepia  # 설명$/m.test(offText) || !/^# 끈 셰이더$/m.test(offText)) fail('끈 셰이더 파일이 다름: ' + offText);
    if ((await names()).join() !== 'none') fail('끈 셰이더가 고르는 목록에 남음: ' + (await names()));
    const on = await page.evaluate(() => window.pykakiShaders.setOn('mono', true));
    if (!on.ok || /^mono$/m.test(fs.readFileSync(path.join(sfx, 'shaders_off.txt'), 'utf8'))) fail('셰이더를 다시 켜지 못함');
    // [효과] 화면의 [셰이더] 칸: 카드 둘, 끈 것은 끔 표시
    await page.locator('.toolbar .view-switch button', { hasText: '셰이더' }).click();
    await page.waitForSelector('.fxv-card:has-text("흑백")', { timeout: 10000 });
    if ((await page.locator('.fxv-card').count()) !== 2) fail('셰이더 카드 수가 다름');
    if (!(await page.locator('.fxv-card.off:has-text("세피아")').count())) fail('끈 셰이더 카드에 끔 표시가 없음');
    await page.locator('.fxv-card:has-text("세피아") input').click();
    await page.waitForFunction(() => window.pykakiShaders.names().map((x) => x[0]).join() === 'none,mono,sepia', null, { timeout: 10000 });
    await page.locator('.toolbar .view-switch button', { hasText: '대본 편집' }).click();
    console.log('셰이더 켜기/끄기와 [셰이더] 칸: 됨');
    fs.rmSync(sfx, { recursive: true, force: true });
    await page.locator('.tb-right button', { hasText: '다시 읽기' }).click();
    await page.waitForFunction(() => window.pykakiShaders.names().includes !== undefined && window.pykakiShaders.names().some((x) => x[0] === 'ascii'), null, { timeout: 10000 });
    console.log('셰이더 목록 읽기: 됨');
    // 셰이더 샘플 (fx/ScreenFxCanvas.tsx): 앱에 든 목록의 코드로 오류 없이 그리고, 파이썬이 그림을 넣는 ASCII는 안내만
    await page.locator('.toolbar .view-switch button', { hasText: '셰이더' }).click();
    for (const id of ['boil', 'vhs_crt', 'gameboy', 'retro_term', 'ripple']) {
      await page.locator('.fxv-card', { has: page.locator('.fxv-name', { hasText: new RegExp('^' + id + '$') }) }).click();
      await page.waitForSelector('.fxv-pic canvas', { timeout: 10000 });
      await wait(600); // 몇 장 그리는 동안 셰이더 오류가 없는지
      const bad = await page.locator('.fxv-pic .fxv-bad').count();
      if (bad) fail(`셰이더 샘플을 못 그림 (${id}): ` + (await page.locator('.fxv-pic .fxv-bad').innerText()));
      if (!(await page.locator('.sfx-group input').count())) fail('셰이더 세부 값 막대가 없음: ' + id);
    }
    await page.locator('.fxv-card', { has: page.locator('.fxv-name', { hasText: /^ascii$/ }) }).click();
    await page.waitForSelector('.fxv-pic .fxv-bad:has-text("글자 그림")', { timeout: 10000 });
    // 전환 칸: TV 샘플과 막대
    await page.locator('.fxv-kind button', { hasText: '전환' }).click();
    await page.waitForSelector('.tv-sample img', { timeout: 10000 });
    if ((await page.locator('.fxv-side .fx-knobs input[type=range]').count()) !== 7) fail('TV 전환 막대 수가 다름');
    await page.locator('.toolbar .view-switch button', { hasText: '대본 편집' }).click();
    console.log('셰이더 샘플: 됨');
  }

  // 위쪽 줄: 제목 칸과 [렌파이에서 실행] 단추가 있고, 상자·정렬 단추는 왼쪽 칸에 있는지
  if (!(await page.locator('.toolbar .ptitle').count())) fail('위쪽 줄에 프로젝트 제목 칸이 없음');
  if (!(await page.locator('.toolbar .run').count())) fail('위쪽 줄에 [렌파이에서 실행] 단추가 없음');
  if (!(await page.locator('.sidebar .sec-btns button', { hasText: '+ 상자' }).count())) fail('왼쪽 칸에 [+ 상자] 단추가 없음');
  // 렌파이를 못 찾는 자리(시험)에서는 켜지 않고 그렇다고 알림
  const run1 = await page.evaluate(() => window.pygaki.runGame(false));
  if (run1 !== 'no-sdk') fail('렌파이가 없는데 [렌파이에서 실행]의 답이 다름: ' + run1);
  console.log('렌파이에서 실행 (렌파이 없음):', run1);

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
      body: { k: 'v', c: [{ k: 't', t: '시험 패널' }, { k: 'h', c: [{ k: 't', t: '효과:' }, { k: 'b', id: 'p.1', t: 'ASCII', on: false, ok: true }] }, { k: 'bar', id: 'p.2', r: 1, v: 0.5, s: 0.01 }, { k: 'in', id: 'p.3', t: 'long text', w: 1 }] },
    },
  };
  const srv = net.createServer((c) => {
    (srv._conns ??= []).push(c);
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
  // 게임이 켜져 있으면(붙어 있으면) [렌파이에서 실행]은 다시 켜지 않음
  const run2 = await page.evaluate(() => window.pygaki.runGame(false));
  if (run2 !== 'running') fail('게임이 켜져 있는데 [렌파이에서 실행]의 답이 다름: ' + run2);
  console.log('렌파이에서 실행 (이미 켜짐):', run2);
  await page.click('.view-switch button:nth-child(2)');
  await page.waitForSelector('.live-badge.on', { timeout: 10000 });
  await page.waitForSelector('.sp-script .cur', { timeout: 10000 });
  await page.click('.sp-nav-item >> text=/^셰이더/');
  await until('편집기 명령을 보내지 않음', () => got.some((m) => m.cmd === 'editor' && m.tab === 'screen_fx'));
  // 게임 안 패널을 통째로 그린 칸 (ui_kit 3.16): 버튼을 누르면 그 자리 번호를 보내는지
  await page.waitForSelector('.sp-mirror .sp-m-b', { timeout: 10000 });
  await page.locator('.sp-mirror .sp-m-b', { hasText: 'ASCII' }).click();
  await until('패널 버튼 명령을 보내지 않음', () => got.some((m) => m.cmd === 'panel.do' && m.id === 'p.1' && m.t === 'ASCII'));
  // 넓은 글 칸 (ui_kit 3.23): 세 줄 칸으로 그리는지
  const rows = await page.locator('.sp-mirror textarea.sp-m-in.wide').getAttribute('rows', { timeout: 10000 });
  if (rows !== '3') fail('넓은 글 칸이 세 줄 칸이 아님: ' + rows);
  console.log('패널 통째로: 됨');
  // 셰이더를 거는 자리는 [대본 편집]의 상자·label로 옮김: 앱에서는 줄기표를 펴지 않음 (게임이 flow를 보내도)
  const sendState = (extra) => {
    Object.assign(state, extra);
    for (const c of srv._conns ?? []) c.write(JSON.stringify(state) + '\n');
  };
  sendState({ flow: { open: true, file: 'game/script_flow.rpy', range: null, sel: 3, here: 3, points: [], rows: [] } });
  await wait(800);
  if (await page.locator('.sp-main button', { hasText: '줄기표' }).count()) fail('앱에 줄기표 버튼이 남아 있음');
  if (await page.locator('.sp-flow-split').count()) fail('앱에 줄기표가 펴짐');
  console.log('줄기표 감춤: 됨');
  // 게임 창의 GUI 편집기 보이기/숨기기 (ui_kit 3.23): 버튼과 F9가 panel 명령을 보내고, 게임 쪽 알림을 기억하는지
  const nPanel = () => got.filter((m) => m.cmd === 'panel' && m.hide === false).length;
  const p0 = nPanel();
  await page.locator('.sp-bar button', { hasText: '게임 창의 GUI 편집기' }).click();
  await until('보이기 버튼이 panel 명령을 보내지 않음', () => nPanel() > p0);
  if ((await page.evaluate(() => localStorage.getItem('pygaki-game-panel'))) !== 'show') fail('보이기를 기억하지 않음');
  await page.keyboard.press('F9');
  await until('F9가 숨기기 명령을 보내지 않음', () => got.some((m, i) => m.cmd === 'panel' && m.hide === true && i > 0));
  await page.waitForFunction(() => localStorage.getItem('pygaki-game-panel') === 'hide', null, { timeout: 5000 });
  for (const c of srv._conns ?? []) c.write(JSON.stringify({ type: 'panel', hide: false }) + '\n');
  if (srv._conns?.length) await page.waitForFunction(() => localStorage.getItem('pygaki-game-panel') === 'show', null, { timeout: 5000 });
  await page.evaluate(() => localStorage.setItem('pygaki-game-panel', 'hide'));
  console.log('게임 창 편집기 토글: 됨');
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
  // 상자 카드 [렌파이에서 여기로 이동]: 원고의 그 상자 첫 줄로 goto (PyKaki 안 플레이는 없앰)
  await page.click('.view-switch button:nth-child(1)');
  await page.locator('.react-flow__node-box').first().click();
  const goBtn = page.locator('.insp button.go-here', { hasText: '렌파이에서 여기로 이동' });
  await goBtn.waitFor({ timeout: 10000 });
  if (await goBtn.isDisabled()) fail('게임과 이어졌는데 [렌파이에서 여기로 이동]을 못 누름');
  await goBtn.click();
  await until('[렌파이에서 여기로 이동]이 goto를 보내지 않음', () => got.some((m) => m.cmd === 'goto' && m.where === 'line' && m.file === 'game/script_flow.rpy' && m.line > 0));
  if (await page.locator('.tb-run button', { hasText: /^▶ 플레이/ }).count()) fail('PyKaki 안 [▶ 플레이]가 남아 있음');
  console.log('렌파이에서 여기로 이동: 됨');
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
  await page2.locator('.sidebar .fold-all button', { hasText: '모두 펼치기' }).click();
  if (!(await page2.locator('.link-panel').innerText()).includes('b.flow.json')) fail('왼쪽 칸에 고른 대본 파일 이름이 없음');
  await app2.close();
  console.log('대본 파일 고르기: 됨');
  console.log('모두 통과');
})().catch((e) => fail(e.stack || e.message));
