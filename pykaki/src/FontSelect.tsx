// 글꼴 고르기 칸: 대사 줄 글꼴 칸(LineFields.tsx)과 [GUI 편집] 글꼴 칸(ShowpyView.tsx)이 함께 쓴다.
// 게임 폴더의 글꼴 목록 + 렌파이 기본 글꼴 + [직접 쓰기…] + (앱에서) [＋ 글꼴 넣기…].
// 한글이 거의 없는 글꼴은 이름 뒤에 "한글 없음"을 붙인다 (글꼴 정보는 fontsLib가 읽어 둔 것을 씀).
import { useEffect, useState } from 'react';
import { desktop } from './desktop';
import { fontGroups, useGameFolder } from './gameFolder';
import { coverage } from './fontInfo';
import { FONT_EXT, fontInfoOf, pickFont, RENPY_DEFAULT_FONT } from './fontsLib';

const ADD = '\u0000add';
const TYPE = '\u0000type';

// 글꼴마다 한글이 있는지 (true/false, 모르면 없음). 앱을 켠 동안 모아 둠
const hangul = new Map<string, boolean>();
function useHangul(fonts: string[]) {
  const [, redraw] = useState(0);
  useEffect(() => {
    if (!desktop) return;
    let stop = false;
    void (async () => {
      for (const f of fonts) {
        if (stop) return;
        if (hangul.has(f)) continue;
        const v = await fontInfoOf(f).catch(() => null);
        if (v?.info) hangul.set(f, coverage(v.info).find((c) => c.id === 'hangul')!.ok);
        if (!stop) redraw((n) => n + 1);
      }
    })();
    return () => void (stop = true);
  }, [fonts]);
  return (f: string) => (f === RENPY_DEFAULT_FONT ? false : hangul.get(f));
}

export function FontSelect({
  value,
  onSet,
  empty = '(기본 글꼴)',
  className,
  title,
}: {
  value: string | undefined;
  onSet: (v: string | undefined) => void;
  empty?: string;
  className?: string;
  title?: string;
}) {
  const all = useGameFolder((f) => f.media.fonts);
  const fonts = all.filter((f) => FONT_EXT.test(f));
  const has = useHangul(fonts);
  const groups = Object.entries(fontGroups());
  const [typing, setTyping] = useState<string | null>(null);
  const cur = value ?? '';
  const known = !cur || cur === RENPY_DEFAULT_FONT || groups.some(([n]) => n === cur) || fonts.some((f) => f.toLowerCase() === cur.toLowerCase());
  const label = (f: string) => (has(f) === false ? `${f} · 한글 없음` : f);

  if (typing !== null) {
    const done = () => {
      const t = typing.trim();
      setTyping(null);
      if (t !== cur) onSet(t || undefined);
    };
    return (
      <input
        className={className}
        autoFocus
        title={title}
        placeholder="fonts/내글꼴.ttf"
        value={typing}
        onChange={(e) => setTyping(e.target.value)}
        onBlur={done}
        onKeyDown={(e) => {
          if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
          if (e.key === 'Escape') setTyping(null);
        }}
      />
    );
  }
  const pick = async (v: string) => {
    if (v === TYPE) return setTyping(cur);
    if (v === ADD) {
      const rel = await pickFont().catch(() => null);
      if (rel) onSet(rel);
      return;
    }
    onSet(v || undefined);
  };
  return (
    <select className={className} title={title ?? cur} value={cur} onChange={(e) => void pick(e.target.value)}>
      <option value="">{empty}</option>
      {!known && <option value={cur}>{`${cur} · 파일 없음`}</option>}
      {fonts.map((f) => (
        <option key={f} value={f}>
          {label(f)}
        </option>
      ))}
      {groups.map(([n, g]) => (
        <option key={n} value={n}>
          {`${n} · 글꼴 묶음 (${g.main} + 영문 ${g.latin})`}
        </option>
      ))}
      <option value={RENPY_DEFAULT_FONT}>{`${RENPY_DEFAULT_FONT} · 렌파이 기본 · 한글 없음`}</option>
      <option value={TYPE}>직접 쓰기…</option>
      {desktop?.pickFile && <option value={ADD}>＋ 글꼴 넣기…</option>}
    </select>
  );
}
