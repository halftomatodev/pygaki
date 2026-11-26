// 안내서 사용법 영상 만들기 (초보자용: 어디를 누르고 무엇이 바뀌는지).
// 빌드한 대본 편집기(dist/index.html)를 열어 장면(SCENES)마다 실제로 누르고 치는 모습을 녹화한다.
// 화면 위에 보이는 커서, 누를 때 물결, 누른 키 표시를 얹는다(진짜 마우스는 안 보여서).
// 결과: bundle/guide/clips/<이름>.webm(한국어 화면), clips/ja/, clips/en/(일·영 화면). 안내서 원본의 <!-- clip 이름 --> 줄이 씀(build_guide.py).
//
//   npm run build && node tools/record_guide_clips.cjs                 # 모든 장면, 세 언어
//   node tools/record_guide_clips.cjs char-add box-new --lang ko        # 몇 개만, 한 언어
//   node tools/record_guide_clips.cjs box-write --lang ko --shots 폴더   # 걸음마다 사진도 (확인용)
//
// 필요한 것: playwright(app 폴더의 개발 의존성, 브라우저는 설치된 Chrome·Edge나 playwright chromium), ffmpeg(libvpx-vp9)
const { chromium } = require(require.resolve('playwright', { paths: [__dirname, require('node:path').join(__dirname, '..', 'app')] }));
const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');
const DIST = path.join(ROOT, 'dist', 'index.html');
const CLIPS = path.join(ROOT, '..', 'bundle', 'guide', 'clips');
const DICT = require(path.join(ROOT, 'src', 'i18n', 'dict.json')).exact;
const VW = 1280, VH = 800;
const slash = (p) => p.split(path.sep).join('/');

// ── 화면 위 표시 (커서, 물결, 키) ──
const OVERLAY = `(() => {
  const css = \`
  #gc-cur{position:fixed;left:0;top:0;width:26px;height:30px;z-index:2147483647;pointer-events:none;transform:translate(-100px,-100px);filter:drop-shadow(0 2px 3px rgba(0,0,0,.35))}
  .gc-rip{position:fixed;z-index:2147483646;pointer-events:none;width:44px;height:44px;margin:-22px 0 0 -22px;border-radius:50%;border:3px solid #ff3d7f;background:rgba(255,61,127,.18);animation:gcrip .55s ease-out forwards}
  @keyframes gcrip{from{transform:scale(.25);opacity:1}to{transform:scale(1.25);opacity:0}}
  #gc-keys{position:fixed;left:50%;bottom:26px;transform:translateX(-50%);z-index:2147483647;pointer-events:none;display:flex;gap:8px;opacity:0;transition:opacity .2s}
  #gc-keys.on{opacity:1}
  #gc-keys b{font:600 20px/1 system-ui,sans-serif;color:#fff;background:rgba(30,30,40,.82);border-radius:9px;padding:9px 14px;box-shadow:0 3px 10px rgba(0,0,0,.3)}
  #gc-keys i{font:600 20px/38px system-ui,sans-serif;color:#333;font-style:normal}\`;
  const add = () => {
    if (document.getElementById('gc-cur')) return;
    const st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);
    const c = document.createElement('div'); c.id = 'gc-cur';
    c.innerHTML = '<svg width="26" height="30" viewBox="0 0 26 30"><path d="M2 2 L2 24 L8 18.5 L12.5 28 L16.5 26 L12 16.8 L20 16.8 Z" fill="#fff" stroke="#111" stroke-width="2" stroke-linejoin="round"/></svg>';
    document.body.appendChild(c);
    const k = document.createElement('div'); k.id = 'gc-keys'; document.body.appendChild(k);
  };
  if (document.body) add(); else document.addEventListener('DOMContentLoaded', add);
  window.__gc = {
    cur(x, y) { add(); document.getElementById('gc-cur').style.transform = 'translate(' + (x - 2) + 'px,' + (y - 2) + 'px)'; },
    rip(x, y) { const r = document.createElement('div'); r.className = 'gc-rip'; r.style.left = x + 'px'; r.style.top = y + 'px'; document.body.appendChild(r); setTimeout(() => r.remove(), 700); },
    keysAt(cx, bottom) { add(); const k = document.getElementById('gc-keys'); k.style.left = cx + 'px'; k.style.bottom = bottom + 'px'; },
    keys(list) { add(); const k = document.getElementById('gc-keys'); k.innerHTML = list.map((s) => s === '+' ? '<i>+</i>' : '<b>' + s + '</b>').join(''); k.classList.add('on'); clearTimeout(window.__gck); window.__gck = setTimeout(() => k.classList.remove('on'), 1300); },
  };
})();`;

