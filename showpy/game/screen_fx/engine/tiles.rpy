## Screen FX — 조각 어긋남(tiles) 효과 엔진
##
## 이 파일은 엔진입니다. 고치지 말고 tiles_config.rpy에서 설정하세요.
##
## 화면을 크기가 다른 네모 칸(격자에 맞춘 1×1 ~ 3×2칸)으로 나누고, 칸마다 조금씩 어긋나게 합니다.
##   - 칸마다 조금 밀리거나, 확대되거나, 색이 바뀜
##   - 가끔 칸 하나가 엉뚱한 자리의 그림을 보여 줌
##   - 칸 나눔은 shuffle초마다 새로 (0이면 그대로)
##   - 칸 테두리에 가는 선
## 장면 전환으로도 씁니다: scene bg2 with screen_fx.TileSwap(1.0)
##   → 칸마다 다른 때에 옛 장면에서 새 장면으로 바뀜
##
## 이 플러그인이 만드는 이름:
##   store.tiles               설정과 함수가 들어 있는 이름공간
##   셰이더 "tiles.effect", "tiles.swap", 유니폼 u_tiles_*
##   screen_fx.TileSwap         장면 전환
##   persistent.tiles_off      플레이어가 이 효과를 끈 상태 (tiles.Toggle())

init offset = 1

