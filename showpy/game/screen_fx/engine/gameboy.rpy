## Screen FX — 게임보이(gameboy) 효과 엔진
##
## 이 파일은 엔진입니다. 고치지 말고 gameboy_config.rpy에서 설정하세요.
##
## 옛날 휴대용 게임기의 LCD 화면처럼 바꿉니다.
##   - 화면을 큰 점으로 나누고, 밝기에 따라 4가지 색(또는 2가지 색)으로만 칠함
##   - 표현 방식 두 가지:
##       "dither" 디더링: 색과 색 사이의 밝기를 점 무늬(바둑판·격자)로 섞어서 표현
##       "pixel"  픽셀화: 무늬 없이 가장 가까운 색으로 딱 끊어서 칠함
##   - LCD 느낌: 점 사이 틈, 점 그림자, 화면 얼룩
##   - 글자 층은 색만 입히고 점으로 쪼개지 않을 수 있음 (text_pixel = False. 대사를 읽을 수 있게)
##
## 참고한 것 (코드는 가져오지 않고 렌파이용으로 새로 썼습니다):
##   - Retro dither (tcmug, godotshaders.com, CC0): 4×4 순서 디더링 무늬
##   - Gameboy Classic Shader (Harlequin, GPL v3): 점 격자, 점 그림자, 꺼진 점이 비치는 LCD 모습
##     (GPL이라 코드를 섞지 않고 생각만 참고)
##
## 이 플러그인이 만드는 이름:
##   store.gameboy           설정과 함수가 들어 있는 이름공간
##   셰이더 "gameboy.effect", 유니폼 u_gb_*
##   persistent.gameboy_off  플레이어가 이 효과를 끈 상태 (gameboy.Toggle())

init offset = 1

