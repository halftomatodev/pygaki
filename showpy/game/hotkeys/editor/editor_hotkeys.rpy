################################################################################
## Hotkeys — UI Kit 편집기 탭 "단축키" (hotkeys 1.1)
##
## UI Kit 플러그인이 있으면 그 편집기(개발 모드에서 Shift+M)에 탭을 더합니다.
## UI Kit이 없으면 이 파일은 아무것도 하지 않고, 단축키는 hotkeys_config.rpy대로입니다.
## pygaki 앱의 [GUI 편집] 화면에도 이 탭의 패널이 그대로 나옵니다 (ui_kit 공통 틀).
##
##   새 단축키: 줄마다 키 하나, 동작 하나, 조작방법 화면에 보일 설명.
##     키는 [키 누르기]를 누르고 게임 창에서 키를 누르거나, 아래 키 단추에서 고릅니다.
##     렌파이 기본 단축키와 겹치면 알려 주고, [기본에서 빼기]로 기본 쪽에서 뺍니다.
##   조작방법 화면 목록: 설정 파일 목록을 그대로 쓰거나, [직접 적기로 바꾸기]로 고칩니다.
##     설명을 적은 단축키 줄은 이 목록 아래에 저절로 붙습니다.
##     스플래시의 조작 방법 페이지가 "keys": "auto"이면 같은 목록을 씁니다.
##   고치는 동안 바로 게임에 적용되고(편집기를 닫으면 눌러 볼 수 있음), 저장하면
##   이 플러그인 폴더의 hotkeys_layout.rpy에 적습니다. 그 파일을 지우면 설정 파일 값으로 돌아갑니다.
################################################################################

init offset = 1

