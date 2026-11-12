// 프로젝트 → .rpy 변환과 검사. 설계 문서 6장 참고.
import type { BoxNode, LabelGroup, Line, Project, Settings } from './types';
import { exitLinks, fallTarget } from './ops';
import { IDENT, PLUGIN_NAMES, RESERVED } from './util';
import { badImageName, renpyOnlyEffect, fxArgs, isStage, sayArgs, stageCode, tagEffectNames, REMOVED_EFFECTS, RENPY_EFFECTS } from './stage';
import { shaderEffect } from './fx/textShaders';
import { checkTags, shaderTags } from './tagEdit';
import { enterTransTv, shaderCode, shaderOfBox, usesShaderValues, usesShaders, usesTvValues, valuesSupported } from './shader';

export interface Warn { level: 'error' | 'warn'; msg: string; nodeId?: string }

export function escapeText(t: string, s: Settings) {
  let r = t.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
  if (s.escapeBrackets) r = r.replace(/\[/g, '[[');
  if (!s.allowTextTags) r = r.replace(/\{/g, '{{');
  if (s.escapePercent) r = r.replace(/%/g, '%%');
  return r.replace(/\r?\n/g, '\\n');
}

const pyStr = (s: string) => '"' + s.replace(/\\/g, '\\\\').replace(/"/g, '\\"') + '"';
const oneLine = (s: string) => s.replace(/\s+/g, ' ').trim();

// label 안의 상자 순서: 첫 상자부터, "다음으로" 이어지는 상자는 바로 뒤에 붙인다
function orderGroup(p: Project, g: LabelGroup, byId: Map<string, BoxNode>): BoxNode[] {
  const members = p.nodes.filter((n) => n.group === g.id);
  if (!members.length) return [];
  const inG = new Set(members.map((n) => n.id));
  const entry = g.entry && inG.has(g.entry) ? g.entry : members[0].id;

  const visit: string[] = [];
  const seen = new Set([entry]);
  const q = [entry];
  while (q.length) {
    const id = q.shift()!;
    visit.push(id);
    for (const l of exitLinks(byId.get(id)!))
      if (l.target && inG.has(l.target) && !seen.has(l.target)) {
        seen.add(l.target);
        q.push(l.target);
      }
  }
  for (const m of members) if (!seen.has(m.id)) visit.push(m.id);

  const placed = new Set<string>();
  const out: BoxNode[] = [];
  for (const start of visit) {
    let cur: string | null = start;
    while (cur && inG.has(cur) && !placed.has(cur)) {
      placed.add(cur);
      const b = byId.get(cur)!;
      out.push(b);
      cur = fallTarget(b);
    }
  }
  return out;
}

// 번역 문자열로 해석되어 멈추는 % (%% 는 괜찮다)
const loosePercent = (t: string) => /%/.test(t.replace(/%%/g, ''));

// 줄 끝에 표시를 붙여도 되는 줄인지: 다음 줄로 이어지는 줄(끝의 \, 닫지 않은 따옴표)에는 붙이지 않는다
function tailSafe(row: string) {
  if (/\\\s*$/.test(row)) return false;
  let q = '';
  for (let i = 0; i < row.length; i++) {
    const c = row[i];
    if (q) {
      if (c === '\\') i++;
      else if (row.startsWith(q, i)) (i += q.length - 1), (q = '');
    } else if (c === '#') return true;
    else if (c === '"' || c === "'" || c === '`') q = row.startsWith(c.repeat(3), i) ? c.repeat(3) : c, (i += q.length - 1);
  }
  return !q;
}

// endMarks: 줄 표시(# @l:, # @node:, # @end:)를 윗줄이 아니라 줄 끝에 붙인다 (docs/LINK.md 2장).
// 연결한 게임의 pygaki 플러그인이 ui_kit 4.5 이상일 때만 켠다 (그 전 판은 윗줄 표시만 읽는다)
export function generateRpy(p: Project, opts: { endMarks?: boolean } = {}): { code: string; warnings: Warn[] } {
  const endMarks = !!opts.endMarks && p.settings.renpyLink;
  const W: Warn[] = [];
  const out: string[] = [];
  const byId = new Map(p.nodes.map((n) => [n.id, n]));
  const groupById = new Map(p.labels.map((g) => [g.id, g]));
  const charById = new Map(p.characters.map((c) => [c.id, c]));
  const S = p.settings;

  // 이름 검사
  const names = new Set<string>();
  for (const g of p.labels) {
    const at = g.entry ?? undefined;
    if (!IDENT.test(g.name) || RESERVED.has(g.name))
      W.push({ level: 'error', msg: `label 이름 "${g.name}"은 쓸 수 없어요 (영문·숫자·_만, 숫자로 시작 불가, 예약어 불가)`, nodeId: at });
    if (names.has(g.name)) W.push({ level: 'error', msg: `label 이름 "${g.name}"이 중복돼요`, nodeId: at });
    names.add(g.name);
  }
  const cids = new Set<string>();
  for (const c of p.characters) {
    if (!IDENT.test(c.id) || RESERVED.has(c.id)) W.push({ level: 'error', msg: `캐릭터 id "${c.id}"는 쓸 수 없어요` });
    if (cids.has(c.id)) W.push({ level: 'error', msg: `캐릭터 id "${c.id}"가 중복돼요` });
    if (S.renpyLink && PLUGIN_NAMES.has(c.id)) W.push({ level: 'error', msg: `캐릭터 id "${c.id}"는 pygaki 플러그인이 쓰는 이름과 겹쳐요. 다른 이름으로 바꿔 주세요` });
    cids.add(c.id);
  }

  const orders = new Map<string, BoxNode[]>();
  const entryOf = new Map<string, string>();
  for (const g of p.labels) {
    const o = orderGroup(p, g, byId);
    orders.set(g.id, o);
    if (o.length) entryOf.set(g.id, o[0].id);
  }
  const ref = (id: string) => {
    const g = groupById.get(byId.get(id)?.group ?? '');
    if (!g) {
      // 없는 상자를 가리킴 (파일을 열 때 normalizeProject가 정리하지만, 그 뒤에 생겨도 화면이 멈추지 않게)
      W.push({ level: 'error', msg: `없는 상자 "${id}"로 가는 흐름이 있어요. 그 흐름을 다시 이어 주세요` });
      return id;
    }
    return entryOf.get(g.id) === id ? g.name : `${g.name}.${id}`;
  };

  const incoming = new Map<string, { from: string }[]>();
  const addIn = (to: string, from: string) => incoming.set(to, [...(incoming.get(to) ?? []), { from }]);
  for (const b of p.nodes) for (const l of exitLinks(b)) if (l.target && byId.has(l.target)) addIn(l.target, b.id);

  // 머리말과 캐릭터
  out.push(`# ${p.project.title}`);
  out.push("# PyKaki가 만든 파일이에요. 직접 고치면 다음 내보내기 때 덮어써져요.");
  out.push('');
  for (const c of p.characters) out.push(`define ${c.id} = Character(${pyStr(c.name)}${c.color ? `, color=${pyStr(c.color)}` : ''}, image=${pyStr(c.id)})`);
  if (p.characters.length) out.push('');

  // 시작
  const start = p.project.startNode ? byId.get(p.project.startNode) : undefined;
  if (!start) W.push({ level: 'error', msg: '시작 상자가 없어요. 상자를 고르고 "시작 상자로"를 눌러 주세요.' });
  else {
    addIn(start.id, '__start');
    const sg = groupById.get(start.group)!;
    const startLabel = p.labels.find((l) => l.name === 'start');
    if (startLabel) {
      if (!(sg.id === startLabel.id && entryOf.get(sg.id) === start.id))
        W.push({ level: 'error', msg: '"start"라는 label이 있으면 시작 상자가 그 label의 첫 상자여야 해요', nodeId: start.id });
    } else out.push(
      // 렌파이 새 프로젝트의 script.rpy에도 label start가 있다. 그대로 두고 start로 가는 길만 첫 상자로 돌린다
      'init python:',
      `    config.label_overrides["start"] = ${pyStr(ref(start.id))}`,
      '',
    );
  }

  // 상자·label 셰이더: 상자마다 첫 줄에 그 상자의 셰이더를 적는다 (shader.ts). showpy가 있어야 한다
  const shaders = usesShaders(p);
  if (shaders && !S.renpyLink) W.push({ level: 'warn', msg: '상자와 label의 셰이더는 pygaki 플러그인 연결을 켜야 내보내요' });
  // 세부 값(셰이더 values=, TV tv=)은 게임의 screen_fx 5.5부터. 예전 판이면 값 없이 내보내고 알린다
  const canValues = valuesSupported();
  const values = shaders && canValues && usesShaderValues(p);
  if (shaders && S.renpyLink && !canValues && (usesShaderValues(p) || usesTvValues(p)))
    W.push({ level: 'warn', msg: '셰이더와 TV 전환의 세부 값은 pygaki 플러그인의 화면 효과(screen_fx) 5.5부터 돼요. 이 게임은 예전 판이라 값 없이 내보내요' });
  const shaderLine = (b: BoxNode, enter: boolean) => {
    const from = enter ? (incoming.get(b.id) ?? []).map((x) => byId.get(x.from)).filter((x): x is BoxNode => !!x) : [];
    const mine = shaderOfBox(p, b);
    const tr = enter ? enterTransTv(p, b, from) : { t: mine?.in ?? '', tv: mine?.tv };
    return shaderCode(mine, tr.t, { tv: canValues ? tr.tv : undefined, values });
  };

  const I = '    ';
  const q =(t: string) => '"' + escapeText(t, S) + '"';

  for (const g of p.labels) {
    const o = orders.get(g.id)!;
    if (!o.length) continue;
    out.push(`# ── ${oneLine(g.title || g.name)} ──`);
    o.forEach((b, i) => {
      const prev = o[i - 1];
      const nextId = o[i + 1]?.id ?? null;
      const inc = incoming.get(b.id) ?? [];
      const onlyFall = prev && inc.length === 1 && inc[0].from === prev.id && fallTarget(prev) === b.id;
      const nodeMark = `# @node:${b.id}${b.title ? ' ' + oneLine(b.title) : ''}`;
      const nodeAt = out.length;
      if (i === 0) out.push(`label ${g.name}:`);
      // 연결을 켜면 showpy가 지금 상자를 알 수 있게 모든 상자에 label을 쓴다
      if (S.renpyLink || (i !== 0 && !onlyFall)) out.push(`label ${g.name}.${b.id}:`);
      if (endMarks && out.length > nodeAt) out[out.length - 1] += '  ' + nodeMark;
      else out.splice(nodeAt, 0, nodeMark);

      const body: string[] = [];
      if (shaders && S.renpyLink) body.push(shaderLine(b, true));
      const pct =(t: string, where: string) => {
        if (!S.escapePercent && loosePercent(t)) W.push({ level: 'error', msg: `${where}의 %에서 렌파이가 멈춰요. 설정에서 "% 를 글자 그대로"를 켜 주세요 (${b.title || b.id})`, nodeId: b.id });
        // 텍스트 태그 짝 (렌파이 check_text_tags와 같은 규칙)
        if (S.allowTextTags) for (const w of checkTags(t)) W.push({ level: w.level, msg: `${where}: ${w.msg} (${b.title || b.id})`, nodeId: b.id });
        // 선택지 글에는 등장 효과가 없어서 {shader=}를 쓰면 렌파이가 멈춘다
        if (S.allowTextTags && where !== '대사' && shaderTags(t).length) W.push({ level: 'error', msg: `${where}: {shader=}는 대사 글에만 쓸 수 있어요. 여기에 쓰면 렌파이가 멈춰요 (${b.title || b.id})`, nodeId: b.id });
      };
      // 표시 붙이기: at부터 새로 쓴 줄 가운데 첫 문장(없으면 첫 줄) 끝에, 붙일 수 없으면 예전처럼 그 윗줄에
      const mark = (at: number, m: string) => {
        let k = -1;
        if (endMarks) {
          k = body.findIndex((x, j) => j >= at && !x.trimStart().startsWith('#'));
          if (k < 0 && body.length > at) k = at;
          if (k >= 0 && !tailSafe(body[k])) k = -1;
        }
        if (k >= 0) body[k] += '  ' + m;
        else body.splice(at, 0, m);
      };
      const lineOut = (l: Line) => {
        const at = body.length;
        emit(l);
        if (S.renpyLink) mark(at, `# @l:${l.id}`); // showpy가 줄을 찾는 표시
      };
      const emit = (l: Line) => {
        if (l.type === 'note') return l.text.split('\n').forEach((x) => body.push('# ' + x));
        if (l.type === 'command') return l.text.split('\n').forEach((x) => x.trim() && body.push(x.trimEnd()));
        if (isStage(l.type)) {
          const { code, problem } = stageCode(l);
          if (problem) W.push({ level: 'warn', msg: `${problem} (${b.title || b.id})`, nodeId: b.id });
          if (badImageName(l)) W.push({ level: 'warn', msg: `이미지 이름은 영문·숫자·_·-로 쓰는 게 안전해요 (${b.title || b.id})`, nodeId: b.id });
          if (l.who && (l.kind ?? 'char') === 'char' && l.type !== 'scene' && !charById.has(l.who))
            W.push({ level: 'error', msg: `등록되지 않은 캐릭터 "${l.who}" (${b.title || b.id})`, nodeId: b.id });
          if (l.type === 'fx' && !S.renpyLink) {
            W.push({ level: 'warn', msg: `화면 효과 줄은 pygaki 플러그인 연결을 켜야 내보내요 (${b.title || b.id})`, nodeId: b.id });
            return body.push(`# pygaki 플러그인 연결 꺼짐: ${(code ?? '').split('\n')[0]}`);
          }
          // 효과 폴더의 그림 전환(img_fx.use)은 showpy가 등록한다. 연결이 꺼져 있으면 서서히 바뀌기로 내보낸다
          if (!S.renpyLink && code && l.trans?.startsWith('img_fx.')) {
            W.push({ level: 'warn', msg: `이 그림 전환은 pygaki 플러그인이 있어야 해서 "서서히"로 내보냈어요 (${b.title || b.id})`, nodeId: b.id });
            return body.push(code.replace(' with ' + l.trans, ' with dissolve'));
          }
          return body.push(...(code ?? `# TODO: ${problem}`).split('\n'));
        }
        if (!l.text.trim()) W.push({ level: 'warn', msg: `빈 대사가 있어요 (${b.title || b.id})`, nodeId: b.id });
        pct(l.text, '대사');
        // 짧은 이름과 화면 효과는 플러그인이 받는다. 플러그인이 없으면 오류가 나서 글자 모양만 렌파이 원래 이름으로 쓴다
        if (!S.renpyLink && l.say?.effect && !renpyOnlyEffect(l.say.effect)) W.push({ level: 'warn', msg: `이 등장 효과는 pygaki 플러그인이 있어야 해서 내보내지 않았어요 (${b.title || b.id})`, nodeId: b.id });
        if (!S.renpyLink && l.say?.box) W.push({ level: 'warn', msg: `글 상자는 pygaki 플러그인이 있어야 해서 내보내지 않았어요 (${b.title || b.id})`, nodeId: b.id });
        // 글의 일부에만 건 효과 {shader=이름}: 게임에 없는 이름이면 그 줄에서 멈춘다
        const tagText = S.allowTextTags ? l.text : undefined;
        for (const n of new Set(tagEffectNames(tagText))) {
          const known = shaderEffect(n)?.kind === 'effect' || REMOVED_EFFECTS.includes(n);
          if (!known) W.push({ level: 'warn', msg: `대사: {shader=${n}}는 PyKaki가 모르는 효과예요. 게임에 없는 이름이면 그 줄에서 렌파이가 멈춰요 (${b.title || b.id})`, nodeId: b.id });
          else if (!S.renpyLink && !RENPY_EFFECTS.includes(n)) W.push({ level: 'warn', msg: `대사: {shader=${n}}는 pygaki 플러그인이 있어야 해요. 없는 게임에서는 그 줄에서 렌파이가 멈춰요 (${b.title || b.id})`, nodeId: b.id });
        }
        const fa = S.renpyLink ? [...fxArgs(l.fx), ...sayArgs(l.say, false, tagText)] : sayArgs(l.say, true, tagText);
        const tail = fa.length ? ` (${fa.join(', ')})` : '';
        if (l.type === 'narration') return body.push(q(l.text) + tail);
        const c = l.who ? charById.get(l.who) : undefined;
        if (!c) {
          W.push({ level: 'error', msg: `등록되지 않은 화자 "${l.who ?? ''}" (${b.title || b.id})`, nodeId: b.id });
          body.push(`# 화자 없음: ${l.who ?? ''}`, q(l.text));
        } else body.push(`${c.id}${l.attr?.trim() ? ' ' + l.attr.trim() : ''} ${q(l.text)}${tail}`);
      };
      b.lines.forEach(lineOut);

      const todo = 'return  # TODO: 연결 안 됨';
      const flow = (t: string | null) => (!t ? [todo] : t === nextId ? [] : [`jump ${ref(t)}`]);
      const e = b.exit;
      const endAt = body.length;
      if (e.type === 'next') {
        if (!e.target) W.push({ level: 'warn', msg: `다음 흐름이 연결되지 않았어요 (${b.title || b.id})`, nodeId: b.id });
        body.push(...flow(e.target));
      } else if (e.type === 'menu') {
        if (!e.choices.length) {
          W.push({ level: 'error', msg: `선택지가 비어 있어요 (${b.title || b.id})`, nodeId: b.id });
          body.push('return');
        } else {
          body.push('menu:');
          for (const c of e.choices) {
            if (!c.text.trim()) W.push({ level: 'warn', msg: `선택지 문구가 비어 있어요 (${b.title || b.id})`, nodeId: b.id });
            pct(c.text, '선택지');
            body.push(`${I}${q(c.text)}:`);
            if (!c.target) W.push({ level: 'warn', msg: `선택지 "${c.text}"가 연결되지 않았어요`, nodeId: b.id });
            body.push(I + I + (c.target ? `jump ${ref(c.target)}` : todo));
          }
        }
      } else if (e.type === 'call') {
        if (!e.target) {
          W.push({ level: 'error', msg: `call 대상이 없어요 (${b.title || b.id})`, nodeId: b.id });
          body.push('return  # TODO: call 대상 없음');
        } else {
          body.push(`call ${ref(e.target)}`);
          // 불러온 장면이 셰이더를 바꿨으면 돌아와서 이 상자 것으로 되돌린다
          if (shaders && S.renpyLink) body.push(shaderLine(b, false));
          body.push(...(e.then ? flow(e.then) : ['return']));
        }
      } else body.push('return');
      if (S.renpyLink) mark(endAt, `# @end:${b.id}`); // 상자 끝 (showpy가 선택지 앞에 줄을 넣을 때)

      if (!body.length) body.push('pass');
      for (const x of body) out.push(I + x);
    });
    out.push('');
  }

  // 도달 검사
  const links = (id: string) => exitLinks(byId.get(id)!).map((l) => l.target).filter((t): t is string => !!t && byId.has(t));
  const reach = (from: string) => {
    const seen = new Set([from]);
    const q2 = [from];
    while (q2.length) for (const t of links(q2.shift()!)) if (!seen.has(t)) (seen.add(t), q2.push(t));
    return seen;
  };
  if (start) {
    const r = reach(start.id);
    for (const b of p.nodes) if (!r.has(b.id)) W.push({ level: 'warn', msg: `시작에서 도달할 수 없는 상자예요 (${b.title || b.id})`, nodeId: b.id });
  }
  for (const b of p.nodes)
    if (b.exit.type === 'call' && b.exit.target && byId.has(b.exit.target)) {
      const r = reach(b.exit.target);
      if (![...r].some((id) => byId.get(id)!.exit.type === 'return'))
        W.push({ level: 'warn', msg: `call 대상에서 return(끝)에 도달하지 않아요 (${b.title || b.id})`, nodeId: b.exit.target });
    }

  return { code: out.join('\n') + '\n', warnings: W };
}
