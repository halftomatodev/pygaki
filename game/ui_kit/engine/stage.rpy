################################################################################
## UI Kit — 이미지·영상 배치 엔진 (stage)
##
## 이 파일은 고칠 필요가 없습니다. 설정은 stage_config.rpy에서 하세요.
##
##   - movies/ 폴더의 영상 자동 등록 (mask_ 로 시작하면 투명 영상)
##   - bg 태그는 항상 맨 뒤
##   - 원고에 적는 도우미:  at stage.pos(x, y)
##                          with stage.move("inleft", 0.8) / stage.ease(…) / stage.zoom("in", 0.8)
##   - 편집기 "이미지/영상" 탭이 고친 값을 미리 보여주기 (편집기가 열려 있을 때만)
################################################################################

init offset = 1

init -10 python in stage:

    import os
    import re

    import store
    from store import python_object

    DEFAULTS = dict(
        enabled=True,
        movies_dir="movies",
        movie_extensions=(".webm",),
        mask_prefix="mask_",
        movie_loop=True,
        movie_once=[ ],
        bg_tag="bg",
        bg_zorder=-1000,
        anchor=(0.5, 1.0),
        positions=[
            ("left", "왼쪽"),
            ("center", "가운데"),
            ("right", "오른쪽"),
            ("truecenter", "정중앙"),
            ("offscreenleft", "화면 밖 왼쪽"),
            ("offscreenright", "화면 밖 오른쪽"),
            ],
        )

    ## 편집기가 stage_layout.rpy에 저장하는 그림 자리 (3.2)
    ##   { "ghost": "stage.pos(900, 720)", ("n4", "ghost"): "stage.pos(420, 720)" }
    ## 정하는 순서: 원고의 at → (상자, 태그) → (태그) → 렌파이 기본
    placed = { }

    def placed_expr(box, tag):
        e = placed.get((box, tag))
        return placed.get(tag) if e is None else e

    def _label_reached(name, abnormal=False):
        """지금 상자: PyKaki의 label 끝부분 (ward.n3 → n3)"""
        store.stage.cur_box = name.rpartition(".")[2]

    def cfg(name):
        g = globals()
        if name in g:
            return g[name]
        return DEFAULTS[name]

    def on():
        return bool(cfg("enabled"))

    def bg_tags():
        """배경으로 볼 태그들. stage.bg_tag에 글자 하나("bg")나 목록(["bg", "fx_bg"])을 적습니다."""
        v = cfg("bg_tag")
        if not v:
            return ()
        if isinstance(v, str):
            return (v, )
        return tuple(v)

    def is_bg(tag):
        """이 태그가 배경(bg)인지. 배경은 맨 뒤에 그리고, 편집기에서 위치를 옮기지 않습니다."""
        return bool(tag) and tag in bg_tags()

    ## ── 원고에 적는 도우미 ────────────────────────────────────────────────────

    def pos(x, y, anchor=None):
        """at stage.pos(x, y): 그림의 기준점(기본: 아래 가운데)을 화면의 (x, y)에 놓습니다.
        정수는 픽셀, 소수는 화면 비율 (0.5 = 가운데)."""
        a = anchor if anchor is not None else cfg("anchor")
        return store.Transform(xpos=x, ypos=y, xanchor=a[0], yanchor=a[1])

    _SIDES = ("left", "right", "top", "bottom")

    def _move(direction, t, ease):
        """렌파이의 move…/ease… 전환과 같은 것을 시간만 바꿔서 만듭니다.
        direction: "" (제자리에서 이동), "inleft" … "inbottom", "outleft" … "outbottom"."""
        direction = direction or ""
        kw = dict(layers=[ "master" ])

        if ease:
            kw["time_warp"] = store._ease_time_warp
            in_warp = store._ease_in_time_warp
            out_warp = store._ease_out_time_warp
        else:
            in_warp = None
            out_warp = None

        if direction.startswith("in") and direction[2:] in _SIDES:
            kw["enter"] = getattr(store, "_move" + direction[2:])
            kw["enter_time_warp"] = in_warp
        elif direction.startswith("out") and direction[3:] in _SIDES:
            kw["leave"] = getattr(store, "_move" + direction[3:])
            kw["leave_time_warp"] = out_warp
        elif direction:
            raise Exception("stage.move: 모르는 방향 {!r}".format(direction))

        return store.MoveTransition(float(t), **kw)

    def move(direction="", t=0.5):
        """with stage.move("inleft", 0.8) = moveinleft를 0.8초로."""
        return _move(direction, t, False)

    def ease(direction="", t=0.5):
        """with stage.ease("outright", 1.0) = easeoutright를 1초로."""
        return _move(direction, t, True)

    def zoom(direction="in", t=0.5):
        """with stage.zoom("in", 0.8) = zoomin을 0.8초로. "out" = zoomout."""
        if direction == "out":
            return store.OldMoveTransition(float(t), leave_factory=store.ZoomInOut(1.0, 0.01))
        return store.OldMoveTransition(float(t), enter_factory=store.ZoomInOut(0.01, 1.0))

    ## ── 영상 자동 등록 ───────────────────────────────────────────────────────

    class _Runtime(python_object):
        """세이브·되감기에 들어가지 않는 실행 중 정보."""
        def __init__(self):
            self.movies = { }       # 이미지 이름 → (파일, 투명?)
            self.skipped = [ ]      # (파일, 이유)

            ## 편집기가 고친 값 (아직 원고에 안 쓴 것). (파일, 줄) → { "at": [식…], "with": 식 }
            ##   "at" 없음 = 그대로, [] = at 지우기 / "with" 없음 = 그대로, "" = 전환 지우기
            self.edits = { }

            self.shown = { }        # (층, 태그) → ((파일, 줄), 이름 튜플)  그 그림을 마지막으로 보여준 줄
            self.window = [ ]       # 지난 상호작용 뒤에 실행된 이미지 줄 [(파일, 줄)]  (R 다시 보기 범위)
            self.boundary = False
            self.injecting = False  # 미리 보기 전환을 넣는 중 (상호작용 경계로 치지 않음)
            self.injected = False   # 편집 중인 값으로 그린 장면이 보이고 있음
            self.errors = { }       # (파일, 줄) → 미리 보기 실패 이유

    rt = _Runtime()

    def movie_name(path):
        """movies/sub/mask_Ghost Idle.webm → ("ghost idle", True)"""
        base = os.path.splitext(os.path.basename(path))[0].lower()
        base = base.partition("@")[0]
        prefix = (cfg("mask_prefix") or "").lower()
        mask = bool(prefix) and base.startswith(prefix)
        if mask:
            base = base[len(prefix):]
        return base.strip(), mask

    def register_movies():
        rt.movies = { }
        rt.skipped = [ ]
        if not on():
            return

        folder = (cfg("movies_dir") or "movies").strip("/") + "/"
        exts = tuple(e.lower() for e in cfg("movie_extensions"))
        once = set(n.lower() for n in cfg("movie_once"))

        files = sorted(fn for fn in store.renpy.list_files()
                       if fn.startswith(folder) and fn.lower().endswith(exts))

        for fn in files:
            name, mask = movie_name(fn)
            if not name:
                rt.skipped.append((fn, "이름이 비어 있음"))
                continue
            if name in rt.movies:
                rt.skipped.append((fn, "같은 이름의 영상이 이미 있음: " + rt.movies[name][0]))
                continue
            if store.renpy.has_image(name, exact=True):
                rt.skipped.append((fn, "같은 이름의 그림이 이미 있음"))
                continue
            store.renpy.image(name, store.Movie(play=fn, side_mask=mask, loop=(name not in once)))
            rt.movies[name] = (fn, mask)

    def movie_for(name):
        """이미지 이름(튜플·글자) → (파일, 투명?) 또는 None"""
        if isinstance(name, (tuple, list)):
            name = " ".join(name)
        return rt.movies.get(name)

    ## ── 지금 실행 중인 문장 ───────────────────────────────────────────────────

    def current():
        try:
            import renpy
            ctx = renpy.game.context()
            if ctx.current is None:
                return None
            return renpy.game.script.lookup(ctx.current)
        except Exception:
            return None

    def key_of(node):
        return (node.filename, node.linenumber)

    def imspec_parts(node):
        """Show/Scene/Hide 문장 → (이름 튜플, 식인지, 태그, at 목록, 층)"""
        im = node.imspec
        if im is None:
            return None
        if len(im) >= 6:
            return (tuple(im[0]), im[1] is not None, im[2], list(im[3]), im[4])
        return (tuple(im[0]), False, None, list(im[1]), im[2])

    def has_with(node):
        """그 줄에 with 절이 있는지 (렌파이는 with 절을 같은 줄의 With 문장 두 개로 바꿉니다)."""
        import renpy
        nxt = getattr(node, "next", None)
        return isinstance(nxt, renpy.ast.With) and key_of(nxt) == key_of(node)

    def editing():
        ed = getattr(store, "ui_editor", None)
        return bool(ed is not None and ed.state.open and on())

    def _eval(expr):
        return eval(expr, vars(store))

    def game_file(fn):
        """게임 원고 파일인지 (렌파이 안쪽 파일 renpy/common/… 은 아님)."""
        return bool(fn) and not str(fn).replace("\\", "/").startswith("renpy/")

    def _note_window(key):
        ## 렌파이가 안쪽에서 부르는 scene(다시 불러올 때의 그래픽 확인 등)은 목록에 넣지 않음
        if not game_file(key[0]):
            return
        if rt.boundary:
            rt.window = [ ]
            rt.boundary = False
        if key not in rt.window:
            rt.window.append(key)

    def _pending(key):
        if not editing():
            return None
        return rt.edits.get(key)

    def _transition(e):
        expr = e.get("with")
        if not expr:
            return None
        return _eval(expr)

    def _inject_with(trans):
        rt.injecting = True
        try:
            store.renpy.with_statement(trans)
        finally:
            rt.injecting = False

    ## ── 렌파이에 거는 고리 ───────────────────────────────────────────────────

    _old = { }

    def _show(name, at_list=[ ], layer=None, what=None, zorder=None, tag=None, behind=[ ], atl=None, **kwargs):
        import renpy

        if not on():
            return _old["show"](name, at_list=at_list, layer=layer, what=what, zorder=zorder, tag=tag, behind=behind, atl=atl, **kwargs)

        t = tag or (name[0] if isinstance(name, (tuple, list)) else str(name).split()[0])

        ## bg는 항상 맨 뒤
        bg = bg_tags()
        if is_bg(t):
            zorder = cfg("bg_zorder")
        elif bg and zorder is not None:
            try:
                if zorder <= cfg("bg_zorder"):
                    zorder = cfg("bg_zorder") + 1
            except Exception:
                pass

        node = current()
        stmt = isinstance(node, (renpy.ast.Show, renpy.ast.Scene)) and getattr(node, "imspec", None)
        if stmt:
            parts = imspec_parts(node)
            stmt = parts is not None and not parts[1] and parts[0] == tuple(name if isinstance(name, (tuple, list)) else str(name).split())

        add_with = None
        forced = False
        if stmt:
            key = key_of(node)
            _note_window(key)
            e = _pending(key)
            if e:
                if "at" in e:
                    forced = True
                    try:
                        at_list = [ _eval(i) for i in e["at"] ]
                        rt.errors.pop(key, None)
                    except Exception as ex:
                        rt.errors[key] = "위치 미리 보기 실패: {}".format(ex)
                rt.injected = True
                if e.get("with") and not has_with(node):
                    add_with = e
                    if isinstance(node, renpy.ast.Show):
                        _inject_with(None)

        ## 원고에 at이 없으면 편집기가 저장한 자리로
        if placed and not at_list and not atl and not forced and not is_bg(t):
            expr = placed_expr(getattr(store.stage, "cur_box", None), t)
            if expr:
                try:
                    at_list = [ _eval(expr) ]
                except Exception:
                    pass

        rv = _old["show"](name, at_list=at_list, layer=layer, what=what, zorder=zorder, tag=tag, behind=behind, atl=atl, **kwargs)

        if stmt:
            lay = store.renpy.default_layer(layer, t)
            rt.shown[(lay, t)] = (key_of(node), tuple(name if isinstance(name, (tuple, list)) else str(name).split()))

        if add_with is not None:
            try:
                _inject_with(_transition(add_with))
            except Exception as ex:
                rt.errors[key_of(node)] = "전환 미리 보기 실패: {}".format(ex)

        return rv

    def _scene(layer="master", *args, **kwargs):
        import renpy
        node = current()
        if on() and isinstance(node, renpy.ast.Scene) and node.imspec:
            e = _pending(key_of(node))
            if e and e.get("with") and not has_with(node):
                _inject_with(None)
        if on():
            for k in list(rt.shown):
                if k[0] == layer:
                    rt.shown.pop(k, None)
        return _old["scene"](layer, *args, **kwargs)

    def _hide(name, layer=None, *args, **kwargs):
        import renpy

        if not on():
            return _old["hide"](name, layer, *args, **kwargs)

        node = current()
        add_with = None
        if isinstance(node, renpy.ast.Hide):
            key = key_of(node)
            _note_window(key)
            e = _pending(key)
            if e and e.get("with") and not has_with(node):
                add_with = e
                rt.injected = True
                _inject_with(None)

        rv = _old["hide"](name, layer, *args, **kwargs)

        t = name[0] if isinstance(name, (tuple, list)) else str(name).split()[0]
        rt.shown.pop((store.renpy.default_layer(layer, t), t), None)

        if add_with is not None:
            try:
                _inject_with(_transition(add_with))
            except Exception as ex:
                rt.errors[key_of(node)] = "전환 미리 보기 실패: {}".format(ex)

        return rv

    def _with_callback(trans, paired=None):
        import renpy
        if on() and paired is None and editing():
            node = current()
            if isinstance(node, renpy.ast.With):
                e = rt.edits.get(key_of(node))
                if e is not None and "with" in e:
                    try:
                        trans = _transition(e)
                        rt.injected = True
                    except Exception as ex:
                        rt.errors[key_of(node)] = "전환 미리 보기 실패: {}".format(ex)
        old = _old.get("with_callback")
        if old is not None:
            return old(trans, paired)
        return trans

    def _start_interact():
        """대사·선택지·pause 등으로 멈출 때마다: 다음 이미지 줄부터 새 '다시 보기 범위'."""
        import renpy
        if rt.injecting:
            return
        if isinstance(current(), renpy.ast.With):
            return
        rt.boundary = True

    def install():
        c = store.config
        if c.show is not _show:
            _old["show"] = c.show
            c.show = _show
        if c.hide is not _hide:
            _old["hide"] = c.hide
            c.hide = _hide
        if c.scene is not _scene:
            _old["scene"] = c.scene
            c.scene = _scene
        if c.with_callback is not _with_callback:
            _old["with_callback"] = c.with_callback
            c.with_callback = _with_callback
        if _start_interact not in c.start_interact_callbacks:
            c.start_interact_callbacks.append(_start_interact)
        if _label_reached not in c.label_callbacks:
            c.label_callbacks.append(_label_reached)

        if on():
            for bg in bg_tags():
                c.tag_zorder[bg] = cfg("bg_zorder")

    ## ── 편집기에서 쓰는 도구 ──────────────────────────────────────────────────
    ## 전환 효과: 원고의 with 식 ↔ (종류, 방향, 시간)

    ## (종류, 버튼 글자, 기본 시간, 방향 목록)
    ##   방향은 (값, 글자). show/scene과 hide에서 뜻이 다른 것은 아래 _short()에서 처리.
    DIR4 = (("left", "←"), ("right", "→"), ("up", "↑"), ("down", "↓"))
    DIRMOVE = (("", "제자리"), ("left", "←"), ("right", "→"), ("top", "↑"), ("bottom", "↓"))

    TRANSITIONS = (
        ("none", "없음", None, None),
        ("dissolve", "서서히", 0.5, None),
        ("fade", "검게 페이드", 1.0, None),
        ("pixellate", "픽셀", 1.0, None),
        ("move", "이동", 0.5, DIRMOVE),
        ("ease", "부드럽게 이동", 0.5, DIRMOVE),
        ("wipe", "닦아내기", 1.0, DIR4),
        ("slide", "미끄러지기", 1.0, DIR4),
        ("push", "밀어내기", 1.0, DIR4),
        ("zoom", "확대/축소", 0.5, None),
        ("punch", "흔들기", None, (("v", "세로"), ("h", "가로"))),
        )

    def trans_info(kind):
        for t in TRANSITIONS:
            if t[0] == kind:
                return t
        return None

    def _num(t):
        t = round(float(t), 2)
        if t == int(t):
            return "{:.1f}".format(t)
        return "{:g}".format(t)

    def format_with(spec, stmt="show"):
        """(종류, 방향, 시간) → 원고에 적을 with 식. "" = 전환 없음."""
        kind = spec.get("kind")
        if kind == "custom":
            return spec.get("raw", "")
        info = trans_info(kind)
        if info is None or kind == "none":
            return ""

        d = spec.get("dir") or ""
        t = spec.get("time")
        default = info[2]
        same = t is None or default is None or abs(float(t) - default) < 1e-6
        hide = (stmt == "hide")

        if kind == "dissolve":
            return "dissolve" if same else "Dissolve({})".format(_num(t))
        if kind == "fade":
            return "fade" if same else "Fade({0}, 0.0, {0})".format(_num(float(t) / 2.0))
        if kind == "pixellate":
            return "pixellate" if same else "Pixellate({}, 5)".format(_num(t))
        if kind in ("move", "ease"):
            if d:
                d = ("out" if hide else "in") + d
            if same:
                return kind + d
            return 'stage.{}("{}", {})'.format(kind, d, _num(t))
        if kind in ("wipe", "slide", "push"):
            d = d or "left"
            if kind == "slide" and hide:
                name = "slideaway" + d
            else:
                name = kind + d
            if same:
                return name
            cls = "PushMove" if kind == "push" else "CropMove"
            return '{}({}, "{}")'.format(cls, _num(t), name)
        if kind == "zoom":
            io = "out" if hide else "in"
            return ("zoom" + io) if same else 'stage.zoom("{}", {})'.format(io, _num(t))
        if kind == "punch":
            return (d if d in ("v", "h") else "v") + "punch"
        return ""

    _NUM = r"\s*([0-9]*\.?[0-9]+)\s*"
    _STR = r"\s*[\"']([a-z]*)[\"']\s*"

    def parse_with(expr):
        """원고의 with 식 → {"kind", "dir", "time"}. 모르는 식이면 kind="custom"."""
        if expr is None or not expr.strip() or expr.strip() == "None":
            return dict(kind="none", dir="", time=None)
        e = expr.strip()

        def spec(kind, d="", t=None):
            info = trans_info(kind)
            return dict(kind=kind, dir=d, time=(t if t is not None else info[2]))

        if e == "dissolve":
            return spec("dissolve")
        if e == "fade":
            return spec("fade")
        if e == "pixellate":
            return spec("pixellate")
        m = re.match(r"^Dissolve\(" + _NUM + r"\)$", e)
        if m:
            return spec("dissolve", t=float(m.group(1)))
        m = re.match(r"^Fade\(" + _NUM + r"," + _NUM + r"," + _NUM + r"\)$", e)
        if m and float(m.group(2)) == 0.0 and m.group(1) == m.group(3):
            return spec("fade", t=float(m.group(1)) * 2.0)
        m = re.match(r"^Pixellate\(" + _NUM + r",\s*5\s*\)$", e)
        if m:
            return spec("pixellate", t=float(m.group(1)))

        m = re.match(r"^(move|ease)(in|out)?(left|right|top|bottom)?$", e)
        if m and (bool(m.group(2)) == bool(m.group(3))):
            return spec(m.group(1), m.group(3) or "")
        m = re.match(r"^stage\.(move|ease)\(" + _STR + r"," + _NUM + r"\)$", e)
        if m:
            d = m.group(2)
            for p in ("in", "out"):
                if d.startswith(p) and d[len(p):] in _SIDES:
                    d = d[len(p):]
            if d in ("",) + _SIDES:
                return spec(m.group(1), d, float(m.group(3)))

        m = re.match(r"^(wipe|slideaway|slide|push)(left|right|up|down)$", e)
        if m:
            k = "slide" if m.group(1) == "slideaway" else m.group(1)
            return spec(k, m.group(2))
        m = re.match(r"^(CropMove|PushMove)\(" + _NUM + r"," + _STR + r"\)$", e)
        if m:
            m2 = re.match(r"^(wipe|slideaway|slide|push)(left|right|up|down)$", m.group(3))
            if m2:
                k = "slide" if m2.group(1) == "slideaway" else m2.group(1)
                if (k == "push") == (m.group(1) == "PushMove"):
                    return spec(k, m2.group(2), float(m.group(2)))

        if e in ("zoomin", "zoomout"):
            return spec("zoom")
        m = re.match(r"^stage\.zoom\(" + _STR + r"," + _NUM + r"\)$", e)
        if m:
            return spec("zoom", t=float(m.group(2)))
        if e in ("vpunch", "hpunch"):
            return spec("punch", e[0])

        return dict(kind="custom", dir="", time=None, raw=e)

    def with_label(expr, stmt="show"):
        s = parse_with(expr)
        if s["kind"] == "custom":
            return "직접 쓴 전환: " + s["raw"]
        info = trans_info(s["kind"])
        if s["kind"] == "none":
            return "없음"
        rv = info[1]
        if info[3] and s["dir"]:
            rv += " " + dict(info[3]).get(s["dir"], s["dir"])
        if s["time"] is not None and info[2] is not None:
            rv += " {}초".format(_num(s["time"]))
        return rv

    ## 위치: at 목록 중 위치를 정하는 식
    POSITION_NAMES = ("left", "right", "center", "truecenter", "top", "topleft", "topright",
                      "offscreenleft", "offscreenright", "default", "reset")

    def is_position(expr):
        e = expr.strip()
        return e in POSITION_NAMES or e.startswith("stage.pos(") or e.startswith("Position(")

    def split_at(at_exprs):
        """at 목록 → (위치 식 또는 None, 나머지 식 목록). 위치 식이 여럿이면 마지막 것이 이기므로 그것."""
        p = None
        rest = [ ]
        for e in at_exprs or [ ]:
            if is_position(e):
                p = e.strip()
            else:
                rest.append(e)
        return p, rest

    def join_at(p, rest):
        return ([ p ] if p else [ ]) + list(rest)

    def format_pos(x, y):
        return "stage.pos({}, {})".format(int(round(x)), int(round(y)))

    def parse_pos(expr):
        """stage.pos(x, y) → (x, y). 아니면 None"""
        if not expr:
            return None
        m = re.match(r"^stage\.pos\(\s*(-?[0-9.]+)\s*,\s*(-?[0-9.]+)\s*\)$", expr.strip())
        if not m:
            return None
        return (float(m.group(1)), float(m.group(2)))

    def pos_label(expr):
        if not expr:
            return "기본 (적지 않음)"
        p = parse_pos(expr)
        if p is not None:
            return "직접 x {:.0f}, y {:.0f}".format(p[0], p[1])
        for n, l in cfg("positions"):
            if n == expr:
                return l
        return expr


default stage.cur_box = None

init 998 python in stage:
    ## 그림 폴더(images/) 자동 등록이 끝난 뒤에 영상을 등록합니다. (같은 이름은 그림이 우선)
    register_movies()
    install()
