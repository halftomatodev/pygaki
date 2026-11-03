## Screen FX — ASCII 효과 엔진
##
## 이 파일은 엔진입니다. 고치지 말고 ascii_config.rpy에서 설정하세요.
##
## 화면을 글자 칸으로 나누고, 칸마다 밝기에 맞는 글자로 다시 그립니다.
## 글자 하나가 픽셀 하나 역할을 합니다. (옛날 텍스트 화면·로그라이크 콘솔 느낌)
##
## 글자 그림은 설정 파일의 글자 목록(ascii.settings의 "chars")과 글꼴(ascii.font)로
## 게임 중에 직접 만듭니다. 기본 글꼴은 Neo둥근모(fonts/neodgm.ttf, SIL OFL 1.1)입니다.
##
## 참고한 것: Acerola의 ASCII 셰이더 아이디어와 Daniel Bologna의 Godot 판
##   https://godotshaders.com/shader/ascii-shader/ (MIT). 셰이더 코드는 렌파이용으로 새로 썼습니다.
##
## 이 플러그인이 만드는 이름:
##   store.ascii            설정과 함수가 들어 있는 이름공간
##   셰이더 "ascii.effect", 유니폼 u_ascii_*
##   persistent.ascii_off   플레이어가 이 효과를 끈 상태 (ascii.Toggle())

init offset = 1

