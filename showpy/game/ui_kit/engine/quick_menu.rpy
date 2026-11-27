################################################################################
## pygaki — 퀵메뉴 엔진 (pygaki v2.0-beta1)
##
## 이 파일은 고칠 필요가 없습니다. 설정은 quick_menu_config.rpy에서 하세요.
##
## 게임 중 화면 아래의 퀵메뉴(되감기, 대사록, 넘기기 ...)를 그립니다.
##   - 항목마다 자리 옮기기 (옮기지 않은 항목은 렌파이 기본처럼 아래 가운데 한 줄)
##   - 항목 숨기기
##   - 막대 전체 뒤, 항목 뒤에 그림·영상·색
## 편집은 pygaki editor(F9)의 "퀵메뉴" 탭. 저장하면 quick_menu_layout.rpy가 만들어집니다.
##
## 렌파이 기본 screens.rpy의 quick_menu 스크린은 그대로 두고, 화면에 늘 띄우는 목록
## (config.overlay_screens)에서 그것을 이 플러그인의 qmenu_quick으로 바꿔 넣습니다.
## qmenu.enabled = False면 바꾸지 않으므로 그 게임의 screens.rpy 퀵메뉴(직접 고친 것 포함)가 그대로 나옵니다.
## 터치 화면(모바일)용 퀵메뉴도 바꾸지 않습니다.
################################################################################

init offset = 1


## ── 1. 엔진 코드 ─────────────────────────────────────────────────────────────

