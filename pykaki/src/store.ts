import { create } from 'zustand';
import type { Project } from './types';

export type Tab = 'edit' | 'play' | 'warn' | 'rpy';
export interface PlayView { current: string | null; line: string | null; visitedNodes: string[]; visitedEdges: string[] }

interface S {
  project: Project;
  past: Project[];
  future: Project[];
  lastKey: string | null;
  lastTime: number;
  dirty: boolean; // 파일로 저장한 뒤 바뀐 것이 있는지
  fileName: string | null;
  localSavedAt: number | null;
  flash: string | null;
  selectedIds: string[];
  focusLineId: string | null;
  activeLine: string | null; // 지금 쓰고 있는 줄. 오른쪽 글자 효과 칸이 따라간다
  inlineEdit: string | null; // 상자 안에서 바로 편집 중인 상자 id
  tab: Tab;
  playing: boolean;
  playStart: string | null;
  playLine: string | null; // 상자 가운데서 시작할 때 그 줄
  playSession: number;
  play: PlayView | null;
  fullPlay: boolean; // 전체화면 플레이 중
  playResume: { box: string; line: string | null } | null; // 전체화면에서 돌아올 때 보던 줄. 다시 들어가면 여기부터
  focusReq: { ids: string[]; t: number } | null;
  animating: boolean;
  focusMode: boolean; // 집중 모드: 캔버스만 남기고 나머지 화면을 숨긴다
  showPrefs: boolean; // 환경 설정 창
  flowMenu: boolean; // 다음 흐름 창을 키보드로 고르는 중
  shaderOf: { kind: 'box' | 'label'; id: string } | null; // 오른쪽 칸에서 셰이더를 고르는 중인 상자나 label
  hideLeft: boolean; // 왼쪽 칸 접음
  hideRight: boolean; // 오른쪽 칸 접음
  openShader(kind: 'box' | 'label', id: string): void;
  togglePanel(side: 'left' | 'right'): void;
  update(fn: (p: Project) => void, key?: string): void;
  load(p: Project, o?: { fileName?: string | null; dirty?: boolean }): void;
  undo(): void;
  redo(): void;
  select(ids: string[]): void;
  focusNodes(ids: string[]): void;
  startPlay(from?: string | null, line?: string | null): void;
  stopPlay(): void;
  say(msg: string): void;
}

const readFlag = (k: string) => {
  try {
    return localStorage.getItem(k) === '1';
  } catch {
    return false;
  }
};

let flashTimer:ReturnType<typeof setTimeout> | undefined;

export const useStore = create<S>((set, get) => ({
  project: null as unknown as Project,
  past: [],
  future: [],
  lastKey: null,
  lastTime: 0,
  dirty: false,
  fileName: null,
  localSavedAt: null,
  flash: null,
  selectedIds: [],
  focusLineId: null,
  activeLine: null,
  inlineEdit: null,
  tab: 'edit',
  playing: false,
  playStart: null,
  playLine: null,
  playSession: 0,
  play: null,
  fullPlay: false,
  playResume: null,
  focusReq: null,
  animating: false,
  focusMode: false,
  showPrefs: false,
  flowMenu: false,
  shaderOf: null,
  hideLeft: readFlag('pygaki-hide-left'),
  hideRight: readFlag('pygaki-hide-right'),

  // 상자나 label의 [셰이더] 버튼: 오른쪽 편집 칸을 셰이더 고르기로 (접혀 있으면 편다)
  openShader: (kind, id) => {
    const cur = get().shaderOf;
    if (cur?.kind === kind && cur.id === id) return set({ shaderOf: null });
    get().select(kind === 'box' ? [id] : []);
    set({ shaderOf: { kind, id }, tab: 'edit', hideRight: false });
  },

  togglePanel: (side) =>
    set((s) => {
      const k = side === 'left' ? 'hideLeft' : 'hideRight';
      try {
        localStorage.setItem(side === 'left' ? 'pygaki-hide-left' : 'pygaki-hide-right', s[k] ? '0' : '1');
      } catch {
        // 못 적어도 이번에는 바뀜
      }
      return { [k]: !s[k] } as Partial<S>;
    }),

  // 같은 key로 빠르게 이어지는 변경(타이핑)은 실행 취소 한 번으로 묶는다
  update: (fn, key) =>
    set((s) => {
      const next = structuredClone(s.project);
      fn(next);
      const now = Date.now();
      const merge = !!key && key === s.lastKey && now - s.lastTime < 1200;
      return {
        project: next,
        past: merge ? s.past : [...s.past.slice(-99), s.project],
        future: [],
        lastKey: key ?? null,
        lastTime: now,
        dirty: true,
      };
    }),

  load: (p, o = {}) =>
    set({
      project: p,
      past: [],
      future: [],
      lastKey: null,
      dirty: o.dirty ?? false,
      fileName: o.fileName === undefined ? get().fileName : o.fileName,
      selectedIds: [],
      inlineEdit: null,
      shaderOf: null,
      playing: false,
      play: null,
      fullPlay: false,
      playResume: null,
      focusReq: { ids: p.nodes.map((n) => n.id), t: Date.now() },
    }),

  undo: () =>
    set((s) => {
      if (!s.past.length) return {};
      return { project: s.past[s.past.length - 1], past: s.past.slice(0, -1), future: [s.project, ...s.future], lastKey: null, dirty: true };
    }),

  redo: () =>
    set((s) => {
      if (!s.future.length) return {};
      return { project: s.future[0], future: s.future.slice(1), past: [...s.past, s.project], lastKey: null, dirty: true };
    }),

  select: (ids) => {
    const cur = get().selectedIds;
    if (cur.length === ids.length && ids.every((x) => cur.includes(x))) return;
    const ie = get().inlineEdit;
    // 셰이더 고르기는 그 상자만 골라져 있는 동안(label은 아무 상자도 안 고른 동안)만 열어 둔다
    const so = get().shaderOf;
    const keep = so && (so.kind === 'box' ? ids.length === 1 && ids[0] === so.id : !ids.length);
    set({ selectedIds: ids, inlineEdit: ie && ids.includes(ie) ? ie : null, shaderOf: keep ? so : null });
  },

  focusNodes: (ids) => set({ focusReq: { ids, t: Date.now() } }),

  startPlay: (from = null, line = null) => set((s) => ({ tab: 'play', playing: true, playStart: from, playLine: line, playSession: s.playSession + 1 })),

  stopPlay: () => set({ playing: false, play: null, fullPlay: false }),

  say: (msg) => {
    clearTimeout(flashTimer);
    set({ flash: msg });
    flashTimer = setTimeout(() => set({ flash: null }), 2500);
  },
}));
