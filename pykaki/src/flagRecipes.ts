// 플래그 용례 (플래그 카드의 [+ 추가] 메뉴). 용례마다 만들 플래그, 바꾸는 곳과 보는 곳, 원고 몇 줄, 렌파이에서 찍은 영상.
// 영상은 src/flagclips/<id>.webm (렌파이 8.5.3, 게임 화면 전체를 줄여 찍음). 앱은 dist/index.html 한 파일만 가져가서 영상도 빌드에 넣는다
import type { Flag, FlagKind, FlagUi, Project } from './types';
import { flagNameProblem, newFlagName } from './flags';
import { uid } from './util';

export interface FlagRecipe {
  id: string;
  icon: string;
  title: string;
  kindHint: string; // 메뉴 줄 오른쪽 작은 글
  desc: string;
  flags: { name: string; kind: FlagKind; init: Flag['init']; note: string; ui?: FlagUi }[];
  write: string[]; // ✎ 바꾸는 곳
  read: string[]; // ? 보는 곳
  code: string;
  clip?: string; // 영상 url (없으면 설명만)
  demo?: DemoStep[]; // 메뉴 카드의 움직이는 견본 (FEATURE 20): 차례로 값을 바꾸며 꼴과 식, 대사, 선택지를 보여 줌
}

// 견본 한 걸음: 이때의 값, 그 값을 만든 식, 그래서 보이는 대사나 선택지
export interface DemoStep {
  vals: Record<string, boolean | number | string>;
  code: string;
  say?: string;
  choice?: { text: string; open: boolean };
}

const CLIPS = import.meta.glob('./flagclips/*.webm', { query: '?url', import: 'default', eager: true }) as Record<string, string>;
const clip = (id: string) => CLIPS[`./flagclips/${id}.webm`];

