// 언어 버튼 (6단계): 대본 편집기 화면 글을 일본어·영어로 바꿔 보여 준다.
// 소스의 화면 글은 한국어 그대로 두고, 화면에 그려진 글(글 노드, title·placeholder)을 사전(i18n/dict.json)으로 바꾼다.
//   exact: 한국어 글 그대로 → [일본어, 영어]
//   pats:  ${…}가 든 글 → 정규식, 번역의 {0} {1}에 잡힌 조각을 넣는다 (조각도 사전에 있으면 바꿈)
// 사전은 pykaki/i18n/strings.tsv에서 만든다 (pykaki/i18n/build_dict.py). 사전에 없는 글은 한국어 그대로 보인다.
// 바꾸지 않는 것: 글 칸(textarea, input의 값), 원고 미리보기(pre), 도움말 창(Help.tsx가 언어에 맞는 번역 문서를 따로 읽음)
import dict from './i18n/dict.json';

export type Lang = 'ko' | 'ja' | 'en';
export const LANGS: [Lang, string][] = [['ko', '한국어'], ['ja', '日本語'], ['en', 'English']];
const KEY = 'pygaki-lang';

const D = dict as unknown as { exact: Record<string, [string, string]>; pats: [string, string, string][] };
const exact = new Map<string, [string, string]>(Object.entries(D.exact));
// nl: 원문 모양에 줄바꿈이 든 패턴 (여러 줄 글은 이것만 통째로 맞춰 본다)
const pats = D.pats.map(([re, ja, en]) => [new RegExp(re), ja, en, re.includes('\n') || re.includes('\\n')] as const);
const HANGUL = /[가-힣]/;

// 고른 적이 없으면 PC(윈도우) 언어: 일본어, 영어, 나머지는 한국어 (pygaki v1.9). 고르면 그 값을 기억
export function pcLang(): Lang {
  try {
    const l = (navigator.languages?.[0] || navigator.language || '').toLowerCase();
    return l.startsWith('ja') ? 'ja' : l.startsWith('en') ? 'en' : 'ko';
  } catch {
    return 'ko';
  }
}
function readLang(): Lang {
  try {
    const v = localStorage.getItem(KEY);
    return v === 'ja' || v === 'en' || v === 'ko' ? v : pcLang();
  } catch {
    return pcLang();
  }
}
let lang: Lang = readLang();
export const getLang = () => lang;

// 글 하나 (앞뒤 빈칸은 그대로 두고 가운데만)
function trCore(t: string, depth = 0): string | null {
  const e = exact.get(t);
  const i = lang === 'ja' ? 0 : 1;
  if (e) return e[i];
  if (depth > 1) return null;
  const multi = t.includes('\n');
  for (const [re, ja, en, nl] of pats) {
    if (multi && !nl) continue; // 한 줄 패턴이 줄바꿈 너머까지 잡지 않게 (여러 줄 글은 줄마다 다시)
    const m = re.exec(t);
    if (!m) continue;
    return (i ? en : ja).replace(/\{(\d+)\}/g, (_, k) => {
      const part = m[Number(k) + 1] ?? '';
      return (HANGUL.test(part) && trCore(part.trim(), depth + 1)) || part;
    });
  }
  return null;
}

export function tr(s: string): string {
  if (lang === 'ko' || !s || !HANGUL.test(s)) return s;
  const t = s.trim();
  const whole = trCore(t);
  if (whole !== null) return s.replace(t, whole);
  // 여러 줄 글(알림 창, 설명): 줄마다
  if (t.includes('\n')) return s.split('\n').map((x) => (x.trim() ? (trLine(x.trim()) ?? x) : x)).join('\n');
  const l = trLine(t);
  return l !== null ? s.replace(t, l) : s;
}

// 앞뒤의 한글 아닌 것(기호, 단축키 "Ctrl+Z", 괄호)을 떼고 가운데만 다시 찾는다
const AFFIX = /^([^가-힣]*?)([가-힣](?:[\s\S]*[가-힣])?[.?!」)]?)([^가-힣]*)$/;
function trAffix(t: string): string | null {
  const w = trCore(t);
  if (w !== null) return w;
  const m = AFFIX.exec(t);
  if (m && (m[1] || m[3])) {
    for (const core of [m[2], m[2].replace(/[.?!)」]+$/, '')]) {
      const c = trCore(core.trim());
      if (c !== null) return m[1] + m[2].replace(core.trim(), c) + m[3];
    }
  }
  return null;
}
// 그래도 없으면 " · ", ", "로 이은 조각마다 (막대 이름 목록, "바꾸는 곳 · 누르면 그 상자로" 같은 글)
function trLine(t: string): string | null {
  const a = trAffix(t);
  if (a !== null) return a;
  const parts = t.split(/( · |, )/);
  if (parts.length < 3) return null;
  let hit = false;
  const out = parts.map((p, i) => {
    if (i % 2 || !HANGUL.test(p)) return p;
    const r = trAffix(p.trim());
    if (r === null) return p;
    hit = true;
    return p.replace(p.trim(), r);
  });
  return hit ? out.join('') : null;
}

