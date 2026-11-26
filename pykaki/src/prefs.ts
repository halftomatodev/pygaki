// 환경 설정(화면 색, 단축키). 대본이 아니라 이 브라우저에 붙는 설정이라 localStorage에 둔다.
import { create } from 'zustand';
// Pretendard (SIL OFL 1.1, licenses/OFL-Pretendard.txt). 굵기를 고를 수 있는 가변 글꼴 하나를 파일 안에 넣는다
import pretendardUrl from 'pretendard/dist/web/variable/woff2/PretendardVariable.woff2?url';

export type ActionId = 'focus' | 'nextBox' | 'flowMenu' | 'tagBox' | 'save' | 'saveAs' | 'export' | 'undo' | 'redo' | 'newBox' | 'duplicate' | 'newLine' | 'lineType' | 'tagBold' | 'tagItalic' | 'tagUnderline' | 'gamePanel' | 'gameBands' | 'find' | 'bubbles';

// 키는 e.code(자판 위치)로 적는다. 한글 입력 상태에서도 같은 키로 동작한다
export const ACTIONS: { id: ActionId; label: string; def: string }[] = [
  { id: 'focus', label: '집중 모드 (화면 정리)', def: 'Ctrl+Backslash' },
  { id: 'newLine', label: '같은 화자로 새 줄', def: 'Ctrl+Enter' },
  { id: 'nextBox', label: '다음 상자로 이어 쓰기', def: 'Ctrl+Shift+Enter' },
  // 상자 안 편집의 세 버블 (세션 94): 대사 버블(줄 종류), 글꼴 버블(글자 스타일), 흐름 버블(다음 흐름). 셋 다 같이 열 수 있다
  { id: 'lineType', label: '대사 버블 열기/닫기 (줄 종류, 방향키로 고르기)', def: 'Alt+ArrowLeft' },
  { id: 'tagBox', label: '글꼴 버블 펼치기/접기 (글자 스타일, 상자 안 대사 칸에서)', def: 'Alt+ArrowUp' },
  { id: 'flowMenu', label: '흐름 버블 열기/닫기 (다음 흐름, 키보드로 고르기)', def: 'Alt+ArrowRight' },
  // 세 버블을 한 번에 (세션 97). 하나라도 열려 있으면 모두 닫고, 아니면 모두 연다. Alt+Space는 윈도우와 다른 프로그램이 잡는 일이 많아 Alt+↓
  { id: 'bubbles', label: '세 버블 한 번에 열기/닫기 (상자 안에서)', def: 'Alt+ArrowDown' },
  { id: 'save', label: '파일 저장', def: 'Ctrl+KeyS' },
  { id: 'saveAs', label: '다른 이름으로 저장', def: 'Ctrl+Shift+KeyS' },
  { id: 'export', label: '.rpy 같은 곳에 다시 내보내기', def: 'Ctrl+KeyE' },
  { id: 'undo', label: '실행 취소', def: 'Ctrl+KeyZ' },
  { id: 'redo', label: '다시 실행', def: 'Ctrl+KeyY' },
  { id: 'newBox', label: '새 상자', def: 'Alt+KeyN' },
  { id: 'duplicate', label: '고른 상자 복제 (복사는 Ctrl+C, 붙여넣기는 Ctrl+V)', def: 'Ctrl+KeyD' },
  { id: 'tagBold', label: '대사 굵게 {b} (글 칸에서)', def: 'Ctrl+KeyB' },
  { id: 'tagItalic', label: '대사 기울임 {i} (글 칸에서)', def: 'Ctrl+KeyI' },
  { id: 'tagUnderline', label: '대사 밑줄 {u} (글 칸에서)', def: 'Ctrl+KeyU' },
  { id: 'find', label: '찾기·바꾸기 (대사, 선택지, 상자 제목)', def: 'Ctrl+KeyF' },
  { id: 'gamePanel', label: '게임 창 pygaki editor: 축약형 → 대형 → 숨김 (게임과 연결됐을 때. 게임 창에서도 F9)', def: 'F9' },
  // 레트로 해상도(정수 배율)로 키운 게임 창의 남는 곳을 pygaki editor가 열려 있을 때 붉게 (LINK.md 9장 bands)
  { id: 'gameBands', label: '게임 화면 경계선 켜기/끄기 (앱, 게임과 연결됐을 때)', def: 'F8' },
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
  glass: number; // 카드 투명도 (%, 0이면 거의 불투명. 높을수록 뒤가 비치고 테두리 빛이 세짐, Card.tsx glassOf)
  grads: Record<GradId, Grad>; // 어둡게 테마의 두 색
  textColor: string | null; // 텍스트 색. null이면 테마가 정한 색
  runSkip: boolean; // [렌파이에서 실행]: 게임이 이미 켜져 있으면 무시 (앱)
  snapGame?: boolean; // 게임이 연결되면 앱 창을 게임 창 옆으로 (앱)
  gameBands?: boolean; // pygaki editor를 열었을 때 게임 창 여백(정수 배율 밖)을 붉게. 없으면 켬 (앱)
  leftW: number; // 왼쪽 칸 너비 (px)
  rightW: number; // 오른쪽 칸 너비 (px)
  guiLeftW: number; // [GUI 편집] 왼쪽 칸 너비 (px)
  guiRightW: number; // [GUI 편집] 오른쪽 칸 너비 (px)
  fxSideW: number; // [효과]·[셰이더] 오른쪽 칸 너비 (px)
  sizeLock: boolean; // 칸 경계를 끌어도 크기가 바뀌지 않게
  gallery: boolean; // [효과]·[셰이더] 왼쪽을 갤러리(미리보기 카드)로 보기
  galleryMove: boolean; // 갤러리에서 보이는 카드를 계속 움직이기 (FxGallery.tsx MAX_LIVE개까지)
  hiddenLast: boolean; // [효과]·[셰이더] 목록에서 숨긴 것을 아래로 모으기
  keysRev?: number; // 단축키 처음 값을 바꾼 차례 (KEYS_REV). 예전 처음 값 그대로인 키만 새 처음 값으로 옮긴다
}

