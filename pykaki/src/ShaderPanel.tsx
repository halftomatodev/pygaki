// 오른쪽 칸의 셰이더 고르기. 상자나 label의 [◐ 셰이더] 버튼으로 연다.
// 상자에 정하면 그 상자에서만, label에 정하면 그 label의 상자 모두에 걸린다 (상자에 따로 정한 것이 먼저).
// 카드 셋: 셰이더(1번, 2번, 고른 것 아래에 세부 값) / 전환(시작할 때, 끝날 때, TV 세부 값) / 원고 파일에 들어가는 줄
import { Card } from './Card';
import { Hint } from './Help';
import { useState } from 'react';
import { useStore } from './store';
import type { BoxShader } from './types';
import { IMG_TRANS_DIR, SHADER_TRANS, enterTransTv, imgTransSupported, isImgTrans, newShader, oldTransLabel, shaderCode, shaderInfo, shaderLabel, shaderNames, shaderOfBox, usesShaderValues, usesShaders, valuesSupported } from './shader';
import { exitLinks } from './ops';
import { RPY_FILE, useGameFolder } from './gameFolder';
import { ScreenFxKnobs } from './fx/ScreenFxCanvas';
import { TvKnobs } from './ShadersView';
import { shaderEffect } from './fx/textShaders';
import { AllRow } from './UiPanel';
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
        <label>
          {label}
          <Hint text={key === 'in' ? '앞 상자와 셰이더가 달라질 때 이 셰이더로 바뀌는 모양' : '이 셰이더가 끝나고 셰이더 없는 상자로 갈 때의 모양'} topic="셰이더 (상자" />
        </label>
        <select value={old ? '__old' : (sh?.[key] ?? '')} onChange={(e) => e.target.value !== '__old' && set((s) => void (s[key] = e.target.value))}>
          {SHADER_TRANS.map(([k, t]) => (
            <option key={k} value={k}>{t}</option>
          ))}
          {old && <option value="__old">{old} (예전 값)</option>}
        </select>
      </div>
    );
  };
  // 그림 전환의 방향 (데이터모싱: 회전·확산, 픽셀소트: 가로·세로·회전·확산). 효과 파일에 그 값이 있을 때만
  const dirRow = (fxName: string) => {
    const d = IMG_TRANS_DIR[fxName];
    const fx = shaderEffect(fxName);
    if (!d || fx?.kind !== 'transition') return null;
    const [k, opts] = d;
    const def = fx.uniforms.find(([u]) => u === 'u__' + k);
    if (!def) return null;
    const cur = sh?.iv?.[fxName]?.[k] ?? Number(def[1]);
    return (
      <div className="row" key={'dir' + fxName}>
        <label>
          방향
          <Hint text={`${SHADER_TRANS.find(([n]) => n === fxName)?.[1] ?? fxName}이 깨지는 방향. 깨진 채 멈췄다가 다음 화면으로 끊어 넘어가요`} topic="셰이더 (상자" />
        </label>
        <div className="seg">
          {opts.map(([v, t]) => (
            <button
              key={v}
              className={Math.round(cur) === v ? 'on' : ''}
              onClick={() =>
                set((s) => {
                  const all = { ...(s.iv ?? {}) };
                  const mine = { ...(all[fxName] ?? {}) };
                  if (v === Math.round(Number(def[1]))) delete mine[k];
                  else mine[k] = v;
                  if (Object.keys(mine).length) all[fxName] = mine;
                  else delete all[fxName];
                  if (Object.keys(all).length) s.iv = all;
                  else delete s.iv;
                })
              }
            >
              {t}
            </button>
          ))}
        </div>
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
        ? shaderCode(shaderOfBox(project, box), tr.t, { tv: canValues ? tr.tv : undefined, time: tr.time, iv: tr.iv, values: canValues && usesShaderValues(project) })
        : '';
  const usesTv = !!sh && (sh.in === 'tv' || sh.out === 'tv');
  const tvVals = sh?.tv ?? {};
  // 그림 전환(픽셀소트, 데이터모싱): 걸리는 시간 막대 하나. 기본은 그 효과 파일의 @time
  const imgName = isImgTrans(sh?.in) ? sh!.in! : isImgTrans(sh?.out) ? sh!.out! : null;
  const imgFx = imgName ? shaderEffect(imgName) : undefined;
  const imgTime = sh?.time ?? (imgFx?.kind === 'transition' ? imgFx.time : 1);

  return (
    <div className="insp shader-panel">
      <Card id="s-shader" title="셰이더" hint="1번과 2번이 겹쳐 보여요. 둘 다 없음이면 셰이더를 꺼요" topic="셰이더" extra={<button onClick={close}>{box ? '← 상자 편집으로' : '닫기'}</button>}>
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
                ? `지금: label의 ${shaderLabel(group.shader)}`
                : '지금: 게임 설정대로'
              : '지금: 게임 설정대로'}
          </p>
        )}

        {sh && (
          <>
            {slot('a', '1번')}
            {slot('b', '2번')}
          </>
        )}
        {sh && !canValues && <p className="tip warn-text">예전 플러그인이라 세부 값은 안 돼요 (screen_fx 5.5부터).</p>}
        {!linked && <p className="tip warn-text">pygaki 플러그인 연결이 꺼져 있어요 (왼쪽 [설정]).</p>}
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
        <Card id="s-trans" title="전환" hint="셰이더가 바뀔 때의 모양. 미리 보기는 위쪽 [셰이더] 화면" topic="셰이더 (상자">
          {trans('in', '시작할 때')}
          {isImgTrans(sh.in) && dirRow(sh.in!)}
          {trans('out', '끝날 때')}
          {isImgTrans(sh.out) && sh.out !== sh.in && dirRow(sh.out!)}
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
          {imgName && (
            <>
              <div className="fx-knobs">
                <label className={sh.time !== undefined ? 'set' : ''}>
                  <span className="fx-kn" title="duration">그림 전환 시간(초)</span>
                  <input type="range" min={0.3} max={4} step={0.1} value={imgTime} onChange={(e) => set((s) => void (s.time = Number(e.target.value)), 'shtime')} />
                  <span className="fx-kv">{imgTime.toFixed(1)}</span>
                  <button className="fx-x" style={{ visibility: sh.time !== undefined ? 'visible' : 'hidden' }} title="기본값으로" onClick={(e) => (e.preventDefault(), set((s) => void delete s.time))}>↺</button>
                </label>
              </div>
              {!imgTransSupported() && <p className="tip warn-text">예전 플러그인이라 TV 꺼짐·켜짐으로 내보내요 (screen_fx 5.6부터).</p>}
              {imgTransSupported() && imgFx?.kind !== 'transition' && (
                <p className="tip warn-text">효과 폴더에 {imgName}이 없어서 TV 꺼짐·켜짐으로 내보내요 ([효과]에서 넣기).</p>
              )}
            </>
          )}
        </Card>
      )}

      {box && (
        <Card id="s-line" title={`${RPY_FILE}에 들어가는 줄`} hint="내보낼 때 이 상자의 첫 줄에 적혀요">
          <pre className="rpy small">{[line, linked && usesSceneUi(project) && sceneSupported() ? sceneCode(uiOfBox(box)) : null].filter(Boolean).join(String.fromCharCode(10))}</pre>
        </Card>
      )}
    </div>
  );
}
