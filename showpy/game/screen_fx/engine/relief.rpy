################################################################################
## Screen FX — 양각(relief) 효과 엔진
##
## 이 파일은 엔진입니다. 고치지 말고 relief_config.rpy에서 설정하세요.
##
## 화면을 금속판에 눌러 찍은 것처럼: 밝은 곳은 튀어나오고 어두운 곳은 들어가서,
## 비스듬한 빛에 가장자리가 반짝이고 그림자가 집니다. 은판, 금박, 원래 색 위에 얹기를 고릅니다.
## invert를 켜면 반대로 눌려 들어갑니다(음각). (screen_fx 5.7)
##
## 이 플러그인이 만드는 이름:
##   store.relief             설정과 함수가 들어 있는 이름공간
##   셰이더 "relief.effect", 유니폼 u_relief_*
##   persistent.relief_off    플레이어가 이 효과를 끈 상태 (relief.Toggle())

init offset = 1

init -100 python in relief:

    VERSION = renpy.store.screen_fx.VERSION

    PARAMS = {
        "strength":     ("float", 1.0),
        "depth":        ("float", 3.0),
        "radius":       ("float", 1.5),
        "angle":        ("float", 135.0),
        "metal":        ("color", "#c9ccd1"),
        "color":        ("float", 0.0),
        "shine":        ("float", 0.6),
        "gloss":        ("float", 24.0),
        "invert":       ("bool", False),
        "sweep":        ("float", 0.0),
    }

    GROUPS = (
        ("양각", (
            ("strength", "전체 세기", 0.0, 1.0, 0.01, 2),
            ("depth", "튀어나온 정도", 0.0, 10.0, 0.1, 1),
            ("radius", "가장자리 굵기 (픽셀)", 0.5, 6.0, 0.1, 1),
            ("angle", "빛 방향 (도)", 0.0, 360.0, 1.0, 0),
            ("invert", "눌려 들어가게 (음각)", "bool"),
            )),
        ("판", (
            ("metal", "판 색", "color"),
            ("color", "원래 색 남기기", 0.0, 1.0, 0.01, 2),
            ("shine", "반짝임", 0.0, 2.0, 0.01, 2),
            ("gloss", "반짝임 날카로움", 2.0, 80.0, 1.0, 0),
            ("sweep", "빛이 도는 빠르기", 0.0, 2.0, 0.01, 2),
            )),
        )

    SHADER = "relief.effect"

    _VARIABLES = """
        uniform sampler2D tex0;
        uniform float u_lod_bias;
        uniform float u_time;
        uniform vec2 u_model_size;
        attribute vec2 a_tex_coord;
        varying vec2 v_tex_coord;

        uniform float u_relief_strength;
        uniform float u_relief_depth;
        uniform float u_relief_radius;
        uniform float u_relief_angle;
        uniform vec3 u_relief_metal;
        uniform float u_relief_color;
        uniform float u_relief_shine;
        uniform float u_relief_gloss;
        uniform float u_relief_invert;
        uniform float u_relief_sweep;
    """

    _FUNCTIONS = """
        float rl_lum(vec2 uv) {
            vec4 c = texture2D(tex0, clamp(uv, vec2(0.0), vec2(1.0)));
            vec3 rgb = c.a > 0.001 ? c.rgb / c.a : vec3(0.0);
            return dot(rgb, vec3(0.299, 0.587, 0.114));
        }
    """

    _FRAGMENT = """
        vec2 rl_size = max(u_model_size, vec2(1.0));
        vec4 rl_orig = texture2D(tex0, v_tex_coord, u_lod_bias);
        vec2 rl_o = vec2(max(u_relief_radius, 0.5)) / rl_size;

        // ── 1. 밝기 기울기 (소벨) ──
        float rl_tl = rl_lum(v_tex_coord + vec2(-rl_o.x, -rl_o.y));
        float rl_t = rl_lum(v_tex_coord + vec2(0.0, -rl_o.y));
        float rl_tr = rl_lum(v_tex_coord + vec2(rl_o.x, -rl_o.y));
        float rl_l = rl_lum(v_tex_coord + vec2(-rl_o.x, 0.0));
        float rl_r = rl_lum(v_tex_coord + vec2(rl_o.x, 0.0));
        float rl_bl = rl_lum(v_tex_coord + vec2(-rl_o.x, rl_o.y));
        float rl_b = rl_lum(v_tex_coord + vec2(0.0, rl_o.y));
        float rl_br = rl_lum(v_tex_coord + vec2(rl_o.x, rl_o.y));
        vec2 rl_g = vec2((rl_tr + 2.0 * rl_r + rl_br) - (rl_tl + 2.0 * rl_l + rl_bl),
                         (rl_bl + 2.0 * rl_b + rl_br) - (rl_tl + 2.0 * rl_t + rl_tr));
        if (u_relief_invert > 0.5) {
            rl_g = -rl_g;
        }

        // ── 2. 빛 ──
        vec3 rl_n = normalize(vec3(-rl_g * u_relief_depth, 1.0));
        float rl_a = radians(u_relief_angle + u_time * u_relief_sweep * 60.0);
        vec3 rl_ld = normalize(vec3(cos(rl_a), -sin(rl_a), 0.8));
        float rl_diff = max(dot(rl_n, rl_ld), 0.0);
        vec3 rl_h = normalize(rl_ld + vec3(0.0, 0.0, 1.0));
        float rl_spec = pow(max(dot(rl_n, rl_h), 0.0), max(u_relief_gloss, 1.0)) * u_relief_shine;

        // ── 3. 판 색 (원래 색을 조금 남길 수 있음) ──
        vec3 rl_src = rl_orig.a > 0.001 ? rl_orig.rgb / rl_orig.a : vec3(0.0);
        vec3 rl_base = mix(u_relief_metal, rl_src, clamp(u_relief_color, 0.0, 1.0));
        vec3 rl_rgb = rl_base * (0.35 + 0.75 * rl_diff) + vec3(rl_spec) * mix(vec3(1.0), u_relief_metal, 0.4);

        vec4 rl_out = vec4(clamp(rl_rgb, 0.0, 1.0) * rl_orig.a, rl_orig.a);
        gl_FragColor = mix(rl_orig, rl_out, clamp(u_relief_strength, 0.0, 1.0));
    """

    renpy.store.screen_fx.register_shader(SHADER,
        variables=_VARIABLES,
        fragment_functions=_FUNCTIONS,
        vertex_200="""
            v_tex_coord = a_tex_coord;
        """,
        fragment_300=_FRAGMENT)

    class ReliefEffect(renpy.store.screen_fx.ShaderEffect):
        order = 67
        with_overlay = False

    _fx = ReliefEffect("relief", "양각", SHADER, PARAMS, GROUPS, uniform_prefix="u_relief_")
    _fx.export(globals())
    renpy.store.screen_fx.register(_fx)