const LIST: Omit<FlagRecipe, 'clip'>[] = [
  {
    id: 'blank',
    icon: '+',
    title: '빈 플래그',
    kindHint: '직접 정하기',
    desc: '이름, 종류(켜짐/꺼짐, 숫자, 글자), 처음 값을 직접 정해요.',
    flags: [{ name: 'flag', kind: 'bool', init: false, note: '' }],
    write: [],
    read: [],
    code: 'default flag_1 = False',
  },
  {
    id: 'affection',
    demo: [
      { vals: { love: 0 }, code: 'default love = 0', say: '미나: 처음 보는 얼굴이네.' },
      { vals: { love: 1 }, code: '"좋아, 같이 가자" 고르면 love += 1', say: '미나: 정말? 고마워.' },
      { vals: { love: 1 }, code: '"바빠서 다음에" 고르면 (그대로)', say: '미나: 그래… 다음에.' },
      { vals: { love: 2 }, code: '"우산 같이 쓰자" 고르면 love += 1', say: '미나: 오늘 즐거웠어.' },
      { vals: { love: 2 }, code: 'if love >= 2: jump good_end', say: '→ 좋은 끝' },
    ],
    icon: '♥',
    title: '호감도',
    kindHint: '숫자',
    desc: '친절한 선택을 할 때마다 1씩 올리고, 마지막에 값이 넉넉하면 좋은 끝으로 가요.',
    flags: [{ name: 'love', kind: 'int', init: 0, note: '호감도 (친절한 선택마다 +1)', ui: { look: 'level', style: 'continuous', min: 0, max: 10 } }],
    write: ['선택지 고르면: love +1'],
    read: ['끝 상자의 ◇ 조건 분기: love ≥ 2이면 좋은 끝'],
    code: 'default love = 0\n\nmenu:\n    "좋아, 같이 가자":\n        $ love += 1\n    "바빠서 다음에":\n        pass\n\nif love >= 2:\n    jump good_end',
  },
  {
    id: 'met_once',
    demo: [
      { vals: { met_alice: false }, code: 'if not met_alice:', say: '앨리스: 처음 보네? 나는 앨리스야.' },
      { vals: { met_alice: true }, code: '$ met_alice = True', say: '(만났다고 기억해 둠)' },
      { vals: { met_alice: true }, code: 'else:', say: '앨리스: 또 왔구나!' },
    ],
    icon: '◉',
    title: '한 번 본 장면',
    kindHint: '켜짐/꺼짐',
    desc: '처음 만나면 켜 두고, 같은 곳에 다시 오면 다른 대사가 나와요.',
    flags: [{ name: 'met_alice', kind: 'bool', init: false, note: '앨리스를 만났는지', ui: { look: 'switch' } }],
    write: ['처음 만나는 대사 뒤 ⚑ 플래그 바꾸기: met_alice 켜기'],
    read: ['그 장면 앞 ◇ 조건 분기: met_alice 켜짐이면 "또 왔구나"'],
    code: 'default met_alice = False\n\nif not met_alice:\n    e "처음 보네? 나는 앨리스야."\n    $ met_alice = True\nelse:\n    e "또 왔구나!"',
  },
  {
    id: 'item',
    demo: [
      { vals: { has_key: false }, code: 'menu: "열쇠로 연다" if has_key', choice: { text: '열쇠로 연다', open: false } },
      { vals: { has_key: true }, code: '"열쇠를 줍는다" 고르면 has_key = True', say: '(열쇠를 주웠다)' },
      { vals: { has_key: true }, code: 'menu: "열쇠로 연다" if has_key', choice: { text: '열쇠로 연다', open: true } },
    ],
    icon: '⚿',
    title: '물건 얻기·쓰기',
    kindHint: '켜짐/꺼짐',
    desc: '물건을 주우면 켜고, 그 물건이 있어야 고를 수 있는 선택지를 보여 줘요. 없으면 선택지가 숨어요.',
    flags: [{ name: 'has_key', kind: 'bool', init: false, note: '열쇠를 가졌는지', ui: { look: 'switch' } }],
    write: ['열쇠를 줍는 선택지 고르면: has_key 켜기'],
    read: ['문 앞 선택지의 보이는 조건: has_key 켜짐'],
    code: 'default has_key = False\n\nmenu:\n    "열쇠를 줍는다":\n        $ has_key = True\n\nmenu:\n    "열쇠로 연다" if has_key:\n        jump open_door\n    "돌아간다":\n        jump hall',
  },
  {
    id: 'locked_choice',
    demo: [
      { vals: { courage: 0 }, code: 'menu: "맞선다" if courage >= 3', choice: { text: '맞선다', open: false } },
      { vals: { courage: 1 }, code: '"앞으로 나선다" 고르면 courage += 1', choice: { text: '맞선다', open: false } },
      { vals: { courage: 2 }, code: 'courage += 1', choice: { text: '맞선다', open: false } },
      { vals: { courage: 3 }, code: 'courage += 1', choice: { text: '맞선다', open: true } },
    ],
    icon: '⚑',
    title: '잠긴 선택지',
    kindHint: '숫자',
    desc: '용기 있는 선택을 쌓아야 나중에 새 선택지가 열려요. 값이 모자라면 그 선택지는 안 보여요.',
    flags: [{ name: 'courage', kind: 'int', init: 0, note: '용기 (용감한 선택마다 +1)', ui: { look: 'slider', min: 0, max: 5 } }],
    write: ['용감한 선택지 고르면: courage +1'],
    read: ['마지막 선택지의 보이는 조건: courage ≥ 3이면 "맞선다"'],
    code: 'default courage = 0\n\nmenu:\n    "앞으로 나선다":\n        $ courage += 1\n    "뒤로 숨는다":\n        pass\n\nmenu:\n    "맞선다" if courage >= 3:\n        jump fight\n    "도망친다":\n        jump run',
  },
  {
    id: 'route',
    demo: [
      { vals: { route: '' }, code: 'default route = ""', say: '갈림길이다.' },
      { vals: { route: 'sea' }, code: '"바다로 간다" 고르면 route = "sea"', say: '미나: 바다? 좋겠다.' },
      { vals: { route: 'mountain' }, code: '"산으로 간다" 고르면 route = "mountain"', say: '미나: 산? 다리 아프겠다.' },
    ],
    icon: '⑂',
    title: '갈래 정하기',
    kindHint: '글자',
    desc: '갈림길에서 고른 갈래를 글자로 기억해 두고, 나중의 같은 장면에서 대사만 갈래에 맞게 바꿔요.',
    flags: [{ name: 'route', kind: 'str', init: '', note: '고른 갈래 ("sea" 또는 "mountain")', ui: { look: 'pulldown', options: ['sea', 'mountain'] } }],
    write: ['갈림길 선택지 고르면: route = "sea" / "mountain"'],
    read: ['뒤의 공통 장면 ◇ 조건 분기: route가 "sea"이면'],
    code: 'default route = ""\n\nmenu:\n    "바다로 간다":\n        $ route = "sea"\n    "산으로 간다":\n        $ route = "mountain"\n\nif route == "sea":\n    e "바다? 좋겠다."\nelse:\n    e "산? 다리 아프겠다."',
  },
  {
    id: 'ending',
    demo: [
      { vals: { love: 0, trust: 0 }, code: 'default love = 0, trust = 0', say: '' },
      { vals: { love: 2, trust: 0 }, code: 'love += 1 (두 번)', say: '→ 좋은 끝 (love ≥ 2)' },
      { vals: { love: 2, trust: 2 }, code: 'trust += 1 (두 번)', say: '→ 진짜 끝 (love ≥ 2 그리고 trust ≥ 2)' },
      { vals: { love: 0, trust: 1 }, code: '다시 해 보면…', say: '→ 보통 끝' },
    ],
    icon: '★',
    title: '여러 끝',
    kindHint: '숫자 둘',
    desc: '두 값을 따로 쌓아서 끝을 셋으로 나눠요. 둘 다 넉넉하면 진짜 끝, 하나만 넉넉하면 좋은 끝, 아니면 보통 끝이에요.',
    flags: [
      { name: 'love', kind: 'int', init: 0, note: '호감 (다정한 선택마다 +1)', ui: { look: 'level', style: 'discrete', min: 0, max: 5 } },
      { name: 'trust', kind: 'int', init: 0, note: '믿음 (약속을 지킬 때마다 +1)', ui: { look: 'level', style: 'discrete', min: 0, max: 5, skin: { fill: { color: '#3b82f6' } } } },
    ],
    write: ['선택지 고르면: love +1, 다른 선택지는 trust +1'],
    read: ['마지막 ◇ 조건 분기: love ≥ 2 그리고 trust ≥ 2 → 진짜 끝, 아니고 love ≥ 2 → 좋은 끝, 그 밖 → 보통 끝'],
    code: 'default love = 0\ndefault trust = 0\n\nif love >= 2 and trust >= 2:\n    jump true_end\nelif love >= 2:\n    jump good_end\nelse:\n    jump normal_end',
  },
];

export const FLAG_RECIPES: FlagRecipe[] = LIST.map((r) => ({ ...r, clip: clip(r.id) }));

// 겹치지 않는 이름: love가 있으면 love_2, love_3 …
export function freeFlagName(p: Project, base: string) {
  if (!flagNameProblem(p, base)) return base;
  for (let i = 2; ; i++) if (!flagNameProblem(p, `${base}_${i}`)) return `${base}_${i}`;
}

// 용례대로 플래그를 만든다 (update 한 번 안에서 불러 실행 취소 한 번에 되돌림). 만든 플래그 id를 돌려줌
export function addRecipeFlags(p: Project, r: FlagRecipe): string[] {
  const ids: string[] = [];
  for (const f of r.flags) {
    const id = uid('v');
    const name = r.id === 'blank' ? newFlagName(p) : freeFlagName(p, f.name);
    p.variables.push({ id, name, kind: f.kind, init: f.init, ...(f.note ? { note: f.note } : {}), ...(f.ui ? { ui: structuredClone(f.ui) } : {}) });
    ids.push(id);
  }
  return ids;
}

