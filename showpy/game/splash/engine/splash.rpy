################################################################################
## Splash — 엔진
##
## 이 파일은 고칠 필요가 없습니다. 설정은 splash_config.rpy에서 하세요.
##
## 버전 2.0 · Ren'Py 8.5.3에서 제작·테스트
## 설치·설정 방법: 플러그인 폴더의 README.md
##
## 게임을 켰을 때 타이틀 화면 전에 나오는 페이지(로고, 경고, 조작 방법 등)를
## 설정 파일에 적은 순서대로 보여 줍니다.
##
## 렌파이의 splashscreen 레이블을 이 플러그인의 splash_play 레이블로 이어 줍니다.
## (config.label_overrides 사용. 스크립트에 이미 splashscreen 레이블이 있으면
##  건드리지 않으니, 그 레이블 안에서 call splash_play 를 하면 됩니다)
##
## 이 플러그인이 만드는 이름 (전부 splash로 시작):
##   store.splash              설정과 함수가 들어 있는 이름공간
##   label splash_play         페이지를 순서대로 보여 줌
##   label splash_show_page    페이지 하나만 보여 줌 (splash.ShowPage가 씀)
##   label splash_preview      개발 중 처음부터 다시 보기 (splash.preview()가 씀)
##   screen splash_page        페이지 하나를 그리는 스크린
##   persistent.splash_seen    한 번 본 페이지
##   persistent.splash_hidden  플레이어가 "다음부터 보지 않기"를 고른 페이지
################################################################################

init offset = 1

