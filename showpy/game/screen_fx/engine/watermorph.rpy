################################################################################
## Screen FX — 타이틀 일렁임(watermorph) 엔진
##
## 이 파일은 고칠 필요가 없습니다. 설정은 watermorph_config.rpy에서 하세요.
##
## 타이틀 화면을 투명한 액체 너머로 보는 것처럼 일렁이게 합니다.
## 액체 표면의 높낮이를 시간에 따라 바뀌는 노이즈로 만들고, 그 기울기만큼
## 화면을 밀어 굴절처럼 보이게 합니다.
##
## 원본 파일은 고칠 필요가 없습니다. (config.layer_transforms 사용)
## 게임 플레이 중에는 적용되지 않습니다.
################################################################################

init offset = 1

init -10 python in watermorph:

    import store

    VERSION = store.screen_fx.VERSION

    DEFAULTS = dict(
        layout={ },
        enabled=True,
        target="screen",
        amount=6.0,
        scale=180.0,
        speed=0.6,
        flow=1.2,
        shine=0.15,
        quality=2,
        in_title_menus=False,
        )

    ## 편집기가 다루는 값 (저장할 때 이 순서로 적습니다)
    EDIT_KEYS = ("enabled", "target", "amount", "scale", "speed", "flow", "shine", "quality", "in_title_menus")

    class _State(store.python_object):
        def __init__(self):
            self.edits = { }        # 편집기에서 바꾸고 아직 저장 안 한 값
            ## 편집기가 이번 실행 중에 저장한 값. store 변수(watermorph.layout)를 바꾸면 다시 불러올 때
            ## (저장 뒤 저절로, Shift+R) 그 대사가 시작될 때의 옛 값이 새 파일 값을 덮어서 여기에 둡니다.
            self.saved = None

    state = _State()

    def saved_layout():
        """편집기가 저장한 값: 이번 실행 중 저장한 것 → watermorph_layout.rpy"""
        s = getattr(state, "saved", None)
        if s is not None:
            return s
        return globals().get("layout", None) or { }

    def cfg(name):
        """설정값. 편집 중인 값 → 편집기가 저장한 값(watermorph_layout.rpy) → 설정 파일 → 기본값."""
        g = globals()
        if state.edits and name in state.edits and store.screen_fx.editing("watermorph"):
            return state.edits[name]
        lay = saved_layout()
        if name in lay:
            return lay[name]
        if name in g:
            return g[name]
        return DEFAULTS[name]

    ## ── 셰이더 ──
    ## GLSL 반복문 횟수는 상수여야 해서 품질(1~3)마다 따로 등록합니다.

    _VARIABLES = """
        uniform float u_time;
        uniform sampler2D tex0;
        uniform vec2 u_model_size;
        uniform float u_wm_amount;
        uniform float u_wm_scale;
        uniform float u_wm_speed;
        uniform float u_wm_flow;
        uniform float u_wm_shine;
        attribute vec2 a_tex_coord;
        varying vec2 v_wm_coord;
    """

    _FUNCTIONS = """
        float wm_hash(vec2 p) {
            p = fract(p * vec2(123.34, 456.21));
            p += dot(p, p + 45.32);
            return fract(p.x * p.y);
        }

        float wm_noise(vec2 p) {
            vec2 i = floor(p);
            vec2 f = fract(p);
            vec2 u = f * f * f * (f * (f * 6.0 - 15.0) + 10.0);
            return mix(mix(wm_hash(i), wm_hash(i + vec2(1.0, 0.0)), u.x),
                       mix(wm_hash(i + vec2(0.0, 1.0)), wm_hash(i + vec2(1.0, 1.0)), u.x), u.y);
        }

        float wm_fbm(vec2 p) {
            float v = 0.0;
            float a = 0.5;
            for (int k = 0; k < WM_OCTAVES; k++) {
                v += a * wm_noise(p);
                p = p * 2.03 + vec2(1.7, 9.2);
                a *= 0.5;
            }
            return v;
        }

        float wm_height(vec2 p, float t, float flow) {
            vec2 q = vec2(wm_fbm(p + vec2(0.0, t * 0.30)),
                          wm_fbm(p + vec2(5.2, 1.3) - vec2(t * 0.25, 0.0)));
            return wm_fbm(p + flow * q + vec2(t * 0.10, -t * 0.07));
        }
    """

    _VERTEX = """
        v_wm_coord = a_tex_coord;
    """

    ## renpy.texture(200) 다음에 실행되어 색을 다시 계산합니다.
    _FRAGMENT = """
        vec2 wm_px = v_wm_coord * u_model_size;
        vec2 wm_p = wm_px / u_wm_scale;
        float wm_t = u_time * u_wm_speed;

        float wm_e = 0.08;
        float wm_h = wm_height(wm_p, wm_t, u_wm_flow);
        vec2 wm_grad = vec2(wm_height(wm_p + vec2(wm_e, 0.0), wm_t, u_wm_flow) - wm_h,
                            wm_height(wm_p + vec2(0.0, wm_e), wm_t, u_wm_flow) - wm_h) / wm_e;

        // 가장자리가 늘어나 보이지 않도록 살짝 확대한 뒤 굴절
        vec2 wm_margin = vec2(u_wm_amount * 1.5) / u_model_size;
        vec2 wm_uv = 0.5 + (v_wm_coord - 0.5) * (1.0 - 2.0 * wm_margin);
        wm_uv += wm_grad * u_wm_amount / u_model_size;
        wm_uv = clamp(wm_uv, vec2(0.0), vec2(1.0));

        vec4 wm_c = texture2D(tex0, wm_uv);

        // 액체 표면에 비친 빛
        vec3 wm_n = normalize(vec3(-wm_grad, 1.0));
        float wm_spec = pow(max(0.0, dot(wm_n, normalize(vec3(-0.4, -0.6, 0.7)))), 24.0);
        wm_c.rgb += wm_c.a * u_wm_shine * wm_spec;

        gl_FragColor = wm_c;
    """

    import store as _store

    for _q in (1, 2, 3):
        _store.renpy.register_shader(
            "watermorph.q{}".format(_q),
            variables=_VARIABLES,
            fragment_functions=_FUNCTIONS.replace("WM_OCTAVES", str(_q)),
            vertex_200=_VERTEX,
            fragment_300=_FRAGMENT,
            )

    ## ── 적용 ──

    def _shader_name():
        q = int(max(1, min(3, cfg("quality"))))
        return "watermorph.q{}".format(q)

    def _update(trans, st, at):
        ## 매 프레임 값을 다시 읽어 넣고 다시 그립니다. (편집기에서 바꾸면 바로 보이도록)
        if not _active_any():
            trans.shader = None
            trans.mesh = None
            return 0

        trans.mesh = True
        trans.shader = _shader_name()
        trans.u_wm_amount = float(cfg("amount"))
        trans.u_wm_scale = float(cfg("scale"))
        trans.u_wm_speed = float(cfg("speed"))
        trans.u_wm_flow = float(cfg("flow"))
        trans.u_wm_shine = float(cfg("shine"))
        return 0

    def wrap(d):
        """displayable에 왜곡 효과를 씌웁니다."""
        return store.Transform(d, function=_update)

    def _active_any():
        """켜져 있고 편집기가 잠시 끄지 않았는지."""
        if not cfg("enabled"):
            return False

        ## UI Kit 편집기에서 다른 탭을 쓰는 동안에는 끔 (편집 화면이 일그러지지 않도록)
        if store.screen_fx.editor_pauses("watermorph"):
            return False

        return True

    def _active():
        if not _active_any():
            return False

        if store.renpy.get_screen("main_menu") is not None:
            return True

        if cfg("in_title_menus") and store.main_menu:
            return True

        return False

    ## target = "screen": 화면 레이어 전체(배경 + 메뉴 글자)
    def _layer_transform(d):
        if _active():
            return wrap(d)
        return d

    ## target = "background": 타이틀 배경만
    _wrapped_background = [ None, None ]   # [원본, 씌운 것]

    def _setup_background():
        if not cfg("enabled"):
            return

        bg = store.gui.main_menu_background

        if bg is _wrapped_background[1]:
            return

        if bg is not _wrapped_background[0] or _wrapped_background[1] is None:
            _wrapped_background[0] = bg
            _wrapped_background[1] = wrap(store.renpy.displayable(bg))

        store.gui.main_menu_background = _wrapped_background[1]


## UI Kit 타이틀 메뉴의 배경 영상 설정(init 990)보다 뒤에 실행됩니다.
init 995 python in watermorph:

    if cfg("target") == "background":

        _setup_background()

        ## 렌파이는 시작할 때와 언어를 바꿀 때 gui 값을 다시 계산하므로 그때마다 다시 적용
        for _lang in [ None ] + sorted(store.renpy.known_languages()):
            store.config.language_callbacks[_lang].append(_setup_background)

    else:
        store.config.layer_transforms.setdefault("screens", [ ]).append(_layer_transform)
