// 아주 작은 webm(Matroska) 묶기: VP9 영상 트랙 하나만. WebCodecs VideoEncoder가 낸 조각을 받아 파일 하나로 만든다.
// 렌파이(ffmpeg)가 처음으로 되감아 되풀이할 수 있게 SeekHead와 Cues(키 프레임 자리)도 적는다.
// 형식: https://www.matroska.org/technical/elements.html

type Bytes = Uint8Array;

const cat = (parts: Bytes[]): Bytes => {
  let n = 0;
  for (const p of parts) n += p.length;
  const out = new Uint8Array(n);
  let o = 0;
  for (const p of parts) out.set(p, o), (o += p.length);
  return out;
};

// 요소 ID는 앞 비트에 길이가 들어 있는 그대로 적는다 (예: 0x1A45DFA3 → 4바이트)
const idBytes = (id: number): Bytes => {
  const b: number[] = [];
  for (let v = id; v > 0; v = Math.floor(v / 256)) b.unshift(v & 0xff);
  return new Uint8Array(b);
};

// 크기 vint: 앞의 1 비트 자리가 길이. len을 주면 그 길이로 (자리를 미리 잡을 때)
const sizeBytes = (n: number, len?: number): Bytes => {
  let l = len ?? 1;
  if (!len) while (n >= 2 ** (7 * l) - 1) l++;
  const b = new Uint8Array(l);
  let v = n;
  for (let i = l - 1; i >= 0; i--) (b[i] = v & 0xff), (v = Math.floor(v / 256));
  b[0] |= 1 << (8 - l);
  return b;
};

const el = (id: number, ...body: Bytes[]): Bytes => {
  const p = cat(body);
  return cat([idBytes(id), sizeBytes(p.length), p]);
};

const uintBytes = (v: number, len?: number): Bytes => {
  let l = len ?? 1;
  if (!len) while (v >= 2 ** (8 * l)) l++;
  const b = new Uint8Array(l);
  for (let i = l - 1, x = v; i >= 0; i--) (b[i] = x % 256), (x = Math.floor(x / 256));
  return b;
};
const uint = (id: number, v: number, len?: number) => el(id, uintBytes(v, len));
const str = (id: number, s: string) => el(id, new TextEncoder().encode(s));
const f64 = (id: number, v: number) => {
  const b = new Uint8Array(8);
  new DataView(b.buffer).setFloat64(0, v);
  return el(id, b);
};

const ID = {
  EBML: 0x1a45dfa3, Segment: 0x18538067, SeekHead: 0x114d9b74, Seek: 0x4dbb, SeekID: 0x53ab, SeekPosition: 0x53ac,
  Info: 0x1549a966, TimecodeScale: 0x2ad7b1, Duration: 0x4489, MuxingApp: 0x4d80, WritingApp: 0x5741,
  Tracks: 0x1654ae6b, TrackEntry: 0xae, TrackNumber: 0xd7, TrackUID: 0x73c5, TrackType: 0x83, FlagLacing: 0x9c,
  CodecID: 0x86, DefaultDuration: 0x23e383, Video: 0xe0, PixelWidth: 0xb0, PixelHeight: 0xba,
  Cluster: 0x1f43b675, Timecode: 0xe7, SimpleBlock: 0xa3,
  Cues: 0x1c53bb6b, CuePoint: 0xbb, CueTime: 0xb3, CueTrackPositions: 0xb7, CueTrack: 0xf7, CueClusterPosition: 0xf1,
};

export interface Chunk {
  data: Bytes;
  ms: number; // 보이는 때 (밀리초)
  key: boolean;
}

// 조각들(시간 순서) → webm 파일. fps는 DefaultDuration에만 쓴다
export function muxWebm(chunks: Chunk[], width: number, height: number, durationMs: number, fps: number, codec = 'V_VP9'): Bytes {
  const header = el(
    ID.EBML,
    uint(0x4286, 1), uint(0x42f7, 1), uint(0x42f2, 4), uint(0x42f3, 8),
    str(0x4282, 'webm'), uint(0x4287, 4), uint(0x4285, 2),
  );
  const info = el(ID.Info, uint(ID.TimecodeScale, 1_000_000), f64(ID.Duration, durationMs), str(ID.MuxingApp, 'pygaki'), str(ID.WritingApp, 'pygaki'));
  const tracks = el(
    ID.Tracks,
    el(
      ID.TrackEntry,
      uint(ID.TrackNumber, 1), uint(ID.TrackUID, 1), uint(ID.TrackType, 1), uint(ID.FlagLacing, 0),
      str(ID.CodecID, codec), uint(ID.DefaultDuration, Math.round(1e9 / fps)),
      el(ID.Video, uint(ID.PixelWidth, width), uint(ID.PixelHeight, height)),
    ),
  );

  // 묶음(Cluster): 키 프레임마다, 또는 앞 묶음 시작에서 30초가 넘으면 새로 (블록 시간은 int16 밀리초)
  const clusters: { ms: number; body: Bytes[] }[] = [];
  for (const c of chunks) {
    const last = clusters[clusters.length - 1];
    if (!last || c.key || c.ms - last.ms > 30000) {
      if (!last && !c.key) throw new Error('첫 조각이 키 프레임이 아니에요');
      clusters.push({ ms: c.ms, body: [] });
    }
    const cl = clusters[clusters.length - 1];
    const head = new Uint8Array(4);
    head[0] = 0x81; // 트랙 1
    new DataView(head.buffer).setInt16(1, Math.round(c.ms - cl.ms));
    head[3] = c.key ? 0x80 : 0;
    cl.body.push(el(ID.SimpleBlock, head, c.data));
  }
  const clusterBytes = clusters.map((c) => el(ID.Cluster, uint(ID.Timecode, Math.round(c.ms)), ...c.body));

  // SeekHead는 자리 값을 8바이트로 고정해서 크기가 늘 같게 → 먼저 크기를 재고 자리를 셈
  const seekHead = (infoPos: number, tracksPos: number, cuesPos: number) =>
    el(
      ID.SeekHead,
      el(ID.Seek, el(ID.SeekID, idBytes(ID.Info)), uint(ID.SeekPosition, infoPos, 8)),
      el(ID.Seek, el(ID.SeekID, idBytes(ID.Tracks)), uint(ID.SeekPosition, tracksPos, 8)),
      el(ID.Seek, el(ID.SeekID, idBytes(ID.Cues)), uint(ID.SeekPosition, cuesPos, 8)),
    );
  const shLen = seekHead(0, 0, 0).length;
  const infoPos = shLen;
  const tracksPos = infoPos + info.length;
  let pos = tracksPos + tracks.length;
  const cuePoints: Bytes[] = [];
  clusters.forEach((c, i) => {
    cuePoints.push(el(ID.CuePoint, uint(ID.CueTime, Math.round(c.ms)), el(ID.CueTrackPositions, uint(ID.CueTrack, 1), uint(ID.CueClusterPosition, pos))));
    pos += clusterBytes[i].length;
  });
  const cues = el(ID.Cues, ...cuePoints);
  const segment = el(ID.Segment, seekHead(infoPos, tracksPos, pos), info, tracks, ...clusterBytes, cues);
  return cat([header, segment]);
}
