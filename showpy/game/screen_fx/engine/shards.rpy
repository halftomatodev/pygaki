## Screen FX — 파편 흩날림(shards) 효과 엔진
##
## 이 파일은 엔진입니다. 고치지 말고 shards_config.rpy에서 설정하세요.
##
## 화면 위로 작은 뾰족한 조각이 바람에 날리듯 흩날립니다.
##   - 깊이 세 겹: 먼 조각은 작고 흐리고 느림, 가까운 조각은 크고 또렷하고 빠름
##   - 조각마다 돌고, 판처럼 뒤집히고, 깜빡임
##   - 화면은 그대로 보이고 그 위에 조각만 얹힘 (어둡게 깔기 dim은 따로)
## 그림·스프라이트 없이 셰이더 한 번으로 그립니다. 화면을 칸으로 나누고 칸마다 해시로 조각 하나.
##
## 이 플러그인이 만드는 이름:
##   store.shards            설정과 함수가 들어 있는 이름공간
##   셰이더 "shards.effect", 유니폼 u_shards_*
##   persistent.shards_off   플레이어가 이 효과를 끈 상태 (shards.Toggle())

init offset = 1

init -100 python in shards:

    VERSION = renpy.store.screen_fx.VERSION

    PARAMS = {
        "strength":     ("float", 1.0),
        "count":        ("float", 90.0),
        "colors":       ("choice", 2, (1, 2, 3)),
        "color":        ("color", "#d22222"),
        "color2":       ("color", "#7a1010"),
        "color3":       ("color", "#ff8a5c"),
        "opacity":      ("float", 0.9),
        "dim":          ("float", 0.0),

        "size_min":     ("float", 3.0),
        "size_max":     ("float", 9.0),
        "thin":         ("float", 0.35),

        "speed":        ("float", 120.0),
        "direction":    ("float", 200.0),
        "spread":       ("float", 0.5),
        "spin":         ("float", 1.0),
        "twinkle":      ("float", 0.4),
        "depth_blur":   ("float", 0.6),
    }

    COLORS = ((1, "1색"), (2, "2색"), (3, "3색"))

    GROUPS = (
        ("양과 색", (
            ("strength", "전체 세기", 0.0, 1.0, 0.01, 2),
            ("count", "조각 수", 0.0, 400.0, 1.0, 0),
            ("colors", "색 수", "options", COLORS),
            ("color", "색 1", "color"),
            ("color2", "색 2", "color"),
            ("color3", "색 3", "color"),
            ("opacity", "조각 진하기", 0.0, 1.0, 0.01, 2),
            ("dim", "화면 어둡게", 0.0, 1.0, 0.01, 2),
            )),
        ("모양", (
            ("size_min", "작은 조각 (픽셀)", 1.0, 40.0, 0.5, 1),
            ("size_max", "큰 조각 (픽셀)", 1.0, 60.0, 0.5, 1),
            ("thin", "가늘기", 0.1, 1.0, 0.01, 2),
            )),
        ("움직임", (
            ("speed", "속도 (픽셀/초)", 0.0, 800.0, 5.0, 0),
            ("direction", "방향 (도)", 0.0, 360.0, 1.0, 0),
            ("spread", "흔들림 폭", 0.0, 1.0, 0.01, 2),
            ("spin", "돌기", 0.0, 5.0, 0.05, 2),
            ("twinkle", "깜빡임", 0.0, 1.0, 0.01, 2),
            ("depth_blur", "먼 조각 흐림", 0.0, 1.0, 0.01, 2),
            )),
        )

    SHADER = "shards.effect"

    _VARIABLES = """
        uniform sampler2D tex0;
        uniform float u_lod_bias;
        uniform float u_time;
        uniform vec2 u_model_size;
        attribute vec2 a_tex_coord;
        varying vec2 v_tex_coord;

        uniform float u_shards_strength;
        uniform float u_shards_count;
        uniform float u_shards_colors;
        uniform vec3 u_shards_color;
        uniform vec3 u_shards_color2;
        uniform vec3 u_shards_color3;
        uniform float u_shards_opacity;
        uniform float u_shards_dim;
        uniform float u_shards_size_min;
        uniform float u_shards_size_max;
        uniform float u_shards_thin;
        uniform float u_shards_speed;
        uniform float u_shards_direction;
        uniform float u_shards_spread;
        uniform float u_shards_spin;
        uniform float u_shards_twinkle;
        uniform float u_shards_depth_blur;
    """

    _FUNCTIONS = """
        float sh_hash(vec2 p) {
            p = fract(p * vec2(443.897, 441.423));
            p += dot(p, p.yx + 19.19);
            return fract((p.x + p.y) * p.x);
        }

        // 조각 하나의 덮는 정도 (0~1). q는 조각 가운데에서 본 자리(픽셀)
        // 길쭉한 마름모의 한쪽 끝을 더 뾰족하게: 깨진 유리 조각 같은 모양
        float sh_shape(vec2 q, float len, float wid, float soft) {
            float x = q.x / len;
            float w = wid * (x > 0.0 ? (1.0 - x) : (1.0 + x * 1.8));
            float d = max(abs(q.y) - w * len, max(x - 1.0, -0.55 - x) * len);
            return 1.0 - smoothstep(-soft, soft, d);
        }

        // 한 겹 그리기. 돌려준 값: rgb는 투명도를 곱한 색, a는 덮는 정도
        // 효과 유니폼은 함수에서 못 읽어서 다 인자로 받음
        vec4 sh_layer(vec2 p, float layer, float cell, float speed, float scale, float alpha, float soft,
                      vec2 dirv, float spread, float spin, float twinkle, float smin, float smax, float thin,
                      float ncol, vec3 c1, vec3 c2, vec3 c3, float t) {
            // 바람 방향을 x축으로 돌린 자리
            vec2 r = vec2(dot(p, dirv), dot(p, vec2(-dirv.y, dirv.x)));
            r.x -= t * speed;
            vec2 id = floor(r / cell);
            vec2 o = vec2(layer * 17.31, layer * 5.77);

            float h0 = sh_hash(id + o);
            if (h0 > 0.75) return vec4(0.0);        // 칸의 1/4은 비움 (고르게 보이지 않게)

            float h1 = sh_hash(id + o + vec2(1.3, 7.1));
            float h2 = sh_hash(id + o + vec2(9.2, 3.4));
            float h3 = sh_hash(id + o + vec2(4.6, 8.8));
            float h4 = sh_hash(id + o + vec2(7.7, 2.2));

            float sz = mix(smin, smax, h3) * scale;
            float margin = min(sz * 1.2 + 2.0, cell * 0.5);

            // 칸 안 자리 + 흔들림 (칸 밖으로 나가지 않게)
            vec2 c = margin + vec2(h1, h2) * max(cell - 2.0 * margin, 0.0);
            float sway = (cell * 0.5 - margin) * spread;
            c.y += sin(t * (0.8 + h4 * 1.7) + h1 * 6.283) * sway;
            c.x += cos(t * (0.6 + h2 * 1.3) + h3 * 6.283) * sway * 0.5;
            vec2 q = r - (id * cell + c);

            // 돌기 + 판처럼 뒤집힘
            float an = h4 * 6.283 + t * spin * (h1 - 0.5) * 4.0;
            float ca = cos(an);
            float sa = sin(an);
            q = vec2(ca * q.x + sa * q.y, -sa * q.x + ca * q.y);
            float flip = abs(cos(t * spin * (0.7 + h2) + h3 * 6.283));
            float wid = thin * max(flip, 0.15);

            float cov = sh_shape(q, sz, wid, soft);
            if (cov <= 0.0) return vec4(0.0);

            // 색 고르기
            float pick = floor(h2 * ncol);
            vec3 col = pick < 0.5 ? c1 : (pick < 1.5 ? c2 : c3);
            // 비스듬히 비친 빛 (뒤집힐 때 반짝)
            col *= 0.75 + 0.5 * flip * (0.6 + 0.4 * h1);

            float tw = 1.0 - twinkle * (0.5 + 0.5 * sin(t * (3.0 + h0 * 9.0) + h3 * 6.283));
            float a = cov * alpha * tw;
            return vec4(col * a, a);
        }
    """

    _FRAGMENT = """
        vec2 sh_size = max(u_model_size, vec2(1.0));
        vec2 sh_p = v_tex_coord * sh_size;
        vec4 sh_orig = texture2D(tex0, v_tex_coord, u_lod_bias);

        float sh_an = radians(u_shards_direction);
        // 0도 = 오른쪽으로, 90도 = 아래로 (화면 좌표)
        vec2 sh_dir = vec2(cos(sh_an), sin(sh_an));
        float sh_ncol = u_shards_colors + 1.0;
        float sh_smin = min(u_shards_size_min, u_shards_size_max);
        float sh_smax = max(u_shards_size_min, u_shards_size_max);

        vec4 sh_acc = vec4(0.0);
        float sh_n = max(u_shards_count, 0.0);
        if (sh_n >= 1.0) {
            float sh_area = sh_size.x * sh_size.y;
            for (int i = 0; i < 3; i++) {
                float L = float(i);                     // 0 먼 겹, 2 가까운 겹
                float scale = 0.45 + 0.35 * L;          // 0.45, 0.8, 1.15
                float lspeed = 0.35 + 0.45 * L;         // 0.35, 0.8, 1.25
                float alpha = 0.55 + 0.225 * L;         // 0.55, 0.775, 1.0
                float soft = 0.6 + u_shards_depth_blur * (2.0 - L) * 1.6;
                float share = (i == 0) ? 0.45 : ((i == 1) ? 0.33 : 0.22);
                float cell = sqrt(sh_area * 0.75 / max(sh_n * share, 0.5));
                cell = max(cell, sh_smax * scale * 2.6 + 6.0);
                vec4 s = sh_layer(sh_p, L, cell, u_shards_speed * lspeed, scale, alpha * u_shards_opacity, soft,
                                  sh_dir, u_shards_spread, u_shards_spin, u_shards_twinkle,
                                  sh_smin, sh_smax, u_shards_thin, sh_ncol,
                                  u_shards_color, u_shards_color2, u_shards_color3, u_time);
                sh_acc = s + sh_acc * (1.0 - s.a);    // 가까운 겹이 위
            }
        }

        // 바탕 어둡게 + 조각 얹기 (투명도를 곱한 색끼리)
        vec4 sh_base = vec4(sh_orig.rgb * (1.0 - clamp(u_shards_dim, 0.0, 1.0)), sh_orig.a);
        vec4 sh_out = sh_acc + sh_base * (1.0 - sh_acc.a);
        gl_FragColor = mix(sh_orig, sh_out, clamp(u_shards_strength, 0.0, 1.0));
    """

    renpy.store.screen_fx.register_shader(SHADER,
        variables=_VARIABLES,
        fragment_functions=_FUNCTIONS,
        vertex_200="""
            v_tex_coord = a_tex_coord;
        """,
        fragment_300=_FRAGMENT)

    class ShardsEffect(renpy.store.screen_fx.ShaderEffect):
        order = 59
        with_overlay = False

    _fx = ShardsEffect("shards", "파편 흩날림", SHADER, PARAMS, GROUPS, uniform_prefix="u_shards_")
    _fx.export(globals())
    renpy.store.screen_fx.register(_fx)
