################################################################################
## UI Kit — 타이틀 메뉴 엔진
##
## 이 파일은 고칠 필요가 없습니다. 설정은 title_menu_config.rpy에서 하세요.
##
## 렌파이 기본 screens.rpy의 main_menu, navigation, game_menu 스크린을 대신 정의합니다.
## 게임 중 ESC 메뉴(일시정지 메뉴, tmenu_pause 스크린)도 같은 모양으로 그립니다. (3.1)
## tmenu.enabled = False면 렌파이 기본 타이틀 화면과 똑같이 그립니다.
################################################################################

## 기본 screens.rpy(init offset -1)보다 늦게 실행되어 항상 덮어쓰도록 합니다.
init offset = 1


## ── 1. 엔진 코드 ─────────────────────────────────────────────────────────────

init -10 python in tmenu:

    import os

    import store
    from store import (
        Action, NullAction, DictEquality, Transform, Text, Null, Fixed, python_object,
        )
    from store.ui_kit import ShapeMatrix, shape_matrix, is_style_property, to_pixels, eval_condition

    VERSION = store.ui_kit.VERSION

    ## 설정 파일에서 값을 주지 않았을 때 쓰는 기본값.
    DEFAULTS = dict(
        enabled=True,
        items=[ ],
        default={ },
        layout={ },
        layout_default={ },
        start_index=0,
        move_time=0.25,
        move_warper="easeout",
        fade_time=0.12,
        push_before=(0, -10),
        push_after=(0, 10),
        push_falloff=0.6,
        intro=True,
        intro_delay=0.06,
        intro_time=0.35,
        intro_offset=(-30, 0),
        keyboard_order=True,
        hit_padding=8,
        insensitive_alpha=0.4,
        hover_sound=None,
        activate_sound=None,
        background_movie=None,
        background_side_mask=False,
        movie_group=None,
        show_version=True,
        main_menu_frame=True,
        title_game_menu_navigation=True,
        game_menu=None,
        game_menu_side=True,
        game_menu_content_x=None,
        game_menu_gap=50,
        game_menu_line=None,
        pause=True,
        pause_items=None,
        pause_layout={ },
        pause_dim="#000000b3",
        pause_background=None,
        )

    ## 엔진이 직접 처리하는 항목 설정. 여기 없는 이름은 글자 스타일 속성으로
    ## 취급합니다. (font, size, color, outlines, kerning, bold ... 렌파이의
    ## 모든 텍스트 스타일 속성. 앞에 hover_를 붙이면 선택됐을 때의 값.)
    RESERVED = {
        "id", "text", "hover_text", "action", "show_if", "keyboard",
        "x", "y", "xalign", "yalign", "anchor",
        "rotate", "skew", "zoom", "alpha",
        "hover_rotate", "hover_skew", "hover_zoom", "hover_alpha", "hover_offset",
        "push", "push_scale", "shift",
        "hover_movie", "hover_movie_pos", "hover_movie_anchor", "hover_movie_rotate",
        "hover_movie_zoom", "hover_movie_side_mask", "hover_movie_size", "hover_movie_loop",
        "hover_label_movie", "hover_label_movie_side_mask", "hover_label_movie_size",
        "hover_label_movie_offset", "hover_label_movie_loop",
        "hover_sound", "activate_sound", "hit_padding", "insensitive_alpha",
        }

    ## 편집기가 다루는 값 (저장할 때 이 순서로 적습니다).
    EDIT_KEYS = ("x", "y", "anchor", "rotate", "skew", "zoom", "size", "font", "color",
                 "hover_offset", "hover_rotate", "hover_skew", "hover_zoom", "hover_size",
                 "hover_font", "hover_color")

    def cfg(name):
        """설정값을 돌려줍니다. 설정 파일에 없으면 기본값."""
        g = globals()
        if name in g:
            return g[name]
        return DEFAULTS[name]

    def warper():
        return store.ui_kit.warper(cfg("move_warper"))

    ## ── 런타임 상태 (세이브·롤백에 들어가지 않는 일반 파이썬 객체) ──

    class _State(python_object):
        def __init__(self):
            self.cache = None
            self.cache_key = None
            self.disp_cache = { }       # 같은 글자·영상은 다시 만들지 않고 재사용

            ## 편집기 (editor/editor_title.rpy가 씀)
            self.editing = False        # 편집기가 열려 있음 → 메뉴가 눌리지 않음
            self.ed_sel = 0
            self.ed_hover = None
            self.ed_preview = True
            self.ed_mode = "base"       # "base" = 평소, "hover" = 선택됐을 때
            self.ed_scope = "item"      # "item" = 이 항목만, "all" = 모든 항목 공통
            self.edits = { }            # id -> {키: 값}  (아직 저장 안 한 항목별 편집, 타이틀 메뉴)
            self.pause_edits = { }      # id -> {키: 값}  (같은 것, 일시정지 메뉴)
            self.caches = { }           # 메뉴 -> (키, 항목 목록)
            self.default_edits = { }    # {키: 값}  (아직 저장 안 한 공통 값 편집)
            self.edit_serial = 0

    state = _State()

    ## ── 항목 해석 ──

    class Item(python_object):
        """설정 한 줄(dict)을 화면에 쓰기 좋게 풀어놓은 것."""

    def _err(item_id, msg):
        raise Exception("[title_menu] 항목 '{}': {}".format(item_id, msg))

    def _cached(key, factory):
        """같은 설정으로 만든 displayable은 재사용합니다.
        (편집 중 위치만 바뀔 때 글자를 다시 그리거나 영상이 처음부터 재생되지 않도록)"""
        d = state.disp_cache.get(key, None)
        if d is None:
            d = factory()
            state.disp_cache[key] = d
        return d

    def _props_key(props):
        return repr(sorted(props.items()))

    def _movie(path, side_mask, size, loop):
        return store.ui_kit.movie(path, side_mask, size, loop, cfg("movie_group"))

    ## ── 메뉴 두 벌: "title" 타이틀 메뉴 / "pause" 게임 중 ESC 메뉴 (3.1) ──
    ## 글꼴, 색, 크기, 선택됐을 때 모양 같은 공통 값(tmenu.default)은 둘이 같이 씁니다.

    PAUSE_SCREEN = "tmenu_pause"

    def current_menu():
        """지금 보이는 메뉴. 일시정지 메뉴가 떠 있으면 "pause", 아니면 "title"."""
        try:
            if store.renpy.get_screen(PAUSE_SCREEN) is not None:
                return "pause"
        except Exception:
            pass
        return "title"

    def menu_layout(menu):
        return cfg("pause_layout") if menu == "pause" else cfg("layout")

    def edits_for(menu=None):
        """아직 저장 안 한 항목별 편집 (그 메뉴의)."""
        menu = menu or current_menu()
        return state.pause_edits if menu == "pause" else state.edits

    def _default_pause_items():
        _ = store._
        common = { "hover_zoom": 1.15, "hover_offset": (10, 0) }
        rows = [
            ("return", _("돌아가기"), store.Return(), None),
            ("save", _("저장하기"), store.ShowMenu("save"), None),
            ("load", _("불러오기"), store.ShowMenu("load"), None),
            ("prefs", _("환경설정"), store.ShowMenu("preferences"), None),
            ("history", _("대사록"), store.ShowMenu("history"), None),
            ("main", _("메인 메뉴"), store.MainMenu(), "not _in_replay"),
            ("quit", _("종료하기"), store.Quit(), "renpy.variant('pc')"),
            ]
        rv = [ ]
        n = len(rows)
        for i, (iid, text, action, cond) in enumerate(rows):
            d = dict(common)
            d.update({
                "id": iid, "text": text, "action": action,
                "xalign": 0.06 + 0.01 * i,
                "yalign": round(0.26 + 0.085 * i, 3),
                "rotate": round(-4.0 + 8.0 * i / max(1, n - 1), 1),
                })
            if cond:
                d["show_if"] = cond
            rv.append(d)
        return rv

    _pause_default = [ None ]

    def menu_raw_items(menu):
        if menu == "pause":
            items = cfg("pause_items")
            if items is None:
                if _pause_default[0] is None:
                    _pause_default[0] = _default_pause_items()
                items = _pause_default[0]
            return items
        return cfg("items")

    def pause_on():
        return bool(cfg("enabled") and cfg("pause"))

    def common_values():
        """모든 항목에 공통으로 쓰는 값 (설정 + 저장된 배치 + 저장 안 한 편집)."""
        d = { }
        d.update(cfg("default"))
        d.update(cfg("layout_default"))
        d.update(state.default_edits)
        return d

    def _resolve(index, raw, common, menu="title"):

        d = dict(common)
        d.update(raw)

        iid = d.get("id", "item{}".format(index))

        lay = menu_layout(menu).get(iid, { })
        ed = edits_for(menu).get(iid, { })

        d.update(lay)
        d.update(ed)

        it = Item()
        it.index = index
        it.id = iid
        it.raw = raw

        ## 공통 값보다 이 항목에서 따로 정한 이름 (편집기 안내용)
        it.own_keys = set(raw) | set(lay) | set(ed)

        if "text" not in d:
            _err(iid, "'text'가 없습니다.")

        if "action" not in d:
            _err(iid, "'action'이 없습니다. 예: \"action\": Start()")

        it.text = d["text"]
        it.hover_text = d.get("hover_text", None)
        it.action = d["action"]
        it.show_if = d.get("show_if", None)
        it.keyboard = d.get("keyboard", True)

        ## 위치와 앵커
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

        it.x = x
        it.y = y
        it.anchor = (ax, ay)

        ## 모양
        it.rotate = float(d.get("rotate", 0.0))
        it.skew = float(d.get("skew", 0.0))
        it.zoom = float(d.get("zoom", 1.0))
        it.alpha = float(d.get("alpha", 1.0))

        it.h_rotate = float(d.get("hover_rotate", it.rotate))
        it.h_skew = float(d.get("hover_skew", it.skew))
        it.h_zoom = float(d.get("hover_zoom", it.zoom))
        it.h_alpha = float(d.get("hover_alpha", it.alpha))
        it.h_offset = tuple(d.get("hover_offset", (0, 0)))

        it.push = d.get("push", True)
        it.push_scale = float(d.get("push_scale", 1.0))
        it.shift = tuple(d.get("shift", (0, 0)))

        it.hit_padding = d.get("hit_padding", cfg("hit_padding"))
        it.insensitive_alpha = d.get("insensitive_alpha", cfg("insensitive_alpha"))
        it.hover_sound = d.get("hover_sound", cfg("hover_sound"))
        it.activate_sound = d.get("activate_sound", cfg("activate_sound"))

        ## 글자 스타일 (평소 / 선택됐을 때)
        base = { }
        hover = { }

        for k, v in d.items():
            if k in RESERVED:
                continue

            if k.startswith("hover_"):
                name = k[6:]
                if not is_style_property(name):
                    _err(iid, "'{}'은(는) 알 수 없는 설정입니다.".format(k))
                hover[name] = v
            else:
                if not is_style_property(k):
                    _err(iid, "'{}'은(는) 알 수 없는 설정입니다.".format(k))
                base[k] = v

        hover_props = dict(base)
        hover_props.update(hover)

        it.size = base.get("size", None)
        it.base_props = base
        it.hover_props = hover_props

        ## 표시용 displayable (한 번 만들어 계속 재사용해야 영상·애니메이션이 끊기지 않음)
        bk = _props_key(base)
        hk = _props_key(hover_props)

        it.sizer = _cached(("sizer", iid, it.text, bk), lambda: Transform(Text(it.text, **base), alpha=0.0))
        it.hit_sizer = _cached(("hit", iid, it.text, bk), lambda: Transform(Text(it.text, **base), alpha=0.0))
        it.ed_sizer = _cached(("ed", iid, it.text, bk), lambda: Transform(Text(it.text, **base), alpha=0.0))
        it.idle_disp = _cached(("idle", iid, it.text, bk), lambda: Text(it.text, **base))

        if d.get("hover_label_movie"):
            lm_args = (
                d["hover_label_movie"],
                d.get("hover_label_movie_side_mask", True),
                d.get("hover_label_movie_size", None),
                d.get("hover_label_movie_loop", True),
                )
            lox, loy = d.get("hover_label_movie_offset", (0, 0))
            it.active_disp = _cached(("label_movie", iid, repr(lm_args), lox, loy),
                lambda: Transform(_movie(*lm_args), align=(0.5, 0.5), xoffset=lox, yoffset=loy))
        else:
            text = it.hover_text if it.hover_text is not None else it.text
            it.active_disp = _cached(("active", iid, text, hk), lambda: Text(text, **hover_props))

        ## 뒤에 깔리는 hover 영상
        if d.get("hover_movie"):
            m_args = (
                d["hover_movie"],
                d.get("hover_movie_side_mask", True),
                d.get("hover_movie_size", None),
                d.get("hover_movie_loop", True),
                )
            it.movie = _cached(("movie", iid, repr(m_args)), lambda: _movie(*m_args))
            mx, my = d.get("hover_movie_pos", (0, 0))
            it.movie_dx = mx + it.h_offset[0] + it.shift[0]
            it.movie_dy = my + it.h_offset[1] + it.shift[1]
            it.movie_anchor = d.get("hover_movie_anchor", (0.5, 0.5))
            it.movie_rotate = float(d.get("hover_movie_rotate", 0.0))
            it.movie_zoom = float(d.get("hover_movie_zoom", 1.0))
        else:
            it.movie = None

        return it

    def all_items(menu=None):
        """설정의 모든 항목을 해석해서 돌려줍니다. (편집할 때만 다시 만듦)
        menu: "title" / "pause" / None(지금 보이는 메뉴)"""

        menu = menu or current_menu()
        raw_items = menu_raw_items(menu)
        key = (id(raw_items), id(menu_layout(menu)), id(cfg("layout_default")), state.edit_serial)

        c = state.caches.get(menu)
        if c is None or c[0] != key:
            common = common_values()
            c = (key, [ _resolve(i, raw, common, menu) for i, raw in enumerate(raw_items) ])
            state.caches[menu] = c

        return c[1]

    def get_items(menu=None):
        """지금 보여줄 항목들. (show_if 조건 적용)"""
        rv = [ ]

        for it in all_items(menu):
            if it.show_if is not None and not state.editing:
                if not eval_condition(it.show_if):
                    continue
            rv.append(it)

        return rv

    def active_index(sel, n):
        if state.editing:
            if state.ed_preview:
                return state.ed_sel
            return -1
        if n == 0 or sel is None or sel < 0:
            return -1
        return min(sel, n - 1)

    def shift_of(items, sel):
        if 0 <= sel < len(items):
            return items[sel].shift
        return (0, 0)

    def motion(items, i, sel, shift):
        """i번 항목이 이동할 양과 투명도: (dx, dy, alpha)."""

        it = items[i]
        sx, sy = shift

        if i == sel:
            dx = it.h_offset[0]
            dy = it.h_offset[1]
            a = it.h_alpha

        elif sel < 0 or not it.push:
            dx = dy = 0
            a = it.alpha

        else:
            if i < sel:
                px, py = cfg("push_before")
                steps = sel - i
            else:
                px, py = cfg("push_after")
                steps = i - sel

            f = (cfg("push_falloff") ** (steps - 1)) * it.push_scale
            dx = px * f
            dy = py * f
            a = it.alpha

        if not state.editing and (it.action is None or not store.renpy.is_sensitive(it.action)):
            a *= it.insensitive_alpha

        return (dx + sx, dy + sy, a)

    def shape(it, active):
        """선택 여부에 따른 추가 회전·기울기·확대 (기본 모양 위에 얹는 값)."""
        if not active:
            return (0.0, 0.0, 1.0)

        z = it.h_zoom / it.zoom if it.zoom else 1.0
        return (it.h_rotate - it.rotate, it.h_skew - it.skew, z)

    def neighbors(items, sel):
        """키보드로 이동할 이전·다음 항목."""
        order = [ i for i, it in enumerate(items) if it.keyboard ]

        if not order:
            return (sel, sel)

        if sel not in order:
            return (order[0], order[0])

        k = order.index(sel)
        return (order[(k - 1) % len(order)], order[(k + 1) % len(order)])

    def intro_args(i, intro=True):
        if not intro or not cfg("intro"):
            return (0.0, 0.0, 0, 0)

        ox, oy = cfg("intro_offset")
        return (i * cfg("intro_delay"), cfg("intro_time"), ox, oy)

    def hit_offset(it):
        p = it.hit_padding
        return (p * (2 * it.anchor[0] - 1), p * (2 * it.anchor[1] - 1))

    def abs_pos(it):
        """항목 위치를 화면 픽셀 좌표로."""
        return (to_pixels(it.x, store.config.screen_width), to_pixels(it.y, store.config.screen_height))

    ## ── 게임 메뉴 버튼 목록 ──
    ## 항목: (글자, 동작) 또는 (글자, 동작, "보일 조건")

    def _default_game_menu():
        _ = store._
        return [
            (_("시작하기"), store.Start(), "main_menu"),
            (_("대사록"), store.ShowMenu("history"), "not main_menu"),
            (_("저장하기"), store.ShowMenu("save"), "not main_menu"),
            (_("불러오기"), store.ShowMenu("load")),
            (_("환경설정"), store.ShowMenu("preferences")),
            (_("리플레이 끝내기"), store.EndReplay(confirm=True), "_in_replay"),
            (_("메인 메뉴"), store.MainMenu(), "not main_menu and not _in_replay"),
            (_("버전정보"), store.ShowMenu("about")),
            (_("조작방법"), store.ShowMenu("help"), "renpy.variant('pc') or (renpy.variant('web') and not renpy.variant('mobile'))"),
            (_("종료하기"), store.Quit(), "renpy.variant('pc')"),
            ]

    def game_menu_items():
        entries = cfg("game_menu") if cfg("enabled") else None
        if entries is None:
            entries = _default_game_menu()

        rv = [ ]

        for e in entries:
            label, action = e[0], e[1]
            cond = e[2] if len(e) > 2 else None

            if not eval_condition(cond):
                continue

            rv.append((label, action))

        return rv

    def show_navigation():
        """타이틀에서 연 환경설정·불러오기 화면에 왼쪽 목록을 보여줄지."""
        if not cfg("enabled"):
            return True
        return not (store.main_menu and not cfg("title_game_menu_navigation"))

    ## ── 게임 메뉴 화면 (대사록·저장·불러오기·환경설정) 옆 모양 (4.14) ──
    ## 왼쪽에 ESC 메뉴(타이틀에서 열면 타이틀 메뉴)를 그대로 두고,
    ## 제목과 내용은 그 메뉴의 오른쪽 끝보다 오른편에 놓습니다.

    def game_menu_kind():
        """게임 메뉴 화면 왼쪽에 그릴 메뉴. "title" / "pause" / None(렌파이 기본 모양)."""
        if not (cfg("enabled") and cfg("game_menu_side")):
            return None
        if store.main_menu:
            if not cfg("title_game_menu_navigation"):
                return None
            return "title"
        if pause_on():
            return "pause"
        return None

    def selected_index(items):
        """지금 열린 화면을 여는 항목 번호 (예: 환경설정 화면이면 "환경설정" 항목).
        없으면 -1 (아무 항목도 선택된 모양이 아님)."""
        for i, it in enumerate(items):
            try:
                if it.action is not None and store.renpy.is_selected(it.action):
                    return i
            except Exception:
                pass
        return -1

    def _item_right(it, sw):
        """항목이 화면에서 차지하는 오른쪽 끝 (회전, 확대, 선택됐을 때 이동까지 넉넉히)."""
        import math
        try:
            w, h = it.idle_disp.size()
        except Exception:
            w, h = (0, 0)
        try:
            hw, hh = it.active_disp.size()
            w, h = max(w, hw), max(h, hh)
        except Exception:
            pass
        z = max(abs(it.zoom), abs(it.h_zoom))
        r = math.radians(max(abs(it.rotate), abs(it.h_rotate)))
        bw = (w * abs(math.cos(r)) + h * abs(math.sin(r))) * z
        center = to_pixels(it.x, sw) + (0.5 - it.anchor[0]) * w
        return center + bw / 2.0 + max(0, it.h_offset[0]) + max(0, it.shift[0])

    _cx_cache = { }

    def content_x_for(kind):
        """제목과 내용이 시작하는 x (픽셀)."""
        sw = store.config.screen_width
        v = cfg("game_menu_content_x")
        if v is not None:
            return int(to_pixels(v, sw))

        items = get_items(kind)
        key = (kind, state.edit_serial, store._preferences.language, tuple(it.id for it in items), sw)
        rv = _cx_cache.get(key)
        if rv is None:
            right = 0
            for it in items:
                right = max(right, _item_right(it, sw))
            if items:
                right += max(0, cfg("push_before")[0], cfg("push_after")[0])
            rv = int(right + cfg("game_menu_gap"))
            ## 메뉴가 화면 가운데까지 와 있으면 내용 자리가 없으므로 절반에서 멈춤
            rv = max(0, min(rv, int(sw * 0.5)))
            _cx_cache[key] = rv
        return rv

    ## ── 편집기 연결 (편집기 본체는 editor 폴더) ──

    class EdHover(Action, DictEquality):
        """편집 중에 마우스가 올라간 항목을 기억합니다."""
        def __init__(self, index):
            self.index = index

        def __call__(self):
            if state.ed_hover != self.index:
                state.ed_hover = self.index
                store.renpy.restart_interaction()

    def focused_index():
        """지금 마우스·키보드 포커스가 있는 메뉴 항목 번호. 없으면 None."""
        try:
            import renpy.display.focus
            f = renpy.display.focus.get_focused()
            wid = getattr(f, "id", None) or ""
            if wid.startswith("tmenu_btn_"):
                return int(wid[len("tmenu_btn_"):])
        except Exception:
            pass
        return None

    ## ── 화면 효과(screen_fx)와 연결 ──

    def scene_fx():
        """screen_fx 플러그인의 '장면만' 효과를 타이틀 배경에도 씌우는 트랜스폼. 없으면 None.
        (적용 대상이 "scene"인 효과도 타이틀 배경 그림에는 걸리고, 메뉴 글자는 그대로 둡니다)"""
        sfx = getattr(store, "screen_fx", None)
        return getattr(sfx, "scene", None)

    ## ── 배경 영상 ──
    ## gui.main_menu_background를 영상으로 바꿉니다. 타이틀에서 연 환경설정·불러오기
    ## 화면도 같은 값을 쓰므로 배경이 끊기지 않고 이어집니다.
    ## (렌파이는 시작할 때와 언어를 바꿀 때 gui 값을 다시 계산하므로, 그때마다 다시 적용)

    _background = None

    def _setup_background():
        global _background

        if not cfg("enabled"):
            return

        path = cfg("background_movie")
        if not path:
            return

        if _background is None:
            _background = store.Movie(
                play=path,
                side_mask=cfg("background_side_mask"),
                loop=True,
                )

        store.gui.main_menu_background = _background


