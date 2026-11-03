## Screen FX — 레트로 터미널(retro_term) 효과 엔진
##
## 이 파일은 엔진입니다. 고치지 말고 retro_term_config.rpy에서 설정하세요.
##
## 옛날 단색 모니터(형광체 화면)로 보는 것처럼 바꿉니다.
##   - 밝기를 형광체 색으로 칠함: 녹색 형광체 + 검은 바탕이면 흰 글자가 녹색으로 빛남
##   - 빛 번짐, 깜빡임, 화면을 지나가는 밝은 줄, 정적 노이즈, 떨림, RGB 어긋남
##   - 화면 결: 주사선 / 픽셀 격자 / RGB 서브픽셀
##   - 곡면 CRT(휘어짐·가장자리 어둡게·둥근 화면 테두리)와 VHS(흐르는 띠·수평 흔들림)를
##     이 효과 안에서 따로 켜고 끔. VHS_CRT 효과(덮개)와는 따로 노는 값입니다.
##
## 참고한 것: cool-retro-term (https://github.com/Swordfish90/cool-retro-term)의 모습과 설정 목록.
##   셰이더 코드는 가져오지 않고 렌파이용으로 새로 썼습니다. (원작은 GPL이라 코드를 섞지 않음)
##
## 이 플러그인이 만드는 이름:
##   store.retro_term           설정과 함수가 들어 있는 이름공간
##   셰이더 "retro_term.effect", 유니폼 u_rt_*
##   persistent.retro_term_off  플레이어가 이 효과를 끈 상태 (retro_term.Toggle())

init offset = 1