init -10 python in splash:

    import os
    import time

    import store
    from store import Action, DictEquality, Movie, Solid, Text, Transform, python_object

    VERSION = "2.2"

    def scene_fx():
        """screen_fx 플러그인의 '장면만' 효과를 페이지의 바탕·로고 그림에도 씌우는 트랜스폼.
        screen_fx가 없으면 None (아무것도 안 씌움)."""
        sfx = getattr(store, "screen_fx", None)
        return getattr(sfx, "scene", None)

    ## 설정 파일에서 값을 주지 않았을 때 쓰는 기본값.
    DEFAULTS = dict(
        enabled=True,
        pages=[ ],
        default={ },
        layout={ },     # 편집기가 저장한 페이지별 값 (splash_layout.rpy, 1.2)
        page_order=None,  # 편집기가 정한 페이지 순서 (splash_layout.rpy, 2.0). None이면 splash.pages 순서
        start_delay=0.3,
        gap=0.3,
        end_transition=None,
        min_time_once=True,
        developer_skip=False,
        music_fadeout=1.0,
        movie_wait=5.0,
        )

    ## 페이지에 바로 적는 값. 여기 없는 이름은 아래 PREFIXES로 시작하는
    ## 글자 스타일 속성이어야 합니다.
    RESERVED = {
        "id", "show", "show_if", "once", "skippable",
        "color", "background", "background_side_mask", "background_loop",
        "image", "image_side_mask", "image_size", "image_zoom", "image_loop", "image_pos",
        "title", "body", "keys", "prompt", "dont_show_again",
        "duration", "min_time", "fade_in", "fade_out",
        "sound", "music",
        "xalign", "yalign", "spacing", "width",
        "key_width", "key_gap", "keys_spacing", "keys_xalign",
        ## 편집기에서 끌고 돌린 값 (2.0)
        "image_offset", "title_offset", "body_offset", "keys_offset",
        "image_rotate", "title_rotate", "body_rotate", "keys_rotate", "prompt_rotate",
        }

    ## 끌어서 옮기고 돌릴 수 있는 것 (2.0). 묶음 안에 있는 것은 *_offset으로 비켜 그립니다.
    GROUP_ITEMS = ("image", "title", "body", "keys")
    ROTATE_ITEMS = ("image", "title", "body", "keys", "prompt")

    ## 앞에 붙여서 그 글자의 스타일을 정하는 이름.
    ##   title_  제목      body_  본문      key_  조작 방법의 키      desc_  그 설명
    ##   prompt_ "클릭하면 계속" 안내      option_  "다음부터 보지 않기" 버튼
    PREFIXES = ("title_", "body_", "key_", "desc_", "prompt_", "option_")

    ## 버튼 자체의 위치로 쓰는 option_ 값 (나머지 option_ 값은 버튼 글자 스타일)
    BUTTON_POSITION = {
        "xalign", "yalign", "align", "xpos", "ypos", "pos",
        "xanchor", "yanchor", "anchor", "xoffset", "yoffset", "offset",
        }

    MOVIE_EXTS = (".webm", ".ogv", ".mkv", ".mp4", ".avi", ".mpg", ".mpeg", ".mov")

    ## 엔진 기본 모양. 설정 파일의 splash.default가 이 위에 얹힙니다.
    BASE = {
        "color": "#000000",
        "fade_in": 0.6,
        "fade_out": 0.6,
        "duration": None,
        "min_time": 0.5,
        "skippable": True,
        "show": True,
        "once": False,
        "xalign": 0.5,
        "yalign": 0.45,
        "spacing": 28,
        "width": 960,
        "key_width": 300,
        "key_gap": 32,
        "keys_spacing": 12,
        "keys_xalign": 0.5,
        "background_side_mask": False,
        "background_loop": True,
        "image_side_mask": True,
        "image_loop": True,
        "image_zoom": 1.0,

        "title_size": 44,
        "title_color": "#ffffff",
        "title_xalign": 0.5,
        "title_text_align": 0.5,
        "body_size": 24,
        "body_color": "#d8d8d8",
        "body_xalign": 0.5,
        "body_text_align": 0.5,
        "body_line_spacing": 6,
        "key_size": 22,
        "key_color": "#ffffff",
        "key_text_align": 1.0,
        "desc_size": 22,
        "desc_color": "#bbbbbb",
        "prompt_size": 20,
        "prompt_color": "#ffffffaa",
        "prompt_xalign": 0.5,
        "prompt_yalign": 0.95,
        "option_size": 18,
        "option_color": "#ffffffaa",
        "option_hover_color": "#ffffff",
        "option_xalign": 0.96,
        "option_yalign": 0.95,
        }

    def cfg(name):
        """설정값을 돌려줍니다. 설정 파일에 없으면 기본값."""
        g = globals()
        if name in g:
            return g[name]
        return DEFAULTS[name]

    ## ── 런타임 상태 (세이브·롤백에 들어가지 않는 일반 파이썬 객체) ──

    class _State(python_object):
        def __init__(self):
            self.running = False        # 타이틀 전 페이지를 보여 주는 중
            self.music = False          # 이 플러그인이 음악을 틀었음
            ## 편집기 (1.2): 페이지 id -> { 값 이름: 값 }
            self.edits = { }            # 고치고 아직 저장 안 한 값
            self.saved = None           # 이번 실행 중 저장한 값 (다시 불러오기 전까지 splash.layout 대신)
            ## 페이지 순서 (2.0): None이면 바꾸지 않음
            self.order = None           # 고치고 아직 저장 안 한 순서
            self.saved_order = None     # 이번 실행 중 저장한 순서
            self.order_saved = False    # saved_order를 쓸지 (저장한 순서가 None일 수도 있어서)
            self.drops = { }            # 페이지 id -> 설정 파일 값으로 되돌릴 값 이름 (저장하면 splash_layout.rpy에서 빠짐)

    state = _State()

    def running():
        """타이틀 전 페이지를 보여 주는 중이면 True. (screen_fx가 범위를 정할 때 씀)"""
        return state.running

    ## ── 한 번 본 페이지 · 다음부터 보지 않기 ──

    def _pset(name):
        s = getattr(store.persistent, name, None)
        if s is None:
            s = set()
            setattr(store.persistent, name, s)
        return s

    def seen_pages():
        return _pset("splash_seen")

    def hidden_pages():
        return _pset("splash_hidden")

    def reset():
        """한 번 본 기록과 "다음부터 보지 않기"를 모두 지웁니다."""
        store.persistent.splash_seen = set()
        store.persistent.splash_hidden = set()
        store.renpy.save_persistent()

    class Reset(Action, DictEquality):
        """환경설정 등에 넣는 버튼:  textbutton _("처음 안내 다시 보기") action splash.Reset()"""
        def __call__(self):
            reset()
            store.renpy.restart_interaction()

    ## ── 값 검사 ──

    def _is_movie(v):
        return isinstance(v, str) and v.lower().endswith(MOVIE_EXTS)

    def _is_color(v):
        return isinstance(v, str) and v.startswith("#")

    def _looks_like_file(v):
        return "/" in v or "." in os.path.basename(v)

    def _page_name(index, raw):
        if isinstance(raw, dict) and raw.get("id"):
            return "'{}'".format(raw["id"])
        return "{}번째".format(index + 1)

    def _check_file(where, key, v, out, what="파일"):
        """파일이 있는지, 이름 대소문자가 같은지 확인합니다.
        (윈도우에서는 대소문자가 달라도 열리지만 맥·안드로이드·웹에서는 못 엽니다)"""
        if not store.renpy.loadable(v):
            out.append("{} '{}': 찾을 수 없는 {}입니다: {} (game 폴더 기준 경로)".format(where, key, what, v))
            return

        want = v.replace("\\", "/")
        files = store.renpy.list_files()
        if want in files:
            return

        low = want.lower()
        for f in files:
            if f.lower() == low:
                out.append("{} '{}': 파일 이름 대소문자가 다릅니다. 적은 이름 {} / 실제 파일 {}".format(where, key, v, f))
                return

    def _check_media(where, key, v, out):
        if v is None or not isinstance(v, str):
            return

        if _is_color(v):
            try:
                store.Color(v)
            except Exception:
                out.append("{} '{}': 색 '{}'을(를) 읽을 수 없습니다. 예: \"#000000\"".format(where, key, v))
            return

        if _looks_like_file(v):
            _check_file(where, key, v, out)
            return

        if not store.renpy.has_image(v, exact=True):
            out.append("{} '{}': '{}'라는 이미지가 없습니다.".format(where, key, v))

    def _check_style(where, key, out):
        import renpy.style

        for pre in PREFIXES:
            if key.startswith(pre):
                name = key[len(pre):]
                if pre == "option_" and name in BUTTON_POSITION:
                    return
                if name not in renpy.style.prefixed_all_properties:
                    out.append("{} '{}': '{}'은(는) 글자 스타일 속성이 아닙니다.".format(where, key, name))
                return

        out.append("{}: '{}'은(는) 알 수 없는 설정입니다.".format(where, key))

    def check():
        """설정 파일의 문제를 찾아 목록으로 돌려줍니다. (없으면 빈 목록)"""

        out = [ ]
        ids = set()

        pages = cfg("pages")
        if not isinstance(pages, (list, tuple)):
            return [ "splash.pages는 [ { … }, { … } ] 모양의 목록이어야 합니다." ]

        for key in cfg("default"):
            if key not in RESERVED:
                _check_style("splash.default", key, out)

        order = saved_order()
        if order is not None:
            if not isinstance(order, (list, tuple)):
                out.append("splash.page_order는 [ \"logo\", \"warning\" ] 모양의 목록이어야 합니다. (splash_layout.rpy)")
                order = None
            else:
                known = set(r.get("id") for r in pages if isinstance(r, dict)) | set(saved_layout())
                seen = set()
                for pid in order:
                    if pid in seen:
                        out.append("splash.page_order: '{}'가 두 번 들어 있습니다. (splash_layout.rpy)".format(pid))
                    seen.add(pid)
                    if pid not in known:
                        out.append("splash.page_order: '{}'라는 페이지가 splash.pages에도 splash_layout.rpy에도 없습니다.".format(pid))

        extra = [ ]
        if order is not None:
            cfg_ids = set(r.get("id") for r in pages if isinstance(r, dict))
            extra = [ { "id": pid } for pid in order if pid not in cfg_ids and pid in saved_layout() ]

        for i, raw in enumerate(list(pages) + extra):
            where = "splash.pages {} 페이지".format(_page_name(i, raw))
            if i >= len(pages):
                where = "splash_layout.rpy '{}' 페이지".format(raw["id"])

            if not isinstance(raw, dict):
                out.append("{}: {{ … }} 덩어리여야 합니다.".format(where))
                continue

            pid = raw.get("id")
            if not pid:
                out.append("{}: 'id'가 없습니다. 예: \"id\": \"warning\"".format(where))
            elif pid in ids:
                out.append("{}: 'id'가 다른 페이지와 겹칩니다.".format(where))
            ids.add(pid)

            for key in raw:
                if key not in RESERVED:
                    _check_style(where, key, out)

            for key in ("image_offset", "title_offset", "body_offset", "keys_offset"):
                v = merged(raw, edits=False).get(key)
                if v is not None and not (isinstance(v, (list, tuple)) and len(v) == 2):
                    out.append("{} '{}': (x, y) 모양이어야 합니다.".format(where, key))

            for key in saved_layout().get(pid, { }):
                if key not in RESERVED:
                    _check_style(where + " (splash_layout.rpy)", key, out)

            d = merged(raw, edits=False)

            for key in ("color", "background", "image"):
                _check_media(where, key, d.get(key), out)

            for key, v in d.items():
                if key.endswith("_font") and isinstance(v, str):
                    _check_file(where, key, v, out, "글꼴 파일")

            for key in ("sound", "music"):
                v = d.get(key)
                if isinstance(v, str):
                    _check_file(where, key, v, out)

            dur = d.get("duration")

            if dur == "movie":
                if not (_is_movie(d.get("image")) or _is_movie(d.get("background"))):
                    out.append("{}: \"duration\": \"movie\"는 'background'나 'image'가 영상일 때만 쓸 수 있습니다.".format(where))
            elif dur is not None and not isinstance(dur, (int, float)):
                out.append("{}: 'duration'은 초(숫자), None(클릭할 때까지), \"movie\"(영상이 끝날 때까지) 중 하나입니다.".format(where))

            if dur is None and not d.get("skippable", True):
                out.append("{}: \"skippable\": False면 'duration'을 정해야 합니다. (안 그러면 넘어갈 방법이 없음)".format(where))

            keys = d.get("keys")
            if keys is not None and keys != "auto":
                ok = isinstance(keys, (list, tuple)) and all(
                    isinstance(k, (list, tuple)) and len(k) == 2 for k in keys)
                if not ok:
                    out.append("{} 'keys': [ (\"키\", \"설명\"), … ] 모양이거나 \"auto\"여야 합니다.".format(where))

        return out

    def _raise_problems():
        problems = check()
        if problems:
            raise Exception("[splash] 설정을 확인해 주세요.\n" + "\n".join(problems))

    def _lint():
        for p in check():
            print("splash: " + p)

    ## ── 페이지 해석 ──

    class Page(python_object):
        """설정 한 덩어리(dict)를 화면에 쓰기 좋게 풀어놓은 것."""

    def _cond(c):
        if c is None:
            return True
        if callable(c):
            return bool(c())
        return bool(eval(c, vars(store)))

    def _keys_auto():
        """조작 방법 목록 "auto": hotkeys 플러그인 설정, 없으면 렌파이 기본 설명."""
        hk = getattr(store, "hotkeys", None)
        f = getattr(hk, "help_lines", None)
        if callable(f):
            return list(f())

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
            ]

    def saved_layout():
        """편집기가 저장한 값: 이번 실행 중 저장한 것 → splash_layout.rpy"""
        if state.saved is not None:
            return state.saved
        return cfg("layout") or { }

    def saved_order():
        """편집기가 저장한 페이지 순서: 이번 실행 중 저장한 것 → splash_layout.rpy의 splash.page_order. 없으면 None."""
        if state.order_saved:
            return state.saved_order
        return cfg("page_order")

    def config_ids():
        return [ r["id"] for r in (cfg("pages") or [ ]) if isinstance(r, dict) and r.get("id") ]

    def order_ids(edits=True):
        """보여 줄 페이지 id 순서. (편집 중인 순서 → 저장한 순서 → splash.pages 순서)"""
        if edits and state.order is not None:
            return list(state.order)
        o = saved_order()
        if o is None:
            return config_ids()
        return [ pid for pid in o if isinstance(pid, str) ]

    def page_raws(edits=True):
        """순서대로 페이지 덩어리. splash_layout.rpy에만 있는 새 페이지는 { "id": … }로."""
        by_id = { }
        for r in (cfg("pages") or [ ]):
            if isinstance(r, dict) and r.get("id") and r["id"] not in by_id:
                by_id[r["id"]] = r
        return [ by_id.get(pid) or { "id": pid } for pid in order_ids(edits) ]

    def hidden_config_ids(edits=True):
        """splash.pages에 있지만 순서에서 뺀(편집기에서 지운) 페이지."""
        shown = set(order_ids(edits))
        return [ pid for pid in config_ids() if pid not in shown ]

    def merged(raw, edits=True):
        """페이지 값 전부: 엔진 기본 → splash.default → 페이지 → 편집기가 저장한 값 → 편집 중인 값"""
        d = dict(BASE)
        d.update(cfg("default"))
        d.update(raw)
        pid = raw.get("id") if isinstance(raw, dict) else None
        drops = state.drops.get(pid, ( ))
        for k, v in saved_layout().get(pid, { }).items():
            if k not in drops:
                d[k] = v
        if edits and state.edits:
            d.update(state.edits.get(pid, { }))
        return d

    def resolve(raw):
        d = merged(raw)

        p = Page()
        p.id = d.get("id")
        p.raw = raw
        p.show_if = d.get("show_if")
        p.show = bool(d.get("show", True))
        p.once = bool(d.get("once"))
        p.skippable = bool(d.get("skippable", True))

        p.color = d.get("color") or "#000000"
        p.background = d.get("background")
        p.background_side_mask = d.get("background_side_mask")
        p.background_loop = d.get("background_loop")
        p.image = d.get("image")
        p.image_side_mask = d.get("image_side_mask")
        p.image_size = d.get("image_size")
        p.image_zoom = float(d.get("image_zoom") or 1.0)
        p.image_loop = d.get("image_loop")
        p.image_pos = d.get("image_pos")

        ## 끌어서 옮긴 값, 돌린 값 (2.0)
        p.offsets = { }
        for name in GROUP_ITEMS:
            v = d.get(name + "_offset")
            p.offsets[name] = (float(v[0]), float(v[1])) if isinstance(v, (list, tuple)) and len(v) == 2 else (0.0, 0.0)
        p.rotates = { name : float(d.get(name + "_rotate") or 0.0) for name in ROTATE_ITEMS }

        p.title = d.get("title")
        p.body = d.get("body")
        p.keys = d.get("keys")
        p.prompt = d.get("prompt")
        p.dont_show_again = d.get("dont_show_again")

        p.duration = d.get("duration")
        p.min_time = float(d.get("min_time") or 0.0)
        p.fade_in = float(d.get("fade_in") or 0.0)
        p.fade_out = float(d.get("fade_out") or 0.0)
        p.sound = d.get("sound")
        p.music = d.get("music")

        p.xalign = d.get("xalign")
        p.yalign = d.get("yalign")
        p.spacing = d.get("spacing")
        p.width = d.get("width")
        p.key_width = d.get("key_width")
        p.key_gap = d.get("key_gap")
        p.keys_spacing = d.get("keys_spacing")
        p.keys_xalign = d.get("keys_xalign")

        ## 글자 스타일 (앞말로 나눔)
        props = { pre[:-1]: { } for pre in PREFIXES }

        for k, v in d.items():
            if k in RESERVED:
                continue
            for pre in PREFIXES:
                if k.startswith(pre):
                    props[pre[:-1]][k[len(pre):]] = v
                    break

        p.title_props = props["title"]
        p.body_props = props["body"]
        p.body_props.setdefault("xmaximum", p.width)
        p.title_props.setdefault("xmaximum", p.width)

        p.key_props = props["key"]
        p.key_props.setdefault("min_width", p.key_width)
        p.desc_props = props["desc"]
        p.desc_props.setdefault("xmaximum", max(100, p.width - p.key_width - p.key_gap))

        p.prompt_props = props["prompt"]

        ## "다음부터 보지 않기" 버튼: 위치는 버튼에, 나머지는 버튼 글자에
        p.option_button = { }
        p.option_text = { }
        for k, v in props["option"].items():
            if k in BUTTON_POSITION:
                p.option_button[k] = v
            else:
                p.option_text[k] = v

        ## 체크 상자 색은 글자 색을 따름
        p.option_box = p.option_text.get("color", "#ffffff")
        p.option_box_hover = p.option_text.get("hover_color", p.option_box)

        return p

    def all_pages():
        return [ resolve(raw) for raw in page_raws() ]

    def find_page(page_id):
        for p in all_pages():
            if p.id == page_id:
                return p
        for raw in cfg("pages") or [ ]:
            if isinstance(raw, dict) and raw.get("id") == page_id:
                return resolve(raw)     # 편집기에서 순서에서 뺀 페이지도 ShowPage로는 보여 줌
        raise Exception("[splash] '{}'라는 id의 페이지가 splash.pages에 없습니다.".format(page_id))

    def why_hidden(p):
        """이 페이지가 게임을 켤 때 안 나오는 까닭(글). 나오면 None. (2.1, 편집기가 보여 줌)"""
        if not cfg("enabled"):
            return "splash.enabled = False (스플래시 전체가 꺼짐)"
        if store.config.developer and cfg("developer_skip"):
            return "splash.developer_skip = True (개발 모드에서 전체 건너뜀)"
        if not p.show:
            return "안 보이기로 둠"
        if p.id in hidden_pages():
            return "플레이어가 '다음부터 보지 않기'를 체크함"
        if p.once and p.id in seen_pages():
            return "'처음 한 번만'인데 이미 봄"
        if not _cond(p.show_if):
            return "show_if 조건이 거짓"
        return None

    def should_show(p):
        if not p.show:
            return False
        if p.id in hidden_pages():
            return False
        if p.once and p.id in seen_pages():
            return False
        return _cond(p.show_if)

    def show_again(page_id):
        """이 페이지의 '다음부터 보지 않기'와 한 번 본 기록을 지웁니다. (2.1)"""
        hidden_pages().discard(page_id)
        seen_pages().discard(page_id)
        store.renpy.save_persistent()

    ## ── 화면 요소 만들기 ──

    def _media(v, side_mask, loop, size, cache=None):
        """색 · 이미지 · 영상 경로를 화면에 넣을 수 있는 것으로.
        cache(dict)를 주면 같은 값이면 같은 것을 돌려줌 (편집기: 값을 바꿀 때마다 영상이 처음부터 다시 돌지 않게)"""
        if cache is not None:
            key = (repr(v), bool(side_mask), bool(loop), repr(size))
            if key not in cache:
                cache[key] = _media(v, side_mask, loop, size)
            return cache[key]
        if v is None:
            return None
        if not isinstance(v, str):
            return store.renpy.displayable(v)
        if _is_color(v):
            return Solid(v)
        if _is_movie(v):
            kw = dict(play=v, side_mask=bool(side_mask), loop=bool(loop))
            if size is not None:
                kw["size"] = tuple(size)
            return Movie(**kw)
        return store.renpy.displayable(v)

    ## ── 화면 배치 (2.0) ──
    ## 그림·제목·본문·조작 방법 표를 세로로 쌓는 것은 예전 vbox와 같고, 여기에 더해
    ## 하나씩 비켜 그리기(*_offset), 돌리기(*_rotate)를 합니다. 편집기는 그린 자리(rects)를 읽어
    ## 끌기·손잡이·글 고치기 칸을 같은 자리에 놓습니다.

    class KeysTable(store.renpy.Displayable):
        """조작 방법 표. 줄마다 (키, 설명). 칸 자리(cells)를 기억합니다."""

        def __init__(self, rows, gap, spacing, **properties):
            super(KeysTable, self).__init__(**properties)
            self.rows = rows
            self.gap = gap
            self.spacing = spacing
            self.cells = { }        # ("key"|"desc", 줄 번호) -> (x, y, w, h) 표 안 자리

        def visit(self):
            rv = [ ]
            for k, d in self.rows:
                rv.append(k)
                rv.append(d)
            return rv

        def render(self, width, height, st, at):
            placed = [ ]
            y = 0
            tw = 0
            cells = { }
            for i, (k, d) in enumerate(self.rows):
                rk = store.renpy.render(k, width, height, st, at)
                kw, kh = rk.get_size()
                rd = store.renpy.render(d, max(1, width - kw - self.gap), height, st, at)
                dw, dh = rd.get_size()
                h = max(kh, dh)
                placed.append((rk, 0, y))
                placed.append((rd, kw + self.gap, y))
                cells[("key", i)] = (0, y, kw, kh)
                cells[("desc", i)] = (kw + self.gap, y, dw, dh)
                tw = max(tw, kw + self.gap + dw)
                y += h + (self.spacing if i < len(self.rows) - 1 else 0)
            rv = store.renpy.Render(int(tw), int(y))
            for r, x, yy in placed:
                rv.blit(r, (int(x), int(yy)))
            self.cells = cells
            return rv

    class SplashLayout(store.renpy.Displayable):
        """페이지의 그림·제목·본문·표 묶음 (+ 편집 중이면 안내 글과 보지 않기 버튼).
        edit: 편집기가 주는 값. None이면 게임에서 보여 주는 진짜 페이지.
          edit["hide"]      그리지 않을 것 이름 (글을 고치는 중)
          edit["straight"]  돌리지 않고 그릴 것 이름
        rects: 이름 -> (가운데 x, 가운데 y, 폭, 높이, 회전) 화면 픽셀. 표 칸은 cells에."""

        def __init__(self, run, edit=None, **properties):
            super(SplashLayout, self).__init__(**properties)
            self.run = run
            self.edit = edit
            self.rects = { }
            self.cells = { }
            self._rot = { }
            self._extra = None

        def _items(self):
            run = self.run
            p = run.page
            rv = [ ]
            if run.image is not None and p.image_pos is None:
                rv.append(("image", run.image_drawn, 0.5))
            if run.title is not None:
                rv.append(("title", run.title, p.title_props.get("xalign", 0.5)))
            if run.body is not None:
                rv.append(("body", run.body, p.body_props.get("xalign", 0.5)))
            if run.keys_table is not None:
                rv.append(("keys", run.keys_table, p.keys_xalign))
            return rv

        def _edit_extra(self):
            """편집 중에만 그리는 안내 글과 보지 않기 버튼 (게임에서는 스크린이 그림)."""
            if self._extra is None:
                p = self.run.page
                ex = [ ]
                if self.run.prompt is not None:
                    ex.append(("prompt", self.run.prompt))
                if p.dont_show_again:
                    box = store.Fixed(
                        Solid(p.option_box),
                        Transform(Solid("#000000cc"), xysize=(14, 14), align=(0.5, 0.5)),
                        xysize=(18, 18), yalign=0.5)
                    t = Text(p.dont_show_again, style="splash_option", **p.option_text)
                    ex.append(("option", store.HBox(box, t, spacing=10)))
                self._extra = ex
            return self._extra

        def visit(self):
            rv = [ d for _n, d, _a in self._items() ]
            if self.run.image is not None and self.run.page.image_pos is not None:
                rv.append(self.run.image_drawn)
            if self.edit is not None:
                rv.extend(d for _n, d in self._edit_extra())
            return rv

        def _rotated(self, name, d, rot):
            c = self._rot.get(name)
            if c is None or c[0] != rot or c[1] is not d:
                c = (rot, d, Transform(d, rotate=rot, rotate_pad=False, subpixel=True))
                self._rot[name] = c
            return c[2]

        def _place(self, rv, name, d, r, cx, cy, rot, st, at, width, height):
            w, h = r.get_size()
            ed = self.edit or { }
            self.rects[name] = (cx, cy, w, h, rot)
            if name in ed.get("hide", ( )):
                return
            if rot and name not in ed.get("straight", ( )):
                rr = store.renpy.render(self._rotated(name, d, rot), width, height, st, at)
                rw, rh = rr.get_size()
                rv.blit(rr, (int(round(cx - rw / 2.0)), int(round(cy - rh / 2.0))))
            else:
                rv.blit(r, (int(round(cx - w / 2.0)), int(round(cy - h / 2.0))))

        def render(self, width, height, st, at):
            run = self.run
            p = run.page
            rv = store.renpy.Render(width, height)
            self.rects = { }

            items = self._items()
            rs = [ store.renpy.render(d, p.width, height, st, at) for _n, d, _a in items ]
            sizes = [ r.get_size() for r in rs ]

            vw = max([ w for w, _h in sizes ] or [ 0 ])
            vh = sum(h for _w, h in sizes) + p.spacing * max(0, len(items) - 1)
            gx = p.xalign * (width - vw)
            gy = p.yalign * (height - vh)

            y = gy
            for (name, d, xa), r, (w, h) in zip(items, rs, sizes):
                ox, oy = p.offsets.get(name, (0.0, 0.0))
                cx = gx + xa * (vw - w) + w / 2.0 + ox
                cy = y + h / 2.0 + oy
                self._place(rv, name, d, r, cx, cy, p.rotates.get(name, 0.0), st, at, width, height)
                y += h + p.spacing

            self.rects["group"] = (gx + vw / 2.0, gy + vh / 2.0, vw, vh, 0.0)

            ## 표 칸 자리 (돌리지 않았을 때만 화면 자리로 셈)
            self.cells = { }
            t = run.keys_table
            if t is not None and "keys" in self.rects:
                kcx, kcy, kw, kh, krot = self.rects["keys"]
                if not krot or "keys" in (self.edit or { }).get("straight", ( )):
                    for k, (x, yy, w, h) in t.cells.items():
                        self.cells[k] = (kcx - kw / 2.0 + x, kcy - kh / 2.0 + yy, w, h)

            ## 자리를 정해 둔 그림 (image_pos)
            if run.image is not None and p.image_pos is not None:
                r = store.renpy.render(run.image_drawn, width, height, st, at)
                ix, iy = p.image_pos
                self._place(rv, "image", run.image_drawn, r, float(ix), float(iy), p.rotates.get("image", 0.0), st, at, width, height)

            ## 편집 중: 안내 글과 보지 않기 버튼도 같은 자리에
            if self.edit is not None:
                for name, d in self._edit_extra():
                    r = store.renpy.render(d, width, height, st, at)
                    w, h = r.get_size()
                    if name == "prompt":
                        xa = p.prompt_props.get("xalign", 0.5)
                        ya = p.prompt_props.get("yalign", 0.95)
                        rot = p.rotates.get("prompt", 0.0)
                    else:
                        xa = p.option_button.get("xalign", 0.96)
                        ya = p.option_button.get("yalign", 0.95)
                        rot = 0.0
                    cx = xa * (width - w) + w / 2.0
                    cy = ya * (height - h) + h / 2.0
                    self._place(rv, name, d, r, cx, cy, rot, st, at, width, height)

            return rv

    class PageRun(python_object):
        """페이지를 한 번 보여 주는 동안의 상태. 스크린 splash_page가 씁니다."""

        def __init__(self, page, skip_min=False, media_cache=None):
            self.page = page
            self.leaving = False
            self.ready = False
            self.min_time = 0.0 if skip_min else page.min_time

            watch_movie = (page.duration == "movie")

            screen = (store.config.screen_width, store.config.screen_height)

            ## 배경 (영상은 화면 크기에 맞춤)
            self.bg = _media(
                page.background,
                page.background_side_mask,
                False if (watch_movie and not _is_movie(page.image)) else page.background_loop,
                screen,
                media_cache,
                )

            ## 가운데 그림·영상
            img = _media(
                page.image,
                page.image_side_mask,
                False if watch_movie and _is_movie(page.image) else page.image_loop,
                page.image_size,
                media_cache,
                )
            if img is not None and page.image_zoom != 1.0:
                img = Transform(img, zoom=page.image_zoom)
            self.image = img
            fx = scene_fx()
            self.image_drawn = fx(img) if (img is not None and fx is not None) else img

            ## 끝날 때까지 지켜볼 영상
            self.watch = None
            if watch_movie:
                if _is_movie(page.image):
                    self.watch = img.child if isinstance(img, Transform) else img
                elif _is_movie(page.background):
                    self.watch = self.bg
            self.movie_seen = False
            self.t0 = None
            self.left_at = None

            ## 글자
            self.title = Text(page.title, style="splash_title", **page.title_props) if page.title else None
            self.body = Text(page.body, style="splash_body", **page.body_props) if page.body else None
            self.prompt = Text(page.prompt, style="splash_prompt", **page.prompt_props) if page.prompt else None

            keys = page.keys
            if keys == "auto":
                keys = _keys_auto()
            self.keys = [
                (Text(k, style="splash_key", **page.key_props), Text(v, style="splash_desc", **page.desc_props))
                for k, v in (keys or [ ])
                ]
            self.keys_table = KeysTable(self.keys, page.key_gap, page.keys_spacing) if self.keys else None
            self.layout = SplashLayout(self)

        ## 스크린에서 부르는 동작
        ## (screen의 timer는 화면이 갱신될 때 처음부터 다시 셀 수 있어서,
        ##  시간은 모두 페이지가 나타난 시각에서 직접 잽니다)

        def click(self):
            if self.ready and self.page.skippable:
                self.leave()

        def leave(self):
            if not self.leaving:
                self.leaving = True
                self.left_at = time.time()
                store.renpy.restart_interaction()

        def tick(self):
            """0.05초마다 불림. 다음 페이지로 갈 때가 되면 True를 돌려줍니다."""
            now = time.time()
            p = self.page

            if self.t0 is None:
                self.t0 = now

            shown = now - self.t0 - p.fade_in      # 다 나타난 뒤 지난 시간

            if self.leaving:
                if now - self.left_at >= p.fade_out:
                    return True
                return None

            if not self.ready and shown >= self.min_time:
                self.ready = True
                store.renpy.restart_interaction()

            if isinstance(p.duration, (int, float)) and shown >= p.duration:
                self.leave()

            elif self.watch is not None:
                self._check_movie(now)

            return None

        def _check_movie(self, now):
            """영상이 끝났는지 확인합니다."""
            m = self.watch
            playing = None
            ch = getattr(m, "channel", None)

            ## 화면에 나오기 전에는 채널 이름이 아직 정해지지 않음
            if ch and not (getattr(m, "dynamic_channel", False) and ch == "movie"):
                playing = store.renpy.music.get_playing(channel=ch)

            if playing:
                self.movie_seen = True
            elif self.movie_seen:
                self.leave()
            elif now - self.t0 > cfg("movie_wait"):
                ## 영상이 시작되지 않음 (코덱 문제 등) → 멈춰 있지 않고 넘어감
                self.leave()

    ## ── 순서대로 보여 주기 ──

    def _same_file(a, b):
        if not a or not b:
            return False
        a = a.replace("\\", "/").lower()
        b = b.replace("\\", "/").lower()
        return a == b or a.split("/")[-1] == b.split("/")[-1]

    def _end_music():
        """스플래시가 튼 음악을 타이틀 음악으로 넘기거나 서서히 끕니다."""
        if not state.music:
            return
        state.music = False

        cur = store.renpy.music.get_playing("music")
        if not cur:
            return

        mmm = store.config.main_menu_music
        if mmm and _same_file(cur, mmm):
            return      # 타이틀 음악과 같으면 끊기지 않고 이어짐

        t = cfg("music_fadeout")
        store.renpy.music.stop("music", fadeout=t)
        if t > 0:
            store.renpy.pause(t, hard=True)

    def show(p, skip_min=False, play_audio=True):
        """페이지 하나를 보여 주고, 끝나면 돌아옵니다."""

        if play_audio:
            if p.sound:
                store.renpy.sound.play(p.sound)
            if p.music:
                store.renpy.music.play(p.music, loop=True, if_changed=True, fadein=p.fade_in)
                state.music = True

        store.renpy.call_screen("splash_page", run=PageRun(p, skip_min))

    def run(preview=False):
        """splash.pages를 순서대로 보여 줍니다. (splashscreen에서 자동으로 불림)
        preview=True면 꺼져 있거나 이미 본 페이지도 모두 보여 주고, 본 기록을 남기지 않습니다."""

        if not preview:
            if not cfg("enabled"):
                return
            if store.config.developer and cfg("developer_skip"):
                return

        _raise_problems()

        pages = [ p for p in all_pages() if preview or should_show(p) ]
        if not pages:
            return

        state.running = True

        try:
            if cfg("start_delay") > 0:
                store.renpy.pause(cfg("start_delay"))

            for n, p in enumerate(pages):

                if n and cfg("gap") > 0:
                    store.renpy.pause(cfg("gap"))

                seen = p.id in seen_pages()
                show(p, skip_min=(seen and cfg("min_time_once") and not preview))

                if not preview:
                    seen_pages().add(p.id)

            _end_music()

        finally:
            state.running = False
            state.music = False
            store.renpy.save_persistent()

    def preview():
        """개발 중에 처음부터 다시 보기. 콘솔(Shift+O)에서 splash.preview()"""
        store.renpy.call_in_new_context("splash_preview")

    ## ── 타이틀 메뉴 등에서 페이지 하나만 다시 보기 ──

    class ShowPage(Action, DictEquality):
        """
        textbutton _("조작 방법") action splash.ShowPage("controls")
        타이틀 메뉴 항목이면  "action": splash.ShowPage("controls")
        페이지의 소리는 나오지만 음악은 바꾸지 않고, 본 기록도 남기지 않습니다.
        """

        def __init__(self, page_id):
            self.page_id = page_id

        def __call__(self):
            store.renpy.call_in_new_context("splash_show_page", self.page_id)
            store.renpy.restart_interaction()