init 990 python in tmenu:
    ## 설정 파일·배치 파일을 다 읽은 뒤 실행됩니다.

    _setup_background()

    ## 게임 중 ESC(오른쪽 클릭)로 여는 화면을 일시정지 메뉴로 (3.1)
    if pause_on():
        store._game_menu_screen = PAUSE_SCREEN

    for _lang in [ None ] + sorted(store.renpy.known_languages()):
        store.config.language_callbacks[_lang].append(_setup_background)


## ── 2. 애니메이션 ────────────────────────────────────────────────────────────

## 처음 나타날 때 (항목마다 조금씩 늦게)
transform tmenu_intro(delay, t, ox, oy):
    alpha 0.0 xoffset ox yoffset oy
    pause delay
    easein t alpha 1.0 xoffset 0 yoffset 0

## 밀려나기 · 선택 시 이동 · 투명도 (화면 기준)
transform tmenu_move(dx, dy, a, w, t):
    warp w t xoffset dx yoffset dy alpha a

## 기본 모양 (항목의 rotate / skew / zoom)
transform tmenu_base(r, s, z):
    matrixanchor (0.5, 0.5)
    matrixtransform ui_kit.ShapeMatrix(r, s, z)

## 선택됐을 때 덧붙는 모양 변화
transform tmenu_fx(r, s, z, w, t):
    matrixanchor (0.5, 0.5)
    warp w t matrixtransform ui_kit.ShapeMatrix(r, s, z)

