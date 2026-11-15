// 오른쪽 상자 칸의 [음성] 카드 (FEATURE 16). 켜면 대사마다 음성 번호와 파일, 음성 없는 대사 목록
import { useMemo } from 'react';
import { Card } from './Card';
import { useStore } from './store';
import { soundUrl, useGameFolder } from './gameFolder';
import type { BoxNode, Line } from './types';
import { assignVoiceNos, isVoiced, VOICE_DIR, voiceFile, voiceIndex, voiceName, voiceOrder } from './voice';
import type { Upd } from './Inspector';

let playing: HTMLAudioElement | null = null;
const listen = async (file: string) => {
  playing?.pause();
  const url = await soundUrl(file);
  if (!url) return;
  playing = new Audio(url);
  playing.play().catch(() => {});
};

export function VoiceCard({ b, upd }: { b: BoxNode; upd: Upd }) {
  const project = useStore((s) => s.project);
  const update = useStore((s) => s.update);
  const audio = useGameFolder((s) => s.media.audio);
  const linked = useGameFolder((s) => !!s.name);
  const on = !!project.settings.voice;
  const index = useMemo(() => voiceIndex(audio), [audio]);
  const files = useMemo(() => audio.filter((f) => f.toLowerCase().startsWith(VOICE_DIR)), [audio]);
  const label = project.labels.find((g) => g.id === b.group)?.name ?? '';
  // 음성 없는 대사 (대본 전체, 내보내는 차례)
  const missing = useMemo(() => {
    if (!on) return [];
    const out: { box: BoxNode; l: Line; name: string; label: string }[] = [];
    for (const { label, box } of voiceOrder(project))
      for (const l of box.lines) if (isVoiced(l) && l.voice !== '' && !voiceFile(l, label, index).file) out.push({ box, l, label, name: voiceName(l, label) });
    return out;
  }, [project, index, on]);

  if (!on)
    return (
      <Card id="i-voice" title="음성" hint="캐릭터 대사마다 음성 파일을 이어요. 켜면 대사마다 번호를 매기고, game/audio/voice에 이름대로 넣은 파일이 저절로 이어져요" topic="음성">
        <div className="row">
          <button onClick={() => update((p) => void (p.settings.voice = true))}>음성 쓰기 켜기</button>
          <span className="tip">대본 전체에 켜져요</span>
        </div>
      </Card>
    );

  const go = (box: BoxNode, l: Line) => {
    useStore.getState().select([box.id]);
    useStore.setState({ focusLineId: l.id, activeLine: l.id });
  };
  const rows = b.lines.map((l, i) => [l, i] as const).filter(([l]) => isVoiced(l));
  return (
    <Card
      id="i-voice"
      title={<>음성 {missing.length > 0 && <span className="count">{missing.length}</span>}</>}
      hint="파일 이름 규칙: 캐릭터_label_번호 (예: mina_ward_012.ogg). game/audio/voice에 넣으면 저절로 이어져요. 번호는 한 번 매기면 줄을 넣거나 옮겨도 그대로예요"
      topic="음성"
    >
      {!rows.length && <p className="tip">이 상자에는 캐릭터 대사가 없어요.</p>}
      {rows.map(([l, i]) => {
        const name = voiceName(l, label);
        const v = voiceFile(l, label, index);
        const pick = l.voice === undefined ? '' : l.voice === '' ? '-' : l.voice;
        return (
          <div key={l.id} className="vc-row">
            <button className="sc-go vc-go" title="그 줄로 가요" onClick={() => go(b, l)}>
              <span className="sc-n">{i + 1}</span>
              <code>{name || '(번호 없음)'}</code>
            </button>
            <span className={'vc-state' + (v.file ? ' ok' : '')} title={v.file ? 'audio/' + v.file : l.voice === '' ? '이 줄은 음성 없음' : '파일 없음'}>
              {v.file ? (v.auto ? '✓ 이어짐' : '✓ 고름') : l.voice === '' ? '음성 없음' : '파일 없음'}
            </span>
            {v.file && (
              <button className="sc-play" title="들어 보기" onClick={() => void listen(v.file!)}>▶</button>
            )}
            <select
              className="vc-pick"
              title="이름 규칙으로 잇기, 이 줄은 음성 없음, 또는 파일 직접 고르기"
              value={pick}
              onChange={(e) =>
                upd((x) => {
                  const y = x.lines.find((z) => z.id === l.id)!;
                  if (e.target.value === '') delete y.voice;
                  else y.voice = e.target.value === '-' ? '' : e.target.value;
                })
              }
            >
              <option value="">이름대로</option>
              <option value="-">음성 없음</option>
              {files.map((f) => (
                <option key={f} value={f}>{f.slice(VOICE_DIR.length)}</option>
              ))}
              {pick && pick !== '-' && !files.includes(pick) && <option value={pick}>? {pick}</option>}
            </select>
          </div>
        );
      })}
      {!linked && <p className="tip">프로젝트 연결 안 됨: 파일은 찾지 않고 이름만 보여요.</p>}
      <details className="vc-missing">
        <summary>음성 없는 대사 {missing.length}줄 (대본 전체)</summary>
        {missing.slice(0, 200).map(({ box, l, name }) => (
          <button key={l.id} className="sc-go" onClick={() => go(box, l)} title={l.text}>
            <code>{name}</code> <span className="tip">{box.title || box.id} · {l.text.slice(0, 24)}</span>
          </button>
        ))}
        {missing.length > 200 && <p className="tip">… {missing.length - 200}줄 더</p>}
      </details>
      <div className="row">
        <button
          title="대본 전체 대사의 번호를 label마다 1부터 차례대로 다시 매겨요"
          onClick={() => confirm('음성 번호를 label마다 1부터 다시 매길까요?\n이미 이름대로 만든 음성 파일은 이름이 안 맞게 될 수 있어요.') && update((p) => assignVoiceNos(p, true))}
        >
          번호 다시 매기기
        </button>
        <button onClick={() => confirm('음성 쓰기를 끌까요? 번호와 고른 파일은 남고, 원고의 voice 줄만 빠져요.') && update((p) => void delete p.settings.voice)}>끄기</button>
      </div>
    </Card>
  );
}
