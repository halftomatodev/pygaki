// 데스크톱 앱: 프로젝트 폴더에 대본 파일(.flow.json)이 여러 개면 처음 열 때 고르게 한다 (SPEC 9-3)
// 고른 것은 프로젝트마다 기억한다. 왼쪽 칸 [다른 대본 파일]로 다시 고른다
import { desktop } from './desktop';
import { normalizeProject } from './sample';
import { summary } from './files';

const key = (project: string) => 'pygaki-flow:' + project;

export function forgetFlow(project: string) {
  try {
    localStorage.removeItem(key(project));
  } catch {
    /* 못 지워도 괜찮음 */
  }
}

export async function chooseFlow(inf: { project: string; name: string; flows: string[] }): Promise<string> {
  let saved: string | null = null;
  try {
    saved = localStorage.getItem(key(inf.project));
  } catch {
    /* 없음 */
  }
  if (saved && inf.flows.includes(saved)) return saved;
  if (inf.flows.length <= 1) return inf.flows[0] ?? `${inf.name}.flow.json`;

  const rows = await Promise.all(
    inf.flows.map(async (name) => {
      const st = await desktop!.stat(name);
      try {
        const bytes = await desktop!.read(name);
        const p = normalizeProject(JSON.parse(new TextDecoder().decode(bytes!)));
        return { name, text: summary(p, st?.mtime), mtime: st?.mtime ?? 0 };
      } catch {
        return { name, text: '읽을 수 없는 파일', mtime: st?.mtime ?? 0 };
      }
    }),
  );
  const newest = rows.reduce((a, b) => (b.mtime > a.mtime ? b : a)).name;

  const name = await new Promise<string>((res) => {
    const bg = document.createElement('div');
    bg.className = 'modal-bg';
    const box = document.createElement('div');
    box.className = 'modal flow-pick';
    const h = document.createElement('h3');
    h.textContent = '어느 대본을 열까요?';
    const tip = document.createElement('p');
    tip.className = 'tip';
    tip.textContent = `${inf.name} 폴더에 대본 파일이 ${rows.length}개 있어요. 고른 파일에 자동 저장되고, 다음에도 그 파일을 열어요.`;
    box.append(h, tip);
    for (const r of rows) {
      const b = document.createElement('button');
      if (r.name === newest) b.className = 'primary';
      const t = document.createElement('b');
      t.textContent = r.name + (r.name === newest ? ' (가장 최근)' : '');
      const d = document.createElement('small');
      d.textContent = r.text;
      b.append(t, document.createElement('br'), d);
      b.onclick = () => {
        bg.remove();
        res(r.name);
      };
      box.append(b);
    }
    bg.append(box);
    document.body.append(bg);
  });
  try {
    localStorage.setItem(key(inf.project), name);
  } catch {
    /* 기억 못 해도 괜찮음 */
  }
  return name;
}