## 평소 글자 ↔ 선택 글자 교차 페이드
transform tmenu_fade(t):
    align (0.5, 0.5)
    on appear:
        alpha 1.0
    on show:
        alpha 0.0
        linear t alpha 1.0
    on hide:
        linear t alpha 0.0

## 뒤에 깔리는 hover 영상
transform tmenu_movie_at(x, y, ax, ay, dx, dy, r, z, t):
    pos (x, y) anchor (ax, ay) xoffset dx yoffset dy
    matrixanchor (0.5, 0.5)
    matrixtransform ui_kit.ShapeMatrix(r, 0.0, z)
    on appear:
        alpha 1.0
    on show:
        alpha 0.0
        linear t alpha 1.0
    on hide:
        linear t alpha 0.0


## ── 3. 스크린 ────────────────────────────────────────────────────────────────

style tmenu_button is empty

## 타이틀 화면. (렌파이 기본 main_menu 스크린을 대신합니다)
screen main_menu():

    ## 이렇게 하면 다른 메뉴 화면이 모두 교체됩니다.
    tag menu

    ## 배경 그림 (screen_fx가 있으면 '장면만' 효과도 배경에 씌움)
    if tmenu.scene_fx() is not None:
        add gui.main_menu_background at tmenu.scene_fx()
    else:
        add gui.main_menu_background

    if tmenu.cfg("enabled"):

        ## 렌파이 기본 GUI의 메뉴 뒤 반투명 판 (gui/overlay/main_menu.png)
        if tmenu.cfg("main_menu_frame"):
            frame:
                style "main_menu_frame"

        use title_menu

    else:

        ## 기능을 끄면 렌파이 기본 타이틀 화면과 같습니다.
        frame:
            style "main_menu_frame"

        use navigation

    if gui.show_name:

        vbox:
            style "main_menu_vbox"

            text "[config.name!t]":
                style "main_menu_title"

            if tmenu.cfg("show_version") or not tmenu.cfg("enabled"):
                text "[config.version]":
                    style "main_menu_version"