## UI Kit 편집기(init -9, -8)를 읽은 뒤에 실행됩니다.
init -6 python in hotkeys:

    import json
    import os
    from store import DictEquality

    _ed = getattr(store, "ui_editor", None)
    HAS_EDITOR = (_ed is not None) and hasattr(_ed, "register") and hasattr(_ed, "Tab")

    _EDITOR_FILE = store.renpy.get_filename_line()[0].replace("\\", "/")

    def _tr(s):
        return "_(" + json.dumps(s, ensure_ascii=False) + ")"

    ## 렌파이 기본 단축키 이름 → 쉬운 이름 (겹칠 때 알림에 씀)
    KEYMAP_LABELS = {
        "dismiss": "대사 넘기기", "rollback": "이전 대사로", "rollforward": "다음 대사로",
        "skip": "누르는 동안 스킵", "stop_skipping": "스킵 멈춤", "toggle_skip": "스킵 켜기/끄기", "fast_skip": "빨리 스킵",
        "hide_windows": "UI 숨기기", "screenshot": "스크린샷", "toggle_fullscreen": "전체 화면",
        "game_menu": "게임 메뉴", "accessibility": "접근성 메뉴", "self_voicing": "대사 읽어주기",
        "clipboard_voicing": "대사 복사 읽기", "debug_voicing": "읽어주기 확인", "quit": "끝내기",
        "iconify": "창 내리기", "help": "도움말", "choose_renderer": "그리기 방식 고르기",
        "progress_screen": "진행 화면", "director": "연출 도구(개발)", "developer": "개발 메뉴(개발)",
        "reload_game": "다시 불러오기(개발)", "inspector": "스타일 보기(개발)", "full_inspector": "스타일 보기(개발)",
        "console": "콘솔(개발)", "profile_once": "성능 기록(개발)", "memory_profile": "메모리 기록(개발)",
        "performance": "성능 보기(개발)", "image_load_log": "그림 기록(개발)", "bubble_editor": "말풍선 편집(개발)",
        "save_delete": "저장 지우기", "translate": "번역 보기(개발)", "drag_activate": "끌기",
        }

    KEYMAP_PREFIX = (
        ("focus_", "메뉴 이동"), ("bar_", "막대 조절"), ("viewport_", "스크롤"),
        ("input_", "입력 칸"), ("button_", "버튼 누르기"), ("drag_", "끌기"), ("dismiss", "대사 넘기기"),
        )

    def keymap_label(name):
        if name in KEYMAP_LABELS:
            return KEYMAP_LABELS[name]
        for p, label in KEYMAP_PREFIX:
            if name.startswith(p):
                return label
        return name

    ## 키 단추 (게임 창 밖, pygaki 앱에서도 고를 수 있게)
    GRID_KEYS = (
        [ "K_" + c for c in "abcdefghijklmnopqrstuvwxyz" ] +
        [ "K_" + c for c in "1234567890" ] +
        [ "K_F{}".format(i) for i in range(1, 13) ] +
        [ "K_SPACE", "K_RETURN", "K_BACKSPACE", "K_TAB", "K_INSERT", "K_DELETE", "K_HOME", "K_END",
          "K_PAGEUP", "K_PAGEDOWN", "K_LEFT", "K_RIGHT", "K_UP", "K_DOWN",
          "K_MINUS", "K_EQUALS", "K_COMMA", "K_PERIOD", "K_SLASH" ]
        )

    def make_key(mods, key):
        """수식키 집합과 키 → 렌파이 키 이름. Shift를 안 고르면 Shift 없을 때만 (noshift_)."""
        out = [ ]
        for m in ("ctrl", "alt", "meta"):
            if m in mods:
                out.append(m)
        out.append("shift" if "shift" in mods else "noshift")
        out.append(key)
        return "_".join(out)

    if HAS_EDITOR:

        import pygame_sdl2 as pygame

        _KEYCONST = { }
        for _n in sorted(dir(pygame)):
            if _n.startswith("K_"):
                _KEYCONST.setdefault(getattr(pygame, _n), _n)
        for _n in GRID_KEYS:
            if hasattr(pygame, _n):
                _KEYCONST[getattr(pygame, _n)] = _n

        _MOD_KEYS = set(getattr(pygame, n) for n in ("K_LSHIFT", "K_RSHIFT", "K_LCTRL", "K_RCTRL", "K_LALT", "K_RALT",
            "K_LGUI", "K_RGUI", "K_LMETA", "K_RMETA", "K_CAPSLOCK", "K_NUMLOCK", "K_MODE") if hasattr(pygame, n))

        def root_path(filename):
            """이 플러그인 폴더(hotkeys/) 안 파일의 실제 경로."""
            root = os.path.dirname(os.path.dirname(_EDITOR_FILE))
            for base in (store.config.basedir, store.config.gamedir):
                if os.path.isdir(os.path.join(base, root)):
                    return os.path.join(base, root, filename)
            return os.path.join(store.config.gamedir, filename)

        ## ── 글 입력 칸 (앱에서도 보임) ──

        class HotkeyInput(store.InputValue, DictEquality):
            """what: "bhelp"(단축키 줄의 설명) 또는 "help"(조작방법 목록 칸). part: 0 키, 1 설명"""
            default = False
            editable = True
            returnable = False

            def __init__(self, what, index, part=None):
                self.what = what
                self.index = index
                self.part = part
                self.text = None

            def _cur(self):
                t = _ed.get_tab("hotkeys")
                w = t.work_or_saved()
                try:
                    if self.what == "bhelp":
                        return w["bindings"][self.index].get("help") or ""
                    return w["help"][self.index][self.part] or ""
                except Exception:
                    return ""

            def get_text(self):
                return self._cur() if self.text is None else self.text

            def set_text(self, s):
                self.text = s
                store.renpy.restart_interaction()

            def enter(self):
                s = self.text if self.text is not None else self.get_text()
                t = _ed.get_tab("hotkeys")
                if self.what == "bhelp":
                    t.set_binding_help(self.index, s)
                else:
                    t.set_help_cell(self.index, self.part, s)
                self.text = None
                store.renpy.run(self.Disable())
                raise store.renpy.IgnoreEvent()

            def cancel(self):
                self.text = None
                store.renpy.run(self.Disable())

            def commit(self):
                if self.text is not None:
                    try:
                        self.enter()
                    except store.renpy.IgnoreEvent:
                        pass

        _inputs = { }

        def panel_input(what, index, part=None):
            k = (what, index, part)
            if k not in _inputs:
                _inputs[k] = HotkeyInput(what, index, part)
            return _inputs[k]

        ## ── 게임 창에서 키 누르기 ──

        class KeyCatcher(store.renpy.Displayable):
            """[키 누르기]를 누른 뒤 게임 창에서 누른 키를 받습니다. (편집기 입력 층보다 위)"""

            def render(self, width, height, st, at):
                return store.renpy.Render(width, height)

            def event(self, ev, x, y, st):
                t = _ed.get_tab("hotkeys")
                if t is None or not t.capturing or not _ed.state.open:
                    return None
                if ev.type == pygame.KEYUP:
                    raise store.renpy.IgnoreEvent()
                if ev.type != pygame.KEYDOWN:
                    return None
                if ev.key in _MOD_KEYS:
                    raise store.renpy.IgnoreEvent()
                t.capturing = False
                if ev.key == pygame.K_ESCAPE:
                    _ed.msg("키 누르기를 그만뒀습니다.")
                    raise store.renpy.IgnoreEvent()
                name = _KEYCONST.get(ev.key)
                if name is None:
                    _ed.msg("이 키는 이름을 몰라서 쓸 수 없습니다.")
                    raise store.renpy.IgnoreEvent()
                mods = set()
                m = getattr(ev, "mod", 0) or 0
                if m & pygame.KMOD_SHIFT:
                    mods.add("shift")
                if m & pygame.KMOD_CTRL:
                    mods.add("ctrl")
                if m & pygame.KMOD_ALT:
                    mods.add("alt")
                if m & getattr(pygame, "KMOD_META", 0):
                    mods.add("meta")
                t.mods = set(mods)
                t.set_key(name)
                raise store.renpy.IgnoreEvent()

        key_catcher = KeyCatcher()

        ## ── 탭 ──

        class HotkeysTab(_ed.Tab):

            id = "hotkeys"
            label = "단축키"
            panel_screen = "ui_editor_hotkeys_panel"
            overlay_screen = "ui_editor_hotkeys_overlay"
            shows_line = True

            def __init__(self):
                self.work = None        # 저장 전 값 (None이면 고친 것 없음)
                self.sel = None         # 고른 단축키 줄 (편집 화면 줄 번호)
                self.help_sel = None    # 고른 조작방법 목록 줄
                self.mods = set()       # 키 단추로 고를 때의 Shift, Ctrl, Alt
                self.capturing = False
                self.pick = None        # None, "key", "action"

            def available(self):
                return (True, "")

            def on_close(self):
                self.capturing = False

            ## 값
            def saved(self):
                if state.saved is None:
                    state.saved = _copy_layout(cfg("layout"))
                return state.saved

            def work_or_saved(self):
                return self.work if self.work is not None else self.saved()

            def _edit(self):
                if self.work is None:
                    self.work = _copy_layout(self.saved())
                return self.work

            def _changed(self):
                w = self.work
                if w is not None and self._same(w, self.saved()):
                    self.work = None
                apply_layout(self.work)
                store.renpy.restart_interaction()

            def _norm(self, d):
                b = [ (tuple(x.get("keys") or [ ]), x.get("do"), x.get("help") or None) for x in d["bindings"] ]
                u = sorted((k, tuple(v)) for k, v in d["unbind"].items() if v)
                h = None if d["help"] is None else [ (a, c) for a, c in d["help"] ]
                return (b, u, h)

            def _same(self, a, b):
                return self._norm(a) == self._norm(b)

            def pending(self):
                if self.work is None:
                    return 0
                a, b = self._norm(self.work), self._norm(self.saved())
                return sum(1 for i in range(3) if a[i] != b[i])

            def discard(self):
                self.work = None
                self.capturing = False
                apply_layout(None)
                store.renpy.restart_interaction()

            ## 단축키 줄
            def rows(self):
                return self.work_or_saved()["bindings"]

            def config_rows(self):
                return _config_bindings()

            def select(self, i):
                rows = self.rows()
                self.sel = i if (i is not None and 0 <= i < len(rows)) else None
                self.capturing = False
                if self.sel is not None:
                    keys = rows[self.sel].get("keys") or [ ]
                    p = parse_key(keys[0]) if keys else None
                    self.mods = set(m for m in (p[0] if p else ( )) if m in ("shift", "ctrl", "alt", "meta"))
                store.renpy.restart_interaction()

            def open_pick(self, i, what):
                if self.sel != i:
                    self.select(i)
                self.pick = None if self.pick == what else what
                store.renpy.restart_interaction()

            def add_row(self):
                w = self._edit()
                i = (self.sel + 1) if self.sel is not None else len(w["bindings"])
                w["bindings"].insert(i, store.python_dict(keys=[ ], do=None, help=None))
                self.select(i)
                self.pick = "key"
                self._changed()

            def del_row(self):
                if self.sel is None:
                    return
                w = self._edit()
                if self.sel < len(w["bindings"]):
                    del w["bindings"][self.sel]
                self.sel = None
                self.capturing = False
                self._changed()

            def move_row(self, d):
                if self.sel is None:
                    return
                w = self._edit()
                b = w["bindings"]
                j = self.sel + d
                if 0 <= j < len(b):
                    b[self.sel], b[j] = b[j], b[self.sel]
                    self.sel = j
                    self._changed()

            def cur_key(self):
                if self.sel is None or self.sel >= len(self.rows()):
                    return None
                keys = self.rows()[self.sel].get("keys") or [ ]
                return keys[0] if keys else None

            def set_key(self, key):
                """키 단추나 게임 창에서 고른 키 (수식키 없는 이름 "K_s")."""
                if self.sel is None:
                    return
                name = make_key(self.mods, key)
                p = parse_key(name)
                ek = _ed.editor_key()
                if parse_key(ek) is not None and overlaps(name, ek):
                    _ed.msg("{}는 편집 화면을 여는 키라서 쓸 수 없습니다.".format(key_label(name)))
                    return
                for j, b in enumerate(self.rows()):
                    if j != self.sel and any(overlaps(name, k) for k in (b.get("keys") or [ ])):
                        _ed.msg("{}는 {}번 줄에서 이미 씁니다.".format(key_label(name), j + 1))
                        return
                for b in self.config_rows():
                    if any(overlaps(name, k) for k in b["keys"]):
                        _ed.msg("{}는 hotkeys_config.rpy의 단축키가 이미 씁니다.".format(key_label(name)))
                        return
                w = self._edit()
                w["bindings"][self.sel]["keys"] = [ name ]
                self._changed()
                c = self.conflicts()
                if c:
                    _ed.msg("{}: 렌파이 기본 단축키와 겹칩니다. 아래에서 [[기본에서 빼기]를 누르면 새 동작만 됩니다.".format(key_label(name)))
                else:
                    _ed.msg("키: " + key_label(name))

            def toggle_mod(self, m):
                if m in self.mods:
                    self.mods.discard(m)
                else:
                    self.mods.add(m)
                k = self.cur_key()
                p = parse_key(k) if k else None
                if p is not None:
                    self.set_key(p[1])
                store.renpy.restart_interaction()

            def start_capture(self):
                if self.sel is None:
                    return
                self.capturing = not self.capturing
                if self.capturing:
                    _ed.msg("게임 창에서 키를 누르세요 (Shift, Ctrl, Alt와 같이 눌러도 됨). Esc는 그만두기.")
                store.renpy.restart_interaction()

            def set_action(self, aid):
                if self.sel is None:
                    return
                w = self._edit()
                w["bindings"][self.sel]["do"] = aid
                self.pick = None
                self._changed()

            def set_binding_help(self, i, s):
                w = self._edit()
                if i < len(w["bindings"]):
                    w["bindings"][i]["help"] = s.strip() or None
                self._changed()

            def conflicts(self):
                """고른 줄의 키와 겹치는 렌파이 기본 단축키 [(이름, 뺐는지)]"""
                k = self.cur_key()
                if not k:
                    return [ ]
                rv = [ ]
                orig = state.orig or { }
                ub = all_unbind()
                for name, lst in orig.items():
                    hits = [ x for x in lst if overlaps(k, x) ]
                    if not hits:
                        continue
                    removed = all(x in ub.get(name, [ ]) for x in hits)
                    rv.append((name, hits, removed))
                return rv

            def toggle_unbind(self, name, keys):
                w = self._edit()
                cur = w["unbind"].setdefault(name, store.python_list())
                if all(x in cur for x in keys):
                    for x in keys:
                        while x in cur:
                            cur.remove(x)
                else:
                    for x in keys:
                        if x not in cur:
                            cur.append(x)
                if not cur:
                    del w["unbind"][name]
                self._changed()

            def unbind_rows(self):
                """[(이름, 키, 어디서)]"""
                rv = [ ]
                for name, keys in cfg("unbind").items():
                    for k in ([ keys ] if isinstance(keys, str) else keys):
                        rv.append((name, k, "config"))
                for name, keys in self.work_or_saved()["unbind"].items():
                    for k in keys:
                        rv.append((name, k, "layout"))
                return rv

            ## 조작방법 화면 목록
            def help_manual(self):
                return self.work_or_saved()["help"] is not None

            def help_rows(self):
                return base_help()

            def help_to_manual(self):
                w = self._edit()
                w["help"] = store.python_list((a, b) for a, b in base_help())
                self.help_sel = None
                self._changed()
                _ed.msg("설정 파일 목록을 복사해 넣었습니다. 이제 칸마다 고칠 수 있습니다.")

            def help_to_config(self):
                w = self._edit()
                w["help"] = None
                self.help_sel = None
                self._changed()

            def set_help_cell(self, i, part, s):
                w = self._edit()
                h = w["help"]
                if h is None or i >= len(h):
                    return
                r = list(h[i])
                r[part] = s
                if not r[0].strip() and not r[1].strip():
                    del h[i]
                    self.help_sel = None
                else:
                    h[i] = tuple(r)
                self._changed()

            def help_add(self):
                w = self._edit()
                h = w["help"]
                if h is None:
                    return
                i = (self.help_sel + 1) if self.help_sel is not None else len(h)
                h.insert(i, ("키", "설명"))
                self.help_sel = i
                self._changed()

            def help_del(self):
                w = self._edit()
                h = w["help"]
                if h is None or self.help_sel is None or self.help_sel >= len(h):
                    return
                del h[self.help_sel]
                self.help_sel = None
                self._changed()

            def help_move(self, d):
                w = self._edit()
                h = w["help"]
                if h is None or self.help_sel is None:
                    return
                j = self.help_sel + d
                if 0 <= j < len(h):
                    h[self.help_sel], h[j] = h[j], h[self.help_sel]
                    self.help_sel = j
                    self._changed()

            ## 스플래시 조작 방법 페이지로
            def splash_tab(self):
                t = _ed.get_tab("splash")
                if t is None or not hasattr(t, "keys_page"):
                    return None
                return t

            def go_splash(self):
                t = self.splash_tab()
                if t is None:
                    return
                pid = t.keys_page()
                if pid is not None:
                    t.set_page(pid)
                _ed.switch_tab("splash")

            ## 저장
            def file_path(self, filename):
                return root_path(filename)

            def layout_file(self):
                w = self.work_or_saved()
                header = getattr(getattr(store, "ui_kit", None), "file_header", None)
                notes = [
                    "여기 적힌 단축키와 뺀 키는 hotkeys_config.rpy의 것에 더해집니다.",
                    "\"help\" 목록이 있으면 조작방법 화면이 설정 파일의 keyboard_help 대신 이 목록을 씁니다.",
                    "이 파일을 지우면 설정 파일 값으로 돌아갑니다.",
                    ]
                if header is not None:
                    lines = header("게임 안 편집 화면이 저장한 단축키입니다.", notes)
                else:
                    lines = [ "## 게임 안 편집 화면이 저장한 단축키입니다. (자동 생성)", "" ]
                lines.append("define hotkeys.layout = {")
                lines.append('    "bindings": [')
                for b in w["bindings"]:
                    keys = [ k for k in (b.get("keys") or [ ]) if k ]
                    if not keys or not b.get("do"):
                        continue
                    parts = [ '"keys": [ ' + ", ".join(json.dumps(k) for k in keys) + " ]", '"do": ' + json.dumps(b["do"]) ]
                    if b.get("help"):
                        parts.append('"help": ' + _tr(b["help"]))
                    lines.append("        { " + ", ".join(parts) + " },    # " + keys_label(keys) + ": " + action_label(b["do"]))
                lines.append("    ],")
                lines.append('    "unbind": {')
                for name in sorted(w["unbind"]):
                    keys = w["unbind"][name]
                    if keys:
                        lines.append('        {}: [ {} ],    # {}'.format(json.dumps(name), ", ".join(json.dumps(k) for k in keys), keymap_label(name)))
                lines.append("    },")
                if w["help"] is not None:
                    lines.append('    "help": [')
                    for a, c in w["help"]:
                        lines.append("        ({}, {}),".format(_tr(a), _tr(c)))
                    lines.append("    ],")
                lines.append("}")
                lines.append("")
                return ("hotkeys_layout.rpy", "\n".join(lines))

            def after_save(self):
                ## store 변수(hotkeys.layout)가 아니라 실행 중 값으로 (다시 불러올 때 옛 값이 덮지 않게)
                w = self.work_or_saved()
                w["bindings"] = store.python_list(b for b in w["bindings"] if b.get("keys") and b.get("do"))
                state.saved = _copy_layout(w)
                self.work = None
                self.sel = None
                apply_layout(None)
                return False

            def copy_text(self):
                return self.layout_file()[1]

            def info_lines(self):
                n = len([ b for b in self.rows() if b.get("keys") and b.get("do") ])
                rv = [ "설정 파일 단축키 {}개, 편집 화면 단축키 {}개".format(len(self.config_rows()), n) ]
                rv.append("저장 안 한 변경 있음 (게임에는 벌써 적용됨)" if self.pending() else "저장 안 한 변경 없음")
                for e in state.errors:
                    rv.append("오류: " + e)
                return rv

            def help_lines(self):
                return [
                    "줄을 고르고 키와 동작을 정함. 설명을 적으면 조작방법 화면 목록 아래에 붙음",
                    "고치면 바로 적용됨: 편집 화면을 닫고 눌러 봄. 저장하면 hotkeys/hotkeys_layout.rpy",
                    ]

            def session(self):
                return dict(sel=self.sel)

            def restore(self, d):
                self.sel = d.get("sel")

        _ed.register(HotkeysTab())


