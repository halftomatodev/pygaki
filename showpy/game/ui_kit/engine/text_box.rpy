################################################################################
## UI Kit — 글 상자 (말풍선, 둥근 테두리)
##
## 이 파일은 고칠 필요가 없습니다. 기본 모양은 say_style_config.rpy의
## say_style.box_styles에서 고칩니다.
##
## 대사 괄호에 box를 적으면 그 대사 글을 상자가 둘러쌉니다.
##
##     e "안녕!" (box="bubble")                                  # 만화 말풍선
##     e "어디?" (box="bubble", tail="top")                       # 꼬리를 위로
##     e "저기." (box="bubble", tail=(-40, 120))                  # 꼬리 끝 자리 (글 왼쪽 위 기준 픽셀)
##     e "쾅!" (box="pill", box_rotate=-4)                        # 둥근 테두리, 살짝 기울임
##     e "속까지." (box="pill", pill_fill="#ffd23b", pill_line=None)  # 속을 채우고 선은 없앰
##
## 값 이름 (bubble_..., pill_...는 그 상자일 때만, box_...는 둘 다):
##   bubble_color    상자 속 색 ("#ffffff")
##   bubble_border   선 (굵기, 색). 예: (3, "#000000"). None이면 선 없음
##   bubble_radius   모서리 둥글기 (픽셀)
##   bubble_padding  글과 상자 사이 (픽셀). 숫자 하나, (가로, 세로), (왼, 위, 오른, 아래)
##   bubble_tail     꼬리: "bottom" "top" "left" "right" None, 또는 (x, y) 꼬리 끝 자리. 짧게 tail=
##   bubble_tail_pos   꼬리가 붙는 자리 (변을 따라 0.0 ~ 1.0)
##   bubble_tail_size  꼬리 길이, bubble_tail_width 꼬리 밑동 폭 (픽셀)
##   bubble_pop      튀어나오며 나타남 (True / False, 또는 걸리는 초)
##   pill_line       선 (굵기, 색). None이면 선 없음
##   pill_fill       속 색. None이면 속이 빔
##   pill_padding    글과 테두리 사이
##   pill_rotate     기울기 (도). 짧게 box_rotate=
##   ..._text_color  상자를 쓸 때 글 색 (괄호에 color를 적으면 그것)
##
## 상자는 글 전체 크기에 맞춰서, 글이 다 나오기 전에도 다 큰 크기로 나타납니다.
## 대사 위치나 화면 흔들림처럼 줄 전체가 움직이면 상자도 같이 움직입니다.
## 글자마다 따로 움직이는 등장 효과(shake 등)는 글자만 움직입니다.
##
## 캐릭터마다 늘 상자를 쓰려면:
##     define e = Character("에일린", what_background=say_style.box("bubble"))
################################################################################

