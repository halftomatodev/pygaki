// 그림 이름 검사 (FEATURE 15, 경고만): 배경·보이기 줄의 그림이 연결한 게임에 있는지.
// 렌파이 그림 이름은 "태그 속성 속성…" (images 폴더 파일 이름, 코드의 image 정의). 줄에 적은 속성을 모두 가진 그림이 하나라도 있으면 됨
import type { Line } from './types';
import { imageName } from './stage';

export interface ImageBook {
  names: string[]; // 그림 이름 (images·movies 폴더, 코드의 image 정의)
  anyTags: string[]; // 속성을 알 수 없는 태그 (layeredimage, renpy.image): 태그만 맞으면 됨
}

// 렌파이에 원래 있는 그림 (renpy/common)
const BUILTIN = ['black', 'text', 'vtext'];

const split = (n: string) => n.trim().toLowerCase().split(/\s+/).filter(Boolean);

// 게임 코드(.rpy)에서 그림 정의 읽기. 주석 줄과 문자열 안까지는 가리지 않는 대강의 읽기
export function codeImages(text: string): { names: string[]; anyTags: string[] } {
  const names: string[] = [];
  const anyTags: string[] = [];
  for (const m of text.matchAll(/^[ \t]*image[ \t]+([A-Za-z0-9_][\w \t]*?)[ \t]*(=|:)/gm)) names.push(split(m[1]).join(' '));
  for (const m of text.matchAll(/^[ \t]*layeredimage[ \t]+([A-Za-z0-9_][\w \t]*?)[ \t]*:/gm)) anyTags.push(split(m[1])[0]);
  for (const m of text.matchAll(/renpy\.image\(\s*(["'])([^"']+)\1/g)) names.push(split(m[2]).join(' '));
  // 이름을 글자로 못 읽는 renpy.image(변수, …)가 있으면 어떤 그림이든 있을 수 있어서 검사를 끈다 ('*')
  if (/renpy\.image\(\s*[^"'\s]/.test(text)) anyTags.push('*');
  return { names, anyTags };
}

// 문제가 없으면 null
export function imageProblem(l: Line, book: ImageBook | null): string | null {
  if (!book || book.anyTags.includes('*')) return null;
  if (l.type !== 'scene' && l.type !== 'show') return null;
  const full = l.type === 'scene' ? (l.image?.trim() ? 'bg ' + l.image.trim() : '') : imageName(l);
  const want = split(full);
  if (!want.length) return null;
  const [tag, ...attrs] = want;
  if (book.anyTags.includes(tag) || BUILTIN.includes(want.join(' '))) return null;
  const same = book.names.map(split).filter((w) => w[0] === tag);
  if (!same.length) return `게임에 없는 그림이에요: "${want.join(' ')}". images 폴더에 "${tag}"로 시작하는 그림이 없어요`;
  // 속성 없이 태그만: 보이는 그림의 속성을 이어 쓸 수도 있어서 태그만 있으면 됨
  if (!attrs.length) return null;
  if (same.some((w) => attrs.every((a) => w.includes(a)))) return null;
  const has = same.map((w) => w.slice(1).join(' ') || '(속성 없음)').slice(0, 6).join(', ');
  return `게임에 없는 그림이에요: "${want.join(' ')}". "${tag}"의 그림: ${has}${same.length > 6 ? ' …' : ''}`;
}
