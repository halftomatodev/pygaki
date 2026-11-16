################################################################################
## UI Kit — 선택지 엔진
##
## 이 파일은 고칠 필요가 없습니다. 설정은 choice_menu_config.rpy에서 하세요.
##
## 렌파이 기본 screens.rpy의 choice 스크린을 대신 정의합니다.
## cmenu.enabled = False면 렌파이 기본 선택지와 똑같이 그리고,
## 스크립트에 적은 선택지 값(괄호)은 무시합니다.
##
##     menu:
##         "도망친다" (x=300, y=350, font="fonts/ChosunGu.ttf", size=25, color="#aa0000"):
##             jump run
################################################################################

## 기본 screens.rpy(init offset -1)보다 늦게 실행되어 항상 덮어쓰도록 합니다.
init offset = 1

init -10 python in cmenu:

    import store
    from store import DictEquality, Transform, Fixed, python_object
    from store.ui_kit import ShapeMatrix, shape_matrix, is_style_property

    VERSION = store.ui_kit.VERSION

    DEFAULTS = dict(
        enabled=True,
        default={ },
        layout={ },
        list_pos=None,
        appear="pop",
        appear_time=0.25,
        appear_stagger=0.05,
        appear_offset=(0, 20),
        hover_time=0.15,
        hover_warper="easeout",
        hover_sound=None,
        activate_sound=None,
        movie_group=None,
        )

    ## 엔진이 직접 처리하는 값. 나머지는 글자 스타일 속성으로 넘깁니다.
    RESERVED = {
        "x", "y", "xalign", "yalign", "anchor",
        "rotate", "skew", "zoom", "alpha",
        "hover_rotate", "hover_skew", "hover_zoom", "hover_alpha", "hover_offset",
        "width", "text_xalign", "delay", "appear",
        "hover_movie", "hover_movie_size", "hover_movie_side_mask", "hover_movie_zoom",
        "hover_movie_offset", "hover_movie_loop",
        "hover_sound", "activate_sound",
        "idle_media", "hover_media", "select_media", "select_time",
        "media_fit", "media_zoom", "media_offset", "media_mask", "media_loop", "media_button", "media_padding",
        }

    ## 선택지 뒤 그림/영상 (ui_kit 4.14). 하나라도 있으면 기본 버튼 배경을 없앱니다 (media_button=True면 그대로)
    MEDIA_KEYS = ("idle_media", "hover_media", "select_media")

    POSITION_KEYS = ("x", "y", "xalign", "yalign")

    ## 편집기가 "이 값은 지움"을 나타낼 때 쓰는 표시
    REMOVE = "__ui_kit_remove__"

    ## 편집기가 다루는 값 (저장·복사할 때 이 순서로 적습니다).
    EDIT_KEYS = ("x", "y", "rotate", "skew", "zoom", "size", "font", "color",
                 "hover_offset", "hover_rotate", "hover_skew", "hover_zoom", "hover_size",
                 "hover_font", "hover_color")

    def cfg(name):
        """설정값. 편집기가 저장한 값(choice_menu_layout.rpy) → 설정 파일 → 기본값 순서."""
        g = globals()
        lay = g.get("layout", None) or { }
        if name in lay and name != "default":
            return lay[name]
        if name in g:
            return g[name]
        return DEFAULTS[name]

    def warper(name):
        return store.ui_kit.warper(name)

    ## ── 런타임 상태 ──

    ## 편집 상태는 되감기(롤백)에 영향받지 않습니다.
    class _State(store.NoRollback):
        def __init__(self):
            self.cache = { }

            ## 편집기 (editor/editor_choice.rpy가 씀)
            self.editing = False
            self.menu_key = None        # 편집 중인 menu 문의 (파일, 줄)
            self.edits = { }            # (파일, 줄, 선택지 번호) -> {키: 값}  원고에 아직 안 쓴 값
            self.saved = { }            # (파일, 줄, 선택지 번호) -> {키: 값}  원고에 썼지만 다시 불러오기 전인 값
            self.default_edits = { }    # 모든 선택지 기본값 편집
            self.list_pos = None        # 세로 목록 위치 편집 (x, y)
            self.preview_hover = None   # 선택됐을 때 모양으로 보여줄 선택지 번호
            self.ed_number = None       # 편집기에서 고른 선택지 번호 (테두리 표시)
            self.last = None            # 마지막으로 그린 선택지들 (편집기용)

            ## 고르고 확정할 때 그림(select_media)을 보여 주는 중: (선택지 번호, 원래 동작, 이 메뉴의 items)
            self.picked = None

    state = _State()

    def _cached(key, factory):
        d = state.cache.get(key, None)
        if d is None:
            d = factory()
            state.cache[key] = d
        return d

    def _hover_background(d):
        path = d.get("hover_movie", None)
        if not path:
            return None

        side_mask = d.get("hover_movie_side_mask", True)
        size = d.get("hover_movie_size", None)
        loop = d.get("hover_movie_loop", True)
        zoom = d.get("hover_movie_zoom", 1.0)
        ox, oy = d.get("hover_movie_offset", (0, 0))

        key = ("hover_bg", path, side_mask, repr(size), loop, zoom, ox, oy)

        def make():
            m = store.ui_kit.movie(path, side_mask, size, loop, cfg("movie_group"))
            return Fixed(Transform(m, align=(0.5, 0.5), xoffset=ox, yoffset=oy, zoom=zoom))

        return _cached(key, make)

    def _media(d, key):
        """선택지 뒤 그림/영상 (idle_media, hover_media, select_media). 글 가운데가 기준."""
        src = d.get(key, None)
        if not src:
            return None
        fit = d.get("media_fit", "text")
        zoom = float(d.get("media_zoom", 1.0) or 1.0)
        ox, oy = d.get("media_offset", (0, 0))
        mask = bool(d.get("media_mask", False))
        loop = bool(d.get("media_loop", True))
        k = ("media", key, src, fit, zoom, ox, oy, mask, loop)

        def make():
            m = store.say_style.media_displayable(src, mask, loop)
            if fit == "image":
                return Fixed(Transform(m, align=(0.5, 0.5), xoffset=ox, yoffset=oy, zoom=zoom))
            if fit != "text":
                _err(src, "media_fit은 \"text\"나 \"image\"입니다: {!r}".format(fit))
            return _Fill(m, ox, oy)

        return _cached(k, make)

    class _Fill(store.renpy.Displayable):
        """받은 자리(버튼 크기)에 맞춰 늘려 그림. 버튼 background로 씀."""
        def __init__(self, child, ox=0, oy=0, **kw):
            super(_Fill, self).__init__(**kw)
            self.child = child
            self.ox, self.oy = ox, oy

        def render(self, width, height, st, at):
            w, h = int(width), int(height)
            cr = store.renpy.render(store.Transform(self.child, xysize=(w, h)), w, h, st, at)
            rv = store.renpy.Render(w, h)
            rv.blit(cr, (self.ox, self.oy))
            return rv

        def visit(self):
            return [ self.child ]

    def pick(number, action, items):
        """고르고 확정할 때 그림이 있는 선택지를 누름: 그림을 select_time초 보여 준 뒤 원래 동작."""
        if state.picked is not None:
            return
        state.picked = (number, action, items)
        store.renpy.restart_interaction()

    def pick_done():
        p = state.picked
        state.picked = None
        if p is not None:
            return store.renpy.run(p[1])

    ## ── 선택지 해석 ──

    class Choice(python_object):
        pass

    def _err(caption, msg):
        raise Exception("[choice_menu] 선택지 '{}': {}".format(caption, msg))

    def default_values():
        """모든 선택지의 기본값 (설정 + 저장된 배치 + 저장 안 한 편집)."""
        d = { }
        d.update(cfg("default"))
        d.update((globals().get("layout", None) or { }).get("default", { }))
        if state.editing:
            d.update(state.default_edits)
        return d

    def item_number(item, i):
        """menu 문 안에서 이 선택지의 번호 (조건 때문에 숨은 선택지도 셉니다)."""
        v = getattr(getattr(item, "action", None), "value", None)
        if isinstance(v, int) and not isinstance(v, bool):
            return v
        return i

    def current_menu_key():
        """지금 실행 중인 menu 문의 (파일, 줄). menu 문이 아니면 None."""
        try:
            import renpy
            node = renpy.game.script.lookup(renpy.game.context().current)
            if isinstance(node, renpy.ast.Menu):
                return (node.filename, node.linenumber)
        except Exception:
            pass
        return None

    def _resolve(index, item, menu_kwargs, defaults, menu_key):

        number = item_number(item, index)

        item_kwargs = dict(item.kwargs)
        if state.editing and menu_key is not None:
            item_kwargs.update(state.saved.get(menu_key + (number,), { }))
            item_kwargs.update(state.edits.get(menu_key + (number,), { }))
            for k in [ k for k, v in item_kwargs.items() if isinstance(v, str) and v == REMOVE ]:
                del item_kwargs[k]

        d = dict(defaults)
        d.update(menu_kwargs)
        d.update(item_kwargs)

        ## 편집기에서 "선택됐을 때" 모양을 미리 보여줄 때: hover_ 값을 평소 값으로
        preview = state.editing and state.preview_hover == number
        if preview:
            for k, v in list(d.items()):
                if k.startswith("hover_") and k not in ("hover_movie", "hover_movie_size",
                        "hover_movie_side_mask", "hover_movie_zoom", "hover_movie_offset",
                        "hover_movie_loop", "hover_sound", "hover_offset"):
                    d[k[6:]] = v

        c = Choice()
        c.index = index
        c.number = number
        c.caption = item.caption
        c.action = item.action
        c.chosen = getattr(item, "chosen", False)
        c.own_keys = set(item_kwargs)

        ## 위치가 하나라도 있으면 자유 배치, 없으면 기본 세로 목록
        c.free = any(k in item_kwargs or k in menu_kwargs for k in POSITION_KEYS)

        anchor = d.get("anchor", (0.5, 0.5))
        ax, ay = anchor

        if "xalign" in d and "x" not in d:
            x = d["xalign"]
            ax = d["xalign"]
        else:
            x = d.get("x", 0.5)

        if "yalign" in d and "y" not in d:
            y = d["yalign"]
            ay = d["yalign"]
        else:
            y = d.get("y", 0.5)

        c.x = x
        c.y = y
        c.anchor = (ax, ay)

        c.rotate = float(d.get("rotate", 0.0))
        c.skew = float(d.get("skew", 0.0))
        c.zoom = float(d.get("zoom", 1.0))
        c.alpha = float(d.get("alpha", 1.0))
        c.h_rotate = float(d.get("hover_rotate", c.rotate))
        c.h_skew = float(d.get("hover_skew", c.skew))
        c.h_zoom = float(d.get("hover_zoom", c.zoom))
        c.h_alpha = float(d.get("hover_alpha", c.alpha))
        c.h_dx, c.h_dy = d.get("hover_offset", (0, 0))

        if preview:
            c.rotate, c.skew, c.zoom, c.alpha = c.h_rotate, c.h_skew, c.h_zoom, c.h_alpha

        c.delay = d.get("delay", None)
        c.appear = d.get("appear", cfg("appear"))
        c.hover_sound = d.get("hover_sound", cfg("hover_sound"))
        c.activate_sound = d.get("activate_sound", cfg("activate_sound"))

        c.values = d

        text_props = { }
        button_props = { }

        for k, v in d.items():
            if k in RESERVED:
                continue

            if k.startswith("button_"):
                name = k[len("button_"):]
                if not is_style_property(name):
                    _err(c.caption, "'{}'은(는) 알 수 없는 설정입니다.".format(k))
                button_props[name] = v
                continue

            if not is_style_property(k):
                _err(c.caption, "'{}'은(는) 알 수 없는 설정입니다.".format(k))

            text_props[k] = v

        width = d.get("width", None)
        if width:
            text_props["xmaximum"] = width

        ## 버튼이 글자보다 넓을 때(button_xsize) 그 안에서 글자의 가로 위치
        if d.get("text_xalign", None) is not None:
            text_props["xalign"] = d["text_xalign"]

        hb = _hover_background(d)
        if hb is not None:
            button_props["hover_background"] = hb

        ## 뒤 그림/영상
        c.select_media = None
        c.select_time = float(d.get("select_time", 0.5) or 0.0)
        if any(d.get(k) for k in MEDIA_KEYS):
            idle = _media(d, "idle_media")
            hover = _media(d, "hover_media")
            if not d.get("media_button", False):
                button_props["background"] = None
                button_props["hover_background"] = None
                ## 버튼을 글 크기 + 여백으로 (button_xsize를 따로 적었으면 그것)
                if "button_xsize" not in item_kwargs and "button_xsize" not in menu_kwargs:
                    button_props["xsize"] = None
                if "button_padding" not in item_kwargs and "button_padding" not in menu_kwargs:
                    button_props["padding"] = store.say_style._padding(d.get("media_padding", (36, 14)))
            if idle is not None:
                button_props["background"] = idle
            if hover is not None or idle is not None:
                button_props["hover_background"] = hover if hover is not None else idle
            c.select_media = _media(d, "select_media")
        c.picking = state.picked is not None and state.picked[0] == number
        if c.picking and c.select_media is not None:
            button_props["background"] = c.select_media
            button_props["hover_background"] = c.select_media

        ## 편집 중: 버튼에 테두리 (버튼과 같이 회전합니다)
        if state.editing and menu_key is not None:
            sel = (state.ed_number == number)
            button_props["foreground"] = store.ui_kit.Outline("#ff3b8d" if sel else "#3bd6ff", 3 if sel else 1)

        ## 미리보기: 평소에도 선택됐을 때 배경·위치로
        c.idle_dx, c.idle_dy = (0, 0)
        if preview:
            if "hover_background" in button_props:
                button_props["background"] = button_props["hover_background"]
            c.idle_dx, c.idle_dy = c.h_dx, c.h_dy

        c.text_props = text_props
        c.button_props = button_props

        return c

    class Prepared(python_object):
        pass

    def prepare(items, menu_kwargs):
        """choice 스크린이 부릅니다. 선택지를 자유 배치/세로 목록으로 나눕니다."""

        menu_kwargs = { k : v for k, v in menu_kwargs.items() if not k.startswith("_") }

        menu_key = current_menu_key() if state.editing else None
        defaults = default_values()

        ## 다른 메뉴로 넘어갔으면(되감기 등) 고르는 중 표시를 지움
        if state.picked is not None and state.picked[2] is not items and not store.renpy.predicting():
            state.picked = None

        rv = Prepared()
        rv.stacked = [ ]
        rv.free = [ ]
        rv.all = [ ]
        rv.menu_key = menu_key
        rv.menu_kwargs = menu_kwargs

        for i, item in enumerate(items):
            c = _resolve(i, item, menu_kwargs, defaults, menu_key)

            if c.delay is None:
                c.delay = i * cfg("appear_stagger")

            rv.all.append(c)

            if c.free:
                rv.free.append(c)
            else:
                rv.stacked.append(c)

        rv.picking = state.picked is not None
        rv.pick_time = 0.5
        for c in rv.all:
            if c.picking:
                rv.pick_time = c.select_time
            ## 확정 그림이 있으면 눌렀을 때 바로 넘어가지 않고 그림을 먼저 보여 줌 (편집 중에는 바로)
            if c.select_media is not None and c.select_time > 0 and not state.editing:
                c.action = store.Function(pick, c.number, c.action, items)

        rv.list_pos = state.list_pos if (state.editing and state.list_pos is not None) else cfg("list_pos")

        if not store.renpy.predicting():
            state.last = rv

        return rv

    def appear_transform(c):
        """등장 연출 transform."""
        t = cfg("appear_time")
        kind = c.appear

        if kind == "pop":
            return store.cmenu_appear_pop(c.delay, t)
        elif kind == "fade":
            return store.cmenu_appear_fade(c.delay, t)
        elif kind == "slide":
            ox, oy = cfg("appear_offset")
            return store.cmenu_appear_slide(c.delay, t, ox, oy)
        else:
            return store.cmenu_appear_none

    def shape_args(c):
        return (c.rotate, c.skew, c.zoom, c.alpha,
                c.h_rotate, c.h_skew, c.h_zoom, c.h_alpha, c.h_dx, c.h_dy,
                cfg("hover_time"), warper(cfg("hover_warper")), c.idle_dx, c.idle_dy)


