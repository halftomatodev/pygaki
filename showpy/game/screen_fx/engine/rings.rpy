################################################################################
## Screen FX — 동심원 어긋남(rings) 효과 엔진
##
## 이 파일은 엔진입니다. 고치지 말고 rings_config.rpy에서 설정하세요.
##
## 화면을 한 점을 둘러싼 고리(동심원)로 잘라, 고리마다 조금씩 돌리고 밀어서 어긋나게 합니다.
## halves를 켜면 고리를 반으로 갈라 두 쪽이 따로 움직입니다. 고리는 천천히 흔들립니다(speed). (screen_fx 5.7)
##
## 이 플러그인이 만드는 이름:
##   store.rings             설정과 함수가 들어 있는 이름공간
##   셰이더 "rings.effect", 유니폼 u_rings_*
##   persistent.rings_off    플레이어가 이 효과를 끈 상태 (rings.Toggle())

init offset = 1

init -100 python in rings:

    VERSION = renpy.store.screen_fx.VERSION

    PARAMS = {
        "strength":     ("float", 1.0),
        "center_x":     ("float", 0.5),
        "center_y":     ("float", 0.5),
        "width":        ("float", 60.0),
        "twist":        ("float", 8.0),
        "shift":        ("float", 6.0),
        "zoom":         ("float", 0.03),
        "speed":        ("float", 0.4),
        "halves":       ("bool", False),
        "line":         ("float", 0.25),
        "line_color":   ("color", "#000000"),
    }

    GROUPS = (
        ("고리", (
            ("strength", "전체 세기", 0.0, 1.0, 0.01, 2),
            ("width", "고리 굵기 (픽셀)", 8.0, 300.0, 1.0, 0),
            ("twist", "돌아가는 정도 (도)", 0.0, 45.0, 0.5, 1),
            ("shift", "밀리는 거리 (픽셀)", 0.0, 60.0, 0.5, 1),
            ("zoom", "고리마다 확대", 0.0, 0.3, 0.005, 3),
            ("halves", "반으로 가르기", "bool"),
            )),
        ("움직임과 선", (
            ("center_x", "가운데 가로 (0~1)", 0.0, 1.0, 0.01, 2),
            ("center_y", "가운데 세로 (0~1)", 0.0, 1.0, 0.01, 2),
            ("speed", "흔들리는 빠르기", 0.0, 3.0, 0.05, 2),
            ("line", "고리 경계선", 0.0, 1.0, 0.01, 2),
            ("line_color", "경계선 색", "color"),
            )),
        )

    SHADER = "rings.effect"

    _VARIABLES = """
        uniform sampler2D tex0;
        uniform float u_lod_bias;
        uniform float u_time;
        uniform vec2 u_model_size;
        attribute vec2 a_tex_coord;
        varying vec2 v_tex_coord;

        uniform float u_rings_strength;
        uniform float u_rings_center_x;
        uniform float u_rings_center_y;
        uniform float u_rings_width;
        uniform float u_rings_twist;
        uniform float u_rings_shift;
        uniform float u_rings_zoom;
        uniform float u_rings_speed;
        uniform float u_rings_halves;
        uniform float u_rings_line;
        uniform vec3 u_rings_line_color;
    """

    _FUNCTIONS = """
        float rg_hash(float n) {
            return fract(sin(n * 78.233 + 12.9898) * 43758.5453);
        }
    """

    _FRAGMENT = """
        vec2 rg_size = max(u_model_size, vec2(1.0));
        vec4 rg_orig = texture2D(tex0, v_tex_coord, u_lod_bias);
        vec2 rg_c = vec2(u_rings_center_x, u_rings_center_y) * rg_size;
        vec2 rg_v = v_tex_coord * rg_size - rg_c;
        float rg_d = length(rg_v);
        float rg_w = max(u_rings_width, 2.0);
        float rg_i = floor(rg_d / rg_w);

        // 반으로 가르면 위쪽, 아래쪽이 다른 고리처럼 움직임
        float rg_side = 0.0;
        if (u_rings_halves > 0.5) {
            float rg_ang0 = 0.7 + rg_hash(rg_i + 40.0) * 1.5;
            rg_side = step(0.0, rg_v.x * sin(rg_ang0) - rg_v.y * cos(rg_ang0));
        }
        float rg_id = rg_i * 2.0 + rg_side;

        float rg_wob = sin(u_time * u_rings_speed * (1.0 + rg_hash(rg_id + 3.0)) + rg_hash(rg_id + 7.0) * 6.28318);
        float rg_rot = radians(u_rings_twist) * (rg_hash(rg_id) * 2.0 - 1.0) * (0.6 + 0.4 * rg_wob);
        float rg_sh = u_rings_shift * (rg_hash(rg_id + 1.0) * 2.0 - 1.0) * (0.6 + 0.4 * rg_wob);
        float rg_z = 1.0 + u_rings_zoom * (rg_hash(rg_id + 2.0) - 0.5) * 2.0;
        if (rg_i < 0.5) {
            rg_rot *= 0.3;
            rg_sh *= 0.3;
        }

        float rg_cs = cos(rg_rot);
        float rg_sn = sin(rg_rot);
        vec2 rg_q = vec2(rg_v.x * rg_cs - rg_v.y * rg_sn, rg_v.x * rg_sn + rg_v.y * rg_cs) / rg_z;
        vec2 rg_dir = rg_d > 0.001 ? rg_v / rg_d : vec2(0.0);
        rg_q += rg_dir * rg_sh;
        vec4 rg_col = texture2D(tex0, clamp((rg_c + rg_q) / rg_size, vec2(0.0), vec2(1.0)), u_lod_bias);

        // 고리 경계선
        float rg_edge = min(fract(rg_d / rg_w), 1.0 - fract(rg_d / rg_w)) * rg_w;
        float rg_ln = (1.0 - smoothstep(0.5, 1.6, rg_edge)) * u_rings_line * step(0.5, rg_i + step(rg_w * 0.5, rg_d));
        rg_col.rgb = mix(rg_col.rgb, u_rings_line_color * rg_col.a, clamp(rg_ln, 0.0, 1.0));

        gl_FragColor = mix(rg_orig, rg_col, clamp(u_rings_strength, 0.0, 1.0));
    """

    renpy.store.screen_fx.register_shader(SHADER,
        variables=_VARIABLES,
        fragment_functions=_FUNCTIONS,
        vertex_200="""
            v_tex_coord = a_tex_coord;
        """,
        fragment_300=_FRAGMENT)

    class RingsEffect(renpy.store.screen_fx.ShaderEffect):
        order = 69
        with_overlay = False

    _fx = RingsEffect("rings", "동심원 어긋남", SHADER, PARAMS, GROUPS, uniform_prefix="u_rings_")
    _fx.export(globals())
    renpy.store.screen_fx.register(_fx)
