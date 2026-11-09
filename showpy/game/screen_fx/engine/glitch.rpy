## Screen FX — 무작위 글리치(glitch) 효과 엔진
##
## 이 파일은 엔진입니다. 고치지 말고 glitch_config.rpy에서 설정하세요.
##
## 평소에는 깨끗한 화면이다가, 가끔 무작위로 화면이 망가집니다.
##   - 가로 띠 찢김: 화면이 가로 띠로 잘려 옆으로 밀림
##   - 블록 밀림: 네모 조각이 엉뚱한 자리의 그림을 보여 줌
##   - 색 갈라짐: 빨강, 파랑이 옆으로 갈라짐
## 언제 망가질지는 시간으로 정하는 무작위라서 그림 파일이 필요 없습니다.
##
## 이 플러그인이 만드는 이름:
##   store.glitch            설정과 함수가 들어 있는 이름공간
##   셰이더 "glitch.effect", 유니폼 u_glitch_*
##   persistent.glitch_off   플레이어가 이 효과를 끈 상태 (glitch.Toggle())

init offset = 1

init -100 python in glitch:

    VERSION = renpy.store.screen_fx.VERSION

    PARAMS = {
        "strength":     ("float", 1.0),

        ## 언제
        "rate":         ("float", 0.8),
        "length":       ("float", 0.25),
        "always":       ("bool", False),

        ## 얼마나
        "amount":       ("float", 1.0),
        "tear":         ("float", 40.0),
        "band":         ("float", 24.0),
        "blocks":       ("float", 0.5),
        "block_size":   ("float", 64.0),
        "rgb_split":    ("float", 8.0),
        "noise":        ("float", 0.15),
    }

    GROUPS = (
        ("언제", (
            ("strength", "전체 세기", 0.0, 1.0, 0.01, 2),
            ("rate", "1초에 몇 번", 0.0, 5.0, 0.05, 2),
            ("length", "한 번 길이 (초)", 0.05, 1.0, 0.01, 2),
            ("always", "늘 망가짐", "bool"),
            )),
        ("모양", (
            ("amount", "망가지는 세기", 0.0, 2.0, 0.05, 2),
            ("tear", "띠 밀림 (픽셀)", 0.0, 200.0, 1.0, 0),
            ("band", "띠 두께 (픽셀)", 2.0, 120.0, 1.0, 0),
            ("blocks", "블록 양", 0.0, 1.0, 0.01, 2),
            ("block_size", "블록 크기 (픽셀)", 8.0, 256.0, 1.0, 0),
            ("rgb_split", "색 갈라짐 (픽셀)", 0.0, 40.0, 0.5, 1),
            ("noise", "지지직 줄", 0.0, 1.0, 0.01, 2),
            )),
        )

    SHADER = "glitch.effect"

    _VARIABLES = """
        uniform sampler2D tex0;
        uniform float u_lod_bias;
        uniform float u_time;
        uniform vec2 u_model_size;
        attribute vec2 a_tex_coord;
        varying vec2 v_tex_coord;

        uniform float u_glitch_strength;
        uniform float u_glitch_rate;
        uniform float u_glitch_length;
        uniform float u_glitch_always;
        uniform float u_glitch_amount;
        uniform float u_glitch_tear;
        uniform float u_glitch_band;
        uniform float u_glitch_blocks;
        uniform float u_glitch_block_size;
        uniform float u_glitch_rgb_split;
        uniform float u_glitch_noise;
    """

    _FUNCTIONS = """
        float gc_hash(vec2 p) {
            p = fract(p * vec2(443.897, 441.423));
            p += dot(p, p.yx + 19.19);
            return fract((p.x + p.y) * p.x);
        }

        vec4 gc_tex(vec2 px, vec2 size) {
            vec2 lo = 0.5 / size;
            return texture2D(tex0, clamp(px / size, lo, 1.0 - lo), u_lod_bias);
        }
    """

    _FRAGMENT = """
        vec2 gc_size = max(u_model_size, vec2(1.0));
        vec2 gc_p = v_tex_coord * gc_size;
        vec4 gc_orig = texture2D(tex0, v_tex_coord, u_lod_bias);

        // ── 1. 지금 망가지는 중인지: 시간을 "한 번 길이"로 나눈 칸마다 주사위 ──
        float gc_len = max(u_glitch_length, 0.02);
        float gc_slot = floor(u_time / gc_len);
        float gc_p_on = clamp(u_glitch_rate * gc_len, 0.0, 1.0);
        float gc_on = (u_glitch_always > 0.5) ? 1.0 : step(gc_hash(vec2(gc_slot, 3.7)), gc_p_on);
        // 망가지는 동안에도 1초에 20번 모양이 바뀜
        float gc_sub = floor(u_time * 20.0);
        float gc_e = gc_on * u_glitch_amount * (0.4 + 0.6 * gc_hash(vec2(gc_slot, 9.1)));

        vec4 gc_out = gc_orig;

        if (gc_e > 0.001) {
            vec2 gc_q = gc_p;

            // ── 2. 가로 띠 찢김 ──
            float gc_bh = max(u_glitch_band, 2.0) * (0.5 + gc_hash(vec2(gc_sub, 1.3)));
            float gc_bi = floor(gc_p.y / gc_bh);
            float gc_bh2 = gc_hash(vec2(gc_bi, gc_sub));
            if (gc_bh2 > 0.55) {
                gc_q.x += (gc_hash(vec2(gc_bi + 7.0, gc_sub)) - 0.5) * 2.0 * u_glitch_tear * gc_e;
            }

            // ── 3. 블록 밀림: 엉뚱한 자리의 네모를 가져옴 ──
            vec2 gc_bs = max(u_glitch_block_size, 4.0) * vec2(1.0 + gc_hash(vec2(gc_sub, 5.5)), 0.5 + 0.5 * gc_hash(vec2(gc_sub, 6.6)));
            vec2 gc_cell = floor(gc_q / gc_bs);
            float gc_ch = gc_hash(gc_cell + vec2(gc_sub * 1.7, gc_sub * 0.3));
            float gc_blk = 0.0;
            if (gc_ch < u_glitch_blocks * 0.35 * min(gc_e, 1.0)) {
                vec2 gc_jump = floor((vec2(gc_hash(gc_cell + 11.0 + gc_sub), gc_hash(gc_cell + 23.0 + gc_sub)) - 0.5) * 6.0);
                gc_q += gc_jump * gc_bs;
                gc_blk = 1.0;
            }

            // ── 4. 색 갈라짐 ──
            float gc_s = u_glitch_rgb_split * gc_e * (0.5 + gc_hash(vec2(gc_sub, 2.2)));
            vec4 gc_r = gc_tex(gc_q + vec2(gc_s, 0.0), gc_size);
            vec4 gc_g = gc_tex(gc_q, gc_size);
            vec4 gc_b = gc_tex(gc_q - vec2(gc_s, 0.0), gc_size);
            float gc_a = max(gc_g.a, max(gc_r.a, gc_b.a));
            vec3 gc_col = vec3(gc_r.r, gc_g.g, gc_b.b);

            // 가져온 블록은 가끔 색이 뒤집히거나 한 색만 남음
            if (gc_blk > 0.5) {
                float gc_k = gc_hash(gc_cell + 41.0 + gc_sub);
                if (gc_k < 0.25) gc_col = vec3(gc_a) - gc_col;
                else if (gc_k < 0.5) gc_col = vec3(gc_col.r, 0.0, gc_col.b);
            }

            // ── 5. 지지직 줄: 하얀 가로줄이 잠깐 ──
            if (u_glitch_noise > 0.0) {
                float gc_line = floor(gc_p.y / 2.0);
                float gc_n = gc_hash(vec2(gc_line, gc_sub * 3.1));
                float gc_w = step(1.0 - 0.04 * u_glitch_noise * min(gc_e, 1.0), gc_n);
                gc_col = mix(gc_col, vec3(gc_a), gc_w * gc_hash(vec2(gc_p.x * 0.05, gc_line + gc_sub)));
            }

            gc_out = vec4(min(gc_col, vec3(gc_a)), gc_a);
        }

        gl_FragColor = mix(gc_orig, gc_out, clamp(u_glitch_strength, 0.0, 1.0));
    """

    renpy.store.screen_fx.register_shader(SHADER,
        variables=_VARIABLES,
        fragment_functions=_FUNCTIONS,
        vertex_200="""
            v_tex_coord = a_tex_coord;
        """,
        fragment_300=_FRAGMENT)

    class GlitchEffect(renpy.store.screen_fx.ShaderEffect):
        order = 50
        with_overlay = False

    _fx = GlitchEffect("glitch", "글리치", SHADER, PARAMS, GROUPS, uniform_prefix="u_glitch_")
    _fx.export(globals())
    renpy.store.screen_fx.register(_fx)
