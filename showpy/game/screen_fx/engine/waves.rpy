################################################################################
## Screen FX — 물결(waves) 효과 엔진
##
## 이 파일은 엔진입니다. 고치지 말고 waves_config.rpy에서 설정하세요.
##
## 잔잔한 물에 돌을 던진 것처럼, 한 점에서 동그란 물결이 퍼져 나가며 화면이 굴절합니다.
## 가운데 물결은 계속 퍼지거나(pulse = 0) 몇 초마다 한 번씩 퍼지고(pulse > 0),
## drops를 켜면 화면 여기저기에 빗방울 물결이 따로 생깁니다. (screen_fx 5.7)
##
## 이 플러그인이 만드는 이름:
##   store.waves             설정과 함수가 들어 있는 이름공간
##   셰이더 "waves.effect", 유니폼 u_waves_*
##   persistent.waves_off    플레이어가 이 효과를 끈 상태 (waves.Toggle())

init offset = 1

init -100 python in waves:

    VERSION = renpy.store.screen_fx.VERSION

    PARAMS = {
        "strength":     ("float", 1.0),
        "center_x":     ("float", 0.5),
        "center_y":     ("float", 0.5),
        "amount":       ("float", 10.0),
        "wavelength":   ("float", 46.0),
        "speed":        ("float", 220.0),
        "decay":        ("float", 1.2),
        "pulse":        ("float", 1.6),
        "rings":        ("float", 3.0),
        "drops":        ("float", 0.0),
        "drop_size":    ("float", 0.6),
        "shine":        ("float", 0.25),
    }

    GROUPS = (
        ("물결", (
            ("strength", "전체 세기", 0.0, 1.0, 0.01, 2),
            ("amount", "굴절 (픽셀)", 0.0, 40.0, 0.5, 1),
            ("wavelength", "물결 간격 (픽셀)", 8.0, 200.0, 1.0, 0),
            ("speed", "퍼지는 속도 (픽셀/초)", 20.0, 800.0, 5.0, 0),
            ("decay", "멀수록 잦아듦", 0.0, 5.0, 0.05, 2),
            ("shine", "비친 빛", 0.0, 1.0, 0.01, 2),
            )),
        ("퍼지는 곳", (
            ("center_x", "가운데 가로 (0~1)", 0.0, 1.0, 0.01, 2),
            ("center_y", "가운데 세로 (0~1)", 0.0, 1.0, 0.01, 2),
            ("pulse", "몇 초마다 (0 = 계속)", 0.0, 6.0, 0.05, 2),
            ("rings", "한 번에 물결 수", 1.0, 8.0, 1.0, 0),
            ("drops", "빗방울", 0.0, 1.0, 0.01, 2),
            ("drop_size", "빗방울 크기", 0.1, 2.0, 0.05, 2),
            )),
        )

    SHADER = "waves.effect"

    _VARIABLES = """
        uniform sampler2D tex0;
        uniform float u_lod_bias;
        uniform float u_time;
        uniform vec2 u_model_size;
        attribute vec2 a_tex_coord;
        varying vec2 v_tex_coord;

        uniform float u_waves_strength;
        uniform float u_waves_center_x;
        uniform float u_waves_center_y;
        uniform float u_waves_amount;
        uniform float u_waves_wavelength;
        uniform float u_waves_speed;
        uniform float u_waves_decay;
        uniform float u_waves_pulse;
        uniform float u_waves_rings;
        uniform float u_waves_drops;
        uniform float u_waves_drop_size;
        uniform float u_waves_shine;
    """

    _FUNCTIONS = """
        float wv_hash(vec2 p) {
            return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
        }

        // 물결 하나의 기울기: d = 가운데에서 거리, r = 앞머리 반지름, len = 물결 띠 길이, w = 물결 간격
        float wv_ring(float d, float r, float len, float w) {
            float x = r - d;
            if (x < 0.0 || x > len) {
                return 0.0;
            }
            float env = sin(3.14159 * x / len);
            return cos(6.28318 * x / w) * env;
        }
    """

    _FRAGMENT = """
        vec2 wv_size = max(u_model_size, vec2(1.0));
        vec4 wv_orig = texture2D(tex0, v_tex_coord, u_lod_bias);
        vec2 wv_p = v_tex_coord * wv_size;
        float wv_w = max(u_waves_wavelength, 2.0);
        float wv_diag = length(wv_size);

        // ── 1. 가운데 물결 ──
        vec2 wv_c = vec2(u_waves_center_x, u_waves_center_y) * wv_size;
        vec2 wv_v = wv_p - wv_c;
        float wv_d = length(wv_v);
        vec2 wv_dir = wv_d > 0.001 ? wv_v / wv_d : vec2(0.0);
        float wv_fall = exp(-u_waves_decay * wv_d / wv_diag * 2.0);
        float wv_s = 0.0;
        if (u_waves_pulse <= 0.0) {
            wv_s = cos(6.28318 * (wv_d - u_time * u_waves_speed) / wv_w) * smoothstep(0.0, wv_w, wv_d);
        } else {
            float wv_len = wv_w * max(u_waves_rings, 1.0);
            for (int k = 0; k < 4; k++) {
                float wv_age = mod(u_time, u_waves_pulse) + float(k) * u_waves_pulse;
                float wv_r = wv_age * u_waves_speed;
                wv_s += wv_ring(wv_d, wv_r, wv_len, wv_w);
            }
        }
        vec2 wv_off = wv_dir * wv_s * wv_fall;
        float wv_h = wv_s * wv_fall;

        // ── 2. 빗방울: 칸마다 정해진 때에 한 번씩 ──
        if (u_waves_drops > 0.0) {
            float wv_cs = 260.0 * max(u_waves_drop_size, 0.1);
            float wv_life = 1.6 * max(u_waves_drop_size, 0.1);
            vec2 wv_base = floor(wv_p / wv_cs - 0.5);
            for (int j = 0; j < 4; j++) {
                vec2 wv_cell = wv_base + vec2(mod(float(j), 2.0), floor(float(j) / 2.0));
                float wv_ph = wv_hash(wv_cell + 3.1);
                float wv_tt = u_time / wv_life + wv_ph;
                float wv_n = floor(wv_tt);
                float wv_age = fract(wv_tt) * wv_life;
                if (wv_hash(wv_cell + wv_n * 7.7) < u_waves_drops) {
                    vec2 wv_dc = (wv_cell + vec2(wv_hash(wv_cell + wv_n), wv_hash(wv_cell - wv_n + 1.3))) * wv_cs;
                    vec2 wv_dv = wv_p - wv_dc;
                    float wv_dd = length(wv_dv);
                    float wv_rs = wv_ring(wv_dd, wv_age * u_waves_speed * 0.6, wv_w * 0.6 * 3.0, wv_w * 0.6);
                    float wv_fade = 1.0 - wv_age / wv_life;
                    wv_rs *= wv_fade * wv_fade * 0.7;
                    wv_off += (wv_dd > 0.001 ? wv_dv / wv_dd : vec2(0.0)) * wv_rs;
                    wv_h += wv_rs;
                }
            }
        }

        // ── 3. 굴절 (가장자리가 비지 않게 살짝 확대) ──
        vec2 wv_margin = vec2(u_waves_amount) / wv_size;
        vec2 wv_uv = 0.5 + (v_tex_coord - 0.5) * (1.0 - 2.0 * wv_margin);
        wv_uv = clamp(wv_uv - wv_off * u_waves_amount / wv_size, vec2(0.0), vec2(1.0));
        vec4 wv_col = texture2D(tex0, wv_uv, u_lod_bias);

        // ── 4. 물결 등성이에 비친 빛 (투명도를 곱한 색이라 a를 곱해서 더함) ──
        float wv_spec = pow(max(wv_h, 0.0), 3.0) * u_waves_shine;
        wv_col.rgb = min(wv_col.rgb + wv_col.a * wv_spec * 0.6, vec3(wv_col.a));

        gl_FragColor = mix(wv_orig, wv_col, clamp(u_waves_strength, 0.0, 1.0));
    """

    renpy.store.screen_fx.register_shader(SHADER,
        variables=_VARIABLES,
        fragment_functions=_FUNCTIONS,
        vertex_200="""
            v_tex_coord = a_tex_coord;
        """,
        fragment_300=_FRAGMENT)

    class WavesEffect(renpy.store.screen_fx.ShaderEffect):
        order = 61
        with_overlay = False

    _fx = WavesEffect("waves", "물결", SHADER, PARAMS, GROUPS, uniform_prefix="u_waves_")
    _fx.export(globals())
    renpy.store.screen_fx.register(_fx)
