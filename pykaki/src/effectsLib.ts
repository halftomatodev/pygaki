// 효과 관리: 기본 / 프로젝트 / 모음의 효과를 한 목록으로 모으고, 켜고 끄기, 넣기, 빼기, 대본에서 이름 바꾸기를 한다.
// 화면([효과] 탭)은 이 파일의 함수만 부른다. 형식은 docs/LINK.md 8장.
// - 기본 효과: showpy ui_kit/engine/text_effects.glsl과 렌파이 효과. 뺄 수 없고 끄기만 된다
// - 프로젝트 효과: 연결한 게임의 game/ui_kit/effects/*.glsl
// - 효과 모음: 앱에 같이 든 파일(샘플 + showpy/effects_library). [넣기]로 프로젝트에 복사한다
import type { Line, Project } from './types';
import { checkPack, IMAGE_FX, LIBRARY_PACKS, RENPY_SHADERS, SAMPLE_PACKS, SHOWPY_SHADERS, type EffectPack, type ShaderEffect } from './fx/textShaders';
import { effectNames, effectOff, formatEffect, parseEffect } from './stage';
import { EFFECTS_OFF_FILE, folderAllowed, folderReady, readFxFile, removeFxFile, scanFolder, useGameFolder, writeFxFile } from './gameFolder';
import { useStore } from './store';

export type FxKind = 'effect' | 'transition'; // 글자 효과 / 그림 효과
export type FxSource = 'renpy' | 'base' | 'project' | 'library';

export interface EffectCard {
  name: string;
  label: string; // 한글 이름
  kind: FxKind;
  source: FxSource;
  file?: string; // 프로젝트 효과와 모음: 파일 이름
  ready: boolean; // 지금 쓸 수 있는지. 모음에서 아직 넣지 않은 것은 false
  on: boolean; // 고르는 목록에 나오는지 (끄지 않았는지)
  uses: number; // 대본에서 쓰인 줄 수
  params: number; // 막대로 고칠 수 있는 값의 수
}

export interface EffectUse { nodeId: string; lineId: string }

// 플러그인이 있는 게임 폴더를 연결했는지. 아니면 구경만 한다
export const effectsLinked = () => folderReady() && useGameFolder.getState().hasShowpy;

