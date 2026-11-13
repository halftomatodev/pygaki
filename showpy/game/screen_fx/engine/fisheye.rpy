################################################################################
## Screen FX — 어안렌즈(fisheye) 효과 엔진
##
## 이 파일은 엔진입니다. 고치지 말고 fisheye_config.rpy에서 설정하세요.
##
## 어안렌즈(아주 넓게 찍는 둥근 렌즈)로 본 것처럼 가운데가 부풀고 가장자리가 휘어 눌립니다.
## circle을 올리면 둥근 화면 밖이 검게 가려지는 렌즈 모양, 색 번짐과 가장자리 어둡게도 고릅니다.
## 화면만 휘고 클릭 영역은 그대로라서, 메뉴 글자까지 휘게 둘 때는 amount를 낮게 두세요. (screen_fx 5.7)
##
## 이 플러그인이 만드는 이름:
##   store.fisheye             설정과 함수가 들어 있는 이름공간
##   셰이더 "fisheye.effect", 유니폼 u_fisheye_*
##   persistent.fisheye_off    플레이어가 이 효과를 끈 상태 (fisheye.Toggle())

init offset = 1

init -100 python in fisheye:

    VERSION = renpy.store.screen_fx.VERSION

    PARAMS = {
        "strength":     ("float", 1.0),
        "amount":       ("float", 0.6),
        "zoom":         ("float", 1.0),
        "center_x":     ("float", 0.5),
        "center_y":     ("float", 0.5),
        "chroma":       ("float", 0.3),
        "circle":       ("float", 0.0),
        "circle_soft":  ("float", 0.02),
        "vignette":     ("float", 0.35),
        "breathe":      ("float", 0.0),
    }

    GROUPS = (
        ("어안렌즈", (
            ("strength", "전체 세기", 0.0, 1.0, 0.01, 2),
            ("amount", "휘는 정도", 0.0, 1.0, 0.01, 2),
            ("zoom", "확대", 0.5, 2.0, 0.01, 2),
            ("center_x", "가운데 가로 (0~1)", 0.0, 1.0, 0.01, 2),
            ("center_y", "가운데 세로 (0~1)", 0.0, 1.0, 0.01, 2),
            ("breathe", "숨쉬듯 출렁", 0.0, 0.3, 0.01, 2),
            )),
        ("렌즈", (
            ("chroma", "가장자리 색 번짐", 0.0, 1.0, 0.01, 2),
            ("circle", "둥근 화면 (0 = 없음)", 0.0, 1.0, 0.01, 2),
            ("circle_soft", "둥근 화면 가장자리", 0.0, 0.2, 0.005, 3),
            ("vignette", "가장자리 어둡게", 0.0, 1.0, 0.01, 2),
            )),
        )

    SHADER = "fisheye.effect"

    _VARIABLES = """
        uniform sampler2D tex0;
        uniform float u_lod_bias;
        uniform float u_time;
        uniform vec2 u_model_size;
        attribute vec2 a_tex_coord;
        varying vec2 v_tex_coord;

        uniform float u_fisheye_strength;
        uniform float u_fisheye_amount;
        uniform float u_fisheye_zoom;
        uniform float u_fisheye_center_x;
        uniform float u_fisheye_center_y;
        uniform float u_fisheye_chroma;
        uniform float u_fisheye_circle;
        uniform float u_fisheye_circle_soft;
        uniform float u_fisheye_vignette;
        uniform float u_fisheye_breathe;
    """

    _FUNCTIONS = """
        // 가운데에서의 거리 r(0 ~ 1 = 모서리)를 읽을 자리의 거리로 바꿈. 가운데는 크게, 가장자리는 눌리게
        float fe_map(float r, float k) {
            float a = 0.05 + k * 1.0;
            return tan(r * a) / tan(a);
        }
    """

    _FRAGMENT = """
        vec2 fe_size = max(u_model_size, vec2(1.0));
        vec4 fe_orig = texture2D(tex0, v_tex_coord, u_lod_bias);
        vec2 fe_c = vec2(u_fisheye_center_x, u_fisheye_center_y);
        float fe_asp = fe_size.x / fe_size.y;

        vec2 fe_v = (v_tex_coord - fe_c) * vec2(fe_asp, 1.0);
        float fe_rmax = length(vec2(fe_asp, 1.0) * 0.5);
        // 둥근 화면일수록 원의 가장자리가 화면 모서리를 보게 (화면 전체가 원 안에 들어옴)
        float fe_circ = clamp(u_fisheye_circle, 0.0, 1.0);
        float fe_rn = mix(fe_rmax, 0.5, fe_circ);
        float fe_r = length(fe_v) / fe_rn;
        float fe_rs = mix(fe_rmax, 0.5, fe_circ);
        vec2 fe_dir = fe_r > 0.0001 ? fe_v / (fe_r * fe_rn) : vec2(0.0);

        float fe_k = clamp(u_fisheye_amount * (1.0 + u_fisheye_breathe * sin(u_time * 1.7)), 0.0, 1.0);
        float fe_z = max(u_fisheye_zoom, 0.05);
        float fe_ch = u_fisheye_chroma * 0.06 * fe_r * fe_r;

        vec2 fe_ug = fe_c + fe_dir * fe_map(fe_r, fe_k) * fe_rs / fe_z / vec2(fe_asp, 1.0);
        vec2 fe_ur = fe_c + fe_dir * fe_map(fe_r * (1.0 + fe_ch), fe_k) * fe_rs / fe_z / vec2(fe_asp, 1.0);
        vec2 fe_ub = fe_c + fe_dir * fe_map(fe_r * (1.0 - fe_ch), fe_k) * fe_rs / fe_z / vec2(fe_asp, 1.0);

        vec4 fe_g = texture2D(tex0, clamp(fe_ug, vec2(0.0), vec2(1.0)), u_lod_bias);
        vec4 fe_rr = texture2D(tex0, clamp(fe_ur, vec2(0.0), vec2(1.0)), u_lod_bias);
        vec4 fe_bb = texture2D(tex0, clamp(fe_ub, vec2(0.0), vec2(1.0)), u_lod_bias);
        vec4 fe_col = vec4(fe_rr.r, fe_g.g, fe_bb.b, fe_g.a);

        // 화면 밖을 읽는 곳은 검게
        float fe_out = step(0.0, fe_ug.x) * step(fe_ug.x, 1.0) * step(0.0, fe_ug.y) * step(fe_ug.y, 1.0);
        fe_col = mix(vec4(0.0, 0.0, 0.0, 1.0), fe_col, fe_out);

        // 가장자리 어둡게
        fe_col.rgb *= 1.0 - u_fisheye_vignette * smoothstep(0.35, 1.05, min(fe_r, 1.2));

        // 둥근 화면: 짧은 쪽에 맞춘 원 밖을 검게
        if (u_fisheye_circle > 0.0) {
            float fe_cr = length((v_tex_coord - fe_c) * vec2(fe_asp, 1.0)) / 0.5;
            float fe_lim = mix(fe_rmax / 0.5 + 0.1, 1.0, fe_circ);
            float fe_m = 1.0 - smoothstep(fe_lim - u_fisheye_circle_soft, fe_lim, fe_cr);
            fe_col = mix(vec4(0.0, 0.0, 0.0, 1.0), fe_col, fe_m);
        }

        gl_FragColor = mix(fe_orig, fe_col, clamp(u_fisheye_strength, 0.0, 1.0));
    """

    renpy.store.screen_fx.register_shader(SHADER,
        variables=_VARIABLES,
        fragment_functions=_FUNCTIONS,
        vertex_200="""
            v_tex_coord = a_tex_coord;
        """,
        fragment_300=_FRAGMENT)

    class FisheyeEffect(renpy.store.screen_fx.ShaderEffect):
        order = 65
        with_overlay = False

    _fx = FisheyeEffect("fisheye", "어안렌즈", SHADER, PARAMS, GROUPS, uniform_prefix="u_fisheye_")
    _fx.export(globals())
    renpy.store.screen_fx.register(_fx)
