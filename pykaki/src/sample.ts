import type { Project } from './types';
import { fixEntries, newChoice } from './ops';
import { PALETTE, uid } from './util';
import { normalizeFlags } from './flags';

const defaults = (): Project => ({
  format: 'renpy-flow',
  version: 1,
  project: { title: '새 대본', startNode: null },
  characters: [],
  variables: [],
  labels: [],
  layout: { direction: 'TB' },
  settings: { escapeBrackets: true, allowTextTags: true, escapePercent: true, renpyLink: false },
  nodes: [],
});

export function createEmpty(): Project {
  const p = defaults();
  p.labels.push({ id: uid('g'), name: 'prologue', title: '프롤로그', color: PALETTE[0], entry: null });
  const id = 'n01';
  p.nodes.push({
    id, group: p.labels[0].id, title: '시작', pos: { x: 0, y: 0 },
    lines: [{ id: uid('l'), type: 'narration', text: '' }],
    exit: { type: 'next', target: null },
  });
  p.labels[0].entry = id;
  p.project.startNode = id;
  return p;
}

export function createSample(): Project {
  const p = defaults();
  p.project = { title: '예제: 비 오는 날', startNode: 'n1' };
  p.characters = [{ id: 'a', name: '앨리스', color: '#ff8fb1' }];
  p.variables = [{ id: 'v1', name: 'kindness', kind: 'int', init: 0, note: '친절 점수. 우산을 빌려주면 오름' }];
  p.labels = [
    { id: 'g1', name: 'scene_rain', title: '비 오는 날', color: PALETTE[0], entry: 'n1' },
    { id: 'g2', name: 'ending_kind', title: '친절 엔딩', color: PALETTE[1], entry: 'n4' },
    { id: 'g3', name: 'talk_weather', title: '날씨 잡담 (call)', color: PALETTE[2], entry: 'n6' },
  ];
  const c1 = newChoice('n4', '우산을 빌려준다');
  c1.actions = ['kindness += 1'];
  const c2 = newChoice('n3', '모른 척한다');
  const c3 = newChoice('n5', '날씨 이야기를 한다');
  p.nodes = [
    {
      id: 'n1', group: 'g1', title: '도입', pos: { x: 0, y: 0 },
      lines: [
        { id: 'l1', type: 'scene', text: '', image: 'street rain', trans: 'fade' },
        { id: 'l11', type: 'music', text: '', file: 'rain.ogg' },
        { id: 'l2', type: 'narration', text: '비가 내리고 있었다.' },
        { id: 'l3', type: 'say', who: 'a', attr: 'smile', text: '우산 있어?' },
      ],
      exit: { type: 'next', target: 'n2' },
    },
    {
      id: 'n2', group: 'g1', title: '고민', pos: { x: 0, y: 220 },
      lines: [{ id: 'l4', type: 'narration', text: '앨리스가 나를 쳐다본다.' }],
      exit: { type: 'menu', choices: [c1, c2, c3] },
    },
    {
      id: 'n3', group: 'g1', title: '모른 척', pos: { x: 0, y: 460 },
      lines: [
        { id: 'l5', type: 'say', who: 'a', text: '...그렇구나.' },
        { id: 'l6', type: 'narration', text: '앨리스는 빗속으로 뛰어갔다.' },
      ],
      exit: { type: 'return' },
    },
    {
      id: 'n5', group: 'g1', title: '잡담', pos: { x: 300, y: 460 },
      lines: [{ id: 'l7', type: 'say', who: 'a', text: '갑자기 날씨 얘기?' }],
      exit: { type: 'call', target: 'n6', then: 'n2' },
    },
    {
      id: 'n4', group: 'g2', title: '빌려준다', pos: { x: -320, y: 460 },
      lines: [
        { id: 'l8', type: 'say', who: 'a', attr: 'happy', text: '고마워! {b}정말로{/b}.' },
        { id: 'l9', type: 'note', text: '여기서 BGM 밝게' },
      ],
      exit: { type: 'return' },
    },
    {
      id: 'n6', group: 'g3', title: '비 냄새', pos: { x: 300, y: 700 },
      lines: [{ id: 'l10', type: 'narration', text: '비 냄새가 났다. [대괄호도 글자 그대로 나와요]' }],
      exit: { type: 'return' },
    },
  ];
  return p;
}