// 한 장면을 움직이는 손. 걸음마다 진짜 입력과 화면 표시를 같이 한다.
function hand(page, lang, shotsDir, name) {
  const L = { ko: -1, ja: 0, en: 1 }[lang];
  let pos = [VW / 2, VH / 2];
  let shot = 0;
  const h = {
    lang,
    T: (ko) => (L < 0 ? ko : (DICT[ko] && DICT[ko][L]) || ko),
    page,
    wait: (ms) => page.waitForTimeout(ms),
    async snap(tag) {
      if (shotsDir) await page.screenshot({ path: path.join(shotsDir, `${name}_${lang}_${String(++shot).padStart(2, '0')}_${tag || ''}.png`) });
    },
    // 커서를 부드럽게 옮김 (진짜 마우스도 같이: hover가 일어나게)
    async move(x, y, ms = 550) {
      const [sx, sy] = pos;
      const n = Math.max(6, Math.round(ms / 16));
      for (let i = 1; i <= n; i++) {
        const t = i / n, e = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
        const cx = sx + (x - sx) * e, cy = sy + (y - sy) * e;
        await page.mouse.move(cx, cy);
        await page.evaluate(([a, b]) => window.__gc.cur(a, b), [cx, cy]);
        await page.waitForTimeout(16);
      }
      pos = [x, y];
    },
    // 누를 자리. left면 요소의 왼쪽 끝 가까이(오른쪽이 다른 것에 덮일 때)
    async at(target, left) {
      if (Array.isArray(target)) return target;
      const loc = typeof target === 'string' ? page.locator(target).first() : target;
      await loc.waitFor({ state: 'visible', timeout: 5000 });
      const b = await loc.boundingBox();
      return [left ? b.x + Math.min(10, b.width / 2) : b.x + b.width / 2, b.y + b.height / 2];
    },
    async click(target, opt = {}) {
      const [x, y] = await h.at(target, opt.left);
      await h.move(x, y, opt.ms);
      await page.waitForTimeout(150);
      await page.evaluate(([a, b]) => window.__gc.rip(a, b), [x, y]);
      await page.mouse.click(x, y);
      await page.waitForTimeout(opt.after ?? 450);
    },
    async dbl(target, opt = {}) {
      const [x, y] = await h.at(target);
      await h.move(x, y, opt.ms);
      await page.waitForTimeout(150);
      await page.evaluate(([a, b]) => { window.__gc.rip(a, b); setTimeout(() => window.__gc.rip(a, b), 130); }, [x, y]);
      await page.mouse.dblclick(x, y);
      await page.waitForTimeout(opt.after ?? 600);
    },
    async drag(from, to, opt = {}) {
      const [x1, y1] = await h.at(from);
      const [x2, y2] = await h.at(to);
      await h.move(x1, y1);
      await page.waitForTimeout(150);
      await page.mouse.down();
      await page.evaluate(([a, b]) => window.__gc.rip(a, b), [x1, y1]);
      await h.move(x2, y2, opt.ms ?? 900);
      await page.waitForTimeout(150);
      await page.mouse.up();
      await page.waitForTimeout(opt.after ?? 500);
    },
    async wheel(dy, n = 4) {
      for (let i = 0; i < n; i++) {
        await page.mouse.wheel(0, dy);
        await page.waitForTimeout(110);
      }
      await page.waitForTimeout(350);
    },
    // 키 누르기 + 아래 가운데에 키 표시. combo는 playwright 이름('Control+Enter'), show는 보일 글(없으면 만듦)
    async key(combo, show) {
      const nice = { Control: 'Ctrl', ArrowLeft: '←', ArrowRight: '→', ArrowUp: '↑', ArrowDown: '↓', Escape: 'Esc', Enter: 'Enter', Shift: 'Shift', Alt: 'Alt', Delete: 'Delete', Tab: 'Tab' };
      const parts = (show || combo.split('+').map((k) => nice[k] || k).join(' + ')).split(' ');
      await page.evaluate((p) => window.__gc.keys(p), parts);
      await page.keyboard.press(combo);
      await page.waitForTimeout(500);
    },
    // 조건에 맞는 첫 요소 (화면에 보이는 것만)
    async mark(fn) {
      await page.evaluate((src) => {
        const f = eval(src);
        document.querySelectorAll('[data-gc-val]').forEach((e) => e.removeAttribute('data-gc-val'));
        const el = [...document.querySelectorAll('input,textarea,button')].find((e) => e.offsetParent && f(e));
        if (el) el.setAttribute('data-gc-val', '1');
      }, fn.toString());
      return page.locator('[data-gc-val]');
    },
    // 값이 v인 입력칸 (React 입력칸은 value 속성이 없어서 찾아 표시해 둠)
    async byValue(v) {
      await page.evaluate((val) => {
        document.querySelectorAll('[data-gc-val]').forEach((e) => e.removeAttribute('data-gc-val'));
        const el = [...document.querySelectorAll('input,textarea')].find((e) => e.value === val && e.offsetParent);
        if (el) el.setAttribute('data-gc-val', '1');
      }, v);
      return page.locator('[data-gc-val]');
    },
    async type(text, delay = 70) {
      await page.keyboard.type(text, { delay });
      await page.waitForTimeout(300);
    },
  };
  return h;
}

