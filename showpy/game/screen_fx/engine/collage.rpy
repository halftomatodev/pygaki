## Screen FX — 포토 콜라주(collage) 효과 엔진
##
## 이 파일은 엔진입니다. 고치지 말고 collage_config.rpy에서 설정하세요.
##
## 한 장면을 사진으로 여러 번 찍어 겹쳐 붙인 것처럼 보이게 합니다 (사진 조이너, 포토 콜라주).
##   - 화면 가운데 부분에만 크기가 제각각인 네모 조각(최대 10장)이 겹쳐 놓임. 가장자리는 원래 화면
##   - 조각마다 같은 장면을 조금 밀리고 조금 확대된 채로 보여 줌 (다시 찍은 사진처럼)
##   - 조각마다 밝기와 색이 조금씩 다름, 가는 하얀 테두리, 아래 조각에 옅은 그림자
##   - 위에 놓인 조각이 아래 조각을 가림. 조각은 저마다 다른 때에 새 자리로 바뀜
## 장면 전환도 하나 들어 있습니다: scene bg2 with screen_fx.TileSwap(1.0)
##   → 화면을 칸으로 나눠 칸마다 다른 때에 옛 장면에서 새 장면으로 바뀜
##
## 이 플러그인이 만드는 이름:
##   store.collage              설정과 함수가 들어 있는 이름공간
##   셰이더 "collage.effect", "collage.swap", 유니폼 u_collage_*
##   screen_fx.TileSwap         장면 전환
##   persistent.collage_off     플레이어가 이 효과를 끈 상태 (collage.Toggle())
## 예전 이름 "tiles"(조각 어긋남, 5.2까지)는 이 효과로 바꿔 읽습니다.

init offset = 1

