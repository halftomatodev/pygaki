################################################################################
## Screen FX — 일렁임(ripple) 효과 엔진
##
## 이 파일은 엔진입니다. 고치지 말고 ripple_config.rpy에서 설정하세요.
##
## 화면을 투명한 액체 너머로 보는 것처럼 천천히 일렁이게 합니다.
## 예전 "타이틀 일렁임"(watermorph)을 셰이더 하나로 옮긴 것이라 (screen_fx 5.5)
## 타이틀 셰이더, 게임 내 메뉴 셰이더, 상자·label 셰이더 어디에나 고를 수 있습니다.
##
## 이 플러그인이 만드는 이름:
##   store.ripple            설정과 함수가 들어 있는 이름공간
##   셰이더 "ripple.effect", 유니폼 u_ripple_*
##   persistent.ripple_off   플레이어가 이 효과를 끈 상태 (ripple.Toggle())

init offset = 1

init -100 python in ripple:

    VERSION = renpy.store.screen_fx.VERSION

    PARAMS = {
        "strength":     ("float", 1.0),
        "amount":       ("float", 6.0),
        "scale":        ("float", 180.0),
        "speed":        ("float", 0.6),
        "flow":         ("float", 1.2),
        "shine":        ("float", 0.15),
    }

    GROUPS = (
        ("일렁임", (
            ("strength", "전체 세기", 0.0, 1.0, 0.01, 2),
            ("amount", "일렁임 (픽셀)", 0.0, 30.0, 0.5, 1),
            ("scale", "물결 크기 (픽셀)", 20.0, 600.0, 5.0, 0),
            ("speed", "흐르는 속도", 0.0, 3.0, 0.05, 2),
            ("flow", "소용돌이", 0.0, 4.0, 0.05, 2),
            ("shine", "비친 빛", 0.0, 1.0, 0.01, 2),
            )),
        )

    SHADER = "ripple.effect"

    _VARIABLES = """
        uniform sampler2D tex0;
        uniform float u_lod_bias;
        uniform float u_time;
        uniform vec2 u_model_size;
        attribute vec2 a_tex_coord;
        varying vec2 v_tex_coord;

        uniform float u_ripple_strength;
        uniform float u_ripple_amount;
        uniform float u_ripple_scale;
        uniform float u_ripple_speed;
        uniform float u_ripple_flow;
        uniform float u_ripple_shine;
    """

    _FUNCTIONS = """
        float rp_hash(vec2 p) {
            p = fract(p * vec2(123.34, 456.21));
            p += dot(p, p + 45.32);
            return fract(p.x * p.y);
        }

        float rp_noise(vec2 p) {
            vec2 i = floor(p);
            vec2 f = fract(p);
            vec2 u = f * f * f * (f * (f * 6.0 - 15.0) + 10.0);
            return mix(mix(rp_hash(i), rp_hash(i + vec2(1.0, 0.0)), u.x),
                       mix(rp_hash(i + vec2(0.0, 1.0)), rp_hash(i + vec2(1.0, 1.0)), u.x), u.y);
        }

        float rp_fbm(vec2 p) {
            float v = 0.0;
            float a = 0.5;
            for (int k = 0; k < 2; k++) {
                v += a * rp_noise(p);
                p = p * 2.03 + vec2(1.7, 9.2);
                a *= 0.5;
            }
            return v;
        }

        float rp_height(vec2 p, float t, float flow) {
            vec2 q = vec2(rp_fbm(p + vec2(0.0, t * 0.30)),
                          rp_fbm(p + vec2(5.2, 1.3) - vec2(t * 0.25, 0.0)));
            return rp_fbm(p + flow * q + vec2(t * 0.10, -t * 0.07));
        }
    """

    _FRAGMENT = """
        vec2 rp_size = max(u_model_size, vec2(1.0));
        vec4 rp_orig = texture2D(tex0, v_tex_coord, u_lod_bias);
        vec2 rp_p = v_tex_coord * rp_size / max(u_ripple_scale, 1.0);
        float rp_t = u_time * u_ripple_speed;

        float rp_e = 0.08;
        float rp_h = rp_height(rp_p, rp_t, u_ripple_flow);
        vec2 rp_grad = vec2(rp_height(rp_p + vec2(rp_e, 0.0), rp_t, u_ripple_flow) - rp_h,
                            rp_height(rp_p + vec2(0.0, rp_e), rp_t, u_ripple_flow) - rp_h) / rp_e;

        // 가장자리가 늘어나 보이지 않도록 살짝 확대한 뒤 굴절
        vec2 rp_margin = vec2(u_ripple_amount * 1.5) / rp_size;
        vec2 rp_uv = 0.5 + (v_tex_coord - 0.5) * (1.0 - 2.0 * rp_margin);
        rp_uv += rp_grad * u_ripple_amount / rp_size;
        rp_uv = clamp(rp_uv, vec2(0.0), vec2(1.0));

        vec4 rp_c = texture2D(tex0, rp_uv, u_lod_bias);

        // 액체 표면에 비친 빛 (투명도를 곱한 색이라 a를 곱해서 더함)
        vec3 rp_n = normalize(vec3(-rp_grad, 1.0));
        float rp_spec = pow(max(0.0, dot(rp_n, normalize(vec3(-0.4, -0.6, 0.7)))), 24.0);
        rp_c.rgb = min(rp_c.rgb + rp_c.a * u_ripple_shine * rp_spec, vec3(rp_c.a));

        gl_FragColor = mix(rp_orig, rp_c, clamp(u_ripple_strength, 0.0, 1.0));
    """

    renpy.store.screen_fx.register_shader(SHADER,
        variables=_VARIABLES,
        fragment_functions=_FUNCTIONS,
        vertex_200="""
            v_tex_coord = a_tex_coord;
        """,
        fragment_300=_FRAGMENT)

    class RippleEffect(renpy.store.screen_fx.ShaderEffect):
        order = 60
        with_overlay = False

    _fx = RippleEffect("ripple", "일렁임", SHADER, PARAMS, GROUPS, uniform_prefix="u_ripple_")
    _fx.export(globals())
    renpy.store.screen_fx.register(_fx)
