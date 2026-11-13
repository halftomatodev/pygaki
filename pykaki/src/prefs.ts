// 환경 설정(화면 색, 단축키). 대본이 아니라 이 브라우저에 붙는 설정이라 localStorage에 둔다.
import { create } from 'zustand';
// Pretendard (SIL OFL 1.1, licenses/OFL-Pretendard.txt). 굵기를 고를 수 있는 가변 글꼴 하나를 파일 안에 넣는다
import pretendardUrl from 'pretendard/dist/web/variable/woff2/PretendardVariable.woff2?url';

export type ActionId = 'focus' | 'nextBox' | 'flowMenu' | 'save' | 'saveAs' | 'export' | 'undo' | 'redo' | 'newBox' | 'newLine' | 'tagBold' | 'tagItalic' | 'tagUnderline' | 'gamePanel';

// 키는 e.code(자판 위치)로 적는다. 한글 입력 상태에서도 같은 키로 동작한다
export const ACTIONS: { id: ActionId; label: string; def: string }[] = [
  { id: 'focus', label: '집중 모드 (화면 정리)', def: 'Ctrl+Backslash' },
  { id: 'newLine', label: '같은 화자로 새 줄', def: 'Ctrl+Enter' },
  { id: 'nextBox', label: '다음 상자로 이어 쓰기', def: 'Ctrl+Shift+Enter' },
  { id: 'flowMenu', label: '다음 흐름 창 열기/닫기 (키보드로 고르기)', def: 'Alt+Enter' },
  { id: 'save', label: '파일 저장', def: 'Ctrl+KeyS' },
  { id: 'saveAs', label: '다른 이름으로 저장', def: 'Ctrl+Shift+KeyS' },
  { id: 'export', label: '.rpy 같은 곳에 다시 내보내기', def: 'Ctrl+KeyE' },
  { id: 'undo', label: '실행 취소', def: 'Ctrl+KeyZ' },
  { id: 'redo', label: '다시 실행', def: 'Ctrl+KeyY' },
  { id: 'newBox', label: '새 상자', def: 'Alt+KeyN' },
  { id: 'tagBold', label: '대사 굵게 {b} (글 칸에서)', def: 'Ctrl+KeyB' },
  { id: 'tagItalic', label: '대사 기울임 {i} (글 칸에서)', def: 'Ctrl+KeyI' },
  { id: 'tagUnderline', label: '대사 밑줄 {u} (글 칸에서)', def: 'Ctrl+KeyU' },
  { id: 'gamePanel', label: '게임 창의 GUI 편집기 보이기/숨기기 (앱, 게임과 연결됐을 때)', def: 'F9' },
];

// box·label은 어둡게(그라데이션) 테마와 직접 고르기에서만: 상자와 label 배경을 이 색으로 칠한다
export interface Colors { bg: string; panel: string; text: string; accent: string; box?: string; label?: string }
export type ThemeId = 'apple' | 'dark' | 'custom';
export interface Grad { a: string; b: string } // a: 바탕 쪽 색, b: 끝 색
export type GradId = 'dark';

// look: 사과 스타일(Apple 디자인 참고, 처음 값). 경계선 없이 둥근 카드와 바탕색 차이로만 구분한다
// grad: 그라데이션 테마(어둡게). 두 색 사이에서 바탕 → label 배경 → 상자 순서로 색을 정한다
export type Look = 'apple';
export const THEMES: { id: Exclude<ThemeId, 'custom'>; label: string; colors: Colors; look?: Look; grad?: GradId }[] = [
  { id: 'apple', label: '사과 스타일', colors: { bg: '#f2f2f7', panel: '#ffffff', text: '#1c1c1e', accent: '#007aff' }, look: 'apple' },
  { id: 'dark', label: '어둡게', colors: { bg: '#000000', panel: '#0b0714', text: '#ececf1', accent: '#a684f8' }, grad: 'dark' },
];
const THEME_IDS: string[] = [...THEMES.map((t) => t.id), 'custom'];
export const GRAD_DEFAULTS: Record<GradId, Grad> = { dark: { a: '#000000', b: '#8b5cf6' } };

// 두 색 섞기 (t=0이면 a, 1이면 b)
export function mixHex(a: string, b: string, t: number) {
  const p = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  const [x, y] = [p(a), p(b)];
  return '#' + x.map((v, i) => Math.round(v + (y[i] - v) * t).toString(16).padStart(2, '0')).join('');
}
const lum = (h: string) => {
  const n = parseInt(h.slice(1), 16);
  return 0.299 * ((n >> 16) & 255) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255);
};
// 그 색 위에 쓸 글자색
export const textOn = (h: string) => (lum(h) < 140 ? '#ececf1' : '#1c1c1e');

// 그라데이션: 바탕 0%, 옆 패널 8%, label 배경 30%, 상자 55%
export function gradColors(g: Grad): Colors {
  const dark = lum(g.a) < 128;
  return {
    bg: g.a,
    panel: mixHex(g.a, g.b, 0.08),
    text: textOn(g.a),
    accent: dark ? mixHex(g.b, '#ffffff', 0.3) : mixHex(g.b, '#000000', 0.4),
    label: mixHex(g.a, g.b, 0.3),
    box: mixHex(g.a, g.b, 0.55),
  };
}


