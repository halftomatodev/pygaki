// 그림/영상 파일 칸 (FEATURE 24): 대사·선택지 뒤에 까는 파일 (game 기준 경로).
// 글로 치거나 [📂]로 고름(앱). game 밖 파일은 묻고 game/images 또는 game/movies로 복사한다
import { desktop } from './desktop';
import { scanFolder } from './gameFolder';
import { isMovieFile } from './stage';
import { useStore } from './store';

export async function pickMediaFile(): Promise<string | null> {
  const r = await desktop?.pickFile?.('image').catch((e) => (alert('파일을 고르지 못했어요: ' + e.message), null));
  if (!r) return null;
  if (r.rel) return r.rel;
  const dir = isMovieFile(r.name) ? 'movies' : 'images';
  if (!r.token || !confirm(`${r.name}은(는) 이 게임 폴더 밖에 있어요. game/${dir} 폴더로 복사해서 쓸까요?`)) return null;
  try {
    const rel = await desktop!.importFile!(r.token, dir);
    await scanFolder().catch(() => {});
    useStore.getState().say(`${rel}(으)로 복사했어요`);
    return rel;
  } catch (e: any) {
    alert('파일을 복사하지 못했어요: ' + e.message);
    return null;
  }
}

// 게임 안 편집 화면에서 정한 그림의 자리·크기·회전 (ui_kit 4.15). 보여 주고 지우기만 한다
export function MediaPlace({ m, onClear }: { m: { x?: number; y?: number; zoom?: number; angle?: number }; onClear: () => void }) {
  // 화면 글 사전이 글 조각마다 바꾸므로 조각을 따로 둔다
  const parts: string[] = [];
  if (m.x || m.y) parts.push(`옮김 ${m.x ?? 0}, ${m.y ?? 0}`);
  if (m.zoom && m.zoom !== 1) parts.push(`${m.zoom}배`);
  if (m.angle) parts.push(`${m.angle}도`);
  if (!parts.length)
    return <span className="sf-pos sf-hint" title="게임 안 편집 화면(Shift+M)에서 그림을 끌어 옮기고, 휠로 키우고, Q/E로 돌려요. 저장하면 여기로 받아 적어요">자리·크기는 게임에서</span>;
  return (
    <span className="sf-pos" title="게임 안 편집 화면에서 정한 그림 자리·크기·회전이에요. 글 가운데 기준이에요">
      <span>그림</span>
      {parts.map((t) => <span key={t}>{t}</span>)}
      <button title="그림 자리·크기·회전 지우기" onClick={onClear}>✕</button>
    </span>
  );
}

export function MediaField({ value, onChange, placeholder, title }: { value?: string; onChange: (v: string | undefined) => void; placeholder: string; title: string }) {
  return (
    <>
      <input className="sf-in" value={value ?? ''} placeholder={placeholder} title={title} spellCheck={false} onChange={(e) => onChange(e.target.value.trim() || undefined)} />
      {desktop?.pickFile && (
        <button title="탐색기 창에서 그림·영상 파일을 골라요" onClick={() => void pickMediaFile().then((rel) => rel && onChange(rel))}>
          📂
        </button>
      )}
      {value && (
        <button title="지우기" onClick={() => onChange(undefined)}>
          ✕
        </button>
      )}
    </>
  );
}
