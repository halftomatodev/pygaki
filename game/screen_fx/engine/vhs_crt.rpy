## Screen FX — VHS·CRT 효과(vhs_crt) 엔진
##
## 이 파일은 엔진입니다. 고치지 말고 vhs_crt_config.rpy에서 설정하세요.
##
## 셰이더 원본: "VHS and CRT monitor effect" (Godot Shaders, CC0)
##   https://godotshaders.com/shader/vhs-and-crt-monitor-effect/
## 렌파이용으로 옮기면서 파라미터를 바꿀 수 있게 하고,
## 채도·대비·전체 세기(strength)를 추가로 열어 두었습니다.
##
## 3.0부터 화면에 씌우는 일은 공통 엔진(screen_fx.rpy)이 맡습니다.
## 4.0부터 VHS는 "덮개" 전용입니다. 기본 효과(없음 / ASCII / 레트로 터미널 / 게임보이 …) 위에
## 한 번 더 씌우고, 켜고 끄는 것만 고릅니다. (screen_fx.overlay, 대사 괄호 fx_overlay=True/False)
##
## 이 플러그인이 만드는 이름 (다른 파일과 겹치지 않도록 전부 vhs_crt로 시작):
##   store.vhs_crt          설정과 함수가 들어 있는 이름공간
##   셰이더 "vhs_crt.effect", 유니폼 u_vhs_crt_*
##   persistent.vhs_crt_off  플레이어가 효과를 끈 상태

init offset = 1