// 불러온 JSON의 빠진 값을 채운다
export function normalizeProject(raw: any): Project {
  if (!raw || raw.format !== 'renpy-flow' || !Array.isArray(raw.nodes)) throw new Error('pygaki 대본 파일이 아니에요.');
  const d = defaults();
  const p: Project = {
    ...d,
    ...raw,
    project: { ...d.project, ...raw.project },
    settings: { ...d.settings, ...raw.settings },
    layout: { ...d.layout, ...raw.layout },
    characters: raw.characters ?? [],
    variables: normalizeFlags(raw.variables),
    labels: raw.labels ?? [],
  };
  if (!p.labels.length && p.nodes.length) p.labels.push({ id: uid('g'), name: 'chapter_1', title: '', color: PALETTE[0], entry: null });
  for (const n of p.nodes) {
    if (!p.labels.some((l) => l.id === n.group)) n.group = p.labels[0].id;
    n.lines ??= [];
    for (const l of n.lines) if (typeof l.text !== 'string') l.text = '';
    n.exit ??= { type: 'return' };
    n.pos ??= { x: 0, y: 0 };
  }
  // 없는 상자를 가리키는 흐름은 "연결 안 됨"으로 돌린다 (손으로 고친 파일, 상자가 잘린 파일에서 화면이 멈추지 않게)
  const ids = new Set(p.nodes.map((n) => n.id));
  const live = (t: unknown) => (typeof t === 'string' && ids.has(t) ? t : null);
  for (const n of p.nodes) {
    const e = n.exit as any;
    if (e.type === 'next') e.target = live(e.target);
    else if (e.type === 'menu') {
      e.choices = Array.isArray(e.choices) ? e.choices : [];
      for (const c of e.choices) {
        c.target = live(c.target);
        c.mode = 'jump';
        c.condition = typeof c.condition === 'string' && c.condition.trim() ? c.condition : null;
        c.actions = Array.isArray(c.actions) ? c.actions.filter((a: unknown) => typeof a === 'string') : [];
      }
    } else if (e.type === 'if') {
      e.branches = Array.isArray(e.branches) ? e.branches : [];
      for (const c of e.branches) {
        c.target = live(c.target);
        c.cond = typeof c.cond === 'string' ? c.cond : '';
      }
      e.else = live(e.else);
    } else if (e.type === 'call') {
      e.target = live(e.target);
      e.then = live(e.then);
    } else if (e.type !== 'return') n.exit = { type: 'return' };
  }
  p.project.startNode = live(p.project.startNode);
  fixEntries(p);
  moveUi(p);
  return p;
}

// FEATURE 9까지의 대본: 상자·label의 대사 속도·소리(ui.cps, ui.sound)는 그 상자의 대사·내레이션 줄 가운데
// 따로 정하지 않은 줄로, label의 커서·클릭 대기(ui.ctc, ui.cursor)는 따로 정하지 않은 상자로 옮겨 적는다
function moveUi(p: Project) {
  const gu = new Map<string, any>(p.labels.map((g: any) => [g.id, g.ui ?? {}]));
  for (const n of p.nodes) {
    const m: any = n.ui ?? {};
    const g = gu.get(n.group) ?? {};
    const pick = (k: string) => (k in m ? m[k] : g[k]);
    const cps = pick('cps');
    const sound = pick('sound');
    if (cps !== undefined || sound !== undefined)
      for (const l of n.lines) {
        if (l.type !== 'say' && l.type !== 'narration') continue;
        const say = { ...(l.say ?? {}) };
        if (typeof cps === 'number' && say.cps === undefined) say.cps = cps;
        if (typeof sound === 'string' && say.sound === undefined) say.sound = sound;
        if (Object.keys(say).length) l.say = say;
      }
    const ui: Record<string, string> = {};
    for (const k of ['ctc', 'cursor']) {
      const v = pick(k);
      if (typeof v === 'string' && v) ui[k] = v;
    }
    if (Object.keys(ui).length) n.ui = ui;
    else delete n.ui;
  }
  for (const g of p.labels as any[]) delete g.ui;
}
