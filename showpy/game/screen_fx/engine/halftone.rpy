## Screen FX — 망점(halftone) 효과 엔진
##
## 이 파일은 엔진입니다. 고치지 말고 halftone_config.rpy에서 설정하세요.
##
## 인쇄물처럼 화면을 작은 점(또는 줄)으로 바꿉니다.
##   "mono" 한 색: 어두운 곳은 큰 점, 밝은 곳은 작은 점 (신문 사진처럼)
##   "cmyk" 네 색: 하늘색, 분홍, 노랑, 검정 점을 서로 다른 각도로 겹침 (색 포스터, 만화 인쇄처럼)
##
## 이 플러그인이 만드는 이름:
##   store.halftone            설정과 함수가 들어 있는 이름공간
##   셰이더 "halftone.effect", 유니폼 u_halftone_*
##   persistent.halftone_off   플레이어가 이 효과를 끈 상태 (halftone.Toggle())

init offset = 1

init -100 python in halftone:

    VERSION = renpy.store.screen_fx.VERSION

    PARAMS = {
        "strength":     ("float", 1.0),
        "mode":         ("choice", "mono", ("mono", "cmyk")),
        "shape":        ("choice", "dot", ("dot", "line")),
        "cell":         ("float", 8.0),
        "angle":        ("float", 45.0),
        "ink":          ("color", "#1a1a1a"),
        "paper":        ("color", "#f3eee2"),
        "brightness":   ("float", 1.0),
        "contrast":     ("float", 1.0),
    }

    MODES = (("mono", "한 색"), ("cmyk", "네 색 (CMYK)"))
    SHAPES = (("dot", "점"), ("line", "줄"))

    GROUPS = (
        ("망점", (
            ("strength", "전체 세기", 0.0, 1.0, 0.01, 2),
            ("mode", "색", "options", MODES),
            ("shape", "모양", "options", SHAPES),
            ("cell", "점 간격 (픽셀)", 3.0, 40.0, 1.0, 0),
            ("angle", "각도", 0.0, 90.0, 1.0, 0),
            )),
        ("색", (
            ("ink", "잉크 색", "color"),
            ("paper", "종이", "color"),
            ("brightness", "밝기", 0.2, 2.0, 0.05, 2),
            ("contrast", "대비", 0.2, 3.0, 0.05, 2),
            )),
        )

    SHADER = "halftone.effect"

    _VARIABLES = """
        uniform sampler2D tex0;
        uniform float u_lod_bias;
        uniform vec2 u_model_size;
        attribute vec2 a_tex_coord;
        varying vec2 v_tex_coord;

        uniform float u_halftone_strength;
        uniform float u_halftone_mode;
        uniform float u_halftone_shape;
        uniform float u_halftone_cell;
        uniform float u_halftone_angle;
        uniform vec3 u_halftone_ink;
        uniform vec3 u_halftone_paper;
        uniform float u_halftone_brightness;
        uniform float u_halftone_contrast;
    """

    _FUNCTIONS = """
        vec3 ht_unpre(vec4 c) {
            return (c.a > 0.0001) ? c.rgb / c.a : vec3(0.0);
        }

        // bc = (밝기, 대비)
        vec3 ht_adjust(vec3 c, vec2 bc) {
            c = (c - 0.5) * bc.y + 0.5;
            return clamp(c * bc.x, 0.0, 1.0);
        }

        // 한 각도의 망점 판: 점 칸 가운데의 색을 읽고, ch번 잉크가 얼마나 덮는지(0~1)
        // ch: 0 검정(한 색이면 밝기), 1 하늘색, 2 분홍, 3 노랑
        // o = (점 간격, 색: 0 한 색 / 1 네 색, 모양: 0 점 / 1 줄), bc = (밝기, 대비)
        float ht_plate(vec2 p, vec2 size, float deg, float ch, vec3 o, vec2 bc) {
            float cs = max(o.x, 2.0);
            float a = radians(deg);
            float c = cos(a);
            float s = sin(a);
            vec2 ctr = size * 0.5;
            vec2 d = p - ctr;
            vec2 r = vec2(c * d.x + s * d.y, -s * d.x + c * d.y);
            vec2 cell = floor(r / cs);
            vec2 f = r / cs - cell;
            vec2 cc = (cell + 0.5) * cs;
            vec2 sp = vec2(c * cc.x - s * cc.y, s * cc.x + c * cc.y) + ctr;
            vec2 lo = 0.5 / size;
            vec3 col = ht_adjust(ht_unpre(texture2D(tex0, clamp(sp / size, lo, 1.0 - lo), u_lod_bias)), bc);

            float k = 1.0 - max(col.r, max(col.g, col.b));
            float v;
            if (o.y < 0.5) {
                v = 1.0 - dot(col, vec3(0.299, 0.587, 0.114));
            } else if (ch < 0.5) {
                v = k;
            } else {
                float m = 1.0 / max(1.0 - k, 0.0001);
                if (ch < 1.5) v = (1.0 - col.r - k) * m;
                else if (ch < 2.5) v = (1.0 - col.g - k) * m;
                else v = (1.0 - col.b - k) * m;
            }
            v = clamp(v, 0.0, 1.0);

            float aa = 0.8;
            float dist;
            float rad;
            if (o.z < 0.5) {
                dist = length((f - 0.5) * cs);
                rad = sqrt(v) * cs * 0.7071;
            } else {
                dist = abs(f.y - 0.5) * cs;
                rad = v * cs * 0.5;
            }
            return (v <= 0.001) ? 0.0 : 1.0 - smoothstep(rad - aa, rad + aa, dist);
        }
    """

    _FRAGMENT = """
        vec2 ht_size = max(u_model_size, vec2(1.0));
        vec2 ht_p = v_tex_coord * ht_size;
        vec4 ht_orig = texture2D(tex0, v_tex_coord, u_lod_bias);
        vec3 ht_col = u_halftone_paper;
        vec3 ht_o3 = vec3(u_halftone_cell, u_halftone_mode, u_halftone_shape);
        vec2 ht_bc = vec2(u_halftone_brightness, u_halftone_contrast);

        if (u_halftone_mode < 0.5) {
            ht_col = mix(u_halftone_paper, u_halftone_ink, ht_plate(ht_p, ht_size, u_halftone_angle, 0.0, ht_o3, ht_bc));
        } else {
            // 인쇄처럼 판마다 각도를 다르게 (기본 45도일 때 하늘 15, 분홍 75, 노랑 0, 검정 45)
            float ht_o = u_halftone_angle - 45.0;
            ht_col *= mix(vec3(1.0), vec3(0.0, 0.68, 0.94), ht_plate(ht_p, ht_size, 15.0 + ht_o, 1.0, ht_o3, ht_bc));
            ht_col *= mix(vec3(1.0), vec3(0.93, 0.0, 0.55), ht_plate(ht_p, ht_size, 75.0 + ht_o, 2.0, ht_o3, ht_bc));
            ht_col *= mix(vec3(1.0), vec3(1.0, 0.92, 0.0), ht_plate(ht_p, ht_size, 0.0 + ht_o, 3.0, ht_o3, ht_bc));
            ht_col = mix(ht_col, u_halftone_ink, ht_plate(ht_p, ht_size, 45.0 + ht_o, 0.0, ht_o3, ht_bc));
        }

        vec4 ht_out = vec4(ht_col * ht_orig.a, ht_orig.a);
        gl_FragColor = mix(ht_orig, ht_out, clamp(u_halftone_strength, 0.0, 1.0));
    """

    renpy.store.screen_fx.register_shader(SHADER,
        variables=_VARIABLES,
        fragment_functions=_FUNCTIONS,
        vertex_200="""
            v_tex_coord = a_tex_coord;
        """,
        fragment_300=_FRAGMENT)

    class HalftoneEffect(renpy.store.screen_fx.ShaderEffect):
        order = 54
        with_overlay = False

    _fx = HalftoneEffect("halftone", "망점", SHADER, PARAMS, GROUPS, uniform_prefix="u_halftone_")
    _fx.export(globals())
    renpy.store.screen_fx.register(_fx)