## ── 애니메이션 ───────────────────────────────────────────────────────────────

transform cmenu_appear_none:
    alpha 1.0

transform cmenu_appear_fade(d, t):
    alpha 0.0
    pause d
    linear t alpha 1.0

## 작게 시작해서 튀어나오듯 커짐
transform cmenu_appear_pop(d, t):
    alpha 0.0
    matrixanchor (0.5, 0.5)
    matrixtransform ui_kit.ShapeMatrix(0.0, 0.0, 0.6)
    pause d
    parallel:
        easeout_back t matrixtransform ui_kit.ShapeMatrix(0.0, 0.0, 1.0)
    parallel:
        linear (t * 0.6) alpha 1.0

transform cmenu_appear_slide(d, t, ox, oy):
    alpha 0.0 xoffset ox yoffset oy
    pause d
    easeout t alpha 1.0 xoffset 0 yoffset 0

## 선택지 모양 + 마우스를 올렸을 때 변화
transform cmenu_shape(r, s, z, a, hr, hs, hz, ha, hx, hy, t, w, ix=0, iy=0):
    matrixanchor (0.5, 0.5)
    matrixtransform ui_kit.ShapeMatrix(r, s, z)
    alpha a
    on idle, insensitive, selected_idle:
        warp w t matrixtransform ui_kit.ShapeMatrix(r, s, z) xoffset ix yoffset iy alpha a
    on hover, selected_hover:
        warp w t matrixtransform ui_kit.ShapeMatrix(hr, hs, hz) xoffset hx yoffset hy alpha ha


