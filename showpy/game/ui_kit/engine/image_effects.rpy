################################################################################
## UI Kit — 그림 등장 효과 (효과 폴더의 장면 전환)
##
## 이 파일은 고칠 필요가 없습니다.
##
## ui_kit/effects/ 폴더의 .glsl 파일에 @transition으로 적은 전환을 등록합니다.
## 원고에서는 with 뒤에 적습니다.
##
##     scene bg hall with img_fx.use("irisin")            원으로 열리기
##     show mina with img_fx.use("bands")                 띠로 덮였다 열리기
##     scene bg hall with img_fx.use("irisin", 1.5)       1.5초 동안
##     scene bg hall with img_fx.use("bands", 1.2, count=10, color="#c2185b")   값 바꾸기
##
## 값 이름은 그 효과 파일의 @set 줄에 있습니다(u__count → count).
## 효과 파일을 넣거나 빼면 그 전환이 생기거나 없어집니다(게임을 껐다 켜기).
## 적는 법과 샘플은 ui_kit/effects/README.md에 있습니다.
##
## 이 플러그인이 만드는 이름:
##   store.img_fx                 함수가 들어 있는 이름공간
##   셰이더 "ui_kit.imgfx.<이름>", 유니폼 u_imgfx_*
################################################################################

init -9 python in img_fx:

    import re

    import store
    import renpy.display.transition as _rtrans
    from store import python_object

    ## 등록한 전환: 이름 → 효과 파일에서 읽은 정보
    EFFECTS = { }

    ## (이름, 한글 이름) 목록. 파일 이름 순서
    ORDER = [ ]

    ## 없는 전환을 알린 이름 (한 번씩만)
    MISSING = set()

    _VARIABLES = """
        uniform sampler2D tex0;
        uniform sampler2D tex1;
        uniform float u_imgfx_t;
        uniform vec2 u_imgfx_size;
        attribute vec2 a_tex_coord;
        varying vec2 v_tex_coord;
    """

    ## 효과 코드가 쓰는 값: l__uv(0~1 자리), l__old(앞 그림 색), l__new(새 그림 색), l__t(0→1 진행), l__size(가로 세로 픽셀)
    _PRELUDE = """
        vec2 l__uv = v_tex_coord;
        vec4 l__old = texture2D(tex0, v_tex_coord);
        vec4 l__new = texture2D(tex1, v_tex_coord);
        float l__t = u_imgfx_t;
        vec2 l__size = u_imgfx_size;
    """

    def _rename(name, code):
        ## u__이름 → u_imgfx_<효과>_이름. 효과마다 이름이 겹치지 않게
        return re.sub(r"\b([ul])__(\w+)", lambda m: "%s_imgfx_%s_%s" % (m.group(1), name, m.group(2)), code)

    def _value(v):
        """@set이나 use()에 적은 값 → 셰이더 값. "#rrggbb"는 색(투명도를 곱한 r, g, b, a)."""
        if isinstance(v, str):
            h = v.lstrip("#")
            if len(h) in (3, 4):
                h = "".join(c + c for c in h)
            if len(h) not in (6, 8):
                raise Exception("img_fx: 색은 \"#rrggbb\"로 적습니다: {!r}".format(v))
            r, g, b = (int(h[i:i + 2], 16) / 255.0 for i in (0, 2, 4))
            a = int(h[6:8], 16) / 255.0 if len(h) == 8 else 1.0
            return (r * a, g * a, b * a, a)
        if isinstance(v, (tuple, list)):
            return tuple(float(x) for x in v)
        return float(v)

    def _register():
        for e in store.say_style.TFX_TRANSITIONS:
            name = e["name"]
            code = dict(e["code"])
            frag = code.get("fragment") or code.get("fragment_300")
            if not frag:
                store.say_style.TFX_ERRORS.append((e.get("file", name), "@fragment가 없습니다: " + name))
                continue
            kw = { }
            if hasattr(store.renpy.config, "glsl_version"):
                kw["glsl"] = 100
            store.renpy.register_shader("ui_kit.imgfx." + name,
                variables=_VARIABLES + _rename(name, code.get("variables", "")),
                vertex_200="v_tex_coord = a_tex_coord;\n",
                fragment_300=_rename(name, _PRELUDE + frag),
                **kw)
            EFFECTS[name] = e
            ORDER.append((name, e["label"] or name))

    _register()

    def listed(keep=None):
        """고르는 목록에 내놓을 전환 [(이름, 한글 이름)]. ui_kit/effects/effects_off.txt에 적어 끈 것은 빠집니다(4.4).
        끈 전환도 등록은 되어 있어서 원고의 img_fx.use("이름")은 그대로 돕니다. keep은 꺼져 있어도 남깁니다."""
        return store.say_style.tfx_listed(ORDER, keep)

    class _Disp(_rtrans.Transition):

        def __init__(self, shader, time, uniforms, old_widget=None, new_widget=None, **properties):
            super(_Disp, self).__init__(time, **properties)
            self.shader = shader
            self.time = time
            self.uniforms = uniforms
            self.old_widget = old_widget
            self.new_widget = new_widget
            self.events = False

        def render(self, width, height, st, at):
            if st >= self.time:
                self.events = True
                return store.renpy.render(self.new_widget, width, height, st, at)

            done = min(1.0, st / self.time) if self.time > 0 else 1.0
            bottom = store.renpy.render(self.old_widget, width, height, st, at)
            top = store.renpy.render(self.new_widget, width, height, st, at)
            w = max(top.width, bottom.width)
            h = max(top.height, bottom.height)

            rv = store.renpy.Render(w, h)
            if top.get_size() != (w, h):
                top = top.subsurface((0, 0, w, h))
            if bottom.get_size() != (w, h):
                bottom = bottom.subsurface((0, 0, w, h))

            rv.mesh = True
            rv.add_shader(self.shader)
            rv.add_uniform("u_imgfx_t", done)
            rv.add_uniform("u_imgfx_size", (float(w), float(h)))
            for k, v in self.uniforms.items():
                rv.add_uniform(k, v)
            rv.blit(bottom, (0, 0), focus=False, main=False)
            rv.blit(top, (0, 0), focus=True, main=True)
            store.renpy.redraw(self, 0)
            return rv

    class _Use(python_object):

        def __init__(self, shader, time, uniforms):
            self.shader = shader
            self.time = time
            self.uniforms = uniforms

        def __call__(self, old_widget=None, new_widget=None):
            return _Disp(self.shader, self.time, self.uniforms, old_widget, new_widget)

    def use(name, time=None, **values):
        """효과 폴더의 전환. with 뒤에 적습니다.
            scene bg hall with img_fx.use("irisin")
            scene bg hall with img_fx.use("bands", 1.2, count=10)"""
        e = EFFECTS.get(name)
        if e is None:
            ## 효과 파일을 지운 뒤에도 예전 원고가 멈추지 않게 서서히 바뀌기로 (개발 모드에서는 이름마다 한 번 알림)
            if store.config.developer and name not in MISSING:
                MISSING.add(name)
                store.renpy.notify("그림 전환 {!r}이 효과 폴더에 없어서 서서히 바뀌기로 했어요".format(name))
            return store.Dissolve(float(time) if time is not None else 0.5)
        known = dict((k[3:], v) for k, v in e["uniforms"])
        for k in values:
            if k not in known:
                raise Exception("img_fx.use({!r}): {!r}라는 값이 없습니다. 쓸 수 있는 이름: {}".format(
                    name, k, ", ".join(sorted(known))))
        known.update(values)
        uniforms = dict(("u_imgfx_%s_%s" % (name, k), _value(v)) for k, v in known.items())
        return _Use("ui_kit.imgfx." + name, float(e["time"] if time is None else time), uniforms)