init -100 python in gameboy:

    VERSION = renpy.store.screen_fx.VERSION

    ## 값 이름 → (종류, 기본값[, 고를 수 있는 값])
    PARAMS = {
        "strength":         ("float", 1.0),

        ## 화면
        "mode":             ("choice", "dither", ("dither", "pixel")),
        "pixel_size":       ("float", 4.0),
        "dither":           ("choice", "4x4", ("4x4", "8x8")),
        "dither_strength":  ("float", 1.0),
        "text_pixel":       ("bool", False),

        ## 색
        "colors":           ("choice", 4, (4, 2)),
        "color1":           ("color", "#1c3f04"),
        "color2":           ("color", "#456306"),
        "color3":           ("color", "#74870a"),
        "color4":           ("color", "#939f06"),
        "brightness":       ("float", 1.0),
        "contrast":         ("float", 1.0),
        "gamma":            ("float", 1.0),

        ## LCD
        "grid":             ("float", 0.4),
        "grid_width":       ("float", 0.25),
        "shadow":           ("float", 0.4),
        "shadow_offset":    ("float", 0.5),
        "texture":          ("float", 0.2),
    }

    MODES = (("dither", "디더링"), ("pixel", "픽셀화"))
    DITHERS = (("4x4", "4×4"), ("8x8", "8×8"))
    COLORS = ((4, "4색"), (2, "2색"))

    ## 편집기 막대
    GROUPS = (
        ("화면", (
            ("strength", "전체 세기", 0.0, 1.0, 0.01, 2),
            ("mode", "표현 방식", "options", MODES),
            ("pixel_size", "점 크기 (픽셀)", 1.0, 16.0, 1.0, 0),
            ("dither", "디더링 무늬", "options", DITHERS),
            ("dither_strength", "디더링 세기", 0.0, 1.0, 0.01, 2),
            ("text_pixel", "글자도 점으로", "bool"),
            )),
        ("색", (
            ("colors", "색 수", "options", COLORS),
            ("color1", "1 가장 어두운 색", "color"),
            ("color2", "2 어두운 색", "color"),
            ("color3", "3 밝은 색", "color"),
            ("color4", "4 가장 밝은 색", "color"),
            ("brightness", "밝기", 0.2, 3.0, 0.05, 2),
            ("contrast", "대비", 0.2, 3.0, 0.05, 2),
            ("gamma", "감마 (어두운 곳)", 0.2, 3.0, 0.05, 2),
            )),
        ("LCD", (
            ("grid", "점 사이 틈", 0.0, 1.0, 0.01, 2),
            ("grid_width", "틈 두께", 0.0, 0.5, 0.01, 2),
            ("shadow", "점 그림자", 0.0, 1.0, 0.01, 2),
            ("shadow_offset", "그림자 거리 (점 = 1)", 0.0, 2.0, 0.05, 2),
            ("texture", "LCD 얼룩", 0.0, 1.0, 0.01, 2),
            )),
        )

    SHADER = "gameboy.effect"

    ## ── 셰이더 ──

    _VARIABLES = """
        uniform sampler2D tex0;
        uniform float u_lod_bias;
        uniform vec2 u_model_size;
        uniform vec2 u_drawable_size;
        uniform float u_sfx_text;
        attribute vec2 a_tex_coord;
        varying vec2 v_tex_coord;

        uniform float u_gb_strength;
        uniform float u_gb_mode;
        uniform float u_gb_pixel_size;
        uniform float u_gb_dither;
        uniform float u_gb_dither_strength;
        uniform float u_gb_text_pixel;

        uniform float u_gb_colors;
        uniform vec3 u_gb_color1;
        uniform vec3 u_gb_color2;
        uniform vec3 u_gb_color3;
        uniform vec3 u_gb_color4;
        uniform float u_gb_brightness;
        uniform float u_gb_contrast;
        uniform float u_gb_gamma;

        uniform float u_gb_grid;
        uniform float u_gb_grid_width;
        uniform float u_gb_shadow;
        uniform float u_gb_shadow_offset;
        uniform float u_gb_texture;
    """

    _FUNCTIONS = """
        float gb_hash(vec2 p) {
            p = fract(p * vec2(443.897, 441.423));
            p += dot(p, p.yx + 19.19);
            return fract((p.x + p.y) * p.x);
        }

        // 부드러운 얼룩 (값 노이즈)
        float gb_noise(vec2 p) {
            vec2 i = floor(p);
            vec2 f = fract(p);
            f = f * f * (3.0 - 2.0 * f);
            float a = gb_hash(i);
            float b = gb_hash(i + vec2(1.0, 0.0));
            float c = gb_hash(i + vec2(0.0, 1.0));
            float d = gb_hash(i + vec2(1.0, 1.0));
            return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
        }

        // 순서 디더링 무늬 (Bayer). 점 번호 → 0~1 사이의 문턱값
        float gb_bayer2(vec2 a) {
            a = mod(floor(a), 2.0);
            return fract(dot(a, vec2(0.5, a.y * 0.75)));
        }

        float gb_bayer4(vec2 a) {
            return gb_bayer2(a * 0.5) * 0.25 + gb_bayer2(a);
        }

        float gb_bayer8(vec2 a) {
            return gb_bayer4(a * 0.5) * 0.25 + gb_bayer2(a);
        }

        // 투명도가 곱해진 색 → 원래 색
        vec3 gb_unpre(vec4 c) {
            return (c.a > 0.0001) ? c.rgb / c.a : vec3(0.0);
        }

        // 색 → 밝기 (감마, 대비, 밝기 조절 후 0~1). t = (감마, 대비, 밝기)
        float gb_tone(vec3 c, vec3 t) {
            float l = dot(c, vec3(0.2126, 0.7152, 0.0722));
            l = pow(clamp(l, 0.0, 1.0), max(t.x, 0.05));
            l = (l - 0.5) * t.y + 0.5;
            return clamp(l * t.z, 0.0, 1.0);
        }

        // 단계 번호(0 = 가장 어두움) → 팔레트 색. 2색이면 1번과 4번만 씀
        vec3 gb_pal(float k, float n, vec3 c1, vec3 c2, vec3 c3, vec3 c4) {
            float i = floor(k * 3.0 / max(n - 1.0, 1.0) + 0.5);
            if (i < 0.5) return c1;
            if (i < 1.5) return c2;
            if (i < 2.5) return c3;
            return c4;
        }

        // 밝기 → 단계 번호. 디더링이면 점마다 문턱값이 다름
        // d = (표현 방식: 0 디더링 / 1 픽셀화, 무늬: 0 4×4 / 1 8×8, 디더링 세기)
        float gb_level(float l, vec2 cell, float n, vec3 d) {
            float v = l * (n - 1.0);
            float b = floor(v);
            float thr = 0.5;
            if (d.x < 0.5) {
                float m = (d.y < 0.5) ? (gb_bayer4(cell) + 0.5 / 16.0) : (gb_bayer8(cell) + 0.5 / 64.0);
                thr = mix(0.5, m, clamp(d.z, 0.0, 1.0));
            }
            return min(b + step(thr, v - b), n - 1.0);
        }

        // 점 하나의 평균 색 (투명도가 곱해진 채로). 점 안의 네 곳을 읽음
        vec4 gb_dot(vec2 cell, vec2 org, float ps, vec2 size) {
            vec2 c = org + (cell + 0.5) * ps;
            vec2 lo = 0.5 / size;
            vec2 hi = 1.0 - lo;
            if (ps < 2.0) {
                return texture2D(tex0, clamp(c / size, lo, hi), u_lod_bias);
            }
            float o = ps * 0.25;
            vec4 s = texture2D(tex0, clamp((c + vec2(-o, -o)) / size, lo, hi), u_lod_bias);
            s += texture2D(tex0, clamp((c + vec2(o, -o)) / size, lo, hi), u_lod_bias);
            s += texture2D(tex0, clamp((c + vec2(-o, o)) / size, lo, hi), u_lod_bias);
            s += texture2D(tex0, clamp((c + vec2(o, o)) / size, lo, hi), u_lod_bias);
            return s * 0.25;
        }

        // 점 모양: 점 안이면 1, 점 사이 틈(점의 오른쪽·아래 가장자리)이면 0
        // f = 점 안의 위치 0~1, w = 틈 두께(점 크기의 비율), s = 경계 부드럽기
        float gb_dotmask(vec2 f, float w, float s) {
            float x = 1.0 - smoothstep(1.0 - w - s, 1.0 - w + s, f.x);
            float y = 1.0 - smoothstep(1.0 - w - s, 1.0 - w + s, f.y);
            return x * y;
        }
    """

    _FRAGMENT = """
        vec2 gb_uv = v_tex_coord;
        vec4 gb_orig = texture2D(tex0, gb_uv, u_lod_bias);
        vec2 gb_size = max(u_model_size, vec2(1.0));
        float gb_n = (u_gb_colors < 0.5) ? 4.0 : 2.0;
        vec3 gb_tn = vec3(u_gb_gamma, u_gb_contrast, u_gb_brightness);
        vec3 gb_dm = vec3(u_gb_mode, u_gb_dither, u_gb_dither_strength);
        vec4 gb_out;

        if (u_sfx_text > 0.5 && u_gb_text_pixel < 0.5) {

            // ── 글자 층: 색만 입힘 (점으로 쪼개지 않아서 글자가 그대로 읽힘) ──
            float gb_k = floor(gb_tone(gb_unpre(gb_orig), gb_tn) * (gb_n - 1.0) + 0.5);
            gb_out = vec4(gb_pal(gb_k, gb_n, u_gb_color1, u_gb_color2, u_gb_color3, u_gb_color4) * gb_orig.a, gb_orig.a);

        } else {

            // ── 1. 점 나누기: 화면 가운데를 기준으로 점 크기만큼 칸을 나눔 ──
            float gb_ps = max(floor(u_gb_pixel_size + 0.5), 1.0);
            vec2 gb_p = gb_uv * gb_size;
            vec2 gb_org = floor(gb_size * 0.5);
            vec2 gb_cell = floor((gb_p - gb_org) / gb_ps);
            vec2 gb_f = (gb_p - gb_org) / gb_ps - gb_cell;

            // ── 2. 점의 평균 색 → 단계 (디더링 / 픽셀화) → 팔레트 색 ──
            vec4 gb_avg = gb_dot(gb_cell, gb_org, gb_ps, gb_size);
            float gb_a = gb_avg.a;
            float gb_k = gb_level(gb_tone(gb_unpre(gb_avg), gb_tn), gb_cell, gb_n, gb_dm);
            vec3 gb_col = gb_pal(gb_k, gb_n, u_gb_color1, u_gb_color2, u_gb_color3, u_gb_color4);

            // ── 3. 점 사이 틈: 가장 밝은 색보다 조금 더 밝은 바탕이 비침 ──
            // 경계 부드럽기: 실제 화면의 한 픽셀 정도
            float gb_aa = clamp(gb_size.x / max(u_drawable_size.x, 1.0), 0.3, 2.0) * 0.5 / gb_ps;
            float gb_shape = 1.0;
            if (u_gb_grid > 0.0 && u_gb_grid_width > 0.0 && gb_ps >= 2.0) {
                gb_shape = mix(1.0, gb_dotmask(gb_f, u_gb_grid_width, gb_aa), clamp(u_gb_grid, 0.0, 1.0));
            }
            vec3 gb_gap = min(u_gb_color4 * 1.06 + 0.02, vec3(1.0));
            vec3 gb_scr = mix(gb_gap, gb_col, gb_shape);

            // ── 4. 점 그림자: 왼쪽 위에 있는 더 어두운 점의 그림자가 오른쪽 아래로 떨어짐 ──
            if (u_gb_shadow > 0.0 && u_gb_shadow_offset > 0.0) {
                vec2 gb_q = gb_p - vec2(u_gb_shadow_offset * gb_ps);
                vec2 gb_qc = floor((gb_q - gb_org) / gb_ps);
                vec2 gb_qf = (gb_q - gb_org) / gb_ps - gb_qc;
                vec4 gb_qa = gb_dot(gb_qc, gb_org, gb_ps, gb_size);
                float gb_qk = gb_level(gb_tone(gb_unpre(gb_qa), gb_tn), gb_qc, gb_n, gb_dm);
                // 지금 자리의 밝기 단계 (틈이면 가장 밝음)
                float gb_here = mix(gb_n - 1.0, gb_k, gb_shape);
                float gb_dk = clamp((gb_here - gb_qk) / max(gb_n - 1.0, 1.0), 0.0, 1.0) * gb_qa.a;
                // 그림자 모양은 점 모양을 부드럽게 한 것
                float gb_qs = (gb_ps >= 2.0) ? gb_dotmask(gb_qf, u_gb_grid_width * clamp(u_gb_grid, 0.0, 1.0), 0.18) : 1.0;
                gb_scr = mix(gb_scr, u_gb_color1, clamp(u_gb_shadow, 0.0, 1.0) * gb_dk * gb_qs * 0.55);
            }

            // ── 5. LCD 얼룩: 비스듬한 결과 넓은 얼룩 (움직이지 않음) ──
            if (u_gb_texture > 0.0) {
                vec2 gb_r = vec2(gb_p.x * 0.8660 + gb_p.y * 0.5, -gb_p.x * 0.5 + gb_p.y * 0.8660);
                float gb_t = gb_noise(gb_r * vec2(0.012, 0.09)) * 0.55 + gb_noise(gb_p * 0.006 + 17.0) * 0.45;
                gb_scr *= 1.0 + (gb_t - 0.5) * u_gb_texture * 0.35;
            }

            gb_scr = clamp(gb_scr, 0.0, 1.0);
            gb_out = vec4(gb_scr * gb_a, gb_a);
        }

        gl_FragColor = mix(gb_orig, gb_out, clamp(u_gb_strength, 0.0, 1.0));
    """

    renpy.store.screen_fx.register_shader(SHADER,
        variables=_VARIABLES,
        fragment_functions=_FUNCTIONS,
        vertex_200="""
            v_tex_coord = a_tex_coord;
        """,
        fragment_300=_FRAGMENT)

    ## ── 효과로 등록 ──

    class GameboyEffect(renpy.store.screen_fx.ShaderEffect):

        order = 40      # 편집기 버튼 순서 (VHS 0, ASCII 20, 레트로 터미널 30, 이 효과 40)

        def layered(self):
            ## 글자는 색만 입힐 때(text_pixel = False): 아무것도 안 빼도 층마다 씌워서
            ## 장면은 점으로, 글자 층은 색만 바꿈
            return not self.values().get("text_pixel", False)

    _fx = GameboyEffect("gameboy", "게임보이", SHADER, PARAMS, GROUPS, uniform_prefix="u_gb_")

    ## gameboy.set(), preset(), reset(), off(), on(), gameboy.Set(), Preset(), Toggle(), gameboy.effect
    _fx.export(globals())

    renpy.store.screen_fx.register(_fx)