init -100 python in collage:

    VERSION = renpy.store.screen_fx.VERSION

    MAX_PIECES = 10

    PARAMS = {
        "strength":     ("float", 1.0),
        "count":        ("float", 7.0),
        "area":         ("float", 0.6),
        "size_min":     ("float", 0.25),
        "size_max":     ("float", 0.6),
        "strips":       ("float", 0.25),
        "shuffle":      ("float", 1.5),

        "offset":       ("float", 10.0),
        "zoom":         ("float", 0.06),
        "shade":        ("float", 0.12),
        "tint":         ("color", "#9cc4ff"),
        "tint_amount":  ("float", 0.3),

        "lines":        ("float", 0.7),
        "line_width":   ("float", 1.5),
        "line_color":   ("color", "#ffffff"),
        "shadow":       ("float", 0.3),
    }

    GROUPS = (
        ("조각", (
            ("strength", "전체 세기", 0.0, 1.0, 0.01, 2),
            ("count", "조각 수", 1.0, 10.0, 1.0, 0),
            ("area", "가운데 범위", 0.2, 1.0, 0.01, 2),
            ("size_min", "작은 조각", 0.05, 1.0, 0.01, 2),
            ("size_max", "큰 조각", 0.05, 1.0, 0.01, 2),
            ("strips", "가는 띠 비율", 0.0, 1.0, 0.01, 2),
            ("shuffle", "바꾸기 (초)", 0.0, 10.0, 0.1, 1),
            )),
        ("어긋남", (
            ("offset", "밀림 (픽셀)", 0.0, 60.0, 1.0, 0),
            ("zoom", "확대", 0.0, 0.5, 0.01, 2),
            ("shade", "밝기 차이", 0.0, 0.5, 0.01, 2),
            ("tint", "물들이는 색", "color"),
            ("tint_amount", "물드는 조각 비율", 0.0, 1.0, 0.01, 2),
            )),
        ("테두리", (
            ("lines", "선 진하기", 0.0, 1.0, 0.01, 2),
            ("line_width", "선 두께 (픽셀)", 0.5, 6.0, 0.25, 2),
            ("line_color", "선 색", "color"),
            ("shadow", "그림자", 0.0, 1.0, 0.01, 2),
            )),
        )

    SHADER = "collage.effect"
    SWAP_SHADER = "collage.swap"

    _COMMON = """
        float cl_hash(vec2 p) {
            p = fract(p * vec2(443.897, 441.423));
            p += dot(p, p.yx + 19.19);
            return fract((p.x + p.y) * p.x);
        }

        vec4 cl_read(sampler2D t, vec2 px, vec2 size) {
            vec2 lo = 0.5 / size;
            return texture2D(t, clamp(px / size, lo, 1.0 - lo));
        }

        // 네모 테두리까지의 거리 (픽셀). 안이면 +, 밖이면 -
        float cl_inside(vec2 p, vec4 r) {
            vec2 e = min(p - r.xy, r.xy + r.zw - p);
            return min(e.x, e.y);
        }

        // 조각 i의 (왼쪽 위 x, y, 가로, 세로) 픽셀. s = 조각과 그 조각의 바뀐 횟수로 만든 씨앗
        // 효과 유니폼은 함수에서 못 읽어서 인자로 받음
        vec4 cl_piece(vec2 s, vec2 size, float area, float smin, float smax, float strips) {
            vec2 box = size * area;
            vec2 bo = (size - box) * 0.5;
            float h1 = cl_hash(s + vec2(0.13, 0.71));
            float h2 = cl_hash(s + vec2(0.57, 0.29));
            float h3 = cl_hash(s + vec2(0.91, 0.43));
            float h4 = cl_hash(s + vec2(0.37, 0.83));
            vec2 wh = box * vec2(mix(smin, smax, h1), mix(smin, smax, h2));
            if (h3 < strips) {
                // 가는 띠: 한쪽은 가늘게, 다른 쪽은 길게
                float thin = mix(0.03, 0.08, h4);
                float lng = mix(0.35, 0.8, h1);
                wh = (h4 < 0.5) ? box * vec2(lng, thin) : box * vec2(thin, lng);
            }
            wh = min(wh, box);
            // 가운데에 몰리게 (해시 둘의 평균)
            vec2 c = vec2(cl_hash(s + vec2(1.7, 0.3)) + cl_hash(s + vec2(2.9, 1.1)),
                          cl_hash(s + vec2(0.5, 3.7)) + cl_hash(s + vec2(4.1, 2.3))) * 0.5;
            return vec4(bo + c * (box - wh), wh);
        }

        // 타일 전환용 칸: 기본 칸 g를 3×2개씩 묶고 묶음마다 여덟 가지 나눔 중 하나
        vec4 cl_grid(vec2 p, float g) {
            vec2 ms = vec2(3.0, 2.0) * g;
            vec2 m = floor(p / ms);
            vec2 lc = floor((p - m * ms) / g);
            float pat = floor(cl_hash(m) * 8.0);
            vec4 r;
            if (pat < 0.5) r = vec4(0.0, 0.0, 3.0, 2.0);
            else if (pat < 1.5) r = (lc.x < 1.5) ? vec4(0.0, 0.0, 2.0, 2.0) : vec4(2.0, 0.0, 1.0, 2.0);
            else if (pat < 2.5) r = (lc.x < 0.5) ? vec4(0.0, 0.0, 1.0, 2.0) : vec4(1.0, 0.0, 2.0, 2.0);
            else if (pat < 3.5) r = vec4(lc.x, 0.0, 1.0, 2.0);
            else if (pat < 4.5) r = vec4(0.0, lc.y, 3.0, 1.0);
            else if (pat < 5.5) {
                if (lc.y < 0.5) r = (lc.x < 1.5) ? vec4(0.0, 0.0, 2.0, 1.0) : vec4(2.0, 0.0, 1.0, 1.0);
                else r = (lc.x < 0.5) ? vec4(0.0, 1.0, 1.0, 1.0) : vec4(1.0, 1.0, 2.0, 1.0);
            }
            else if (pat < 6.5) r = vec4(lc, 1.0, 1.0);
            else r = (lc.x < 1.5) ? vec4(0.0, 0.0, 2.0, 2.0) : vec4(2.0, lc.y, 1.0, 1.0);
            return vec4(m * ms + r.xy * g, r.zw * g);
        }
    """

    _VARIABLES = """
        uniform sampler2D tex0;
        uniform float u_lod_bias;
        uniform float u_time;
        uniform vec2 u_model_size;
        attribute vec2 a_tex_coord;
        varying vec2 v_tex_coord;

        uniform float u_collage_strength;
        uniform float u_collage_count;
        uniform float u_collage_area;
        uniform float u_collage_size_min;
        uniform float u_collage_size_max;
        uniform float u_collage_strips;
        uniform float u_collage_shuffle;
        uniform float u_collage_offset;
        uniform float u_collage_zoom;
        uniform float u_collage_shade;
        uniform vec3 u_collage_tint;
        uniform float u_collage_tint_amount;
        uniform float u_collage_lines;
        uniform float u_collage_line_width;
        uniform vec3 u_collage_line_color;
        uniform float u_collage_shadow;
    """

    _FRAGMENT = """
        vec2 cl_size = max(u_model_size, vec2(1.0));
        vec2 cl_p = v_tex_coord * cl_size;
        vec4 cl_orig = texture2D(tex0, v_tex_coord, u_lod_bias);

        float cl_n = clamp(floor(u_collage_count + 0.5), 0.0, 10.0);
        float cl_area = clamp(u_collage_area, 0.05, 1.0);
        float cl_smin = clamp(min(u_collage_size_min, u_collage_size_max), 0.02, 1.0);
        float cl_smax = clamp(max(u_collage_size_min, u_collage_size_max), 0.02, 1.0);
        float cl_lw = max(u_collage_line_width, 0.0);
        float cl_sw = 3.0 + cl_lw * 2.0;                       // 그림자 폭 (픽셀)
        vec2 cl_sh = vec2(1.0, 1.5) * (1.0 + cl_lw);           // 그림자는 오른쪽 아래로

        vec4 cl_out = cl_orig;
        for (int i = 0; i < 10; i++) {
            float fi = float(i);
            if (fi < cl_n) {
                // 조각마다 다른 때에 바뀜: 바꾸기 간격도, 시작 때도 조각마다 다름
                float ph = cl_hash(vec2(fi, 9.1));
                float per = u_collage_shuffle * mix(0.7, 1.6, cl_hash(vec2(fi, 5.3)));
                float ep = (u_collage_shuffle > 0.0) ? floor(u_time / per + ph) : 0.0;
                vec2 s = vec2(fi * 7.13 + ep * 0.371, ep * 1.913 + fi * 0.57);
                vec4 r = cl_piece(s, cl_size, cl_area, cl_smin, cl_smax, u_collage_strips);
                float d = cl_inside(cl_p, r);

                if (d >= 0.0) {
                    // 같은 장면을 다시 찍은 것처럼: 조금 밀리고 조금 확대
                    vec2 ctr = r.xy + r.zw * 0.5;
                    vec2 off = (vec2(cl_hash(s + 0.11), cl_hash(s + 0.37)) - 0.5) * 2.0 * u_collage_offset;
                    float z = 1.0 + u_collage_zoom * cl_hash(s + 0.59);
                    vec4 c = cl_read(tex0, ctr + (cl_p - ctr) / z + off, cl_size);
                    float a = c.a;
                    vec3 col = (a > 0.0001) ? c.rgb / a : vec3(0.0);

                    col *= 1.0 + (cl_hash(s + 0.83) - 0.5) * 2.0 * u_collage_shade;
                    if (cl_hash(s + 2.3) < u_collage_tint_amount) {
                        float l = dot(col, vec3(0.299, 0.587, 0.114));
                        col = mix(col, u_collage_tint * (0.3 + l * 1.1), 0.35);
                    }

                    // 가는 테두리 (조각 안쪽 가장자리)
                    float ln = (1.0 - smoothstep(cl_lw - 0.5, cl_lw + 0.5, d)) * u_collage_lines;
                    col = mix(col, u_collage_line_color, ln);
                    a = max(a, ln * cl_orig.a);
                    cl_out = vec4(clamp(col, 0.0, 1.0) * a, a);
                }
                else {
                    // 아래에 깔린 것에 옅은 그림자
                    float ds = -cl_inside(cl_p - cl_sh, r);
                    float sd = (ds <= 0.0) ? 1.0 : (1.0 - smoothstep(0.0, cl_sw, ds));
                    cl_out.rgb *= 1.0 - u_collage_shadow * 0.5 * sd;
                }
            }
        }

        gl_FragColor = mix(cl_orig, cl_out, clamp(u_collage_strength, 0.0, 1.0));
    """

    renpy.store.screen_fx.register_shader(SHADER,
        variables=_VARIABLES,
        fragment_functions=_COMMON,
        vertex_200="""
            v_tex_coord = a_tex_coord;
        """,
        fragment_300=_FRAGMENT)

    ## ── 장면 전환: 칸마다 다른 때에 바뀜 ──

    _SWAP_VARIABLES = """
        uniform sampler2D tex0;
        uniform sampler2D tex1;
        uniform float u_lod_bias;
        uniform float u_sfx_swap;
        uniform vec2 u_sfx_swap_size;
        attribute vec2 a_tex_coord;
        varying vec2 v_tex_coord;

        uniform float u_collage_swap_grid;
        uniform float u_collage_swap_offset;
        uniform float u_collage_swap_lines;
        uniform vec3 u_collage_swap_line_color;
    """

    _SWAP_FRAGMENT = """
        vec2 ts_size = max(u_sfx_swap_size, vec2(1.0));
        vec2 ts_p = v_tex_coord * ts_size;
        vec4 ts_r = cl_grid(ts_p, max(u_collage_swap_grid, 8.0));
        vec2 ts_id = ts_r.xy;

        // 칸마다 바뀌는 때가 다름 (0 ~ 0.6 사이에 시작해서 0.4 동안)
        float ts_start = cl_hash(ts_id + 0.21) * 0.6;
        float ts_t = clamp((u_sfx_swap - ts_start) / 0.4, 0.0, 1.0);
        float ts_hump = 1.0 - abs(ts_t * 2.0 - 1.0);

        // 바뀌는 동안 칸이 조금 밀림
        vec2 ts_off = (vec2(cl_hash(ts_id + 0.5), cl_hash(ts_id + 0.9)) - 0.5) * 2.0 * u_collage_swap_offset * ts_hump;
        vec4 ts_old = cl_read(tex0, ts_p + ts_off, ts_size);
        vec4 ts_new = cl_read(tex1, ts_p + ts_off, ts_size);
        vec4 ts_c = (ts_t < 0.5) ? ts_old : ts_new;

        // 전환 중에는 칸 테두리 선
        float ts_all = 1.0 - abs(u_sfx_swap * 2.0 - 1.0);
        float ts_ln = (1.0 - smoothstep(0.25, 1.25, cl_inside(ts_p, ts_r))) * u_collage_swap_lines * clamp(ts_all * 3.0, 0.0, 1.0);
        ts_c.rgb = mix(ts_c.rgb, u_collage_swap_line_color * ts_c.a, ts_ln);

        gl_FragColor = ts_c;
    """

    renpy.store.screen_fx.register_shader(SWAP_SHADER,
        variables=_SWAP_VARIABLES,
        fragment_functions=_COMMON,
        vertex_200="""
            v_tex_coord = a_tex_coord;
        """,
        fragment_300=_SWAP_FRAGMENT)

    def TileSwap(time=1.0, grid=80.0, offset=16.0, lines=0.6, line_color="#000000"):
        """칸마다 다른 때에 바뀌는 장면 전환.
            scene bg2 with screen_fx.TileSwap(1.0)
            scene bg2 with screen_fx.TileSwap(2.0, grid=120, offset=30, lines=0.0)"""
        return renpy.store.screen_fx.ShaderSwap(SWAP_SHADER, time,
            u_collage_swap_grid=grid,
            u_collage_swap_offset=offset,
            u_collage_swap_lines=lines,
            u_collage_swap_line_color=renpy.store.screen_fx._rgb(line_color))

    renpy.store.screen_fx.TileSwap = TileSwap

    class CollageEffect(renpy.store.screen_fx.ShaderEffect):
        order = 62
        with_overlay = False

    _fx = CollageEffect("collage", "포토 콜라주", SHADER, PARAMS, GROUPS, uniform_prefix="u_collage_")
    _fx.export(globals())
    renpy.store.screen_fx.register(_fx)
    renpy.store.screen_fx.ALIASES["tiles"] = "collage"