// 카드 투명도의 처음 값과 범위 (세션 82)
// 처음 값은 80% (세션 94 사용자. 예전 28%)
export const GLASS = { def: 80, min: 0, max: 85 } as const;

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
// 세션 94: 글꼴 버블 Alt+T → Alt+↑, 흐름 버블 Alt+Enter → Alt+→, 대사 버블 Alt+↓ → Alt+←
// [바꾼 차례, 키, 예전 처음 값]: 저장된 차례가 그보다 앞이고 값이 예전 처음 값 그대로면 새 처음 값으로
const KEYS_REV = 2;
const OLD_DEF_KEYS: [number, ActionId, string][] = [[1, 'tagBox', 'Alt+KeyT'], [1, 'flowMenu', 'Alt+Enter'], [2, 'lineType', 'Alt+ArrowDown']];
const defKeys = () => Object.fromEntries(ACTIONS.map((a) => [a.id, a.def])) as Record<ActionId, string>;

// 처음 값
const defaults = (): Prefs => ({
  theme: 'apple', custom: { ...THEMES.find((t) => t.id === 'apple')!.colors, box: '#ffffff' }, keys: defKeys(),
  keysRev: KEYS_REV, dim: 'mid', frameWidth: 3, glass: GLASS.def, grads: structuredClone(GRAD_DEFAULTS), textColor: null, runSkip: true,
  ...sizeDefaults(), sizeLock: false, gallery: true, galleryMove: false, hiddenLast: true,
});