init -100 python in retro_term:

    VERSION = renpy.store.screen_fx.VERSION

    ## 값 이름 → (종류, 기본값[, 고를 수 있는 값])
    PARAMS = {
        "strength":         ("float", 1.0),

        ## 색
        "phosphor":         ("color", "#5cff8a"),
        "background":       ("color", "#061208"),
        "color_keep":       ("float", 0.0),
        "brightness":       ("float", 1.1),
        "contrast":         ("float", 1.1),
        "ambient":          ("float", 0.15),

        ## 빛
        "bloom":            ("float", 0.6),
        "bloom_size":       ("float", 3.0),
        "flicker":          ("float", 0.04),
        "glow_line":        ("float", 0.25),
        "glow_line_speed":  ("float", 0.12),

        ## 화면 결
        "raster":           ("choice", "scanlines", ("none", "scanlines", "pixels", "subpixels")),
        "raster_size":      ("float", 3.0),
        "raster_strength":  ("float", 0.45),
        "static_noise":     ("float", 0.06),
        "jitter":           ("float", 0.0),
        "rgb_shift":        ("float", 0.0),

        ## 곡면 CRT
        "crt":              ("bool", True),
        "curvature":        ("float", 0.25),
        "vignette":         ("float", 0.35),
        "frame":            ("bool", True),
        "frame_size":       ("float", 0.035),
        "frame_color":      ("color", "#1c1c1a"),
        "frame_reflect":    ("float", 0.35),
        "corner":           ("float", 0.05),

        ## VHS
        "vhs":              ("bool", False),
        "vhs_roll":         ("float", 0.5),
        "vhs_roll_speed":   ("float", 1.0),
        "vhs_wobble":       ("float", 0.4),
        "vhs_noise":        ("float", 0.4),
    }

    RASTERS = (("none", "없음"), ("scanlines", "주사선"), ("pixels", "픽셀 격자"), ("subpixels", "RGB 서브픽셀"))

    ## 편집기 막대
    GROUPS = (
        ("색", (
            ("strength", "전체 세기", 0.0, 1.0, 0.01, 2),
            ("phosphor", "형광체 색 (글자, 밝은 곳)", "color"),
            ("background", "바탕색 (어두운 곳)", "color"),
            ("color_keep", "원래 색 남기기", 0.0, 1.0, 0.01, 2),
            ("brightness", "밝기", 0.2, 3.0, 0.05, 2),
            ("contrast", "대비", 0.2, 3.0, 0.05, 2),
            ("ambient", "유리에 비친 빛", 0.0, 1.0, 0.01, 2),
            )),
        ("빛", (
            ("bloom", "빛 번짐", 0.0, 2.0, 0.01, 2),
            ("bloom_size", "번짐 크기 (픽셀)", 0.5, 12.0, 0.5, 1),
            ("flicker", "깜빡임", 0.0, 0.5, 0.01, 2),
            ("glow_line", "지나가는 밝은 줄", 0.0, 1.0, 0.01, 2),
            ("glow_line_speed", "밝은 줄 속도", 0.0, 1.0, 0.01, 2),
            )),
        ("화면 결", (
            ("raster", "화면 결", "options", RASTERS),
            ("raster_size", "결 간격 (픽셀)", 1.0, 12.0, 0.5, 1),
            ("raster_strength", "결 진하기", 0.0, 1.0, 0.01, 2),
            ("static_noise", "정적 노이즈", 0.0, 0.5, 0.01, 2),
            ("jitter", "떨림", 0.0, 2.0, 0.05, 2),
            ("rgb_shift", "RGB 어긋남 (픽셀)", 0.0, 6.0, 0.1, 1),
            )),
        ("곡면 CRT", (
            ("crt", "곡면 CRT 켜기", "bool"),
            ("curvature", "휘어짐", 0.0, 1.0, 0.01, 2),
            ("vignette", "가장자리 어둡게", 0.0, 1.0, 0.01, 2),
            ("frame", "화면 테두리", "bool"),
            ("frame_size", "테두리 두께", 0.0, 0.15, 0.005, 3),
            ("frame_color", "테두리 색", "color"),
            ("frame_reflect", "테두리에 비친 빛", 0.0, 1.0, 0.01, 2),
            ("corner", "화면 모서리 둥글기", 0.0, 0.2, 0.005, 3),
            )),
        ("VHS", (
            ("vhs", "VHS 켜기", "bool"),
            ("vhs_roll", "흐르는 띠", 0.0, 1.0, 0.01, 2),
            ("vhs_roll_speed", "띠 속도", 0.0, 4.0, 0.05, 2),
            ("vhs_wobble", "수평 흔들림", 0.0, 2.0, 0.01, 2),
            ("vhs_noise", "띠 지직거림", 0.0, 1.0, 0.01, 2),
            )),
        )

    SHADER = "retro_term.effect"

    ## ── 셰이더 ──

    _VARIABLES = """
        uniform sampler2D tex0;
        uniform float u_lod_bias;
        uniform float u_time;
        uniform vec2 u_model_size;
        uniform float u_sfx_base;
        attribute vec2 a_tex_coord;
        varying vec2 v_tex_coord;

        uniform float u_rt_strength;
        uniform vec3 u_rt_phosphor;
        uniform vec3 u_rt_background;
        uniform float u_rt_color_keep;
        uniform float u_rt_brightness;
        uniform float u_rt_contrast;
        uniform float u_rt_ambient;

        uniform float u_rt_bloom;
        uniform float u_rt_bloom_size;
        uniform float u_rt_flicker;
        uniform float u_rt_glow_line;
        uniform float u_rt_glow_line_speed;

        uniform float u_rt_raster;
        uniform float u_rt_raster_size;
        uniform float u_rt_raster_strength;
        uniform float u_rt_static_noise;
        uniform float u_rt_jitter;
        uniform float u_rt_rgb_shift;

        uniform float u_rt_crt;
        uniform float u_rt_curvature;
        uniform float u_rt_vignette;
        uniform float u_rt_frame;
        uniform float u_rt_frame_size;
        uniform vec3 u_rt_frame_color;
        uniform float u_rt_frame_reflect;
        uniform float u_rt_corner;

        uniform float u_rt_vhs;
        uniform float u_rt_vhs_roll;
        uniform float u_rt_vhs_roll_speed;
        uniform float u_rt_vhs_wobble;
        uniform float u_rt_vhs_noise;
    """

    _FUNCTIONS = """
        float rt_hash(vec2 p) {
            p = fract(p * vec2(443.897, 441.423));
            p += dot(p, p.yx + 19.19);
            return fract((p.x + p.y) * p.x);
        }

        // 투명도가 곱해진 색 → 원래 색
        vec3 rt_unpre(vec4 c) {
            return (c.a > 0.0001) ? c.rgb / c.a : vec3(0.0);
        }

        float rt_luma(vec3 c) {
            return dot(c, vec3(0.2126, 0.7152, 0.0722));
        }

        // 모서리가 둥근 화면 [0,1]x[0,1]까지의 거리 (안쪽이 음수)
        float rt_screen_dist(vec2 uv, float r) {
            vec2 q = abs(uv - 0.5) - (0.5 - r);
            return length(max(q, vec2(0.0))) + min(max(q.x, q.y), 0.0) - r;
        }
    """

    _FRAGMENT = """
        vec2 rt_uv0 = v_tex_coord;
        vec4 rt_orig = texture2D(tex0, rt_uv0, u_lod_bias);
        vec2 rt_px = max(u_model_size, vec2(1.0));
        float rt_t = u_time;

        // ── 1. 화면 좌표: 테두리만큼 줄이고, 곡면으로 휨 ──
        bool rt_crt = u_rt_crt > 0.5;
        float rt_fs = (rt_crt && u_rt_frame > 0.5) ? clamp(u_rt_frame_size, 0.0, 0.3) : 0.0;
        vec2 rt_uv = (rt_uv0 - 0.5) / (1.0 - 2.0 * rt_fs) + 0.5;
        vec2 rt_d = rt_uv - 0.5;
        if (rt_crt) {
            rt_uv = rt_uv + rt_d * dot(rt_d, rt_d) * u_rt_curvature;
        }
        float rt_corner = rt_crt ? clamp(u_rt_corner, 0.0, 0.25) : 0.0;
        float rt_sd = rt_screen_dist(rt_uv, rt_corner);
        float rt_soft = 1.5 / min(rt_px.x, rt_px.y);
        float rt_inside = rt_crt ? (1.0 - smoothstep(-rt_soft, rt_soft, rt_sd)) : 1.0;

        // ── 2. 흔들림: 떨림, VHS 흐르는 띠·수평 흔들림 ──
        vec2 rt_suv = rt_uv;
        if (u_rt_jitter > 0.0) {
            float rt_jf = floor(rt_t * 24.0);
            rt_suv += (vec2(rt_hash(vec2(rt_jf, 1.3)), rt_hash(vec2(rt_jf, 7.1))) - 0.5) * u_rt_jitter * 3.0 / rt_px;
        }
        float rt_band = 0.0;
        if (u_rt_vhs > 0.5) {
            float rt_by = fract(rt_t * 0.08 * u_rt_vhs_roll_speed) * 1.4 - 0.2;
            float rt_dy = abs(rt_suv.y - rt_by);
            rt_band = (1.0 - smoothstep(0.0, 0.07, rt_dy)) * clamp(u_rt_vhs_roll, 0.0, 1.0);
            float rt_w = sin(rt_suv.y * 37.0 + rt_t * 2.3) * 0.6 + sin(rt_suv.y * 151.0 - rt_t * 9.1) * 0.4;
            rt_suv.x += rt_w * u_rt_vhs_wobble * 1.5 / rt_px.x;
            rt_suv.x += rt_band * 10.0 / rt_px.x * sin(rt_suv.y * 400.0 + rt_t * 40.0);
        }

        // ── 3. 원래 그림 읽기 (RGB 어긋남) ──
        vec4 rt_c = texture2D(tex0, rt_suv, u_lod_bias);
        vec3 rt_col = rt_unpre(rt_c);
        if (u_rt_rgb_shift > 0.0) {
            vec2 rt_sh = vec2(u_rt_rgb_shift / rt_px.x, 0.0);
            rt_col.r = rt_unpre(texture2D(tex0, rt_suv + rt_sh, u_lod_bias)).r;
            rt_col.b = rt_unpre(texture2D(tex0, rt_suv - rt_sh, u_lod_bias)).b;
        }
        float rt_a = rt_c.a;

        // ── 4. 밝기 → 형광체 색 ──
        float rt_l = rt_luma(rt_col);
        rt_l = clamp((rt_l - 0.5) * u_rt_contrast + 0.5, 0.0, 1.0) * u_rt_brightness;
        vec3 rt_light = mix(u_rt_phosphor * rt_l, rt_col * u_rt_brightness, clamp(u_rt_color_keep, 0.0, 1.0));

        // ── 5. 화면 결 (곡면을 따라 휨) ──
        vec2 rt_p = rt_uv * rt_px;
        float rt_pitch = max(u_rt_raster_size, 1.0);
        float rt_rs = clamp(u_rt_raster_strength, 0.0, 1.0);
        if (u_rt_raster > 0.5) {
            float rt_sl = 0.5 + 0.5 * cos(6.2831853 * rt_p.y / rt_pitch);
            vec3 rt_mask;
            float rt_mean;
            if (u_rt_raster < 1.5) {
                rt_mask = vec3(rt_sl);
                rt_mean = 0.5;
            } else if (u_rt_raster < 2.5) {
                float rt_sc = 0.5 + 0.5 * cos(6.2831853 * rt_p.x / rt_pitch);
                rt_mask = vec3(rt_sl * rt_sc);
                rt_mean = 0.25;
            } else {
                float rt_k = mod(floor(rt_p.x / max(rt_pitch / 3.0, 0.34)), 3.0);
                rt_mask = vec3(rt_k < 0.5 ? 1.0 : 0.3, (rt_k > 0.5 && rt_k < 1.5) ? 1.0 : 0.3, rt_k > 1.5 ? 1.0 : 0.3);
                rt_mask *= mix(1.0, rt_sl, 0.5);
                rt_mean = 0.4;
            }
            // 결 때문에 어두워진 만큼 밝혀서 전체 밝기는 그대로
            rt_light *= mix(vec3(1.0), rt_mask, rt_rs) / mix(1.0, rt_mean, rt_rs);
        }

        // ── 6. 빛 번짐 (주변 12곳의 밝기를 모아 더함) ──
        vec3 rt_glow = vec3(0.0);
        float rt_glow_a = 0.0;
        if (u_rt_bloom > 0.0) {
            vec2 rt_br = max(u_rt_bloom_size, 0.5) / rt_px;
            vec4 rt_bs = vec4(0.0);
            for (int i = 0; i < 12; i++) {
                float rt_ang = float(i) * 0.5235988 + ((i < 6) ? 0.0 : 0.2617994);
                float rt_rad = (i < 6) ? 1.0 : 2.2;
                rt_bs += texture2D(tex0, rt_suv + vec2(cos(rt_ang), sin(rt_ang)) * rt_br * rt_rad, u_lod_bias);
            }
            rt_bs /= 12.0;
            float rt_bl = rt_luma(rt_bs.rgb);
            vec3 rt_bcol = mix(u_rt_phosphor * rt_bl, rt_bs.rgb, clamp(u_rt_color_keep, 0.0, 1.0));
            rt_glow = rt_bcol * u_rt_bloom * 0.6;
            rt_glow_a = clamp(rt_bs.a * rt_bl * u_rt_bloom, 0.0, 1.0);
        }

        // ── 7. 지나가는 밝은 줄, 정적 노이즈, VHS 띠 지직거림, 깜빡임 ──
        if (u_rt_glow_line > 0.0) {
            float rt_gy = fract(rt_t * u_rt_glow_line_speed) * 1.2 - 0.1;
            float rt_gd = rt_uv.y - rt_gy;
            float rt_g = exp(-abs(rt_gd) * 30.0) + 0.35 * exp(-max(-rt_gd, 0.0) * 6.0) * step(rt_gd, 0.0);
            rt_light += u_rt_phosphor * rt_g * u_rt_glow_line * 0.25;
        }
        if (u_rt_static_noise > 0.0) {
            float rt_n = rt_hash(floor(rt_p) + vec2(fract(rt_t * 7.13) * 311.0, fract(rt_t * 3.71) * 173.0));
            rt_light += u_rt_phosphor * (rt_n - 0.35) * u_rt_static_noise;
        }
        if (rt_band > 0.0) {
            float rt_vn = rt_hash(floor(rt_p * vec2(0.5, 1.0)) + vec2(rt_t * 61.0, 0.0));
            rt_light += u_rt_phosphor * rt_band * u_rt_vhs_noise * rt_vn;
        }
        if (u_rt_flicker > 0.0) {
            rt_light *= 1.0 + (rt_hash(vec2(floor(rt_t * 30.0), 3.7)) - 0.5) * u_rt_flicker * 2.0;
        }

        // ── 8. 바탕색 + 빛, 유리에 비친 빛, 가장자리 어둡게 ──
        float rt_r = length(rt_d);
        vec3 rt_scr = u_rt_background + max(rt_light, vec3(0.0));
        rt_scr += u_rt_phosphor * u_rt_ambient * 0.2 * (1.0 - smoothstep(0.0, 0.8, rt_r));
        if (rt_crt) {
            rt_scr *= 1.0 - clamp(u_rt_vignette, 0.0, 1.0) * smoothstep(0.25, 0.75, rt_r);
        }
        rt_scr = clamp(rt_scr, 0.0, 1.0);

        // 투명도: 그림이 있는 곳만 (투명한 층에 씌워도 바탕색이 다른 층을 덮지 않게)
        vec4 rt_screen = vec4(rt_scr * rt_a, rt_a);
        rt_screen.rgb += rt_glow;
        rt_screen.a = clamp(rt_screen.a + rt_glow_a * (1.0 - rt_screen.a), 0.0, 1.0);
        rt_screen.rgb = min(rt_screen.rgb, vec3(rt_screen.a));

        // ── 9. 화면 바깥: 테두리 ──
        vec4 rt_out = rt_screen;
        if (rt_crt) {
            vec3 rt_bez = vec3(0.0);
            if (u_rt_frame > 0.5) {
                vec2 rt_e = clamp(rt_uv, vec2(0.02), vec2(0.98));
                float rt_el = rt_luma(rt_unpre(texture2D(tex0, rt_e, u_lod_bias)));
                float rt_fall = exp(-max(rt_sd, 0.0) * 40.0);
                rt_bez = u_rt_frame_color * (0.75 + 0.25 * (1.0 - smoothstep(0.3, 0.75, length(rt_uv0 - 0.5))));
                rt_bez += u_rt_phosphor * rt_el * u_rt_frame_reflect * 0.35 * rt_fall;
                rt_bez = clamp(rt_bez, 0.0, 1.0);
            }
            // 테두리는 바탕이 되는 층(화면 전체·장면)에만 칠함. 위에 겹치는 글자 층은 투명하게
            float rt_ba = (u_sfx_base > 0.5) ? rt_orig.a : 0.0;
            vec4 rt_bezel = vec4(rt_bez * rt_ba, rt_ba);
            rt_out = mix(rt_bezel, rt_screen, rt_inside);
        }

        gl_FragColor = mix(rt_orig, rt_out, clamp(u_rt_strength, 0.0, 1.0));
    """

    renpy.store.screen_fx.register_shader(SHADER,
        variables=_VARIABLES,
        fragment_functions=_FUNCTIONS,
        vertex_200="""
            v_tex_coord = a_tex_coord;
        """,
        fragment_300=_FRAGMENT)

    ## ── 효과로 등록 ──

    _fx = renpy.store.screen_fx.ShaderEffect("retro_term", "레트로 터미널", SHADER, PARAMS, GROUPS, uniform_prefix="u_rt_")
    _fx.order = 30      # 편집기 버튼 순서 (VHS 0, ASCII 20, 이 효과 30, 게임보이 40)
    _fx.with_overlay = False    # 자체 곡면 CRT·VHS가 있어서 덮개(VHS)는 기본으로 끔 (retro_term.overlay로 바꿈)

    ## retro_term.set(), preset(), reset(), off(), on(), retro_term.Set(), Preset(), Toggle(), retro_term.effect
    _fx.export(globals())

    renpy.store.screen_fx.register(_fx)
