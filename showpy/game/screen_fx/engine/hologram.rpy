## Screen FX — 홀로그램(hologram) 효과 엔진
##
## 이 파일은 엔진입니다. 고치지 말고 hologram_config.rpy에서 설정하세요.
##
## 화면(또는 이미지 하나)을 SF 영화의 홀로그램처럼 바꿉니다.
##   - 한 색(기본 하늘색)으로 통일하고 밝은 곳은 하얗게 빛남
##   - 가로 주사선이 천천히 흘러감
##   - 옆으로 번진 복사본 두 겹 + 빛 번짐
##   - 살짝 깜빡이고, 가끔 가로 띠가 옆으로 튐
## 이미지 하나에만 걸 때: show ghost at screen_fx.image_fx("hologram")
##
## 이 플러그인이 만드는 이름:
##   store.hologram            설정과 함수가 들어 있는 이름공간
##   셰이더 "hologram.effect", 유니폼 u_hologram_*
##   persistent.hologram_off   플레이어가 이 효과를 끈 상태 (hologram.Toggle())

init offset = 1

init -100 python in hologram:

    VERSION = renpy.store.screen_fx.VERSION

    PARAMS = {
        "strength":     ("float", 1.0),
        "color":        ("color", "#59d8ff"),
        "brightness":   ("float", 1.3),
        "opacity":      ("float", 1.0),

        "lines":        ("float", 4.0),
        "line_dark":    ("float", 0.45),
        "line_speed":   ("float", 20.0),

        "smear":        ("float", 10.0),
        "smear2":       ("float", 26.0),
        "smear_alpha":  ("float", 0.45),
        "glow":         ("float", 0.5),
        "glow_size":    ("float", 6.0),

        "flicker":      ("float", 0.12),
        "jitter":       ("float", 3.0),
    }

    GROUPS = (
        ("색", (
            ("strength", "전체 세기", 0.0, 1.0, 0.01, 2),
            ("color", "홀로그램 색", "color"),
            ("brightness", "밝기", 0.3, 3.0, 0.05, 2),
            ("opacity", "불투명도", 0.0, 1.0, 0.01, 2),
            )),
        ("주사선", (
            ("lines", "줄 간격 (픽셀)", 2.0, 16.0, 0.5, 1),
            ("line_dark", "줄 진하기", 0.0, 1.0, 0.01, 2),
            ("line_speed", "흐르는 속도", -100.0, 100.0, 1.0, 0),
            )),
        ("번짐", (
            ("smear", "복사본 1 거리", 0.0, 60.0, 1.0, 0),
            ("smear2", "복사본 2 거리", 0.0, 120.0, 1.0, 0),
            ("smear_alpha", "복사본 진하기", 0.0, 1.0, 0.01, 2),
            ("glow", "빛 번짐", 0.0, 2.0, 0.05, 2),
            ("glow_size", "빛 번짐 크기", 1.0, 24.0, 0.5, 1),
            )),
        ("흔들림", (
            ("flicker", "깜빡임", 0.0, 0.5, 0.01, 2),
            ("jitter", "띠 튐 (픽셀)", 0.0, 30.0, 0.5, 1),
            )),
        )

    SHADER = "hologram.effect"

    _VARIABLES = """
        uniform sampler2D tex0;
        uniform float u_lod_bias;
        uniform float u_time;
        uniform vec2 u_model_size;
        attribute vec2 a_tex_coord;
        varying vec2 v_tex_coord;

        uniform float u_hologram_strength;
        uniform vec3 u_hologram_color;
        uniform float u_hologram_brightness;
        uniform float u_hologram_opacity;
        uniform float u_hologram_lines;
        uniform float u_hologram_line_dark;
        uniform float u_hologram_line_speed;
        uniform float u_hologram_smear;
        uniform float u_hologram_smear2;
        uniform float u_hologram_smear_alpha;
        uniform float u_hologram_glow;
        uniform float u_hologram_glow_size;
        uniform float u_hologram_flicker;
        uniform float u_hologram_jitter;
    """

    _FUNCTIONS = """
        float hg_hash(vec2 p) {
            p = fract(p * vec2(443.897, 441.423));
            p += dot(p, p.yx + 19.19);
            return fract((p.x + p.y) * p.x);
        }

        // 투명도를 곱한 그대로 읽음 (바깥은 투명)
        vec4 hg_tex(vec2 px, vec2 size) {
            vec2 uv = px / size;
            if (uv.x < 0.0 || uv.y < 0.0 || uv.x > 1.0 || uv.y > 1.0) return vec4(0.0);
            return texture2D(tex0, uv, u_lod_bias);
        }

        float hg_lum(vec4 c) {
            return dot(c.rgb, vec3(0.299, 0.587, 0.114));
        }
    """

    _FRAGMENT = """
        vec2 hg_size = max(u_model_size, vec2(1.0));
        vec2 hg_p = v_tex_coord * hg_size;
        vec4 hg_orig = texture2D(tex0, v_tex_coord, u_lod_bias);

        // ── 1. 가끔 가로 띠가 옆으로 튐 ──
        float hg_fr = floor(u_time * 12.0);
        float hg_band = floor(hg_p.y / 20.0);
        float hg_jh = hg_hash(vec2(hg_band, hg_fr));
        vec2 hg_q = hg_p;
        if (hg_jh > 0.93) hg_q.x += (hg_hash(vec2(hg_band + 3.0, hg_fr)) - 0.5) * 2.0 * u_hologram_jitter;

        // ── 2. 본체 + 옆으로 번진 복사본 두 겹 ──
        vec4 hg_s0 = hg_tex(hg_q, hg_size);
        vec4 hg_s1 = hg_tex(hg_q - vec2(u_hologram_smear, 0.0), hg_size);
        vec4 hg_s2 = hg_tex(hg_q - vec2(u_hologram_smear2, 0.0), hg_size);
        float hg_sa = u_hologram_smear_alpha;
        float hg_l = hg_lum(hg_s0) + hg_sa * (0.6 * hg_lum(hg_s1) + 0.35 * hg_lum(hg_s2));
        float hg_a = clamp(hg_s0.a + hg_sa * (0.6 * hg_s1.a + 0.35 * hg_s2.a), 0.0, 1.0);

        // ── 3. 빛 번짐: 둘레 여덟 곳의 밝기 ──
        if (u_hologram_glow > 0.0) {
            float hg_r = u_hologram_glow_size;
            float hg_g = 0.0;
            float hg_ga = 0.0;
            for (int i = 0; i < 8; i++) {
                float an = float(i) * 0.785398;
                vec4 s = hg_tex(hg_q + vec2(cos(an), sin(an)) * hg_r, hg_size);
                hg_g += hg_lum(s);
                hg_ga += s.a;
            }
            hg_l += u_hologram_glow * hg_g / 8.0 * 0.8;
            hg_a = max(hg_a, clamp(u_hologram_glow * hg_ga / 8.0 * 0.6, 0.0, 1.0));
        }

        // ── 4. 한 색으로: 밝은 곳은 하얗게 ──
        float hg_b = hg_l * u_hologram_brightness;
        vec3 hg_col = u_hologram_color * (hg_b + 0.08 * hg_a);
        hg_col = mix(hg_col, vec3(hg_a), smoothstep(0.75, 1.3, hg_b) * 0.5);

        // ── 5. 주사선 (천천히 흐름) + 깜빡임 ──
        float hg_ln = max(u_hologram_lines, 1.0);
        float hg_ph = fract((hg_p.y + u_time * u_hologram_line_speed) / hg_ln);
        float hg_lf = 1.0 - u_hologram_line_dark * smoothstep(0.35, 0.65, abs(hg_ph - 0.5) * 2.0);
        float hg_fl = 1.0 + (hg_hash(vec2(floor(u_time * 20.0), 5.0)) - 0.5) * 2.0 * u_hologram_flicker;
        hg_col *= hg_lf * hg_fl;

        hg_a *= clamp(u_hologram_opacity, 0.0, 1.0);
        hg_col *= clamp(u_hologram_opacity, 0.0, 1.0);
        vec4 hg_out = vec4(clamp(hg_col, vec3(0.0), vec3(hg_a)), hg_a);
        gl_FragColor = mix(hg_orig, hg_out, clamp(u_hologram_strength, 0.0, 1.0));
    """

    renpy.store.screen_fx.register_shader(SHADER,
        variables=_VARIABLES,
        fragment_functions=_FUNCTIONS,
        vertex_200="""
            v_tex_coord = a_tex_coord;
        """,
        fragment_300=_FRAGMENT)

    class HologramEffect(renpy.store.screen_fx.ShaderEffect):
        order = 56
        with_overlay = False

    _fx = HologramEffect("hologram", "홀로그램", SHADER, PARAMS, GROUPS, uniform_prefix="u_hologram_")
    _fx.export(globals())
    renpy.store.screen_fx.register(_fx)