function loadPrefs(): Prefs {
  const d = defaults();
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) ?? 'null');
    if (raw) {
      // 없앤 테마(사과 컬러풀, 밝게, 1비트)는 처음 값으로, 글꼴은 고를 수 없어서 버린다
      delete raw.font;
      if (!THEME_IDS.includes(raw.theme)) delete raw.theme;
      if (raw.keys) for (const [rev, id, old] of OLD_DEF_KEYS) if ((raw.keysRev ?? 0) < rev && raw.keys[id] === old) delete raw.keys[id];
      raw.keysRev = KEYS_REV;
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

// 세션 77: 사과 스타일 하나만 쓴다(어둡게, 내 색, 글자색 고르기 없앰). 예전 설정의 theme·custom·textColor는 읽어도 무시
const themeOf = (_p: Prefs) => THEMES[0];
export const colorsOf = (p: Prefs): Colors => {
  const t = themeOf(p);
  return t.grad ? gradColors(p.grads[t.grad]) : t.colors;
};
export const gradOf = (p: Prefs) => themeOf(p).grad;
export const lookOf = (p: Prefs) => themeOf(p).look;

// 배경이 어두우면 캔버스(React Flow)도 어두운 모드로
export function isDark(c: Colors) {
  const n = parseInt(c.bg.slice(1), 16);
  return 0.299 * ((n >> 16) & 255) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255) < 128;
}

// 카드 유리 색 (fluidkit LiquidCard). 뒤의 캔버스가 비치게 반투명. 접으면 하늘색.
// 사용 중(in-use)은 유리 바탕 없이 투명하고 둘레가 흰 점선이다(Card.tsx, styles.css `.card.in-use`, 세션 100)
// 투명도는 환경 설정의 [카드 투명도] 하나로 모든 카드가 같이 바뀐다(세션 82, prefs.ts glass).
// 투명할수록 테두리 빛(intensity)을 세게 하고, 50% 넘으면 가장자리 굴절(refraction, 크롬·Electron만)도 켜서 유리로 읽히게 한다
export function glassOf(g: number) {
  const t = Math.min(GLASS.max, Math.max(GLASS.min, g)) / 100;
  const solid = Math.round(100 - t * 100);
  return {
    base: `color-mix(in srgb, var(--panel) ${solid}%, transparent)`,
    folded: `color-mix(in srgb, color-mix(in srgb, #38bdf8 15%, var(--panel)) ${Math.min(100, solid + 6)}%, transparent)`,
    intensity: Math.round((0.35 + t * 0.6) * 100) / 100,
    // fluidkit 유리는 뒤를 늘 8px 흐린다. 틴트가 옅어지면 그 흐린 상이 드러나 뿌옇게 보여서(세션 82 사용자),
    // 투명할수록 흐림을 줄인다(styles.css `--card-blur`가 fluidkit의 backdrop-filter를 덮음, 굴절은 이때 빠짐)
    blur: Math.round((8 - Math.max(0, t - 0.28) / 0.57 * 7) * 10) / 10 + 'px', // 28%까지 8px, 85%에서 1px
    // 그림자는 카드 크기의 짙은 판이라 틴트가 옅으면 비쳐 회색이 된다(세션 82 사용자) → 28%까지는 그대로, 60%까지 옅어지다 그 위로는 없음
    shadow: Math.round(Math.min(1, Math.max(0, (0.6 - t) / 0.32)) * 100) / 100,
  };
}

function apply(p: Prefs) {
  const c = colorsOf(p);
  const r = document.documentElement;
  r.style.setProperty('--bg', c.bg);
  r.style.setProperty('--panel', c.panel);
  r.style.setProperty('--text', c.text);
  r.dataset.textfix = '';
  r.dataset.grad = gradOf(p) ? '1' : '';
  r.style.setProperty('--accent', c.accent);
  r.dataset.dark = isDark(c) ? '1' : '';
  r.style.setProperty('--frame-w', Math.min(6, Math.max(0, p.frameWidth)) + 'px');
  // 유리 카드가 아닌 칸(.sec, 오른쪽 상자 편집 등)도 [카드 투명도]를 따름 (styles.css `.sec:not(.card)`)
  const g = glassOf(p.glass);
  r.style.setProperty('--glass-tint', g.base);
  r.style.setProperty('--glass-blur', g.blur);
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

