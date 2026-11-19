// 플래그 용례 견본 영상 만들기 (플래그 꼴 3단계).
// 빌드한 대본 편집기(dist/index.html)를 열어 플래그 카드 [+ 추가] 메뉴에서 용례마다 설명 카드의 움직이는 견본을 녹화하고,
// 견본 부분만 잘라 src/flagclips/<용례>.webm으로 만든다. 안내서 "플래그 용례"의 카드가 이 영상을 쓴다(build_guide.py).
//
//   npm run build && node tools/record_flag_demos.cjs            # 모두
//   node tools/record_flag_demos.cjs affection route              # 몇 개만
//
// 필요한 것: playwright(app 폴더의 개발 의존성, 브라우저는 설치된 Chrome·Edge나 playwright chromium), ffmpeg(libvpx-vp9)
const { chromium } = require(require.resolve('playwright', { paths: [__dirname, require('node:path').join(__dirname, '..', 'app')] }));
const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');
const DIST = path.join(ROOT, 'dist', 'index.html');
const OUT = path.join(ROOT, 'src', 'flagclips');
// 용례 id → 메뉴 줄 이름, 걸음 수 (flagRecipes.ts의 demo 길이. 걸음마다 1.5초)
const RECIPES = { affection: ['호감도', 5], met_once: ['한 번 본 장면', 3], item: ['물건 얻기·쓰기', 3], locked_choice: ['잠긴 선택지', 4], route: ['갈래 정하기', 3], player_name: ['주인공 이름', 3], ending: ['여러 끝', 4] };
const STEP = 1.5;
const slash = (p) => p.split(path.sep).join('/');

async function launch() {
  for (const o of [{ channel: 'chrome' }, { channel: 'msedge' }, {}]) {
    try {
      return await chromium.launch(o);
    } catch {}
  }
  throw new Error('브라우저를 못 켰어요 (Chrome이나 Edge를 설치하거나 npx playwright install chromium)');
}

(async () => {
  if (!fs.existsSync(DIST)) throw new Error('먼저 npm run build');
  const pick = process.argv.slice(2);
  const ids = Object.keys(RECIPES).filter((k) => !pick.length || pick.includes(k));
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'pk_flagdemo_'));
  const browser = await launch();
  const vw = 1280, vh = 860;
  // 영상 녹화(recordVideo)는 playwright 전용 ffmpeg가 있어야 해서, 크롬 screencast 프레임을 찍은 때로 이어 붙인다
  // screencast는 기기 배율(deviceScaleFactor)을 따르지 않고 CSS 픽셀로 옴 → 1배로 그대로 씀
  const ctx = await browser.newContext({ viewport: { width: vw, height: vh }, deviceScaleFactor: 1, reducedMotion: 'no-preference' });
  for (const id of ids) {
    const [title, steps] = RECIPES[id];
    const page = await ctx.newPage();
    await page.goto('file:///' + slash(DIST));
    await page.getByRole('button', { name: '+ 추가' }).first().click();
    await page.locator('.fmenu-item', { hasText: title }).first().hover();
    const demo = page.locator('.fdemo');
    await demo.waitFor();
    const dir = fs.mkdtempSync(path.join(tmp, id + '_'));
    // 크롬 화면 흘려 찍기(screencast): 화면이 바뀔 때마다 한 장(초당 수십 장). 견본 칸 자리로 잘라 씀
    const box = await demo.boundingBox();
    const cdp = await ctx.newCDPSession(page);
    const shots = [];
    let t0 = 0;
    const pending = [];
    cdp.on('Page.screencastFrame', (e) => {
      const t = e.metadata.timestamp * 1000;
      if (!t0) t0 = t;
      const f = path.join(dir, `f${String(shots.length).padStart(5, '0')}.jpg`);
      shots.push([f, t - t0]);
      pending.push(fs.promises.writeFile(f, Buffer.from(e.data, 'base64')));
      cdp.send('Page.screencastFrameAck', { sessionId: e.sessionId }).catch(() => {});
    });
    await cdp.send('Page.startScreencast', { format: 'jpeg', quality: 95, everyNthFrame: 1 });
    const end = Date.now() + steps * STEP * 1000 + 300;
    while (Date.now() < end) await page.waitForTimeout(50);
    await cdp.send('Page.stopScreencast');
    await Promise.all(pending);
    const keep = shots.filter(([, t]) => t <= steps * STEP * 1000);
    if (keep.length) shots.splice(0, shots.length, ...keep);
    // 프레임 크기로 배율을 셈 (screencast는 기기 픽셀로 옴)
    const fw = Number(execFileSync('ffprobe', ['-v', 'error', '-select_streams', 'v:0', '-show_entries', 'stream=width', '-of', 'csv=p=0', shots[0][0]]).toString().trim());
    const k = fw / vw;
    await page.close();
    // ffconcat: 프레임마다 다음 프레임까지의 시간
    const lines = ['ffconcat version 1.0'];
    shots.forEach(([f, t], i) => {
      const next = i + 1 < shots.length ? shots[i + 1][1] : steps * STEP * 1000;
      lines.push(`file '${slash(f)}'`, `duration ${((next - t) / 1000).toFixed(3)}`);
    });
    lines.push(`file '${slash(shots[shots.length - 1][0])}'`);
    const list = path.join(dir, 'list.txt');
    fs.writeFileSync(list, lines.join('\n'));
    const out = path.join(OUT, id + '.webm');
    const crop = `crop=${Math.round(box.width * k)}:${Math.round(box.height * k)}:${Math.round(box.x * k)}:${Math.round(box.y * k)}`;
    execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'concat', '-safe', '0', '-i', list, '-vf', crop + ',scale=trunc(iw/2)*2:-2,fps=30', '-c:v', 'libvpx-vp9', '-b:v', '0', '-crf', '34', '-an', out]);
    console.log(id.padEnd(15), shots.length, '장', (fs.statSync(out).size / 1024).toFixed(1), 'KB');
  }
  await ctx.close();
  await browser.close();
  fs.rmSync(tmp, { recursive: true, force: true });
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