// 장면에서 쓰는 글 (화면 언어마다)
const W = {
  name: { ko: '민지', ja: 'ミンジ', en: 'Minji' },
  line1: { ko: '오늘은 비가 오네.', ja: '今日は雨だね。', en: 'It is raining today.' },
  line2: { ko: '우산 가져왔어?', ja: '傘、持ってきた?', en: 'Did you bring an umbrella?' },
  choice1: { ko: '빌려 달라고 한다', ja: '貸してと頼む', en: 'Ask to borrow one' },
  nar: { ko: '창밖으로 빗소리가 들린다.', ja: '窓の外から雨音が聞こえる。', en: 'I hear the rain outside.' },
};

// ── 장면 ── (이름: [설명, 함수]). 함수가 끝나면 0.8초 더 찍고 멈춤
const SCENES = {
  // 캔버스 조작: 휠로 확대·축소, 빈 곳 끌어 옮기기, ⛶로 모두 보기
  'canvas-nav': ['캔버스 확대·이동', async (h) => {
    await h.move(600, 420);
    await h.wait(300);
    await h.wheel(-120, 4);
    await h.wheel(120, 6);
    await h.drag([360, 680], [520, 560], { ms: 1000 });
    await h.click('.zoom-btns button:nth-child(3)');
  }],
  // 캐릭터 등록: 장면과 캐릭터 → + 캐릭터 → 이름, id → Enter
  'char-add': ['캐릭터 등록', async (h) => {
    await h.click(h.page.getByText(h.T('장면과 캐릭터'), { exact: true }));
    await h.click(h.page.getByRole('button', { name: h.T('+ 캐릭터') }), { after: 700 });
    await h.click(h.page.locator(':focus'), { after: 250 });
    await h.key('Control+a', 'Ctrl + A');
    await h.type(W.name[h.lang]);
    await h.click(await h.byValue('c2'), { after: 250 });
    await h.key('Control+a', 'Ctrl + A');
    await h.type('minji');
    await h.snap('id');
    await h.key('Enter');
    await h.snap('done');
  }, { crop: [0, 96, 600, 375] }],
  // 상자 만들기: 빈 곳 더블클릭 → 새 상자, 오른쪽 대사 칸에 쓰기
  'box-new': ['상자 만들기', async (h) => {
    await h.dbl([300, 700], { after: 900 });
    await h.type(W.nar[h.lang]);
    await h.snap('typed');
  }],
  // 상자 안에서 글쓰기: 상자 더블클릭 → 쓰기, Ctrl+Enter로 새 줄, Esc로 끝
  'box-write': ['상자 안에서 글쓰기', async (h) => {
    await openBox(h);
    await h.key('End');
    await h.key('Control+Enter', 'Ctrl + Enter');
    await h.type(W.line2[h.lang]);
    await h.wait(500);
    await h.key('Escape');
    await h.snap('end');
  }, { crop: [180, 300, 720, 450] }],
  // 줄 종류 (대사 버블): Alt+← → 화자 고르기
  'line-kind': ['줄 종류 고르기', async (h) => {
    await openBox(h);
    await h.key('End');
    await h.key('Control+Enter', 'Ctrl + Enter');
    await h.key('Alt+ArrowLeft', 'Alt + ←');
    await h.wait(400);
    await h.key('ArrowDown');
    await h.snap('pick');
    await h.key('Enter');
    await h.type(W.line2[h.lang]);
    await h.snap('typed');
    await h.wait(600);
  }, { crop: [180, 330, 640, 420] }],
  // 글 꾸미기 (글꼴 버블): 글 고르기 → Alt+↑ → 굵게, 색
  'tag-style': ['글 꾸미기', async (h) => {
    await openBox(h);
    await h.key('Home');
    await h.key('Shift+End', 'Shift + End');
    await h.key('Alt+ArrowUp', 'Alt + ↑');
    await h.wait(300);
    await h.click('.tb-b');
    await h.snap('bold');
    await h.click('.tb-color', { left: true });
    await h.snap('palette');
    await h.click('.tb-grid button:nth-child(4)');
    await h.snap('color');
    await h.wait(400);
    await h.key('Escape');
  }, { crop: [330, 40, 660, 480] }],
  // 다음 흐름 (흐름 버블): Alt+→ → 선택지 → 글 쓰기
  'flow-choice': ['다음 흐름 고르기', async (h) => {
    await openBox(h);
    await h.key('Alt+ArrowRight', 'Alt + →');
    await h.wait(400);
    await h.key('ArrowDown');
    await h.snap('pick');
    await h.key('Enter');
    await h.type(W.choice1[h.lang]);
    await h.snap('typed');
    await h.wait(600);
  }, { crop: [330, 330, 720, 450] }],
  // 연출 줄: Alt+← → 배경 → 오른쪽 입력칸에 배경 이름
  'stage-bg': ['연출 줄 (배경)', async (h) => {
    await openBox(h);
    await h.key('End');
    await h.key('Control+Enter', 'Ctrl + Enter');
    await h.key('Alt+ArrowLeft', 'Alt + ←');
    await h.wait(400);
    await h.key('ArrowDown');
    await h.key('ArrowDown');
    await h.snap('pick');
    await h.key('Enter');
    await h.wait(500);
    await h.snap('field');
    await h.click(await h.mark((e) => e.tagName === 'INPUT' && (e.placeholder || '').includes('room') && e.getBoundingClientRect().x < 880), { after: 250 });
    await h.type('room');
    await h.snap('typed');
    await h.wait(600);
  }, { crop: [180, 330, 720, 450] }],
  // 선으로 잇기: 상자 아래 점을 빈 곳에 끌어 놓으면 새 상자가 생기며 이어짐
  'link-drag': ['선으로 잇기', async (h) => {
    await h.dbl([260, 600], { after: 900 });
    await h.type(W.nar[h.lang], 50);
    await h.click([280, 760], { after: 500 });
    const hd = h.page.locator('.react-flow__node[data-id="n07"] .react-flow__handle-bottom').first();
    await h.drag(hd, [430, 700], { ms: 1100, after: 900 });
    await h.snap('linked');
  }, { crop: [120, 440, 560, 350] }],
  // 내보낼 원고 보기: 왼쪽 [스크립트]
  'script-view': ['원고 보기', async (h) => {
    // 영어 화면에서는 위쪽 [대본 편집] 탭도 "Script"라서 왼쪽 칸 것을 고름
    const all = h.page.getByText(h.T('스크립트'), { exact: true });
    let card = all.first();
    for (let i = 0; i < (await all.count()); i++) { const b = await all.nth(i).boundingBox(); if (b && b.x < 300 && b.y > 120) { card = all.nth(i); break; } }
    await h.click(card, { after: 900 });
    await h.snap('open');
    // 왼쪽 칸 경계를 끌어 넓게 (칸 크기)
    await h.drag('.resizer', [560, 420], { ms: 900, after: 600 });
    await h.move(250, 500, 700);
    await h.wheel(100, 5);
    await h.wait(600);
  }, { crop: [0, 96, 720, 450] }],
};

