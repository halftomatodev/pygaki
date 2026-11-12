// 오른쪽 칸의 셰이더 고르기. 상자나 label의 [◐ 셰이더] 버튼으로 연다.
// 상자에 정하면 그 상자에서만, label에 정하면 그 label의 상자 모두에 걸린다 (상자에 따로 정한 것이 먼저).
// 카드 셋: 셰이더(1번, 2번, 고른 것 아래에 세부 값) / 전환(시작할 때, 끝날 때, TV 세부 값) / 원고 파일에 들어가는 줄
import { Card } from './Card';
import { useState } from 'react';
import { useStore } from './store';
import type { BoxShader } from './types';
import { SHADER_TRANS, enterTransTv, newShader, oldTransLabel, shaderCode, shaderInfo, shaderLabel, shaderNames, shaderOfBox, usesShaderValues, usesShaders, valuesSupported } from './shader';
import { exitLinks } from './ops';
import { RPY_FILE, useGameFolder } from './gameFolder';
import { ScreenFxKnobs } from './fx/ScreenFxCanvas';
import { TvKnobs } from './ShadersView';
import { AllRow, UiCards } from './UiPanel';
import { sceneCode, sceneSupported, uiOfBox, usesSceneUi } from './boxUi';

type Vals = Record<string, unknown>;
function put<T>(o: Record<string, T> | undefined, k: string, v: T | undefined) {
  const n = { ...(o ?? {}) };
  if (v === undefined) delete n[k];
  else n[k] = v;
  return Object.keys(n).length ? n : undefined;
}