init -100 python in ascii:

    VERSION = renpy.store.screen_fx.VERSION

    ## 값 이름 → (종류, 기본값[, 고를 수 있는 값])
    PARAMS = {
        "strength":    ("float", 1.0),
        "cell":        ("float", 16.0),
        "aspect":      ("float", 0.5),
        "crisp":       ("bool", True),
        "chars":       ("str", " .:-=+*#%@"),
        "color_mode":  ("choice", "color", ("mono", "color", "palette16")),
        "fg":          ("color", "#c8c8c8"),
        "bg":          ("color", "#000000"),
        "color_boost": ("float", 1.3),
        "bg_tint":     ("float", 0.0),
        "brightness":  ("float", 1.0),
        "contrast":    ("float", 1.0),
        "invert":      ("bool", False),
    }

    ## 편집기에서 고를 수 있는 글자 목록 (어두운 칸 → 밝은 칸 순서)
    CHARSETS = (
        (" .:-=+*#%@", "기본"),
        (" .,:;ox%#@", "던전풍"),
        (" .'^\":;!|/7xX#", "가는 선"),
        (" .oO0@", "동그라미"),
        (" ░▒▓█", "블록"),
        ("01", "0과 1"),
        )

    COLOR_MODES = (("mono", "한 가지 색"), ("color", "원래 색"), ("palette16", "16색"))

    ## 편집기 막대
    GROUPS = (
        ("기본", (
            ("strength", "전체 세기", 0.0, 1.0, 0.01, 2),
            ("cell", "글자 칸 높이 (픽셀)", 4.0, 64.0, 1.0, 0),
            ("aspect", "칸 가로 ÷ 세로", 0.25, 1.5, 0.05, 2),
            ("crisp", "선명하게 (8의 배수로)", "bool"),
            ("chars", "글자 목록", "options", CHARSETS),
            )),
        ("색", (
            ("color_mode", "색 입히기", "options", COLOR_MODES),
            ("fg", "글자 색 (한 가지 색)", "color"),
            ("bg", "바탕색", "color"),
            ("color_boost", "원래 색 밝기", 0.5, 3.0, 0.05, 2),
            ("bg_tint", "바탕에 원래 그림 비치기", 0.0, 1.0, 0.01, 2),
            )),
        ("밝기", (
            ("brightness", "밝기", 0.2, 3.0, 0.05, 2),
            ("contrast", "대비", 0.2, 3.0, 0.05, 2),
            ("invert", "밝기 뒤집기", "bool"),
            )),
        )

    SHADER = "ascii.effect"

    ## ── 셰이더 ──

    ## 옛날 PC의 16색 (CGA/EGA)
    _PALETTE = (
        "000000", "0000AA", "00AA00", "00AAAA", "AA0000", "AA00AA", "AA5500", "AAAAAA",
        "555555", "5555FF", "55FF55", "55FFFF", "FF5555", "FF55FF", "FFFF55", "FFFFFF",
        )

    def _vec3(h):
        return "vec3({:.4f}, {:.4f}, {:.4f})".format(int(h[0:2], 16) / 255.0, int(h[2:4], 16) / 255.0, int(h[4:6], 16) / 255.0)

    _pal_lines = [ ]
    for _h in _PALETTE:
        _pal_lines.append("            d = dot(c - {0}, c - {0}); if (d < bd) {{ bd = d; best = {0}; }}".format(_vec3(_h)))

    _VARIABLES = """
        uniform sampler2D tex0;
        uniform sampler2D u_ascii_atlas;
        uniform float u_lod_bias;
        uniform vec2 u_model_size;
        attribute vec2 a_tex_coord;
        varying vec2 v_tex_coord;

        uniform float u_ascii_strength;
        uniform float u_ascii_cell;
        uniform float u_ascii_aspect;
        uniform float u_ascii_crisp;
        uniform float u_ascii_color_mode;
        uniform vec3 u_ascii_fg;
        uniform vec3 u_ascii_bg;
        uniform float u_ascii_color_boost;
        uniform float u_ascii_bg_tint;
        uniform float u_ascii_brightness;
        uniform float u_ascii_contrast;
        uniform float u_ascii_invert;

        uniform vec2 u_ascii_cellsize;
        uniform float u_ascii_count;
    """

    _FUNCTIONS = """
        vec3 ascii_palette(vec3 c) {
            vec3 best = vec3(0.0);
            float bd = 1000.0;
            float d;
""" + "\n".join(_pal_lines) + """
            return best;
        }
    """

    _FRAGMENT = """
        vec4 a_orig = texture2D(tex0, v_tex_coord, u_lod_bias);

        // 글자 칸 나누기 (칸 크기는 게임 화면 픽셀 기준)
        vec2 a_px = v_tex_coord * u_model_size;
        vec2 a_cs = max(u_ascii_cellsize, vec2(1.0));
        vec2 a_idx = floor(a_px / a_cs);
        vec2 a_local = (a_px - a_idx * a_cs) / a_cs;

        // 칸의 대표 색: 칸 안 네 곳의 평균
        vec2 a_c = (a_idx + 0.5) * a_cs / u_model_size;
        vec2 a_q = a_cs * 0.25 / u_model_size;
        vec4 a_s = (texture2D(tex0, a_c + vec2(-a_q.x, -a_q.y), u_lod_bias)
                  + texture2D(tex0, a_c + vec2( a_q.x, -a_q.y), u_lod_bias)
                  + texture2D(tex0, a_c + vec2(-a_q.x,  a_q.y), u_lod_bias)
                  + texture2D(tex0, a_c + vec2( a_q.x,  a_q.y), u_lod_bias)) * 0.25;
        float a_a = a_s.a;
        vec3 a_rgb = (a_a > 0.001) ? a_s.rgb / a_a : vec3(0.0);

        // 밝기 → 글자 번호
        float a_l = dot(a_rgb, vec3(0.2126, 0.7152, 0.0722));
        a_l = clamp(((a_l - 0.5) * u_ascii_contrast + 0.5) * u_ascii_brightness, 0.0, 1.0);
        if (u_ascii_invert > 0.5) {
            a_l = 1.0 - a_l;
        }
        float a_n = max(u_ascii_count, 1.0);
        float a_ci = clamp(floor(a_l * a_n), 0.0, a_n - 1.0);

        // 글자 그림에서 그 글자의 이 자리
        vec2 a_auv = vec2((a_ci + a_local.x) / a_n, a_local.y);
        float a_g = texture2D(u_ascii_atlas, a_auv).a;

        // 글자 색
        vec3 a_fg;
        if (u_ascii_color_mode < 0.5) {
            a_fg = u_ascii_fg;
        } else {
            a_fg = clamp(a_rgb * u_ascii_color_boost, 0.0, 1.0);
            if (u_ascii_color_mode > 1.5) {
                a_fg = ascii_palette(a_fg);
            }
        }

        // 바탕: 바탕색에 칸의 원래 색을 조금 비침 (글자 사이가 너무 어두워지지 않게)
        vec3 a_bg = mix(u_ascii_bg, a_rgb, clamp(u_ascii_bg_tint, 0.0, 1.0));
        vec3 a_out = mix(a_bg, a_fg, a_g);
        vec4 a_fx = vec4(a_out * a_a, a_a);

        gl_FragColor = mix(a_orig, a_fx, clamp(u_ascii_strength, 0.0, 1.0));
    """

    renpy.store.screen_fx.register_shader(SHADER,
        variables=_VARIABLES,
        fragment_functions=_FUNCTIONS,
        vertex_200="""
            v_tex_coord = a_tex_coord;
        """,
        fragment_300=_FRAGMENT)

    ## ── 글자 칸 크기와 글자 그림 ──

    def default_font():
        """플러그인에 들어 있는 Neo둥근모의 경로 (game 폴더 기준)."""
        root = renpy.store.screen_fx.ROOT.replace("\\", "/")
        if root.startswith("game/"):
            root = root[5:]
        return root + "/fonts/neodgm.ttf"

    def cell_size(values):
        """(가로, 세로) 글자 칸 크기(픽셀)."""
        h = float(values.get("cell", 16.0))
        if values.get("crisp", True):
            h = max(8.0, round(h / 8.0) * 8.0)
        else:
            h = max(4.0, round(h))
        w = max(2.0, round(h * float(values.get("aspect", 0.5))))
        return (w, h)

    class _Atlas(renpy.Displayable):
        """글자들을 칸 하나에 하나씩 가로로 늘어놓은 그림. 크기가 정확히 (칸 가로 × 글자 수, 칸 세로)."""

        def __init__(self, chars, font, w, h, smooth):
            renpy.Displayable.__init__(self)
            self.w = int(w)
            self.h = int(h)
            self.n = len(chars)
            self.texts = [ ]
            for ch in chars:
                if ch == " ":
                    self.texts.append(None)
                    continue
                self.texts.append(renpy.store.Text(ch.replace("{", "{{"), substitute=False, font=font,
                    size=self.h, color="#ffffff", antialias=smooth, outlines=[ ], kerning=0,
                    line_leading=0, line_spacing=0, layout="nobreak", bold=False, italic=False))

        def render(self, width, height, st, at):
            W = self.w * self.n
            rv = renpy.Render(W, self.h)
            for i, t in enumerate(self.texts):
                if t is None:
                    continue
                cr = renpy.render(t, W, self.h, st, at)
                tw, th = cr.get_size()
                rv.blit(cr, (int(self.w * i + (self.w - tw) / 2.0), 0))
            return rv

        def visit(self):
            return [ t for t in self.texts if t is not None ]

    _atlas_cache = { }

    def atlas(chars, font, w, h, smooth):
        """글자 그림 (같은 값이면 만들어 둔 것을 다시 씀)."""
        chars = chars or " "
        key = (chars, font, int(w), int(h), smooth)
        rv = _atlas_cache.get(key)
        if rv is None:
            if len(_atlas_cache) > 64:
                _atlas_cache.clear()
            rv = _atlas_cache[key] = _Atlas(chars, font, w, h, smooth)
        return rv

    class AsciiEffect(renpy.store.screen_fx.ShaderEffect):

        order = 20

        ## 기본은 글자를 전부 뺌: 대사·이름·선택지·메뉴는 원래 글꼴로 읽을 수 있게
        ## (메뉴까지 글자로 바뀌면 저장·환경설정 화면을 읽을 수 없으므로)
        default_exclude = ("say", "choice", "screens")

        def font(self):
            f = self.conf("font", None)
            return f or default_font()

        def extra(self, trans, values):
            w, h = cell_size(values)
            chars = values.get("chars") or " "
            crisp = bool(values.get("crisp", True))

            ## 픽셀 글꼴은 원래 크기(16)의 정수 배일 때 계단 모양 그대로가 가장 또렷합니다.
            smooth = not (crisp and int(h) % 16 == 0)

            trans.u_ascii_cellsize = (float(w), float(h))
            trans.u_ascii_count = float(len(chars))
            trans.u_ascii_atlas = atlas(chars, self.font(), int(w), int(h), smooth)

    _fx = AsciiEffect("ascii", "ASCII", SHADER, PARAMS, GROUPS, uniform_prefix="u_ascii_")

    ## ascii.set(), preset(), reset(), off(), on(), ascii.Set(), Preset(), Toggle(), ascii.effect
    _fx.export(globals())

    ## ascii.font: 글자에 쓸 글꼴 (None이면 플러그인에 들어 있는 Neo둥근모)
    font = None

    renpy.store.screen_fx.register(_fx)