init 990 python in splash:
    ## 설정 파일을 다 읽은 뒤 실행됩니다.

    ## 스크립트에 splashscreen 레이블이 없을 때만 이 플러그인으로 이어 줌
    if cfg("enabled") and not store.renpy.has_label("splashscreen"):
        store.config.label_overrides["splashscreen"] = "splash_play"

    ## 마지막 페이지에서 타이틀로 넘어갈 때의 전환 (options.rpy 등에서 이미 정했으면 그쪽 우선)
    if cfg("enabled") and cfg("end_transition") is not None and store.config.end_splash_transition is None:
        store.config.end_splash_transition = cfg("end_transition")

    store.config.lint_hooks.append(_lint)

    ## 배포판을 만들 때 이 플러그인 폴더의 설명서(.md)는 빼고 묶습니다.
    _ROOT = os.path.dirname(os.path.dirname(store.renpy.get_filename_line()[0].replace("\\", "/")))
    store.build.classify(_ROOT + "/**.md", None)


## 한 번 본 페이지, 플레이어가 "다음부터 보지 않기"를 고른 페이지
default persistent.splash_seen = set()
default persistent.splash_hidden = set()


## ── 레이블 ───────────────────────────────────────────────────────────────────

## 게임을 켰을 때 (splashscreen으로 이어짐). 직접 부를 때는 call splash_play
label splash_play:
    $ splash.run()
    return