export function ShaderPanel() {
  const so = useStore((s) => s.shaderOf)!;
  const project = useStore((s) => s.project);
  const update = useStore((s) => s.update);
  const linked = !!project.settings.renpyLink;
  useGameFolder((g) => g.fxSeq); // 게임 폴더의 셰이더 목록이 바뀌면 다시 그린다
  const [openVals, setOpenVals] = useState<Record<string, boolean>>({}); // 처음에는 바꾼 값이 있는 것만 펼침
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
  const start = () => set((s) => void (box && group?.shader && Object.assign(s, structuredClone(group.shader))));
  const canValues = valuesSupported();

  const isOpen = (k: string, n: number) => openVals[k] ?? n > 0;
  const fold = (k: string, n: number) => (
    <button className="fold-btn" onClick={() => setOpenVals((o) => ({ ...o, [k]: !isOpen(k, n) }))}>
      {isOpen(k, n) ? '▾' : '▸'} 세부 값{n ? ` (${n}개 바꿈)` : ''}
    </button>
  );

  // 셰이더 한 자리: 고르기 → 그 아래에 세부 값 막대
  const slot = (key: 'a' | 'b', label: string) => {
    const vk = key === 'a' ? 'va' : 'vb';
    const name = sh?.[key] ?? 'none';
    const info = name !== 'none' ? shaderInfo(name) : null;
    const vals = (sh?.[vk] ?? {}) as Vals;
    return (
      <div className="sh-slot">
        <div className="row">
          <label>{label}</label>
          <select
            value={name}
            onChange={(e) =>
              set((s) => {
                // 다른 셰이더로 바꾸면 그 자리의 세부 값은 버린다 (값 이름이 다르다)
                if (s[key] !== e.target.value) delete s[vk];
                s[key] = e.target.value;
              })
            }
          >
            {shaderNames([sh?.a, sh?.b]).map(([k, t]) => (
              <option key={k} value={k}>{t}</option>
            ))}
          </select>
        </div>
        {info && (
          <div className="sh-vals">
            {fold(key, Object.keys(vals).length)}
            {isOpen(key, Object.keys(vals).length) && (
              <>
                <ScreenFxKnobs info={info} values={vals} onChange={(k, v) => set((s) => void (s[vk] = put(s[vk] as Vals | undefined, k, v)), 'shv' + key + k)} />
                {Object.keys(vals).length > 0 && (
                  <button className="link-btn" onClick={() => set((s) => void delete s[vk])}>
                    이 셰이더 값 모두 기본으로
                  </button>
                )}
              </>
            )}
          </div>
        )}
      </div>
    );
  };

  // 전환도 셰이더처럼 목록에서 고른다. 예전 대본의 값(게임 설정대로, 서서히)은 고칠 때까지 그대로 두고 목록에 남긴다
  const trans = (key: 'in' | 'out', label: string) => {
    const old = oldTransLabel(sh?.[key]);
    return (
      <div className="row">
        <label>{label}</label>
        <select value={old ? '__old' : (sh?.[key] ?? '')} onChange={(e) => e.target.value !== '__old' && set((s) => void (s[key] = e.target.value))}>
          {SHADER_TRANS.map(([k, t]) => (
            <option key={k} value={k}>{t}</option>
          ))}
          {old && <option value="__old">{old} (예전 값)</option>}
        </select>
      </div>
    );
  };

  const name = box ? `상자 「${box.title || box.id}」` : `label ${group?.title ? `${group.title} (${group.name})` : group?.name}`;
  const nBoxes = project.nodes.filter((n) => n.group === so.id).length;
  const from = box ? project.nodes.filter((n) => exitLinks(n).some((l) => l.target === box.id)) : [];
  const tr = box ? enterTransTv(project, box, from) : { t: '' };
  const line = !linked
    ? '# pygaki 플러그인 연결이 꺼져 있어요'
    : !usesShaders(project)
      ? '# 셰이더를 정한 곳이 없어서 줄을 넣지 않아요'
      : box
        ? shaderCode(shaderOfBox(project, box), tr.t, { tv: canValues ? tr.tv : undefined, values: canValues && usesShaderValues(project) })
        : '';
  const usesTv = !!sh && (sh.in === 'tv' || sh.out === 'tv');
  const tvVals = sh?.tv ?? {};

  return (
    <div className="insp shader-panel">
      <Card id="s-shader" title="셰이더" extra={<button onClick={close}>{box ? '← 상자 편집으로' : '닫기'}</button>}>
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
            {slot('a', '1번')}
            {slot('b', '2번')}
            <p className="tip">1번과 2번이 겹쳐서 보여요. 둘 다 "없음"이면 이 {box ? '상자' : 'label'}에서는 셰이더를 꺼요. 세부 값은 이 {box ? '상자' : 'label'}에서만 쓰고, 바꾸지 않은 값은 게임 설정대로예요.</p>
          </>
        )}
        {sh && !canValues && <p className="tip warn-text">이 게임의 pygaki 플러그인은 예전 판이라 세부 값을 받지 못해요. 화면 효과(screen_fx) 5.5부터 돼요.</p>}
        {!linked && <p className="tip warn-text">셰이더는 pygaki 플러그인이 있어야 해요. 왼쪽 [설정]에서 "pygaki 플러그인 연결"을 켜 주세요.</p>}
        <AllRow
          what="셰이더"
          so={so}
          has={!!(box ? shaderOfBox(project, box) : sh)}
          count={(p) => [...p.nodes, ...p.labels].filter((x) => x.shader).length}
          apply={(p) => {
            const b = so.kind === 'box' ? p.nodes.find((n) => n.id === so.id) : null;
            const src = b ? shaderOfBox(p, b) : p.labels.find((g) => g.id === so.id)?.shader;
            if (!src) return;
            const copy = structuredClone(src);
            for (const n of p.nodes) delete n.shader;
            for (const g of p.labels) g.shader = structuredClone(copy);
          }}
          clear={(p) => {
            for (const x of [...p.nodes, ...p.labels]) delete x.shader;
          }}
        />
      </Card>

      {sh && (
        <Card id="s-trans" title="전환">
          {trans('in', '시작할 때')}
          {trans('out', '끝날 때')}
          {usesTv && (
            <div className="sh-vals">
              {fold('tv', Object.keys(tvVals).length)}
              {isOpen('tv', Object.keys(tvVals).length) && (
                <>
                  <TvKnobs values={tvVals} onChange={(k, v) => set((s) => void (s.tv = put(s.tv, k, v)), 'shtv' + k)} />
                  {Object.keys(tvVals).length > 0 && (
                    <button className="link-btn" onClick={() => set((s) => void delete s.tv)}>
                      TV 값 모두 기본으로
                    </button>
                  )}
                </>
              )}
            </div>
          )}
          <p className="tip">
            "시작할 때"는 앞 상자와 셰이더가 달라지는 상자에서 이 셰이더로 바뀌는 모양이에요. 같은 셰이더가 이어지는 상자 사이에서는 전환이 없어요.
            "끝날 때"는 이 셰이더가 끝나고 셰이더가 없는 상자로 넘어갈 때 써요. "없음"이면 바로 바뀌어요. 모양은 위쪽 [셰이더] → 전환에서 미리 봐요.
          </p>
        </Card>
      )}

      <UiCards so={so} />

      {box && (
        <Card id="s-line" title={`${RPY_FILE}에 들어가는 줄`}>
          <pre className="rpy small">{[line, linked && usesSceneUi(project) && sceneSupported() ? sceneCode(uiOfBox(project, box)) : null].filter(Boolean).join(String.fromCharCode(10))}</pre>
          <p className="tip">내보낼 때 이 상자의 첫 줄에 적혀요.</p>
        </Card>
      )}
    </div>
  );
}