init -10 python in qmenu:

    import store
    from store import Action, DictEquality, Transform, Solid, python_object
    from store.ui_kit import eval_condition

    SCREEN = "qmenu_quick"

    ## 설정 파일에서 값을 주지 않았을 때 쓰는 기본값.
    DEFAULTS = dict(
        enabled=True,
        items=None,
        bar_background=None,
        bar_padding=(20, 6),
        item_background=None,
        movie_side_mask=False,
        layout={ },
        screen_layout={ },
        )

    MOVIE_EXTS = (".webm", ".ogv", ".mp4", ".mkv", ".avi", ".mpg", ".mpeg", ".m2v")

    ## 편집기가 다루는 항목 값 (저장할 때 이 순서로 적습니다)
    EDIT_KEYS = ("x", "y", "hidden", "background")

    ## 화면 값 (막대 배경, 모든 항목 배경)
    SCREEN_KEYS = ("bar_background", "item_background")

    def cfg(name):
        """설정값. 편집기가 이번 실행 중 저장한 값 → 설정 파일 → 기본값."""
        g = globals()
        st = g.get("state", None)
        saved = getattr(st, "saved", None)
        if saved is not None and name in saved:
            return saved[name]
        if name in g:
            return g[name]
        return DEFAULTS[name]

    ## ── 런타임 상태 (세이브·롤백에 들어가지 않는 일반 파이썬 객체) ──

    class _State(python_object):
        def __init__(self):
            self.editing = False        # 편집기가 열려 있음 → 퀵메뉴가 눌리지 않음
            self.ed_sel = 0
            self.ed_hover = None
            self.edits = { }            # id -> {키: 값}  (아직 저장 안 한 항목별 편집. 값이 None이면 그 값을 지움)
            self.screen_edits = { }     # {"bar_background": …, "item_background": …}
            self.edit_serial = 0
            self.saved = None           # 편집기가 이번 실행 중 저장한 layout, screen_layout
            self.disp_cache = { }

    state = _State()

    ## ── 기본 항목: 렌파이 8.6 기본 screens.rpy의 quick_menu와 같음 ──
    ## 글자는 그 게임 screens.rpy의 quick_menu에 적힌 글을 그대로 씁니다
    ## (런처로 만든 한국어 게임은 "되감기", "대사록" ... 이 screens.rpy에 바로 적혀 있음).
    ## 못 읽으면 렌파이 기본 영어 원문(번역 파일이 있으면 그 언어로 나옴).

    import re as _re

    _ACTION_IDS = (
        ("qsave", _re.compile(r"QuickSave\(")),
        ("qload", _re.compile(r"QuickLoad\(")),
        ("back", _re.compile(r"Rollback\(")),
        ("history", _re.compile(r"ShowMenu\(\s*['\"]history['\"]")),
        ("skip", _re.compile(r"Skip\(")),
        ("auto", _re.compile(r"auto-forward")),
        ("save", _re.compile(r"ShowMenu\(\s*['\"]save['\"]")),
        ("prefs", _re.compile(r"ShowMenu\(\s*['\"]preferences['\"]")),
        )

    def _screen_texts():
        """그 게임 screens.rpy의 quick_menu(터치용이 아닌 것)에 적힌 버튼 글. {id: 글}"""
        rv = { }
        try:
            import renpy.display.screen as S
            scr = S.get_screen_variant("quick_menu", [ None ])
            ast = getattr(scr, "ast", None)
        except Exception:
            return rv

        found = [ ]

        def walk(node):
            for c in getattr(node, "children", None) or [ ]:
                one(c)
            for e in getattr(node, "entries", None) or [ ]:
                try:
                    blk = e[1]
                except Exception:
                    blk = None
                if blk is not None:
                    walk(blk)

        def one(n):
            pos = getattr(n, "positional", None)
            kw = getattr(n, "keyword", None)
            if pos and kw is not None:
                acts = " ".join(str(v) for k, v in kw if k in ("action", "alternate"))
                if acts:
                    found.append((pos[0], acts))
            walk(n)

        try:
            walk(ast)
        except Exception:
            return rv

        for code, acts in found:
            for iid, pat in _ACTION_IDS:
                if pat.search(acts):
                    if iid not in rv:
                        try:
                            t = eval(code, vars(store))
                            if isinstance(t, str):
                                rv[iid] = t
                        except Exception:
                            pass
                    break
        return rv

    def _default_items():
        _ = store._
        texts = _screen_texts()
        rv = [
            { "id": "back", "text": _("Back"), "action": store.Rollback() },
            { "id": "history", "text": _("History"), "action": store.ShowMenu("history") },
            { "id": "skip", "text": _("Skip"), "action": store.Skip(), "alternate": store.Skip(fast=True, confirm=True) },
            { "id": "auto", "text": _("Auto"), "action": store.Preference("auto-forward", "toggle") },
            { "id": "save", "text": _("Save"), "action": store.ShowMenu("save") },
            { "id": "qsave", "text": _("Q.Save"), "action": store.QuickSave() },
            { "id": "qload", "text": _("Q.Load"), "action": store.QuickLoad() },
            { "id": "prefs", "text": _("Prefs"), "action": store.ShowMenu("preferences") },
            ]
        for d in rv:
            if d["id"] in texts:
                d["text"] = texts[d["id"]]
        return rv

    _default_cache = [ None ]

    def raw_items():
        items = cfg("items")
        if items is None:
            if _default_cache[0] is None:
                _default_cache[0] = _default_items()
            items = _default_cache[0]
        return items

    class Item(python_object):
        """설정 한 줄(dict)에 저장한 배치와 편집 중인 값을 얹은 것."""

    def _apply(d, src):
        for k, v in src.items():
            if v is None:
                d.pop(k, None)
            else:
                d[k] = v

    def all_items():
        """모든 항목 (숨긴 것, 조건에 안 맞는 것 포함). 번호는 이 목록의 차례."""
        layout = cfg("layout") or { }
        rv = [ ]
        for i, raw in enumerate(raw_items()):
            d = dict(raw)
            iid = d.get("id", "item{}".format(i))
            _apply(d, layout.get(iid, { }))
            _apply(d, state.edits.get(iid, { }))

            it = Item()
            it.index = i
            it.id = iid
            it.text = d.get("text", iid)
            it.action = d.get("action", None)
            it.alternate = d.get("alternate", None)
            it.show_if = d.get("show_if", None)
            it.hidden = bool(d.get("hidden", False))
            x, y = d.get("x", None), d.get("y", None)
            it.row = (x is None or y is None)
            it.x = int(x) if x is not None else 0
            it.y = int(y) if y is not None else 0
            it.bg = item_bg_disp(d.get("background", None))
            rv.append(it)
        return rv

    def shown_items():
        """지금 그릴 항목. 편집 중에는 숨긴 것도 (흐리게) 그려서 고를 수 있게 합니다."""
        rv = [ ]
        for it in all_items():
            if not state.editing:
                if it.hidden:
                    continue
                if it.show_if is not None and not eval_condition(it.show_if):
                    continue
            rv.append(it)
        return rv

    ## ── 배경 (그림, 영상, 색) ──

    def is_movie(path):
        return isinstance(path, str) and path.lower().endswith(MOVIE_EXTS)

    def screen_value(key):
        """막대 배경·모든 항목 배경. 편집 중 값 → 저장한 값 → 설정 파일."""
        if key in state.screen_edits:
            return state.screen_edits[key]
        sl = cfg("screen_layout") or { }
        if key in sl:
            return sl[key]
        return cfg(key)

    class Fill(store.renpy.Displayable):
        """받은 자리(막대, 버튼)의 크기로 그림·영상을 늘려 그림.
        (Transform의 fit은 크기를 안 주면 영상을 원래 크기로 두고, Frame은 영상을 그리지 않았음)"""

        def __init__(self, child, **kw):
            super(Fill, self).__init__(**kw)
            self.child = store.renpy.displayable(child)
            self.fitted = { }

        def render(self, width, height, st, at):
            w, h = int(width), int(height)
            t = self.fitted.get((w, h), None)
            if t is None:
                t = Transform(self.child, xysize=(w, h), fit="fill")
                self.fitted = { (w, h) : t }
            cr = store.renpy.render(t, w, h, st, at)
            rv = store.renpy.Render(w, h)
            rv.blit(cr, (0, 0))
            return rv

        def visit(self):
            return [ self.child ]

    def _disp(path):
        """그림 경로, 영상 경로, 색("#rrggbbaa"), 또는 displayable → 받은 자리를 꽉 채우는 displayable."""
        if not path:
            return None

        def make():
            if not isinstance(path, str):
                d = store.renpy.displayable(path)
            elif path.startswith("#"):
                return Solid(path)
            elif is_movie(path):
                d = store.ui_kit.movie(path, side_mask=cfg("movie_side_mask"), loop=True)
            else:
                d = path
            return Fill(d)

        key = repr(path)
        d = state.disp_cache.get(key, None)
        if d is None:
            d = make()
            state.disp_cache[key] = d
        return d

    def bar_disp():
        return _disp(screen_value("bar_background"))

    def item_bg_disp(own):
        """항목 배경: 그 항목에 정한 것, 없으면 모든 항목 배경."""
        return _disp(own if own else screen_value("item_background"))

    def bar_align():
        """막대(배경 판)의 자리. 렌파이 기본 style quick_menu의 xalign, yalign을 따름."""
        try:
            s = store.style.quick_menu
            xa = s.xalign if s.xalign is not None else 0.5
            ya = s.yalign if s.yalign is not None else 1.0
            return (xa, ya)
        except Exception:
            return (0.5, 1.0)

    ## ── 편집기 연결 (편집기 본체는 editor/editor_quick.rpy) ──

    class EdHover(Action, DictEquality):
        """편집 중에 마우스가 올라간 항목을 기억합니다."""
        def __init__(self, index):
            self.index = index

        def __call__(self):
            if state.ed_hover != self.index:
                state.ed_hover = self.index
                store.renpy.restart_interaction()

    def focused_index():
        """지금 마우스 포커스가 있는 퀵메뉴 항목 번호. 없으면 None.
        (버튼이 use로 그린 스크린 안에 있어서 포커스된 것의 id가 비어 있을 때가 있음 → 편집 중 hovered로 기억한 번호)"""
        try:
            import renpy.display.focus
            f = renpy.display.focus.get_focused()
        except Exception:
            return None
        ## 아무것도 포커스가 없으면(빈 곳) None. 지난번에 올라갔던 항목 번호를 쓰지 않게
        if f is None:
            return None
        wid = getattr(f, "id", None) or ""
        if wid.startswith("qmenu_btn_"):
            return int(wid[len("qmenu_btn_"):])
        ## 편집 중 퀵메뉴 버튼은 hovered가 EdHover(번호)
        h = getattr(f, "hovered", None)
        if isinstance(h, EdHover) and h.index is not None:
            return h.index
        return None

    def focused_center():
        """포커스가 있는 항목의 화면 가운데 (x, y). 모르면 None."""
        try:
            x, y, w, h = store.renpy.focus_coordinates()
            if x is None:
                return None
            return (x + w / 2.0, y + h / 2.0)
        except Exception:
            return None

    def _quick_tab():
        ue = getattr(store, "ui_editor", None)
        try:
            return bool(ue and ue.state.open and ue.state.tab == "quick")
        except Exception:
            return False

    def ed_box(i):
        """편집기 퀵메뉴 탭이 열려 있을 때 항목 위에 칠할 색. 아니면 None."""
        if not state.editing or not _quick_tab():
            return None
        if i == state.ed_sel:
            c = "#ff3b8d66"
        elif i == state.ed_hover:
            c = "#3bd6ff44"
        else:
            c = "#ffffff1c"
        return _disp(c)

    ## ── 화면에 띄우기: 기본 quick_menu 자리에 qmenu_quick ──

    def install():
        if not cfg("enabled"):
            return
        try:
            if store.renpy.variant("touch"):
                return
        except Exception:
            pass
        ov = store.config.overlay_screens
        if "quick_menu" in ov and SCREEN not in ov:
            ov[ov.index("quick_menu")] = SCREEN


