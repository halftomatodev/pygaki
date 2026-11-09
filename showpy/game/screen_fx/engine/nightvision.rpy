## Screen FX — 나이트비전(nightvision) 효과 엔진
##
## 이 파일은 엔진입니다. 고치지 말고 nightvision_config.rpy에서 설정하세요.
##
## 야간 투시경으로 보는 화면처럼 바꿉니다.
##   - 밝기만 남겨 초록 한 색으로, 어두운 곳을 밝게 끌어올림
##   - 어두운 곳일수록 지글거리는 노이즈, 가장자리 어둡게, 살짝 번짐
##   - 화면 글: 왼쪽 위 글(기본 "Standard NVG", "40° FOV"), 오른쪽 위 녹화 시간, 아래 [ZOOM]
##     화면 글은 셰이더가 아니라 이 효과가 보일 때만 함께 뜨는 스크린(nightvision_hud)입니다.
##
## 이 플러그인이 만드는 이름:
##   store.nightvision            설정과 함수가 들어 있는 이름공간
##   셰이더 "nightvision.effect", 유니폼 u_nightvision_*
##   스크린 nightvision_hud (config.overlay_screens에 저절로 들어감)
##   persistent.nightvision_off   플레이어가 이 효과를 끈 상태 (nightvision.Toggle())

init offset = 1