## ── 스크린 ───────────────────────────────────────────────────────────────────

style cmenu_button is empty
style cmenu_text is default

## menu 문이 부르는 선택지 화면. (렌파이 기본 choice 스크린을 대신합니다)
## menu 자체에 준 인자는 그 메뉴의 모든 선택지에 적용됩니다.
##     menu (font="fonts/KBLJump_c.ttf"):
screen choice(items, **kwargs):

    style_prefix "choice"

    if not cmenu.cfg("enabled"):

        ## 기능을 끄면 렌파이 기본 선택지와 같습니다.
        vbox:
            for i in items:
                textbutton i.caption action i.action

    else:

        $ _cm = cmenu.prepare(items, kwargs)

        ## 위치를 지정하지 않은 선택지: 렌파이 기본처럼 세로로 쌓기 (choice_vbox 스타일)
        if _cm.stacked:
            vbox:
                if _cm.list_pos is not None:
                    pos _cm.list_pos
                    anchor (0.5, 0.5)

                for c in _cm.stacked:
                    use cmenu_choice(c)

        ## 위치를 지정한 선택지: 그 자리에
        for c in _cm.free:
            use cmenu_choice(c)

        ## 고르고 확정할 때 그림(select_media)을 보여 주는 동안: 다른 곳을 못 누르게 막고, 끝나면 원래 동작
        if _cm.picking:
            button:
                style "empty"
                xysize (config.screen_width, config.screen_height)
                action NullAction()
            timer _cm.pick_time action Function(cmenu.pick_done)


screen cmenu_choice(c):

    fixed:
        fit_first True

        if c.free:
            pos (c.x, c.y)
            anchor c.anchor
        else:
            xalign 0.5

        at cmenu.appear_transform(c)

        button:
            id ("cmenu_btn_%d" % c.number)
            style "cmenu_button"
            action c.action
            hover_sound c.hover_sound
            activate_sound c.activate_sound
            properties c.button_props
            at cmenu_shape(*cmenu.shape_args(c))

            text c.caption:
                style "cmenu_text"
                properties c.text_props