init -10 python in say_style:

    import math
    import store

    ## 기본 모양. say_style_config.rpy의 say_style.box_styles가 있으면 그 값으로 덮습니다.
    BOX_DEFAULTS = {
        "bubble": dict(
            color="#ffffff", border=(3, "#000000"), radius=18, padding=(22, 14),
            tail="bottom", tail_pos=0.25, tail_size=24, tail_width=26,
            pop=True, rotate=0, text_color="#222222", text_outlines=[ ]),
        "pill": dict(
            fill=None, line=(3, "#ffffff"), radius=None, padding=(18, 6),
            tail=None, tail_pos=0.25, tail_size=20, tail_width=20,
            pop=False, rotate=0, text_color=None, text_outlines=None),
        }

    BOX_KINDS = ("bubble", "pill")

    ## 대사 괄호에서 상자 값으로 쓰는 이름인지
    def is_box_key(k):
        return k in ("box", "tail") or k.startswith("box_") or k.startswith("bubble_") or k.startswith("pill_")

    def box_style(kind):
        rv = dict(BOX_DEFAULTS.get(kind, BOX_DEFAULTS["bubble"]))
        rv.update((globals().get("box_styles", None) or { }).get(kind, { }) or { })
        ## bubble은 color/border, pill은 fill/line이라고 부릅니다. 안에서는 fill/line 하나로
        if "color" in rv:
            rv["fill"] = rv.pop("color")
        if "border" in rv:
            rv["line"] = rv.pop("border")
        return rv

    def split_box_args(kwargs):
        """대사 괄호 값에서 상자 값을 꺼냅니다. (상자 값 dict, 나머지 dict)"""
        box = { }
        rest = { }
        for k, v in kwargs.items():
            if is_box_key(k):
                box[k] = v
            else:
                rest[k] = v
        return box, rest

    def box_from_args(args):
        """괄호의 상자 값 → TextBox. box가 없거나 None이면 None."""
        kind = args.get("box", None)
        if kind is None or kind is False or kind == "none":
            return None
        if kind not in BOX_KINDS:
            raise Exception("[say_style] box는 \"bubble\"이나 \"pill\"입니다: {!r}".format(kind))
        opts = { }
        for k, v in args.items():
            if k == "box":
                continue
            if k == "tail":
                opts["tail"] = v
            elif k.startswith("box_"):
                opts[k[4:]] = v
            elif k.startswith(kind + "_"):
                opts[k[len(kind) + 1:]] = v
        return box(kind, **opts)

    def box(kind="bubble", **opts):
        """글 상자를 만듭니다. Character(..., what_background=say_style.box("bubble"))처럼 씁니다."""
        st = box_style(kind)
        for k, v in opts.items():
            if k == "color" or k == "border":
                k = "fill" if k == "color" else "line"
            if k not in st:
                raise Exception("[say_style] {} 상자에 없는 값: {}_{}  (쓸 수 있는 값: {})".format(
                    kind, kind, k, ", ".join(sorted(st))))
            st[k] = v
        return TextBox(kind, st)

    def _rgba(c):
        if c is None:
            return (0.0, 0.0, 0.0, 0.0)
        r, g, b, a = store.Color(c).rgba
        return (float(r), float(g), float(b), float(a))

    def _padding(p):
        if p is None:
            return (0, 0, 0, 0)
        if isinstance(p, (int, float)):
            return (p, p, p, p)
        p = tuple(p)
        if len(p) == 2:
            return (p[0], p[1], p[0], p[1])
        if len(p) == 4:
            return p
        raise Exception("[say_style] 상자 padding은 숫자, (가로, 세로), (왼, 위, 오른, 아래)입니다: {!r}".format(p))

    def _line(l):
        """선 → (굵기, 색). None, 0이면 (0, None)."""
        if l is None or l is False:
            return (0.0, None)
        if isinstance(l, (int, float)):
            return (float(l), "#000000")
        if isinstance(l, str):
            return (3.0, l)
        l = tuple(l)
        return (float(l[0]), l[1] if len(l) > 1 else "#000000")

    def _ease_back(t):
        c1 = 1.70158
        c3 = c1 + 1.0
        return 1.0 + c3 * (t - 1.0) ** 3 + c1 * (t - 1.0) ** 2

    class _Held(store.renpy.Displayable):
        """이미 그린 그림을 그대로 내놓는 것 (돌리기용)."""
        def __init__(self, r):
            super(_Held, self).__init__()
            self.r = r

        def render(self, width, height, st, at):
            return self.r

    class TextBox(store.renpy.Displayable):
        """대사 글(what)의 background로 들어가서, 글을 그릴 때 둘레에 상자를 같이 그립니다.
        렌파이 글은 background를 쓰지 않으므로, 아래 render 바꿔치기가 이 값을 보고 그립니다."""

        ui_kit_box = True

        def __init__(self, kind, opts):
            super(TextBox, self).__init__()
            self.kind = kind
            self.opts = dict(opts)

        def __eq__(self, other):
            return type(other) is type(self) and other.kind == self.kind and other.opts == self.opts

        def __ne__(self, other):
            return not self.__eq__(other)

        def __hash__(self):
            return hash(self.kind)

        def render(self, width, height, st, at):
            ## 다른 곳에서 진짜 배경으로 쓰면 아무것도 안 그림
            return store.renpy.Render(0, 0)

        def geometry(self, W, H):
            """글 크기 (W, H)일 때 상자 자리. 글 왼쪽 위 기준."""
            o = self.opts
            pl, pt, pr, pb = _padding(o.get("padding"))
            bx, by = -float(pl), -float(pt)
            bw, bh = W + float(pl + pr), H + float(pt + pb)
            r = o.get("radius")
            r = min(bw, bh) / 2.0 if r is None else min(float(r), bw / 2.0, bh / 2.0)
            lw, lc = _line(o.get("line"))

            tail = o.get("tail")
            tri = None
            if tail is not None and tail is not False and tail != "none":
                ts = float(o.get("tail_size") or 0)
                tw = float(o.get("tail_width") or 0)
                tp = float(o.get("tail_pos") if o.get("tail_pos") is not None else 0.25)
                inset = max(lw, 2.0) + 2.0

                if isinstance(tail, (tuple, list)):
                    tx, ty = float(tail[0]), float(tail[1])
                    if ty > by + bh:
                        side = "bottom"
                    elif ty < by:
                        side = "top"
                    elif tx < bx:
                        side = "left"
                    elif tx > bx + bw:
                        side = "right"
                    else:
                        side = None
                    tip = (tx, ty)
                else:
                    side = tail
                    tip = None

                def along(lo, length, want):
                    a = lo + r + tw / 2.0
                    b = lo + length - r - tw / 2.0
                    if a > b:
                        return lo + length / 2.0
                    return max(a, min(b, want))

                if side in ("bottom", "top"):
                    cx = along(bx, bw, tip[0] if tip else bx + bw * tp)
                    ey = by + bh - inset if side == "bottom" else by + inset
                    if tip is None:
                        out = by + bh + ts if side == "bottom" else by - ts
                        tip = (cx - tw * 0.5, out)
                    tri = ((cx - tw / 2.0, ey), (cx + tw / 2.0, ey), tip)
                elif side in ("left", "right"):
                    cy = along(by, bh, tip[1] if tip else by + bh * tp)
                    ex = bx + inset if side == "left" else bx + bw - inset
                    if tip is None:
                        out = bx - ts if side == "left" else bx + bw + ts
                        tip = (out, cy + tw * 0.5)
                    tri = ((ex, cy - tw / 2.0), (ex, cy + tw / 2.0), tip)
                elif side is not None:
                    raise Exception("[say_style] 상자 꼬리(tail)는 \"bottom\" \"top\" \"left\" \"right\" None, 또는 (x, y)입니다: {!r}".format(tail))

            xs = [ bx, bx + bw ]
            ys = [ by, by + bh ]
            if tri:
                xs += [ p[0] for p in tri ]
                ys += [ p[1] for p in tri ]
            m = lw + 3.0
            ax, ay = math.floor(min(xs) - m), math.floor(min(ys) - m)
            aw, ah = math.ceil(max(xs) + m) - ax, math.ceil(max(ys) + m) - ay
            return dict(area=(ax, ay, aw, ah), rect=(bx, by, bw, bh), radius=r, line=(lw, lc), tri=tri)

        def ui_kit_wrap(self, text, rv, st, at):
            """글 그림(rv)에 상자를 깔아서 돌려줍니다. 크기는 글 그대로라 배치가 바뀌지 않습니다."""
            W, H = rv.get_size()
            if W <= 0 or H <= 0:
                return rv
            g = self.geometry(W, H)
            ax, ay, aw, ah = g["area"]
            bx, by, bw, bh = g["rect"]
            lw, lc = g["line"]

            ## 튀어나오기
            pop = self.opts.get("pop")
            scale = 1.0
            alpha = 1.0
            if pop:
                dur = 0.28 if pop is True else max(float(pop), 0.01)
                t = st / dur
                if t < 1.0:
                    scale = 0.35 + 0.65 * _ease_back(max(t, 0.0))
                    alpha = min(1.0, t * 4.0)
                    store.renpy.redraw(text, 0)

            tri = g["tri"]
            if tri:
                t0, t1, tip = [ (p[0] - ax, p[1] - ay) for p in tri ]
                has_tail = 1.0
            else:
                t0 = t1 = tip = (0.0, 0.0)
                has_tail = 0.0

            d = store.Transform(store.Solid("#00000000", xysize=(aw, ah)), mesh=True, shader=BOX_SHADER,
                u_sbx_size=(float(aw), float(ah)),
                u_sbx_rect=(bx - ax, by - ay, bw, bh),
                u_sbx_radius=float(g["radius"]),
                u_sbx_fill=_rgba(self.opts.get("fill")),
                u_sbx_line=_rgba(lc),
                u_sbx_lw=float(lw),
                u_sbx_t0=t0, u_sbx_t1=t1, u_sbx_tip=tip,
                u_sbx_tail=has_tail,
                u_sbx_scale=float(scale),
                u_sbx_alpha=float(alpha))
            boxr = store.renpy.render(d, aw, ah, st, at)

            out = store.renpy.Render(W, H)
            out.blit(boxr, (ax, ay))
            out.blit(rv, (0, 0))

            rot = float(self.opts.get("rotate") or 0)
            if abs(rot) < 0.01:
                return out

            ## 상자와 글을 같이 돌립니다. 가운데를 그대로 두어서 자리가 안 바뀝니다.
            tr = store.Transform(_Held(out), rotate=rot, rotate_pad=False, subpixel=True)
            rr = store.renpy.render(tr, W, H, st, at)
            rw, rh = rr.get_size()
            final = store.renpy.Render(W, H)
            final.subpixel_blit(rr, ((W - rw) / 2.0, (H - rh) / 2.0))
            return final

    BOX_SHADER = "ui_kit.textbox"

    _BOX_VARIABLES = """
        uniform vec2 u_sbx_size;
        uniform vec4 u_sbx_rect;
        uniform float u_sbx_radius;
        uniform vec4 u_sbx_fill;
        uniform vec4 u_sbx_line;
        uniform float u_sbx_lw;
        uniform vec2 u_sbx_t0;
        uniform vec2 u_sbx_t1;
        uniform vec2 u_sbx_tip;
        uniform float u_sbx_tail;
        uniform float u_sbx_scale;
        uniform float u_sbx_alpha;
        attribute vec2 a_tex_coord;
        varying vec2 v_tex_coord;
    """

    _BOX_FUNCTIONS = """
        float sbx_round(vec2 p, vec2 c, vec2 hs, float r) {
            vec2 q = abs(p - c) - hs + r;
            return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r;
        }

        float sbx_tri(vec2 p, vec2 p0, vec2 p1, vec2 p2) {
            vec2 e0 = p1 - p0;
            vec2 e1 = p2 - p1;
            vec2 e2 = p0 - p2;
            vec2 v0 = p - p0;
            vec2 v1 = p - p1;
            vec2 v2 = p - p2;
            vec2 q0 = v0 - e0 * clamp(dot(v0, e0) / max(dot(e0, e0), 1e-4), 0.0, 1.0);
            vec2 q1 = v1 - e1 * clamp(dot(v1, e1) / max(dot(e1, e1), 1e-4), 0.0, 1.0);
            vec2 q2 = v2 - e2 * clamp(dot(v2, e2) / max(dot(e2, e2), 1e-4), 0.0, 1.0);
            float s = sign(e0.x * e2.y - e0.y * e2.x);
            vec2 d = min(min(vec2(dot(q0, q0), s * (v0.x * e0.y - v0.y * e0.x)),
                             vec2(dot(q1, q1), s * (v1.x * e1.y - v1.y * e1.x))),
                             vec2(dot(q2, q2), s * (v2.x * e2.y - v2.y * e2.x)));
            return -sqrt(d.x) * sign(d.y);
        }
    """

    _BOX_FRAGMENT = """
        vec2 sbx_p = v_tex_coord * u_sbx_size;
        vec2 sbx_hs = u_sbx_rect.zw * 0.5;
        vec2 sbx_c = u_sbx_rect.xy + sbx_hs;
        float sbx_k = max(u_sbx_scale, 0.01);

        // 튀어나올 때: 상자 가운데를 기준으로 줄여서 그림
        sbx_p = sbx_c + (sbx_p - sbx_c) / sbx_k;

        float sbx_d = sbx_round(sbx_p, sbx_c, sbx_hs, u_sbx_radius);
        if (u_sbx_tail > 0.5) {
            sbx_d = min(sbx_d, sbx_tri(sbx_p, u_sbx_t0, u_sbx_t1, u_sbx_tip));
        }
        sbx_d *= sbx_k;

        float sbx_shape = 1.0 - smoothstep(-0.5, 0.5, sbx_d);
        float sbx_in = u_sbx_lw > 0.0 ? 1.0 - smoothstep(-u_sbx_lw - 0.5, -u_sbx_lw + 0.5, sbx_d) : 1.0;

        vec4 sbx_f = vec4(u_sbx_fill.rgb * u_sbx_fill.a, u_sbx_fill.a);
        vec4 sbx_l = vec4(u_sbx_line.rgb * u_sbx_line.a, u_sbx_line.a);
        gl_FragColor = mix(sbx_l, sbx_f, sbx_in) * sbx_shape * clamp(u_sbx_alpha, 0.0, 1.0);
    """

    _box_kwargs = dict(variables=_BOX_VARIABLES, fragment_functions=_BOX_FUNCTIONS,
        vertex_200="""
            v_tex_coord = a_tex_coord;
        """,
        fragment_300=_BOX_FRAGMENT)
    ## 렌파이 8.6 이후에 필요한 문법 버전 (screen_fx.register_shader와 같음)
    import renpy as _renpy_mod
    if hasattr(_renpy_mod.config, "glsl_version"):
        _box_kwargs["glsl"] = 100
    store.renpy.register_shader(BOX_SHADER, **_box_kwargs)

    ## ── 렌파이 글 그리기에 상자 끼우기 ──
    ## 렌파이 Text는 background 스타일을 쓰지 않습니다. 대사 글의 background에 TextBox가
    ## 들어 있을 때만 상자를 깔고, 나머지 글은 원래대로 그립니다.
    def _install_box_render():
        import renpy.text.text as _rtt
        T = _rtt.Text
        if getattr(T.render, "_ui_kit_box", False):
            return
        orig = T.render

        def render(self, width, height, st, at):
            rv = orig(self, width, height, st, at)
            try:
                bg = self.style.background
            except Exception:
                return rv
            wrap = getattr(bg, "ui_kit_wrap", None)
            if wrap is None:
                return rv
            return wrap(self, rv, st, at)

        render._ui_kit_box = True
        render._ui_kit_orig = orig
        T.render = render

    _install_box_render()
