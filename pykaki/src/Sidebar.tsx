import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { useReactFlow } from '@xyflow/react';
import { useGameFolder } from './gameFolder';
import { isDesktop, projectInfo } from './desktop';
import { newerThanMe, projectFileName } from './files';
import { addBoxCenter, runLayout } from './actions';
import { keyOf, SIZES, usePrefs } from './prefs';
import { forgetFlow } from './flowPick';
import { useStore } from './store';
import { Card, FoldAll, FoldScope } from './Card';
import * as ops from './ops';
import type { Character, LabelGroup } from './types';
import { IDENT, RESERVED, timeStr } from './util';
import { generateRpy, type Warn as Warning } from './exportRpy';
import { exportRpyFile } from './files';

export function Sidebar() {
  const project = useStore((s) => s.project);
  const update = useStore((s) => s.update);
  const sel = useStore((s) => s.selectedIds.length);
  const rf = useReactFlow();
  const sizeLock = usePrefs((p) => p.sizeLock);
  const resized = usePrefs((p) => p.leftW !== SIZES.left.def || p.rightW !== SIZES.right.def);

  const addChar = () =>
    update((p) => {
      let i = p.characters.length + 1;
      while (p.characters.some((c) => c.id === 'c' + i)) i++;
      p.characters.push({ id: 'c' + i, name: '새 캐릭터', color: '#c8c8ff' });
    });

  return (
    <aside className="sidebar">
      <FoldScope name="left">
      <FoldAll />
      <Card id="labels" defFolded title="label (장면)" extra={<button onClick={() => update((p) => void ops.addGroup(p))}>+ 추가</button>}>
        {project.labels.map((g) => (
          <GroupRow key={g.id} g={g} />
        ))}
        <div className="sec-sub">상자와 정렬</div>
        <div className="sec-btns">
          <button className="primary" onClick={() => addBoxCenter(rf)} title={`캔버스 빈 곳 더블클릭으로도 만들 수 있어요 (${keyOf('newBox')})`}>+ 상자</button>
          <button onClick={() => runLayout(rf, 'all')}>전체 정렬</button>
          <button disabled={!sel} onClick={() => runLayout(rf, 'label')} title="선택한 상자의 label 안에서만 정렬">label 정렬</button>
          <button disabled={sel < 2} onClick={() => runLayout(rf, 'selection')} title="Shift+드래그로 여러 상자 선택">선택 정렬</button>
        </div>
        <label className="info-row">
          <span>정렬 방향</span>
          <select value={project.layout.direction} onChange={(e) => update((p) => void (p.layout.direction = e.target.value as 'TB' | 'LR'))}>
            <option value="TB">↓ 위→아래</option>
            <option value="LR">→ 왼→오른</option>
          </select>
        </label>
      </Card>

      <Card id="chars" defFolded title="캐릭터" extra={<button onClick={addChar}>+ 추가</button>}>
        {project.characters.length === 0 && <p className="tip">대사를 말할 캐릭터를 추가하세요. 내레이션은 따로 등록하지 않아도 돼요.</p>}
        {project.characters.map((c, i) => (
          <CharRow key={i} c={c} i={i} />
        ))}
      </Card>

      <WarnCard />

      <Card id="project" defFolded title="렌파이 프로젝트 정보">
        <LinkPanel />
      </Card>

      <ScriptCard />

      <Card id="settings" defFolded title="설정">
        <div className="info-row">
          <span>양쪽 칸 크기</span>
          <span className="mini-btns">
            <button disabled={!resized} onClick={() => usePrefs.setState({ leftW: SIZES.left.def, rightW: SIZES.right.def })} title="왼쪽 칸과 오른쪽 칸의 너비를 처음 크기로 되돌려요">
              처음 크기
            </button>
            <button className={sizeLock ? 'on' : ''} onClick={() => usePrefs.setState({ sizeLock: !sizeLock })} title={sizeLock ? '잠겨 있어요. 누르면 칸 경계를 끌어서 크기를 바꿀 수 있어요' : '누르면 칸 경계를 끌어도 크기가 바뀌지 않아요'}>
              {sizeLock ? '잠김' : '잠금'}
            </button>
          </span>
        </div>
        <p className="tip">{sizeLock ? '칸 크기를 잠갔어요.' : '칸과 캔버스 사이 경계를 끌면 너비가 바뀌어요. 경계를 더블클릭하면 그 칸만 처음 크기로.'}</p>
        <div className="settings">
            <label>
              <input type="checkbox" checked={project.settings.escapeBrackets} onChange={(e) => update((p) => void (p.settings.escapeBrackets = e.target.checked))} />
              [ 를 글자 그대로 ([[ 로 변환)
            </label>
            <label>
              <input type="checkbox" checked={project.settings.allowTextTags} onChange={(e) => update((p) => void (p.settings.allowTextTags = e.target.checked))} />
              텍스트 태그 사용 ({'{b}'} 등)
            </label>
            <label>
              <input type="checkbox" checked={project.settings.escapePercent} onChange={(e) => update((p) => void (p.settings.escapePercent = e.target.checked))} />
              % 를 글자 그대로 (%% 로 변환)
            </label>
            <label>
              <input type="checkbox" checked={!!project.settings.renpyLink} onChange={(e) => update((p) => void (p.settings.renpyLink = e.target.checked))} />
              pygaki 플러그인 연결
            </label>
        </div>
      </Card>

      <Usage />
      </FoldScope>
    </aside>
  );
}

// 지금 대본으로 만든 원고와 경고 (검사, 스크립트 카드가 같이 쓴다)
function useRpy() {
  const project = useStore((s) => s.project);
  const endMarks = useGameFolder((f) => f.endMarks); // 내보낼 때와 같은 형식으로
  return useMemo(() => generateRpy(project, { endMarks }), [project, endMarks]);
}

// 검사: 내보낼 때 걸리는 것. 누르면 그 상자로 간다 (예전에는 오른쪽 [검사] 탭)
function WarnCard() {
  const { warnings } = useRpy();
  const errors = warnings.filter((w) => w.level === 'error').length;
  const go = (w: Warning) => {
    if (!w.nodeId) return;
    useStore.getState().select([w.nodeId]);
    useStore.getState().focusNodes([w.nodeId]);
  };
  return (
    <Card id="warn" defFolded className="warn-card" domId="warn-card" title={<>검사 {warnings.length > 0 && <span className={'count' + (errors ? ' err' : '')}>{warnings.length}</span>}</>}>
      {!warnings.length && <p className="tip">문제가 없어요.</p>}
      {warnings.map((w, i) => (
        <div key={i} className={'warn-item ' + w.level + (w.nodeId ? ' go' : '')} onClick={() => go(w)}>
          {w.level === 'error' ? '⛔ ' : '⚠ '}
          {w.msg}
        </div>
      ))}
    </Card>
  );
}

// 스크립트: 내보낼 원고. 길어서 처음에는 접어 둔다 (예전에는 오른쪽 [스크립트] 탭)
function ScriptCard() {
  const { code } = useRpy();
  return (
    <Card id="script" title="스크립트" defFolded>
      <div className="sec-btns">
        <button onClick={() => navigator.clipboard.writeText(code).then(() => useStore.getState().say('복사했어요'))}>복사</button>
        <button className="primary" onClick={() => exportRpyFile(false)}>.rpy 내보내기</button>
      </div>
      <pre className="rpy side-rpy">{code}</pre>
    </Card>
  );
}

// 사용법 (예전에는 오른쪽 편집 탭에 상자를 고르지 않았을 때 나왔다). 접은 것은 기억한다
function Usage() {
  usePrefs((p) => p.keys); // 단축키를 바꾸면 안내도 다시 그린다
  return (
    <Card id="usage" defFolded title="사용법" className="usage">
      <ul>
          <li>상자를 <b>더블클릭</b>하면 상자 안에서 바로 글을 써요. 대사 줄·제목·선택지를 더블클릭하면 그 칸으로 가요. Esc나 빈 곳 클릭으로 끝내요.</li>
          <li>상자를 한 번 클릭하면 오른쪽에서 label, 다음 흐름 같은 나머지 설정을 바꿔요.</li>
          <li>캔버스 빈 곳을 <b>더블클릭</b>하면 새 상자가 생겨요.</li>
          <li>상자 아래 점(●)을 끌어 다른 상자에 놓으면 연결돼요. 빈 곳에 놓으면 새 상자가 생기며 연결돼요.</li>
          <li>선을 <b>더블클릭</b>하면 jump ↔ call이 바뀌어요.</li>
          <li>같은 label(장면)의 상자는 같은 색이에요. label은 위쪽 목록에서 관리해요.</li>
          <li>상자나 label 오른쪽 위의 <b>◐ 셰이더</b>를 누르면 오른쪽에서 화면 셰이더를 골라요. 상자에 정하면 그 상자에서만, label에 정하면 그 label 전체에 걸려요.</li>
          <li>대사 칸에서 <b>{keyOf('newLine')}</b>: 같은 화자로 다음 줄 추가.</li>
          <li><b>{keyOf('focus')}</b>: 집중 모드. 캔버스만 남기고 나머지를 숨겨요. 한 번 더 누르면 돌아와요.</li>
          <li>{keyOf('save')} 파일 저장 · {keyOf('undo')} 실행 취소 · {keyOf('export')} .rpy 다시 내보내기</li>
          <li>단축키와 화면 색은 위쪽 둘째 줄 [설정]에서 바꿔요.</li>
          <li>카드 제목 오른쪽 [접기]를 누르면 이름만 남기고 접혀요.</li>
      </ul>
    </Card>
  );
}

// 정보 한 줄: 왼쪽에 이름, 오른쪽에 값
function Info({ k, children }: { k: string; children: ReactNode }) {
  return (
    <div className="info-row">
      <span>{k}</span>
      <b>{children}</b>
    </div>
  );
}

// 저장 상태 (예전에는 위쪽 줄 오른쪽에 있었다)
function SaveInfo() {
  const fileName = useStore((v) => v.fileName);
  const dirty = useStore((v) => v.dirty);
  const savedAt = useStore((v) => v.localSavedAt);
  return (
    <>
      <Info k="파일 저장">
        {!fileName ? '파일로 저장 안 됨' : dirty ? '저장 안 한 변경 있음' : '저장됨'}
        {dirty && <i className="dirty" title="파일로 저장하지 않은 변경이 있어요"> ●</i>}
      </Info>
      {savedAt && <Info k="자동 저장">{timeStr(savedAt)}</Info>}
    </>
  );
}

// 렌파이 프로젝트 정보: 프로젝트, 대본 파일, 저장 상태, 찾은 그림·소리, 경고를 한곳에.
// 폴더를 열고 읽는 단추는 위쪽 줄에 있다 (웹에서 처음 연결하는 단추만 여기)
function LinkPanel() {
  const f = useGameFolder();
  const hasStart = useStore((v) => v.project.labels.some((l) => l.name === 'start'));
  const fileName = useStore((v) => v.fileName); // 대본 파일이 바뀌면 다시 그린다
  const app = useStore((v) => v.project.app);
  const flowFile = fileName && projectFileName();
  const newer = app && newerThanMe(useStore.getState().project) && (
    <p className="tip warn-text">
      이 대본은 더 새 판({app.by} {app.build})에서 저장했어요. 앱을 새 판으로 바꾸세요. 이 판으로 내보내면 일부 줄이 빠질 수 있어요.
    </p>
  );
  const clash = f.startClash && hasStart && <p className="tip warn-text">{f.startClash}에도 label start가 있어요. 대본의 start label 이름을 바꾸거나 그 파일의 label start를 지워 주세요.</p>;
  const media = (
    <>
      <Info k="그림과 영상">{f.media.images.length}개</Info>
      <Info k="소리">{f.media.audio.length}개</Info>
    </>
  );
  const [info, setInfo] = useState<{ project: string; flows: string[] } | null>(null);
  useEffect(() => void (isDesktop && projectInfo().then(setInfo)), []);
  if (isDesktop)
    return (
      <div className="link-panel">
        <Info k="프로젝트">{f.name}</Info>
        <Info k="대본 파일">{flowFile}</Info>
        {info && info.flows.length > 1 && (
          <button
            className="info-btn"
            onClick={() => {
              if (useStore.getState().dirty && !confirm('아직 파일에 저장하지 않은 변경이 있어요. 그래도 다른 대본 파일을 고를까요?')) return;
              forgetFlow(info.project);
              location.reload();
            }}
          >
            다른 대본 파일 고르기
          </button>
        )}
        <SaveInfo />
        {media}
        {newer}
        {!f.hasShowpy && <p className="tip">이 프로젝트에는 pygaki 플러그인이 없어요. 위치와 화면 효과를 렌파이에서 고치려면 런처 새 프로젝트 만들기의 "Pygaki"로 만든 프로젝트를 쓰세요.</p>}
        {clash}
      </div>
    );
  // 개발 서버를 브라우저로 열었을 때 (웹 버전은 없앰)
  return (
    <div className="link-panel">
      <SaveInfo />
      <p className="tip">개발용 화면이에요. 렌파이 프로젝트는 pygaki 앱에서 열어요(런처의 [pygaki로 편집]).</p>
      {newer}
    </div>
  );
}

function CharRow({ c, i }: { c: Character; i: number }) {
  const update = useStore((s) => s.update);
  const chars = useStore((s) => s.project.characters);
  const [id, setId] = useState(c.id);
  useEffect(() => setId(c.id), [c.id]);
  const bad = !IDENT.test(id) || RESERVED.has(id) || chars.some((o, j) => j !== i && o.id === id);

  // id는 입력을 마쳤을 때 확정하고, 그 캐릭터의 대사도 같이 바꾼다
  const commit = () => {
    if (id === c.id) return;
    if (bad) {
      alert(`"${id}"는 캐릭터 id로 쓸 수 없어요 (영문·숫자·_ , 중복 불가)`);
      return setId(c.id);
    }
    update((p) => {
      p.characters[i].id = id;
      for (const n of p.nodes) for (const l of n.lines) if (l.type === 'say' && l.who === c.id) l.who = id;
    });
  };

  const remove = () => {
    const used = useStore.getState().project.nodes.some((n) => n.lines.some((l) => l.who === c.id));
    if (used && !confirm(`${c.name}의 대사가 남아 있어요. 그래도 지울까요? (대사는 "등록되지 않은 화자"로 남아요)`)) return;
    update((p) => void p.characters.splice(i, 1));
  };

  return (
    <div className="item">
      <input type="color" value={c.color} onChange={(e) => update((p) => void (p.characters[i].color = e.target.value), 'ccolor' + i)} />
      <input
        className={'cid' + (bad ? ' invalid' : '')}
        value={id}
        onChange={(e) => setId(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
        title="렌파이 변수 이름 (예: a, alice)"
      />
      <input value={c.name} onChange={(e) => update((p) => void (p.characters[i].name = e.target.value), 'cname' + i)} placeholder="표시 이름" />
      <button className="x" onClick={remove} title="삭제">✕</button>
    </div>
  );
}

function GroupRow({ g }: { g: LabelGroup }) {
  const update = useStore((s) => s.update);
  const project = useStore((s) => s.project);
  const ids = project.nodes.filter((n) => n.group === g.id).map((n) => n.id);
  const bad = !IDENT.test(g.name) || RESERVED.has(g.name) || project.labels.some((o) => o.id !== g.id && o.name === g.name);
  const set = (fn: (x: LabelGroup) => void, key?: string) =>
    update((p) => fn(p.labels.find((l) => l.id === g.id)!), key);

  const focus = () => {
    if (!ids.length) return;
    useStore.getState().select(ids);
    useStore.getState().focusNodes(ids);
  };

  return (
    <div className="grp" style={{ borderLeftColor: g.color }}>
      <div className="item">
        <input type="color" value={g.color} onChange={(e) => set((x) => void (x.color = e.target.value), 'gcolor' + g.id)} />
        <input className={'gname' + (bad ? ' invalid' : '')} value={g.name} onChange={(e) => set((x) => void (x.name = e.target.value.replace(/\s/g, '_')), 'gname' + g.id)} title="렌파이 label 이름 (영문·숫자·_)" />
        <button onClick={focus} disabled={!ids.length} title="이 label의 상자들로 이동하고 선택">{ids.length}</button>
        <button className="x" disabled={!!ids.length} onClick={() => update((p) => void (p.labels = p.labels.filter((l) => l.id !== g.id)))} title={ids.length ? '상자가 남아 있으면 지울 수 없어요' : '삭제'}>✕</button>
      </div>
      <input className="gtitle" value={g.title} onChange={(e) => set((x) => void (x.title = e.target.value), 'gtitle' + g.id)} placeholder="표시 제목 (한글 가능)" />
    </div>
  );
}
