// 데스크톱 앱(pykaki/app, Electron)에서 열렸을 때: 앱이 건넨 파일 기능(window.pygaki)을
// 브라우저의 폴더 손잡이(FileSystemDirectoryHandle)와 같은 모양으로 감싼다. 그래서 gameFolder.ts, files.ts는
// 웹 버전과 같은 코드로 돈다. 앱에서는 렌파이 프로젝트 하나를 열고, 연결이나 권한 창이 없다.

interface PygakiApi {
  info(): Promise<{ project: string; name: string; flows: string[]; version: string }>;
  list(rel: string): Promise<{ name: string; dir: boolean }[] | null>;
  stat(rel: string): Promise<{ dir: boolean; size: number; mtime: number } | null>;
  read(rel: string): Promise<Uint8Array | null>;
  write(rel: string, data: string | Uint8Array): Promise<boolean>;
  remove(rel: string): Promise<boolean>; // 효과 파일(game/ui_kit/effects/*.glsl)만 지울 수 있다
  openFolder(rel: string): Promise<string>;
  choose(): Promise<boolean>;
  // 렌파이에서 실행. always가 아니면 게임이 이미 켜져 있을 때 'running'만 돌려주고 켜지 않는다
  runGame?(always: boolean): Promise<'started' | 'running' | 'no-sdk' | 'failed'>;
  // 탐색기로 파일 하나 고르기. game 안이면 rel(game 기준), 밖이면 token(importFile로 복사할 때 씀). 취소면 null
  pickFile?(kind: 'image' | 'sound'): Promise<{ name: string; rel?: string; token?: string } | null>;
  importFile?(token: string, dir: 'images' | 'movies' | 'audio'): Promise<string>; // 복사한 자리 (game 기준)
  onChange(fn: (rel: string) => void): () => void;
  // showpy 실시간 연결 (docs/LINK.md 9장)
  liveSend(msg: object): Promise<boolean>;
  liveStatus(): Promise<{ on: boolean; reloading?: boolean; showpy: string | null; last?: any[] }>;
  onLive(fn: (msg: any) => void): () => void;
  onLiveStatus(fn: (st: { on: boolean; reloading?: boolean; showpy: string | null }) => void): () => void;
}

export const desktop: PygakiApi | null = (window as any).pygaki ?? null;
export const isDesktop = !!desktop;

const join = (a: string, b: string) => (a ? a + '/' + b : b);
const notFound = (rel: string) => Object.assign(new Error('파일이 없어요: ' + rel), { name: 'NotFoundError' });

const MIME: Record<string, string> = {
  png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', webp: 'image/webp', avif: 'image/avif', webm: 'video/webm',
  ogg: 'audio/ogg', opus: 'audio/ogg', mp3: 'audio/mpeg', wav: 'audio/wav', flac: 'audio/flac',
  ttf: 'font/ttf', otf: 'font/otf', ttc: 'font/collection', woff: 'font/woff', woff2: 'font/woff2',
};

export class AppFile {
  kind = 'file' as const;
  constructor(public name: string, public rel: string) {}
  async getFile() {
    const [bytes, st] = await Promise.all([desktop!.read(this.rel), desktop!.stat(this.rel)]);
    if (!bytes) throw notFound(this.rel);
    const ext = this.name.split('.').pop()?.toLowerCase() ?? '';
    return new File([bytes as BlobPart], this.name, { type: MIME[ext] ?? '', lastModified: st?.mtime });
  }
  async createWritable() {
    const parts: string[] = [];
    const rel = this.rel;
    return {
      write: async (t: string) => void parts.push(t),
      close: async () => void (await desktop!.write(rel, parts.join(''))),
    };
  }
}

export class AppDir {
  kind = 'directory' as const;
  constructor(public name: string, public rel: string) {}
  async *entries(): AsyncGenerator<[string, AppDir | AppFile]> {
    for (const e of (await desktop!.list(this.rel)) ?? []) {
      const r = join(this.rel, e.name);
      yield [e.name, e.dir ? new AppDir(e.name, r) : new AppFile(e.name, r)];
    }
  }
  // create: 폴더는 그 안에 파일을 쓸 때 앱이 만든다
  async getDirectoryHandle(name: string, opt?: { create?: boolean }) {
    const r = join(this.rel, name);
    const st = await desktop!.stat(r);
    if (st ? !st.dir : !opt?.create) throw notFound(r);
    return new AppDir(name, r);
  }
  async removeEntry(name: string) {
    const r = join(this.rel, name);
    if (!(await desktop!.remove(r))) throw notFound(r);
  }
  async getFileHandle(name: string, opt?: { create?: boolean }) {
    const r = join(this.rel, name);
    const st = await desktop!.stat(r);
    if (st?.dir) throw notFound(r);
    if (!st && !opt?.create) throw notFound(r);
    return new AppFile(name, r);
  }
  async queryPermission() {
    return 'granted';
  }
  async requestPermission() {
    return 'granted';
  }
}

// 연 프로젝트 정보. 대본 파일은 프로젝트 폴더 맨 위의 *.flow.json (없으면 "프로젝트이름.flow.json"을 새로 만듦)
let info: Awaited<ReturnType<PygakiApi['info']>> | null = null;
export async function projectInfo() {
  info ??= await desktop!.info();
  return info;
}
export const gameDir = () => new AppDir('game', 'game');
export const projectDir = () => new AppDir('', '');
export const flowFile = (name: string) => new AppFile(name, name);
