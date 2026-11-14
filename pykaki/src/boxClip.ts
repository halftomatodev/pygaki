// 상자 복사·붙여넣기·복제 (Ctrl+C, Ctrl+V, Ctrl+D). 모두 store.update() 안에서 복사본(draft)에 대해 부른다.
// 클립보드에는 상자 JSON을 글자로 넣는다(앱 창 두 개 사이, 다른 대본에도 붙일 수 있게). 대본 형식(.flow.json)은 안 바뀐다.
import type { BoxNode, Project } from './types';
import { addGroup, exitLinks, findBox, fixEntries, nextBoxId, setLink } from './ops';
import { uid } from './util';

const MARK = 'pykaki-boxes';

export interface BoxClip {
  [MARK]: 1;
  nodes: BoxNode[];
}

// 고른 상자들을 클립보드 글자로 (상자가 없으면 null)
export function copyText(p: Project, ids: string[]): string | null {
  const nodes = p.nodes.filter((n) => ids.includes(n.id));
  if (!nodes.length) return null;
  const clip: BoxClip = { [MARK]: 1, nodes: structuredClone(nodes) };
  return JSON.stringify(clip);
}

// 클립보드 글자가 상자 묶음이면 읽음
export function readClip(text: string | null | undefined): BoxClip | null {
  if (!text || !text.includes(MARK)) return null;
  try {
    const c = JSON.parse(text);
    return c && c[MARK] === 1 && Array.isArray(c.nodes) && c.nodes.length ? (c as BoxClip) : null;
  } catch {
    return null;
  }
}

// 상자 묶음을 붙임. at: 묶음의 왼쪽 위가 갈 자리(없으면 원래 자리에서 조금 옆). 새 상자 id 목록을 돌려줌
// - 상자 id, 줄 id, 선택지·조건 갈래 id는 새로 만든다 (원고의 label 이름과 줄 표시가 겹치지 않게)
// - 같이 복사한 상자끼리 잇는 선은 새 상자끼리 다시 잇고, 밖으로 가는 선은 원래 상자를 그대로 (이 대본에 없으면 끊음)
// - label이 이 대본에 없으면 첫 label에 넣음
export function pasteClip(p: Project, clip: BoxClip, at?: { x: number; y: number } | null): string[] {
  const src = clip.nodes;
  const map = new Map<string, string>();
  const made: BoxNode[] = [];
  const minX = Math.min(...src.map((n) => n.pos.x));
  const minY = Math.min(...src.map((n) => n.pos.y));
  const dx = at ? at.x - minX : 40;
  const dy = at ? at.y - minY : 40;
  let fallbackGroup: string | null = null;
  for (const o of src) {
    const b: BoxNode = structuredClone(o);
    b.id = nextBoxId(p);
    map.set(o.id, b.id);
    if (!p.labels.some((g) => g.id === b.group)) {
      fallbackGroup ??= p.labels[0]?.id ?? addGroup(p);
      b.group = fallbackGroup;
    }
    b.pos = { x: Math.round(o.pos.x + dx), y: Math.round(o.pos.y + dy) };
    b.lines = b.lines.map((l) => ({ ...l, id: uid('l') }));
    if (b.exit.type === 'menu') b.exit.choices = b.exit.choices.map((c) => ({ ...c, id: uid('c') }));
    if (b.exit.type === 'if') b.exit.branches = b.exit.branches.map((c) => ({ ...c, id: uid('b') }));
    p.nodes.push(b); // 다음 nextBoxId가 이 번호 다음을 주게 바로 넣음
    made.push(b);
  }
  for (const b of made) {
    for (const l of exitLinks(b)) {
      if (!l.target) continue;
      const t = map.get(l.target) ?? (findBox(p, l.target) && !made.some((m) => m.id === l.target) ? l.target : null);
      setLink(b, l.handle, t);
    }
  }
  fixEntries(p);
  if (!p.project.startNode) p.project.startNode = made[0]?.id ?? null;
  return made.map((b) => b.id);
}
