// 프로젝트 → .rpy 변환과 검사. 설계 문서 6장 참고.
import type { BoxNode, ChoiceMedia, LabelGroup, Line, Project, Settings } from './types';
import { exitLinks, fallTarget } from './ops';
import { IDENT, PLUGIN_NAMES, RESERVED } from './util';
import { badImageName, isMaskName, isMovieFile, mediaGroupArgs, mediaPlace, renpyOnlyEffect, fxArgs, isStage, sayArgs, sayHasGroup, stageCode, tagEffectNames, REMOVED_EFFECTS, RENPY_EFFECTS } from './stage';
import { shaderEffect } from './fx/textShaders';
import { imageProblem, type ImageBook } from './imageCheck';
import { voiceCode, voiceFile, voiceIndex } from './voice';
import { actOf, boxRef, flagAction, hasAct, isDragged, isHud, screenNameProblem } from './screens';
import { checkTags, shaderTags, splitClear } from './tagEdit';
import { sceneCode, sceneSupported, uiOfBox, usesSceneUi } from './boxUi';
import { exprNames, flagNameProblem, parseAction, pyValue } from './flags';
import { flagUi, strOptions } from './flagUi';
import { enterTransTv, imgTransSupported, isImgTrans, shaderCode, shaderOfBox, usesShaderValues, usesShaders, usesTvValues, valuesSupported } from './shader';

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
export function orderGroup(p: Project, g: LabelGroup, byId: Map<string, BoxNode>): BoxNode[] {
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
// 선택지 뒤 그림/영상의 괄호 값 (pygaki 플러그인 ui_kit 4.14 choice_menu)
export function choiceMediaArgs(m?: ChoiceMedia, oldGroup = false): string[] {
  if (!m || !(m.idle || m.hover || m.select)) return [];
  const a: string[] = [];
  if (m.idle) a.push(`idle_media=${pyStr(m.idle)}`);
  if (m.hover) a.push(`hover_media=${pyStr(m.hover)}`);
  if (m.select) {
    a.push(`select_media=${pyStr(m.select)}`);
    if (m.time !== undefined && m.time !== 0.5) a.push(`select_time=${m.time}`);
  }
  if (m.fit === 'image') a.push('media_fit="image"');
  a.push(...mediaPlace(m.x, m.y, m.zoom, m.angle));
  // 투명 영상(mask_ 이름, FEATURE 26): 예전 플러그인(4.14~4.15)도 알게, 영상이 다 투명 영상이면 적는다 (4.16은 파일마다 이름으로 앎)
  const movies = [m.idle, m.hover, m.select].filter(isMovieFile);
  if (movies.length && movies.every(isMaskName)) a.push('media_mask=True');
  // 묶기·네 점 변형·그림 효과 (FEATURE 28, ui_kit 4.18). 예전 플러그인은 모르는 값이라 적지 않음
  if (!oldGroup) a.push(...mediaGroupArgs(m.link, m.quad, m.text_quad, m.fx));
  return a;
}
export const choiceHasGroup = (m?: ChoiceMedia) => !!m && !!(m.link || m.quad?.some((n) => Math.abs(n) > 1e-4) || m.text_quad?.some((n) => Math.abs(n) > 1e-4) || m.fx);

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
// newMark: 머리말을 새 문구(pygaki)로. 게임의 플러그인이 새 문구를 알아볼 때만 (ui_kit 4.10, script_edit.rpy의 PK_NEW_MARK). 아니면 예전 문구
// images: 연결한 게임의 그림 목록. 있으면 배경·보이기 줄의 없는 그림을 경고한다 (내보내기는 막지 않음)
// oldMedia: 게임의 플러그인이 대사·선택지 뒤 그림/영상을 모름 (ui_kit 4.14 전). 쓰면 게임이 그 줄에서 멈춰서 알린다
// oldGroup: 글 상자 묶기·네 점 변형·그림 효과를 모름 (ui_kit 4.18 전). 그 값은 적지 않고 알린다
export function generateRpy(p: Project, opts: { endMarks?: boolean; newMark?: boolean; oldMedia?: boolean; oldGroup?: boolean; images?: ImageBook | null; audio?: string[] } = {}): { code: string; warnings: Warn[] } {
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

  // 플래그 이름 (FEATURE 14)
  for (const v of p.variables) {
    const why = flagNameProblem(p, v.name, v.id);
    if (why) W.push({ level: 'error', msg: `플래그 이름 "${v.name}": ${why}` });
  }
  const flagNames = new Set(p.variables.map((v) => v.name));
  // 조건식·바꾸는 식에 플래그 카드에 없는 이름을 쓰면 알린다 (게임의 다른 파일에서 만든 변수일 수도 있어 경고만)
  const checkExpr = (expr: string, where: string, b: BoxNode) => {
    for (const n of new Set(exprNames(expr)))
      if (!flagNames.has(n) && !cids.has(n)) W.push({ level: 'warn', msg: `${where}: "${n}"는 플래그 카드에 없는 이름이에요. 게임에 없으면 렌파이가 멈춰요 (${b.title || b.id})`, nodeId: b.id });
  };
  const checkAction = (a: string, where: string, b: BoxNode) => {
    const x = parseAction(a);
    if (!x || !x.value) W.push({ level: 'error', msg: `${where}: "${a}"는 바꾸는 식이 아니에요 (예: love += 1, met_alice = True) (${b.title || b.id})`, nodeId: b.id });
    else checkExpr(a, where, b);
  };

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
  out.push(`# ${opts.newMark ? 'pygaki' : 'PyKaki'}가 만든 파일이에요. 직접 고치면 다음 내보내기 때 덮어써져요.`);
  out.push('');
  for (const c of p.characters) out.push(`define ${c.id} = Character(${pyStr(c.name)}${c.color ? `, color=${pyStr(c.color)}` : ''}, image=${pyStr(c.id)})`);
  if (p.characters.length) out.push('');
  // 플래그의 처음 값. default라 세이브를 불러오면 세이브의 값이 이긴다
  for (const v of p.variables) out.push(`default ${v.name} = ${pyValue(v)}${v.note ? '  # ' + oneLine(v.note) : ''}`);
  if (p.variables.length) out.push('');

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
  // 셰이더 줄. img: 그림 전환(픽셀소트 등)으로 바꾸는지 (그러면 상자 첫 그림 줄들 뒤에 with screen_fx.pending_with()를 붙인다)
  const shaderLine = (b: BoxNode, enter: boolean): { code: string; img: boolean } => {
    const from = enter ? (incoming.get(b.id) ?? []).map((x) => byId.get(x.from)).filter((x): x is BoxNode => !!x) : [];
    const mine = shaderOfBox(p, b);
    const tr = enter ? enterTransTv(p, b, from) : { t: mine?.in ?? '', tv: mine?.tv, time: mine?.time, iv: undefined };
    let t = tr.t;
    // 그림 전환은 셰이더가 바뀌는 상자에 들어올 때만. 불러온 장면에서 돌아올 때(call 뒤)는 TV로
    if (isImgTrans(t) && !enter) t = 'tv';
    if (isImgTrans(t) && !imgTransSupported()) {
      W.push({ level: 'warn', msg: `셰이더 전환 "${t}"는 pygaki 플러그인의 화면 효과(screen_fx) 5.6부터 돼요. 이 게임은 예전 판이라 TV 꺼짐·켜짐으로 내보내요 (${b.title || b.id})`, nodeId: b.id });
      t = 'tv';
    } else if (isImgTrans(t) && shaderEffect(t)?.kind !== 'transition') {
      W.push({ level: 'warn', msg: `셰이더 전환 "${t}"의 효과 파일이 게임의 효과 폴더(ui_kit/effects)에 없어서 TV 꺼짐·켜짐으로 내보내요. [효과] 화면에서 넣을 수 있어요 (${b.title || b.id})`, nodeId: b.id });
      t = 'tv';
    }
    // 그림 전환의 값은 게임의 효과 파일에 있는 값만 (모르는 이름은 게임에서 오류)
    const fx = isImgTrans(t) ? shaderEffect(t) : undefined;
    const iv = fx && tr.iv ? Object.fromEntries(Object.entries(tr.iv).filter(([k]) => fx.uniforms.some(([u]) => u === 'u__' + k))) : undefined;
    return { code: shaderCode(mine, t, { tv: canValues ? tr.tv : undefined, time: tr.time, iv, values }), img: isImgTrans(t) };
  };

  // 상자의 커서, 클릭 대기: 상자마다 첫 줄에 $ custom_ui.scene(...) (boxUi.ts, ui_kit 4.7). 대사 소리는 대사 줄 괄호에
  const sceneWanted = usesSceneUi(p);
  if (sceneWanted && !S.renpyLink) W.push({ level: 'warn', msg: '상자의 커서, 클릭 대기는 pygaki 플러그인 연결을 켜야 내보내요' });
  if (sceneWanted && S.renpyLink && !sceneSupported())
    W.push({ level: 'warn', msg: '상자의 커서, 클릭 대기는 pygaki 플러그인 ui_kit 4.7부터 돼요. 이 게임은 예전 판이라 내보내지 않아요' });
  const sceneUi = sceneWanted && S.renpyLink && sceneSupported();

  const vIndex = voiceIndex(opts.audio ?? []);
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
      const enterSh = shaders && S.renpyLink ? shaderLine(b, true) : null;
      if (enterSh) body.push(enterSh.code);
      const bui = uiOfBox(b);
      if (sceneUi) body.push(sceneCode(bui));
      // label의 HUD (FEATURE 27): 상자마다 첫머리에. 상자가 같은 HUD를 정했으면 상자 것(그 hud 줄)만. 표시 없이 내보낼 때마다 다시 만듦
      for (const h of g.hud ?? []) {
        if (b.lines.some((l) => l.type === 'hud' && l.screen === h.screen)) continue;
        const { code, problem } = stageCode({ id: '', type: 'hud', text: '', screen: h.screen, ...(h.stop && { stop: true }) }, p.screens);
        // 경고는 label마다 한 번 (지운 HUD를 골라 둔 것)
        if (problem && i === 0)
          W.push({ level: 'warn', msg: p.screens?.some((s) => s.id === h.screen) ? `label "${g.name}"의 HUD: ${problem}` : `label "${g.name}"의 HUD: 지운 HUD를 골라 두었어요. label의 [♡ HUD]에서 지워 주세요`, nodeId: b.id });
        if (code) body.push(code);
      }
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
        if (l.type === 'flag') {
          const a = oneLine(l.text);
          if (!a) {
            W.push({ level: 'warn', msg: `빈 플래그 바꾸기 줄이 있어요 (${b.title || b.id})`, nodeId: b.id });
            return body.push('pass  # 빈 플래그 바꾸기');
          }
          checkAction(a, '플래그 바꾸기', b);
          return body.push('$ ' + a);
        }
        if (isStage(l.type)) {
          const { code, problem } = stageCode(l, p.screens);
          if (problem) W.push({ level: 'warn', msg: `${problem} (${b.title || b.id})`, nodeId: b.id });
          const ip = imageProblem(l, opts.images ?? null);
          if (ip) W.push({ level: 'warn', msg: `${ip} (${b.title || b.id})`, nodeId: b.id });
          if (l.type === 'show' && l.behind?.trim() && !/^[A-Za-z_]\w*$/.test(l.behind.trim()))
            W.push({ level: 'error', msg: `"뒤에" 칸에는 그림 태그 하나만 적어요 (예: mina) (${b.title || b.id})`, nodeId: b.id });
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
        if (S.renpyLink && l.say?.box === 'media') {
          if (!l.say.media) W.push({ level: 'warn', msg: `그림/영상 상자에 파일이 없어서 상자를 내보내지 않았어요 (${b.title || b.id})`, nodeId: b.id });
          else if (opts.oldMedia) W.push({ level: 'error', msg: `게임의 pygaki 플러그인이 예전 판이라 그림/영상 상자에서 멈춰요. 런처의 [플러그인 올리기]로 올려 주세요 (${b.title || b.id})`, nodeId: b.id });
          else if (opts.oldGroup && sayHasGroup(l.say)) W.push({ level: 'warn', msg: `게임의 pygaki 플러그인이 예전 판이라 글 상자 묶기, 네 점 변형, 그림 효과를 내보내지 않았어요. 런처의 [플러그인 올리기]로 올려 주세요 (${b.title || b.id})`, nodeId: b.id });
        }
        // 글의 일부에만 건 효과 {shader=이름}: 게임에 없는 이름이면 그 줄에서 멈춘다
        const tagText = S.allowTextTags ? l.text : undefined;
        for (const n of new Set(tagEffectNames(tagText))) {
          const known = shaderEffect(n)?.kind === 'effect' || REMOVED_EFFECTS.includes(n);
          if (!known) W.push({ level: 'warn', msg: `대사: {shader=${n}}는 pygaki가 모르는 효과예요. 게임에 없는 이름이면 그 줄에서 렌파이가 멈춰요 (${b.title || b.id})`, nodeId: b.id });
          else if (!S.renpyLink && !RENPY_EFFECTS.includes(n)) W.push({ level: 'warn', msg: `대사: {shader=${n}}는 pygaki 플러그인이 있어야 해요. 없는 게임에서는 그 줄에서 렌파이가 멈춰요 (${b.title || b.id})`, nodeId: b.id });
        }
        // 대사 소리(say.sound)는 플러그인이 있어야 해서 연결을 끄면 내보내지 않는다 (cb_typing_sound=, stage.ts sayArgs)
        if (!S.renpyLink && l.say?.sound !== undefined) W.push({ level: 'warn', msg: `대사 소리는 pygaki 플러그인 연결을 켜야 내보내요 (${b.title || b.id})`, nodeId: b.id });
        const ls = l.say;
        const fa = S.renpyLink ? [...fxArgs(l.fx), ...sayArgs(ls, false, tagText, !!opts.oldGroup)] : sayArgs(ls, true, tagText);
        const tail = fa.length ? ` (${fa.join(', ')})` : '';
        // {clear}(지우고 이어서): 그 자리에서 같은 화자의 대사 여러 줄로 나눈다. 클릭하면 앞 글이 지워지고 이어진다
        const parts = S.allowTextTags ? splitClear(l.text) : [l.text];
        if (l.type === 'narration') return parts.forEach((t) => body.push(q(t) + tail));
        // 음성 (FEATURE 16): 대사 바로 앞에 voice 줄. 직접 고른 파일, 아니면 audio/voice에서 이름 규칙으로 찾은 파일
        if (S.voice) {
          const v = voiceFile(l, g.name, vIndex);
          if (v.file) body.push(voiceCode(v.file));
        }
        const c = l.who ? charById.get(l.who) : undefined;
        if (!c) {
          W.push({ level: 'error', msg: `등록되지 않은 화자 "${l.who ?? ''}" (${b.title || b.id})`, nodeId: b.id });
          body.push(`# 화자 없음: ${l.who ?? ''}`, ...parts.map(q));
        } else parts.forEach((t) => body.push(`${c.id}${l.attr?.trim() ? ' ' + l.attr.trim() : ''} ${q(t)}${tail}`));
      };
      // 그림 전환으로 셰이더를 바꾸면: 상자 첫머리의 그림 줄(배경, 보이기, 숨기기)을 전환 없이 그리고 나서
      // with screen_fx.pending_with(원래 전환)으로 앞 상자 마지막 화면 → 이 화면을 잇는다 (셰이더가 그대로면 원래 전환이 돈다)
      let first = 0;
      if (enterSh?.img) {
        let fallback = '';
        while (first < b.lines.length && ['note', 'scene', 'show', 'hide'].includes(b.lines[first].type)) {
          const l = b.lines[first++];
          if (l.type !== 'note' && l.trans) {
            if (!fallback) fallback = l.trans;
            lineOut({ ...l, trans: undefined });
          } else lineOut(l);
        }
        body.push(`with screen_fx.pending_with(${fallback})`);
      }
      b.lines.slice(first).forEach(lineOut);

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
          // 질문 대사: menu: 바로 아래 say 줄. 선택지가 나오는 동안 대사창에 남는다
          const ask = e.ask;
          if (ask && ask.text.trim()) {
            pct(ask.text, '선택지 질문');
            const c = ask.who ? charById.get(ask.who) : undefined;
            if (ask.who && !c) W.push({ level: 'error', msg: `선택지 질문의 화자 "${ask.who}"가 등록되지 않았어요 (${b.title || b.id})`, nodeId: b.id });
            body.push(I + (c ? c.id + ' ' : '') + q(ask.text));
          }
          for (const c of e.choices) {
            if (!c.text.trim()) W.push({ level: 'warn', msg: `선택지 문구가 비어 있어요 (${b.title || b.id})`, nodeId: b.id });
            pct(c.text, '선택지');
            // 보이는 조건: "문구" if 조건:
            const cond = c.condition ? oneLine(c.condition).replace(/:\s*$/, '') : '';
            if (cond) checkExpr(cond, `선택지 "${c.text}"의 조건`, b);
            // 글 뒤 그림/영상 (FEATURE 24): "문구" (idle_media=…) if 조건: (플러그인이 있어야 해서 연결을 켰을 때만)
            const ma = choiceMediaArgs(c.media, !!opts.oldGroup);
            if (ma.length && S.renpyLink && opts.oldGroup && !opts.oldMedia && choiceHasGroup(c.media)) W.push({ level: 'warn', msg: `게임의 pygaki 플러그인이 예전 판이라 선택지 "${c.text}"의 묶기, 네 점 변형, 그림 효과를 내보내지 않았어요. 런처의 [플러그인 올리기]로 올려 주세요`, nodeId: b.id });
            if (ma.length && S.renpyLink && opts.oldMedia) W.push({ level: 'error', msg: `게임의 pygaki 플러그인이 예전 판이라 선택지 "${c.text}"의 뒤 그림에서 멈춰요. 런처의 [플러그인 올리기]로 올려 주세요`, nodeId: b.id });
            if (ma.length && !S.renpyLink) W.push({ level: 'warn', msg: `선택지 "${c.text}"의 뒤 그림은 pygaki 플러그인 연결을 켜야 내보내요`, nodeId: b.id });
            const margs = ma.length && S.renpyLink ? ` (${ma.join(', ')})` : '';
            // 뒤 그림이 있는 선택지는 줄 끝에 # @c:선택지id (게임 안 편집 화면이 그림 자리를 돌려보낼 때 찾음, LINK.md 2장)
            body.push(`${I}${q(c.text)}${margs}${cond ? ' if ' + cond : ''}:${margs && endMarks ? '  # @c:' + c.id : ''}`);
            // 고르면 바꾸기: jump 앞에 $ 줄
            for (const a0 of c.actions) {
              const a = oneLine(a0);
              if (!a) continue;
              checkAction(a, `선택지 "${c.text}"의 고르면`, b);
              body.push(I + I + '$ ' + a);
            }
            if (!c.target) W.push({ level: 'warn', msg: `선택지 "${c.text}"가 연결되지 않았어요`, nodeId: b.id });
            body.push(I + I + (c.target ? `jump ${ref(c.target)}` : todo));
          }
        }
      } else if (e.type === 'if') {
        // 조건 분기: 렌파이 if / elif / else. 그 밖이 비어 있으면 아래 label로 흘러가지 않게 return
        const name = b.title || b.id;
        if (!e.branches.length) W.push({ level: 'error', msg: `조건이 없어요 (${name})`, nodeId: b.id });
        e.branches.forEach((c, i) => {
          const cond = oneLine(c.cond).trim().replace(/:\s*$/, '');
          if (!cond) W.push({ level: 'error', msg: `조건 칸이 비어 있어요 (${name})`, nodeId: b.id });
          else checkExpr(cond, '조건 분기', b);
          if (!c.target) W.push({ level: 'warn', msg: `조건 "${cond || '(빈 조건)'}"의 갈래가 연결되지 않았어요 (${name})`, nodeId: b.id });
          body.push(`${i === 0 ? 'if' : 'elif'} ${cond || 'False  # TODO: 조건 없음'}:`);
          body.push(I + (c.target ? `jump ${ref(c.target)}` : todo));
        });
        if (!e.else) W.push({ level: 'warn', msg: `조건 분기의 "그 밖"이 연결되지 않았어요 (${name})`, nodeId: b.id });
        const rest = flow(e.else);
        // 그 밖이 바로 다음 상자면 else 없이 아래로 이어진다
        if (rest.length) body.push(...(e.branches.length ? ['else:', ...rest.map((x) => I + x)] : rest));
      } else if (e.type === 'call') {
        if (!e.target) {
          W.push({ level: 'error', msg: `call 대상이 없어요 (${b.title || b.id})`, nodeId: b.id });
          body.push('return  # TODO: call 대상 없음');
        } else {
          body.push(`call ${ref(e.target)}`);
          // 불러온 장면이 셰이더를 바꿨으면 돌아와서 이 상자 것으로 되돌린다
          if (shaders && S.renpyLink) body.push(shaderLine(b, false).code);
          if (sceneUi) body.push(sceneCode(bui));
          body.push(...(e.then ? flow(e.then) : ['return']));
        }
      } else if (e.type === 'screen') {
        // 화면 부르기 (FEATURE 17): call screen 뒤 돌려준 값(_return)마다 갈래, 나머지는 그 밖
        const name = b.title || b.id;
        const sc = p.screens?.find((s) => s.id === e.screen);
        if (!sc) {
          W.push({ level: 'error', msg: `부를 화면을 골라 주세요 (${name})`, nodeId: b.id });
          body.push('return  # TODO: 화면 없음');
        } else {
          if (isHud(sc)) W.push({ level: 'warn', msg: `"${sc.title || sc.name}"은 HUD라 부르면 버튼을 눌러도 갈래가 없어요. 화면 부르기에는 전체 화면을, HUD는 [📟 HUD] 줄로 띄워요 (${name})`, nodeId: b.id });
          body.push(`call screen ${sc.name}`);
          if (!e.outs.length) W.push({ level: 'warn', msg: `화면 "${sc.title || sc.name}"에 값을 돌려주는 버튼이 없어요 (${name})`, nodeId: b.id });
          e.outs.forEach((o, i) => {
            if (!o.target) W.push({ level: 'warn', msg: `화면 값 "${o.value}"의 갈래가 연결되지 않았어요 (${name})`, nodeId: b.id });
            body.push(`${i === 0 ? 'if' : 'elif'} _return == ${pyStr(o.value)}:`);
            body.push(I + (o.target ? `jump ${ref(o.target)}` : todo));
          });
          const rest = flow(e.else);
          if (rest.length) body.push(...(e.outs.length ? ['else:', ...rest.map((x) => I + x)] : rest));
        }
      } else body.push('return');
      if (S.renpyLink) mark(endAt, `# @end:${b.id}`); // 상자 끝 (showpy가 선택지 앞에 줄을 넣을 때)

      if (!body.length) body.push('pass');
      for (const x of body) out.push(I + x);
    });
    out.push('');
  }

  // 화면 만들기 (FEATURE 17): 화면 이름, 버튼 값, 그림
  for (const sc of p.screens ?? []) {
    const nm = sc.title || sc.name;
    const prob = screenNameProblem(p, sc);
    if (prob) W.push({ level: 'error', msg: `화면 "${nm}"의 이름: ${prob}` });
    const hud = isHud(sc);
    for (const it of sc.items) {
      const btn = hasAct(it.kind); // 버튼과 놓는 곳 (FEATURE 19)
      const act = actOf(sc, it);
      if (btn && act === 'return' && !hud && !it.value?.trim()) W.push({ level: 'warn', msg: `화면 "${nm}": 돌려줄 값이 빈 버튼이 있어요 (누르면 빈 값으로 돌아가요)` });
      // HUD (FEATURE 18): 버튼 동작, 막대, 보이는 조건
      if (btn && act === 'return' && hud) W.push({ level: 'warn', msg: `화면 "${nm}": HUD의 버튼은 값을 돌려줄 수 없어요. 누르면 할 일을 골라 주세요` });
      if (btn && act === 'jump' && !boxRef(p, it.target)) W.push({ level: 'warn', msg: `화면 "${nm}": 갈 상자를 고르지 않은 버튼이 있어요 (눌러도 아무 일 없어요)` });
      if (btn && act === 'toggle' && !p.screens?.some((x) => x.id === it.screen)) W.push({ level: 'warn', msg: `화면 "${nm}": 열고 닫을 화면을 고르지 않은 버튼이 있어요` });
      if (btn && act === 'toggle' && p.screens?.find((x) => x.id === it.screen)?.kind !== 'hud' && p.screens?.some((x) => x.id === it.screen)) W.push({ level: 'warn', msg: `화면 "${nm}": 버튼이 여는 화면이 HUD가 아니에요` });
      if (btn && act === 'flag') {
        if (!(it.acts ?? []).some((a) => a.trim())) W.push({ level: 'warn', msg: `화면 "${nm}": 바꿀 플래그가 없는 버튼이 있어요` });
        for (const a of it.acts ?? []) if (a.trim() && !flagAction(a)) W.push({ level: 'error', msg: `화면 "${nm}": 버튼의 바꾸는 식 "${a}"을 읽을 수 없어요 (예: love += 1)` });
      }
      if (it.kind === 'drop' && !sc.items.some(isDragged)) W.push({ level: 'warn', msg: `화면 "${nm}": 놓는 곳이 있지만 끌 수 있는 글·그림이 없어요 (항목의 [끌 수 있음])` });
      if (it.kind === 'look' && !p.variables.some((f) => f.name === it.flag)) W.push({ level: 'warn', msg: `화면 "${nm}": 플래그 꼴에 플래그를 골라 주세요 (안 고르면 내보내지 않아요)` });
      if (it.kind === 'look' && it.edit) {
        const f = p.variables.find((x) => x.name === it.flag);
        if (f?.kind === 'str' && flagUi(f).look === 'pulldown' && !strOptions(p, f).some((o) => o !== '')) W.push({ level: 'warn', msg: `화면 "${nm}": 게임에서 바꿀 수 있는 풀다운 "${f.name}"에 고를 값이 없어요 (플래그 카드의 [꼴 ▾]에서 더해요)` });
      }
      if (it.kind === 'bar' && !p.variables.some((f) => f.name === it.flag && f.kind === 'int')) W.push({ level: 'warn', msg: `화면 "${nm}": 막대에 숫자 플래그를 골라 주세요 (안 고르면 내보내지 않아요)` });
      for (const n of it.cond ? exprNames(it.cond) : []) if (!p.variables.some((f) => f.name === n)) W.push({ level: 'warn', msg: `화면 "${nm}": 보이는 조건의 "${n}"이 플래그 카드에 없어요` });
      if ((it.kind === 'imagebutton' || it.kind === 'image') && !it.image?.trim()) W.push({ level: 'warn', msg: `화면 "${nm}": 그림 이름이 빈 칸이 있어서 내보내지 않았어요` });
      for (const img of [it.image, it.hover])
        if (img?.trim() && !img.includes('/')) {
          const ip = imageProblem({ id: '', type: 'show', text: '', kind: 'etc', image: img }, opts.images ?? null);
          if (ip) W.push({ level: 'warn', msg: `화면 "${nm}": ${ip}` });
        }
    }
    if (sc.bg?.trim() && !sc.bg.startsWith('#') && !sc.bg.includes('/')) {
      const ip = imageProblem({ id: '', type: 'show', text: '', kind: 'etc', image: sc.bg }, opts.images ?? null);
      if (ip) W.push({ level: 'warn', msg: `화면 "${nm}" 배경: ${ip}` });
    }
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
    // HUD 버튼이 가는 상자 (FEATURE 18)도 닿는 곳으로 친다
    for (const sc of p.screens ?? []) for (const it of sc.items) if (actOf(sc, it) === 'jump' && it.target && byId.has(it.target)) for (const x of reach(it.target)) r.add(x);
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
