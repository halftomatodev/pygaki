################################################################################
## Hotkeys — UI Kit 편집기 탭 "단축키 수정" (hotkeys 1.2)
##
## UI Kit 플러그인이 있으면 그 편집기(개발 모드에서 Shift+M)에 탭을 더합니다.
## UI Kit이 없으면 이 파일은 아무것도 하지 않고, 단축키는 hotkeys_config.rpy대로입니다.
## pygaki 앱의 [GUI 편집] 화면에도 이 탭의 패널이 그대로 나옵니다 (ui_kit 공통 틀).
## 스플래시 플러그인이 있으면 탭 버튼이 "스플래시" 바로 뒤에 섭니다.
##
##   표: 줄마다 기능 이름과 키 단추. 렌파이 기본 기능(대사 넘기기, 스킵, 스크린샷 ...)과
##     정해 둔 동작(퀵세이브, 환경설정 열기 ...)이 처음부터 들어 있습니다.
##     키 단추를 누르고 게임 창에서 바꿀 키를 누르면 바뀝니다(Esc 그만두기).
##     [+]는 키 하나 더, [키 단추로]는 화면의 키 단추에서 고르기(앱에서도 됨).
##     다른 기능이 쓰는 키면 경고와 안내를 보이고, [그쪽에서 빼고 바꾸기]를 눌러야 바뀝니다.
##   [안내 화면으로 내보내기]: 스플래시 조작 안내 화면의 표가 이 표를 따라갑니다("keys": "hotkeys").
##     보여 줄 기능은 스플래시 탭의 조작 안내 화면에서 고릅니다.
##   ESC 조작방법 화면 목록: 바꾼 키가 저절로 들어가고, [직접 적기로 바꾸기]로 고칠 수도 있습니다.
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
        [ "K_ESCAPE", "K_SPACE", "K_RETURN", "K_BACKSPACE", "K_TAB", "K_INSERT", "K_DELETE", "K_HOME", "K_END",
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

    def key_owners(key, skip=None):
        """이 키를 이미 쓰는 것 [(종류, 이름, 보일 이름, 겹치는 키)].
        종류: "func" 표의 기능 / "keymap" 표에 없는 렌파이 기본 단축키 / "binding" 표에 없는 단축키 줄 (("config"|"layout", 번호))"""
        rv = [ ]
        table = set(f[3] for f in FUNCS if f[2] == "keymap")
        for f in FUNCS:
            if f[0] == skip:
                continue
            hits = [ k for k in func_keys(f[0]) if overlaps(key, k) ]
            if hits:
                rv.append(("func", f[0], f[1], hits))
        for name, lst in sorted(store.config.keymap.items()):
            if name in table or name.startswith("hotkeys_"):
                continue
            hits = [ k for k in lst if overlaps(key, k) ]
            if hits:
                rv.append(("keymap", name, keymap_label(name), hits))
        lay = current_layout()
        for src, rows in (("config", _config_bindings()), ("layout", lay["bindings"])):
            for j, b in enumerate(rows):
                f = func(b.get("do")) if b.get("do") else None
                if src == "config" and f is not None and f[2] == "do":
                    continue
                hits = [ k for k in (b.get("keys") or [ ]) if overlaps(key, k) ]
                if hits:
                    label = action_label(b["do"]) if b.get("do") else "설정 파일 단축키"
                    rv.append(("binding", (src, j), label, hits))
        return rv

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

        ## 혼자 눌러서 키로 쓸 수 있는 수식키 (누르는 동안 스킵의 Ctrl 등)
        _LONE_MODS = set(getattr(pygame, n) for n in ("K_LSHIFT", "K_RSHIFT", "K_LCTRL", "K_RCTRL", "K_LALT", "K_RALT") if hasattr(pygame, n))

        def root_path(filename):
            """이 플러그인 폴더(hotkeys/) 안 파일의 실제 경로."""
            root = os.path.dirname(os.path.dirname(_EDITOR_FILE))
            for base in (store.config.basedir, store.config.gamedir):
                if os.path.isdir(os.path.join(base, root)):
                    return os.path.join(base, root, filename)
            return os.path.join(store.config.gamedir, filename)

        ## ── 글 입력 칸 (앱에서도 보임) ──

        class HotkeyInput(store.InputValue, DictEquality):
            """what: "desc"(기능 설명, index = 기능 id) 또는 "help"(조작방법 목록 칸, part 0 키 / 1 설명)"""
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
                    if self.what == "desc":
                        return func_desc(self.index)
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
                if self.what == "desc":
                    t.set_desc(self.index, s)
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
            """키 단추를 누른 뒤 게임 창에서 누른 키를 받습니다. (편집기 입력 층보다 위)"""

            def __init__(self, **kw):
                super(KeyCatcher, self).__init__(**kw)
                self.lone = None    # 혼자 누른 수식키 (떼면 그 키로)

            def render(self, width, height, st, at):
                return store.renpy.Render(width, height)

            def _mods(self, ev):
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
                return mods

            def event(self, ev, x, y, st):
                t = _ed.get_tab("hotkeys")
                if t is None or t.capturing is None or not _ed.state.open:
                    self.lone = None
                    return None
                if ev.type == pygame.KEYUP:
                    if self.lone is not None and ev.key == self.lone:
                        name = _KEYCONST.get(ev.key)
                        self.lone = None
                        if name:
                            t.got_key("anymod_" + name)
                    raise store.renpy.IgnoreEvent()
                if ev.type != pygame.KEYDOWN:
                    return None
                if ev.key in _MOD_KEYS:
                    self.lone = ev.key if ev.key in _LONE_MODS else None
                    raise store.renpy.IgnoreEvent()
                self.lone = None
                if ev.key == pygame.K_ESCAPE:
                    t.capturing = None
                    _ed.msg("키 바꾸기를 그만뒀습니다. (Esc를 쓰려면 [[키 단추로]에서 고르세요)")
                    raise store.renpy.IgnoreEvent()
                name = _KEYCONST.get(ev.key)
                if name is None:
                    t.capturing = None
                    _ed.msg("이 키는 이름을 몰라서 쓸 수 없습니다.")
                    raise store.renpy.IgnoreEvent()
                t.got_key(make_key(self._mods(ev), name))
                raise store.renpy.IgnoreEvent()

        key_catcher = KeyCatcher()

        ## ── 탭 ──

        class HotkeysTab(_ed.Tab):

            id = "hotkeys"
            label = "단축키 수정"
            panel_screen = "ui_editor_hotkeys_panel"
            overlay_screen = "ui_editor_hotkeys_overlay"
            shows_line = True

            def __init__(self):
                self.work = None        # 저장 전 값 (None이면 고친 것 없음)
                self.sel = None         # 고른 기능 id
                self.capturing = None   # 게임 창에서 키를 받는 기능 id
                self.adding = False     # True면 키를 하나 더 (아니면 바꾸기)
                self.grid = False       # 고른 기능 아래에 키 단추
                self.mods = set()       # 키 단추로 고를 때의 Shift, Ctrl, Alt
                self.conflict = None    # 겹침: dict(fid, key, add, owners)
                self.show_help = False  # ESC 조작방법 화면 목록 펼침
                self.help_sel = None    # 고른 조작방법 목록 줄

            def available(self):
                return (True, "")

            def on_close(self):
                self.capturing = None

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
                ## 고치는 동안 func_keys 등이 이 값을 보게
                state.current = self.work
                return self.work

            def _changed(self):
                w = self.work
                if w is not None and self._same(w, self.saved()):
                    self.work = None
                apply_layout(self.work)
                store.renpy.restart_interaction()

            def _norm(self, d):
                k = sorted((f, tuple(v)) for f, v in d["keys"].items())
                ds = sorted((f, v) for f, v in d["desc"].items() if v)
                b = [ (tuple(x.get("keys") or [ ]), x.get("do"), x.get("help") or None) for x in d["bindings"] ]
                u = sorted((n, tuple(v)) for n, v in d["unbind"].items() if v)
                h = None if d["help"] is None else [ (a, c) for a, c in d["help"] ]
                return (k, ds, b, u, h)

            def _same(self, a, b):
                return self._norm(a) == self._norm(b)

            def pending(self):
                if self.work is None:
                    return 0
                a, b = self._norm(self.work), self._norm(self.saved())
                n = sum(1 for i in range(2, 5) if a[i] != b[i])
                n += len(set(a[0]) ^ set(b[0])) + len(set(a[1]) ^ set(b[1]))
                return max(n, 1) if a != b else 0

            def discard(self):
                self.work = None
                self.capturing = None
                self.conflict = None
                apply_layout(None)
                store.renpy.restart_interaction()

            ## ── 표 ──
            def rows(self):
                if getattr(store, "splash", None) is None:
                    return [ f for f in FUNCS if f[0] != "controls_page" ]
                return FUNCS

            def keys_of(self, fid):
                return func_keys(fid)

            def key_text(self, fid):
                return keys_text(func_keys(fid))

            def from_config(self, fid):
                """설정 파일 bindings에서 온 키인지 (정해 둔 동작)."""
                f = func(fid)
                return f is not None and f[2] == "do" and not func_changed(fid) and bool(default_keys(fid))

            def select(self, fid):
                if self.sel != fid:
                    self.grid = False
                    self.conflict = None
                self.sel = fid
                store.renpy.restart_interaction()

            def start_capture(self, fid, add=False):
                if self.capturing == fid and self.adding == add:
                    self.capturing = None
                    _ed.msg("키 바꾸기를 그만뒀습니다.")
                    return
                self.select(fid)
                self.capturing = fid
                self.adding = add
                self.conflict = None
                _ed.msg("게임 창에서 '{}'에 {} 키를 누르세요 (Shift, Ctrl, Alt와 같이 눌러도 됨). Esc는 그만두기.".format(
                    func_label(fid), "더할" if add else "쓸"))

            def toggle_grid(self, fid):
                self.select(fid)
                self.grid = not self.grid
                self.capturing = None
                store.renpy.restart_interaction()

            def toggle_mod(self, m):
                if m in self.mods:
                    self.mods.discard(m)
                else:
                    self.mods.add(m)
                store.renpy.restart_interaction()

            def grid_key(self, key):
                """키 단추에서 고른 키 (수식키 없는 이름 "K_s")."""
                if self.sel is None:
                    return
                self.capturing = self.sel
                self.got_key(make_key(self.mods, key))

            def got_key(self, name):
                fid = self.capturing
                add = self.adding
                self.capturing = None
                if fid is None:
                    return
                self.try_set(fid, name, add)

            def try_set(self, fid, key, add=False):
                ek = _ed.editor_key()
                if parse_key(ek) is not None and overlaps(key, ek):
                    _ed.msg("{}는 편집 화면을 여는 키라서 쓸 수 없습니다.".format(key_label(key)))
                    return
                if any(overlaps(key, k) for k in func_keys(fid)):
                    _ed.msg("'{}'에는 이미 {} 키가 있습니다.".format(func_label(fid), key_label(key)))
                    return
                owners = key_owners(key, fid)
                fixed = [ o for o in owners if o[0] == "binding" and o[1][0] == "config" ]
                if fixed:
                    _ed.msg("{}는 hotkeys_config.rpy의 단축키({})가 씁니다. 그 파일에서 고치거나 다른 키를 고르세요.".format(key_label(key), fixed[0][2]))
                    return
                if owners:
                    self.conflict = dict(fid=fid, key=key, add=add, owners=owners)
                    _ed.msg("{}는 '{}'에서 쓰고 있습니다. 아래 안내를 보고 고르세요.".format(
                        key_label(key), "', '".join(o[2] for o in owners)))
                    store.renpy.restart_interaction()
                    return
                self._set(fid, key, add, [ ])

            def conflict_for(self, fid):
                c = self.conflict
                return c if (c is not None and c["fid"] == fid) else None

            def conflict_dev(self):
                """겹치는 것 가운데 렌파이 화면 조작(메뉴 이동, 입력 칸 등)이 있는지."""
                c = self.conflict
                if c is None:
                    return False
                return any(o[0] == "keymap" and any(o[1].startswith(p) for p, l in KEYMAP_PREFIX) for o in c["owners"])

            def resolve(self, ok):
                c = self.conflict
                self.conflict = None
                if c is None:
                    return
                if not ok:
                    _ed.msg("바꾸지 않았습니다.")
                    store.renpy.restart_interaction()
                    return
                self._set(c["fid"], c["key"], c["add"], c["owners"])

            def _put_keys(self, w, fid, keys):
                keys = list(keys)
                if keys == default_keys(fid):
                    w["keys"].pop(fid, None)
                else:
                    w["keys"][fid] = store.python_list(keys)

            def _set(self, fid, key, add, owners):
                w = self._edit()
                cur = func_keys(fid)
                for kind, oid, label, hits in owners:
                    if kind == "func":
                        self._put_keys(w, oid, [ k for k in func_keys(oid) if not overlaps(key, k) ])
                    elif kind == "keymap":
                        lst = w["unbind"].setdefault(oid, store.python_list())
                        for k in hits:
                            if k not in lst:
                                lst.append(k)
                    elif kind == "binding" and oid[0] == "layout":
                        b = w["bindings"][oid[1]]
                        b["keys"] = [ k for k in (b.get("keys") or [ ]) if not overlaps(key, k) ]
                w["bindings"] = store.python_list(b for b in w["bindings"] if b.get("keys"))
                self._put_keys(w, fid, (cur + [ key ]) if add else [ key ])
                self._changed()
                moved = [ o[2] for o in owners ]
                _ed.msg("'{}' 키: {}{}".format(func_label(fid), self.key_text(fid) or "없음",
                    ("  ('{}'에서는 뺐습니다)".format("', '".join(moved)) if moved else "")))

            def clear_keys(self, fid):
                w = self._edit()
                self._put_keys(w, fid, [ ])
                self.conflict = None
                self._changed()
                _ed.msg("'{}'의 키를 모두 뺐습니다.".format(func_label(fid)))

            def reset_keys(self, fid):
                w = self._edit()
                w["keys"].pop(fid, None)
                self.conflict = None
                ## 처음 키를 그새 다른 기능이 가져갔으면 그 키는 빼고 돌림 (두 기능이 같은 키가 되지 않게)
                keep, taken = [ ], [ ]
                for k in default_keys(fid):
                    owners = [ o for o in key_owners(k, fid) if o[0] != "keymap" ]
                    if owners:
                        taken.append("{}({})".format(key_label(k), owners[0][2]))
                    else:
                        keep.append(k)
                if taken:
                    self._put_keys(w, fid, keep)
                self._changed()
                m = "'{}'를 처음 키로 돌렸습니다: {}".format(func_label(fid), self.key_text(fid) or "없음")
                if taken:
                    m += "  (다른 기능이 쓰는 키는 뺌: {})".format(", ".join(taken))
                _ed.msg(m)

            def set_desc(self, fid, s):
                w = self._edit()
                s = s.strip()
                if not s or s == func_label(fid):
                    w["desc"].pop(fid, None)
                else:
                    w["desc"][fid] = s
                self._changed()

            ## 렌파이 기본에서 뺀 키 (표에 없는 기본 단축키)
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
                """[(이름, 키, 어디서)] (표의 기본 기능은 빼고)"""
                table = set(f[3] for f in FUNCS if f[2] == "keymap")
                rv = [ ]
                for name, keys in cfg("unbind").items():
                    for k in ([ keys ] if isinstance(keys, str) else keys):
                        rv.append((name, k, "config"))
                for name, keys in self.work_or_saved()["unbind"].items():
                    if name in table:
                        continue
                    for k in keys:
                        rv.append((name, k, "layout"))
                return rv

            ## 예전(1.1) 편집 화면 줄 가운데 표로 못 옮긴 것
            def legacy_rows(self):
                return self.work_or_saved()["bindings"]

            def del_legacy(self, i):
                w = self._edit()
                if 0 <= i < len(w["bindings"]):
                    del w["bindings"][i]
                self._changed()

            ## ── 안내 화면으로 내보내기 ──
            def splash_tab(self):
                t = _ed.get_tab("splash")
                if t is None or not hasattr(t, "link_hotkeys"):
                    return None
                return t

            def export_guide(self):
                t = self.splash_tab()
                if t is None:
                    _ed.msg("pygaki 스플래시가 있어야 조작 안내 화면으로 내보낼 수 있습니다.")
                    return
                self.capturing = None
                t.link_hotkeys()
                _ed.switch_tab("splash")

            def guide_linked(self):
                t = self.splash_tab()
                return t is not None and t.hotkeys_linked()

            ## ── ESC 조작방법 화면 목록 ──
            def help_manual(self):
                return self.work_or_saved()["help"] is not None

            def help_rows(self):
                return help_lines()

            def help_to_manual(self):
                w = self._edit()
                w["help"] = store.python_list((a, b) for a, b in base_help())
                self.help_sel = None
                self._changed()
                _ed.msg("지금 목록을 복사해 넣었습니다. 이제 칸마다 고칠 수 있습니다.")

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

            ## ── 저장 ──
            def file_path(self, filename):
                return root_path(filename)

            def layout_file(self):
                w = self.work_or_saved()
                header = getattr(getattr(store, "ui_kit", None), "file_header", None)
                notes = [
                    "\"keys\": 기능마다 바꾼 키 (렌파이 기본 기능은 키보드 키만 바뀌고 마우스는 그대로).",
                    "\"desc\": 조작 안내 화면과 조작방법 화면에 보일 설명 (없으면 기능 이름).",
                    "여기 적힌 단축키와 뺀 키는 hotkeys_config.rpy의 것에 더해집니다.",
                    "이 파일을 지우면 설정 파일 값으로 돌아갑니다.",
                    ]
                if header is not None:
                    lines = header("게임 안 편집 화면이 저장한 단축키입니다.", notes)
                else:
                    lines = [ "## 게임 안 편집 화면이 저장한 단축키입니다. (자동 생성)", "" ]
                lines.append("define hotkeys.layout = {")
                lines.append('    "keys": {')
                for f in FUNCS:
                    if f[0] in w["keys"]:
                        keys = w["keys"][f[0]]
                        lines.append('        {}: [ {} ],    # {}: {}'.format(json.dumps(f[0]), ", ".join(json.dumps(k) for k in keys),
                            f[1], keys_text(keys) or "키 없음"))
                lines.append("    },")
                lines.append('    "desc": {')
                for f in FUNCS:
                    if w["desc"].get(f[0]):
                        lines.append('        {}: {},'.format(json.dumps(f[0]), _tr(w["desc"][f[0]])))
                lines.append("    },")
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
                self.conflict = None
                apply_layout(None)
                return False

            def copy_text(self):
                return self.layout_file()[1]

            def info_lines(self):
                n = len(self.work_or_saved()["keys"])
                rv = [ "바꾼 기능 {}개".format(n) ]
                rv.append("저장 안 한 변경 있음 (게임에는 벌써 적용됨)" if self.pending() else "저장 안 한 변경 없음")
                for e in state.errors:
                    rv.append("오류: " + e)
                return rv

            def help_lines(self):
                return [
                    "키 단추를 누르고 게임 창에서 바꿀 키를 누름 (Esc 그만). 겹치면 안내를 보고 고름",
                    "고치면 바로 적용됨: 편집 화면을 닫고 눌러 봄. 저장하면 hotkeys/hotkeys_layout.rpy",
                    ]

            def session(self):
                return dict(sel=self.sel)

            def restore(self, d):
                self.sel = d.get("sel")

        _ed.register(HotkeysTab())

        ## 탭 버튼을 스플래시 바로 뒤로 (스플래시가 먼저 등록됐을 때. 아니면 스플래시 쪽에서 옮김)
        def place_tab():
            tabs = getattr(_ed, "TABS", None)
            if not tabs:
                return
            ids = [ t.id for t in tabs ]
            if "hotkeys" not in ids or "splash" not in ids:
                return
            t = tabs.pop(ids.index("hotkeys"))
            ids = [ x.id for x in tabs ]
            tabs.insert(ids.index("splash") + 1, t)

        place_tab()


## ── 화면 ─────────────────────────────────────────────────────────────────────

screen ui_editor_hotkeys_overlay():
    ## 게임 창에서 누른 키를 받는 층 (키 단추를 눌렀을 때만)
    add hotkeys.key_catcher


screen ui_editor_hotkeys_panel(tab):

    vbox:
        spacing 4

        hbox:
            spacing 6
            textbutton "안내 화면으로 내보내기" style "ui_editor_button" text_size 13 action Function(tab.export_guide)
            if tab.guide_linked():
                text "조작 안내 화면이 이 표를 따라감" style "ui_editor_small" yalign 0.5
            else:
                text "조작 안내 화면과 잇기" style "ui_editor_small" yalign 0.5
        text "  키 단추를 누르고 게임 창에서 바꿀 키를 누릅니다 (Esc 그만두기). 고치면 바로 게임에 적용됩니다." style "ui_editor_small"

        null height 2

        for _fid, _label, _kind, _t in tab.rows():
            $ _kt = tab.key_text(_fid)
            $ _cap = (tab.capturing == _fid)
            hbox:
                spacing 4
                textbutton _label:
                    style "ui_editor_button"
                    text_size 13
                    xsize 190
                    action Function(tab.select, _fid)
                    selected (tab.sel == _fid)
                textbutton ("누르세요..." if (_cap and not tab.adding) else (_kt or "없음")):
                    style "ui_editor_button"
                    text_size 13
                    xsize 190
                    action Function(tab.start_capture, _fid)
                    selected (_cap and not tab.adding)
                textbutton ("누르세요..." if (_cap and tab.adding) else "+"):
                    style "ui_editor_button"
                    text_size 13
                    action Function(tab.start_capture, _fid, True)
                    selected (_cap and tab.adding)
                    sensitive bool(_kt)
                if hotkeys.func_changed(_fid):
                    text "바꿈" style "ui_editor_small" yalign 0.5 color "#ffd23b"
                elif tab.from_config(_fid):
                    text "설정 파일" style "ui_editor_small" yalign 0.5

            ## 겹침 경고와 안내
            $ _c = tab.conflict_for(_fid)
            if _c is not None:
                frame:
                    style "empty"
                    background "#ffd23b22"
                    padding (8, 6)
                    xmaximum 620
                    vbox:
                        spacing 3
                        text ("{}는 이미 쓰고 있습니다:".format(hotkeys.key_label(_c["key"]))) style "ui_editor_text" color "#ffd23b"
                        for _o in _c["owners"]:
                            text ("  " + _o[2] + "  (" + hotkeys.keys_label(_o[3]) + ")") style "ui_editor_small"
                        text "  [[그쪽에서 빼고 바꾸기]를 누르면 위 기능에서는 이 키가 빠지고 '{}'에만 걸립니다.".format(_label) style "ui_editor_small"
                        if tab.conflict_dev():
                            text "  메뉴 이동, 입력 칸 같은 렌파이 화면 조작에서 빼면 그 조작은 이 키로 안 됩니다." style "ui_editor_small" color "#ffb74d"
                        text "  다른 키를 쓰려면 [[취소] 뒤 키 단추를 다시 누르세요." style "ui_editor_small"
                        hbox:
                            spacing 6
                            textbutton "그쪽에서 빼고 바꾸기" style "ui_editor_button" text_size 13 action Function(tab.resolve, True)
                            textbutton "취소" style "ui_editor_button" text_size 13 action Function(tab.resolve, False)

            ## 고른 줄: 키 단추, 설명
            if tab.sel == _fid:
                frame:
                    style "empty"
                    background "#ffffff10"
                    padding (8, 6)
                    xmaximum 620
                    vbox:
                        spacing 4
                        hbox:
                            spacing 4
                            textbutton ("키 단추 닫기" if tab.grid else "키 단추로") style "ui_editor_button" text_size 13 action Function(tab.toggle_grid, _fid) selected tab.grid
                            textbutton "키 빼기" style "ui_editor_button" text_size 13 action Function(tab.clear_keys, _fid) sensitive bool(_kt)
                            textbutton "처음 키로" style "ui_editor_button" text_size 13 action Function(tab.reset_keys, _fid) sensitive hotkeys.func_changed(_fid)
                        if tab.grid:
                            hbox:
                                spacing 4
                                text "같이 누를 키:" style "ui_editor_small" yalign 0.5
                                for _m, _ml in (("shift", "Shift"), ("ctrl", "Ctrl"), ("alt", "Alt")):
                                    textbutton _ml style "ui_editor_button" text_size 13 action Function(tab.toggle_mod, _m) selected (_m in tab.mods)
                            hbox:
                                spacing 3
                                box_wrap True
                                box_wrap_spacing 3
                                xmaximum 600
                                for _k in hotkeys.GRID_KEYS:
                                    textbutton hotkeys.key_label(_k) style "ui_editor_button" text_size 12 action Function(tab.grid_key, _k)
                        hbox:
                            spacing 6
                            text "설명" style "ui_editor_small" yalign 0.5 min_width 40
                            button:
                                style "ui_editor_button"
                                xsize 420
                                yminimum 30
                                action hotkeys.panel_input("desc", _fid).Toggle()
                                input value hotkeys.panel_input("desc", _fid) style "ui_editor_text" size 14 length 200 xmaximum 400
                        text "  조작 안내 화면과 조작방법 화면에 보일 글 (비우면 기능 이름)" style "ui_editor_small"

        ## ── 예전 편집 화면 줄 (1.1) ──
        $ _lg = tab.legacy_rows()
        if _lg:
            null height 4
            text "예전에 만든 단축키 줄" style "ui_editor_text"
            for _i, _b in enumerate(_lg):
                hbox:
                    spacing 6
                    text ("  " + hotkeys.keys_label(_b.get("keys") or [ ])) style "ui_editor_small" yalign 0.5 min_width 140
                    text (hotkeys.action_label(_b["do"]) if _b.get("do") else "") style "ui_editor_small" yalign 0.5 min_width 200
                    textbutton "지우기" style "ui_editor_button" text_size 12 action Function(tab.del_legacy, _i)

        ## ── 렌파이 기본에서 뺀 키 ──
        $ _ub = tab.unbind_rows()
        if _ub:
            null height 4
            text "렌파이 기본 조작에서 뺀 키" style "ui_editor_text"
            for _name, _k, _src in _ub:
                hbox:
                    spacing 6
                    text ("  " + hotkeys.key_label(_k)) style "ui_editor_small" yalign 0.5 min_width 120
                    text (hotkeys.keymap_label(_name) + " (" + _name + ")") style "ui_editor_small" yalign 0.5 min_width 260
                    if _src == "layout":
                        textbutton "다시 넣기" style "ui_editor_button" text_size 12 action Function(tab.toggle_unbind, _name, [ _k ]) yalign 0.5
                    else:
                        text "설정 파일" style "ui_editor_small" yalign 0.5

        ## ── ESC 조작방법 화면 목록 ──
        null height 4
        hbox:
            spacing 6
            text "ESC 조작방법 화면 목록" style "ui_editor_text" yalign 0.5
            textbutton ("접기" if tab.show_help else "펼치기") style "ui_editor_button" text_size 13 action ToggleField(tab, "show_help")
        if tab.show_help:
            if not tab.help_manual():
                hbox:
                    spacing 6
                    text "  바꾼 키가 저절로 들어감" style "ui_editor_small" yalign 0.5
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
                    textbutton "저절로 만들기로" style "ui_editor_button" text_size 13 action Function(tab.help_to_config)
