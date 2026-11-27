// showpy가 남긴 그림/영상/소리 줄을 대본에 받아 적는다. 문서: 저장소 맨 위 docs/LINK.md
//.rpy를 되읽지 않는다. showpy_inbox.json에 적힌 줄만 받는다. 대사 글자와 선택지는 받지 않고, 대사는 위치(그림/영상 상자의 자리·크기·회전 포함)만, 선택지는 뒤 그림의 자리·크기·회전만 받는다.
import type { BoxNode, ChoiceMedia, Line, LineFx, Project, SayStyle } from './types';
import { DEFAULT_FADEOUT, FLASH_CODE } from './stage';
import { applyScreenOp } from './screens';

const POS_KEYS = ['x', 'y', 'name_x', 'name_y', 'media_x', 'media_y', 'media_zoom', 'media_angle'] as const;
const CHOICE_MEDIA_KEYS = ['x', 'y', 'zoom', 'angle'] as const;
// 글 상자 묶기·네 점 변형 (FEATURE 28): 숫자 목록. null이면 지움
const SAY_LIST_KEYS = ['media_link', 'media_quad', 'media_text_quad'] as const;
const CHOICE_LIST_KEYS = ['link', 'quad', 'text_quad'] as const;
const numList = (v: unknown, n: number) => (Array.isArray(v) && v.length === n && v.every((x) => typeof x === 'number' && Number.isFinite(x)) ? (v as number[]) : null);

export interface InboxOp {
  id: string; // 새 줄 id (insert), 또는 이 기록 자체의 id
  op: 'insert' | 'replace' | 'remove' | 'say_pos' | 'say_fx' | 'choice_media' | 'screen' | 'screen_item';
  code?: string; // 렌파이 명령 한 줄 (insert, replace)
  pos?: Partial<Record<(typeof POS_KEYS)[number], number | null> & Record<(typeof SAY_LIST_KEYS)[number], number[] | null>>; // say_pos: 대사 위치, 그림/영상 상자 자리·크기·회전·묶기·네 점 변형. null이면 지움
  choice?: string; // choice_media: 선택지 id (# @c:)
  media?: Partial<Record<(typeof CHOICE_MEDIA_KEYS)[number], number | null> & Record<(typeof CHOICE_LIST_KEYS)[number], number[] | null>>; // choice_media: 뒤 그림 자리·크기·회전·묶기·네 점 변형. null이면 지움
  box?: string; // 그 줄이 있던 상자. 기준 줄이 사라졌을 때 쓴다
  before?: string; // 이 줄 앞에
  after?: string; // 이 줄 뒤에
  end?: string; // 이 상자의 끝에 (선택지, jump 바로 앞)
  sayFx?: Partial<Record<keyof LineFx, string | string[] | null>>; // say_fx: 대사의 화면 효과. null이면 지움
  line?: string; // replace, say_pos, say_fx: 바꿀 줄
  screen?: string; // screen, screen_item: 화면 id (pygaki editor의 [화면] 탭, LINK.md 3장)
  item?: string; // screen_item: 항목 id
  set?: Record<string, unknown>; // screen: anchor dx dy w h / screen_item: x y text
}

function applySayPos(l: Line, pos: NonNullable<InboxOp['pos']>) {
  const say: SayStyle = { ...l.say };
  for (const k of POS_KEYS) {
    const v = pos[k];
    if (typeof v === 'number') say[k] = v;
    else if (v === null) delete say[k];
  }
  for (const k of SAY_LIST_KEYS) {
    if (!(k in pos)) continue;
    const v = numList(pos[k], k === 'media_link' ? 4 : 8);
    if (v) say[k] = v;
    else delete say[k];
  }
  if (Object.keys(say).length) l.say = say;
  else delete l.say;
}

const withPart = /\s+with\s+(.+)$/;

