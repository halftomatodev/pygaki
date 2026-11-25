################################################################################
## 화면 효과 — 옛 캠코더(camcorder) 효과 엔진
##
## 이 파일은 엔진입니다. 고치지 말고 camcorder_config.rpy에서 설정하세요.
##
## 옛날 캠코더로 찍어 낮은 화질로 옮긴 영상처럼 화면 톤만 바꿉니다:
## 해상도가 낮아 뭉개짐, 어두운 물체 둘레의 하얀 테두리(과한 샤픈), 색이 옆으로 번지고 조금 밀림,
## 따뜻한 색감, 검은색이 살짝 들떠 푸르스름한 회색, 밝은 곳 번짐, 잔 노이즈, 가장자리 어둡게.
## 주사선이나 흐르는 띠(VHS)는 없습니다. 필요하면 2번 자리에 vhs_crt를 겹칩니다. 
##
## 이 플러그인이 만드는 이름:
##   store.camcorder             설정과 함수가 들어 있는 이름공간
##   셰이더 "camcorder.effect", 유니폼 u_camcorder_*
##   persistent.camcorder_off    플레이어가 이 효과를 끈 상태 (camcorder.Toggle())

init offset = 1

init -100 python in camcorder:

    VERSION = renpy.store.screen_fx.VERSION

    PARAMS = {
        "strength":     ("float", 1.0),
        "resolution":   ("float", 300.0),
        "smear":        ("float", 1.6),
        "sharpen":      ("float", 0.9),
        "halo":         ("float", 2.5),
        "chroma":       ("float", 5.0),
        "shift":        ("float", 2.0),
        "saturation":   ("float", 1.25),
        "contrast":     ("float", 1.1),
        "gamma":        ("float", 1.25),
        "tint":         ("color", "#ffe2c4"),
        "tint_amount":  ("float", 0.35),
        "black":        ("float", 0.07),
        "shadow":       ("color", "#22303a"),
        "bloom":        ("float", 0.25),
        "noise":        ("float", 0.05),
        "fps":          ("float", 24.0),
        "jitter":       ("float", 0.3),
        "vignette":     ("float", 0.3),
    }

    GROUPS = (
        ("화질", (
            ("strength", "전체 세기", 0.0, 1.0, 0.01, 2),
            ("resolution", "세로 해상도 (줄)", 120.0, 1080.0, 10.0, 0),
            ("smear", "가로로 뭉개짐", 0.0, 4.0, 0.1, 1),
            ("sharpen", "하얀 테두리 (샤픈)", 0.0, 3.0, 0.05, 2),
            ("halo", "테두리 폭", 1.0, 6.0, 0.1, 1),
            ("noise", "노이즈", 0.0, 0.3, 0.01, 2),
            ("fps", "노이즈가 초당 바뀌는 번", 0.0, 30.0, 1.0, 0),
            ("jitter", "화면 떨림 (픽셀)", 0.0, 3.0, 0.1, 1),
            )),
        ("색", (
            ("chroma", "색 번짐 (픽셀)", 0.0, 16.0, 0.5, 1),
            ("shift", "색 밀림 (픽셀)", -8.0, 8.0, 0.5, 1),
            ("saturation", "채도", 0.0, 2.0, 0.01, 2),
            ("contrast", "대비", 0.5, 2.0, 0.01, 2),
            ("gamma", "감마 (클수록 중간 밝기가 어두움)", 0.5, 2.5, 0.01, 2),
            ("tint", "색감", "color"),
            ("tint_amount", "색감 세기", 0.0, 1.0, 0.01, 2),
            ("black", "검은색 들뜸", 0.0, 0.4, 0.01, 2),
            ("shadow", "들뜬 검은색의 색", "color"),
            ("bloom", "밝은 곳 번짐", 0.0, 1.0, 0.01, 2),
            ("vignette", "가장자리 어둡게", 0.0, 1.0, 0.01, 2),
            )),
        )

    SHADER = "camcorder.effect"

    _VARIABLES = """
        uniform sampler2D tex0;
        uniform float u_lod_bias;
        uniform float u_time;
        uniform vec2 u_model_size;
        attribute vec2 a_tex_coord;
        varying vec2 v_tex_coord;

        uniform float u_camcorder_strength;
        uniform float u_camcorder_resolution;
        uniform float u_camcorder_smear;
        uniform float u_camcorder_sharpen;
        uniform float u_camcorder_halo;
        uniform float u_camcorder_chroma;
        uniform float u_camcorder_shift;
        uniform float u_camcorder_saturation;
        uniform float u_camcorder_contrast;
        uniform float u_camcorder_gamma;
        uniform vec3 u_camcorder_tint;
        uniform float u_camcorder_tint_amount;
        uniform float u_camcorder_black;
        uniform vec3 u_camcorder_shadow;
        uniform float u_camcorder_bloom;
        uniform float u_camcorder_noise;
        uniform float u_camcorder_fps;
        uniform float u_camcorder_jitter;
        uniform float u_camcorder_vignette;
    """

    _FUNCTIONS = """
        float cc_hash(vec2 p) {
            return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
        }

        vec3 cc_tap(vec2 px, vec2 size) {
            vec2 lo = 0.5 / size;
            vec4 c = texture2D(tex0, clamp(px / size, lo, 1.0 - lo), u_lod_bias);
            return c.a > 0.0001 ? c.rgb / c.a : vec3(0.0);
        }

        float cc_lum(vec3 c) {
            return dot(c, vec3(0.299, 0.587, 0.114));
        }
    """

    _FRAGMENT = """
        vec2 cc_size = max(u_model_size, vec2(1.0));
        vec4 cc_orig = texture2D(tex0, v_tex_coord, u_lod_bias);
        float cc_f = u_camcorder_fps > 0.5 ? floor(u_time * u_camcorder_fps) : 0.0;

        // ── 1. 화면 떨림: 테이프를 옮길 때 생긴 아주 작은 흔들림 (프레임마다 조금씩) ──
        vec2 cc_j = (vec2(cc_hash(vec2(cc_f, 1.3)), cc_hash(vec2(cc_f, 7.7))) - 0.5) * u_camcorder_jitter;
        vec2 cc_p = v_tex_coord * cc_size + cc_j;

        // 낮은 해상도 한 칸의 크기 (화면 픽셀)
        float cc_cell = max(cc_size.y / max(u_camcorder_resolution, 16.0), 1.0);
        float cc_hx = cc_cell * (0.5 + u_camcorder_smear * 0.5);

        // ── 2. 뭉개진 화면: 가로로 더 넓게 섞음 ──
        vec3 cc_c0 = cc_tap(cc_p, cc_size);
        vec3 cc_soft = cc_c0 * 0.24
            + (cc_tap(cc_p + vec2(cc_hx, 0.0), cc_size) + cc_tap(cc_p - vec2(cc_hx, 0.0), cc_size)) * 0.17
            + (cc_tap(cc_p + vec2(cc_hx * 2.0, 0.0), cc_size) + cc_tap(cc_p - vec2(cc_hx * 2.0, 0.0), cc_size)) * 0.09
            + (cc_tap(cc_p + vec2(0.0, cc_cell * 0.5), cc_size) + cc_tap(cc_p - vec2(0.0, cc_cell * 0.5), cc_size)) * 0.12;

        // ── 3. 하얀 테두리: 넓게 섞은 것과의 차이를 더함 (과한 샤픈) ──
        float cc_hw = cc_cell * u_camcorder_halo;
        vec3 cc_wide = (cc_tap(cc_p + vec2(cc_hw, 0.0), cc_size) + cc_tap(cc_p - vec2(cc_hw, 0.0), cc_size)
                      + cc_tap(cc_p + vec2(0.0, cc_hw * 0.6), cc_size) + cc_tap(cc_p - vec2(0.0, cc_hw * 0.6), cc_size)) * 0.25;
        float cc_y = cc_lum(cc_soft);
        cc_y += (cc_y - cc_lum(cc_wide)) * u_camcorder_sharpen;

        // ── 4. 색 번짐: 색은 가로로 넓게 섞고 조금 옆으로 밀림 (밝기는 그대로) ──
        vec2 cc_cp = cc_p - vec2(u_camcorder_shift, 0.0);
        float cc_ch = max(u_camcorder_chroma, 0.0) * 0.5;
        vec3 cc_cc = (cc_tap(cc_cp, cc_size) * 2.0
            + cc_tap(cc_cp + vec2(cc_ch, 0.0), cc_size) + cc_tap(cc_cp - vec2(cc_ch, 0.0), cc_size)
            + cc_tap(cc_cp + vec2(cc_ch * 2.0, 0.0), cc_size) + cc_tap(cc_cp - vec2(cc_ch * 2.0, 0.0), cc_size)) / 6.0;
        vec3 cc_col = vec3(cc_y) + (cc_cc - vec3(cc_lum(cc_cc))) * u_camcorder_saturation;

        // ── 5. 밝은 곳 번짐 ──
        vec3 cc_glow = max((cc_wide + cc_soft) * 0.5 - 0.75, 0.0) * 1.6;
        cc_col += cc_glow * u_camcorder_bloom;

        // ── 6. 대비, 감마, 색감(밝기는 그대로), 들뜬 검은색 ──
        cc_col = clamp((cc_col - 0.5) * u_camcorder_contrast + 0.5, 0.0, 1.0);
        cc_col = pow(cc_col, vec3(max(u_camcorder_gamma, 0.1)));
        vec3 cc_tn = u_camcorder_tint / max(cc_lum(u_camcorder_tint), 0.05);
        cc_col = clamp(mix(cc_col, cc_col * cc_tn, u_camcorder_tint_amount), 0.0, 1.0);
        cc_col = cc_col + u_camcorder_shadow * u_camcorder_black * 2.5 * (1.0 - cc_col);

        // ── 7. 잔 노이즈 (낮은 해상도 칸 크기, 어두운 곳에 조금 더) ──
        float cc_n = cc_hash(floor(cc_p / max(cc_cell * 0.6, 1.0)) + vec2(cc_f * 1.37, cc_f * 0.71)) - 0.5;
        cc_col += cc_n * u_camcorder_noise * (1.3 - cc_lum(cc_col));

        // ── 8. 가장자리 어둡게 ──
        vec2 cc_d = (v_tex_coord - 0.5) * vec2(cc_size.x / cc_size.y, 1.0);
        cc_col *= 1.0 - u_camcorder_vignette * smoothstep(0.35, 1.0, length(cc_d));

        float cc_a = cc_orig.a;
        vec4 cc_out = vec4(clamp(cc_col, 0.0, 1.0) * cc_a, cc_a);
        gl_FragColor = mix(cc_orig, cc_out, clamp(u_camcorder_strength, 0.0, 1.0));
    """

    renpy.store.screen_fx.register_shader(SHADER,
        variables=_VARIABLES,
        fragment_functions=_FUNCTIONS,
        vertex_200="""
            v_tex_coord = a_tex_coord;
        """,
        fragment_300=_FRAGMENT)

    class CamcorderEffect(renpy.store.screen_fx.ShaderEffect):
        order = 70
        with_overlay = False

    _fx = CamcorderEffect("camcorder", "옛 캠코더", SHADER, PARAMS, GROUPS, uniform_prefix="u_camcorder_")
    _fx.export(globals())
    renpy.store.screen_fx.register(_fx)
