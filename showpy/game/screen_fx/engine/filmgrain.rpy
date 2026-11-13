################################################################################
## Screen FX — 옛날 필름(filmgrain) 효과 엔진
##
## 이 파일은 엔진입니다. 고치지 말고 filmgrain_config.rpy에서 설정하세요.
##
## 오래된 필름 영사기로 튼 것처럼: 필름 입자, 먼지 점, 세로로 긁힌 줄, 가끔 지나가는 머리카락,
## 밝기 깜빡임, 화면이 살짝 흔들리는 것(필름이 덜컹거림), 가장자리 어둡게, 바랜 색.
## 모두 셰이더로 그려서 영상 파일이 필요 없습니다. 초당 fps번만 바뀌어 필름처럼 끊겨 보입니다. (screen_fx 5.7)
##
## 이 플러그인이 만드는 이름:
##   store.filmgrain             설정과 함수가 들어 있는 이름공간
##   셰이더 "filmgrain.effect", 유니폼 u_filmgrain_*
##   persistent.filmgrain_off    플레이어가 이 효과를 끈 상태 (filmgrain.Toggle())

init offset = 1

init -100 python in filmgrain:

    VERSION = renpy.store.screen_fx.VERSION

    PARAMS = {
        "strength":     ("float", 1.0),
        "fps":          ("float", 18.0),
        "grain":        ("float", 0.12),
        "grain_size":   ("float", 1.6),
        "dust":         ("float", 0.35),
        "scratches":    ("float", 0.5),
        "hair":         ("float", 0.3),
        "flicker":      ("float", 0.06),
        "weave":        ("float", 1.5),
        "vignette":     ("float", 0.45),
        "fade":         ("float", 0.35),
        "tint":         ("color", "#e8d9b8"),
        "tint_amount":  ("float", 0.35),
        "dark_dust":    ("float", 0.5),
    }

    GROUPS = (
        ("필름", (
            ("strength", "전체 세기", 0.0, 1.0, 0.01, 2),
            ("fps", "초당 바뀌는 번", 4.0, 30.0, 1.0, 0),
            ("grain", "입자", 0.0, 0.5, 0.01, 2),
            ("grain_size", "입자 크기", 1.0, 5.0, 0.1, 1),
            ("flicker", "밝기 깜빡임", 0.0, 0.3, 0.01, 2),
            ("weave", "덜컹거림 (픽셀)", 0.0, 8.0, 0.1, 1),
            ("vignette", "가장자리 어둡게", 0.0, 1.0, 0.01, 2),
            )),
        ("먼지와 긁힘", (
            ("dust", "먼지 점", 0.0, 1.0, 0.01, 2),
            ("dark_dust", "검은 먼지 비율", 0.0, 1.0, 0.01, 2),
            ("scratches", "세로 긁힘", 0.0, 1.0, 0.01, 2),
            ("hair", "머리카락", 0.0, 1.0, 0.01, 2),
            )),
        ("색", (
            ("fade", "색 바램", 0.0, 1.0, 0.01, 2),
            ("tint", "물드는 색", "color"),
            ("tint_amount", "물드는 정도", 0.0, 1.0, 0.01, 2),
            )),
        )

    SHADER = "filmgrain.effect"

    _VARIABLES = """
        uniform sampler2D tex0;
        uniform float u_lod_bias;
        uniform float u_time;
        uniform vec2 u_model_size;
        attribute vec2 a_tex_coord;
        varying vec2 v_tex_coord;

        uniform float u_filmgrain_strength;
        uniform float u_filmgrain_fps;
        uniform float u_filmgrain_grain;
        uniform float u_filmgrain_grain_size;
        uniform float u_filmgrain_dust;
        uniform float u_filmgrain_scratches;
        uniform float u_filmgrain_hair;
        uniform float u_filmgrain_flicker;
        uniform float u_filmgrain_weave;
        uniform float u_filmgrain_vignette;
        uniform float u_filmgrain_fade;
        uniform vec3 u_filmgrain_tint;
        uniform float u_filmgrain_tint_amount;
        uniform float u_filmgrain_dark_dust;
    """

    _FUNCTIONS = """
        float fg_hash(vec2 p) {
            return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
        }

        float fg_hash1(float n) {
            return fract(sin(n * 91.3458) * 47453.5453);
        }
    """

    _FRAGMENT = """
        vec2 fg_size = max(u_model_size, vec2(1.0));
        vec4 fg_orig = texture2D(tex0, v_tex_coord, u_lod_bias);
        float fg_f = floor(u_time * max(u_filmgrain_fps, 1.0));

        // ── 1. 덜컹거림: 필름이 프레임마다 조금씩 밀림 ──
        vec2 fg_wv = vec2(fg_hash1(fg_f) - 0.5, fg_hash1(fg_f + 7.1) - 0.5) * u_filmgrain_weave;
        fg_wv.y += (fg_hash1(floor(fg_f / 9.0)) > 0.93 ? 1.0 : 0.0) * u_filmgrain_weave * 2.0;
        vec2 fg_margin = vec2(u_filmgrain_weave * 1.5) / fg_size;
        vec2 fg_uv = 0.5 + (v_tex_coord - 0.5) * (1.0 - 2.0 * fg_margin) + fg_wv / fg_size;
        vec4 fg_c = texture2D(tex0, clamp(fg_uv, vec2(0.0), vec2(1.0)), u_lod_bias);
        float fg_a = fg_c.a;
        vec3 fg_rgb = fg_a > 0.001 ? fg_c.rgb / fg_a : vec3(0.0);
        vec2 fg_p = v_tex_coord * fg_size;

        // ── 2. 바랜 색과 물드는 색 ──
        float fg_l = dot(fg_rgb, vec3(0.299, 0.587, 0.114));
        fg_rgb = mix(fg_rgb, vec3(fg_l), u_filmgrain_fade);
        fg_rgb = mix(fg_rgb, fg_rgb * u_filmgrain_tint * 1.15, u_filmgrain_tint_amount);
        fg_rgb = mix(fg_rgb, vec3(0.5), u_filmgrain_fade * 0.15);

        // ── 3. 밝기 깜빡임 ──
        fg_rgb *= 1.0 + (fg_hash1(fg_f + 3.3) - 0.5) * 2.0 * u_filmgrain_flicker;

        // ── 4. 입자 ──
        vec2 fg_g = floor(fg_p / max(u_filmgrain_grain_size, 1.0));
        float fg_n = fg_hash(fg_g + vec2(fg_f * 13.17, fg_f * 7.31)) + fg_hash(fg_g * 1.37 + vec2(fg_f * 3.1, 1.7)) - 1.0;
        fg_rgb += fg_n * u_filmgrain_grain * (0.6 + 0.4 * (1.0 - fg_l));

        // ── 5. 먼지 점: 칸마다 이 프레임에 먼지가 있을지 ──
        float fg_dust = 0.0;
        float fg_dsign = 1.0;
        if (u_filmgrain_dust > 0.0) {
            float fg_cs = 46.0;
            vec2 fg_cell = floor(fg_p / fg_cs);
            float fg_hh = fg_hash(fg_cell + fg_f * 1.731);
            if (fg_hh < u_filmgrain_dust * 0.06) {
                vec2 fg_pos = (fg_cell + vec2(fg_hash(fg_cell + fg_f), fg_hash(fg_cell - fg_f + 4.1)) * 0.7 + 0.15) * fg_cs;
                float fg_r = 0.8 + fg_hash(fg_cell * 2.3 + fg_f) * 3.2;
                vec2 fg_dv = (fg_p - fg_pos) * vec2(1.0, 0.7 + fg_hash(fg_cell + 9.0 + fg_f) * 0.6);
                fg_dust = 1.0 - smoothstep(fg_r * 0.6, fg_r, length(fg_dv));
                fg_dsign = fg_hash(fg_cell + fg_f * 3.0 + 2.0) < u_filmgrain_dark_dust ? -1.0 : 1.0;
            }
        }

        // ── 6. 세로 긁힘: 몇 초씩 같은 자리에 머물며 조금씩 떨림 ──
        float fg_scr = 0.0;
        if (u_filmgrain_scratches > 0.0) {
            for (int k = 0; k < 3; k++) {
                float fg_k = float(k);
                float fg_seg = floor(u_time * (0.4 + fg_k * 0.23) + fg_k * 5.0);
                if (fg_hash1(fg_seg * 3.7 + fg_k) < u_filmgrain_scratches * 0.9) {
                    float fg_x = fg_hash1(fg_seg + fg_k * 11.0) * fg_size.x + (fg_hash1(fg_f + fg_k) - 0.5) * 3.0;
                    float fg_w = 0.6 + fg_hash1(fg_seg * 1.3 + fg_k) * 1.2;
                    float fg_y0 = fg_hash1(fg_seg * 2.1 + fg_k) * 0.6 - 0.2;
                    float fg_y1 = fg_y0 + 0.4 + fg_hash1(fg_seg * 4.9 + fg_k) * 0.8;
                    float fg_on = step(fg_y0, v_tex_coord.y) * step(v_tex_coord.y, fg_y1);
                    float fg_bright = 0.35 + 0.65 * fg_hash(vec2(floor(fg_p.y / 6.0), fg_f + fg_k));
                    fg_scr = max(fg_scr, (1.0 - smoothstep(fg_w * 0.5, fg_w, abs(fg_p.x - fg_x))) * fg_on * fg_bright);
                }
            }
        }

        // ── 7. 머리카락: 가끔 한 프레임씩 꼬불꼬불한 선 ──
        float fg_hair = 0.0;
        if (u_filmgrain_hair > 0.0) {
            float fg_hs = floor(u_time * 1.3);
            if (fg_hash1(fg_hs * 5.3) < u_filmgrain_hair * 0.6 && fg_hash1(fg_f * 1.9) < 0.75) {
                vec2 fg_hc = vec2(fg_hash1(fg_hs + 1.0), fg_hash1(fg_hs + 2.0)) * fg_size;
                vec2 fg_hp = fg_p - fg_hc;
                float fg_ang = fg_hash1(fg_hs + 3.0) * 6.28318;
                vec2 fg_hr = vec2(cos(fg_ang) * fg_hp.x + sin(fg_ang) * fg_hp.y, -sin(fg_ang) * fg_hp.x + cos(fg_ang) * fg_hp.y);
                float fg_len = 60.0 + fg_hash1(fg_hs + 4.0) * 120.0;
                float fg_curve = sin(fg_hr.x * 0.045 + fg_hs) * 18.0 + sin(fg_hr.x * 0.11 + fg_hs * 2.0) * 7.0;
                float fg_hd = abs(fg_hr.y - fg_curve);
                fg_hair = (1.0 - smoothstep(0.5, 1.4, fg_hd)) * (1.0 - smoothstep(fg_len * 0.8, fg_len, abs(fg_hr.x)));
            }
        }

        fg_rgb += fg_dust * fg_dsign * 0.8;
        fg_rgb += fg_scr * 0.45;
        fg_rgb -= fg_hair * 0.55;

        // ── 8. 가장자리 어둡게 ──
        vec2 fg_vc = v_tex_coord - 0.5;
        fg_rgb *= 1.0 - u_filmgrain_vignette * smoothstep(0.15, 0.75, length(fg_vc * vec2(1.0, 0.85)) * 1.25);

        vec4 fg_out = vec4(clamp(fg_rgb, 0.0, 1.0) * fg_a, fg_a);
        gl_FragColor = mix(fg_orig, fg_out, clamp(u_filmgrain_strength, 0.0, 1.0));
    """

    renpy.store.screen_fx.register_shader(SHADER,
        variables=_VARIABLES,
        fragment_functions=_FUNCTIONS,
        vertex_200="""
            v_tex_coord = a_tex_coord;
        """,
        fragment_300=_FRAGMENT)

    class FilmgrainEffect(renpy.store.screen_fx.ShaderEffect):
        order = 64
        with_overlay = False

    _fx = FilmgrainEffect("filmgrain", "옛날 필름", SHADER, PARAMS, GROUPS, uniform_prefix="u_filmgrain_")
    _fx.export(globals())
    renpy.store.screen_fx.register(_fx)
