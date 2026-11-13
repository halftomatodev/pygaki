################################################################################
## Screen FX — 그라데이션 맵(gradmap) 효과 엔진
##
## 이 파일은 엔진입니다. 고치지 말고 gradmap_config.rpy에서 설정하세요.
##
## 화면의 밝기만 보고 색을 새로 칠합니다: 어두운 곳은 shadow, 중간은 mid, 밝은 곳은 light 색.
## levels를 올리면 색이 몇 단계로 끊겨 포스터처럼 납작해지고(포스터화), dither로 단계 사이를 점으로 섞습니다.
## 듀오톤(두 색)으로 쓰려면 mid를 shadow와 light의 가운데 색으로 둡니다. (screen_fx 5.7)
##
## 이 플러그인이 만드는 이름:
##   store.gradmap             설정과 함수가 들어 있는 이름공간
##   셰이더 "gradmap.effect", 유니폼 u_gradmap_*
##   persistent.gradmap_off    플레이어가 이 효과를 끈 상태 (gradmap.Toggle())

init offset = 1

init -100 python in gradmap:

    VERSION = renpy.store.screen_fx.VERSION

    PARAMS = {
        "strength":     ("float", 1.0),
        "shadow":       ("color", "#1b0f3a"),
        "mid":          ("color", "#c2185b"),
        "light":        ("color", "#ffe08a"),
        "mid_pos":      ("float", 0.5),
        "brightness":   ("float", 1.0),
        "contrast":     ("float", 1.1),
        "levels":       ("float", 0.0),
        "dither":       ("float", 0.0),
        "shift":        ("float", 0.0),
    }

    GROUPS = (
        ("색", (
            ("strength", "전체 세기", 0.0, 1.0, 0.01, 2),
            ("shadow", "어두운 곳 색", "color"),
            ("mid", "중간 색", "color"),
            ("light", "밝은 곳 색", "color"),
            ("mid_pos", "중간 색 자리", 0.05, 0.95, 0.01, 2),
            )),
        ("밝기", (
            ("brightness", "밝기", 0.2, 2.0, 0.01, 2),
            ("contrast", "대비", 0.2, 3.0, 0.01, 2),
            ("levels", "단계 수 (0 = 부드럽게)", 0.0, 12.0, 1.0, 0),
            ("dither", "단계 사이 점 섞기", 0.0, 1.0, 0.01, 2),
            ("shift", "색이 흐르는 빠르기", 0.0, 1.0, 0.01, 2),
            )),
        )

    SHADER = "gradmap.effect"

    _VARIABLES = """
        uniform sampler2D tex0;
        uniform float u_lod_bias;
        uniform float u_time;
        uniform vec2 u_model_size;
        attribute vec2 a_tex_coord;
        varying vec2 v_tex_coord;

        uniform float u_gradmap_strength;
        uniform vec3 u_gradmap_shadow;
        uniform vec3 u_gradmap_mid;
        uniform vec3 u_gradmap_light;
        uniform float u_gradmap_mid_pos;
        uniform float u_gradmap_brightness;
        uniform float u_gradmap_contrast;
        uniform float u_gradmap_levels;
        uniform float u_gradmap_dither;
        uniform float u_gradmap_shift;
    """

    _FUNCTIONS = """
        // 4x4 바이어 행렬 값 (0 ~ 1)
        float gm_bayer(vec2 p) {
            vec2 q = mod(floor(p), 4.0);
            float a = mod(q.x, 2.0);
            float b = mod(q.y, 2.0);
            float c = mod(floor(q.x / 2.0), 2.0);
            float d = mod(floor(q.y / 2.0), 2.0);
            float v = 8.0 * mod(a + b, 2.0) + 4.0 * b + 2.0 * mod(c + d, 2.0) + d;
            return (v + 0.5) / 16.0;
        }
    """

    _FRAGMENT = """
        vec2 gm_size = max(u_model_size, vec2(1.0));
        vec4 gm_orig = texture2D(tex0, v_tex_coord, u_lod_bias);
        vec3 gm_rgb = gm_orig.a > 0.001 ? gm_orig.rgb / gm_orig.a : vec3(0.0);

        float gm_l = dot(gm_rgb, vec3(0.2126, 0.7152, 0.0722));
        gm_l = clamp(((gm_l - 0.5) * u_gradmap_contrast + 0.5) * u_gradmap_brightness, 0.0, 1.0);
        if (u_gradmap_shift > 0.0) {
            gm_l = fract(gm_l + u_time * u_gradmap_shift * 0.2);
        }

        float gm_n = floor(u_gradmap_levels + 0.5);
        if (gm_n >= 1.0) {
            float gm_d = (gm_bayer(v_tex_coord * gm_size) - 0.5) * u_gradmap_dither;
            gm_l = clamp(floor(gm_l * gm_n + 0.5 + gm_d) / gm_n, 0.0, 1.0);
        }

        float gm_m = clamp(u_gradmap_mid_pos, 0.01, 0.99);
        vec3 gm_col = gm_l < gm_m
            ? mix(u_gradmap_shadow, u_gradmap_mid, gm_l / gm_m)
            : mix(u_gradmap_mid, u_gradmap_light, (gm_l - gm_m) / (1.0 - gm_m));

        vec4 gm_out = vec4(gm_col * gm_orig.a, gm_orig.a);
        gl_FragColor = mix(gm_orig, gm_out, clamp(u_gradmap_strength, 0.0, 1.0));
    """

    renpy.store.screen_fx.register_shader(SHADER,
        variables=_VARIABLES,
        fragment_functions=_FUNCTIONS,
        vertex_200="""
            v_tex_coord = a_tex_coord;
        """,
        fragment_300=_FRAGMENT)

    class GradmapEffect(renpy.store.screen_fx.ShaderEffect):
        order = 68
        with_overlay = False

    _fx = GradmapEffect("gradmap", "그라데이션 맵", SHADER, PARAMS, GROUPS, uniform_prefix="u_gradmap_")
    _fx.export(globals())
    renpy.store.screen_fx.register(_fx)