// 명령 한 줄 → 칸이 있는 줄. 칸으로 못 나타내는 명령은 "직접 명령" 줄이 된다
export function codeToLine(code: string, id: string, p: Project): Line {
  const raw = code.trim();
  const command: Line = { id, type: 'command', text: raw };
  const isChar = (w: string) => p.characters.some((c) => c.id === w);

  const num = (v: string) => (/^\d+(\.\d+)?$/.test(v) ? Number(v) : NaN);
  // 소리 (FEATURE 15): play/queue music "파일" [fadein 초] [loop|noloop], play sound|audio "파일", stop 채널 [fadeout 초]
  let m = /^(play|queue)\s+(music|sound|audio)\s+"([^"]+)"((?:\s+\S+)*)\s*$/.exec(raw);
  if (m) {
    const [, verb, ch, file] = m;
    const opts = m[4].trim().split(/\s+/).filter(Boolean);
    const from = ch === 'music' ? /^<from\s+(\d+(?:\.\d+)?)>(.+)$/.exec(file) : null;
    const l: Line = { id, type: ch === 'music' ? 'music' : 'sound', text: '', file: (from ? from[2] : file).replace(/^audio\//, '') };
    if (from && Number(from[1]) > 0) l.from = Number(from[1]);
    if (ch === 'audio') l.channel = 'audio';
    if (verb === 'queue') {
      if (ch !== 'music') return command;
      l.queue = true;
    }
    for (let i = 0; i < opts.length; i++) {
      const o = opts[i];
      if (ch === 'music' && o === 'fadein' && num(opts[i + 1] ?? '') >= 0) l.fadein = num(opts[++i]);
      else if (ch === 'music' && (o === 'loop' || o === 'noloop') && l.loop === undefined) l.loop = o === 'loop';
      else return command;
    }
    if (!l.fadein) delete l.fadein;
    return l;
  }
  // 지금 곡 자리 옮기기 (FEATURE 37): stage.ts seekCode
  m = /^\$\s*renpy\.music\.seek\(\s*(\d+(?:\.\d+)?)\s*\)(?:\s+if\s+hasattr\(renpy\.music,\s*"seek"\)\s+else\s+None)?\s*$/.exec(raw);
  if (m) return { id, type: 'music', text: '', seek: Number(m[1]) };
  m = /^stop\s+(music|sound|audio)(?:\s+fadeout\s+(\S+))?\s*$/.exec(raw);
  if (m) {
    const l: Line = { id, type: m[1] === 'music' ? 'music' : 'sound', text: '', stop: true };
    if (m[1] === 'audio') l.channel = 'audio';
    const f = m[2] === undefined ? 0 : num(m[2]);
    if (Number.isNaN(f)) return command;
    if (f !== DEFAULT_FADEOUT) l.fadeout = f;
    return l;
  }
  // 멈춤, 흔들기 (FEATURE 15)
  m = /^pause(?:\s+(\S+))?\s*$/.exec(raw);
  if (m) {
    if (m[1] === undefined) return { id, type: 'pause', text: '' };
    const n = num(m[1]);
    return Number.isNaN(n) || n <= 0 ? command : { id, type: 'pause', text: '', secs: n };
  }
  m = /^with\s+(.+)$/.exec(raw);
  if (m) {
    const w = m[1].trim();
    if (w === 'vpunch') return { id, type: 'shake', text: '' };
    if (w === 'hpunch') return { id, type: 'shake', text: '', shake: 'hpunch' };
    if (w.replace(/\s+/g, '') === FLASH_CODE.replace(/\s+/g, '')) return { id, type: 'shake', text: '', shake: 'flash' };
    return command;
  }

  m = /^(scene|show|hide)(?:\s+(.*))?$/.exec(raw);
  if (!m) return command;
  const type = m[1] as 'scene' | 'show' | 'hide';
  let rest = (m[2] ?? '').trim();
  let trans: string | undefined;
  const w = withPart.exec(rest);
  if (w) {
    trans = w[1].trim();
    rest = rest.slice(0, w.index).trim();
  }
  // 보이기의 앞뒤 (FEATURE 15): zorder 숫자, behind 태그 하나. at보다 먼저 떼어 낸다 (at은 줄 끝까지 읽음)
  let zorder: number | undefined;
  let behind: string | undefined;
  if (type === 'show') {
    const z = /\s+zorder\s+(-?\d+)(?=\s|$)/.exec(rest);
    if (z) {
      zorder = Number(z[1]);
      rest = (rest.slice(0, z.index) + rest.slice(z.index + z[0].length)).trim();
    }
    const bh = /\s+behind\s+([A-Za-z_]\w*)(?=\s|$)/.exec(rest);
    if (bh) {
      behind = bh[1];
      rest = (rest.slice(0, bh.index) + rest.slice(bh.index + bh[0].length)).trim();
    }
  }
  let at: string | undefined;
  const a = /\s+at\s+(.+)$/.exec(rest);
  if (a) {
    at = a[1].trim();
    rest = rest.slice(0, a.index).trim();
  }
  // 칸이 없는 절(as, behind, onlayer, expression…)이나 왼쪽/오른쪽이 아닌 위치는 그대로 명령으로 둔다
  if (at && at !== 'left' && at !== 'right') return command;
  if (/[^\w\s-]|\b(as|behind|onlayer|zorder|expression)\b/.test(rest)) return command;
  const words = rest.split(/\s+/).filter(Boolean);
  const base: Line = { id, type, text: '' };
  if (trans) base.trans = trans;

  if (type === 'scene') {
    if (!words.length) return base;
    if (words[0] !== 'bg' || words.length < 2) return command;
    return { ...base, image: words.slice(1).join(' ') };
  }
  if (!words.length) return command;
  if (at) base.at = at;
  if (zorder !== undefined) base.zorder = zorder;
  if (behind) base.behind = behind;
  if (words[0] === 'bg') return type === 'hide' ? { ...base, kind: 'bg' } : { ...base, kind: 'bg', image: words.slice(1).join(' ') };
  if (isChar(words[0])) {
    const r: Line = { ...base, kind: 'char', who: words[0] };
    if (type === 'show' && words.length > 1) r.attr = words.slice(1).join(' ');
    return r;
  }
  return { ...base, kind: 'etc', image: words.join(' ') };
}

function findLine(p: Project, id: string): { box: BoxNode; i: number } | null {
  for (const box of p.nodes) {
    const i = box.lines.findIndex((l) => l.id === id);
    if (i >= 0) return { box, i };
  }
  return null;
}

function applySayFx(l: Line, vals: NonNullable<InboxOp['sayFx']>) {
  const fx = { ...l.fx } as Record<string, unknown>;
  for (const [k, v] of Object.entries(vals)) {
    if (v === null) delete fx[k];
    else fx[k] = v;
  }
  if (Object.keys(fx).length) l.fx = fx as LineFx;
  else delete l.fx;
}

// 기록을 순서대로 대본에 넣는다. p를 직접 고친다
export function applyInbox(p: Project, ops: InboxOp[]): { applied: number; moved: string[]; dropped: string[] } {
  let applied = 0;
  const moved: string[] = [];
  const dropped: string[] = [];
  for (const op of ops) {
    if (op.op === 'screen' || op.op === 'screen_item') {
      if (applyScreenOp(p, op)) applied++;
      else dropped.push(op.op === 'screen' ? '화면 자리' : '화면 항목');
      continue;
    }
    if (op.op === 'choice_media') {
      // 선택지 뒤 그림의 자리·크기·회전 (pygaki editor 선택지 탭)
      const c = op.choice ? p.nodes.flatMap((b) => (b.exit.type === 'menu' ? b.exit.choices : [])).find((x) => x.id === op.choice) : undefined;
      if (!c || !c.media || !op.media) {
        dropped.push('선택지 뒤 그림');
        continue;
      }
      const m: ChoiceMedia = { ...c.media };
      for (const k of CHOICE_MEDIA_KEYS) {
        const v = op.media[k];
        if (typeof v === 'number' && !(k === 'zoom' && v === 1) && !(k !== 'zoom' && v === 0)) m[k] = v;
        else if (v !== undefined) delete m[k];
      }
      for (const k of CHOICE_LIST_KEYS) {
        if (!(k in op.media)) continue;
        const v = numList(op.media[k], k === 'link' ? 4 : 8);
        if (v) m[k] = v;
        else delete m[k];
      }
      c.media = m;
      applied++;
      continue;
    }
    if (op.op === 'say_pos' || op.op === 'say_fx') {
      const at = op.line ? findLine(p, op.line) : null;
      const l = at?.box.lines[at.i];
      if (!l || (l.type !== 'say' && l.type !== 'narration')) {
        dropped.push(op.op === 'say_pos' ? '대사 위치' : '대사 화면 효과');
        continue;
      }
      if (op.pos) applySayPos(l, op.pos);
      if (op.sayFx) applySayFx(l, op.sayFx);
      applied++;
      continue;
    }
    const code = op.code ?? '';
    if (op.op === 'remove') {
      // showpy가 지운 줄 (화면 효과 줄을 다시 적용하거나 지울 때, LINK.md 3장)
      const at = op.line ? findLine(p, op.line) : null;
      if (at) {
        at.box.lines.splice(at.i, 1);
        applied++;
      }
      continue;
    }
    if (op.op === 'replace') {
      const at = op.line ? findLine(p, op.line) : null;
      if (!at) {
        dropped.push(code);
        continue;
      }
      at.box.lines[at.i] = codeToLine(code, at.box.lines[at.i].id, p);
      applied++;
      continue;
    }
    if (op.op !== 'insert' || findLine(p, op.id)) continue; // 이미 받아 적은 기록은 건너뛴다
    const line = codeToLine(code, op.id, p);
    const anchor = op.before ?? op.after;
    const at = anchor ? findLine(p, anchor) : null;
    if (at) at.box.lines.splice(at.i + (op.before ? 0 : 1), 0, line);
    else {
      const box = p.nodes.find((n) => n.id === (op.end ?? op.box));
      if (!box) {
        dropped.push(code);
        continue;
      }
      if (anchor) moved.push(code); // 기준 줄을 PyKaki에서 지운 경우: 상자 끝으로
      box.lines.push(line);
    }
    applied++;
  }
  return { applied, moved, dropped };
}