init 990 python in qmenu:
    ## 설정 파일·배치 파일과 screens.rpy를 다 읽은 뒤
    install()


## ── 2. 스크린 ────────────────────────────────────────────────────────────────

## 숨긴 항목은 편집 중에만 흐리게
transform qmenu_dim(a):
    alpha a

## 항목 하나 (렌파이 기본 퀵메뉴 버튼과 같은 스타일)
screen qmenu_button(it):

    textbutton it.text:
        id ("qmenu_btn_%d" % it.index)
        style "quick_button"
        text_style "quick_button_text"
        if it.bg is not None:
            background it.bg
        foreground qmenu.ed_box(it.index)
        at qmenu_dim(0.35 if it.hidden else 1.0)

        if qmenu.state.editing:
            action NullAction()
            hovered qmenu.EdHover(it.index)
            unhovered qmenu.EdHover(None)
        else:
            action it.action
            alternate it.alternate

## 게임 중 퀵메뉴 (렌파이 기본 quick_menu 대신 화면에 띄움)
screen qmenu_quick():

    zorder 100

    if quick_menu:

        $ _items = qmenu.shown_items()
        $ _row = [ it for it in _items if it.row ]
        $ _bar = qmenu.bar_disp()

        ## 옮기지 않은 항목: 렌파이 기본처럼 아래 가운데 한 줄. 막대 배경이 있으면 그 뒤에
        if _bar is not None and _row:
            frame:
                style "empty"
                background _bar
                padding qmenu.cfg("bar_padding")
                align qmenu.bar_align()

                hbox:
                    style "quick_menu"
                    align (0.5, 0.5)
                    for it in _row:
                        use qmenu_button(it)

        elif _row:
            hbox:
                style "quick_menu"
                for it in _row:
                    use qmenu_button(it)

        ## 옮긴 항목: 그 자리(가운데 기준)에
        for it in _items:
            if not it.row:
                fixed:
                    fit_first True
                    pos (it.x, it.y)
                    anchor (0.5, 0.5)
                    use qmenu_button(it)
