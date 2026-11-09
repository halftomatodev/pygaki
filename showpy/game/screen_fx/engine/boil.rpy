## Screen FX — 지글거림(boil) 효과 엔진
##
## 이 파일은 엔진입니다. 고치지 말고 boil_config.rpy에서 설정하세요.
##
## 손그림 애니메이션의 "보일링"처럼 화면 전체가 계속 지글거립니다.
##   - 그림 테두리가 1초에 12번쯤 1~2픽셀씩 떨림 (부드럽지 않고 뚝뚝 끊겨서 손그림 느낌)
##   - 인쇄물 같은 고운 알갱이가 떨릴 때마다 바뀜
##
## 이 플러그인이 만드는 이름:
##   store.boil              설정과 함수가 들어 있는 이름공간
##   셰이더 "boil.effect", 유니폼 u_boil_*
##   persistent.boil_off     플레이어가 이 효과를 끈 상태 (boil.Toggle())

init offset = 1

init -100 python in boil:

    VERSION = renpy.store.screen_fx.VERSION

    PARAMS = {
        "strength":     ("float", 1.0),
        "amount":       ("float", 1.5),
        "fps":          ("float", 12.0),
        "scale":        ("float", 40.0),
        "grain":        ("float", 0.08),
        "grain_size":   ("float", 1.0),
        "soft":         ("float", 0.3),
    }

    GROUPS = (
        ("떨림", (
            ("strength", "전체 세기", 0.0, 1.0, 0.01, 2),
            ("amount", "떨림 (픽셀)", 0.0, 8.0, 0.1, 1),
            ("fps", "1초에 바뀌는 수", 1.0, 30.0, 1.0, 0),
            ("scale", "떨림 무늬 크기", 4.0, 200.0, 1.0, 0),
            ("soft", "살짝 번짐", 0.0, 1.0, 0.01, 2),
            )),
        ("알갱이", (
            ("grain", "알갱이 세기", 0.0, 0.5, 0.01, 2),
            ("grain_size", "알갱이 크기", 1.0, 6.0, 0.5, 1),
            )),
        )

    SHADER = "boil.effect"

    _VARIABLES = """
        uniform sampler2D tex0;
        uniform float u_lod_bias;
        uniform float u_time;
        uniform vec2 u_model_size;
        attribute vec2 a_tex_coord;
        varying vec2 v_tex_coord;

        uniform float u_boil_strength;
        uniform float u_boil_amount;
        uniform float u_boil_fps;
        uniform float u_boil_scale;
        uniform float u_boil_grain;
        uniform float u_boil_grain_size;
        uniform float u_boil_soft;
    """

    _FUNCTIONS = """
        float bo_hash(vec2 p) {
            p = fract(p * vec2(443.897, 441.423));
            p += dot(p, p.yx + 19.19);
            return fract((p.x + p.y) * p.x);
        }

        float bo_noise(vec2 p) {
            vec2 i = floor(p);
            vec2 f = fract(p);
            f = f * f * (3.0 - 2.0 * f);
            float a = bo_hash(i);
            float b = bo_hash(i + vec2(1.0, 0.0));
            float c = bo_hash(i + vec2(0.0, 1.0));
            float d = bo_hash(i + vec2(1.0, 1.0));
            return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
        }

        vec4 bo_tex(vec2 px, vec2 size) {
            vec2 lo = 0.5 / size;
            return texture2D(tex0, clamp(px / size, lo, 1.0 - lo), u_lod_bias);
        }
    """

    _FRAGMENT = """
        vec2 bo_size = max(u_model_size, vec2(1.0));
        vec2 bo_p = v_tex_coord * bo_size;
        vec4 bo_orig = texture2D(tex0, v_tex_coord, u_lod_bias);

        // ── 1. 시간을 뚝뚝 끊음 (1초에 fps번만 바뀜) ──
        float bo_frame = floor(u_time * max(u_boil_fps, 0.1));
        vec2 bo_fo = vec2(fract(bo_frame * 0.6180339) * 97.0, fract(bo_frame * 0.4142135) * 89.0);

        // ── 2. 자리마다 조금씩 다르게 밀기 (떨림 무늬) ──
        vec2 bo_np = bo_p / max(u_boil_scale, 1.0) + bo_fo;
        vec2 bo_d = vec2(bo_noise(bo_np), bo_noise(bo_np + vec2(31.7, 17.3))) - 0.5;
        vec2 bo_q = bo_p + bo_d * 2.0 * u_boil_amount;

        // ── 3. 살짝 번짐: 가까운 네 곳을 같이 읽음 ──
        vec4 bo_c = bo_tex(bo_q, bo_size);
        if (u_boil_soft > 0.0) {
            float bo_r = 0.75;
            vec4 bo_s = bo_tex(bo_q + vec2(bo_r, 0.0), bo_size) + bo_tex(bo_q - vec2(bo_r, 0.0), bo_size)
                      + bo_tex(bo_q + vec2(0.0, bo_r), bo_size) + bo_tex(bo_q - vec2(0.0, bo_r), bo_size);
            bo_c = mix(bo_c, bo_s * 0.25, clamp(u_boil_soft, 0.0, 1.0) * 0.8);
        }

        // ── 4. 알갱이: 바뀔 때마다 새로 (투명도를 곱한 색이라 그대로 더해도 됨) ──
        if (u_boil_grain > 0.0) {
            vec2 bo_g = floor(bo_p / max(u_boil_grain_size, 1.0));
            float bo_n = bo_hash(bo_g + bo_fo * 3.0) - 0.5;
            bo_c.rgb = clamp(bo_c.rgb + bo_n * u_boil_grain * bo_c.a, vec3(0.0), vec3(bo_c.a));
        }

        gl_FragColor = mix(bo_orig, bo_c, clamp(u_boil_strength, 0.0, 1.0));
    """

    renpy.store.screen_fx.register_shader(SHADER,
        variables=_VARIABLES,
        fragment_functions=_FUNCTIONS,
        vertex_200="""
            v_tex_coord = a_tex_coord;
        """,
        fragment_300=_FRAGMENT)

    class BoilEffect(renpy.store.screen_fx.ShaderEffect):
        order = 52
        with_overlay = False

    _fx = BoilEffect("boil", "지글거림", SHADER, PARAMS, GROUPS, uniform_prefix="u_boil_")
    _fx.export(globals())
    renpy.store.screen_fx.register(_fx)