## 게임 메뉴(대사록·저장·불러오기·환경설정 등) 왼쪽의 버튼 목록.
## (렌파이 기본 navigation 스크린을 대신합니다)
screen navigation():

    if tmenu.show_navigation():

        vbox:
            style_prefix "navigation"

            xpos gui.navigation_xpos
            yalign 0.5

            spacing gui.navigation_spacing

            for _label, _action in tmenu.game_menu_items():
                textbutton _label action _action

    else:

        ## 타이틀에서 연 환경설정·불러오기 화면에는 왼쪽 목록을 두지 않음
        null

## 대사록·저장·불러오기·환경설정 화면의 틀. (렌파이 기본 game_menu 스크린을 대신합니다) (4.14)
## 왼쪽에 ESC 메뉴(타이틀에서 열면 타이틀 메뉴)를 같은 자리, 같은 모양으로 두고
## 제목과 내용은 그 오른편에 놓습니다. 지금 열린 화면의 항목이 선택된 모양으로 보입니다.
## tmenu.game_menu_side = False면 렌파이 기본 모양(왼쪽 목록 + 내용)과 같습니다.
screen game_menu(title, scroll=None, yinitial=0.0, spacing=0):

    style_prefix "game_menu"

    $ _kind = tmenu.game_menu_kind()

    if _kind is not None:

        $ _items = tmenu.get_items(_kind)
        $ _cur = tmenu.selected_index(_items)
        $ _cx = tmenu.content_x_for(_kind)
        $ _vw = min(920, config.screen_width - _cx - 40)

        ## 배경: 타이틀에서는 타이틀 배경, 게임 중에는 ESC 메뉴와 같은 배경
        if main_menu:
            if tmenu.scene_fx() is not None:
                add gui.main_menu_background at tmenu.scene_fx()
            else:
                add gui.main_menu_background
        elif tmenu.cfg("pause_background") is not None:
            add tmenu.cfg("pause_background")
        elif tmenu.cfg("pause_dim"):
            add Solid(tmenu.cfg("pause_dim"))

        ## 메뉴와 내용 사이 세로줄 (tmenu.game_menu_line에 색을 적으면)
        if tmenu.cfg("game_menu_line"):
            add Solid(tmenu.cfg("game_menu_line")):
                xpos (_cx - tmenu.cfg("game_menu_gap") // 2)
                xsize 2
                ypos 40
                ysize (config.screen_height - 80)

        frame:
            style "game_menu_outer_frame"
            background None

            hbox:

                null width _cx

                frame:
                    style "game_menu_content_frame"
                    left_margin 0

                    if scroll == "viewport":

                        viewport:
                            xsize _vw
                            yinitial yinitial
                            scrollbars "vertical"
                            mousewheel True
                            draggable True
                            pagekeys True

                            side_yfill True

                            vbox:
                                spacing spacing

                                transclude

                    elif scroll == "vpgrid":

                        vpgrid:
                            xsize _vw
                            cols 1
                            yinitial yinitial

                            scrollbars "vertical"
                            mousewheel True
                            draggable True
                            pagekeys True

                            side_yfill True

                            spacing spacing

                            transclude

                    else:

                        transclude

        use title_menu(screen_name=renpy.current_screen().screen_name[0], menu=_kind, start=_cur, intro=False, rest=_cur)

        ## 타이틀 메뉴에는 "돌아가기" 항목이 없으므로 버튼을 따로 둠
        if _kind == "title":
            textbutton _("돌아가기"):
                style "return_button"
                action Return()

        label title:
            xpos _cx

    else:

        ## 렌파이 기본 screens.rpy의 game_menu와 같습니다.
        if main_menu:
            add gui.main_menu_background
        else:
            add gui.game_menu_background

        frame:
            style "game_menu_outer_frame"

            hbox:

                ## 탐색 섹션을 위한 공간 예약.
                frame:
                    style "game_menu_navigation_frame"

                frame:
                    style "game_menu_content_frame"

                    if scroll == "viewport":

                        viewport:
                            yinitial yinitial
                            scrollbars "vertical"
                            mousewheel True
                            draggable True
                            pagekeys True

                            side_yfill True

                            vbox:
                                spacing spacing

                                transclude

                    elif scroll == "vpgrid":

                        vpgrid:
                            cols 1
                            yinitial yinitial

                            scrollbars "vertical"
                            mousewheel True
                            draggable True
                            pagekeys True

                            side_yfill True

                            spacing spacing

                            transclude

                    else:

                        transclude

        use navigation

        textbutton _("돌아가기"):
            style "return_button"

            action Return()

        label title

    if main_menu:
        key "game_menu" action ShowMenu("main_menu")

## 타이틀 메뉴 본체. 위의 main_menu 스크린이 불러옵니다.
## screen_name: 이 메뉴가 들어 있는 최상위 스크린 이름 (키보드 이동에 사용)
## start: 처음 선택된 항목 (None이면 tmenu.start_index)
## intro: 등장 연출을 할지 / rest: 마우스가 떠나면 돌아갈 항목 (None이면 그대로 둠)
screen title_menu(screen_name="main_menu", menu="title", start=None, intro=True, rest=None):

    default sel = (tmenu.cfg("start_index") if start is None else start)

    $ _items = tmenu.get_items(menu)
    $ _n = len(_items)
    $ _sel = tmenu.active_index(sel, _n)
    $ _shift = tmenu.shift_of(_items, _sel)
    $ _w = tmenu.warper()
    $ _t = tmenu.cfg("move_time")
    $ _ft = tmenu.cfg("fade_time")

    fixed:

        ## 키보드·게임패드: 목록 순서대로 이동
        if tmenu.cfg("keyboard_order") and _n and not tmenu.state.editing:
            $ _prev, _next = tmenu.neighbors(_items, _sel)
            key "focus_up" action [ SetLocalVariable("sel", _prev), Function(renpy.set_focus, screen_name, "tmenu_btn_%d" % _prev) ]
            key "focus_left" action [ SetLocalVariable("sel", _prev), Function(renpy.set_focus, screen_name, "tmenu_btn_%d" % _prev) ]
            key "focus_down" action [ SetLocalVariable("sel", _next), Function(renpy.set_focus, screen_name, "tmenu_btn_%d" % _next) ]
            key "focus_right" action [ SetLocalVariable("sel", _next), Function(renpy.set_focus, screen_name, "tmenu_btn_%d" % _next) ]

        ## (1) hover 영상 — 항상 모든 글자 뒤
        for i, it in enumerate(_items):
            if it.movie is not None:
                showif i == _sel:
                    add it.movie at tmenu_movie_at(it.x, it.y, it.movie_anchor[0], it.movie_anchor[1], it.movie_dx, it.movie_dy, it.movie_rotate, it.movie_zoom, _ft)

        ## (2) 보이는 글자
        for i, it in enumerate(_items):
            $ _act = (i == _sel)
            $ _dx, _dy, _a = tmenu.motion(_items, i, _sel, _shift)
            $ _fr, _fs, _fz = tmenu.shape(it, _act)
            $ _id, _it, _iox, _ioy = tmenu.intro_args(i, intro)

            fixed:
                fit_first True
                pos (it.x, it.y)
                anchor it.anchor
                at tmenu_intro(_id, _it, _iox, _ioy)

                fixed:
                    fit_first True
                    at tmenu_move(_dx, _dy, _a, _w, _t)

                    fixed:
                        fit_first True
                        at tmenu_base(it.rotate, it.skew, it.zoom)

                        fixed:
                            fit_first True
                            at tmenu_fx(_fr, _fs, _fz, _w, _t)

                            add it.sizer
                            showif not _act:
                                add it.idle_disp at tmenu_fade(_ft)
                            showif _act:
                                add it.active_disp at tmenu_fade(_ft)

        ## (3) 클릭 영역 — 보이지 않는 버튼. 평소 위치에 고정되어 있어서
        ##     글자가 움직여도 마우스 판정이 흔들리지 않습니다.
        for i, it in enumerate(_items):
            $ _hx, _hy = tmenu.hit_offset(it)

            button:
                id ("tmenu_btn_%d" % i)
                style "tmenu_button"
                pos (it.x, it.y)
                anchor it.anchor
                xoffset _hx
                yoffset _hy
                padding (it.hit_padding, it.hit_padding)
                at tmenu_base(it.rotate, it.skew, it.zoom)

                if tmenu.state.editing:
                    action NullAction()
                    hovered tmenu.EdHover(i)
                    unhovered tmenu.EdHover(None)
                else:
                    action it.action
                    hovered SetLocalVariable("sel", i)
                    if rest is not None:
                        unhovered SetLocalVariable("sel", rest)
                    hover_sound it.hover_sound
                    activate_sound it.activate_sound
                    default_focus (i == sel)

                add it.hit_sizer


## 게임 중 ESC(오른쪽 클릭)로 여는 일시정지 메뉴 (3.1)
## 타이틀 메뉴와 같은 모양(tmenu.default, 등장 연출, 소리)으로 그립니다.
## 항목은 tmenu.pause_items, 자리는 편집기 "타이틀 메뉴" 탭에서 (tmenu.pause_layout으로 저장).
screen tmenu_pause():

    tag menu

    ## 뒤에 깔린 게임 화면을 어둡게 (또는 그림)
    if tmenu.cfg("pause_background") is not None:
        add tmenu.cfg("pause_background")
    elif tmenu.cfg("pause_dim"):
        add Solid(tmenu.cfg("pause_dim"))

    use title_menu(screen_name="tmenu_pause", menu="pause")

    ## ESC를 한 번 더 누르면 게임으로
    key "game_menu" action Return()
