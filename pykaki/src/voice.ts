// 음성 (FEATURE 16): 대사 줄마다 음성 파일. 설정에서 켜면(settings.voice) 캐릭터 대사마다 label 안 번호(vno)를 한 번 매겨 저장하고,
// 이름 규칙 "캐릭터_label_번호"(예: mina_ward_012)로 game/audio/voice의 파일을 저절로 잇는다. 직접 고른 파일(line.voice)이 먼저.
// 원고에는 대사 바로 앞에 voice "audio/voice/mina_ward_012.ogg"
import type { BoxNode, Line, Project } from './types';
import { orderGroup } from './exportRpy';
import { addFixup } from './store';

export const VOICE_DIR = 'voice/'; // audio 폴더 안
export const isVoiced = (l: Line) => l.type === 'say' && !!l.who;
const pad = (n: number) => String(n).padStart(3, '0');
const SND = /\.(ogg|opus|mp3|wav|flac)$/i;

// 상자 차례: 내보내는 순서(label마다 첫 상자부터)
export function voiceOrder(p: Project): { label: string; box: BoxNode }[] {
  const byId = new Map(p.nodes.map((n) => [n.id, n]));
  const out: { label: string; box: BoxNode }[] = [];
  for (const g of p.labels) for (const box of orderGroup(p, g, byId)) out.push({ label: g.name, box });
  return out;
}

// 번호가 없거나 같은 label 안에서 겹치는 대사에 그 label의 다음 번호를 준다 (지운 번호는 다시 쓰지 않게 가장 큰 번호 다음)
// renumber면 모두 처음부터 1, 2, 3 … (카드의 [번호 다시 매기기])
export function assignVoiceNos(p: Project, renumber = false) {
  const seen = new Map<string, Set<number>>();
  const max = new Map<string, number>();
  const rows = voiceOrder(p);
  if (!renumber)
    for (const { label, box } of rows) for (const l of box.lines) if (isVoiced(l) && l.vno) max.set(label, Math.max(max.get(label) ?? 0, l.vno));
  for (const { label, box } of rows) {
    const s = seen.get(label) ?? new Set<number>();
    seen.set(label, s);
    for (const l of box.lines) {
      if (!isVoiced(l)) continue;
      if (renumber || !l.vno || s.has(l.vno)) {
        const n = (max.get(label) ?? 0) + 1;
        max.set(label, n);
        l.vno = n;
      }
      s.add(l.vno);
    }
  }
}

export const voiceName = (l: Line, label: string) => (l.who && l.vno ? `${l.who}_${label}_${pad(l.vno)}`.toLowerCase() : '');

// 연결한 game/audio의 음성 파일 (audio 기준 경로) → 이름(확장자 뺀 파일 이름, 소문자) 표
export function voiceIndex(audio: string[]) {
  const m = new Map<string, string>();
  for (const f of audio) if (f.toLowerCase().startsWith(VOICE_DIR) && SND.test(f)) m.set(f.split('/').pop()!.replace(SND, '').toLowerCase(), f);
  return m;
}

// 이 대사의 음성 파일 (audio 기준 경로). 직접 고른 것('' = 이 줄은 음성 없음), 아니면 이름 규칙으로 찾은 파일
export function voiceFile(l: Line, label: string, index: Map<string, string>): { file: string | null; auto: boolean } {
  if (l.voice !== undefined) return { file: l.voice || null, auto: false };
  const f = index.get(voiceName(l, label));
  return { file: f ?? null, auto: true };
}

// 원고 줄: 파일은 audio 기준 경로 (예: voice/mina_ward_012.ogg)
export const voiceCode = (file: string) => 'voice ' + JSON.stringify(file.startsWith('audio/') ? file : 'audio/' + file);

// 음성을 켠 대본은 고칠 때마다 새 대사에 번호를 준다
addFixup((p) => {
  if (p.settings.voice) assignVoiceNos(p);
});
