################################################################################
## pygaki — 글 상자 (말풍선, 둥근 테두리)
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
##..._text_color  상자를 쓸 때 글 색 (괄호에 color를 적으면 그것)
##
## 그림/영상 상자 (box="media"): 글 뒤에 그림이나 영상을 깝니다. 글 가운데가 기준이고, 기본 대사창·이름 칸 배경은 늘 투명합니다.
##     e "꿈이었어." (box="media", media="images/say/cloud.png")                    # 글 크기에 맞춰 늘림
##     e "쾅!" (box="media", media="movies/boom.webm", media_fit="image", media_zoom=0.6)  # 그림 크기 그대로
##   media           그림이나 영상 파일 (game 폴더 기준)..webm.ogv.mp4.mkv는 영상
##   media_fit       "text": 글 크기 + padding에 맞춰 늘림 (기본), "image": 그림 크기 그대로 (media_zoom으로 키우기)
##   media_zoom      크기 배율 (기본 1.0). media_fit="text"면 글에 맞춘 크기에 곱함 (4.15)
##   media_angle     그림만 돌리기 (도, 글은 그대로. 글과 같이 돌리려면 box_rotate) (4.15)
##   media_offset    (x, y) 옮기기 (픽셀)
##   media_padding   글과 그림 가장자리 사이 (media_fit="text"일 때). 숫자 하나, (가로, 세로), (왼, 위, 오른, 아래)
##   media_alpha     투명도 (0.0 ~ 1.0)
##   media_mask      영상 오른쪽 절반을 투명도로 쓰는 영상이면 True (렌파이 side_mask). 안 적으면 파일 이름이 mask_로 시작할 때 True (4.16)
##   media_loop      영상 되풀이 (기본 True)
##   media_pop       튀어나오며 나타남 (True / False, 또는 걸리는 초)
##   media_link      글을 그림에 묶기 (4.18). 묶은 뒤로 그림의 크기, 회전, 옮김, 네 점 변형, 그림 효과를 글도 같이 받음.
##                   대사면 이름 칸도 그림 앞에 같이 그려져 함께 움직임 (진짜 이름 칸은 화면 밖으로 옮겨 둠).
##                   True, 또는 묶을 때의 그림 값 (media_zoom, media_angle, 가로 옮김, 세로 옮김): 그 값에서 달라진 만큼만 글이 따라감
##                       e "흔들려!" (box="media", media="images/say/cloud.png", media_angle=20, media_link=(1.0, 0, 0, 0))   # 글도 20도
##   media_quad      그림 네 모서리 자유변형 (4.18). 왼위, 오른위, 오른아래, 왼아래 모서리를 (가로, 세로)로 옮긴 비율 8개
##                       media_quad=(0.1, 0, -0.1, 0, 0, 0, 0, 0)   # 위쪽 변을 좁혀 뒤로 누운 판처럼
##   media_text_quad 글 네 모서리 자유변형 (4.18). 값은 media_quad와 같음 (글 크기에 대한 비율)
##   media_fx        나타날 때 그림 효과 (4.18): 효과 폴더의 그림 전환 이름. 묶었으면 글도 같이
##                       e "쾅!" (box="media", media="images/say/boom.png", media_link=True, media_fx="vibrate", media_fx_time=0.6, media_fx_values={"amount": 14})
##   media_fx_time   그림 효과 시간 (초). 없으면 효과 파일의 @time
##   media_fx_values 그림 효과 세부 값 {이름: 값}
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
        "media": dict(
            src=None, fit="text", zoom=1.0, offset=(0, 0), padding=(36, 24), alpha=1.0,
            mask=None, loop=True, angle=0.0, tail=None,
            link=None, quad=None, text_quad=None, fx=None, fx_time=None, fx_values=None,
            pop=False, rotate=0, text_color=None, text_outlines=None),
        }

    BOX_KINDS = ("bubble", "pill", "media")

    MOVIE_EXTS = (".webm", ".ogv", ".mp4", ".mkv", ".avi", ".mpg", ".mpeg")

    def is_movie(path):
        return isinstance(path, str) and path.lower().endswith(MOVIE_EXTS)

    def is_mask_name(path):
        """mask_로 시작하는 영상 파일 이름이면 투명 영상(왼쪽 색, 오른쪽 투명도). stage.rpy의 영상 자동 등록과 같은 규칙 (4.16)."""
        return is_movie(path) and path.replace("\\", "/").rsplit("/", 1)[-1].lower().startswith("mask_")

    def media_displayable(src, mask=None, loop=True):
        """그림·영상 파일 → 보이는 것. 영상은 렌파이 Movie (채널은 렌파이가 저절로 하나씩).
        mask가 None이면 파일 이름으로 정함 (mask_로 시작하면 투명 영상, 4.16)."""
        if src is None or src == "":
            return None
        if is_movie(src):
            if mask is None:
                mask = is_mask_name(src)
            return store.Movie(play=src, side_mask=bool(mask), loop=bool(loop))
        if isinstance(src, str):
            return store.renpy.displayable(src)
        return src

    ## 대사 괄호에서 상자 값으로 쓰는 이름인지
    def is_box_key(k):
        return k in ("box", "tail", "media") or k.startswith("box_") or k.startswith("bubble_") or k.startswith("pill_") or k.startswith("media_")

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
            raise Exception("[say_style] box는 \"bubble\", \"pill\", \"media\"입니다: {!r}".format(kind))
        opts = { }
        for k, v in args.items():
            if k == "box":
                continue
            if k == "tail":
                opts["tail"] = v
            elif k == "media":
                if kind == "media":
                    opts["src"] = v
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
        if kind == "media":
            if not st.get("src"):
                raise Exception("[say_style] 그림/영상 상자(box=\"media\")에는 media=\"그림이나 영상 파일\"이 있어야 합니다")
            if st.get("fit") not in ("text", "image"):
                raise Exception("[say_style] media_fit은 \"text\"나 \"image\"입니다: {!r}".format(st.get("fit")))
            src = st["src"]
            if isinstance(src, str) and not is_movie(src) and "." in src.split("/")[-1] and not store.renpy.loadable(src):
                raise Exception("[say_style] 그림 파일이 없어요: {}".format(src))
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

        def _media(self):
            d = getattr(self, "_media_d", None)
            if d is None:
                o = self.opts
                d = media_displayable(o.get("src"), o.get("mask"), o.get("loop", True))
                self._media_d = d
            return d

        def _wrap_media(self, text, rv, st, at):
            """그림/영상 상자: 글 뒤에 그림을 깝니다. 글 가운데가 기준, 글 크기와 배치는 그대로.
            묶으면(media_link, 4.18) 글이 그림과 한 장이 되어 그림의 크기, 회전, 옮김, 네 점 변형을 같이 받고,
            나타나는 그림 효과(media_fx, 4.18)도 둘이 같이 받습니다."""
            W, H = rv.get_size()
            o = self.opts
            d = self._media()
            if d is None:
                return rv

            scale = 1.0
            alpha = float(o.get("alpha") if o.get("alpha") is not None else 1.0)
            pop = o.get("pop")
            if pop:
                dur = 0.28 if pop is True else max(float(pop), 0.01)
                t = st / dur
                if t < 1.0:
                    scale = 0.35 + 0.65 * _ease_back(max(t, 0.0))
                    alpha *= min(1.0, t * 4.0)
                    store.renpy.redraw(text, 0)
            if is_movie(o.get("src")):
                store.renpy.redraw(text, 0)

            ox, oy = o.get("offset") or (0, 0)
            zoom = float(o.get("zoom") or 1.0)
            angle = float(o.get("angle") or 0.0)
            if o.get("fit") == "image":
                tr = store.Transform(d, zoom=zoom * scale, alpha=alpha)
            else:
                pl, pt, pr, pb = _padding(o.get("padding"))
                bw, bh = W + float(pl + pr), H + float(pt + pb)
                tr = store.Transform(d, xysize=(max(1, int(bw * zoom * scale)), max(1, int(bh * zoom * scale))), alpha=alpha)
            mr = store.renpy.render(tr, store.config.screen_width * 4, store.config.screen_height * 4, st, at)
            mw, mh = mr.get_size()
            ## 그림 가운데 = 글 가운데 (fit="text"면 padding이 한쪽만 다를 때 그만큼 옮김)
            cx, cy = W / 2.0, H / 2.0
            if o.get("fit") != "image":
                pl, pt, pr, pb = _padding(o.get("padding"))
                cx += (pr - pl) / 2.0
                cy += (pb - pt) / 2.0

            ## 글만의 네 점 변형 (media_text_quad)
            tw_r, (tox, toy) = rv, (0.0, 0.0)
            tq = quad_corners(o.get("text_quad"))
            if tq:
                tw_r, (tox, toy) = warp_render(rv, (0.0, 0.0, float(W), float(H)), tq)

            link = link_base(o.get("link"))
            geom = dict(W=float(W), H=float(H), rot=float(o.get("rotate") or 0), angle=angle,
                dest=(cx + ox, cy + oy), tq=tq, link=link, size=(float(mw), float(mh)))
            if link is None:
                ## 그림만 한 장 (글은 따로 그 자리에)
                g, rect = mr, (0.0, 0.0, float(mw), float(mh))
            else:
                ## 그림 기준 좌표(돌리기 전)에 글을 놓아 한 장으로. 묶을 때의 값(z0, a0, x0, y0)에서 달라진 만큼만 글이 따라갑니다:
                ## 글은 그림 쪽에서 보면 -a0만큼 돌아 있고, 크기는 zoom / z0배
                z0, a0, x0, y0 = link
                dz = zoom / z0 * scale
                ## 대사의 이름 칸도 글과 같이 판에 넣음 (진짜 이름 칸은 say_style이 화면 밖으로 치움, 세션 120)
                src, (sx, sy) = tw_r, (tox, toy)
                nm = name_render(text, W, H, st, at)
                if nm is not None:
                    nr, (nx, ny) = nm
                    sw, sh = src.get_size()
                    nw, nh = nr.get_size()
                    minx, miny = min(sx, nx), min(sy, ny)
                    comb = store.renpy.Render(int(math.ceil(max(sx + sw, nx + nw) - minx)), int(math.ceil(max(sy + sh, ny + nh) - miny)))
                    comb.subpixel_blit(src, (sx - minx, sy - miny))
                    comb.subpixel_blit(nr, (nx - minx, ny - miny))
                    src, (sx, sy) = comb, (minx, miny)
                tt, tp = transform_about(src, (W / 2.0 - sx, H / 2.0 - sy), -a0, dz, st, at)
                vx, vy = (W / 2.0 - cx - x0) * dz, (H / 2.0 - cy - y0) * dz
                vx, vy = _rot(vx, vy, -a0)
                tlx, tly = mw / 2.0 + vx - tp[0], mh / 2.0 + vy - tp[1]
                ttw, tth = tt.get_size()
                minx, miny = min(0.0, tlx), min(0.0, tly)
                maxx, maxy = max(float(mw), tlx + ttw), max(float(mh), tly + tth)
                g = store.renpy.Render(int(math.ceil(maxx - minx)), int(math.ceil(maxy - miny)))
                g.subpixel_blit(mr, (-minx, -miny))
                g.subpixel_blit(tt, (tlx - minx, tly - miny))
                rect = (-minx, -miny, float(mw), float(mh))
                geom.update(dz=dz, mc=(mw / 2.0, mh / 2.0), c0=(cx + x0, cy + y0), shift=(-minx, -miny))

            ## 그림(묶었으면 그림+글)의 네 점 변형 (media_quad): 그림 네 모서리를 옮긴 만큼 판 전체를 휨.
            ## 돌리고 놓는 기준은 휘기 전 그림 가운데라서, 모서리 하나를 끌어도 나머지 모서리는 제자리
            gx = gy = 0.0
            mq = quad_corners(o.get("quad"))
            Hm = None
            if mq:
                Hm = quad_homography(rect, mq)
                g2, (gx, gy) = warp_render(g, rect, mq)
                if g2 is g:
                    ## 너무 휘어서 그대로 그림
                    Hm, mq = None, None
                g = g2
            pvx, pvy = rect[0] + rect[2] / 2.0 - gx, rect[1] + rect[3] / 2.0 - gy
            geom.update(rect=rect, mq=mq, Hm=Hm, g=(gx, gy), pv=(pvx, pvy))
            if len(GEOM) > 40:
                GEOM.clear()
            GEOM[id(text)] = geom

            ## 나타날 때 그림 효과 (media_fx)
            g = self._fx(text, g, st, at)

            gr, gp = transform_about(g, (pvx, pvy), angle, 1.0, st, at)
            out = store.renpy.Render(W, H)
            out.subpixel_blit(gr, (cx + ox - gp[0], cy + oy - gp[1]))
            if link is None:
                out.subpixel_blit(tw_r, (tox, toy))
            final = self._rotate(out, W, H, st, at)
            mark_geom(final, text, W, H)
            return final

        def _fx(self, text, g, st, at):
            """나타날 때 그림 효과 (media_fx="이름", media_fx_time=초, media_fx_values={값: …}, 4.18).
            효과 폴더의 그림 전환을 빈 그림 → 이 판으로 돌립니다. 이름이 없으면 그대로."""
            name = self.opts.get("fx")
            if not name:
                return g
            sh = fx_shader(name, self.opts.get("fx_time"), self.opts.get("fx_values"))
            if sh is None:
                return g
            shader, time, uniforms = sh
            if time <= 0 or st >= time:
                return g
            store.renpy.redraw(text, 0)
            w, h = g.get_size()
            empty = store.renpy.Render(w, h)
            rv = store.renpy.Render(w, h)
            rv.mesh = True
            rv.add_shader(shader)
            rv.add_uniform("u_imgfx_t", max(0.0, min(1.0, st / time)))
            rv.add_uniform("u_imgfx_size", (float(w), float(h)))
            for k, v in uniforms.items():
                rv.add_uniform(k, v)
            rv.blit(empty, (0, 0), focus=False, main=False)
            rv.blit(g, (0, 0), focus=False, main=True)
            return rv

        def _rotate(self, out, W, H, st, at):
            rot = float(self.opts.get("rotate") or 0)
            if abs(rot) < 0.01:
                return out
            tr = store.Transform(_Held(out), rotate=rot, rotate_pad=False, subpixel=True)
            rr = store.renpy.render(tr, W, H, st, at)
            rw, rh = rr.get_size()
            final = store.renpy.Render(W, H)
            final.subpixel_blit(rr, ((W - rw) / 2.0, (H - rh) / 2.0))
            return final

        def with_opts(self, **kw):
            """값 몇 개만 바꾼 새 상자 (pygaki editor에서 끌 때 바로 보여 주려고, 4.15)."""
            o = dict(self.opts)
            o.update(kw)
            return TextBox(self.kind, o)

        def ui_kit_wrap(self, text, rv, st, at):
            """글 그림(rv)에 상자를 깔아서 돌려줍니다. 크기는 글 그대로라 배치가 바뀌지 않습니다."""
            W, H = rv.get_size()
            if W <= 0 or H <= 0:
                return rv
            if self.kind == "media":
                return self._wrap_media(text, rv, st, at)
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

    ## ── 묶기, 네 점 변형, 나타날 때 그림 효과  ──

    def link_base(v):
        """media_link 값 → 묶을 때의 그림 값 (zoom, angle, x, y). True면 (1, 0, 0, 0), None/False면 안 묶음."""
        if v is None or v is False:
            return None
        if v is True:
            return (1.0, 0.0, 0.0, 0.0)
        try:
            z, a, x, y = [ float(n) for n in v ]
        except Exception:
            raise Exception("[say_style] media_link는 True, 또는 묶을 때의 (크기, 회전, 가로 옮김, 세로 옮김)입니다: {!r}".format(v))
        return (max(z, 0.01), a, x, y)

    def quad_corners(q):
        """media_quad, media_text_quad 값 → 숫자 8개 [왼위 x, y, 오른위 x, y, 오른아래 x, y, 왼아래 x, y].
        모서리를 옮긴 만큼이고 그 상자 크기에 대한 비율(0.1이면 폭의 10%)입니다. 없거나 모두 0이면 None."""
        if q is None or q is False:
            return None
        flat = [ ]
        try:
            for v in q:
                if isinstance(v, (tuple, list)):
                    flat.extend(v)
                else:
                    flat.append(v)
            flat = [ float(n) for n in flat ]
        except Exception:
            flat = [ ]
        if len(flat) != 8:
            raise Exception("[say_style] media_quad, media_text_quad는 숫자 8개(왼위, 오른위, 오른아래, 왼아래 모서리를 가로, 세로로 옮긴 비율)입니다: {!r}".format(q))
        if all(abs(n) < 1e-6 for n in flat):
            return None
        return flat

    def _rot(x, y, deg):
        r = math.radians(deg)
        c, s = math.cos(r), math.sin(r)
        return (x * c - y * s, x * s + y * c)

    def transform_about(r, pivot, angle, zoom, st, at):
        """그림 r을 가운데 기준으로 zoom배, angle도 돌림. (새 그림, pivot이 옮겨 간 자리)"""
        if abs(angle) < 0.01 and abs(zoom - 1.0) < 1e-4:
            return r, pivot
        w, h = r.get_size()
        tr = store.Transform(_Held(r), rotate=(angle if abs(angle) >= 0.01 else None), zoom=zoom, rotate_pad=False, subpixel=True)
        rr = store.renpy.render(tr, w, h, st, at)
        rw, rh = rr.get_size()
        vx, vy = _rot((pivot[0] - w / 2.0) * zoom, (pivot[1] - h / 2.0) * zoom, angle)
        return rr, (rw / 2.0 + vx, rh / 2.0 + vy)

    def quad_homography(rect, q):
        """사각형 rect (x, y, 폭, 높이)의 네 모서리를 q만큼 옮긴 네 점으로 보내는 3x3 행렬 (원근, 행 순서)."""
        rx, ry, rw, rh = rect
        rw, rh = max(rw, 1e-3), max(rh, 1e-3)
        x0, y0 = rx + q[0] * rw, ry + q[1] * rh
        x1, y1 = rx + rw + q[2] * rw, ry + q[3] * rh
        x2, y2 = rx + rw + q[4] * rw, ry + rh + q[5] * rh
        x3, y3 = rx + q[6] * rw, ry + rh + q[7] * rh
        ## 단위 사각형 → 네 점 (Heckbert)
        sx, sy = x0 - x1 + x2 - x3, y0 - y1 + y2 - y3
        dx1, dx2, dy1, dy2 = x1 - x2, x3 - x2, y1 - y2, y3 - y2
        den = dx1 * dy2 - dx2 * dy1
        if abs(den) < 1e-9:
            g = h = 0.0
        else:
            g = (sx * dy2 - dx2 * sy) / den
            h = (dx1 * sy - sx * dy1) / den
        a, b, c = x1 - x0 + g * x1, x3 - x0 + h * x3, x0
        d, e, f = y1 - y0 + g * y1, y3 - y0 + h * y3, y0
        m = [ [ a, b, c ], [ d, e, f ], [ g, h, 1.0 ] ]
        ## 픽셀 → 단위 사각형
        n = [ [ 1.0 / rw, 0.0, -rx / rw ], [ 0.0, 1.0 / rh, -ry / rh ], [ 0.0, 0.0, 1.0 ] ]
        return [ [ sum(m[i][k] * n[k][j] for k in range(3)) for j in range(3) ] for i in range(3) ]

    def homography_point(H, x, y, w_out=None):
        X = H[0][0] * x + H[0][1] * y + H[0][2]
        Y = H[1][0] * x + H[1][1] * y + H[1][2]
        Z = H[2][0] * x + H[2][1] * y + H[2][2]
        if w_out is not None:
            w_out.append(Z)
        if abs(Z) < 1e-9:
            Z = 1e-9
        return (X / Z, Y / Z)

    def _inverse3(m):
        a, b, c = m[0]
        d, e, f = m[1]
        g, h, i = m[2]
        A, B, C = e * i - f * h, -(d * i - f * g), d * h - e * g
        det = a * A + b * B + c * C
        if abs(det) < 1e-12:
            return None
        return [ [ A / det, -(b * i - c * h) / det, (b * f - c * e) / det ],
                 [ B / det, (a * i - c * g) / det, -(a * f - c * d) / det ],
                 [ C / det, -(a * h - b * g) / det, (a * e - b * d) / det ] ]

    QUAD_SHADER = "ui_kit.quadwarp"
    QUAD_LIMIT = 4096

    def warp_render(r, rect, q):
        """그림 r 전체를, 그 안의 사각형 rect 네 모서리가 q만큼 옮겨 가게 휩니다 (원근).
        (휜 그림, 휜 그림의 왼쪽 위가 r 기준으로 어디인지)"""
        H = quad_homography(rect, q)
        Hi = _inverse3(H)
        if Hi is None:
            return r, (0.0, 0.0)
        Rw, Rh = r.get_size()
        zs = [ ]
        pts = [ homography_point(H, x, y, zs) for (x, y) in ((0, 0), (Rw, 0), (Rw, Rh), (0, Rh)) ]
        if min(zs) <= 1e-3:
            ## 판이 뒤로 넘어갈 만큼 휨: 휘지 않고 그대로
            return r, (0.0, 0.0)
        xs = [ p[0] for p in pts ] + [ 0.0, float(Rw) ]
        ys = [ p[1] for p in pts ] + [ 0.0, float(Rh) ]
        ux0 = math.floor(max(min(xs), -QUAD_LIMIT))
        uy0 = math.floor(max(min(ys), -QUAD_LIMIT))
        ux1 = math.ceil(min(max(xs), Rw + QUAD_LIMIT))
        uy1 = math.ceil(min(max(ys), Rh + QUAD_LIMIT))
        uw, uh = int(max(1, ux1 - ux0)), int(max(1, uy1 - uy0))

        src = store.renpy.Render(uw, uh)
        src.blit(r, (-ux0, -uy0))
        rv = store.renpy.Render(uw, uh)
        rv.mesh = True
        rv.add_shader(QUAD_SHADER)
        rv.add_uniform("u_qw_org", (float(ux0), float(uy0)))
        rv.add_uniform("u_qw_size", (float(uw), float(uh)))
        rv.add_uniform("u_qw_src", (float(Rw), float(Rh)))
        rv.add_uniform("u_qw_r0", tuple(Hi[0]))
        rv.add_uniform("u_qw_r1", tuple(Hi[1]))
        rv.add_uniform("u_qw_r2", tuple(Hi[2]))
        rv.blit(src, (0, 0))
        return rv, (float(ux0), float(uy0))

    _qw_kwargs = dict(
        variables="""
            uniform sampler2D tex0;
            uniform vec2 u_qw_org;
            uniform vec2 u_qw_size;
            uniform vec2 u_qw_src;
            uniform vec3 u_qw_r0;
            uniform vec3 u_qw_r1;
            uniform vec3 u_qw_r2;
            attribute vec2 a_tex_coord;
            varying vec2 v_tex_coord;
        """,
        vertex_200="""
            v_tex_coord = a_tex_coord;
        """,
        fragment_300="""
            vec2 qw_p = u_qw_org + v_tex_coord * u_qw_size;
            vec3 qw_h = vec3(qw_p, 1.0);
            vec3 qw_s = vec3(dot(u_qw_r0, qw_h), dot(u_qw_r1, qw_h), dot(u_qw_r2, qw_h));
            if (qw_s.z <= 0.0) {
                gl_FragColor = vec4(0.0);
            } else {
                vec2 qw_sp = qw_s.xy / qw_s.z;
                // 원래 그림 바깥은 투명. 가장자리는 반 픽셀 부드럽게
                vec2 qw_in = min(qw_sp, u_qw_src - qw_sp);
                float qw_m = clamp(min(qw_in.x, qw_in.y) + 0.5, 0.0, 1.0);
                gl_FragColor = texture2D(tex0, (qw_sp - u_qw_org) / u_qw_size) * qw_m;
            }
        """)
    if hasattr(_renpy_mod.config, "glsl_version"):
        _qw_kwargs["glsl"] = 100
    store.renpy.register_shader(QUAD_SHADER, **_qw_kwargs)

    ## pygaki editor가 모서리 점을 그리고 끌 때 쓰는, 마지막으로 그린 그림/영상 상자의 자리 (글 그림 id → 값).
    ## 숫자만 두고 init 뒤에 다시 넣지 않으므로 세이브에 들어가지 않습니다.
    GEOM = { }

    class _GeomMark(store.renpy.Displayable):
        """글 그림의 화면 자리를 렌파이에게서 받으려고 포커스 목록에 끼우는 보이지 않는 표시 (편집 화면이 열렸을 때만).
        마스크가 비어 있어 마우스가 잡지 않고, keyboard_focus가 꺼져 있어 키보드도 잡지 않습니다."""
        def __init__(self):
            super(_GeomMark, self).__init__(keyboard_focus=False)

        def render(self, width, height, st, at):
            return store.renpy.Render(0, 0)

    GEOM_MARK = _GeomMark()

    NAME_AWAY = -100000     # 묶은 그림 상자 줄에서 진짜 이름 칸을 치우는 세로 옮김 (say_style)

    def _pos(v, room):
        """스타일 자리 값 → 픽셀 (정수는 그대로, 1 이하 소수는 비율)."""
        if v is None:
            return 0.0
        if hasattr(v, "absolute") and hasattr(v, "relative"):
            return float(v.absolute) + float(v.relative) * room
        if type(v).__name__ == "absolute":
            return float(v)
        if isinstance(v, float) and abs(v) <= 1.0:
            return v * room
        try:
            return float(v)
        except Exception:
            return 0.0

    def name_render(text, tw, th, st, at):
        """묶은 그림 상자의 대사(text = say 화면의 "what")면 이름 칸 그림과, 글 왼쪽 위 기준 자리 (render, (x, y)).
        두 자리는 대사창 안 xpos/ypos/anchor로 셈 (옮김 값은 뺌). 아니면 None."""
        try:
            if store.renpy.get_displayable("say", "what") is not text:
                return None
            nb = store.renpy.get_displayable("say", "namebox")
        except Exception:
            return None
        if nb is None:
            return None
        sw, sh = store.config.screen_width, store.config.screen_height
        try:
            nr = store.renpy.render(nb, sw, sh, st, at)
            npl, tpl = nb.get_placement(), text.get_placement()
        except Exception:
            return None
        nw, nh = nr.get_size()
        if nw <= 0 or nh <= 0:
            return None
        def place(p, w, h):
            return (_pos(p[0], sw) - _pos(p[2], w), _pos(p[1], sh) - _pos(p[3], h))
        n0, t0 = place(npl, nw, nh), place(tpl, tw, th)
        return nr, (n0[0] - t0[0], n0[1] - t0[1])

    def mark_geom(rv, text, W, H):
        """편집 화면이 열려 있으면 글 그림(rv, 글 왼쪽 위 = rv 왼쪽 위)의 화면 자리를 포커스 목록에 남김."""
        if not store.config.developer:
            return
        ue = getattr(store, "ui_editor", None)
        if ue is None or not getattr(ue.state, "open", False):
            return
        rv.add_focus(GEOM_MARK, id(text), 0, 0, int(W), int(H), 0, 0, store.renpy.Render(1, 1))

    def screen_origin(text):
        """mark_geom이 남긴 글 그림의 화면 왼쪽 위 (x, y). 없으면 None."""
        try:
            import renpy.display.focus as _f
            for f in _f.focus_list:
                if f.widget is GEOM_MARK and f.arg == id(text) and f.x is not None:
                    return (float(f.x), float(f.y))
        except Exception:
            pass
        return None

    def _geom_final(geom, P):
        """글 상자 판 위 자리 → 글 기준 자리 (상자 기울기 box_rotate까지)."""
        W, H = geom["W"], geom["H"]
        vx, vy = _rot(P[0] - W / 2.0, P[1] - H / 2.0, geom["rot"])
        return (W / 2.0 + vx, H / 2.0 + vy)

    def _geom_from_g(geom, p):
        """휜 판(그림, 묶었으면 그림+글) 위 자리 → 글 기준 자리."""
        pv, d = geom["pv"], geom["dest"]
        vx, vy = _rot(p[0] - pv[0], p[1] - pv[1], geom["angle"])
        return _geom_final(geom, (d[0] + vx, d[1] + vy))

    def geom_media_corners(geom):
        """그림 네 모서리 (왼위, 오른위, 오른아래, 왼아래). 글 왼쪽 위 기준 픽셀."""
        rx, ry, rw, rh = geom["rect"]
        q = geom["mq"] or [ 0.0 ] * 8
        gx, gy = geom["g"]
        base = ((rx, ry), (rx + rw, ry), (rx + rw, ry + rh), (rx, ry + rh))
        return [ _geom_from_g(geom, (bx + q[i * 2] * rw - gx, by + q[i * 2 + 1] * rh - gy)) for i, (bx, by) in enumerate(base) ]

    def geom_text_point(geom, p):
        """글 그림(돌리기 전, 글 왼쪽 위 기준) 위 자리 → 화면에 그려진 자리 (글 기준)."""
        link = geom["link"]
        if link is None:
            return _geom_final(geom, p)
        z0, a0, x0, y0 = link
        mc, c0, sh, dz = geom["mc"], geom["c0"], geom["shift"], geom["dz"]
        vx, vy = _rot((p[0] - c0[0]) * dz, (p[1] - c0[1]) * dz, -a0)
        G = (mc[0] + vx + sh[0], mc[1] + vy + sh[1])
        if geom["Hm"] is not None:
            G = homography_point(geom["Hm"], G[0], G[1])
        gx, gy = geom["g"]
        return _geom_from_g(geom, (G[0] - gx, G[1] - gy))

    def geom_text_corners(geom):
        W, H = geom["W"], geom["H"]
        q = geom["tq"] or [ 0.0 ] * 8
        base = ((0.0, 0.0), (W, 0.0), (W, H), (0.0, H))
        return [ geom_text_point(geom, (bx + q[i * 2] * W, by + q[i * 2 + 1] * H)) for i, (bx, by) in enumerate(base) ]

    def geom_media_q(geom, P, i):
        """그림 모서리 i를 글 기준 자리 P로 끌 때 media_quad의 그 모서리 값 (가로, 세로 비율)."""
        W, H = geom["W"], geom["H"]
        vx, vy = _rot(P[0] - W / 2.0, P[1] - H / 2.0, -geom["rot"])
        d = geom["dest"]
        vx, vy = _rot(W / 2.0 + vx - d[0], H / 2.0 + vy - d[1], -geom["angle"])
        rx, ry, rw, rh = geom["rect"]
        cx, cy = rx + rw / 2.0 + vx, ry + rh / 2.0 + vy
        bx = rx if i in (0, 3) else rx + rw
        by = ry if i in (0, 1) else ry + rh
        return ((cx - bx) / max(rw, 1.0), (cy - by) / max(rh, 1.0))

    def geom_text_q(geom, P, i):
        """글 모서리 i를 글 기준 자리 P로 끌 때 media_text_quad의 그 모서리 값. 묶었으면 휜 판을 거꾸로 풀어서 (뉴턴법)."""
        W, H = geom["W"], geom["H"]
        q = geom["tq"] or [ 0.0 ] * 8
        bx = 0.0 if i in (0, 3) else W
        by = 0.0 if i in (0, 1) else H
        p = [ bx + q[i * 2] * W, by + q[i * 2 + 1] * H ]
        for _n in range(12):
            f = geom_text_point(geom, p)
            ex, ey = P[0] - f[0], P[1] - f[1]
            if abs(ex) + abs(ey) < 0.05:
                break
            fx = geom_text_point(geom, (p[0] + 1.0, p[1]))
            fy = geom_text_point(geom, (p[0], p[1] + 1.0))
            a, b = fx[0] - f[0], fy[0] - f[0]
            c, d = fx[1] - f[1], fy[1] - f[1]
            det = a * d - b * c
            if abs(det) < 1e-9:
                break
            p[0] += (d * ex - b * ey) / det
            p[1] += (-c * ex + a * ey) / det
        return ((p[0] - bx) / max(W, 1.0), (p[1] - by) / max(H, 1.0))

    _fx_cache = { }

    def fx_shader(name, time=None, values=None):
        """효과 폴더의 그림 전환 이름 → (셰이더 이름, 걸리는 초, 값). 효과가 없으면 None (개발 모드면 한 번 알림)."""
        key = (name, time, repr(sorted((values or { }).items())))
        if key in _fx_cache:
            return _fx_cache[key]
        fx = getattr(store, "img_fx", None)
        e = fx.EFFECTS.get(name) if fx is not None else None
        if e is None:
            if fx is not None and store.config.developer and name not in fx.MISSING:
                fx.MISSING.add(name)
                store.renpy.notify("글 상자 그림 효과 {!r}이 효과 폴더에 없어서 효과 없이 나와요".format(name))
            rv = None
        else:
            known = dict((k[3:], v) for k, v in e["uniforms"])
            for k, v in (values or { }).items():
                if k in known:
                    known[k] = v
            uniforms = dict(("u_imgfx_%s_%s" % (name, k), fx._value(v)) for k, v in known.items())
            rv = ("ui_kit.imgfx." + name, float(e["time"] if time is None else time), uniforms)
        _fx_cache[key] = rv
        return rv

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
