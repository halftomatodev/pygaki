################################################################################
## Screen FX — 일렁거림(wobble) 효과 엔진
##
## 이 파일은 엔진입니다. 고치지 말고 wobble_config.rpy에서 설정하세요.
##
## 노이즈 무늬로 화면의 점을 밀어서, 아지랑이나 손으로 그린 그림처럼 일렁거리게 합니다.
## 가로, 세로 무늬 크기를 따로 정해서 한쪽으로 길게 늘어진 일렁임도 만들 수 있습니다.
## (일렁임 ripple은 액체 너머로 보는 느린 굴절, 지글거림 boil은 뚝뚝 끊기는 작은 떨림입니다.) (screen_fx 5.7)
##
## 이 플러그인이 만드는 이름:
##   store.wobble            설정과 함수가 들어 있는 이름공간
##   셰이더 "wobble.effect", 유니폼 u_wobble_*
##   persistent.wobble_off   플레이어가 이 효과를 끈 상태 (wobble.Toggle())

init offset = 1

init -100 python in wobble:

    VERSION = renpy.store.screen_fx.VERSION

    PARAMS = {
        "strength":     ("float", 1.0),
        "amount":       ("float", 8.0),
        "size_x":       ("float", 140.0),
        "size_y":       ("float", 60.0),
        "detail":       ("float", 0.5),
        "speed":        ("float", 0.5),
        "pulse":        ("float", 0.3),
        "pulse_speed":  ("float", 0.4),
        "rise":         ("float", 0.0),
        "fps":          ("float", 0.0),
    }

    GROUPS = (
        ("일렁거림", (
            ("strength", "전체 세기", 0.0, 1.0, 0.01, 2),
            ("amount", "밀리는 거리 (픽셀)", 0.0, 40.0, 0.5, 1),
            ("size_x", "무늬 가로 크기 (픽셀)", 5.0, 600.0, 5.0, 0),
            ("size_y", "무늬 세로 크기 (픽셀)", 5.0, 600.0, 5.0, 0),
            ("detail", "잔무늬", 0.0, 1.0, 0.01, 2),
            )),
        ("움직임", (
            ("speed", "흐르는 속도", 0.0, 3.0, 0.05, 2),
            ("pulse", "세기 출렁임", 0.0, 1.0, 0.01, 2),
            ("pulse_speed", "출렁임 빠르기", 0.0, 3.0, 0.05, 2),
            ("rise", "위로 피어오름", 0.0, 3.0, 0.05, 2),
            ("fps", "뚝뚝 끊기 (초당 번, 0 = 부드럽게)", 0.0, 24.0, 1.0, 0),
            )),
        )

    SHADER = "wobble.effect"

    _VARIABLES = """
        uniform sampler2D tex0;
        uniform float u_lod_bias;
        uniform float u_time;
        uniform vec2 u_model_size;
        attribute vec2 a_tex_coord;
        varying vec2 v_tex_coord;

        uniform float u_wobble_strength;
        uniform float u_wobble_amount;
        uniform float u_wobble_size_x;
        uniform float u_wobble_size_y;
        uniform float u_wobble_detail;
        uniform float u_wobble_speed;
        uniform float u_wobble_pulse;
        uniform float u_wobble_pulse_speed;
        uniform float u_wobble_rise;
        uniform float u_wobble_fps;
    """

    _FUNCTIONS = """
        vec2 wb_grad(vec2 p) {
            float a = fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453) * 6.28318;
            return vec2(cos(a), sin(a));
        }

        // 펄린 노이즈 (-1 ~ 1 근처)
        float wb_perlin(vec2 p) {
            vec2 i = floor(p);
            vec2 f = fract(p);
            vec2 u = f * f * f * (f * (f * 6.0 - 15.0) + 10.0);
            float a = dot(wb_grad(i), f);
            float b = dot(wb_grad(i + vec2(1.0, 0.0)), f - vec2(1.0, 0.0));
            float c = dot(wb_grad(i + vec2(0.0, 1.0)), f - vec2(0.0, 1.0));
            float d = dot(wb_grad(i + vec2(1.0, 1.0)), f - vec2(1.0, 1.0));
            return mix(mix(a, b, u.x), mix(c, d, u.x), u.y) * 1.4;
        }

        float wb_turb(vec2 p, float detail) {
            return wb_perlin(p) + detail * 0.5 * wb_perlin(p * 2.1 + vec2(3.7, 1.9)) + detail * 0.25 * wb_perlin(p * 4.3 + vec2(8.1, 5.3));
        }
    """

    _FRAGMENT = """
        vec2 wb_size = max(u_model_size, vec2(1.0));
        vec4 wb_orig = texture2D(tex0, v_tex_coord, u_lod_bias);
        vec2 wb_p = v_tex_coord * wb_size;

        float wb_t = u_time;
        if (u_wobble_fps > 0.5) {
            wb_t = floor(u_time * u_wobble_fps) / u_wobble_fps;
        }
        float wb_flow = wb_t * u_wobble_speed;

        vec2 wb_q = wb_p / vec2(max(u_wobble_size_x, 1.0), max(u_wobble_size_y, 1.0));
        wb_q.y += wb_t * u_wobble_rise;
        vec2 wb_d = vec2(wb_turb(wb_q + vec2(wb_flow, 0.0), u_wobble_detail),
                         wb_turb(wb_q + vec2(17.3, 9.1) - vec2(0.0, wb_flow), u_wobble_detail));

        // 세기 출렁임: 천천히 세졌다 약해졌다
        float wb_amp = u_wobble_amount * (1.0 - u_wobble_pulse * (0.5 + 0.5 * sin(u_time * u_wobble_pulse_speed * 6.28318)));

        // 가장자리가 비지 않게 살짝 확대
        vec2 wb_margin = vec2(u_wobble_amount) / wb_size;
        vec2 wb_uv = 0.5 + (v_tex_coord - 0.5) * (1.0 - 2.0 * wb_margin);
        wb_uv = clamp(wb_uv + wb_d * wb_amp / wb_size, vec2(0.0), vec2(1.0));

        vec4 wb_col = texture2D(tex0, wb_uv, u_lod_bias);
        gl_FragColor = mix(wb_orig, wb_col, clamp(u_wobble_strength, 0.0, 1.0));
    """

    renpy.store.screen_fx.register_shader(SHADER,
        variables=_VARIABLES,
        fragment_functions=_FUNCTIONS,
        vertex_200="""
            v_tex_coord = a_tex_coord;
        """,
        fragment_300=_FRAGMENT)

    class WobbleEffect(renpy.store.screen_fx.ShaderEffect):
        order = 63
        with_overlay = False

    _fx = WobbleEffect("wobble", "일렁거림", SHADER, PARAMS, GROUPS, uniform_prefix="u_wobble_")
    _fx.export(globals())
    renpy.store.screen_fx.register(_fx)
