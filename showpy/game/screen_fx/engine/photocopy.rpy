################################################################################
## Screen FX — 복사기(photocopy) 효과 엔진
##
## 이 파일은 엔진입니다. 고치지 말고 photocopy_config.rpy에서 설정하세요.
##
## 여러 번 복사해서 닳은 종이처럼: 밝기가 몇 단계로 뭉개지고(토너가 뭉침), 검은 얼룩과 흰 빈 곳,
## 세로로 끌린 줄, 종이 색, 살짝 어긋난 인쇄. 초당 fps번 바뀌어 복사본을 넘겨 보는 것처럼 보입니다. (screen_fx 5.7)
##
## 이 플러그인이 만드는 이름:
##   store.photocopy             설정과 함수가 들어 있는 이름공간
##   셰이더 "photocopy.effect", 유니폼 u_photocopy_*
##   persistent.photocopy_off    플레이어가 이 효과를 끈 상태 (photocopy.Toggle())

init offset = 1

init -100 python in photocopy:

    VERSION = renpy.store.screen_fx.VERSION

    PARAMS = {
        "strength":     ("float", 1.0),
        "threshold":    ("float", 0.35),
        "contrast":     ("float", 3.0),
        "levels":       ("float", 3.0),
        "toner":        ("float", 0.35),
        "speckle":      ("float", 0.25),
        "streaks":      ("float", 0.4),
        "smear":        ("float", 2.0),
        "paper":        ("color", "#efe9dc"),
        "ink":          ("color", "#1d1b1a"),
        "edge":         ("float", 0.4),
        "fps":          ("float", 8.0),
    }

    GROUPS = (
        ("토너", (
            ("strength", "전체 세기", 0.0, 1.0, 0.01, 2),
            ("threshold", "검게 되는 밝기", 0.0, 1.0, 0.01, 2),
            ("contrast", "대비", 0.5, 10.0, 0.1, 1),
            ("levels", "밝기 단계 (1 = 흑백)", 1.0, 8.0, 1.0, 0),
            ("toner", "토너 얼룩", 0.0, 1.0, 0.01, 2),
            ("speckle", "흰 빈 곳", 0.0, 1.0, 0.01, 2),
            )),
        ("종이", (
            ("streaks", "끌린 줄", 0.0, 1.0, 0.01, 2),
            ("smear", "인쇄 어긋남 (픽셀)", 0.0, 10.0, 0.1, 1),
            ("edge", "가장자리 그림자", 0.0, 1.0, 0.01, 2),
            ("paper", "종이 색", "color"),
            ("ink", "토너 색", "color"),
            ("fps", "초당 바뀌는 번", 0.0, 24.0, 1.0, 0),
            )),
        )

    SHADER = "photocopy.effect"

    _VARIABLES = """
        uniform sampler2D tex0;
        uniform float u_lod_bias;
        uniform float u_time;
        uniform vec2 u_model_size;
        attribute vec2 a_tex_coord;
        varying vec2 v_tex_coord;

        uniform float u_photocopy_strength;
        uniform float u_photocopy_threshold;
        uniform float u_photocopy_contrast;
        uniform float u_photocopy_levels;
        uniform float u_photocopy_toner;
        uniform float u_photocopy_speckle;
        uniform float u_photocopy_streaks;
        uniform float u_photocopy_smear;
        uniform vec3 u_photocopy_paper;
        uniform vec3 u_photocopy_ink;
        uniform float u_photocopy_edge;
        uniform float u_photocopy_fps;
    """

    _FUNCTIONS = """
        float pc_hash(vec2 p) {
            return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
        }

        float pc_noise(vec2 p) {
            vec2 i = floor(p);
            vec2 f = fract(p);
            vec2 u = f * f * (3.0 - 2.0 * f);
            return mix(mix(pc_hash(i), pc_hash(i + vec2(1.0, 0.0)), u.x),
                       mix(pc_hash(i + vec2(0.0, 1.0)), pc_hash(i + vec2(1.0, 1.0)), u.x), u.y);
        }

        float pc_lum(vec4 c) {
            vec3 rgb = c.a > 0.001 ? c.rgb / c.a : vec3(0.0);
            return dot(rgb, vec3(0.299, 0.587, 0.114));
        }
    """

    _FRAGMENT = """
        vec2 pc_size = max(u_model_size, vec2(1.0));
        vec4 pc_orig = texture2D(tex0, v_tex_coord, u_lod_bias);
        vec2 pc_p = v_tex_coord * pc_size;
        float pc_f = u_photocopy_fps > 0.5 ? floor(u_time * u_photocopy_fps) : 0.0;
        vec2 pc_fo = vec2(fract(pc_f * 0.6180339) * 91.0, fract(pc_f * 0.4142135) * 73.0);

        // ── 1. 인쇄 어긋남: 세로로 조금 끌린 두 장을 겹침 ──
        vec2 pc_px = vec2(1.0) / pc_size;
        float pc_l0 = pc_lum(texture2D(tex0, v_tex_coord, u_lod_bias));
        float pc_l1 = pc_lum(texture2D(tex0, clamp(v_tex_coord - vec2(0.0, u_photocopy_smear) * pc_px, vec2(0.0), vec2(1.0)), u_lod_bias));
        float pc_l2 = pc_lum(texture2D(tex0, clamp(v_tex_coord + vec2(u_photocopy_smear * 0.5, 0.0) * pc_px, vec2(0.0), vec2(1.0)), u_lod_bias));
        float pc_l = min(pc_l0, mix(pc_l1, pc_l2, 0.5) + 0.08);

        // ── 2. 토너가 뭉침: 대비를 올리고 몇 단계로 ──
        float pc_n = pc_noise(pc_p / 3.0 + pc_fo) - 0.5;
        float pc_v = clamp((pc_l - u_photocopy_threshold + pc_n * 0.05) * u_photocopy_contrast + 0.5, 0.0, 1.0);
        float pc_lv = max(floor(u_photocopy_levels + 0.5), 1.0);
        pc_v = pc_lv <= 1.0 ? step(0.5, pc_v) : floor(pc_v * pc_lv + 0.5) / pc_lv;

        // ── 3. 검은 얼룩과 흰 빈 곳 ──
        float pc_big = pc_noise(pc_p / 90.0 + pc_fo * 0.3);
        float pc_fine = pc_hash(floor(pc_p / 1.5) + pc_fo);
        float pc_blot = step(1.0 - u_photocopy_toner * 0.08, pc_fine) * step(0.45, pc_big);
        pc_blot = max(pc_blot, step(1.0 - u_photocopy_toner * 0.25, pc_noise(pc_p / 4.0 + pc_fo * 2.0)) * step(0.62, pc_big));
        float pc_hole = step(1.0 - u_photocopy_speckle * 0.03, pc_hash(floor(pc_p / 2.0) + pc_fo + 5.0)) * (1.0 - pc_v) * step(0.5, pc_noise(pc_p / 30.0 + pc_fo));
        pc_v = clamp(pc_v - pc_blot + pc_hole, 0.0, 1.0);

        // ── 4. 세로로 끌린 줄 ──
        float pc_col = floor(pc_p.x / 2.0);
        float pc_st = pc_hash(vec2(pc_col, floor(pc_f / 6.0)));
        float pc_line = step(1.0 - u_photocopy_streaks * 0.04, pc_st) * (0.5 + 0.5 * pc_noise(vec2(pc_col, pc_p.y / 40.0 + pc_fo.x)));
        pc_v = clamp(pc_v - pc_line * 0.7, 0.0, 1.0);

        // ── 5. 가장자리 그림자 (복사기 뚜껑 틈) ──
        vec2 pc_e = min(v_tex_coord, 1.0 - v_tex_coord);
        float pc_edge = 1.0 - smoothstep(0.0, 0.06, min(pc_e.x * pc_size.x / pc_size.y, pc_e.y));
        pc_v *= 1.0 - u_photocopy_edge * pc_edge * (0.6 + 0.4 * pc_noise(pc_p / 12.0));

        vec3 pc_rgb = mix(u_photocopy_ink, u_photocopy_paper, pc_v);
        vec4 pc_out = vec4(pc_rgb * pc_orig.a, pc_orig.a);
        gl_FragColor = mix(pc_orig, pc_out, clamp(u_photocopy_strength, 0.0, 1.0));
    """

    renpy.store.screen_fx.register_shader(SHADER,
        variables=_VARIABLES,
        fragment_functions=_FUNCTIONS,
        vertex_200="""
            v_tex_coord = a_tex_coord;
        """,
        fragment_300=_FRAGMENT)

    class PhotocopyEffect(renpy.store.screen_fx.ShaderEffect):
        order = 66
        with_overlay = False

    _fx = PhotocopyEffect("photocopy", "복사기", SHADER, PARAMS, GROUPS, uniform_prefix="u_photocopy_")
    _fx.export(globals())
    renpy.store.screen_fx.register(_fx)
