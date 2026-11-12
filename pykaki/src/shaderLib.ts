// 화면 셰이더 다루기 ([효과] 화면의 [셰이더] 칸이 쓴다. docs/LINK.md 11장).
// 목록은 shader.ts가 게임 폴더의 screen_fx/shader_list.json(없으면 앱에 든 것)에서 읽어 둔 것이고,
// 여기서는 쓰인 곳 세기와 켜기/끄기(screen_fx/shaders_off.txt)를 한다.
import type { Project } from './types';
import { shaderList, shaderOff, type ShaderInfo } from './shader';
import { SHADERS_OFF_FILE, folderAllowed, folderReady, readSfxFile, scanFolder, writeSfxFile } from './gameFolder';
import type { FxResult } from './effectsLib';

export interface ShaderCard extends ShaderInfo {
  on: boolean; // 고르는 목록에 나오는지
  uses: number; // 이 셰이더를 건 상자와 label 수
}
export interface ShaderUse {
  kind: 'box' | 'label';
  id: string;
  title: string;
  slot: 1 | 2;
}

// 이 셰이더를 1번이나 2번에 정해 둔 상자와 label
export function shaderUses(p: Project, id: string): ShaderUse[] {
  const rv: ShaderUse[] = [];
  const push = (kind: 'box' | 'label', oid: string, title: string, sh?: { a: string; b: string }) => {
    if (sh?.a === id) rv.push({ kind, id: oid, title, slot: 1 });
    else if (sh?.b === id) rv.push({ kind, id: oid, title, slot: 2 });
  };
  for (const g of p.labels) push('label', g.id, g.title ? `${g.title} (${g.name})` : g.name, g.shader);
  for (const n of p.nodes) push('box', n.id, n.title || '(이름 없는 상자)', n.shader);
  return rv;
}

export function shaderCatalog(p: Project): ShaderCard[] {
  return shaderList().map((s) => ({ ...s, on: !shaderOff(s.id), uses: shaderUses(p, s.id).length }));
}

// 켜고 끌 수 없는 까닭. 없으면 null
export async function shaderBlocked(ask = false): Promise<string | null> {
  if (!folderReady()) return '프로젝트를 연결하면 쓸 수 있어요';
  if (ask && !(await folderAllowed(true))) return '게임 폴더를 고칠 권한을 받지 못했어요';
  if ((await readSfxFile('README.md')) === null && (await readSfxFile('shader_list.json')) === null) return '이 게임에 화면 효과 플러그인(screen_fx 폴더)이 없어요';
  return null;
}

// 켜기/끄기: shaders_off.txt를 고친다. 적혀 있던 설명 줄과 다른 이름은 그대로 둔다 (effectsLib.ts setEffectOn과 같은 규칙)
export async function setShaderOn(id: string, on: boolean): Promise<FxResult> {
  const why = await shaderBlocked(true);
  if (why) return { ok: false, why };
  if (!/^[a-z][a-z0-9_]*$/i.test(id)) return { ok: false, why: '셰이더 이름이 아니에요: ' + id };
  try {
    const old = (await readSfxFile(SHADERS_OFF_FILE)) ?? '';
    const nameOf = (row: string) => row.split('#')[0].trim();
    let rows = old.trim() ? old.replace(/﻿/g, '').split(/\r?\n/) : ['# 끈 셰이더. 한 줄에 이름 하나 (고르는 목록에서만 빠지고, 이미 쓴 원고는 그대로 돌아요)'];
    while (rows.length && !rows[rows.length - 1].trim()) rows.pop();
    if (on) rows = rows.filter((r) => nameOf(r) !== id);
    else if (!rows.some((r) => nameOf(r) === id)) rows.push(id);
    const text = rows.join('\n') + '\n';
    if (text !== old) await writeSfxFile(SHADERS_OFF_FILE, text);
    await scanFolder();
    return { ok: true };
  } catch (e: any) {
    return { ok: false, why: '끈 셰이더 목록을 쓰지 못했어요: ' + String(e?.message ?? e) };
  }
}

// 자동 확인(app/smoke.cjs)과 개발자 도구에서 부를 수 있게
if (typeof window !== 'undefined') Object.assign(((window as any).pykakiShaders ??= {}), { setOn: setShaderOn, uses: shaderUses });
