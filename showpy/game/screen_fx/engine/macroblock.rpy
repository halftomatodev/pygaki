## Screen FX — 블록 깨짐(macroblock) 효과 엔진 (5.8)
##
## 이 파일은 엔진입니다. 고치지 말고 macroblock_config.rpy에서 설정하세요.
##
## 디지털 영상이 깨질 때처럼 화면이 네모 칸(블록)으로 나뉘고, 무작위 칸이
##   - 한 색으로 뭉개지고 (칸 평균 색)
##   - 가로·세로 줄무늬가 생기고 (압축 무늬)
##   - 엉뚱한 자리의 그림이나 조금 전 자리의 그림이 들어가고 (밀림)
##   - 색이 틀어집니다.
## 평소에는 가끔, "늘 깨짐"을 켜면 계속 깨집니다. 그림 파일이 필요 없습니다.
##
## 이 플러그인이 만드는 이름:
##   store.macroblock            설정과 함수가 들어 있는 이름공간
##   셰이더 "macroblock.effect", 유니폼 u_macroblock_*
##   persistent.macroblock_off   플레이어가 이 효과를 끈 상태 (macroblock.Toggle())

init offset = 1

init -100 python in macroblock:

    VERSION = renpy.store.screen_fx.VERSION

    PARAMS = {
        "strength":     ("float", 1.0),
        "rate":         ("float", 0.6),
        "length":       ("float", 0.4),
        "always":       ("bool", False),
        "block":        ("float", 32.0),
        "amount":       ("float", 0.35),
        "flat":         ("float", 0.6),
        "stripes":      ("float", 0.4),
        "shift":        ("float", 0.5),
        "color":        ("float", 0.25),
    }

    GROUPS = (
        ("언제", (
            ("strength", "전체 세기", 0.0, 1.0, 0.01, 2),
            ("rate", "1초에 몇 번", 0.0, 5.0, 0.05, 2),
            ("length", "한 번 길이 (초)", 0.05, 2.0, 0.01, 2),
            ("always", "늘 깨짐", "bool"),
            )),
        ("모양", (
            ("block", "칸 크기 (픽셀)", 8.0, 128.0, 1.0, 0),
            ("amount", "깨지는 칸의 양", 0.0, 1.0, 0.01, 2),
            ("flat", "한 색 뭉개짐", 0.0, 1.0, 0.01, 2),
            ("stripes", "줄무늬", 0.0, 1.0, 0.01, 2),
            ("shift", "밀림", 0.0, 1.0, 0.01, 2),
            ("color", "색 틀어짐", 0.0, 1.0, 0.01, 2),
            )),
        )

    SHADER = "macroblock.effect"

    _VARIABLES = """
        uniform sampler2D tex0;
        uniform float u_lod_bias;
        uniform float u_time;
        uniform vec2 u_model_size;
        attribute vec2 a_tex_coord;
        varying vec2 v_tex_coord;

        uniform float u_macroblock_strength;
        uniform float u_macroblock_rate;
        uniform float u_macroblock_length;
        uniform float u_macroblock_always;
        uniform float u_macroblock_block;
        uniform float u_macroblock_amount;
        uniform float u_macroblock_flat;
        uniform float u_macroblock_stripes;
        uniform float u_macroblock_shift;
        uniform float u_macroblock_color;
    """

    _FUNCTIONS = """
        float mb_hash(vec2 p) {
            p = fract(p * vec2(443.897, 441.423));
            p += dot(p, p.yx + 19.19);
            return fract((p.x + p.y) * p.x);
        }

        // 투명도를 곱한 색 → 원래 색과 투명도
        vec4 mb_tex(vec2 px, vec2 size) {
            vec2 lo = 0.5 / size;
            vec4 c = texture2D(tex0, clamp(px / size, lo, 1.0 - lo), u_lod_bias);
            return vec4(c.rgb / max(c.a, 0.0001), c.a);
        }
    """

    _FRAGMENT = """
        vec2 mb_size = max(u_model_size, vec2(1.0));
        vec2 mb_p = v_tex_coord * mb_size;
        vec4 mb_orig = texture2D(tex0, v_tex_coord, u_lod_bias);

        // ── 지금 깨지는 중인지: 시간을 "한 번 길이" 칸으로 나눠 주사위 ──
        float mb_len = max(u_macroblock_length, 0.02);
        float mb_slot = floor(u_time / mb_len);
        float mb_on = (u_macroblock_always > 0.5) ? 1.0 : step(mb_hash(vec2(mb_slot, 5.3)), clamp(u_macroblock_rate * mb_len, 0.0, 1.0));
        // 깨진 동안 1초에 8번 모양이 바뀜 (영상 프레임처럼 툭툭)
        float mb_sub = floor(u_time * 8.0);

        vec4 mb_out = mb_orig;
        if (mb_on > 0.5 && u_macroblock_amount > 0.0) {
            float mb_bs = max(u_macroblock_block, 4.0);
            vec2 mb_cell = floor(mb_p / mb_bs);
            vec2 mb_in = mb_p - mb_cell * mb_bs;   // 칸 안 자리 (픽셀)
            // 깨지는 칸: 큰 덩어리(4칸 묶음)로 몰려서 깨짐
            float mb_big = mb_hash(floor(mb_cell / 4.0) + vec2(mb_sub * 0.37, mb_slot));
            float mb_k = mb_hash(mb_cell + vec2(mb_sub, mb_slot * 1.3));
            float mb_hit = step(mb_k, u_macroblock_amount) * step(mb_big, u_macroblock_amount * 1.6 + 0.1);

            if (mb_hit > 0.5) {
                vec2 mb_q = mb_p;
                // 밀림: 다른 칸의 그림을 가져오거나, 같은 줄의 옆 칸을 늘여 씀
                float mb_m = mb_hash(mb_cell + 31.0 + mb_sub);
                if (mb_m < u_macroblock_shift) {
                    vec2 mb_jump = floor((vec2(mb_hash(mb_cell + 7.0 + mb_sub), mb_hash(mb_cell + 13.0 + mb_sub)) - 0.5) * 8.0);
                    if (mb_m < u_macroblock_shift * 0.5) mb_jump.y = 0.0;
                    mb_q += mb_jump * mb_bs;
                }
                vec4 mb_c = mb_tex(mb_q, mb_size);

                // 한 색 뭉개짐: 칸 네 귀퉁이와 가운데의 평균
                if (mb_hash(mb_cell + 47.0 + mb_sub) < u_macroblock_flat) {
                    vec2 mb_o = mb_q - mb_in;
                    vec4 mb_avg = mb_tex(mb_o + vec2(0.5, 0.5) * mb_bs, mb_size)
                                + mb_tex(mb_o + vec2(0.15, 0.15) * mb_bs, mb_size)
                                + mb_tex(mb_o + vec2(0.85, 0.15) * mb_bs, mb_size)
                                + mb_tex(mb_o + vec2(0.15, 0.85) * mb_bs, mb_size)
                                + mb_tex(mb_o + vec2(0.85, 0.85) * mb_bs, mb_size);
                    mb_avg /= 5.0;
                    // 칸 안에서 아주 완만한 기울기만 남김 (압축 블록 느낌)
                    vec3 mb_grad = (mb_tex(mb_o + vec2(0.85, 0.5) * mb_bs, mb_size).rgb - mb_tex(mb_o + vec2(0.15, 0.5) * mb_bs, mb_size).rgb) * (mb_in.x / mb_bs - 0.5);
                    mb_c = vec4(mb_avg.rgb + mb_grad * 0.6, mb_avg.a);
                }

                // 줄무늬: 칸 안에 가로나 세로 코사인 무늬
                if (u_macroblock_stripes > 0.0 && mb_hash(mb_cell + 59.0 + mb_sub) < u_macroblock_stripes) {
                    float mb_f = 1.0 + floor(mb_hash(mb_cell + 61.0) * 4.0);
                    float mb_dir = step(0.5, mb_hash(mb_cell + 67.0 + mb_sub));
                    float mb_t = mix(mb_in.x, mb_in.y, mb_dir) / mb_bs;
                    float mb_w = cos(mb_t * 3.14159265 * mb_f);
                    mb_c.rgb += mb_w * 0.18 * vec3(1.0, 0.9, 1.1);
                }

                // 색 틀어짐: 채널을 바꾸거나 초록·자주로 쏠림
                float mb_cc = mb_hash(mb_cell + 71.0 + mb_sub);
                if (mb_cc < u_macroblock_color) {
                    if (mb_cc < u_macroblock_color * 0.33) mb_c.rgb = mb_c.gbr;
                    else if (mb_cc < u_macroblock_color * 0.66) mb_c.rgb = mb_c.rgb * vec3(0.6, 1.25, 0.7);
                    else mb_c.rgb = mb_c.rgb * vec3(1.2, 0.65, 1.2);
                }

                float mb_a = max(mb_c.a, mb_orig.a);
                mb_out = vec4(clamp(mb_c.rgb, 0.0, 1.0) * mb_a, mb_a);
            }
        }

        gl_FragColor = mix(mb_orig, mb_out, clamp(u_macroblock_strength, 0.0, 1.0));
    """

    renpy.store.screen_fx.register_shader(SHADER,
        variables=_VARIABLES,
        fragment_functions=_FUNCTIONS,
        vertex_200="""
            v_tex_coord = a_tex_coord;
        """,
        fragment_300=_FRAGMENT)

    class MacroblockEffect(renpy.store.screen_fx.ShaderEffect):
        order = 52
        with_overlay = False

    _fx = MacroblockEffect("macroblock", "블록 깨짐", SHADER, PARAMS, GROUPS, uniform_prefix="u_macroblock_")
    _fx.export(globals())
    renpy.store.screen_fx.register(_fx)