init -100 python in tiles:

    VERSION = renpy.store.screen_fx.VERSION

    PARAMS = {
        "strength":     ("float", 1.0),
        "grid":         ("float", 80.0),
        "shuffle":      ("float", 1.5),
        "offset":       ("float", 12.0),
        "zoom":         ("float", 0.08),
        "swap":         ("float", 0.08),
        "tint":         ("color", "#ff4d6d"),
        "tint_amount":  ("float", 0.2),
        "lines":        ("float", 0.6),
        "line_width":   ("float", 1.5),
        "line_color":   ("color", "#000000"),
    }

    GROUPS = (
        ("칸", (
            ("strength", "전체 세기", 0.0, 1.0, 0.01, 2),
            ("grid", "기본 칸 크기 (픽셀)", 16.0, 320.0, 1.0, 0),
            ("shuffle", "칸 바꾸기 (초)", 0.0, 10.0, 0.1, 1),
            )),
        ("어긋남", (
            ("offset", "밀림 (픽셀)", 0.0, 80.0, 1.0, 0),
            ("zoom", "칸 안 확대", 0.0, 1.0, 0.01, 2),
            ("swap", "다른 그림 칸 비율", 0.0, 1.0, 0.01, 2),
            ("tint", "물들이는 색", "color"),
            ("tint_amount", "물드는 칸 비율", 0.0, 1.0, 0.01, 2),
            )),
        ("테두리", (
            ("lines", "선 진하기", 0.0, 1.0, 0.01, 2),
            ("line_width", "선 두께 (픽셀)", 0.5, 8.0, 0.25, 2),
            ("line_color", "선 색", "color"),
            )),
        )

    SHADER = "tiles.effect"
    SWAP_SHADER = "tiles.swap"

    ## 칸 나누기 (효과와 전환이 같이 씀)
    _COMMON = """
        float tl_hash(vec2 p) {
            p = fract(p * vec2(443.897, 441.423));
            p += dot(p, p.yx + 19.19);
            return fract((p.x + p.y) * p.x);
        }

        // p가 들어 있는 칸 → (왼쪽 위 x, y, 가로, 세로) 픽셀.
        // 기본 칸 g를 3×2개씩 묶고, 묶음마다 여덟 가지 나눔 중 하나를 고름. ep = 나눔 번호(시간)
        vec4 tl_rect(vec2 p, float g, float ep) {
            vec2 mo = floor(vec2(tl_hash(vec2(ep, 1.7)) * 3.0, tl_hash(vec2(ep, 2.9)) * 2.0)) * g;
            vec2 ms = vec2(3.0, 2.0) * g;
            vec2 q = p + mo;
            vec2 m = floor(q / ms);
            vec2 lc = floor((q - m * ms) / g);
            float pat = floor(tl_hash(m + vec2(ep * 7.31, ep * 3.17)) * 8.0);
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
            return vec4(m * ms + r.xy * g - mo, r.zw * g);
        }

        // 칸 테두리까지의 거리 (픽셀)
        float tl_edge(vec2 p, vec4 r) {
            vec2 e = min(p - r.xy, r.xy + r.zw - p);
            return min(e.x, e.y);
        }

        vec4 tl_read(sampler2D t, vec2 px, vec2 size) {
            vec2 lo = 0.5 / size;
            return texture2D(t, clamp(px / size, lo, 1.0 - lo));
        }
    """

    _VARIABLES = """
        uniform sampler2D tex0;
        uniform float u_lod_bias;
        uniform float u_time;
        uniform vec2 u_model_size;
        attribute vec2 a_tex_coord;
        varying vec2 v_tex_coord;

        uniform float u_tiles_strength;
        uniform float u_tiles_grid;
        uniform float u_tiles_shuffle;
        uniform float u_tiles_offset;
        uniform float u_tiles_zoom;
        uniform float u_tiles_swap;
        uniform vec3 u_tiles_tint;
        uniform float u_tiles_tint_amount;
        uniform float u_tiles_lines;
        uniform float u_tiles_line_width;
        uniform vec3 u_tiles_line_color;
    """

    _FRAGMENT = """
        vec2 tl_size = max(u_model_size, vec2(1.0));
        vec2 tl_p = v_tex_coord * tl_size;
        vec4 tl_orig = texture2D(tex0, v_tex_coord, u_lod_bias);

        float tl_ep = (u_tiles_shuffle > 0.0) ? floor(u_time / u_tiles_shuffle) : 0.0;
        float tl_g = max(u_tiles_grid, 8.0);
        vec4 tl_r = tl_rect(tl_p, tl_g, tl_ep);
        vec2 tl_ctr = tl_r.xy + tl_r.zw * 0.5;
        vec2 tl_id = tl_r.xy + vec2(tl_ep * 13.7, tl_ep * 5.3);

        // ── 칸마다: 밀림, 확대, 다른 그림 ──
        vec2 tl_off = (vec2(tl_hash(tl_id + 0.11), tl_hash(tl_id + 0.37)) - 0.5) * 2.0 * u_tiles_offset;
        float tl_z = 1.0 + u_tiles_zoom * tl_hash(tl_id + 0.59);
        vec2 tl_q = tl_ctr + (tl_p - tl_ctr) / tl_z + tl_off;
        if (tl_hash(tl_id + 0.83) < u_tiles_swap) {
            tl_q += (vec2(tl_hash(tl_id + 1.3), tl_hash(tl_id + 1.9)) - 0.5) * tl_size * 0.6;
        }
        vec4 tl_c = tl_read(tex0, tl_q, tl_size);
        float tl_a = tl_c.a;
        vec3 tl_col = (tl_a > 0.0001) ? tl_c.rgb / tl_a : vec3(0.0);

        // ── 물들이기 ──
        if (tl_hash(tl_id + 2.3) < u_tiles_tint_amount) {
            float tl_l = dot(tl_col, vec3(0.299, 0.587, 0.114));
            tl_col = mix(tl_col, u_tiles_tint * (0.35 + tl_l * 1.2), 0.65);
        }

        // ── 테두리 선 ──
        float tl_e = tl_edge(tl_p, tl_r);
        float tl_w = u_tiles_line_width * 0.5;
        float tl_ln = (1.0 - smoothstep(tl_w - 0.5, tl_w + 0.5, tl_e)) * u_tiles_lines;
        tl_col = mix(tl_col, u_tiles_line_color, tl_ln);
        tl_a = max(tl_a, tl_ln * tl_orig.a);

        vec4 tl_out = vec4(clamp(tl_col, 0.0, 1.0) * tl_a, tl_a);
        gl_FragColor = mix(tl_orig, tl_out, clamp(u_tiles_strength, 0.0, 1.0));
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

        uniform float u_tiles_swap_grid;
        uniform float u_tiles_swap_offset;
        uniform float u_tiles_swap_lines;
        uniform vec3 u_tiles_swap_line_color;
    """

    _SWAP_FRAGMENT = """
        vec2 ts_size = max(u_sfx_swap_size, vec2(1.0));
        vec2 ts_p = v_tex_coord * ts_size;
        vec4 ts_r = tl_rect(ts_p, max(u_tiles_swap_grid, 8.0), 0.0);
        vec2 ts_id = ts_r.xy;

        // 칸마다 바뀌는 때가 다름 (0 ~ 0.6 사이에 시작해서 0.4 동안)
        float ts_start = tl_hash(ts_id + 0.21) * 0.6;
        float ts_t = clamp((u_sfx_swap - ts_start) / 0.4, 0.0, 1.0);
        float ts_hump = 1.0 - abs(ts_t * 2.0 - 1.0);

        // 바뀌는 동안 칸이 조금 밀림
        vec2 ts_off = (vec2(tl_hash(ts_id + 0.5), tl_hash(ts_id + 0.9)) - 0.5) * 2.0 * u_tiles_swap_offset * ts_hump;
        vec4 ts_old = tl_read(tex0, ts_p + ts_off, ts_size);
        vec4 ts_new = tl_read(tex1, ts_p + ts_off, ts_size);
        vec4 ts_c = (ts_t < 0.5) ? ts_old : ts_new;

        // 전환 중에는 칸 테두리 선
        float ts_all = 1.0 - abs(u_sfx_swap * 2.0 - 1.0);
        float ts_ln = (1.0 - smoothstep(0.25, 1.25, tl_edge(ts_p, ts_r))) * u_tiles_swap_lines * clamp(ts_all * 3.0, 0.0, 1.0);
        ts_c.rgb = mix(ts_c.rgb, u_tiles_swap_line_color * ts_c.a, ts_ln);

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
            u_tiles_swap_grid=grid,
            u_tiles_swap_offset=offset,
            u_tiles_swap_lines=lines,
            u_tiles_swap_line_color=renpy.store.screen_fx._rgb(line_color))

    renpy.store.screen_fx.TileSwap = TileSwap

    class TilesEffect(renpy.store.screen_fx.ShaderEffect):
        order = 62
        with_overlay = False

    _fx = TilesEffect("tiles", "조각 어긋남", SHADER, PARAMS, GROUPS, uniform_prefix="u_tiles_")
    _fx.export(globals())
    renpy.store.screen_fx.register(_fx)