init -100 python in vhs_crt:

    VERSION = renpy.store.screen_fx.VERSION

    ## ------------------------------------------------------------------
    ## 값 목록 (설정 파일에 적지 않은 값은 여기 값을 따릅니다)
    ## ------------------------------------------------------------------

    ## 파라미터 이름 → (종류, 기본값)
    ## 종류: "float" 숫자, "bool" 켜기·끄기, "resolution" (가로, 세로) 또는 None
    PARAMS = {
        "strength":               ("float", 1.0),
        "scanlines_opacity":      ("float", 0.4),
        "scanlines_width":        ("float", 0.25),
        "grille_opacity":         ("float", 0.3),
        "resolution":             ("resolution", None),
        "pixelate":               ("bool",  True),
        "roll":                   ("bool",  True),
        "roll_speed":             ("float", 8.0),
        "roll_size":              ("float", 15.0),
        "roll_variation":         ("float", 1.8),
        "distort_intensity":      ("float", 0.05),
        "noise_opacity":          ("float", 0.4),
        "noise_speed":            ("float", 5.0),
        "static_noise_intensity": ("float", 0.06),
        "aberration":             ("float", 0.03),
        "brightness":             ("float", 1.4),
        "discolor":               ("bool",  True),
        "saturation":             ("float", 0.5),
        "contrast":               ("float", 1.2),
        "warp_amount":            ("float", 1.0),
        "clip_warp":              ("bool",  False),
        "vignette_intensity":     ("float", 0.4),
        "vignette_opacity":       ("float", 0.5),
    }

    ## 편집기 막대 (묶음 이름, [(이름, 표시, 최소, 최대, 간격, 소수 자리) 또는 (이름, 표시, 종류)])
    GROUPS = (
        ("기본", (
            ("strength", "전체 세기", 0.0, 1.0, 0.01, 2),
            ("brightness", "밝기 보정", 0.5, 3.0, 0.05, 2),
            ("warp_amount", "가장자리 휘어짐", 0.0, 5.0, 0.1, 1),
            ("pixelate", "도트 느낌", "bool"),
            ("resolution", "주사선 개수", "resolution"),
            )),
        ("주사선", (
            ("scanlines_opacity", "주사선 진하기", 0.0, 1.0, 0.01, 2),
            ("scanlines_width", "주사선 틈", 0.0, 0.5, 0.01, 2),
            ("grille_opacity", "RGB 격자", 0.0, 1.0, 0.01, 2),
            )),
        ("흔들림", (
            ("roll", "흐르는 띠", "bool"),
            ("roll_speed", "띠 속도", -40.0, 40.0, 0.5, 1),
            ("roll_size", "띠 크기", 0.0, 100.0, 1.0, 0),
            ("roll_variation", "띠 모양 변화", 0.1, 5.0, 0.1, 1),
            ("distort_intensity", "화면 밀림", 0.0, 0.2, 0.005, 3),
            )),
        ("노이즈", (
            ("noise_opacity", "지직거림", 0.0, 1.0, 0.01, 2),
            ("noise_speed", "지직 속도", 0.0, 20.0, 0.5, 1),
            ("static_noise_intensity", "자글자글 노이즈", 0.0, 1.0, 0.01, 2),
            )),
        ("색", (
            ("aberration", "색 번짐", -1.0, 1.0, 0.01, 2),
            ("discolor", "바랜 색감", "bool"),
            ("saturation", "바랜 정도", 0.0, 1.0, 0.01, 2),
            ("contrast", "대비", 0.5, 2.0, 0.05, 2),
            )),
        ("가장자리", (
            ("vignette_intensity", "어둡게 하는 범위", 0.0, 2.0, 0.05, 2),
            ("vignette_opacity", "가장자리 어둡기", 0.0, 1.0, 0.01, 2),
            ("clip_warp", "바깥 테두리 투명", "bool"),
            )),
        )

    ## 설정 파일(vhs_crt_config.rpy)에서 define으로 덮어쓰는 값 중 VHS에만 있는 것.
    ## (enabled, settings, presets, warper, redraw, layout은 아래 export가 만듦)
    auto = True
    scope = "all"

    SHADER = "vhs_crt.effect"


    ## ------------------------------------------------------------------
    ## 셰이더
    ## ------------------------------------------------------------------

    _variables = """
        uniform sampler2D tex0;
        uniform float u_lod_bias;
        uniform float u_time;
        attribute vec2 a_tex_coord;
        varying vec2 v_tex_coord;

        uniform float u_vhs_crt_strength;
        uniform float u_vhs_crt_scanlines_opacity;
        uniform float u_vhs_crt_scanlines_width;
        uniform float u_vhs_crt_grille_opacity;
        uniform vec2 u_vhs_crt_resolution;
        uniform float u_vhs_crt_pixelate;
        uniform float u_vhs_crt_roll;
        uniform float u_vhs_crt_roll_speed;
        uniform float u_vhs_crt_roll_size;
        uniform float u_vhs_crt_roll_variation;
        uniform float u_vhs_crt_distort_intensity;
        uniform float u_vhs_crt_noise_opacity;
        uniform float u_vhs_crt_noise_speed;
        uniform float u_vhs_crt_static_noise_intensity;
        uniform float u_vhs_crt_aberration;
        uniform float u_vhs_crt_brightness;
        uniform float u_vhs_crt_discolor;
        uniform float u_vhs_crt_saturation;
        uniform float u_vhs_crt_contrast;
        uniform float u_vhs_crt_warp_amount;
        uniform float u_vhs_crt_clip_warp;
        uniform float u_vhs_crt_vignette_intensity;
        uniform float u_vhs_crt_vignette_opacity;
    """

    _functions = """
        vec2 vhs_crt_random(vec2 uv) {
            uv = vec2(dot(uv, vec2(127.1, 311.7)),
                      dot(uv, vec2(269.5, 183.3)));
            return -1.0 + 2.0 * fract(sin(uv) * 43758.5453123);
        }

        float vhs_crt_noise(vec2 uv) {
            vec2 uv_index = floor(uv);
            vec2 uv_fract = fract(uv);
            vec2 blur = smoothstep(0.0, 1.0, uv_fract);

            return mix(mix(dot(vhs_crt_random(uv_index + vec2(0.0, 0.0)), uv_fract - vec2(0.0, 0.0)),
                           dot(vhs_crt_random(uv_index + vec2(1.0, 0.0)), uv_fract - vec2(1.0, 0.0)), blur.x),
                       mix(dot(vhs_crt_random(uv_index + vec2(0.0, 1.0)), uv_fract - vec2(0.0, 1.0)),
                           dot(vhs_crt_random(uv_index + vec2(1.0, 1.0)), uv_fract - vec2(1.0, 1.0)), blur.x),
                       blur.y) * 0.5 + 0.5;
        }

        vec2 vhs_crt_warp(vec2 uv, float amount) {
            vec2 delta = uv - 0.5;
            float delta2 = dot(delta, delta);
            return uv + delta * (delta2 * delta2 * amount);
        }

        float vhs_crt_border(vec2 uv, float amount) {
            float radius = min(amount, 0.08);
            radius = max(min(abs(radius * 2.0), 1.0), 1e-5);
            vec2 abs_uv = abs(uv * 2.0 - 1.0) - vec2(1.0, 1.0) + radius;
            float dist = length(max(vec2(0.0), abs_uv)) / radius;
            float square = smoothstep(0.96, 1.0, dist);
            return clamp(1.0 - square, 0.0, 1.0);
        }

        float vhs_crt_vignette(vec2 uv, float intensity, float opacity) {
            uv = clamp(uv, 0.0, 1.0);
            uv *= 1.0 - uv;
            float v = max(uv.x * uv.y * 15.0, 1e-6);
            return pow(v, intensity * opacity);
        }
    """

    _fragment = """
        vec2 vc_uv0 = v_tex_coord.xy;
        vec4 vc_orig = texture2D(tex0, vc_uv0, u_lod_bias);
        vec2 vc_res = u_vhs_crt_resolution;

        vec2 vc_uv = vhs_crt_warp(vc_uv0, u_vhs_crt_warp_amount);
        vec2 vc_tuv = vc_uv;
        vec2 vc_roll_uv = vec2(0.0);
        float vc_time = (u_vhs_crt_roll > 0.5) ? u_time : 0.0;

        if (u_vhs_crt_pixelate > 0.5) {
            vc_tuv = ceil(vc_uv * vc_res) / vc_res;
        }

        float vc_roll_line = 0.0;
        if (u_vhs_crt_roll > 0.5 || u_vhs_crt_noise_opacity > 0.0) {
            vc_roll_line = smoothstep(0.3, 0.9, sin(vc_uv.y * u_vhs_crt_roll_size - (vc_time * u_vhs_crt_roll_speed)));
            vc_roll_line *= vc_roll_line * smoothstep(0.3, 0.9, sin(vc_uv.y * u_vhs_crt_roll_size * u_vhs_crt_roll_variation - (vc_time * u_vhs_crt_roll_speed * u_vhs_crt_roll_variation)));
            vc_roll_uv = vec2(vc_roll_line * u_vhs_crt_distort_intensity * (1.0 - vc_uv0.x), 0.0);
        }

        vec2 vc_ab = vec2(u_vhs_crt_aberration, 0.0) * 0.1;
        float vc_r;
        float vc_g;
        float vc_b;
        float vc_a;

        // 텍스처는 투명도가 곱해진 색이라, 투명도로 나눠 원래 색으로 되돌린 뒤 계산합니다.
        // (불투명한 화면에서는 그대로, 반투명한 대사창 등에 씌울 때 두 번 어두워지지 않게)
        vec2 vc_ruv = (u_vhs_crt_roll > 0.5) ? vc_roll_uv : vec2(0.0);
        vec4 vc_sr = texture2D(tex0, vc_tuv + vc_ruv * 0.8 + vc_ab, u_lod_bias);
        vec4 vc_sg = texture2D(tex0, vc_tuv + vc_ruv * 1.2 - vc_ab, u_lod_bias);
        vec4 vc_s = texture2D(tex0, vc_tuv + vc_ruv, u_lod_bias);
        vc_r = vc_sr.r / max(vc_sr.a, 0.0001);
        vc_g = vc_sg.g / max(vc_sg.a, 0.0001);
        vc_b = vc_s.b / max(vc_s.a, 0.0001);
        vc_a = vc_s.a;

        if (u_vhs_crt_grille_opacity > 0.0) {
            float vc_gr = smoothstep(0.85, 0.95, abs(sin(vc_uv.x * (vc_res.x * 3.14159265))));
            vc_r = mix(vc_r, vc_r * vc_gr, u_vhs_crt_grille_opacity);
            float vc_gg = smoothstep(0.85, 0.95, abs(sin(1.05 + vc_uv.x * (vc_res.x * 3.14159265))));
            vc_g = mix(vc_g, vc_g * vc_gg, u_vhs_crt_grille_opacity);
            float vc_gb = smoothstep(0.85, 0.95, abs(sin(2.1 + vc_uv.x * (vc_res.x * 3.14159265))));
            vc_b = mix(vc_b, vc_b * vc_gb, u_vhs_crt_grille_opacity);
        }

        vec3 vc_col = clamp(vec3(vc_r, vc_g, vc_b) * u_vhs_crt_brightness, 0.0, 1.0);

        float vc_scan = 0.5;
        if (u_vhs_crt_scanlines_opacity > 0.0) {
            vc_scan = smoothstep(u_vhs_crt_scanlines_width, u_vhs_crt_scanlines_width + 0.5, abs(sin(vc_uv.y * (vc_res.y * 3.14159265))));
            vc_col = mix(vc_col, vc_col * vec3(vc_scan), u_vhs_crt_scanlines_opacity);
        }

        if (u_vhs_crt_noise_opacity > 0.0) {
            float vc_n = smoothstep(0.4, 0.5, vhs_crt_noise(vc_uv * vec2(2.0, 200.0) + vec2(10.0, u_time * u_vhs_crt_noise_speed)));
            vc_roll_line *= vc_n * vc_scan * clamp(vhs_crt_random((ceil(vc_uv * vc_res) / vc_res) + vec2(u_time * 0.8, 0.0)).x + 0.8, 0.0, 1.0);
            vc_col = clamp(mix(vc_col, vc_col + vc_roll_line, u_vhs_crt_noise_opacity), vec3(0.0), vec3(1.0));
        }

        if (u_vhs_crt_static_noise_intensity > 0.0) {
            vc_col += clamp(vhs_crt_random((ceil(vc_uv * vc_res) / vc_res) + fract(u_time)).x, 0.0, 1.0) * u_vhs_crt_static_noise_intensity;
        }

        float vc_border = vhs_crt_border(vc_uv, u_vhs_crt_warp_amount);
        vc_col *= vc_border;
        vc_col *= vhs_crt_vignette(vc_uv, u_vhs_crt_vignette_intensity, u_vhs_crt_vignette_opacity);

        if (u_vhs_crt_discolor > 0.5) {
            vec3 vc_grey = vec3(vc_col.r + vc_col.g + vc_col.b) / 3.0;
            vc_col = mix(vc_col, vc_grey, u_vhs_crt_saturation);
            float vc_mid = pow(0.5, 2.2);
            vc_col = (vc_col - vec3(vc_mid)) * u_vhs_crt_contrast + vc_mid;
        }

        // 화면 전체에 쓸 때는 불투명(1.0) 그대로, 투명한 부분이 있는 이미지에 쓸 때는
        // 그 투명도를 유지합니다.
        float vc_alpha = vc_a * ((u_vhs_crt_clip_warp > 0.5) ? vc_border : 1.0);
        vec4 vc_fx = vec4(clamp(vc_col, 0.0, 1.0) * vc_alpha, vc_alpha);

        gl_FragColor = mix(vc_orig, vc_fx, clamp(u_vhs_crt_strength, 0.0, 1.0));
    """

    _shader_kwargs = dict(
        variables=_variables,
        fragment_functions=_functions,
        vertex_200="""
            v_tex_coord = a_tex_coord;
        """,
        fragment_300=_fragment,
    )

    renpy.store.screen_fx.register_shader(SHADER, **_shader_kwargs)


    ## ------------------------------------------------------------------
    ## 효과로 등록
    ## ------------------------------------------------------------------

    class VhsEffect(renpy.store.screen_fx.ShaderEffect):
        ## 타이틀/게임 중 범위(scope)와 자동 씌우기(auto)를 씀
        scoped = True
        order = 0
        ## 덮개 전용: 기본 효과 목록에 나오지 않음 (use("vhs_crt")는 "효과 없음 + 덮개 켬"으로 읽음)
        overlay_only = True

    _fx = VhsEffect("vhs_crt", "VHS", SHADER, PARAMS, GROUPS, uniform_prefix="u_vhs_crt_")

    ## vhs_crt.set(), preset(), reset(), off(), on(), values(),
    ## vhs_crt.Set(), Preset(), Toggle(), vhs_crt.effect 를 만듭니다.
    _fx.export(globals())

    renpy.store.screen_fx.register(_fx)

    ## 2.x 세이브 호환: 예전 버전에서 camera at vhs_crt.effect를 쓴 세이브에는
    ## 이 이름의 함수가 들어 있어서, 같은 이름으로 남겨 둡니다.
    _effect_function = renpy.store.screen_fx._Direct("vhs_crt")

    def cur_scope():
        return _fx.cur_scope()

    def apply_layout(lay):
        """(예전 이름) 편집기가 저장한 값을 지금 게임에 적용."""
        _fx.saved = dict(lay)
