// 오른쪽 편집 칸의 셰이더 고르기. 상자나 label의 [셰이더] 버튼으로 연다.
// 상자에 정하면 그 상자에서만, label에 정하면 그 label의 상자 모두에 걸린다 (상자에 따로 정한 것이 먼저).
// 카드 셋: 셰이더(1번, 2번) / 전환(시작할 때, 끝날 때) / 원고 파일에 들어가는 줄
import { useStore } from './store';
import type { BoxShader } from './types';
import { SHADER_NAMES, SHADER_TRANS, enterTrans, newShader, oldTransLabel, shaderCode, shaderLabel, shaderOfBox, usesShaders } from './shader';
import { exitLinks } from './ops';
import { RPY_FILE } from './gameFolder';

export function ShaderPanel() {
  const so = useStore((s) => s.shaderOf)!;
  const project = useStore((s) => s.project);
  const update = useStore((s) => s.update);
  const linked = !!project.settings.renpyLink;
  const box = so.kind === 'box' ? project.nodes.find((n) => n.id === so.id) : undefined;
  const group = project.labels.find((g) => g.id === (box ? box.group : so.id));
  const owner = so.kind === 'box' ? box : group;
  const close = () => useStore.setState({ shaderOf: null });
  if (!owner) return null;

  const sh = owner.shader;
  const set = (fn: (s: BoxShader) => void, key?: string) =>
    update((p) => {
      const o = so.kind === 'box' ? p.nodes.find((n) => n.id === so.id) : p.labels.find((g) => g.id === so.id);
      if (!o) return;
      o.shader ??= newShader();
      fn(o.shader);
    }, key);
  const clear = () =>
    update((p) => {
      const o = so.kind === 'box' ? p.nodes.find((n) => n.id === so.id) : p.labels.find((g) => g.id === so.id);
      if (o) delete o.shader;
    });
  // 처음 정할 때는 label 것에서 시작하면 고치기 쉽다
  const start = () => set((s) => void (box && group?.shader && Object.assign(s, group.shader)));

  const pick = (key: 'a' | 'b', label: string) => (
    <div className="row">
      <label>{label}</label>
      <select value={sh?.[key] ?? 'none'} onChange={(e) => set((s) => void (s[key] = e.target.value))}>
        {SHADER_NAMES.map(([k, t]) => (
          <option key={k} value={k}>{t}</option>
        ))}
      </select>
    </div>
  );

  // 전환은 둘 중 하나. 예전 대본의 값(게임 설정대로, 서서히)은 고칠 때까지 그대로 두고 옆에 알린다
  const trans = (key: 'in' | 'out', label: string) => {
    const old = oldTransLabel(sh?.[key]);
    return (
      <div className="row">
        <label>{label}</label>
        <div className="seg">
          {SHADER_TRANS.map(([k, t]) => (
            <button key={k} className={sh?.[key] === k ? 'on' : ''} onClick={() => set((s) => void (s[key] = k))}>
              {t}
            </button>
          ))}
        </div>
        {old && <span className="tip">예전 값: {old}. 고르면 바뀌어요.</span>}
      </div>
    );
  };

  const name = box ? `상자 「${box.title || box.id}」` : `label ${group?.title ? `${group.title} (${group.name})` : group?.name}`;
  const nBoxes = project.nodes.filter((n) => n.group === so.id).length;
  const from = box ? project.nodes.filter((n) => exitLinks(n).some((l) => l.target === box.id)) : [];
  const line = !linked ? '# pygaki 플러그인 연결이 꺼져 있어요' : !usesShaders(project) ? '# 셰이더를 정한 곳이 없어서 줄을 넣지 않아요' : box ? shaderCode(shaderOfBox(project, box), enterTrans(project, box, from)) : '';

  return (
    <div className="insp shader-panel">
      <section className="sec">
        <h3>
          셰이더 <button onClick={close}>{box ? '← 상자 편집으로' : '닫기'}</button>
        </h3>
        <p className="tip">{name}{!box && ` · 상자 ${nBoxes}개`}</p>

        <div className="seg">
          <button className={sh ? '' : 'on'} onClick={clear}>
            {box ? 'label을 따름' : '정하지 않음'}
          </button>
          <button className={sh ? 'on' : ''} onClick={() => !sh && start()}>
            {box ? '이 상자에 정하기' : '이 label에 정하기'}
          </button>
        </div>

        {!sh && (
          <p className="tip">
            {box
              ? group?.shader
                ? `지금은 label의 셰이더(${shaderLabel(group.shader)})가 걸려요.`
                : 'label에도 정한 것이 없어서 게임 설정대로 보여요.'
              : '이 label의 상자는 게임 설정대로 보여요. 상자에 따로 정한 것은 그대로예요.'}
          </p>
        )}

        {sh && (
          <>
            {pick('a', '1번')}
            {pick('b', '2번')}
            <p className="tip">1번과 2번이 겹쳐서 보여요. 둘 다 "없음"이면 이 {box ? '상자' : 'label'}에서는 셰이더를 꺼요.</p>
          </>
        )}
        {!linked && <p className="tip warn-text">셰이더는 pygaki 플러그인이 있어야 해요. 왼쪽 [설정]에서 "pygaki 플러그인 연결"을 켜 주세요.</p>}
        <p className="tip">셰이더의 세부 값(막대)은 [GUI 편집] → 셰이더에서 게임 화면을 보면서 고쳐요. 여기서는 어느 상자에 걸지만 정해요.</p>
      </section>

      {sh && (
        <section className="sec">
          <h3>전환</h3>
          {trans('in', '시작할 때')}
          {trans('out', '끝날 때')}
          <p className="tip">
            "시작할 때"는 앞 상자와 셰이더가 달라지는 상자에서 이 셰이더로 바뀌는 모양이에요. 같은 셰이더가 이어지는 상자 사이에서는 전환이 없어요.
            "끝날 때"는 이 셰이더가 끝나고 셰이더가 없는 상자로 넘어갈 때 써요. "없음"이면 바로 바뀌어요.
          </p>
        </section>
      )}

      {box && (
        <section className="sec">
          <h3>{RPY_FILE}에 들어가는 줄</h3>
          <pre className="rpy small">{line}</pre>
          <p className="tip">내보낼 때 이 상자의 첫 줄에 적혀요.</p>
        </section>
      )}
    </div>
  );
}