## 개발 중 다시 보기 (splash.preview()가 새 컨텍스트에서 부름)
label splash_preview:
    $ splash.run(preview=True)
    return

## 페이지 하나만 (splash.ShowPage가 새 컨텍스트에서 부름)
label splash_show_page(page_id):
    $ splash.show(splash.find_page(page_id), skip_min=True, play_audio=False)
    return


## ── 스타일 · 애니메이션 ──────────────────────────────────────────────────────

style splash_title is default
style splash_body is default
style splash_key is default
style splash_desc is default
style splash_prompt is default
style splash_option is default
style splash_option_button is default

## 페이지가 나타나고 사라질 때
transform splash_fade(t_in, t_out):
    on appear, show:
        alpha 0.0
        linear t_in alpha 1.0
    on hide:
        linear t_out alpha 0.0

## 체크 상자 테두리: 마우스를 올리면 밝게
transform splash_option_box:
    alpha 0.7
    on hover:
        linear 0.1 alpha 1.0
    on idle:
        linear 0.1 alpha 0.7

## 돌린 안내 글 (2.0)
transform splash_rotate(r):
    rotate r
    rotate_pad False

## "클릭하면 계속" 안내: 서서히 나타난 뒤 깜빡임
transform splash_prompt_blink:
    alpha 0.0
    linear 0.4 alpha 1.0
    block:
        linear 1.0 alpha 0.35
        linear 1.0 alpha 1.0
        repeat


