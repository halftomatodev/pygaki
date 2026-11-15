################################################################################
## Hotkeys 플러그인 — 엔진
##
## 이 파일은 고칠 필요가 없습니다. 설정은 hotkeys_config.rpy에서 하세요.
##
## 버전 1.1 · Ren'Py 8.5.3에서 제작·테스트
##
## - 단축키를 추가하거나, 렌파이 기본 단축키에서 키를 뺍니다.
## - 조작방법 화면의 키보드 설명을 설정 파일의 목록으로 보여줍니다.
##   (렌파이 기본 screens.rpy의 keyboard_help 스크린을 대신 정의합니다)
## - 게임 안 편집 화면(Shift+M)의 [단축키] 탭이 저장한 hotkeys_layout.rpy를 읽습니다 (1.1).
##   그 탭은 editor/editor_hotkeys.rpy에 있고, UI Kit 플러그인이 있을 때만 생깁니다.
################################################################################

init offset = 1

init -10 python in hotkeys:

    import store
    from store import python_object

    VERSION = "1.1"

    DEFAULTS = dict(
        bindings=[ ],
        unbind={ },
        keyboard_help=None,
        layout={ },
        )

    def cfg(name):
        g = globals()
        if name in g:
            return g[name]
        return DEFAULTS[name]

    ## ── 편집 화면에서 고르는 동작 (1.1) ──
    ## (id, 이름, 동작을 만드는 함수). hotkeys_layout.rpy와 설정 파일의 "do"에 id를 적습니다.

    def _splash_controls():
        sp = getattr(store, "splash", None)
        f = getattr(sp, "ShowPage", None)
        return f("controls") if f is not None else store.NullAction()

    ACTIONS = [
        ("preferences", "환경설정 열기", lambda: store.ShowMenu("preferences")),
        ("save", "저장 화면 열기", lambda: store.ShowMenu("save")),
        ("load", "불러오기 화면 열기", lambda: store.ShowMenu("load")),
        ("history", "대사록 열기", lambda: store.ShowMenu("history")),
        ("help", "조작방법 화면 열기", lambda: store.ShowMenu("help")),
        ("quick_save", "퀵세이브", lambda: store.QuickSave()),
        ("quick_load", "퀵로드", lambda: store.QuickLoad()),
        ("skip", "스킵 켜기/끄기", lambda: store.Skip()),
        ("auto", "자동 진행 켜기/끄기", lambda: store.Preference("auto-forward", "toggle")),
        ("rollback", "이전 대사로", lambda: store.Rollback()),
        ("hide", "UI 숨기기", lambda: store.HideInterface()),
        ("screenshot", "스크린샷 저장", lambda: store.Screenshot()),
        ("fullscreen", "전체 화면 켜기/끄기", lambda: store.Preference("display", "toggle")),
        ("mute", "소리 끄기/켜기", lambda: store.Preference("all mute", "toggle")),
        ("main_menu", "타이틀로 (물어봄)", lambda: store.MainMenu()),
        ("quit", "게임 끝내기 (물어봄)", lambda: store.Quit()),
        ("controls_page", "스플래시 조작 방법 페이지 보기", _splash_controls),
        ]

    ACTION_IDS = [ a[0] for a in ACTIONS ]

    def action_label(aid):
        for i, label, f in ACTIONS:
            if i == aid:
                return label
        return aid

    def make_action(aid):
        for i, label, f in ACTIONS:
            if i == aid:
                return f()
        raise Exception("[hotkeys] '{}'라는 동작이 없습니다. 쓸 수 있는 것: {}".format(aid, ", ".join(ACTION_IDS)))

    ## ── 키 이름 ──
    ## 렌파이 키 이름: "K_v", "shift_K_s", "ctrl_K_l", "noshift_K_v"(Shift 없이만) ...

    MODS = ("shift", "noshift", "ctrl", "alt", "meta")

    def parse_key(name):
        """키 이름 → (수식키 집합, 키) 또는 None(키보드 키가 아님)."""
        if not isinstance(name, str):
            return None
        parts = name.split("_")
        mods = set()
        while parts and parts[0] != "K" and parts[0] in MODS + ("repeat", "anyrepeat", "keydown", "keyup", "any", "osctrl", "caps", "nocaps", "anymod"):
            mods.add(parts.pop(0))
        if len(parts) < 2 or parts[0] != "K":
            return None
        if "osctrl" in mods:
            mods.discard("osctrl")
            mods.add("ctrl")
        return (mods, "_".join(parts))

    KEY_NAMES = {
        "K_SPACE": "Space", "K_RETURN": "Enter", "K_KP_ENTER": "Enter(숫자판)", "K_ESCAPE": "Esc",
        "K_BACKSPACE": "Backspace", "K_TAB": "Tab", "K_DELETE": "Delete", "K_INSERT": "Insert",
        "K_HOME": "Home", "K_END": "End", "K_PAGEUP": "Page Up", "K_PAGEDOWN": "Page Down",
        "K_LEFT": "왼쪽 화살표", "K_RIGHT": "오른쪽 화살표", "K_UP": "위 화살표", "K_DOWN": "아래 화살표",
        "K_LSHIFT": "Shift", "K_RSHIFT": "Shift", "K_LCTRL": "Ctrl", "K_RCTRL": "Ctrl",
        "K_LALT": "Alt", "K_RALT": "Alt", "K_MINUS": "-", "K_EQUALS": "=", "K_COMMA": ",",
        "K_PERIOD": ".", "K_SLASH": "/", "K_SEMICOLON": ";", "K_QUOTE": "'", "K_BACKQUOTE": "`",
        "K_LEFTBRACKET": "[[", "K_RIGHTBRACKET": "]", "K_BACKSLASH": "\\",
        }

    def key_label(name):
        """키 이름 → 사람이 읽는 이름 ("shift_K_s" → "Shift+S")."""
        p = parse_key(name)
        if p is None:
            return str(name)
        mods, key = p
        k = KEY_NAMES.get(key)
        if k is None:
            k = key[2:]
            if len(k) == 1:
                k = k.upper()
            elif k.startswith("KP"):
                k = "숫자판 " + k[2:].lstrip("_")
        out = [ ]
        for m, label in (("ctrl", "Ctrl"), ("alt", "Alt"), ("meta", "Win"), ("shift", "Shift")):
            if m in mods:
                out.append(label)
        out.append(k)
        return "+".join(out)

    def keys_label(keys):
        if isinstance(keys, str):
            keys = [ keys ]
        return " / ".join(key_label(k) for k in keys)

    def _shift_state(mods):
        if "shift" in mods:
            return "shift"
        if "noshift" in mods:
            return "noshift"
        return "any"

    def overlaps(a, b):
        """두 키 이름이 같은 키 누름에 함께 걸리는지."""
        pa, pb = parse_key(a), parse_key(b)
        if pa is None or pb is None or pa[1] != pb[1]:
            return False
        if "keyup" in pa[0] or "keyup" in pb[0]:
            return False
        for m in ("ctrl", "alt", "meta"):
            if (m in pa[0]) != (m in pb[0]):
                return False
        sa, sb = _shift_state(pa[0]), _shift_state(pb[0])
        return sa == "any" or sb == "any" or sa == sb

    ## ── 지금 쓰는 값 ──

    class _State(python_object):
        def __init__(self):
            self.orig = None        # 이 플러그인이 고치기 전의 config.keymap
            self.saved = None       # hotkeys_layout.rpy의 값 (저장하면 바뀜)
            self.current = None     # 지금 적용한 편집 값 (편집 중이면 저장 전 값)
            self.keymap = None      # config.underlay에 넣은 Keymap
            self.errors = [ ]

    state = _State()

    def _copy_layout(d):
        d = d or { }
        rv = store.python_dict()
        rv["bindings"] = store.python_list(
            store.python_dict(keys=list(b.get("keys") or [ ]), do=b.get("do"), help=b.get("help"))
            for b in (d.get("bindings") or [ ]))
        rv["unbind"] = store.python_dict((k, list(v) if not isinstance(v, str) else [ v ]) for k, v in (d.get("unbind") or { }).items())
        h = d.get("help")
        rv["help"] = None if h is None else store.python_list((a, b) for a, b in h)
        return rv

    def current_layout():
        """편집 화면 값 (bindings, unbind, help). 편집 중이면 저장 전 값."""
        if state.current is not None:
            return state.current
        if state.saved is None:
            state.saved = _copy_layout(cfg("layout"))
        return state.saved

    def _config_bindings():
        rv = [ ]
        for b in cfg("bindings"):
            keys = b.get("keys") or [ ]
            if isinstance(keys, str):
                keys = [ keys ]
            rv.append(dict(b, keys=list(keys)))
        return rv

    def all_bindings():
        """(어디서 왔는지 "config"/"layout", 줄) 목록."""
        rv = [ ("config", b) for b in _config_bindings() ]
        rv += [ ("layout", b) for b in current_layout()["bindings"] ]
        return rv

    def all_unbind():
        rv = { }
        for src in (cfg("unbind"), current_layout()["unbind"]):
            for name, keys in src.items():
                if isinstance(keys, str):
                    keys = [ keys ]
                rv.setdefault(name, [ ])
                for k in keys:
                    if k not in rv[name]:
                        rv[name].append(k)
        return rv

    ## ── 조작방법 화면 목록 ──

    def _default_help():
        _ = store._
        return [
            (_("엔터(Enter)"), _("대사 진행 및 UI (선택지 포함) 선택.")),
            (_("스페이스(Space)"), _("대사를 진행하되 선택지는 선택하지 않음.")),
            (_("화살표 키"), _("UI 이동.")),
            (_("이스케이프(Esc)"), _("게임 메뉴 불러옴.")),
            (_("컨트롤(Ctrl)"), _("누르고 있는 동안 대사를 스킵.")),
            (_("탭(Tab)"), _("대사 스킵 토글.")),
            (_("페이지 업(Page Up)"), _("이전 대사로 롤백.")),
            (_("페이지 다운(Page Down)"), _("이후 대사로 롤포워드.")),
            ("H", _("UI를 숨김.")),
            ("S", _("스크린샷 저장.")),
            ("V", _("{a=https://www.renpy.org/l/voicing}대사 읽어주기 기능{/a} 토글.")),
            ("Shift+A", _("접근성 메뉴를 엽니다.")),
            ]

    def base_help():
        """단축키 줄을 빼고 위에 오는 목록: 편집 화면 목록 > 설정 파일 keyboard_help > 렌파이 기본."""
        h = current_layout()["help"]
        if h is not None:
            return list(h)
        lines = cfg("keyboard_help")
        if lines is None:
            lines = _default_help()
        return list(lines)

    def binding_help():
        """설명("help")을 적은 단축키 줄. 조작방법 목록 아래에 붙습니다 (1.1)."""
        rv = [ ]
        for src, b in all_bindings():
            h = b.get("help")
            if h:
                rv.append((keys_label(b["keys"]), h))
        return rv

    def help_lines():
        """조작방법 목록. 단축키 줄의 키가 목록에 이미 있으면(같은 키 이름) 그 줄의 설명을 바꾸고, 없으면 아래에 붙입니다."""
        rv = [ tuple(r) for r in base_help() ]
        for k, h in binding_help():
            for i, (a, d) in enumerate(rv):
                if isinstance(a, str) and a.strip().lower() == k.lower():
                    rv[i] = (a, h)
                    break
            else:
                rv.append((k, h))
        return rv

    ## ── 적용 ──

    def _setup():
        """설정 파일과 hotkeys_layout.rpy의 값으로 config.keymap을 맞춥니다. 편집 화면은 고칠 때마다 부릅니다."""
        import store
        km = store.config.keymap

        if state.orig is None:
            state.orig = dict((k, list(v)) for k, v in km.items())
        else:
            for k in list(km.keys()):
                if k not in state.orig:
                    del km[k]
            for k, v in state.orig.items():
                km[k] = list(v)

        state.errors = [ ]

        ## 기본 단축키에서 키 빼기
        for name, keys in all_unbind().items():
            current = km.get(name, None)
            if current is None:
                raise Exception("[hotkeys] unbind: '{}'라는 기본 단축키 이름이 없습니다.".format(name))
            for k in keys:
                while k in current:
                    current.remove(k)

        ## 새 단축키
        actions = { }
        mine = [ ]

        for i, (src, b) in enumerate(all_bindings()):
            keys = [ k for k in b["keys"] if k ]
            if not keys:
                continue
            if b.get("action") is not None:
                act = b["action"]
            elif b.get("do"):
                try:
                    act = make_action(b["do"])
                except Exception as e:
                    if src == "config":
                        raise
                    state.errors.append(str(e))
                    continue
            else:
                continue

            name = b.get("name") or "hotkeys_{}".format(i)
            km[name] = list(keys)
            actions[name] = act
            mine.append(name)

        ## Shift+키를 새로 걸었으면, Shift를 가리지 않던 기본 단축키(같은 키)는 Shift 없을 때만으로
        ## (렌파이의 "K_s"는 Shift+S에도 걸려서 둘 다 실행되므로)
        for name in mine:
            for k in km[name]:
                p = parse_key(k)
                if p is None or "shift" not in p[0]:
                    continue
                for other, lst in km.items():
                    if other in mine:
                        continue
                    for j, ok in enumerate(lst):
                        q = parse_key(ok)
                        if q is None or q[1] != p[1] or _shift_state(q[0]) != "any":
                            continue
                        if any((m in q[0]) != (m in p[0]) for m in ("ctrl", "alt", "meta")):
                            continue
                        lst[j] = "noshift_" + ok

        if state.keymap is not None and state.keymap in store.config.underlay:
            store.config.underlay.remove(state.keymap)
        state.keymap = None
        if actions:
            state.keymap = store.renpy.Keymap(**actions)
            store.config.underlay.append(state.keymap)

        try:
            store.renpy.clear_keymap_cache()
        except Exception:
            pass

    def apply_layout(d):
        """편집 화면의 값을 저장 전에 바로 써 봅니다. None이면 저장한 값으로."""
        state.current = None if d is None else d
        _setup()

    def conflicts(key, skip=None):
        """이 키와 함께 걸리는 다른 단축키 이름 목록 (이 플러그인이 만든 것 빼고 skip 빼고)."""
        rv = [ ]
        for name, lst in store.config.keymap.items():
            if name == skip or name.startswith("hotkeys_"):
                continue
            for k in lst:
                if overlaps(key, k):
                    rv.append(name)
                    break
        return rv


init 990 python in hotkeys:
    import store

    _setup()

    ## 배포판을 만들 때 이 폴더의 설명서(.md)는 빼고 묶습니다.
    import os as _os
    PLUGIN_DIR = _os.path.dirname(store.renpy.get_filename_line()[0]).replace("\\", "/")
    store.build.classify(PLUGIN_DIR + "/**.md", None)


## 조작방법 화면의 키보드 설명. (렌파이 기본 keyboard_help 스크린을 대신합니다)
screen keyboard_help():

    for _key, _desc in hotkeys.help_lines():
        hbox:
            label _key
            text _desc