// 글꼴은 Pretendard 500 하나만 쓴다 (고르는 칸 없음)
const FONT = {
  family: "'Pretendard Variable', 'Pretendard', 'Malgun Gothic', 'Apple SD Gothic Neo', system-ui, sans-serif",
  mono: "Consolas, 'D2Coding', monospace",
  weight: 500,
};

// 집중 모드에서 글을 쓸 때: [같은 상자의 다른 줄, 다른 상자] 불투명도
export type DimId = 'off' | 'weak' | 'mid' | 'strong';
export const DIMS: { id: DimId; label: string; line: number; box: number }[] = [
  { id: 'off', label: '끄기', line: 1, box: 1 },
  { id: 'weak', label: '약하게', line: 0.6, box: 0.4 },
  { id: 'mid', label: '보통', line: 0.4, box: 0.18 },
  { id: 'strong', label: '강하게', line: 0.22, box: 0.07 },
];

interface Prefs {
  theme: ThemeId;
  custom: Colors;
  keys: Record<ActionId, string>;
  dim: DimId;
  frameWidth: number; // label 경계선 굵기 (px, 0이면 안 보임)
  grads: Record<GradId, Grad>; // 어둡게 테마의 두 색
  textColor: string | null; // 텍스트 색. null이면 테마가 정한 색
  runSkip: boolean; // [렌파이에서 실행]: 게임이 이미 켜져 있으면 무시 (앱)
  leftW: number; // 왼쪽 칸 너비 (px)
  rightW: number; // 오른쪽 칸 너비 (px)
  guiLeftW: number; // [GUI 편집] 왼쪽 칸 너비 (px)
  guiRightW: number; // [GUI 편집] 오른쪽 칸 너비 (px)
  fxSideW: number; // [효과]·[셰이더] 오른쪽 칸 너비 (px)
  sizeLock: boolean; // 칸 경계를 끌어도 크기가 바뀌지 않게
  gallery: boolean; // [효과]·[셰이더] 왼쪽을 갤러리(미리보기 카드)로 보기
  galleryMove: boolean; // 갤러리에서 보이는 카드를 계속 움직이기 (FxGallery.tsx MAX_LIVE개까지)
}

// 칸 너비의 처음 값과 범위 (대본 편집 양쪽, GUI 편집 양쪽, 효과·셰이더 오른쪽)
export const SIZES = {
  leftW: { def: 244, min: 190, max: 520 },
  rightW: { def: 400, min: 300, max: 760 },
  guiLeftW: { def: 250, min: 190, max: 520 },
  guiRightW: { def: 380, min: 300, max: 760 },
  fxSideW: { def: 440, min: 320, max: 900 },
} as const;
export type SizeKey = keyof typeof SIZES;
export const SIZE_KEYS = Object.keys(SIZES) as SizeKey[];
export const clampSize = (k: SizeKey, w: number) => Math.round(Math.min(SIZES[k].max, Math.max(SIZES[k].min, w)));
export const sizeDefaults = () => Object.fromEntries(SIZE_KEYS.map((k) => [k, SIZES[k].def])) as Record<SizeKey, number>;

const KEY = 'pykaki-prefs';
const defKeys = () => Object.fromEntries(ACTIONS.map((a) => [a.id, a.def])) as Record<ActionId, string>;

// 처음 값
const defaults = (): Prefs => ({
  theme: 'apple', custom: { ...THEMES.find((t) => t.id === 'apple')!.colors, box: '#ffffff' }, keys: defKeys(),
  dim: 'mid', frameWidth: 3, grads: structuredClone(GRAD_DEFAULTS), textColor: null, runSkip: true,
  ...sizeDefaults(), sizeLock: false, gallery: true, galleryMove: false,
});

function loadPrefs(): Prefs {
  const d = defaults();
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) ?? 'null');
    if (raw) {
      // 없앤 테마(사과 컬러풀, 밝게, 1비트)는 처음 값으로, 글꼴은 고를 수 없어서 버린다
      delete raw.font;
      if (!THEME_IDS.includes(raw.theme)) delete raw.theme;
      return { ...d, ...raw, custom: { ...d.custom, ...raw.custom }, keys: { ...d.keys, ...raw.keys }, grads: { dark: { ...d.grads.dark, ...raw.grads?.dark } } };
    }
  } catch {
    // 저장소를 못 쓰는 브라우저면 기본값으로
  }
  return d;
}

export const usePrefs = create<Prefs>(loadPrefs);
export const resetKeys = () => usePrefs.setState({ keys: defKeys() });
export const resetPrefs = () => usePrefs.setState(defaults());

const themeOf = (p: Prefs) => THEMES.find((t) => t.id === p.theme) ?? THEMES[0];
export const colorsOf = (p: Prefs): Colors => {
  if (p.theme === 'custom') return p.custom;
  const t = themeOf(p);
  return t.grad ? gradColors(p.grads[t.grad]) : t.colors;
};
export const gradOf = (p: Prefs) => (p.theme === 'custom' ? undefined : themeOf(p).grad);
export const lookOf = (p: Prefs) => (p.theme === 'custom' ? undefined : themeOf(p).look);

