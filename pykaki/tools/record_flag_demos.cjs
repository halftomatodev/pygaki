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
const RECIPES = { affection: ['호감도', 5], met_once: ['한 번 본 장면', 3], item: ['물건 얻기·쓰기', 3], locked_choice: ['잠긴 선택지', 4], route: ['갈래 정하기', 3], ending: ['여러 끝', 4] };
const STEP = 1.5;
const SCALE = 2; // 또렷하게 두 배로 그림
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
  // 영상 녹화(recordVideo)는 playwright 전용 ffmpeg가 있어야 해서, 견본 부분을 연달아 찍고 찍은 때로 이어 붙인다
  const ctx = await browser.newContext({ viewport: { width: vw, height: vh }, deviceScaleFactor: SCALE, reducedMotion: 'no-preference' });
  for (const id of ids) {
    const [title, steps] = RECIPES[id];
    const page = await ctx.newPage();
    await page.goto('file:///' + slash(DIST));
    await page.getByRole('button', { name: '+ 추가' }).first().click();
    await page.locator('.fmenu-item', { hasText: title }).first().hover();
    const demo = page.locator('.fdemo');
    await demo.waitFor();
    const dir = fs.mkdtempSync(path.join(tmp, id + '_'));
    const t0 = Date.now();
    const shots = [];
    while (Date.now() - t0 < steps * STEP * 1000) {
      const f = path.join(dir, `f${String(shots.length).padStart(4, '0')}.png`);
      await demo.screenshot({ path: f, animations: 'allow' });
      shots.push([f, Date.now() - t0]);
    }
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
    execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'concat', '-safe', '0', '-i', list, '-vf', 'scale=trunc(iw/4)*2:-2,fps=15', '-c:v', 'libvpx-vp9', '-b:v', '0', '-crf', '34', '-an', out]);
    console.log(id.padEnd(15), shots.length, '장', (fs.statSync(out).size / 1024).toFixed(1), 'KB');
  }
  await ctx.close();
  await browser.close();
  fs.rmSync(tmp, { recursive: true, force: true });
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
