################################################################################
## Hotkeys 플러그인 — 엔진
##
## 이 파일은 고칠 필요가 없습니다. 설정은 hotkeys_config.rpy에서 하세요.
##
## 버전 1.2 · Ren'Py 8.5.3에서 제작·테스트
##
## - 단축키를 추가하거나, 렌파이 기본 단축키에서 키를 뺍니다.
## - 조작방법 화면의 키보드 설명을 설정 파일의 목록으로 보여줍니다.
##   (렌파이 기본 screens.rpy의 keyboard_help 스크린을 대신 정의합니다)
## - 게임 안 편집 화면(Shift+M)의 [단축키 수정] 탭이 저장한 hotkeys_layout.rpy를 읽습니다 (1.1).
##   그 탭은 editor/editor_hotkeys.rpy에 있고, UI Kit 플러그인이 있을 때만 생깁니다.
## - 1.2: 기능마다 키를 바꿉니다(렌파이 기본 기능도). hotkeys_layout.rpy의 "keys"와 "desc".
##   스플래시 조작 안내 화면이 "keys": "hotkeys"면 이 표에서 고른 기능을 보여 줍니다(guide_rows).
################################################################################

init offset = 1

init -10 python in hotkeys:

    import store
    from store import python_object

    VERSION = "1.9"     # pygaki 판 (예전 판은 1.3 같은 번호)

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
        ("controls_page", "조작 안내 화면 보기", _splash_controls),
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

    ## ── 단축키 수정 표의 기능 (1.2) ──
    ## (id, 이름, 종류, 대상). 종류 "keymap"은 렌파이 기본 단축키(config.keymap 이름),
    ## "do"는 위 ACTIONS의 동작 (처음에는 키 없음). hotkeys_layout.rpy의 "keys"와 "desc"에 id를 적습니다.

    KEYMAP_FUNCS = [
        ("dismiss", "대사 넘기기"),
        ("game_menu", "게임 메뉴"),
        ("skip", "누르는 동안 스킵"),
        ("toggle_skip", "스킵 켜기/끄기"),
        ("rollback", "이전 대사로"),
        ("rollforward", "다음 대사로"),
        ("hide_windows", "UI 숨기기"),
        ("screenshot", "스크린샷"),
        ("toggle_fullscreen", "전체 화면"),
        ("self_voicing", "대사 읽어주기"),
        ("accessibility", "접근성 메뉴"),
        ]

    ## ACTIONS 가운데 위 기본 기능과 같은 것은 표에 따로 두지 않음
    _DO_SAME = { "skip": "toggle_skip", "rollback": "rollback", "hide": "hide_windows",
        "screenshot": "screenshot", "fullscreen": "toggle_fullscreen" }

    FUNCS = [ (n, l, "keymap", n) for n, l in KEYMAP_FUNCS ] + [
        (a[0], a[1], "do", a[0]) for a in ACTIONS if a[0] not in _DO_SAME ]

    FUNC_IDS = [ f[0] for f in FUNCS ]

    def func(fid):
        for f in FUNCS:
            if f[0] == fid:
                return f
        return None

    def func_label(fid):
        f = func(fid)
        return f[1] if f else str(fid)

    ## 조작방법 화면 기본 목록에서 그 기능의 키 칸 (키를 바꾸면 이 칸 글도 바꿈)
    HELP_KEY = {
        "game_menu": "이스케이프(Esc)", "skip": "컨트롤(Ctrl)", "toggle_skip": "탭(Tab)",
        "rollback": "페이지 업(Page Up)", "rollforward": "페이지 다운(Page Down)",
        "hide_windows": "H", "screenshot": "S", "self_voicing": "V", "accessibility": "Shift+A",
        }

    ## 표와 안내 화면에 안 보이는 키 (게임패드, 특수 키)
    QUIET_KEYS = ("K_KP_ENTER", "K_SELECT", "K_MENU", "K_PAUSE", "K_AC_BACK")

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

    def keyboard_keys(keys):
        """키보드 키만 (마우스, 게임패드 이름은 뺌)."""
        return [ k for k in (keys or [ ]) if parse_key(k) is not None ]

    def main_keys(keys):
        """표와 안내 화면에 보일 키: 특수 키를 빼고, Alt/Ctrl/Win 없이 누르는 키가 있으면 그것만."""
        kb = [ k for k in keyboard_keys(keys) if parse_key(k)[1] not in QUIET_KEYS ]
        plain = [ k for k in kb if not (parse_key(k)[0] & set(("alt", "ctrl", "meta"))) ]
        return plain or kb

    def keys_text(keys):
        """보일 키 이름 ("F11 / F"). 같은 이름은 한 번만 (왼쪽, 오른쪽 Ctrl 등)."""
        rv = [ ]
        for k in main_keys(keys):
            l = key_label(k)
            if l not in rv:
                rv.append(l)
        return " / ".join(rv)

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
        rv["keys"] = store.python_dict((k, list(v) if not isinstance(v, str) else [ v ]) for k, v in (d.get("keys") or { }).items())
        rv["desc"] = store.python_dict((k, v) for k, v in (d.get("desc") or { }).items() if v)
        rv["bindings"] = store.python_list()
        for b in (d.get("bindings") or [ ]):
            keys = list(b.get("keys") or [ ])
            do = b.get("do")
            f = func(do) if do else None
            ## 1.1에서 편집 화면이 만든 줄(표에 있는 동작)은 표의 키로 옮김
            if f is not None and f[2] == "do" and keys and do not in rv["keys"]:
                rv["keys"][do] = keys
                if b.get("help"):
                    rv["desc"][do] = b["help"]
                continue
            rv["bindings"].append(store.python_dict(keys=keys, do=do, help=b.get("help")))
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

    ## ── 기능마다 키 (1.2) ──

    def _orig_keymap():
        if state.orig is None:
            return dict((k, list(v)) for k, v in store.config.keymap.items())
        return state.orig

    def default_keys(fid):
        """편집 화면에서 바꾸기 전의 키 (키보드 키만).
        기본 기능은 렌파이 기본에서 뺀 키를 빼고, 동작은 설정 파일 bindings의 "do"가 같은 줄."""
        f = func(fid)
        if f is None:
            return [ ]
        if f[2] == "keymap":
            ub = all_unbind().get(f[3], [ ])
            return [ k for k in keyboard_keys(_orig_keymap().get(f[3], [ ])) if k not in ub ]
        rv = [ ]
        for b in _config_bindings():
            if b.get("do") == fid:
                rv += [ k for k in b["keys"] if k not in rv ]
        return rv

    def func_keys(fid):
        """지금 그 기능에 걸린 키보드 키."""
        lay = current_layout()["keys"]
        if fid in lay:
            return list(lay[fid])
        return default_keys(fid)

    def func_changed(fid):
        return fid in current_layout()["keys"]

    def func_desc(fid):
        """안내 화면에 보일 설명. 비우면 기능 이름."""
        return current_layout()["desc"].get(fid) or func_label(fid)

    def guide_rows(show=None):
        """스플래시 조작 안내 화면 표 [(키, 설명)]. show: 보일 기능 id 목록 (None이면 키가 있는 것 모두)."""
        rv = [ ]
        for f in FUNCS:
            if show is not None and f[0] not in show:
                continue
            t = keys_text(func_keys(f[0]))
            if t:
                rv.append((t, func_desc(f[0])))
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
        """설명("help")을 적은 단축키 줄과, 키를 건 동작(1.2). 조작방법 목록 아래에 붙습니다 (1.1)."""
        rv = [ ]
        lay = current_layout()["keys"]
        for src, b in all_bindings():
            if src == "config" and b.get("do") in lay:
                continue
            h = b.get("help")
            if h:
                rv.append((keys_label(b["keys"]), h))
        for f in FUNCS:
            if f[2] == "do" and f[0] in lay:
                t = keys_text(lay[f[0]])
                if t:
                    rv.append((t, func_desc(f[0])))
        return rv

    def help_is_default():
        """조작방법 목록이 렌파이 기본 목록인지 (설정 파일 keyboard_help, 편집 화면 목록을 안 씀)."""
        return current_layout()["help"] is None and cfg("keyboard_help") is None

    def _remap_help(rows):
        """기본 기능의 키를 바꿨으면 목록의 그 키 칸도 바꿈 (키를 다 빼면 그 줄을 뺌).
        unbind로 키를 뺀 것도 바꿈 (1.3). 단 목록을 직접 적었으면 그 목록은 만든 사람 것이라 unbind로는 안 바꿈."""
        lay = current_layout()["keys"]
        by_unbind = help_is_default()
        for fid, old in HELP_KEY.items():
            if fid in lay:
                new = keys_text(lay[fid])
            elif by_unbind and all_unbind().get(fid):
                new = keys_text(func_keys(fid))
                if new == keys_text(_orig_keymap().get(fid, [ ])):
                    continue  # 뺀 것이 마우스·게임패드 키뿐
            else:
                continue
            for i, (a, d) in enumerate(rows):
                if isinstance(a, str) and a == old:
                    if new:
                        rows[i] = (new, d)
                    else:
                        del rows[i]
                    break
        return rows

    def help_lines():
        """조작방법 목록. 단축키 줄의 키가 목록에 이미 있으면(같은 키 이름) 그 줄의 설명을 바꾸고, 없으면 아래에 붙입니다."""
        rv = _remap_help([ tuple(r) for r in base_help() ])
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

        actions = { }
        mine = [ ]

        ## 기능마다 바꾼 키 (1.2): 기본 기능은 키보드 키만 바꾸고 마우스, 게임패드는 그대로
        lay_keys = current_layout()["keys"]
        for fid, keys in lay_keys.items():
            f = func(fid)
            if f is None:
                state.errors.append("'{}'라는 기능이 없습니다 (hotkeys_layout.rpy의 \"keys\").".format(fid))
                continue
            keys = [ k for k in keys if k ]
            if f[2] == "keymap":
                km[f[3]] = [ k for k in state.orig.get(f[3], [ ]) if parse_key(k) is None ] + keys
                mine.append(f[3])
            elif keys:
                name = "hotkeys_do_" + fid
                km[name] = keys
                actions[name] = make_action(fid)
                mine.append(name)

        ## 새 단축키
        for i, (src, b) in enumerate(all_bindings()):
            keys = [ k for k in b["keys"] if k ]
            if not keys:
                continue
            if src == "config" and b.get("do") in lay_keys:
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