// 배경이 어두우면 캔버스(React Flow)도 어두운 모드로
export function isDark(c: Colors) {
  const n = parseInt(c.bg.slice(1), 16);
  return 0.299 * ((n >> 16) & 255) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255) < 128;
}

function apply(p: Prefs) {
  const c = colorsOf(p);
  const r = document.documentElement;
  r.style.setProperty('--bg', c.bg);
  r.style.setProperty('--panel', c.panel);
  r.style.setProperty('--text', p.textColor ?? c.text);
  r.dataset.textfix = p.textColor ? '1' : '';
  if (p.textColor) r.style.setProperty('--text-fix', p.textColor);
  r.dataset.grad = gradOf(p) ? '1' : '';
  r.style.setProperty('--accent', c.accent);
  r.dataset.dark = isDark(c) ? '1' : '';
  r.style.setProperty('--frame-w', Math.min(6, Math.max(0, p.frameWidth)) + 'px');
  r.dataset.look = lookOf(p) ?? '';
  r.style.setProperty('--left-w', clampSize('leftW', p.leftW) + 'px');
  r.style.setProperty('--right-w', clampSize('rightW', p.rightW) + 'px');
  r.style.setProperty('--gui-left-w', clampSize('guiLeftW', p.guiLeftW) + 'px');
  r.style.setProperty('--gui-right-w', clampSize('guiRightW', p.guiRightW) + 'px');
  r.style.setProperty('--fx-side-w', clampSize('fxSideW', p.fxSideW) + 'px');
  // 그라데이션·직접 고르기 테마: 상자와 label 배경을 테마 색으로 칠한다
  const fill = (name: string, v?: string) => {
    r.dataset[name + 'fill'] = v ? '1' : '';
    if (v) (r.style.setProperty(`--theme-${name}`, v), r.style.setProperty(`--theme-${name}-text`, textOn(v)));
  };
  fill('box', c.box);
  fill('label', c.label);
  r.style.setProperty('--font', FONT.family);
  r.style.setProperty('--font-weight', String(FONT.weight));
  r.style.setProperty('--mono', FONT.mono);
  const dm = DIMS.find((x) => x.id === p.dim) ?? DIMS[2];
  r.style.setProperty('--dim-line', String(dm.line));
  r.style.setProperty('--dim-box', String(dm.box));
}

// 글꼴은 처음 켤 때 한 번 읽어 들인다
const added = new Set<string>();
function addFont(family: string, url: string, weight = '400') {
  if (added.has(family) || typeof FontFace === 'undefined') return;
  added.add(family);
  const ff = new FontFace(family, `url(${url}) format('woff2')`, { weight, display: 'swap' });
  document.fonts.add(ff);
  ff.load().catch((e) => console.warn('글꼴을 못 읽었어요', family, e));
}
const ensurePretendard = () => addFont('Pretendard Variable', pretendardUrl, '45 930');

apply(usePrefs.getState());
ensurePretendard();
usePrefs.subscribe((p) => {
  apply(p);
  try {
    localStorage.setItem(KEY, JSON.stringify(p));
  } catch {
    // 저장 못 해도 이번 창에서는 적용된다
  }
});

// ── 단축키 ──
const MOD_CODES = new Set(['ControlLeft', 'ControlRight', 'ShiftLeft', 'ShiftRight', 'AltLeft', 'AltRight', 'MetaLeft', 'MetaRight']);

// 눌린 키 조합 → 'Ctrl+Shift+KeyS'. 수식키만 눌렸으면 null. 맥의 Cmd는 Ctrl로 본다
export function comboOf(e: KeyboardEvent | React.KeyboardEvent) {
  if (!e.code || MOD_CODES.has(e.code)) return null;
  return [(e.ctrlKey || e.metaKey) && 'Ctrl', e.altKey && 'Alt', e.shiftKey && 'Shift', e.code].filter(Boolean).join('+');
}

export const hit = (e: KeyboardEvent | React.KeyboardEvent, id: ActionId) => {
  const k = usePrefs.getState().keys[id];
  return !!k && comboOf(e) === k;
};

const KEY_NAMES: Record<string, string> = {
  Backslash: '\\(₩)', Slash: '/', Period: '.', Comma: ',', Semicolon: ';', Quote: "'", BracketLeft: '[', BracketRight: ']',
  Minus: '-', Equal: '=', Backquote: '`', Space: 'Space', ArrowUp: '↑', ArrowDown: '↓', ArrowLeft: '←', ArrowRight: '→',
  IntlBackslash: '\\', IntlYen: '₩',
};

export function comboLabel(c: string) {
  if (!c) return '없음';
  return c
    .split('+')
    .map((p) => KEY_NAMES[p] ?? p.replace(/^Key/, '').replace(/^Digit/, '').replace(/^Numpad/, 'Num'))
    .join('+');
}

// 단축키 이름 (툴팁용)
export const keyOf = (id: ActionId) => comboLabel(usePrefs.getState().keys[id]);
