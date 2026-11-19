// 음성 빛 (FEATURE 34, LINK.md 13장): 음성 파일마다 소리 크기를 재서 game/pykaki_voice_levels.json에 적는다.
// 렌파이에는 지금 나는 소리 크기를 읽는 기능이 없어서, 게임(voiceHelper.ts)은 이 표를 재생 자리로 읽는다.
// 파일 크기가 같으면 예전에 잰 값을 그대로 쓰고(다시 풀지 않음), 없어진 파일은 표에서 뺀다. 게임 배포판에도 들어가는 파일이다
import type { Project } from './types';
import { VOICE_LEVELS_FILE } from './voiceHelper';
import { VOICE_DIR, voiceIndex, voiceOrder, isVoiced, voiceFile } from './voice';

export const LEVEL_FPS = 30;

interface Entry { size: number; lv: string }
export interface LevelsFile { format: 'pygaki-voice-levels'; version: 1; fps: number; files: Record<string, Entry> }

// 소리를 풀어 1/fps초마다 RMS → 그 파일의 가장 큰 값 기준 0~255 (작은 소리도 보이게 0.6제곱)
export async function measure(buf: ArrayBuffer): Promise<Uint8Array> {
  const ctx = new OfflineAudioContext(1, 1, 22050);
  const a = await ctx.decodeAudioData(buf);
  const step = Math.max(1, Math.round(a.sampleRate / LEVEL_FPS));
  const n = Math.ceil(a.length / step);
  const rms = new Float32Array(n);
  const chans = Array.from({ length: a.numberOfChannels }, (_, c) => a.getChannelData(c));
  let peak = 0;
  for (let i = 0; i < n; i++) {
    let sum = 0;
    const end = Math.min(a.length, (i + 1) * step);
    for (let j = i * step; j < end; j++) {
      let v = 0;
      for (const ch of chans) v += ch[j];
      v /= chans.length;
      sum += v * v;
    }
    rms[i] = Math.sqrt(sum / Math.max(1, end - i * step));
    if (rms[i] > peak) peak = rms[i];
  }
  const out = new Uint8Array(n);
  if (peak > 1e-5) for (let i = 0; i < n; i++) out[i] = Math.round(Math.pow(rms[i] / peak, 0.6) * 255);
  return out;
}

const b64 = (u: Uint8Array) => {
  let s = '';
  for (let i = 0; i < u.length; i += 0x8000) s += String.fromCharCode(...u.subarray(i, i + 0x8000));
  return btoa(s);
};

// 원고에 나오는 음성 파일 (game 기준 경로 "audio/…"): audio/voice 폴더의 파일 모두 + 줄마다 직접 고른 파일
export function voiceFiles(p: Project, audio: string[]): string[] {
  const set = new Set<string>();
  for (const f of audio) if (f.toLowerCase().startsWith(VOICE_DIR)) set.add('audio/' + f);
  const index = voiceIndex(audio);
  for (const { label, box } of voiceOrder(p))
    for (const l of box.lines) {
      if (!isVoiced(l)) continue;
      const v = voiceFile(l, label, index).file;
      if (v) set.add(v.startsWith('audio/') ? v : 'audio/' + v);
    }
  return [...set].sort();
}

// old: 예전 표(없으면 null). read: game 기준 경로의 파일 내용(없으면 null). 바뀐 것이 없으면 null
export async function buildLevels(files: string[], old: LevelsFile | null, read: (rel: string) => Promise<ArrayBuffer | null>): Promise<LevelsFile | null> {
  const out: LevelsFile = { format: 'pygaki-voice-levels', version: 1, fps: LEVEL_FPS, files: {} };
  let changed = !old || old.fps !== LEVEL_FPS || Object.keys(old.files ?? {}).some((k) => !files.includes(k));
  for (const f of files) {
    const buf = await read(f);
    if (!buf) continue;
    const prev = old?.files?.[f];
    if (prev && prev.size === buf.byteLength && old?.fps === LEVEL_FPS) {
      out.files[f] = prev;
      continue;
    }
    try {
      out.files[f] = { size: buf.byteLength, lv: b64(await measure(buf)) };
      changed = true;
    } catch (e) {
      console.warn('음성 파일을 읽지 못했어요', f, e);
    }
  }
  return changed ? out : null;
}

export { VOICE_LEVELS_FILE };