// 예제 대본의 "비 냄새" 상자(n6)를 더블클릭해서 상자 안 편집으로
async function openBox(h) {
  await h.dbl('.react-flow__node[data-id="n6"]', { after: 1300 });
}

async function launch() {
  for (const o of [{ channel: 'chrome' }, { channel: 'msedge' }, {}]) {
    try {
      return await chromium.launch(o);
    } catch {}
  }
  throw new Error('브라우저를 못 켰어요 (Chrome이나 Edge를 설치하거나 npx playwright install chromium)');
}

async function record(browser, name, lang, shotsDir, tmp) {
  const ctx = await browser.newContext({ viewport: { width: VW, height: VH }, deviceScaleFactor: 2, reducedMotion: 'no-preference' });
  await ctx.addInitScript((l) => { try { localStorage.setItem('pygaki-lang', l); } catch {} }, lang);
  await ctx.addInitScript(OVERLAY);
  const page = await ctx.newPage();
  await page.goto('file:///' + slash(DIST));
  await page.waitForTimeout(1500);
  const h = hand(page, lang, shotsDir, name);
  await page.evaluate(([a, b]) => window.__gc.cur(a, b), [VW / 2, VH / 2]);
  const cr = SCENES[name][2] && SCENES[name][2].crop;
  if (cr) await page.evaluate(([a, b]) => window.__gc.keysAt(a, b), [cr[0] + cr[2] / 2, VH - (cr[1] + cr[3]) + 18]);
  const dir = fs.mkdtempSync(path.join(tmp, `${name}_${lang}_`));
  const cdp = await ctx.newCDPSession(page);
  const shots = [];
  const pending = [];
  let t0 = 0;
  cdp.on('Page.screencastFrame', (e) => {
    const t = e.metadata.timestamp * 1000;
    if (!t0) t0 = t;
    const f = path.join(dir, `f${String(shots.length).padStart(5, '0')}.jpg`);
    shots.push([f, t - t0]);
    pending.push(fs.promises.writeFile(f, Buffer.from(e.data, 'base64')));
    cdp.send('Page.screencastFrameAck', { sessionId: e.sessionId }).catch(() => {});
  });
  await cdp.send('Page.startScreencast', { format: 'jpeg', quality: 92, everyNthFrame: 1, maxWidth: VW * 2, maxHeight: VH * 2 });
  await page.waitForTimeout(500);
  await SCENES[name][1](h);
  await page.waitForTimeout(1200);
  const total = Date.now();
  await cdp.send('Page.stopScreencast');
  await Promise.all(pending);
  await ctx.close();
  if (!shots.length) throw new Error(name + ': 찍힌 장면이 없어요');
  const end = shots[shots.length - 1][1] + 800;
  const lines = ['ffconcat version 1.0'];
  shots.forEach(([f, t], i) => {
    const next = i + 1 < shots.length ? shots[i + 1][1] : end;
    lines.push(`file '${slash(f)}'`, `duration ${Math.max(0.001, (next - t) / 1000).toFixed(3)}`);
  });
  lines.push(`file '${slash(shots[shots.length - 1][0])}'`);
  const list = path.join(dir, 'list.txt');
  fs.writeFileSync(list, lines.join('\n'));
  const outDir = lang === 'ko' ? CLIPS : path.join(CLIPS, lang);
  fs.mkdirSync(outDir, { recursive: true });
  const out = path.join(outDir, name + '.webm');
  // 프레임 크기가 가끔 다르게 와서(화면이 바뀌는 중) 모두 2배 크기로 맞춘 뒤 자름. crop은 CSS 픽셀 [x, y, 너비, 높이]
  const k = 2;
  const [cx, cy, cw, ch] = (SCENES[name][2] && SCENES[name][2].crop) || [0, 0, VW, VH];
  const crop = `crop=${Math.round(cw * k)}:${Math.round(ch * k)}:${Math.round(cx * k)}:${Math.round(cy * k)}`;
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'concat', '-safe', '0', '-i', list, '-vf', `scale=${VW * k}:${VH * k},` + crop + ',scale=1280:-2:flags=lanczos:out_range=tv,fps=25,format=yuv420p', '-color_range', 'tv', '-c:v', 'libvpx-vp9', '-b:v', '0', '-crf', '40', '-row-mt', '1', '-an', out]);
  console.log(`${name.padEnd(14)} ${lang}  ${(end / 1000).toFixed(1)}초  ${shots.length}장  ${(fs.statSync(out).size / 1024).toFixed(0)} KB`);
  void total;
}

(async () => {
  if (!fs.existsSync(DIST)) throw new Error('먼저 npm run build');
  const args = process.argv.slice(2);
  const opt = (k) => { const i = args.indexOf(k); if (i < 0) return null; const v = args[i + 1]; args.splice(i, 2); return v; };
  const langs = (opt('--lang') || 'ko,ja,en').split(',');
  const shotsDir = opt('--shots');
  if (shotsDir) fs.mkdirSync(shotsDir, { recursive: true });
  const names = args.length ? args : Object.keys(SCENES);
  for (const n of names) if (!SCENES[n]) throw new Error('없는 장면: ' + n + ' (있는 것: ' + Object.keys(SCENES).join(', ') + ')');
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'pk_guideclip_'));
  const browser = await launch();
  try {
    for (const n of names) for (const l of langs) await record(browser, n, l, shotsDir, tmp);
  } finally {
    await browser.close();
    fs.rmSync(tmp, { recursive: true, force: true });
  }
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