## ── 스크린 ───────────────────────────────────────────────────────────────────

screen splash_page(run):

    modal True

    $ _p = run.page

    ## 클릭 · 엔터 · 스페이스 · 게임패드 A
    key "dismiss" action Function(run.click, _update_screens=False)

    ## 시간 재기: 넘길 수 있게 되는 때, 정한 시간, 영상 끝, 사라지는 연출 끝
    timer 0.05 repeat True action Function(run.tick, _update_screens=False)

    showif not run.leaving:

        fixed at splash_fade(_p.fade_in, _p.fade_out):

            add Solid(_p.color)

            if run.bg is not None:
                add run.bg align (0.5, 0.5) at splash.scene_fx()

            ## 그림·제목·본문·표 묶음 (2.0: 하나씩 비키고 돌릴 수 있게 직접 배치)
            add run.layout

            if run.prompt is not None and run.ready and _p.skippable:
                if _p.rotates.get("prompt"):
                    add run.prompt at splash_prompt_blink, splash_rotate(_p.rotates["prompt"])
                else:
                    add run.prompt at splash_prompt_blink

            if _p.dont_show_again:
                $ _on = _p.id in persistent.splash_hidden

                button:
                    style "splash_option_button"
                    properties _p.option_button
                    action ToggleSetMembership(persistent.splash_hidden, _p.id)

                    has hbox
                    spacing 10

                    ## 체크 상자 (렌파이 기본 GUI 그림 없이 그림)
                    fixed:
                        xysize (18, 18)
                        yalign 0.5
                        add Solid(_p.option_box) at splash_option_box
                        add Solid("#000000cc") xysize (14, 14) align (0.5, 0.5)
                        if _on:
                            add Solid(_p.option_box) xysize (8, 8) align (0.5, 0.5)

                    text _p.dont_show_again style "splash_option" properties _p.option_text