// ── 화면에 그려진 글 바꾸기 ──
const ATTRS = ['title', 'placeholder', 'aria-label', 'label', 'data-tip']; // label: <optgroup label>
const textOrig = new WeakMap<Text, { orig: string; shown: string }>();
const attrOrig = new WeakMap<Element, Record<string, { orig: string; shown: string }>>();
const SKIP = 'textarea, script, style, pre, [data-no-tr]';

function doText(n: Text) {
  const p = n.parentElement;
  if (!p || p.closest(SKIP)) return;
  const cur = n.data;
  const rec = textOrig.get(n);
  // React가 새 글을 넣었으면 그것이 원문
  const orig = rec && rec.shown === cur ? rec.orig : cur;
  const shown = tr(orig);
  textOrig.set(n, { orig, shown });
  if (shown !== cur) n.data = shown;
}

function doAttrs(el: Element) {
  if (el.closest('[data-no-tr]')) return;
  let recs = attrOrig.get(el);
  for (const a of ATTRS) {
    const cur = el.getAttribute(a);
    if (cur === null) continue;
    const rec = recs?.[a];
    const orig = rec && rec.shown === cur ? rec.orig : cur;
    if (!HANGUL.test(orig) && !rec) continue;
    const shown = tr(orig);
    recs ??= {};
    recs[a] = { orig, shown };
    attrOrig.set(el, recs);
    if (shown !== cur) el.setAttribute(a, shown);
  }
}

function walk(root: Node) {
  if (root.nodeType === Node.TEXT_NODE) return doText(root as Text);
  if (root.nodeType !== Node.ELEMENT_NODE) return;
  const el = root as Element;
  if (el.matches?.('script, style')) return;
  doAttrs(el);
  const it = document.createTreeWalker(el, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT);
  for (let n = it.nextNode(); n; n = it.nextNode()) {
    if (n.nodeType === Node.TEXT_NODE) doText(n as Text);
    else doAttrs(n as Element);
  }
}

let observer: MutationObserver | null = null;
function start() {
  if (observer || lang === 'ko') return;
  observer = new MutationObserver((list) => {
    for (const m of list) {
      if (m.type === 'characterData') doText(m.target as Text);
      else if (m.type === 'attributes') doAttrs(m.target as Element);
      else m.addedNodes.forEach(walk);
    }
  });
  observer.observe(document.body, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ATTRS });
  walk(document.body);
}

// 언어 바꾸기: 한국어로 돌아가면 원문을 되돌리고 지켜보기를 멈춘다
export function setLang(l: Lang) {
  try {
    localStorage.setItem(KEY, l);
  } catch {
    /* 이번만 */
  }
  lang = l;
  document.documentElement.lang = l;
  cssWords();
  if (l === 'ko') {
    observer?.disconnect();
    observer = null;
  }
  walk(document.body); // 원문에서 다시 (ko면 tr이 원문을 돌려줌)
  start();
  window.dispatchEvent(new Event('pygaki-lang'));
}

// 알림 창 글도
const wrap = <T extends (msg?: string, ...a: any[]) => any>(fn: T) => ((msg?: string, ...a: any[]) => fn.call(window, typeof msg === 'string' ? tr(msg) : msg, ...a)) as T;
window.alert = wrap(window.alert);
window.confirm = wrap(window.confirm);
window.prompt = wrap(window.prompt);

// CSS content로 그리는 글("사용 중" 배지)은 DOM 글이 아니라서 CSS 변수로 넘긴다
function cssWords() {
  document.documentElement.style.setProperty('--t-in-use', JSON.stringify(tr('사용 중')));
}

export function initI18n() {
  document.documentElement.lang = lang;
  cssWords();
  if (document.body) start();
  else document.addEventListener('DOMContentLoaded', start);
}
