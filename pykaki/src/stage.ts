// 연출 줄(scene/show/hide/music/sound): 칸에 적은 값 → 렌파이 명령 한 줄
import type { Line, LineFx, LineType, SayStyle } from './types';
import { IMAGE_FX, RENPY_SHADERS, SHOWPY_SHADERS, shaderEffect } from './fx/textShaders';
import { shaderTags } from './tagEdit';

export const STAGE_TYPES: LineType[] = ['scene', 'show', 'hide', 'music', 'sound', 'fx'];
export const isStage = (t: LineType) => STAGE_TYPES.includes(t);

// 줄 종류 칸이 좁아서 짧게. 실제 명령은 칸 아래에 따로 보여 준다
export const STAGE_LABEL: Record<string, string> = {
  scene: '🖼 배경',
  show: '🧍 보이기',
  hide: '🙈 숨기기',
  music: '🎵 음악',
  sound: '🔊 효과음',
  fx: '✨ 화면 효과',
};

// 뒤쪽은 효과 폴더의 그림 전환 (showpy img_fx.use). refreshEffects가 채운다
const BASE_TRANSITIONS: [string, string][] = [['', '바로'], ['dissolve', '서서히'], ['fade', '검게 페이드']];
export const TRANSITIONS: [string, string][] = [...BASE_TRANSITIONS];
export const imageFxCode = (name: string) => `img_fx.use("${name}")`;
// 그림 효과와 고친 값: img_fx.use("bands", 1.2, count=10, color="#c2185b") ↔ { name, time, args }. 값 이름은 u__ 없이 적는다
export interface ImageFxUse { name: string; time?: string; args: [string, string][] }
export function parseImageFx(trans?: string): ImageFxUse | null {
  const m = /^img_fx\.use\(\s*"(\w+)"\s*(.*)\)\s*$/.exec(trans ?? '');
  if (!m) return null;
  const out: ImageFxUse = { name: m[1], args: [] };
  for (const part of m[2].split(',').map((p) => p.trim()).filter(Boolean)) {
    const i = part.indexOf('=');
    const [k, v] = i < 0 ? ['time', part] : [part.slice(0, i).trim(), part.slice(i + 1).trim()];
    if (k === 'time') out.time = v;
    else out.args.push([k, v.replace(/^(["'])(.*)\1$/, '$2')]);
  }
  return out;
}
export const formatImageFx = (u: ImageFxUse) =>
  `img_fx.use(${[`"${u.name}"`, ...(u.time ? [u.time] : []), ...u.args.map(([k, v]) => `${k}=${/^-?\d+(\.\d+)?$/.test(v) ? v : `"${v}"`}`)].join(', ')})`;
export const POSITIONS: [string, string][] = [['', '가운데'], ['left', '왼쪽'], ['right', '오른쪽']];

// showpy 화면 효과 칸의 값들
export const FX_BASE: [string, string][] = [
  ['', '그대로'], ['ascii', 'ASCII'], ['retro_term', '레트로 터미널'], ['gameboy', '게임보이'],
  // showpy screen_fx 5.1
  ['glitch', '글리치'], ['boil', '지글거림'], ['halftone', '망점'], ['hologram', '홀로그램'], ['nightvision', '나이트비전'], ['collage', '포토 콜라주'], ['shards', '파편 흩날림'],
  ['none', '효과 없음'], ['default', '기본으로'],
];

// 글 상자 (showpy ui_kit 4.0, engine/text_box.rpy)
export const BOXES: [string, string][] = [['', '상자 없음'], ['bubble', '말풍선'], ['pill', '둥근 테두리']];
export const TAILS: [string, string][] = [['', '꼬리 기본'], ['bottom', '꼬리 아래'], ['top', '꼬리 위'], ['left', '꼬리 왼쪽'], ['right', '꼬리 오른쪽'], ['none', '꼬리 없음']];
// 상자마다 꼬리 기본 (showpy say_style.box_styles 기본값과 같게)
export const boxTail = (s?: SayStyle) => (s?.box ? s.tail || (s.box === 'bubble' ? 'bottom' : 'none') : 'none');
export const FX_TRANS: [string, string][] = [['', '전환 기본'], ['tv', 'TV'], ['fade', '페이드'], ['none', '바로']];
export const FX_OVERLAY: [string, string][] = [['', '덮개 기본'], ['on', '덮개 켬'], ['off', '덮개 끔']];
export const FX_WARP: [string, string][] = [['', '휘어짐 그대로'], ['0', '0'], ['1', '1'], ['2', '2'], ['3', '3'], ['4', '4'], ['5', '5'], ['default', '기본값']];
export const FX_CURSOR: [string, string][] = [['', '커서 그대로'], ['effect', '효과 받음'], ['overlay', '덮개 밑'], ['top', '효과 안 받음'], ['default', '기본으로']];

const warpVal = (v: string) => (v === 'default' ? '"default"' : v);

// 대사 줄의 괄호 안 값: fx="ascii", fx_warp=3 ...
export function fxArgs(f?: LineFx): string[] {
  if (!f) return [];
  const a: string[] = [];
  if (f.fx) a.push(`fx=${pyStr(f.fx)}`);
  if (f.transition) a.push(`fx_transition=${f.transition === 'none' ? 'None' : pyStr(f.transition)}`);
  if (f.overlay) a.push(`fx_overlay=${f.overlay === 'on' ? 'True' : 'False'}`);
  if (f.warp) a.push(`fx_warp=${warpVal(f.warp)}`);
  if (f.cursor) a.push(`fx_cursor=${pyStr(f.cursor)}`);
  if (f.exclude) a.push(`fx_exclude=(${f.exclude.map((g) => pyStr(g) + ',').join(' ')})`);
  return a;
}

// 대사 등장 효과. 이름과 한글 이름은 셰이더 파일에서 온다 (src/fx/*.glsl, @effect 줄)
// - 렌파이에 들어 있는 효과: src/fx/renpy_textshaders.glsl
// - showpy가 등록하는 효과: showpy/game/ui_kit/engine/text_effects.glsl (빌드할 때 그대로 가져옴). showpy가 없는 게임에서는 내보내지 않는다
// 효과 폴더(showpy ui_kit/effects)의 파일을 다시 읽으면 refreshEffects로 목록을 새로 채운다 (같은 배열을 고쳐 씀)
export const EFFECTS: [string, string][] = [];
// 끈 효과 (ui_kit/effects/effects_off.txt, LINK.md 8-2). 고르는 목록에서만 빠지고, 이미 쓴 줄에는 이름이 그대로 보인다
const EFFECTS_OFF = new Set<string>();
export const effectOff = (name: string) => EFFECTS_OFF.has(name);
// effects_off.txt 읽기: 한 줄에 이름 하나, # 뒤는 설명 (showpy text_effects.rpy _tfx_read_off와 같은 규칙)
export const parseEffectsOff = (text: string) =>
  text.replace(/﻿/g, '').split(/\r?\n/).map((row) => row.split('#')[0].trim()).filter(Boolean);
export function setEffectsOff(names: string[]) {
  EFFECTS_OFF.clear();
  names.forEach((n) => EFFECTS_OFF.add(n));
}
export function refreshEffects() {
  const on = (e: { name: string }) => !EFFECTS_OFF.has(e.name);
  EFFECTS.splice(0, EFFECTS.length, ['', '효과 없음'], ...[...RENPY_SHADERS, ...SHOWPY_SHADERS].filter(on).map((e): [string, string] => [e.name, e.label || e.name]));
  TRANSITIONS.splice(0, TRANSITIONS.length, ...BASE_TRANSITIONS, ...IMAGE_FX.filter(on).map((e): [string, string] => [imageFxCode(e.name), e.label || e.name]));
}
refreshEffects();
// 목록에서 뺀 효과 (ui_kit 4.2). 예전 대본에 남은 값은 그대로 두고 내보낸다
// - typewriter, slowalpha: 렌파이에 그대로 있어서 showpy 없이도 돎
// - melt, mosh, flipin, led, split: showpy가 한 글자씩 나오기로 받아 줌 (text_effects.rpy REMOVED_EFFECTS)
const REMOVED_RENPY = ['typewriter', 'slowalpha'];
export const REMOVED_EFFECTS = [...REMOVED_RENPY, 'melt', 'mosh', 'flipin', 'led', 'split'];
// 렌파이에 들어 있는 효과. 나머지는 showpy가 있어야 한다
export const RENPY_EFFECTS = [...RENPY_SHADERS.map((e) => e.name), ...REMOVED_RENPY];
// 효과 값의 이름들: "slidein:u__dir=90|shake" → ["slidein", "shake"]
export const effectNames = (e: string) => e.split('|').map((p) => p.split(':')[0].trim()).filter(Boolean);
// 효과 값을 자리(1번, 2번)와 값으로 나눠 읽고 다시 쓴다: "slidein:u__dir=90|shake" ↔ [{slidein, [[u__dir, 90]]}, {shake, []}]
// 이름 없이 순서로 적은 값("scatter:200")은 [['', '200']]으로 그대로 둔다
export interface EffectPart { name: string; args: [string, string][] }
export function parseEffect(e?: string): EffectPart[] {
  return (e ?? '')
    .split('|')
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => {
      const [name, ...rest] = p.split(':');
      return {
        name: name.trim(),
        args: rest.map((a): [string, string] => {
          const i = a.indexOf('=');
          return i < 0 ? ['', a.trim()] : [a.slice(0, i).trim(), a.slice(i + 1).trim()];
        }),
      };
    });
}
export const formatEffect = (parts: EffectPart[]) =>
  parts
    .filter((p) => p.name)
    .map((p) => [p.name, ...p.args.map(([k, v]) => (k ? `${k}=${v}` : v))].join(':'))
    .join('|') || undefined;

// 효과의 고칠 수 있는 값(막대, 색 칸). 효과 파일에 @param이 있으면 그 범위와 이름, 없으면 기본값에서 어림한다
export interface EffectKnob { key: string; label: string; kind: 'num' | 'color'; min: number; max: number; step: number; def: string }
const KNOB_LABEL: Record<string, string> = {
  duration: '걸리는 시간', color: '색', zoom: '확대', shift: '밀림', angle: '각도', split: '갈라짐', speed: '속도', rotate: '기울기', rate: '빠르기',
  radius: '번짐 크기', distance: '거리', depth: '깊이', band: '띠', amount: '정도', strength: '세기', stagger: '차례 간격', spread: '벌어짐',
  overshoot: '넘침', hold: '계속하기', jitter: '흔들림', dir: '방향(도)', fade: '사라짐', noise: '노이즈', bounce: '튕김', amplitude: '높이',
  wavelength: '물결 길이', trail: '잔상', grain: '결', shake: '흔들림', pad: '여백', round: '둥글기', box: '상자 색', ink: '글자 색', tint: '색조',
  x: '가로', y: '세로', lag: '늦기', height: '높이', block: '칸 크기', line: '줄', scan: '주사선', tear: '찢김', offset: '어긋남', thick: '굵기',
  shade: '그늘', rise: '오름', pop: '튀어나옴', slide: '미끄러짐', span: '범위', mode: '방식', dim: '어둡기', width: '폭', from: '처음 크기',
};
const niceStep = (span: number) => (span >= 50 ? 1 : span >= 5 ? 0.1 : 0.01);
export function effectKnobs(name: string, preview = false): EffectKnob[] {
  const e = shaderEffect(name, preview);
  if (!e) return [];
  const ranges = new Map(e.params.map(([k, lo, hi, label]) => [k, { lo, hi, label }]));
  return e.uniforms.map(([key, def]): EffectKnob => {
    const short = key.replace(/^u__/, '');
    const r = ranges.get(key);
    const label = r?.label ?? KNOB_LABEL[short] ?? short;
    if (def.startsWith('#')) return { key, label, kind: 'color', min: 0, max: 0, step: 0, def };
    const d = Number(def);
    let lo = 0;
    let hi = 1;
    if (r) [lo, hi] = [r.lo, r.hi];
    else if (['dir', 'angle'].includes(short)) [lo, hi] = [0, 360];
    else if (short === 'rotate') [lo, hi] = [-180, 180];
    else if (d < 0) [lo, hi] = [d * 3, -d * 3];
    else if (d > 0) hi = d <= 1 ? Math.max(1, d * 2) : d * 3;
    return { key, label, kind: 'num', min: lo, max: hi, step: niceStep(hi - lo), def };
  });
}

// 렌파이에 원래 있는 효과만 썼는지 (showpy 없이 내보낼 수 있는지)
export const renpyOnlyEffect = (e: string) => effectNames(e).every((n) => RENPY_EFFECTS.includes(n));

// 글자가 하나씩 나올 때만 보이는 효과(@cps). 글자/초를 비워도 효과가 보이게 기본값을 쓴다 (물결, 떨림, 빛 번짐, 일렁임, VHS는 한 번에 나와도 보여서 뺀다)
export const DEFAULT_CPS = 30;
const typed = (n: string) => REMOVED_EFFECTS.includes(n) || [...RENPY_SHADERS, ...SHOWPY_SHADERS].some((e) => e.cps && e.name === n);
// 글의 일부에만 건 효과({shader=이름}글{/shader})의 이름들. text는 텍스트 태그를 켰을 때만 넘긴다
export const tagEffectNames = (text?: string) => (text ? shaderTags(text).flatMap(effectNames) : []);
export const lineCps = (s?: SayStyle, text?: string) =>
  s?.cps ?? ((s?.effect && effectNames(s.effect).some(typed)) || tagEffectNames(text).some(typed) ? DEFAULT_CPS : undefined);

// showpy가 없는 게임에서는 렌파이 원래 이름으로 내보낸다. 그러면 플러그인 없이도 오류가 나지 않는다
const NATIVE: Record<keyof SayStyle, string> = {
  size: 'what_size', font: 'what_font', color: 'what_color', cps: 'what_slow_cps', effect: 'what_textshader',
  box: '', tail: '', box_rotate: '', // 글 상자는 showpy가 있어야 해서 원래 이름이 없다 (내보내지 않음)
  name_size: 'who_size', name_font: 'who_font', name_color: 'who_color',
  x: 'what_xpos', y: 'what_ypos', name_x: 'namebox_xpos', name_y: 'namebox_ypos',
};

// 대사 줄의 괄호 안 값: size=30, cps=20 ... 위치는 showpy가 뒤에 덧붙이는 순서와 맞춰 맨 뒤에 둔다
export function sayArgs(s0?: SayStyle, native = false, text?: string): string[] {
  const tagged = tagEffectNames(text).length > 0;
  if (!s0 && !tagged) return [];
  const s: SayStyle = s0 ?? {};
  const a: string[] = [];
  const name = (k: keyof SayStyle) => (native ? NATIVE[k] : k);
  const num = (k: keyof SayStyle) => s[k] !== undefined && a.push(`${name(k)}=${s[k]}`);
  const str = (k: keyof SayStyle) => s[k] && !(native && k === 'effect' && !renpyOnlyEffect(String(s[k]))) && a.push(`${name(k)}=${pyStr(String(s[k]))}`);
  num('size');
  str('font');
  str('color');
  const cps = lineCps(s, text);
  if (cps !== undefined) a.push(`${name('cps')}=${cps}`);
  const before = a.length;
  str('effect');
  // 글의 일부에만 효과({shader=})를 쓴 줄: 줄에 등장 효과가 없으면 렌파이가 그 줄에서 멈춰서, 한 글자씩 나오기를 넣는다
  if (tagged && a.length === before) a.push(`${name('effect')}="typewriter"`);
  if (!native && s.box) {
    a.push(`box=${pyStr(s.box)}`);
    if (s.tail) a.push(`tail=${s.tail === 'none' ? 'None' : pyStr(s.tail)}`);
    if (s.box_rotate) a.push(`box_rotate=${s.box_rotate}`);
  }
  num('name_size');
  str('name_font');
  str('name_color');
  num('x');
  num('y');
  num('name_x');
  num('name_y');
  return a;
}

// 화면 효과 연출 줄의 명령. 줄이 여러 개면 \n으로 잇는다
function fxCode(f?: LineFx): string | null {
  if (!f) return null;
  const out: string[] = [];
  if (f.fx) {
    const opt: string[] = [];
    if (f.overlay) opt.push(`overlay=${f.overlay === 'on' ? 'True' : 'False'}`);
    if (f.transition) opt.push(`transition=${f.transition === 'none' ? 'None' : pyStr(f.transition)}`);
    if (f.cursor) opt.push(`cursor=${pyStr(f.cursor)}`);
    const tail = opt.join(', ');
    out.push(f.fx === 'default' ? `$ screen_fx.clear(${tail})` : `$ screen_fx.use(${[pyStr(f.fx), tail].filter(Boolean).join(', ')})`);
  } else {
    if (f.overlay) out.push(`$ screen_fx.set_overlay(${f.overlay === 'on' ? 'True' : 'False'})`);
    if (f.cursor) out.push(`$ screen_fx.set_cursor(${pyStr(f.cursor)})`);
  }
  if (f.warp) out.push(`$ screen_fx.set_warp(${warpVal(f.warp)})`);
  return out.length ? out.join('\n') : null;
}

// 이미지 이름 한 칸: 공백 정리
const words = (s?: string) => (s ?? '').trim().replace(/\s+/g, ' ');
const pyStr = (s: string) => '"' + s.replace(/\\/g, '\\\\').replace(/"/g, '\\"') + '"';
// 파일 이름만 적으면 game/audio 폴더에서 찾는다
const audioPath = (f: string) => (f.includes('/') ? f : 'audio/' + f);

export function imageName(l: Line) {
  const k = l.kind ?? 'char';
  if (k === 'bg') return words(l.image) ? 'bg ' + words(l.image) : '';
  if (k === 'char') return l.who ? [l.who, words(l.attr)].filter(Boolean).join(' ') : '';
  return words(l.image);
}

// code가 null이면 칸이 덜 채워진 것이고, problem에 이유가 있다
export function stageCode(l: Line): { code: string | null; problem: string | null } {
  const w = l.trans ? ` with ${l.trans}` : '';
  const need = (what: string) => ({ code: null, problem: what });
  switch (l.type) {
    case 'scene': {
      const n = words(l.image);
      return { code: `scene${n ? ' bg ' + n : ''}${w}`, problem: null };
    }
    case 'show': {
      const n = imageName(l);
      if (!n) return need(l.kind === 'char' || !l.kind ? '보일 캐릭터를 골라 주세요' : '보일 이미지 이름을 적어 주세요');
      return { code: `show ${n}${l.at ? ' at ' + l.at : ''}${w}`, problem: null };
    }
    case 'hide': {
      const k = l.kind ?? 'char';
      const tag = k === 'bg' ? 'bg' : k === 'char' ? l.who : words(l.image).split(' ')[0];
      if (!tag) return need(k === 'char' ? '숨길 캐릭터를 골라 주세요' : '숨길 이미지 이름을 적어 주세요');
      return { code: `hide ${tag}${w}`, problem: null };
    }
    case 'music':
      if (l.stop) return { code: 'stop music fadeout 1.0', problem: null };
      if (!l.file?.trim()) return need('음악 파일 이름을 적어 주세요');
      return { code: `play music ${pyStr(audioPath(l.file.trim()))}`, problem: null };
    case 'sound':
      if (!l.file?.trim()) return need('효과음 파일 이름을 적어 주세요');
      return { code: `play sound ${pyStr(audioPath(l.file.trim()))}`, problem: null };
    case 'fx': {
      const c = fxCode(l.fx);
      return c ? { code: c, problem: null } : need('바꿀 값을 골라 주세요');
    }
  }
  return { code: null, problem: null };
}

// 렌파이 이미지 이름에 쓰면 탈이 나기 쉬운 글자(한글, 공백 외 기호)
export function badImageName(l: Line) {
  if (l.type !== 'scene' && l.type !== 'show' && l.type !== 'hide') return false;
  if (l.type !== 'scene' && (l.kind ?? 'char') === 'char') return l.type === 'show' && !!l.attr && !/^[A-Za-z0-9_ -]*$/.test(l.attr.trim());
  return !/^[A-Za-z0-9_ -]*$/.test(l.image?.trim() ?? '');
}