## ── 화면 ─────────────────────────────────────────────────────────────────────

screen ui_editor_hotkeys_overlay():
    ## 게임 창에서 누른 키를 받는 층 ([키 누르기]를 눌렀을 때만)
    add hotkeys.key_catcher


screen ui_editor_hotkeys_panel(tab):

    $ _rows = tab.rows()

    vbox:
        spacing 4

        ## ── 새 단축키 ──
        text "새 단축키" style "ui_editor_text"

        for _b in tab.config_rows():
            hbox:
                spacing 6
                text "  설정 파일" style "ui_editor_small" yalign 0.5 min_width 80
                text hotkeys.keys_label(_b["keys"]) style "ui_editor_small" yalign 0.5 min_width 110
                text (hotkeys.action_label(_b["do"]) if _b.get("do") else "(설정 파일의 동작)") style "ui_editor_small" yalign 0.5 min_width 150
                text (_b.get("help") or "") style "ui_editor_small" yalign 0.5

        for _i, _b in enumerate(_rows):
            hbox:
                spacing 4
                textbutton str(_i + 1) style "ui_editor_button" text_size 12 action Function(tab.select, _i) selected (tab.sel == _i)
                textbutton (hotkeys.keys_label(_b["keys"]) if _b.get("keys") else "(키 고르기)"):
                    style "ui_editor_button"
                    text_size 13
                    xsize 130
                    action Function(tab.open_pick, _i, "key")
                    selected (tab.sel == _i and tab.pick == "key")
                textbutton (hotkeys.action_label(_b["do"]) if _b.get("do") else "(동작 고르기)"):
                    style "ui_editor_button"
                    text_size 13
                    xsize 190
                    action Function(tab.open_pick, _i, "action")
                    selected (tab.sel == _i and tab.pick == "action")
                button:
                    style "ui_editor_button"
                    xsize 250
                    yminimum 30
                    action hotkeys.panel_input("bhelp", _i).Toggle()
                    input value hotkeys.panel_input("bhelp", _i) style "ui_editor_text" size 14 length 200 xmaximum 230

        if not _rows:
            text "  편집 화면에서 만든 단축키가 없습니다. [[줄 더하기]로 만듭니다." style "ui_editor_small"
        else:
            text "  오른쪽 칸: 조작방법 화면에 보일 설명 (비우면 안 보임)" style "ui_editor_small"

        hbox:
            spacing 4
            textbutton "줄 더하기" style "ui_editor_button" text_size 13 action Function(tab.add_row)
            textbutton "줄 지우기" style "ui_editor_button" text_size 13 action Function(tab.del_row) sensitive (tab.sel is not None)
            textbutton "위로" style "ui_editor_button" text_size 13 action Function(tab.move_row, -1) sensitive (tab.sel is not None)
            textbutton "아래로" style "ui_editor_button" text_size 13 action Function(tab.move_row, 1) sensitive (tab.sel is not None)

        ## ── 고른 줄: 키 ──
        if tab.sel is not None and tab.pick == "key":
            null height 2
            text ("{}번 줄의 키: ".format(tab.sel + 1) + (hotkeys.key_label(tab.cur_key()) if tab.cur_key() else "없음")) style "ui_editor_text"
            hbox:
                spacing 4
                textbutton ("게임 창에서 누르는 중... (Esc 그만)" if tab.capturing else "키 누르기 (게임 창)") style "ui_editor_button" text_size 13 action Function(tab.start_capture) selected tab.capturing
                for _m, _ml in (("shift", "Shift"), ("ctrl", "Ctrl"), ("alt", "Alt")):
                    textbutton _ml style "ui_editor_button" text_size 13 action Function(tab.toggle_mod, _m) selected (_m in tab.mods)
            hbox:
                spacing 3
                box_wrap True
                box_wrap_spacing 3
                xmaximum 620
                for _k in hotkeys.GRID_KEYS:
                    textbutton hotkeys.key_label(_k) style "ui_editor_button" text_size 12 action Function(tab.set_key, _k) selected (tab.cur_key() is not None and hotkeys.parse_key(tab.cur_key())[1] == _k)

            $ _cs = tab.conflicts()
            if _cs:
                text "렌파이 기본 단축키와 겹침:" style "ui_editor_small" color "#ffd23b"
                for _name, _hits, _removed in _cs:
                    hbox:
                        spacing 6
                        text ("  " + hotkeys.keymap_label(_name) + " (" + _name + ")") style "ui_editor_small" yalign 0.5 min_width 300
                        textbutton ("기본에 다시 넣기" if _removed else "기본에서 빼기") style "ui_editor_button" text_size 12 action Function(tab.toggle_unbind, _name, _hits) yalign 0.5
                text "  메뉴 이동, 입력 칸 같은 것을 빼면 그 기능이 그 키로 안 됩니다." style "ui_editor_small"

        ## ── 고른 줄: 동작 ──
        if tab.sel is not None and tab.pick == "action":
            null height 2
            text "{}번 줄의 동작".format(tab.sel + 1) style "ui_editor_text"
            hbox:
                spacing 3
                box_wrap True
                box_wrap_spacing 3
                xmaximum 620
                for _aid, _al, _f in hotkeys.ACTIONS:
                    if _aid != "controls_page" or tab.splash_tab() is not None:
                        textbutton _al style "ui_editor_button" text_size 13 action Function(tab.set_action, _aid) selected (_rows[tab.sel].get("do") == _aid)

        ## ── 기본에서 뺀 키 ──
        $ _ub = tab.unbind_rows()
        if _ub:
            null height 2
            text "기본 단축키에서 뺀 키" style "ui_editor_text"
            for _name, _k, _src in _ub:
                hbox:
                    spacing 6
                    text ("  " + hotkeys.key_label(_k)) style "ui_editor_small" yalign 0.5 min_width 120
                    text (hotkeys.keymap_label(_name) + " (" + _name + ")") style "ui_editor_small" yalign 0.5 min_width 260
                    if _src == "layout":
                        textbutton "다시 넣기" style "ui_editor_button" text_size 12 action Function(tab.toggle_unbind, _name, [ _k ]) yalign 0.5
                    else:
                        text "설정 파일" style "ui_editor_small" yalign 0.5

        ## ── 조작방법 화면 목록 ──
        null height 4
        text "조작방법 화면 목록" style "ui_editor_text"
        if not tab.help_manual():
            hbox:
                spacing 6
                text "  설정 파일 목록 그대로 씀" style "ui_editor_small" yalign 0.5
                textbutton "직접 적기로 바꾸기" style "ui_editor_button" text_size 13 action Function(tab.help_to_manual)
            for _a, _d in tab.help_rows():
                hbox:
                    spacing 6
                    text ("  " + _a) style "ui_editor_small" min_width 190
                    text _d style "ui_editor_small" xmaximum 420
        else:
            $ _h = tab.work_or_saved()["help"]
            for _i in range(len(_h)):
                hbox:
                    spacing 4
                    textbutton str(_i + 1) style "ui_editor_button" text_size 12 action SetField(tab, "help_sel", _i) selected (tab.help_sel == _i)
                    button:
                        style "ui_editor_button"
                        xsize 190
                        yminimum 30
                        action hotkeys.panel_input("help", _i, 0).Toggle()
                        input value hotkeys.panel_input("help", _i, 0) style "ui_editor_text" size 14 length 200 xmaximum 170
                    button:
                        style "ui_editor_button"
                        xsize 390
                        yminimum 30
                        action hotkeys.panel_input("help", _i, 1).Toggle()
                        input value hotkeys.panel_input("help", _i, 1) style "ui_editor_text" size 14 length 300 xmaximum 370
            hbox:
                spacing 4
                textbutton "줄 더하기" style "ui_editor_button" text_size 13 action Function(tab.help_add)
                textbutton "줄 지우기" style "ui_editor_button" text_size 13 action Function(tab.help_del) sensitive (tab.help_sel is not None)
                textbutton "위로" style "ui_editor_button" text_size 13 action Function(tab.help_move, -1) sensitive (tab.help_sel is not None)
                textbutton "아래로" style "ui_editor_button" text_size 13 action Function(tab.help_move, 1) sensitive (tab.help_sel is not None)
                textbutton "설정 파일 목록으로" style "ui_editor_button" text_size 13 action Function(tab.help_to_config)

        $ _bh = hotkeys.binding_help()
        if _bh:
            text "  단축키 설명 (같은 키 줄은 바꾸고, 없으면 아래에 붙음):" style "ui_editor_small"
            for _a, _d in _bh:
                hbox:
                    spacing 6
                    text ("  " + _a) style "ui_editor_small" min_width 190 color "#ffd23b"
                    text _d style "ui_editor_small" xmaximum 420

        if tab.splash_tab() is not None:
            null height 2
            hbox:
                spacing 6
                textbutton "스플래시 조작 방법 페이지로" style "ui_editor_button" text_size 13 action Function(tab.go_splash)
                text "(표가 \"auto\"면 이 목록을 그대로 씀)" style "ui_editor_small" yalign 0.5