init -100 python in nightvision:

    VERSION = renpy.store.screen_fx.VERSION

    PARAMS = {
        "strength":     ("float", 1.0),
        "color":        ("color", "#8cff6e"),
        "gain":         ("float", 1.8),
        "gamma":        ("float", 0.8),
        "noise":        ("float", 0.18),
        "noise_size":   ("float", 1.5),
        "soft":         ("float", 0.5),
        "scanlines":    ("float", 0.08),
        "vignette":     ("float", 0.6),
        "scope":        ("bool", False),
        "flicker":      ("float", 0.04),

        ## 화면 글 (셰이더는 쓰지 않음)
        "hud":              ("bool", True),
        "hud_label":        ("bool", True),
        "rec":              ("bool", True),
        "timer":            ("bool", True),
        "zoom":             ("bool", True),
        "hud_text":         ("str", "Standard NVG\n40° FOV"),
        "zoom_text":        ("str", "[ZOOM]"),
        "hud_image":        ("str", ""),
        "hud_image_fit":    ("choice", "full", ("full", "center")),
        "hud_image_alpha":  ("float", 1.0),
        "hud_image_zoom":   ("float", 1.0),
        "hud_image_rotate": ("float", 0.0),
        "hud_image_x":      ("float", 0.0),
        "hud_image_y":      ("float", 0.0),
    }

    IMAGE_FITS = (("full", "화면 가득"), ("center", "가운데 원래 크기"))

    GROUPS = (
        ("색", (
            ("strength", "전체 세기", 0.0, 1.0, 0.01, 2),
            ("color", "화면 색", "color"),
            ("gain", "밝게 끌어올림", 0.5, 4.0, 0.05, 2),
            ("gamma", "감마", 0.3, 2.0, 0.05, 2),
            )),
        ("질감", (
            ("noise", "노이즈", 0.0, 1.0, 0.01, 2),
            ("noise_size", "노이즈 크기", 1.0, 6.0, 0.5, 1),
            ("soft", "번짐", 0.0, 1.0, 0.01, 2),
            ("scanlines", "가로줄", 0.0, 0.5, 0.01, 2),
            ("flicker", "깜빡임", 0.0, 0.3, 0.01, 2),
            )),
        ("테두리", (
            ("vignette", "가장자리 어둡게", 0.0, 1.0, 0.01, 2),
            ("scope", "동그란 테두리", "bool"),
            )),
        ("화면 글", (
            ("hud", "화면 글 전부", "bool"),
            ("hud_label", "왼쪽 위 글", "bool"),
            ("hud_text", "왼쪽 위 글 내용", "text"),
            ("rec", "REC 글자", "bool"),
            ("timer", "숫자 시간", "bool"),
            ("zoom", "아래 글", "bool"),
            ("zoom_text", "아래 글 내용", "text"),
            ("hud_image", "화면 이미지", "image"),
            ("hud_image_fit", "이미지 자리", "options", IMAGE_FITS),
            ("hud_image_alpha", "이미지 진하기", 0.0, 1.0, 0.01, 2),
            ("hud_image_zoom", "이미지 크기 (배)", 0.1, 4.0, 0.01, 2),
            ("hud_image_rotate", "이미지 회전 (도)", -180.0, 180.0, 1.0, 0),
            ("hud_image_x", "이미지 가로 자리", -1280.0, 1280.0, 1.0, 0),
            ("hud_image_y", "이미지 세로 자리", -720.0, 720.0, 1.0, 0),
            )),
        )

    SHADER = "nightvision.effect"

    _VARIABLES = """
        uniform sampler2D tex0;
        uniform float u_lod_bias;
        uniform float u_time;
        uniform vec2 u_model_size;
        attribute vec2 a_tex_coord;
        varying vec2 v_tex_coord;

        uniform float u_nightvision_strength;
        uniform vec3 u_nightvision_color;
        uniform float u_nightvision_gain;
        uniform float u_nightvision_gamma;
        uniform float u_nightvision_noise;
        uniform float u_nightvision_noise_size;
        uniform float u_nightvision_soft;
        uniform float u_nightvision_scanlines;
        uniform float u_nightvision_vignette;
        uniform float u_nightvision_scope;
        uniform float u_nightvision_flicker;
        uniform float u_nightvision_hud;
        uniform float u_nightvision_timer;
    """

    _FUNCTIONS = """
        float nv_hash(vec2 p) {
            p = fract(p * vec2(443.897, 441.423));
            p += dot(p, p.yx + 19.19);
            return fract((p.x + p.y) * p.x);
        }

        vec4 nv_tex(vec2 px, vec2 size) {
            vec2 lo = 0.5 / size;
            return texture2D(tex0, clamp(px / size, lo, 1.0 - lo), u_lod_bias);
        }
    """

    _FRAGMENT = """
        vec2 nv_size = max(u_model_size, vec2(1.0));
        vec2 nv_p = v_tex_coord * nv_size;
        vec4 nv_orig = texture2D(tex0, v_tex_coord, u_lod_bias);

        // ── 1. 살짝 번짐 ──
        vec4 nv_c = nv_orig;
        if (u_nightvision_soft > 0.0) {
            float nv_r = 1.5;
            vec4 nv_s = nv_tex(nv_p + vec2(nv_r, nv_r), nv_size) + nv_tex(nv_p + vec2(-nv_r, nv_r), nv_size)
                      + nv_tex(nv_p + vec2(nv_r, -nv_r), nv_size) + nv_tex(nv_p + vec2(-nv_r, -nv_r), nv_size);
            nv_c = mix(nv_c, nv_s * 0.25, clamp(u_nightvision_soft, 0.0, 1.0) * 0.7);
        }
        float nv_a = nv_c.a;

        // ── 2. 밝기만 남겨 끌어올림 ──
        float nv_l = (nv_a > 0.0001) ? dot(nv_c.rgb / nv_a, vec3(0.299, 0.587, 0.114)) : 0.0;
        nv_l = pow(clamp(nv_l, 0.0, 1.0), max(u_nightvision_gamma, 0.05)) * u_nightvision_gain;

        // ── 3. 노이즈 (어두운 곳일수록 많이, 1초에 30번 바뀜) ──
        float nv_fr = floor(u_time * 30.0);
        vec2 nv_g = floor(nv_p / max(u_nightvision_noise_size, 1.0));
        float nv_n = nv_hash(nv_g + vec2(nv_fr * 1.37, nv_fr * 0.71)) - 0.5;
        nv_l += nv_n * u_nightvision_noise * (1.2 - clamp(nv_l, 0.0, 1.0));

        // ── 4. 가로줄, 깜빡임 ──
        nv_l *= 1.0 - u_nightvision_scanlines * step(0.5, fract(nv_p.y / 3.0));
        nv_l *= 1.0 + (nv_hash(vec2(nv_fr, 4.0)) - 0.5) * 2.0 * u_nightvision_flicker;

        // ── 5. 한 색으로, 아주 밝은 곳은 하얗게 ──
        nv_l = max(nv_l, 0.0);
        vec3 nv_col = u_nightvision_color * nv_l;
        nv_col = mix(nv_col, vec3(1.0), smoothstep(0.9, 1.6, nv_l) * 0.6);

        // ── 6. 가장자리 어둡게, 동그란 테두리 ──
        vec2 nv_d = (v_tex_coord - 0.5) * vec2(nv_size.x / nv_size.y, 1.0);
        float nv_dist = length(nv_d);
        nv_col *= 1.0 - u_nightvision_vignette * smoothstep(0.25, 0.95, nv_dist);
        if (u_nightvision_scope > 0.5) {
            nv_col *= 1.0 - smoothstep(0.47, 0.49, nv_dist);
        }

        vec4 nv_out = vec4(clamp(nv_col, 0.0, 1.0) * nv_a, nv_a);
        gl_FragColor = mix(nv_orig, nv_out, clamp(u_nightvision_strength, 0.0, 1.0));
    """

    renpy.store.screen_fx.register_shader(SHADER,
        variables=_VARIABLES,
        fragment_functions=_FUNCTIONS,
        vertex_200="""
            v_tex_coord = a_tex_coord;
        """,
        fragment_300=_FRAGMENT)

    class NightvisionEffect(renpy.store.screen_fx.ShaderEffect):
        order = 58
        with_overlay = False

    _fx = NightvisionEffect("nightvision", "나이트비전", SHADER, PARAMS, GROUPS, uniform_prefix="u_nightvision_")
    _fx.export(globals())
    renpy.store.screen_fx.register(_fx)

    ## ── 화면 글 ──

    ## 화면 글 글꼴과 크기 (설정 파일에서 바꿈)
    hud_font = "screen_fx/fonts/neodgm.ttf"
    hud_size = 32

    class _HudState(renpy.store.python_object):
        start = None

    _hud_state = _HudState()

    def hud_mix():
        """지금 나이트비전이 얼마나 보이는지 (0 = 안 보임, 1 = 다 보임). 1번이든 2번이든."""
        try:
            sh = renpy.store.screen_fx._shown()
        except Exception:
            return 0.0
        m = 0.0
        if sh.fx is not None and sh.fx.id == "nightvision":
            m = max(m, sh.mix)
        if sh.ovl is not None and sh.ovl.id == "nightvision":
            m = max(m, sh.ovl_mix)
        if m <= 0.0:
            return 0.0
        return m * float(_fx.values().get("strength", 1.0))

    def _hud(st, at):
        m = hud_mix()
        v = _fx.values() if m > 0.0 else None

        if m <= 0.01 or not v.get("hud", True):
            _hud_state.start = None
            return renpy.store.Null(), 0.25

        now = renpy.get_game_runtime()
        if _hud_state.start is None or now < _hud_state.start:
            _hud_state.start = now

        col = renpy.store.screen_fx._rgb(v.get("color", "#8cff6e"))
        col = "#{:02x}{:02x}{:02x}".format(*(int(max(0.0, min(1.0, c * 0.6 + 0.4)) * 255) for c in col))

        def txt(s, **kw):
            return renpy.store.Text(s, font=hud_font, size=hud_size, color=col, outlines=[ (2, "#00000099", 0, 0) ], substitute=False, **kw)

        items = [ ]

        ## 이미지 (테두리, 조준선, 배터리 그림 등). 글보다 아래에 깔림
        img = str(v.get("hud_image", "") or "")
        if img:
            try:
                d = renpy.displayable(img)
                if v.get("hud_image_fit", "full") == "full":
                    d = renpy.store.Transform(d, xysize=(renpy.config.screen_width, renpy.config.screen_height), fit="fill")
                ## 가운데 기준으로 크기, 회전, 자리(픽셀), 진하기
                items.append(renpy.store.Transform(d,
                    align=(0.5, 0.5),
                    zoom=max(0.01, float(v.get("hud_image_zoom", 1.0))),
                    rotate=float(v.get("hud_image_rotate", 0.0)) or None,
                    rotate_pad=False,
                    xoffset=int(float(v.get("hud_image_x", 0.0))),
                    yoffset=int(float(v.get("hud_image_y", 0.0))),
                    alpha=max(0.0, min(1.0, float(v.get("hud_image_alpha", 1.0))))))
            except Exception:
                items.append(txt("hud_image를 못 찾음: " + img, xalign=0.5, yalign=0.5))

        lines = str(v.get("hud_text", "") or "")
        if lines and v.get("hud_label", True):
            items.append(txt(lines, xpos=40, ypos=30))
        z = str(v.get("zoom_text", "") or "")
        if z and v.get("zoom", True):
            items.append(txt(z, xalign=0.5, yalign=1.0, yoffset=-70))

        ## 오른쪽 위: 깜빡이는 점 + REC, 숫자 시간 (둘 다 따로 켜고 끔)
        right = [ ]
        if v.get("rec", True):
            right.append(("o" if int(now * 2) % 2 == 0 else " ") + " REC")
        if v.get("timer", True):
            t = int(now - _hud_state.start)
            right.append("{:02d}:{:02d}:{:02d}".format(t // 3600, t // 60 % 60, t % 60))
        if right:
            items.append(txt(" ".join(right), xalign=1.0, xoffset=-40, ypos=30))

        return renpy.store.Fixed(*items, alpha=min(1.0, m)), 0.25

    renpy.config.overlay_screens.append("nightvision_hud")

screen nightvision_hud():
    zorder 50
    add DynamicDisplayable(nightvision._hud)