// ── 대본에서 쓰인 곳 ──
const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
// 글에 직접 적은 효과 값: 명령 줄의 effect="…", 대사 글의 {shader=…}
const SPEC_IN_CODE = /((?:effect|textshader)\s*=\s*)(["'])(.*?)\2/g;
const SPEC_IN_TAG = /(\{shader=)([^}]*)(\})/g;
const imgFxCall = (name: string) => new RegExp(`img_fx\\.use\\(\\s*["']${esc(name)}["'][^)]*\\)`, 'g');

function textSpecs(l: Line): string[] {
  const out: string[] = [];
  const t = l.text ?? '';
  if (l.type === 'command') for (const m of t.matchAll(SPEC_IN_CODE)) out.push(m[3]);
  if (l.type === 'command' || l.type === 'say' || l.type === 'narration') for (const m of t.matchAll(SPEC_IN_TAG)) out.push(m[2]);
  return out;
}

function lineUses(l: Line, kind: FxKind, name: string) {
  if (kind === 'transition') return (!!l.trans && imgFxCall(name).test(l.trans)) || (l.type === 'command' && imgFxCall(name).test(l.text ?? ''));
  if (l.say?.effect && effectNames(l.say.effect).includes(name)) return true;
  return textSpecs(l).some((s) => effectNames(s).includes(name));
}

export function effectUses(p: Project, kind: FxKind, name: string): EffectUse[] {
  const out: EffectUse[] = [];
  for (const n of p.nodes) for (const l of n.lines) if (lineUses(l, kind, name)) out.push({ nodeId: n.id, lineId: l.id });
  return out;
}

// ── 목록 ──
const card = (e: ShaderEffect, source: FxSource, ready: boolean, p: Project): EffectCard => ({
  name: e.name,
  label: e.label || e.name,
  kind: e.kind,
  source,
  file: e.file,
  ready,
  on: !effectOff(e.name),
  uses: effectUses(p, e.kind, e.name).length,
  params: e.uniforms.length,
});

const allPacks = (): EffectPack[] => [...SAMPLE_PACKS, ...LIBRARY_PACKS.filter((l) => !SAMPLE_PACKS.some((s) => s.name === l.name))];

// 기본 → 프로젝트 → 모음(아직 넣지 않은 것) 순서. 폴더를 연결하지 않았으면 샘플은 쓸 수 있는 모음으로 나온다
export function effectCatalog(p: Project = useStore.getState().project): EffectCard[] {
  const linked = effectsLinked();
  const out: EffectCard[] = RENPY_SHADERS.map((e) => card(e, 'renpy', true, p));
  const mine = [...SHOWPY_SHADERS, ...IMAGE_FX];
  out.push(...mine.filter((e) => !e.file).map((e) => card(e, 'base', true, p)));
  out.push(...mine.filter((e) => e.file).map((e) => card(e, linked ? 'project' : 'library', true, p)));
  const inProject = new Set((linked ? useGameFolder.getState().fxFiles : mine.map((e) => e.file ?? '')).map((f) => f.toLowerCase()));
  for (const pack of allPacks()) {
    if (inProject.has(pack.name.toLowerCase())) continue;
    try {
      out.push(...checkPack(pack.name, pack.text).map((e) => card(e, 'library', false, p)));
    } catch (e) {
      console.warn('효과 모음의 파일을 못 읽었어요', pack.name, e); // 이름이 프로젝트 효과와 겹치는 것도 여기로
    }
  }
  return out;
}

// ── 대본에서 이름 바꾸기 ──
// to: 글자 효과는 효과 이름, 그림 효과는 "나타나는 방식" 값(dissolve, img_fx.use("irisin") …). ''이면 그 효과만 뺀다.
// 칸으로 고른 값은 다 바꾸고, 글에 직접 적은 값(명령 줄, {shader=} 태그)은 to가 있을 때만 바꾼다(빼면 문법이 깨질 수 있어서). left는 그렇게 남은 줄 수
export function replaceInProject(p: Project, kind: FxKind, from: string, to: string): { changed: number; left: number } {
  let changed = 0;
  let left = 0;
  const swapSpec = (spec: string) => {
    const parts = parseEffect(spec);
    const next = parts.flatMap((part) => (part.name !== from ? [part] : to && !parts.some((q) => q.name === to) ? [{ name: to, args: [] }] : []));
    return formatEffect(next);
  };
  for (const n of p.nodes)
    for (const l of n.lines) {
      if (!lineUses(l, kind, from)) continue;
      let hit = false;
      if (kind === 'transition') {
        if (l.trans && imgFxCall(from).test(l.trans)) {
          if (to) l.trans = to;
          else delete l.trans;
          hit = true;
        }
        if (l.type === 'command' && imgFxCall(from).test(l.text ?? '')) {
          if (to) {
            l.text = l.text.replace(imgFxCall(from), to);
            hit = true;
          } else left++;
        }
      } else {
        if (l.say?.effect && effectNames(l.say.effect).includes(from)) {
          const v = swapSpec(l.say.effect);
          if (v) l.say.effect = v;
          else delete l.say.effect;
          if (!Object.keys(l.say).length) delete l.say;
          hit = true;
        }
        if (textSpecs(l).some((s) => effectNames(s).includes(from))) {
          if (to) {
            const fix = (s: string) => (effectNames(s).includes(from) ? swapSpec(s) ?? '' : s);
            if (l.type === 'command') l.text = l.text.replace(SPEC_IN_CODE, (_m, a, q, s) => a + q + fix(s) + q);
            l.text = l.text.replace(SPEC_IN_TAG, (_m, a, s, z) => a + fix(s) + z);
            hit = true;
          } else left++;
        }
      }
      if (hit) changed++;
    }
  return { changed, left };
}

// 지금 대본에서 바꾼다 (실행 취소 한 번)
export function replaceEffect(kind: FxKind, from: string, to: string) {
  let res = { changed: 0, left: 0 };
  if (effectUses(useStore.getState().project, kind, from).length) useStore.getState().update((p) => void (res = replaceInProject(p, kind, from, to)));
  return res;
}

// ── 파일 다루기 (연결한 프로젝트가 있어야 함) ──
export type FxResult<T = {}> = ({ ok: true } & T) | { ok: false; why: string; exists?: boolean };
const fail = (why: string, exists?: boolean): { ok: false; why: string; exists?: boolean } => ({ ok: false, why, exists });
const message = (e: any) => String(e?.message ?? e);

async function blocked(): Promise<string | null> {
  if (!folderReady()) return '프로젝트를 연결하면 쓸 수 있어요';
  if (!useGameFolder.getState().hasShowpy) return '이 게임에 pygaki 플러그인(ui_kit 폴더)이 없어요';
  if (!(await folderAllowed(true))) return '게임 폴더를 고칠 권한을 받지 못했어요';
  return null;
}

// 켜기/끄기: effects_off.txt를 고친다. 적혀 있던 설명 줄과 다른 이름은 그대로 둔다
export async function setEffectOn(name: string, on: boolean): Promise<FxResult> {
  const why = await blocked();
  if (why) return fail(why);
  if (!/^[a-z][a-z0-9_]*$/.test(name)) return fail('효과 이름이 아니에요: ' + name);
  try {
    const old = (await readFxFile(EFFECTS_OFF_FILE)) ?? '';
    const nameOf = (row: string) => row.split('#')[0].trim();
    let rows = old.trim() ? old.replace(/﻿/g, '').split(/\r?\n/) : ['# 끈 효과. 한 줄에 이름 하나 (고르는 목록에서만 빠지고, 이미 쓴 대사는 그대로 돌아요)'];
    while (rows.length && !rows[rows.length - 1].trim()) rows.pop();
    if (on) rows = rows.filter((r) => nameOf(r) !== name);
    else if (!rows.some((r) => nameOf(r) === name)) rows.push(name);
    const text = rows.join('\n') + '\n';
    if (text !== old) await writeFxFile(EFFECTS_OFF_FILE, text);
    await scanFolder();
    return { ok: true };
  } catch (e) {
    return fail('끈 효과 목록을 쓰지 못했어요: ' + message(e));
  }
}

// 파일 넣기: 형식을 먼저 검사하고, 틀리면 아무것도 쓰지 않는다. 같은 이름의 파일이 있으면 overwrite일 때만 바꿔 넣는다
export async function addEffectFile(file: string, text: string, opt: { overwrite?: boolean } = {}): Promise<FxResult<{ file: string; effects: { name: string; label: string; kind: FxKind }[] }>> {
  const why = await blocked();
  if (why) return fail(why);
  if (!/^[A-Za-z0-9_-]+\.glsl$/.test(file)) return fail('파일 이름은 영어, 숫자, _, -만 쓰고 .glsl로 끝나야 해요: ' + file);
  await scanFolder(); // 밖에서 폴더를 고쳤을 수 있다
  const had = useGameFolder.getState().fxFiles.find((f) => f.toLowerCase() === file.toLowerCase());
  const as = had ?? file;
  let found: ShaderEffect[];
  try {
    found = checkPack(as, text);
  } catch (e) {
    return fail(`${file}: ${message(e)}`);
  }
  if (had && !opt.overwrite) return fail('같은 이름의 파일이 효과 폴더에 이미 있어요: ' + had, true);
  try {
    await writeFxFile(as, text);
    await scanFolder();
  } catch (e) {
    return fail('효과 파일을 쓰지 못했어요: ' + message(e));
  }
  return { ok: true, file: as, effects: found.map((e) => ({ name: e.name, label: e.label || e.name, kind: e.kind })) };
}

// 넣기: 모음의 파일을 프로젝트의 효과 폴더에 복사한다
export function addFromLibrary(file: string, opt: { overwrite?: boolean } = {}) {
  const pack = allPacks().find((x) => x.name === file);
  if (!pack) return Promise.resolve(fail('효과 모음에 없는 파일이에요: ' + file));
  return addEffectFile(pack.name, pack.text, opt);
}

// 빼기: 프로젝트 효과 파일을 지운다(백업을 남김). replace에 { 효과 이름: 바꿀 값 }을 주면 대본에서 그 효과를 쓰던 줄도 바꾼다.
// 바꿀 값은 replaceInProject의 to와 같다. replace가 없으면 대본은 그대로 둔다 (그냥 빼기)
export async function removeEffectFile(file: string, replace?: Record<string, string>): Promise<FxResult<{ backup: string; changed: number; left: number }>> {
  const why = await blocked();
  if (why) return fail(why);
  await scanFolder();
  if (!useGameFolder.getState().fxFiles.includes(file)) return fail('효과 폴더에 그 파일이 없어요: ' + file);
  const inside = [...SHOWPY_SHADERS, ...IMAGE_FX].filter((e) => e.file === file).map((e) => ({ name: e.name, kind: e.kind }));
  for (const e of inside) {
    const to = replace?.[e.name];
    if (to && inside.some((x) => x.name === to || to.includes(`"${x.name}"`))) return fail('같이 빠지는 효과로는 바꿀 수 없어요: ' + to);
  }
  let backup: string;
  try {
    backup = await removeFxFile(file);
  } catch (e) {
    return fail('효과 파일을 지우지 못했어요: ' + message(e));
  }
  let changed = 0;
  let left = 0;
  if (replace) {
    const todo = inside.filter((e) => e.name in replace && effectUses(useStore.getState().project, e.kind, e.name).length);
    if (todo.length)
      useStore.getState().update((p) => {
        for (const e of todo) {
          const r = replaceInProject(p, e.kind, e.name, replace[e.name]);
          changed += r.changed;
          left += r.left;
        }
      });
  }
  await scanFolder();
  return { ok: true, backup, changed, left };
}

// 자동 확인(app/smoke.cjs)과 개발자 도구에서 부를 수 있게 내놓는다. [효과] 화면이 생기기 전에도 한 바퀴 돌려 볼 수 있다
(window as any).pykakiEffects = { catalog: effectCatalog, uses: (kind: FxKind, name: string) => effectUses(useStore.getState().project, kind, name), setOn: setEffectOn, addFile: addEffectFile, addFromLibrary, remove: removeEffectFile, replace: replaceEffect };
