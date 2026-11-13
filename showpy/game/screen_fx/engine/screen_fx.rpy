################################################################################
## Screen FX — 공통 엔진
##
## 이 파일은 고칠 필요가 없습니다. 설정은 플러그인 폴더의 *_config.rpy에서 하세요.
##
## 버전 5.0 · Ren'Py 8.5.3에서 제작·테스트
## 설치·설정 방법: 플러그인 폴더의 README.md
##
## 하는 일
##   1. 화면은 셰이더 두 자리를 겹쳐 그립니다. (4.3부터 두 자리 모두 기본/아스키/VHS/단말기/게임보이 중 하나)
##        1번 (기본 효과): screen_fx.base, 배포 설정은 "none"
##        2번 (덮개):      screen_fx.overlay, True는 VHS
##          $ screen_fx.shaders("ascii", "vhs_crt")     # 1번 아스키 + 2번 VHS
##      타이틀과 게임 내 메뉴는 따로 고른 두 자리(screen_fx.title_shaders, menu_shaders)를 씁니다.
##      처음에는 기본 효과와 덮개가 설정대로 켜져 있고,
##          $ screen_fx.use("ascii")
##      를 만나면 그 효과로 바뀌어 $ screen_fx.clear()를 만날 때까지 유지됩니다.
##      지금 켜진 효과는 세이브·되감기에 같이 저장됩니다.
##   2. 효과를 바꿀 때의 전환: TV 꺼짐·켜짐("tv"), 서서히("fade"), 바로(None)
##   3. 덮개 켜고 끄기, 덮개 휘어짐 바꾸기
##          $ screen_fx.use("ascii", overlay=False)      # ASCII로 바꾸고 덮개는 끔
##          $ screen_fx.set_overlay(True)                # 효과는 그대로, 덮개만 켬
##          $ screen_fx.set_warp(2.0, duration=1.0)      # 덮개 가장자리 휘어짐을 1초 동안 2로
##   4. 글자 빼기: 효과마다 대사·이름 / 선택지 / 메뉴·화면을 골라서 효과에서 뺌 (exclude)
##      그래서 대사창과 선택지를 각자 층(sfx_say, sfx_choice)에 띄웁니다. (screen_fx.split_text_layers)
##      글자 층만 다르게 그리는 효과(게임보이: 글자는 색만 입힘)는 하나도 안 빼도 층마다 씌웁니다.
##   5. 대사 줄 괄호의 fx="…", fx_overlay=True/False, fx_warp=2.0 (그 대사가 나오기 전에 바꿈)
##   6. UI Kit 편집기와 연결 (editor/editor_fx.rpy)
##
## 타이틀 일렁임(watermorph)은 이 전환과 상관없이 타이틀에서만 따로 켜집니다.
##
## 새 셰이더를 만들 때는 README.md "새 효과 넣기"의 견본 코드(흑백)를 복사해서 고칩니다.
################################################################################

init offset = 1

init -110 python in screen_fx:

    import os
    import re
    import time
    import functools

    import store

    VERSION = "5.6"

    ## ── 플러그인 폴더 위치 ──
    ## 이 파일은 <플러그인 폴더>/engine/screen_fx.rpy 에 있습니다.

    _ENGINE_FILE = store.renpy.get_filename_line()[0].replace("\\", "/")
    ROOT = os.path.dirname(os.path.dirname(_ENGINE_FILE))

    def root_path(filename):
        """플러그인 폴더 안 파일의 실제 경로."""
        rel = os.path.join(ROOT, filename)

        for base in (store.config.basedir, store.config.gamedir):
            if os.path.isdir(os.path.join(base, ROOT)):
                return os.path.join(base, rel)

        return os.path.join(store.config.gamedir, filename)

    ## ── 셰이더 등록 ──

    def register_shader(name, **kwargs):
        """renpy.register_shader와 같습니다. 렌파이 8.6 이후에 필요한 문법 버전을 알아서 적습니다."""
        if hasattr(renpy.config, "glsl_version"):
            kwargs.setdefault("glsl", 100)
        renpy.register_shader(name, **kwargs)

    ## ── UI Kit 편집기와 연결 ──

    ## 편집기의 "화면 효과" 탭 이름
    TAB_ID = "screen_fx"

    def editor_state():
        """UI Kit 편집기의 상태. 편집기가 없으면 None."""
        ed = getattr(store, "ui_editor", None)
        return getattr(ed, "state", None)

    def editor_tab():
        """편집기가 열려 있으면 지금 탭 이름, 닫혀 있으면 None."""
        s = editor_state()
        if s is None or not getattr(s, "open", False):
            return None
        return getattr(s, "tab", None)

    def editor_preview_on():
        """편집기를 연 동안에도 화면 효과를 보여줄지.
        V 키로 바꾼 값이 있으면 그것, 없으면 설정 파일의 screen_fx.editor_preview."""
        if rt.editor_preview is not None:
            return rt.editor_preview
        return bool(cfg("editor_preview"))

    def toggle_editor_preview():
        """편집 중 화면 효과 보기를 켜고 끕니다. (편집기의 V 키) 바뀐 뒤 값을 돌려줍니다."""
        rt.editor_preview = not editor_preview_on()
        renpy.restart_interaction()
        return rt.editor_preview

    def editor_pauses(effect_id):
        """편집기가 열려 있고, 이 효과의 탭이 아닌 다른 탭을 쓰고 있으며, 편집 중 효과 보기가 꺼져 있으면 True.
        (화면이 휘어 보이면 클릭 위치가 조금 어긋나서, 끄고 배치하고 싶을 때 V로 끕니다)"""
        t = editor_tab()
        return t is not None and t != effect_id and not editor_preview_on()

    def editing(effect_id):
        """편집기에서 이 탭을 쓰고 있으면 True."""
        return editor_tab() == effect_id

    def fx_tab():
        ed = getattr(store, "ui_editor", None)
        f = getattr(ed, "get_tab", None)
        return f(TAB_ID) if f else None

    def editing_effect():
        """편집기의 화면 효과 탭에서 고치고 있는 효과 이름. 아니면 None."""
        if editor_tab() != TAB_ID:
            return None
        p = getattr(fx_tab(), "page", None)
        return p if p in EFFECTS else None

    ## ── Splash 플러그인과 연결 ──

    def in_splash():
        """Splash 플러그인이 타이틀 전 페이지(로고·경고·조작 방법)를 보여 주는 중이면 True.
        Splash가 없으면 항상 False."""
        sp = getattr(store, "splash", None)
        f = getattr(sp, "running", None)
        if not callable(f):
            return False
        try:
            return bool(f())
        except Exception:
            return False


    ############################################################################
    ## 효과 하나 (ShaderEffect)
    ############################################################################

    def _rgb(c):
        """색 → (r, g, b), 각각 0~1."""
        if isinstance(c, (tuple, list)):
            return tuple(float(x) for x in c[:3])
        return tuple(store.Color(c).rgb)

    def _lerp(a, b, t, kind="float"):
        if kind in ("bool", "choice", "str") or isinstance(a, bool) or isinstance(b, bool):
            return b
        if isinstance(a, str) or isinstance(b, str):
            if kind != "color":
                return b
        if a is None or b is None:
            return b
        if kind == "color":
            try:
                a = _rgb(a)
                b = _rgb(b)
            except Exception:
                return b
        if isinstance(b, (tuple, list)):
            try:
                return tuple(x + (y - x) * t for x, y in zip(a, b))
            except Exception:
                return b
        try:
            return a + (b - a) * t
        except Exception:
            return b

    class _EditState(store.python_object):
        """편집기에서 고치고 아직 저장 안 한 값. (저장되지 않음)"""
        def __init__(self):
            self.edits = { }            # 기본 설정(settings) 편집
            self.preset_edits = { }     # 프리셋 이름 -> {이름: 값} 편집
            self.other = { }            # enabled, scope 편집
            self.preview = None         # 미리 보는 프리셋 이름

    class _Tween(store.python_object):
        """set(duration=…)으로 부드럽게 바뀌는 중인 값. (저장되지 않음)"""
        def __init__(self):
            self.seen = None
            self.start = None
            self.t0 = 0.0
            self.dur = 0.0
            self.shown = None

    class _Direct(store.python_object):
        """camera at <효과>.effect 처럼 직접 씌울 때 쓰는 함수. (세이브에 이름만 들어감)"""
        def __init__(self, fx_id):
            self.fx_id = fx_id

        def __call__(self, trans, st, at):
            fx = EFFECTS.get(self.fx_id)
            if fx is None or not fx.is_enabled() or not fx.player_enabled():
                trans.shader = None
                trans.mesh = None
                return None
            return fx.apply(trans)

    class ShaderEffect(store.python_object):
        """
        화면 효과 하나 = 셰이더 + 값 목록 + 편집기 막대.

        engine/<이름>.rpy에서 만듭니다 (견본: README.md "새 효과 넣기"의 흑백 코드).

            fx = screen_fx.ShaderEffect(
                "mono",                 # 이름. 이름공간(init python in mono)과 같아야 함
                "흑백",                 # 편집기·안내에 보일 이름
                "mono.effect",          # register_shader로 등록한 셰이더 이름
                PARAMS,                 # {값 이름: (종류, 기본값)}. "strength"는 꼭 있어야 함
                GROUPS,                 # 편집기 막대 묶음
                uniform_prefix="u_mono_")
            fx.export(globals())        # mono.set(), mono.preset() … 를 만듦
            screen_fx.register(fx)      # 효과 목록에 올림

        값 종류: "float" 숫자, "bool" 켜기·끄기, "color" 색("#rrggbb"),
                 "vec2" (가로, 세로), "resolution" (가로, 세로) 또는 None(게임 해상도의 절반),
                 "choice" 정해진 값 중 하나 (세 번째 칸에 고를 수 있는 값 목록. 셰이더에는 순서 번호 0, 1, 2…),
                 "str" 글자 (셰이더로 보내지 않음. 효과가 직접 씀. 예: ASCII의 글자 목록)
        """

        ## True면 auto, scope 설정을 씀 (VHS처럼 타이틀/게임 중 범위를 고를 수 있는 효과)
        scoped = False

        ## 편집기 버튼 순서 (작을수록 앞)
        order = 100

        ## True면 덮개로만 쓰는 효과 (VHS). 기본 효과 목록에 나오지 않습니다.
        overlay_only = False

        ## 이 효과를 기본 효과로 쓰는 동안 덮개(VHS)를 기본으로 켤지.
        ## (레트로 터미널은 자체 곡면 CRT, VHS가 있어서 False)
        ## 설정 파일에서 <이름>.overlay = True / False로 바꿀 수 있습니다.
        with_overlay = True

        ## 글자 빼기 기본값 (<이름>.exclude를 적지 않았을 때)
        ##   ()  아무것도 안 뺌: 대사·선택지·메뉴까지 화면 전체에
        ##   ("say", "choice", "screens") 글자 전부 뺌 (예전 "scene")
        default_exclude = ()

        ## 예전 이름 (3.1). default_exclude가 ()이면 "screen", 아니면 "scene"
        @property
        def default_target(self):
            return "screen" if not self.default_exclude else "scene"

        def __init__(self, id, label, shader, params, groups=(), uniform_prefix=None):
            self.id = id
            self.label = label
            self.shader = shader
            self.PARAMS = params
            self.GROUPS = groups
            self.prefix = uniform_prefix or "u_{}_".format(id)
            self.state = _EditState()
            self.tw = _Tween()

            ## 편집기에서 저장한 배치 (다시 불러오기 전까지 *_layout.rpy 대신 씀)
            self.saved = None

            if "strength" not in params:
                raise Exception("screen_fx: 효과 {!r}의 PARAMS에 \"strength\"(전체 세기)가 있어야 합니다.".format(id))

        def kind(self, key):
            return self.PARAMS.get(key, ("float", None))[0]

        def options(self, key):
            """"choice" 값에서 고를 수 있는 값 목록."""
            p = self.PARAMS.get(key, ())
            return tuple(p[2]) if len(p) > 2 else ()

        def extra(self, trans, values):
            """PARAMS 말고 셰이더에 더 넣을 값이 있으면 효과가 이 함수를 다시 정의합니다.
            (예: ASCII는 글자 그림과 칸 크기)"""
            pass

        ## ── 설정 (이 효과의 이름공간에서 읽음) ──

        def ns(self):
            return getattr(store, self.id)

        def conf(self, name, default=None):
            return getattr(self.ns(), name, default)

        def layout(self):
            if self.saved is not None:
                return self.saved
            return self.conf("layout", None) or { }

        def base_conf(self, name, default=None):
            """enabled, scope 처럼 배치 파일이 덮어쓸 수 있는 설정."""
            lay = self.layout()
            if name in lay:
                return lay[name]
            return self.conf(name, default)

        def settings(self):
            s = dict(self.conf("settings", None) or { })
            s.update(self.layout().get("settings", { }))
            return s

        def presets(self):
            p = { k : dict(v) for k, v in (self.conf("presets", None) or { }).items() }
            for name, v in self.layout().get("presets", { }).items():
                p[name] = dict(v)
            return p

        ## ── 편집기 ──

        def editing(self):
            ## 4.4: 화면 효과 탭(인게임), 타이틀/게임 내 메뉴 셰이더 탭을 쓰는 동안은 효과마다 편집한 값으로
            ## (세부 속성이 1번, 2번 아래에 같이 있어서 고르는 효과가 페이지와 상관없음)
            if editing_effect() == self.id:
                return True
            t = editor_tab()
            return t == TAB_ID or t in MENU_TABS

        def preset_values(self, name):
            """프리셋의 값. 편집 중이면 편집기가 고친 프리셋 전체로."""
            if self.editing() and name in self.state.preset_edits:
                return dict(self.state.preset_edits[name])
            return dict(self.presets().get(name, { }))

        def is_enabled(self):
            if self.editing() and "enabled" in self.state.other:
                return self.state.other["enabled"]
            return bool(self.base_conf("enabled", True))

        def cur_scope(self):
            if self.editing() and "scope" in self.state.other:
                return self.state.other["scope"]
            return self.base_conf("scope", "all")

        def in_scope(self):
            if not self.scoped:
                return True

            sc = self.cur_scope()

            if callable(sc):
                return bool(sc())

            ## 타이틀 전 페이지(Splash 플러그인)는 타이틀 쪽으로 칩니다
            mm = bool(store.main_menu) or in_splash()

            if sc == "game":
                return not mm
            elif sc == "main_menu":
                return mm

            return True

        def player_enabled(self):
            return not getattr(store.persistent, self.id + "_off")

        def overlay_default(self):
            """이 효과를 쓰는 동안 덮개를 기본으로 켤지 (<이름>.overlay 설정, 없으면 with_overlay)."""
            return bool(self.base_conf("overlay", self.with_overlay))

        def exclude(self):
            """이 효과에서 빼는 글자 묶음 (튜플). 예: ("say", "choice")"""
            if self.editing() and "exclude" in self.state.other:
                return norm_exclude(self.state.other["exclude"])
            lay = self.layout()
            if "exclude" in lay:
                return norm_exclude(lay["exclude"])
            if lay.get("target") in TARGETS:
                return target_exclude(lay["target"])
            ns = self.ns()
            if getattr(ns, "exclude", DEFAULT) != DEFAULT:
                return norm_exclude(ns.exclude)
            if getattr(ns, "target", None) in TARGETS:
                return target_exclude(ns.target)
            return tuple(self.default_exclude)

        def target(self):
            """예전 이름 (3.1): 하나도 안 빼면 "screen", 전부 빼면 "scene", 아니면 "mixed"."""
            return exclude_target(self.exclude())

        def layered(self):
            """True면 글자를 하나도 안 뺄 때도 화면 전체가 아니라 층마다 씌웁니다.
            (글자 층만 다르게 그리는 효과용. 예: 게임보이는 글자 층에 색만 입힘.
             셰이더는 u_sfx_text 유니폼으로 글자 층인지 압니다)"""
            return False

        ## ── 값 ──

        def check(self, values, where):
            for k, v in values.items():
                if k not in self.PARAMS:
                    raise Exception("{}: {}에 모르는 이름 {!r}가 있습니다. 쓸 수 있는 이름: {}".format(
                        self.id, where, k, ", ".join(sorted(self.PARAMS))))
                if self.kind(k) == "choice" and v not in self.options(k):
                    raise Exception("{}: {}의 {!r} 값 {!r}는 쓸 수 없습니다. 쓸 수 있는 값: {}".format(
                        self.id, where, k, v, ", ".join(repr(o) for o in self.options(k))))

        def overrides(self):
            allo = getattr(store.screen_fx, "overrides", None) or { }
            return dict(allo.get(self.id, { }))

        def values(self):
            """지금 적용될 값 전체 (기본값 + 설정 파일 + 배치 파일 + 게임 중 바꾼 값)."""

            rv = { k : v[1] for k, v in self.PARAMS.items() }
            rv.update(self.settings())

            if self.editing():
                ## 편집 중: 게임 중에 바꾼 값(set 등)은 잠시 빼고, 편집한 값으로
                rv.update(self.state.edits)
                if self.state.preview is not None:
                    rv.update(self.preset_values(self.state.preview))
            else:
                rv.update(self.overrides())

            for k, p in self.PARAMS.items():
                if p[0] == "resolution" and rv.get(k) is None:
                    rv[k] = (store.config.screen_width / 2.0, store.config.screen_height / 2.0)

            return rv

        ## ── 게임 중에 바꾸기 (세이브·되감기에 저장) ──

        def _write(self, o, duration):
            allo = dict(getattr(store.screen_fx, "overrides", None) or { })
            if o:
                allo[self.id] = dict(o)
            else:
                allo.pop(self.id, None)
            store.screen_fx.overrides = allo

            ch = dict(getattr(store.screen_fx, "changes", None) or { })
            n = ch.get(self.id, (0, 0.0))[0] + 1
            ch[self.id] = (n, float(duration or 0.0))
            store.screen_fx.changes = ch

        def set(self, duration=0.0, **kwargs):
            self.check(kwargs, "{}.set()".format(self.id))
            o = self.overrides()
            o.update(kwargs)
            self._write(o, duration)

        def preset(self, name, duration=0.0):
            ps = self.presets()
            if name not in ps:
                raise Exception("{}: 프리셋 {!r}가 없습니다. 있는 프리셋: {}".format(
                    self.id, name, ", ".join(sorted(ps)) or "(없음)"))
            self._write(dict(ps[name]), duration)

        def reset(self, duration=0.0):
            self._write({ }, duration)

        def off(self, duration=0.0):
            self.set(duration=duration, strength=0.0)

        def on(self, duration=0.0):
            o = self.overrides()
            o.pop("strength", None)
            self._write(o, duration)

        ## ── 화면에 적용 ──

        def _current(self):
            tw = self.tw
            target = self.values()
            now = time.time()
            change = (getattr(store.screen_fx, "changes", None) or { }).get(self.id, (0, 0.0))

            if tw.seen != change:
                first = tw.seen is None
                tw.seen = change

                if (not first) and change[1] > 0 and tw.shown is not None:
                    tw.start = dict(tw.shown)
                    tw.t0 = now
                    tw.dur = change[1]
                else:
                    tw.start = None

            tweening = False

            if tw.start is not None:
                p = (now - tw.t0) / tw.dur

                if p >= 1.0:
                    tw.start = None
                    rv = target
                else:
                    tweening = True
                    w = renpy.atl.warpers.get(self.conf("warper", "ease"), renpy.atl.warpers["linear"])
                    p = w(p)
                    rv = { k : _lerp(tw.start.get(k, v), v, p, self.PARAMS.get(k, ("float", None))[0]) for k, v in target.items() }
            else:
                rv = target

            tw.shown = rv
            return rv, tweening

        def apply(self, trans, mix=1.0):
            """트랜스폼에 셰이더와 값을 넣습니다. mix는 전환 중 섞는 정도(0~1)."""

            v, tweening = self._current()
            return self._apply_values(trans, v, mix, tweening)

        def apply_values(self, trans, values, mix=1.0):
            """지금 값에 values를 얹어서 씌웁니다. (이미지 하나에 거는 효과, 5.0)"""
            v = self.values()
            v.update(values or { })
            return self._apply_values(trans, v, mix, False)

        def _apply_values(self, trans, v, mix, tweening):
            strength = float(v.get("strength", 1.0)) * float(mix)

            if strength <= 0.0:
                trans.shader = None
                trans.mesh = None
                return 0 if tweening else None

            trans.mesh = True
            trans.shader = self.shader

            ## 1 = 맨 아래 바탕이 되는 그림(화면 전체·장면 층), 0 = 위에 겹치는 글자 층.
            ## 테두리처럼 화면 바깥을 칠하는 효과는 글자 층에서는 칠하지 않습니다.
            trans.u_sfx_base = 1.0

            ## 1 = 글자 층 (대사·선택지·메뉴와 화면), 0 = 그 밖 (화면 전체·장면 층·스크린 안의 그림)
            trans.u_sfx_text = 0.0

            for k, p in self.PARAMS.items():
                kind = p[0]
                x = v[k]

                if kind == "str":
                    continue
                elif k == "strength":
                    x = strength
                elif kind == "choice":
                    opts = self.options(k)
                    x = float(opts.index(x)) if x in opts else 0.0
                elif kind == "bool":
                    x = 1.0 if x else 0.0
                elif kind in ("vec2", "resolution"):
                    x = (float(x[0]), float(x[1]))
                elif kind == "color":
                    x = _rgb(x)
                else:
                    x = float(x)

                setattr(trans, self.prefix + k, x)

            self.extra(trans, v)

            return self.conf("redraw", 0.0)

        ## ── 이름공간에 함수 만들기 ──

        def export(self, g):
            """
            효과의 이름공간에 설정 기본값과 함수를 만듭니다.
                <이름>.set(), .preset(), .reset(), .off(), .on(), .values()
                <이름>.Set(), .Preset(), .Toggle()   (화면 버튼용)
                <이름>.effect                        (camera at <이름>.effect)
            """

            for k, v in (("enabled", True), ("settings", { }), ("presets", { }),
                         ("warper", "ease"), ("redraw", 0.0), ("layout", { })):
                g.setdefault(k, v)

            g["fx"] = self
            g["state"] = self.state
            g["PARAMS"] = self.PARAMS
            g["GROUPS"] = self.GROUPS
            g["SHADER"] = self.shader

            g["values"] = self.values
            g["preset_values"] = self.preset_values
            g["is_enabled"] = self.is_enabled
            g["player_enabled"] = self.player_enabled
            g["editing"] = self.editing
            g["set"] = self.set
            g["preset"] = self.preset
            g["reset"] = self.reset
            g["off"] = self.off
            g["on"] = self.on

            g["Set"] = functools.partial(SetValues, self.id)
            g["Preset"] = functools.partial(SetPreset, self.id)
            g["Toggle"] = functools.partial(TogglePlayer, self.id)
            g["Use"] = functools.partial(Use, self.id)

            g["effect"] = store.Transform(function=_Direct(self.id))


    ## ── 효과 목록 ──

    EFFECTS = { }
    ORDER = [ ]
    ## 예전 효과 이름 → 지금 이름 ("tiles" → "collage", 5.3)
    ALIASES = { }

    def alias(name):
        try:
            return ALIASES.get(name, name)
        except TypeError:
            return name

    ## 특별한 이름
    NONE = "none"           # 효과 없음 (깨끗한 화면)
    _KEEP = "__screen_fx_missing__"     # 인자를 안 적었을 때 (그대로 둠)
    DEFAULT = "default"     # 기본 효과 (screen_fx.base). use("default") = clear()

    ## 글자 빼기 (exclude): 효과를 씌우지 않을 글자 묶음
    ##   "say"      대사·이름 (대사창, NVL 화면)
    ##   "choice"   선택지
    ##   "screens"  메뉴·화면 (퀵메뉴, 저장·환경설정 화면, show screen으로 띄운 화면)
    ## 하나도 안 빼면 화면 전체에 한 번에 씌우고, 하나라도 빼면 뺀 묶음을 뺀 층마다 씌웁니다.
    TEXT_GROUPS = ("say", "choice", "screens")
    ALL_TEXT = TEXT_GROUPS
    TEXT_LABELS = { "say": "대사와 이름", "choice": "선택지", "screens": "메뉴와 화면" }

    ## 대사창·선택지를 띄우는 층 (split_text_layers가 True일 때)
    SAY_LAYER = "sfx_say"
    CHOICE_LAYER = "sfx_choice"

    ## 예전 이름 (3.1): "screen" = 아무것도 안 뺌, "scene" = 글자 전부 뺌
    TARGETS = ("screen", "scene")

    def target_exclude(t):
        return () if t == "screen" else ALL_TEXT

    def exclude_target(ex):
        if not ex:
            return "screen"
        if tuple(ex) == ALL_TEXT:
            return "scene"
        return "mixed"

    def norm_exclude(v, where="exclude"):
        """글자 빼기 값 → TEXT_GROUPS 순서의 튜플.
            ()  / None / "none"          아무것도 안 뺌
            "all" / "text" / True        글자 전부 뺌
            ("say", "choice")             골라서 뺌 (글자 하나면 "say"처럼 써도 됨, "say,choice"도 됨)"""
        if v is None or v is False or v == "none":
            return ()
        if v is True or v in ("all", "text"):
            return ALL_TEXT
        if isinstance(v, str):
            items = [ x.strip() for x in v.replace("+", ",").split(",") if x.strip() ]
        else:
            try:
                items = list(v)
            except TypeError:
                items = [ v ]
        for x in items:
            if x not in TEXT_GROUPS:
                raise Exception("screen_fx: {}에 쓴 {!r}는 쓸 수 없습니다. 쓸 수 있는 값: \"say\"(대사·이름), \"choice\"(선택지), \"screens\"(메뉴·화면), 또는 ()(아무것도 안 뺌), \"all\"(글자 전부)".format(where, x))
        return tuple(g for g in TEXT_GROUPS if g in items)

    def exclude_label(ex):
        ex = tuple(ex)
        if not ex:
            return "글자까지 전부"
        if ex == ALL_TEXT:
            return "글자 전부 빼고 장면만"
        return ", ".join(TEXT_LABELS[g] for g in ex) + " 빼고"

    def register(fx):
        """효과를 목록에 올립니다. 편집기 버튼도 이 순서로 나옵니다."""
        if fx.id in (NONE, DEFAULT):
            raise Exception("screen_fx: 효과 이름으로 {!r}는 쓸 수 없습니다.".format(fx.id))
        if fx.id not in EFFECTS:
            ORDER.append(fx.id)
        EFFECTS[fx.id] = fx
        ORDER.sort(key=lambda i: EFFECTS[i].order)

    def names():
        return [ DEFAULT ] + list(ORDER) + [ NONE ]


    ## ── 화면 버튼용 동작 ──

    class SetValues(store.Action, store.DictEquality):
        """textbutton "지직" action vhs_crt.Set(noise_opacity=1.0, duration=0.3)"""

        def __init__(self, fx_id, duration=0.0, **kwargs):
            self.fx_id = fx_id
            self.duration = duration
            self.kwargs = kwargs

        def __call__(self):
            EFFECTS[self.fx_id].set(duration=self.duration, **self.kwargs)
            renpy.restart_interaction()

    class SetPreset(store.Action, store.DictEquality):
        """textbutton "고장" action vhs_crt.Preset("broken")"""

        def __init__(self, fx_id, name, duration=0.0):
            self.fx_id = fx_id
            self.name = name
            self.duration = duration

        def __call__(self):
            EFFECTS[self.fx_id].preset(self.name, self.duration)
            renpy.restart_interaction()

    class TogglePlayer(store.Action, store.DictEquality):
        """
        플레이어용 켜기·끄기 (환경설정 화면). 게임을 껐다 켜도 유지됩니다.
            textbutton _("VHS 효과") action vhs_crt.Toggle()
        """

        def __init__(self, fx_id):
            self.fx_id = fx_id

        def __call__(self):
            name = self.fx_id + "_off"
            setattr(store.persistent, name, not getattr(store.persistent, name))
            renpy.restart_interaction()

        def get_selected(self):
            return not getattr(store.persistent, self.fx_id + "_off")


    ############################################################################
    ## 효과 바꾸기 (screen_fx.use / clear)
    ############################################################################

    ## screen_fx_config.rpy에 적지 않은 값
    DEFAULTS = dict(
        base=NONE,
        transition="tv",
        fade_time=1.0,
        skippable=True,
        wait=True,
        overlay=True,
        split_text_layers=True,
        editor_preview=True,
        cursor="effect",
        title_shaders=("none", "none"),
        menu_shaders=("none", "none"),
        )

    TV_DEFAULTS = {
        "off_time": 0.35,
        "black_time": 0.25,
        "on_time": 0.45,
        "line": 3,
        "flash": 0.8,
        "noise": 0.5,
        "off_sound": None,
        "on_sound": None,
        "volume": 1.0,
        }

    ## "swap"(5.6): 자기 모양 없이 시간의 절반에 앞 셰이더 → 새 셰이더로 바꾸기만 함.
    ##   그림 전환(img_fx.use("pixelsort") 등)과 같은 시간에 같이 돌려서, 바뀌는 순간을 그 전환이 가려 줌 (PyKaki가 씀)
    TRANSITIONS = ("tv", "fade", "swap", None)

    def _check_tv(tv):
        """tv={...}에 모르는 이름이 있으면 알립니다. (5.5)"""
        if not isinstance(tv, dict):
            raise Exception("screen_fx: tv에는 {\"off_time\": 0.5} 같은 사전을 적습니다. 받은 값: {!r}".format(tv))
        for k in tv:
            if k not in TV_DEFAULTS:
                raise Exception("screen_fx: tv에 모르는 이름 {!r}가 있습니다. 쓸 수 있는 이름: {}".format(k, ", ".join(sorted(TV_DEFAULTS))))

    class _ConfEdit(store.python_object):
        """편집기에서 고치고 아직 저장 안 한 전환 설정. (저장되지 않음)"""
        def __init__(self):
            self.edits = { }    # base, transition, fade_time, overlay …
            self.tv = { }       # TV 전환 값
            self.saved = None   # 저장한 배치 (다시 불러오기 전까지)

    cedit = _ConfEdit()

    def _lay():
        if cedit.saved is not None:
            return cedit.saved
        return globals().get("layout", None) or { }

    def cfg(name):
        """전환 설정 값. 편집 중인 값 → 배치 파일(screen_fx_layout.rpy) → 설정 파일 → 기본값."""
        if editor_tab() == TAB_ID and name in cedit.edits:
            return cedit.edits[name]
        lay = _lay()
        if name in lay:
            return lay[name]
        g = globals()
        if name in g:
            return g[name]
        return DEFAULTS[name]

    def tv_conf():
        """TV 전환 값 전체."""
        d = dict(TV_DEFAULTS)
        d.update(globals().get("tv", None) or { })
        d.update(_lay().get("tv", { }))
        if editor_tab() == TAB_ID:
            d.update(cedit.tv)
        return d

    ## 덮개로 쓰는 효과 (VHS)
    OVERLAY = "vhs_crt"

    def overlay_only(name):
        """덮개로만 쓰는 효과(VHS)인지. 기본 효과로 고르면 "효과 없음 + 덮개 켬"으로 바꿔 읽습니다."""
        fx = EFFECTS.get(name)
        return fx is not None and fx.overlay_only

    def base_effect():
        """처음 1번 셰이더 (screen_fx.base). 없는 이름이면 "none". (4.3부터 VHS도 1번에 올 수 있음)"""
        b = cfg("base")
        if b in EFFECTS:
            return b
        return NONE

    def resolve(name):
        if name is None or name == DEFAULT:
            return base_effect()
        return alias(name)

    def current_effect():
        """지금 켜져 있는 효과 이름. (기본 효과면 그 이름, 예: "vhs_crt")"""
        return resolve(globals().get("current", None))

    def overlay_flag(raw):
        """덮개 값 → True(켬) / False(끔) / DEFAULT(설정대로).
        예전 값도 읽습니다: "vhs_crt" → True, None·"none" → False."""
        if raw == DEFAULT:
            return DEFAULT
        if raw is True:
            return True
        if raw in (None, False, NONE):
            return False
        if isinstance(raw, str) and raw in EFFECTS:
            ## 4.3: 2번 셰이더(덮개)에 VHS 말고 다른 효과도 올 수 있음
            return raw
        return bool(raw)

    def _resolve_overlay(raw, effect=None):
        """2번 셰이더(덮개) 값 → 효과 이름 또는 None(없음).
        True는 VHS. 설정대로(DEFAULT)면 screen_fx.overlay를 따르고, 그 1번 효과가 덮개를 받을 때만 씌움."""
        f = overlay_flag(raw)
        if f == DEFAULT:
            f = overlay_flag(cfg("overlay"))
            if f == DEFAULT:
                f = True
            fx = EFFECTS.get(effect)
            if f and fx is not None and not fx.overlay_default():
                f = False
        if f is True:
            return OVERLAY if OVERLAY in EFFECTS else None
        if isinstance(f, str) and f in EFFECTS:
            return f
        return None

    def current_overlay():
        """지금 위에 덮인 효과 이름 ("vhs_crt"). 덮개가 꺼져 있으면 None."""
        return _resolve_overlay(alias(globals().get("cur_overlay", DEFAULT)), current_effect())

    def overlay_on():
        """지금 덮개가 켜져 있으면 True."""
        return current_overlay() is not None

    def _resolve_exclude(name, raw):
        """저장된 값(cur_target) → 빼는 글자 묶음 튜플."""
        if raw == DEFAULT:
            fx = EFFECTS.get(name)
            return fx.exclude() if fx is not None else ()
        if raw in TARGETS:
            return target_exclude(raw)
        try:
            return norm_exclude(raw)
        except Exception:
            return ()

    def current_exclude():
        """지금 효과에서 빼는 글자 묶음. 예: () 아무것도 안 뺌, ("say", "choice")"""
        return _resolve_exclude(current_effect(), globals().get("cur_target", DEFAULT))

    def current_target():
        """예전 이름 (3.1): "screen"(아무것도 안 뺌) / "scene"(글자 전부 뺌) / "mixed"(일부만 뺌)."""
        return exclude_target(current_exclude())

    def state_now():
        """(효과, 덮개, 빼는 글자 묶음)"""
        return (current_effect(), current_overlay(), current_exclude())

    def is_default():
        """지금 기본 효과 상태인지 (use()로 바꾸지 않았거나 clear()로 돌아왔는지)."""
        g = globals()
        return (g.get("current", None) is None
            and g.get("cur_overlay", DEFAULT) == DEFAULT
            and g.get("cur_target", DEFAULT) == DEFAULT)

    def effect_label(name):
        if name == DEFAULT or name is None:
            return "기본({})".format(effect_label(base_effect()))
        if name == NONE:
            return "효과 없음"
        fx = EFFECTS.get(name)
        return fx.label if fx is not None else name

    def target_label(t):
        """빼는 글자 묶음(튜플)이나 예전 이름("screen"/"scene") → 표시."""
        if t in TARGETS:
            t = target_exclude(t)
        if isinstance(t, (tuple, list)):
            return exclude_label(t)
        return str(t)

    def base_names():
        """기본 효과로 고를 수 있는 효과 이름 (덮개 전용 VHS는 빠짐)."""
        return [ i for i in ORDER if not overlay_only(i) ]

    def choices():
        """편집기 버튼용 (이름, 표시) 목록. 덮개 전용(VHS)은 빠짐."""
        rv = [ (DEFAULT, effect_label(DEFAULT)) ]
        for i in base_names():
            rv.append((i, EFFECTS[i].label))
        rv.append((NONE, effect_label(NONE)))
        return rv

    def _check_name(name):
        if name is None or name in (DEFAULT, NONE) or name in EFFECTS:
            return
        raise Exception("screen_fx: {!r}라는 효과가 없습니다. 쓸 수 있는 이름: {}".format(
            name, ", ".join(names())))

    def _check_overlay(name, where="overlay"):
        if name in (None, NONE, DEFAULT, False, True) or name == OVERLAY:
            return
        if isinstance(name, str) and name in EFFECTS:
            return
        raise Exception("screen_fx: {} {!r}는 쓸 수 없습니다. 2번 셰이더(덮개)는 효과 이름(\"vhs_crt\", \"ascii\" …), True(VHS) / False(없음) / \"default\"(설정대로)만 씁니다.".format(where, name))

    ## ── 셰이더 두 자리 (4.3) ──
    ## 1번 = 기본 효과 자리(current), 2번 = 덮개 자리(cur_overlay). 두 자리 모두 아래 중에서 고릅니다.
    ##   "none"(기본, 아무것도 안 함) / "ascii" / "vhs_crt" / "retro_term"(단말기) / "gameboy" / 새로 넣은 효과

    SLOT_ORDER = ("ascii", "vhs_crt", "retro_term", "gameboy")
    SLOT_NAMES = { NONE: "기본", "ascii": "아스키", "vhs_crt": "VHS", "retro_term": "단말기", "gameboy": "게임보이" }

    def slot_label(name):
        if name in SLOT_NAMES:
            return SLOT_NAMES[name]
        fx = EFFECTS.get(name)
        return fx.label if fx is not None else str(name)

    def slot_choices(keep=()):
        """셰이더 자리에서 고를 수 있는 (이름, 표시) 목록. 맨 앞은 "기본"(아무것도 안 함).
        shaders_off.txt에 적어 끈 셰이더는 빠집니다(5.4). keep(지금 고른 것)은 꺼져 있어도 남깁니다."""
        names = [ i for i in SLOT_ORDER if i in EFFECTS ] + [ i for i in ORDER if i not in SLOT_ORDER ]
        return [ (NONE, slot_label(NONE)) ] + [ (i, slot_label(i)) for i in names if i in keep or i not in SHADERS_OFF ]

    ## ── 끈 셰이더 (5.4) ──
    ## <플러그인 폴더>/shaders_off.txt에 이름을 적은 셰이더는 "고르는 목록"에서만 빠집니다.
    ## 효과는 그대로 등록하므로, 이미 그 셰이더를 쓴 원고($ screen_fx.shaders("ascii"))는 전과 똑같이 돕니다.
    ## 한 줄에 이름 하나, #으로 시작하는 줄은 설명, 파일이 없으면 다 켠 것입니다.
    ##     # 끈 셰이더. 한 줄에 이름 하나
    ##     gameboy
    ##     shards
    SHADERS_OFF_FILE = "shaders_off.txt"
    SHADERS_OFF = set()

    def _game_rel(filename):
        """플러그인 폴더 안 파일의 이름 (renpy.loadable에 넣는 game 폴더 기준)."""
        rel = ROOT[5:] if ROOT.startswith("game/") else ("" if ROOT == "game" else ROOT)
        return (rel + "/" if rel else "") + filename

    def _read_shaders_off():
        SHADERS_OFF.clear()
        fn = _game_rel(SHADERS_OFF_FILE)
        if not renpy.loadable(fn):
            return
        try:
            with renpy.open_file(fn, encoding="utf-8") as f:
                text = f.read()
        except Exception:
            return
        for row in text.replace(u"\ufeff", "").splitlines():
            row = row.split("#", 1)[0].strip()
            if row:
                SHADERS_OFF.add(alias(row))

    _read_shaders_off()

    def shader_off(name):
        """끈 셰이더인지."""
        return alias(name) in SHADERS_OFF

    def norm_slots(v):
        """(1번, 2번) → 효과 이름 두 개. 없는 이름은 "none"."""
        try:
            a, b = v
        except Exception:
            a, b = NONE, NONE
        a, b = alias(a), alias(b)
        a = a if a in EFFECTS else NONE
        b = b if b in EFFECTS else NONE
        return (a, b)

    def current_slots():
        """게임의 지금 셰이더 두 자리 (1번, 2번)."""
        return (current_effect(), current_overlay() or NONE)

    def shaders(first=NONE, second=NONE, transition=DEFAULT, duration=None, wait=None, tv=None, values=None):
        """
        인게임 셰이더 두 자리를 한 번에 정합니다. 다음에 바꿀 때까지 유지되고, 세이브·되감기에 저장됩니다. (4.3)
            $ screen_fx.shaders("ascii", "vhs_crt")     # 1번 아스키 + 2번 VHS
            $ screen_fx.shaders("gameboy")              # 1번 게임보이, 2번 없음
            $ screen_fx.shaders("none", "none")         # 전부 셰이더 적용 취소 (아무것도 안 함)
        이름: "none"(기본) "ascii"(아스키) "vhs_crt"(VHS) "retro_term"(단말기) "gameboy"(게임보이)

        세부 값과 TV 전환 값을 이 자리에서만 (5.5. PyKaki가 상자마다 적음):
            $ screen_fx.shaders("vhs_crt", "none", values={"vhs_crt": {"warp_amount": 2.0}})
            $ screen_fx.shaders("glitch", "none", transition="tv", tv={"off_time": 0.6})
        values: {셰이더 이름: {값 이름: 값}}. 고른 셰이더의 값을 이 값으로 바꿉니다(적지 않은 값은 설정대로).
                {}를 주면 설정대로 돌아갑니다. values를 아예 적지 않으면 바꾼 값을 그대로 둡니다.
        tv: 이번 TV 전환에만 쓰는 값 (screen_fx.tv와 같은 이름)
        """
        first = alias(first or NONE)
        second = alias(second or NONE)
        _check_name(first)
        _check_overlay(second, "shaders()의 2번")
        if values is not None:
            _put_values(values, (first, second))
        use(first, transition=transition, duration=duration, wait=wait,
            overlay=(False if second in (NONE, None, False) else second), tv=tv)

    def _put_values(values, slots):
        """shaders(values=)의 값을 고른 셰이더에 씁니다. 지금 값과 같으면 그대로 둡니다. (5.5)"""
        if not isinstance(values, dict):
            raise Exception("screen_fx.shaders: values에는 {\"vhs_crt\": {\"warp_amount\": 2.0}} 같은 사전을 적습니다.")
        for name, vals in values.items():
            fx = EFFECTS.get(alias(name))
            if fx is None:
                raise Exception("screen_fx.shaders: values에 {!r}라는 효과가 없습니다. 쓸 수 있는 이름: {}".format(name, ", ".join(names())))
        for name in slots:
            fx = EFFECTS.get(name)
            if fx is None:
                continue
            vals = dict(values.get(name, None) or { })
            fx.check(vals, "screen_fx.shaders(values=)")
            if fx.overrides() != vals:
                fx._write(vals, 0.0)

    ## ── 타이틀, 게임 내 메뉴 셰이더 (4.3) ──
    ## 타이틀(과 타이틀에서 연 화면), 게임 중 ESC 메뉴(와 거기서 연 화면)는 인게임 셰이더 대신
    ## 따로 고른 두 자리(screen_fx.title_shaders, screen_fx.menu_shaders)를 화면 전체에 씌웁니다.

    MENU_KEYS = { "title": "title_shaders", "pause": "menu_shaders" }
    MENU_TABS = { "title_fx": "title", "pause_fx": "pause" }

    def menu_context():
        """"title" 타이틀 쪽 / "pause" 게임 중 메뉴 / None 게임 화면 (스플래시도 None)."""
        if in_splash():
            return None
        if store.main_menu:
            return "title"
        if getattr(store, "_menu", False):
            return "pause"
        return None

    def menu_slots(ctx):
        """그 메뉴의 셰이더 두 자리. 편집기에서 그 탭을 고치고 있으면 고친 값."""
        key = MENU_KEYS[ctx]
        if MENU_TABS.get(editor_tab()) == ctx and key in cedit.edits:
            return norm_slots(cedit.edits[key])
        lay = _lay()
        if key in lay:
            return norm_slots(lay[key])
        return norm_slots(globals().get(key, DEFAULTS[key]))

    def _check_target(t, where="target"):
        if t == DEFAULT or t in TARGETS:
            return
        raise Exception("screen_fx: {} {!r}는 쓸 수 없습니다. \"scene\"(글자 전부 빼기) 또는 \"screen\"(화면 전체)을 쓰세요. 골라서 빼려면 exclude=(\"say\", \"choice\") 처럼 씁니다.".format(where, t))

    def _store_exclude(exclude, target):
        """use()의 exclude·target → 저장할 값 (cur_target)."""
        if exclude != DEFAULT:
            if exclude in TARGETS:
                return exclude
            return norm_exclude(exclude)
        if target != DEFAULT:
            _check_target(target)
            return target
        return DEFAULT

    def _check_transition(kind):
        if kind not in TRANSITIONS:
            raise Exception("screen_fx: 전환 {!r}는 없습니다. \"tv\", \"fade\", \"swap\", None 중에서 고르세요.".format(kind))


    ## ── 전환 애니메이션 (저장되지 않음) ──

    def _as_state(x):
        """효과 이름이나 (효과, 덮개, 대상) → (효과, 덮개, 대상)."""
        if isinstance(x, tuple):
            return x
        return (x, None, _resolve_exclude(x, DEFAULT))

    class _Anim(store.python_object):

        def __init__(self, kind, old, new, duration=None, preview=False, tv=None):
            self.kind = kind
            self.old = _as_state(old)
            self.new = _as_state(new)
            self.preview = preview
            self.t0 = time.time()
            self.c = tv_conf()
            if tv:
                ## 이번 전환에만 쓰는 TV 값 (shaders(..., tv={...}), 5.5)
                _check_tv(tv)
                self.c.update(tv)

            if kind == "tv":
                parts = [ max(0.0, float(self.c[k])) for k in ("off_time", "black_time", "on_time") ]
                if duration is not None:
                    s = sum(parts) or 1.0
                    parts = [ p * float(duration) / s for p in parts ]
            else:
                d = float(cfg("fade_time") if duration is None else duration)
                parts = [ d / 2.0, 0.0, d / 2.0 ]

            self.parts = parts
            self.total = sum(parts)

        def elapsed(self):
            return time.time() - self.t0

        def done(self):
            return self.elapsed() >= self.total

        def finish(self):
            self.t0 = time.time() - self.total - 1.0

        def stage(self):
            """("off", 진행) / ("black", 진행) / ("on", 진행) / (None, 1.0)"""
            t = self.elapsed()
            for name, d in zip(("off", "black", "on"), self.parts):
                if t < d:
                    return name, (t / d if d > 0 else 1.0)
                t -= d
            return None, 1.0

        def shown(self):
            """지금 보일 (상태, 효과 섞는 정도, 덮개 섞는 정도)."""
            st, p = self.stage()
            fade = (self.kind == "fade")
            same_fx = (self.old[0] == self.new[0] and self.old[2] == self.new[2])
            same_ovl = (self.old[1] == self.new[1])

            if st in ("off", "black"):
                m = (1.0 - p) if (fade and st == "off") else 1.0
                return self.old, (1.0 if same_fx else m), (1.0 if same_ovl else m)
            if st == "on":
                m = p if fade else 1.0
                return self.new, (1.0 if same_fx else m), (1.0 if same_ovl else m)
            return self.new, 1.0, 1.0

        def tv_geometry(self):
            """TV 전환 중이면 (가로 배율, 세로 배율, 불투명도, 섬광, 지직거림). 아니면 None."""
            if self.kind != "tv":
                return None

            st, p = self.stage()
            if st is None:
                return None

            c = self.c
            line_y = max(float(c["line"]) / store.config.screen_height, 0.001)
            line_x = max(float(c["line"]) / store.config.screen_width, 0.001)
            flash = max(0.0, min(1.0, float(c["flash"])))
            noise = max(0.0, min(1.0, float(c["noise"])))

            if st == "off":
                ## 위아래로 눌려 가로선이 됨 → 가로선이 가운데 점으로
                S = 0.6
                if p < S:
                    q = p / S
                    return (1.0, 1.0 + (line_y - 1.0) * q * q, 1.0, flash * q, 0.0)
                q = (p - S) / (1.0 - S)
                return (1.0 + (line_x - 1.0) * q * q, line_y, 1.0, flash, 0.0)

            if st == "black":
                return (line_x, line_y, 0.0, 0.0, 0.0)

            ## 켜짐: 점 → 가로선 → 화면이 펴짐 (지직거림이 서서히 빠짐)
            S = 0.3
            if p < S:
                q = p / S
                q = 1.0 - (1.0 - q) * (1.0 - q)
                return (line_x + (1.0 - line_x) * q, line_y, 1.0, flash, noise)
            q = (p - S) / (1.0 - S)
            qe = 1.0 - (1.0 - q) * (1.0 - q)
            return (1.0, line_y + (1.0 - line_y) * qe, 1.0, flash * (1.0 - q), noise * (1.0 - q))


    class _Runtime(store.python_object):
        def __init__(self):
            self.anim = None            # 진행 중인 전환
            self.last_say = None        # 마지막 대사 줄: (파일, 줄, 바뀌기 전 효과, 바뀐 뒤 효과, 괄호 fx 값, 바뀌기 전 상태, 바뀐 뒤 상태)
            self.editor_preview = None  # 편집기를 연 동안 효과를 보여줄지 (None = 설정 파일대로, V 키로 바꿈)
            self.cursor_preview = None  # 커서 칸에서 고른 커서 자리 미리 보기 (4.5, 세이브에 안 들어감)
            self.pending_with = None    # 그림 전환으로 셰이더를 바꿀 때 다음 with에 쓸 전환 (5.6, pending_with())

    rt = _Runtime()

    ## 전환 소리 채널 (효과음 음량을 따름)
    renpy.music.register_channel("screen_fx_off", mixer="sfx", loop=False)
    renpy.music.register_channel("screen_fx_on", mixer="sfx", loop=False)

    def _play_sounds(a):
        if a.kind != "tv":
            return
        c = a.c
        vol = float(c.get("volume", 1.0))
        try:
            if c.get("off_sound"):
                renpy.music.play(c["off_sound"], channel="screen_fx_off", loop=False, relative_volume=vol)
            if c.get("on_sound"):
                gap = a.parts[0] + a.parts[1]
                renpy.music.play([ "<silence {:.3f}>".format(gap), c["on_sound"] ], channel="screen_fx_on", loop=False, relative_volume=vol)
        except Exception:
            pass

    def _sounds_now_on(a):
        """클릭으로 전환을 건너뛰었을 때: 켜지는 소리를 바로."""
        if a.kind != "tv":
            return
        c = a.c
        try:
            renpy.music.stop(channel="screen_fx_off")
            if c.get("on_sound"):
                renpy.music.play(c["on_sound"], channel="screen_fx_on", loop=False, relative_volume=float(c.get("volume", 1.0)))
        except Exception:
            pass

    def _instant():
        """전환 없이 바로 바꿀 때: 건너뛰기, 되감기·불러오기, 편집기 사용 중, 플레이어가 효과를 끔."""
        if renpy.is_skipping():
            return True
        if renpy.in_rollback():
            return True
        if editor_tab() is not None:
            return True
        if store.persistent.screen_fx_off:
            return True
        return False

    def use(effect, transition=DEFAULT, duration=None, wait=None, overlay=DEFAULT, target=DEFAULT, exclude=DEFAULT, cursor=_KEEP, tv=None):
        """
        화면 효과를 바꿉니다. 다음에 다시 바꿀 때까지 유지되고, 세이브·되감기에 저장됩니다.

            $ screen_fx.use("ascii")                         # ASCII로 (기본 전환: TV 꺼짐·켜짐)
            $ screen_fx.use("ascii", transition="fade")       # 서서히 바꾸기
            $ screen_fx.use("ascii", transition=None)         # 바로 바꾸기
            $ screen_fx.use("ascii", transition="pixelsort")  # 효과 폴더의 그림 전환으로 (다음 줄에 with screen_fx.pending_with(), 5.6)
            $ screen_fx.use("ascii", duration=2.0)            # 전환 전체를 2초로
            $ screen_fx.use("ascii", overlay=False)           # ASCII로 바꾸고 VHS 덮개는 끔
            $ screen_fx.use("gameboy", overlay=True)          # 게임보이 + VHS 덮개
            $ screen_fx.use("ascii", exclude=())              # 이번만 대사창까지 전부 (아무것도 안 뺌)
            $ screen_fx.use("gameboy", exclude=("say",))      # 이번만 대사·이름은 빼고
            $ screen_fx.use("none")                           # 기본 효과 없음 (덮개는 설정대로)
            $ screen_fx.use("none", overlay=False)            # 아무 효과 없는 깨끗한 화면
            $ screen_fx.use("default")                        # 기본 효과로 (= screen_fx.clear())
            $ screen_fx.use("ascii", cursor="top")            # 바꾸면서 커서는 효과 밖(맨 위)으로 (4.2)

        transition을 적지 않으면 screen_fx.transition 설정을 따릅니다.
        overlay: True 덮개 켬 / False 끔 / 적지 않으면 설정대로 (screen_fx.overlay와 그 효과의 <이름>.overlay)
        예전 이름 use("vhs_crt")는 "효과 없음 + 덮개 켬"으로 바꿔 읽습니다.
        exclude를 적지 않으면 그 효과의 설정(<이름>.exclude)을 따릅니다. (target은 예전 이름)
        wait: True면 전환이 끝날 때까지 기다렸다가 다음 줄로 (기본은 screen_fx.wait)
        cursor: 커서를 그릴 자리 (set_cursor와 같음). 안 적으면 그대로 둠 (4.2)
        tv: 이번 TV 전환에만 쓰는 값. 예: tv={"off_time": 0.6, "noise": 0.2} (5.5)
        """

        effect = alias(effect)
        overlay = alias(overlay)
        _check_name(effect)
        if cursor != _KEEP:
            set_cursor(cursor, restart=False)
        _check_overlay(overlay)
        stored = _store_exclude(exclude, target)

        ## 예전 이름: use("vhs_crt") = 기본 효과 없음 + 덮개 켬 (2번을 적으면 1번 VHS로 읽음, 4.3)
        if overlay_only(effect) and overlay == DEFAULT:
            effect = NONE
            if overlay == DEFAULT:
                overlay = True

        kind = cfg("transition") if transition == DEFAULT else transition
        if kind in ("none", "instant", False):
            kind = None
        img = _img_transition(kind)
        if img is not None:
            ## 그림 전환(효과 폴더의 @transition, 5.6): 셰이더는 그 시간의 절반에 바꾸고(swap), 그림은 다음 with가 이음
            kind, wait = "swap", False
            if duration is None:
                duration = img[1]
        elif kind not in TRANSITIONS and _img_transition_name(kind):
            ## 효과 폴더에서 뺀 그림 전환: 설정의 전환으로
            kind = cfg("transition")
        _check_transition(kind)
        rt.pending_with = None

        old = state_now()
        store.screen_fx.current = None if effect in (None, DEFAULT) else effect
        store.screen_fx.cur_overlay = overlay_flag(overlay)
        store.screen_fx.cur_target = stored
        new = state_now()

        if old == new or kind is None or _instant():
            rt.anim = None
            renpy.restart_interaction()
            return

        a = _Anim(kind, old, new, duration, tv=tv)
        rt.anim = a
        _play_sounds(a)
        if img is not None:
            rt.pending_with = store.img_fx.use(img[0], a.total)

        if wait is None:
            wait = cfg("wait")

        if wait:
            renpy.pause(a.total, hard=not cfg("skippable"), checkpoint=False, with_none=False)
            if rt.anim is a and not a.done():
                ## 클릭해서 건너뜀
                a.finish()
                _sounds_now_on(a)
        else:
            renpy.restart_interaction()

    def _img_transition_name(kind):
        """효과 폴더 그림 전환처럼 생긴 이름인지 (영어 소문자, 숫자, _)."""
        return isinstance(kind, str) and kind not in TRANSITIONS and re.match(r"^[a-z0-9_]+$", kind) is not None

    def _img_transition(kind):
        """kind가 효과 폴더(ui_kit/effects)의 그림 전환 이름이면 (이름, 기본 시간). 아니면 None. (5.6)"""
        if not _img_transition_name(kind):
            return None
        m = getattr(store, "img_fx", None)
        e = getattr(m, "EFFECTS", { }).get(kind) if m is not None else None
        if e is None:
            return None
        return (kind, float(e.get("time", 1.0)))

    def pending_with(fallback=None):
        """
        셰이더를 그림 전환으로 바꿀 때 짝이 되는 with (5.6. PyKaki가 상자 첫머리에 적음).
            $ screen_fx.shaders("glitch", "none", transition="pixelsort", duration=1.2)
            scene bg room
            with screen_fx.pending_with()
        바로 앞 shaders()/use()가 셰이더를 바꿨으면 그 그림 전환(앞 화면 → 지금 화면)을,
        셰이더가 그대로라 바꾸지 않았으면 fallback(없으면 None = 바로)을 돌려줍니다.
        """
        p = rt.pending_with
        rt.pending_with = None
        return p if p is not None else fallback

    def clear(transition=DEFAULT, duration=None, wait=None, overlay=DEFAULT, target=DEFAULT, exclude=DEFAULT, cursor=_KEEP, tv=None):
        """
        use()로 바꾼 효과를 끝내고 기본 효과로 돌아갑니다. (선택취소)
            $ screen_fx.clear()
            $ screen_fx.clear(transition="fade")
        덮개(overlay)와 글자 빼기(exclude)도 설정대로 돌아갑니다.
        커서 자리는 그대로입니다. 같이 돌리려면 clear(cursor="default")
        tv: 이번 TV 전환에만 쓰는 값 (5.5)
        """
        use(DEFAULT, transition=transition, duration=duration, wait=wait, overlay=overlay, target=target, exclude=exclude, cursor=cursor, tv=tv)

    def set_overlay(overlay, transition=DEFAULT, duration=None, wait=None):
        """
        지금 효과는 그대로 두고 덮개(VHS)만 켜거나 끕니다.
            $ screen_fx.set_overlay(True)                           # 덮개 켬
            $ screen_fx.set_overlay(False, transition="fade")       # 덮개만 서서히 걷어냄
            $ screen_fx.set_overlay("default")                      # 설정(screen_fx.overlay)대로
        """
        overlay = alias(overlay)
        _check_overlay(overlay)
        use(globals().get("current", None), transition=transition, duration=duration, wait=wait,
            overlay=overlay, exclude=globals().get("cur_target", DEFAULT))

    def set_values(name, duration=0.0, **values):
        """
        게임 중에 효과 하나의 값을 바꿉니다. 세이브·되감기에 저장됩니다. (5.0)
            $ screen_fx.set_values("vhs_crt", warp_amount=2.0)
            $ screen_fx.set_values("vhs_crt", strength=0.5, duration=1.0)   # 1초 동안 부드럽게
            $ screen_fx.set_values("vhs_crt")                               # 값 없이: 설정대로
        (<이름>.set(...)과 같습니다. 이름을 글자로 받는 것만 다름)
        """
        name = alias(name)
        fx = EFFECTS.get(name)
        if fx is None:
            raise Exception("screen_fx.set_values: {!r}라는 효과가 없습니다. 쓸 수 있는 이름: {}".format(name, ", ".join(names())))
        if values:
            fx.set(duration=duration, **values)
        else:
            fx.reset(duration=duration)

    ## ── 커서 자리 (4.2) ──
    ## UI Kit의 소프트웨어 커서를 화면 효과의 어디에 그릴지:
    ##   "effect"   기본 효과(ASCII 등)와 덮개(VHS)를 다 받음
    ##   "overlay"  덮개(VHS)만 받음
    ##   "top"      효과를 안 받음 (맨 위에 깨끗하게)

    CURSOR_MODES = ("effect", "overlay", "top")

    def _cursor_flag(raw):
        if raw == DEFAULT:
            return DEFAULT
        if raw in (None, False, NONE):
            return "top"
        if raw in CURSOR_MODES:
            return raw
        raise Exception("screen_fx: 커서 자리 {!r}는 쓸 수 없습니다. \"effect\"(효과까지) / \"overlay\"(덮개 밑) / \"top\"(효과 안 받음) / \"default\"(설정대로) 중에서 고르세요.".format(raw))

    def set_cursor(mode, restart=True):
        """
        커서를 화면 효과의 어디에 그릴지 바꿉니다. 다시 바꿀 때까지 유지되고, 세이브·되감기에 저장됩니다.
            $ screen_fx.set_cursor("effect")     # 기본 효과(ASCII 등)까지 받음
            $ screen_fx.set_cursor("overlay")    # 덮개(VHS)만 받음
            $ screen_fx.set_cursor("top")        # 효과 안 받음 (맨 위에 깨끗하게)
            $ screen_fx.set_cursor("default")    # 설정(screen_fx.cursor)대로
        (UI Kit의 소프트웨어 커서일 때만. 운영체제 커서는 늘 맨 위)
        """
        store.screen_fx.cur_cursor = _cursor_flag(mode)
        if restart:
            renpy.restart_interaction()

    def config_cursor():
        """설정(screen_fx.cursor)의 커서 자리."""
        try:
            f = _cursor_flag(cfg("cursor"))
        except Exception:
            f = DEFAULT
        return "effect" if f == DEFAULT else f

    def current_cursor():
        """지금 커서 자리: "effect" / "overlay" / "top"."""
        if rt.cursor_preview in CURSOR_MODES:
            return rt.cursor_preview
        try:
            f = _cursor_flag(globals().get("cur_cursor", DEFAULT))
        except Exception:
            f = DEFAULT
        return config_cursor() if f == DEFAULT else f

    CURSOR_LABELS = (("effect", "1번, 2번 다 받음"), ("overlay", "2번만 받음"), ("top", "셰이더 안 받음"))

    def cursor_label(mode):
        if mode == DEFAULT:
            return "설정대로({})".format(cursor_label(config_cursor()))
        return dict(CURSOR_LABELS).get(mode, str(mode))

    class _CursorSource(store.python_object):
        d = None
        hx = 0
        hy = 0

    cursor_source = _CursorSource()

    def set_cursor_source(d, hx=0, hy=0):
        """UI Kit이 부름: 효과 안에 그릴 커서 그림(d)과 클릭 기준점. None이면 효과 안에 그리지 않음."""
        cursor_source.d = d
        cursor_source.hx = hx
        cursor_source.hy = hy

    def cursor_inside():
        """지금 커서를 화면 효과 안에 그리는지. (그러면 UI Kit은 맨 위 커서를 그리지 않음)"""
        if cursor_source.d is None:
            return False
        if current_cursor() == "top":
            return False
        if editor_tab() is not None:
            ## 편집기 패널 뒤로 숨지 않게
            return False
        try:
            if renpy.game.preferences.system_cursor:
                return False
        except Exception:
            pass
        return True

    def _cursor_full(s):
        """효과와 덮개가 둘 다 화면 전체에 한 번에 씌워지는지 (글자 빼기 없이)."""
        for fx, ex in ((s.fx, s.ex), (s.ovl, s.ovl_ex)):
            if fx is not None and (ex or fx.layered()):
                return False
        return True

    class _CursorSlot(renpy.Displayable):
        """화면 효과 안에 커서를 그리는 자리.
        where: "effect" 기본 효과 전 / "overlay" 덮개 전 (화면 전체에 씌울 때) / "split" 따로 씌울 때"""

        def __init__(self, where, **kwargs):
            super(_CursorSlot, self).__init__(**kwargs)
            self.where = where

        def render(self, width, height, st, at):
            rv = renpy.Render(width, height)
            if not cursor_inside():
                renpy.redraw(self, 0.25)
                return rv

            full = _cursor_full(_shown())
            if self.where == "split":
                draw = not full
            else:
                draw = full and current_cursor() == self.where

            if draw:
                x, y = renpy.get_mouse_pos()
                if (0 <= x < width) and (0 <= y < height) and renpy.is_mouse_visible():
                    cr = renpy.render(cursor_source.d, width, height, st, at)
                    rv.subpixel_blit(cr, (x - cursor_source.hx, y - cursor_source.hy))

            ## 마우스를 따라가도록 매 프레임 다시 그림
            renpy.redraw(self, 0)
            return rv

        def visit(self):
            return [ cursor_source.d ] if cursor_source.d is not None else [ ]

    def cursor_effect_wrap(d):
        return store.Fixed(d, _CursorSlot("effect"))

    def cursor_overlay_wrap(d):
        return store.Fixed(d, _CursorSlot("overlay"))

    def cursor_split_wrap(d):
        c = store.Transform(_CursorSlot("split"), function=_make_layer_function("fx", "cursor"))
        c = store.Transform(c, function=_make_layer_function("ovl", "cursor"))
        return store.Fixed(d, c)

    def set_warp(amount, duration=0.0):
        """
        덮개(VHS) 가장자리 휘어짐을 바꿉니다. 세이브·되감기에 저장되고, 다시 바꿀 때까지 유지됩니다.
            $ screen_fx.set_warp(0.0)                  # 평평하게
            $ screen_fx.set_warp(3.0, duration=2.0)    # 2초 동안 크게 휘게
            $ screen_fx.set_warp("default")            # 설정 파일 값으로
        (= vhs_crt.set(warp_amount=3.0, duration=2.0). 다른 값은 vhs_crt.set()으로)
        """
        fx = EFFECTS.get(OVERLAY)
        if fx is None:
            return
        o = fx.overrides()
        if amount is None or amount == DEFAULT:
            o.pop("warp_amount", None)
        else:
            o["warp_amount"] = float(amount)
        fx._write(o, duration)
        renpy.restart_interaction()

    def warp_value():
        """지금 덮개 휘어짐 값."""
        fx = EFFECTS.get(OVERLAY)
        if fx is None:
            return None
        o = fx.overrides()
        if "warp_amount" in o:
            return o["warp_amount"]
        return fx.settings().get("warp_amount", fx.PARAMS.get("warp_amount", (None, 1.0))[1])

    def preview_transition(kind="tv", old=None, new=None):
        """편집기 미리 보기용: 효과는 바꾸지 않고 전환 모습만 보여줍니다."""
        cur = state_now()
        if kind is None:
            rt.anim = None
            return
        a = _Anim(kind, old or cur, new or cur, preview=True)
        rt.anim = a
        _play_sounds(a)
        renpy.restart_interaction()


    class Use(store.Action, store.DictEquality):
        """
        화면 버튼용: 효과 바꾸기 (전환이 끝나길 기다리지 않음)
            textbutton "ASCII" action screen_fx.Use("ascii")
            textbutton "ASCII+VHS" action screen_fx.Use("ascii", overlay=True)
        """

        def __init__(self, effect, transition=DEFAULT, duration=None, overlay=DEFAULT, target=DEFAULT, exclude=DEFAULT):
            self.effect = effect
            self.transition = transition
            self.duration = duration
            self.overlay = overlay
            self.target = target
            self.exclude = exclude

        def __call__(self):
            use(self.effect, transition=self.transition, duration=self.duration, wait=False,
                overlay=self.overlay, target=self.target, exclude=getattr(self, "exclude", DEFAULT))

        def get_selected(self):
            return current_effect() == resolve(self.effect)

    class Clear(Use):
        """textbutton "원래대로" action screen_fx.Clear()"""

        def __init__(self, transition=DEFAULT, duration=None):
            Use.__init__(self, DEFAULT, transition, duration)

    class SetOverlay(store.Action, store.DictEquality):
        """
        화면 버튼용: 덮개만 바꾸기
            textbutton "VHS 덮기" action screen_fx.SetOverlay(True)
            textbutton "덮개 걷기" action screen_fx.SetOverlay(False, transition="fade")
        """

        def __init__(self, overlay, transition=DEFAULT, duration=None):
            self.overlay = overlay
            self.transition = transition
            self.duration = duration

        def __call__(self):
            set_overlay(self.overlay, transition=self.transition, duration=self.duration, wait=False)

        def get_selected(self):
            return current_overlay() == _resolve_overlay(self.overlay, current_effect())

    class Toggle(store.Action, store.DictEquality):
        """
        플레이어용: 화면 효과 전부 켜기·끄기 (전환 연출 포함). 게임을 껐다 켜도 유지됩니다.
            textbutton _("화면 효과") action screen_fx.Toggle()
        """

        def __call__(self):
            store.persistent.screen_fx_off = not store.persistent.screen_fx_off
            rt.anim = None
            renpy.restart_interaction()

        def get_selected(self):
            return not store.persistent.screen_fx_off


    ## ── 대사 줄 괄호의 fx="…" ──
    ##     e "갑자기 화면이…" (fx="ascii")
    ##     e "돌아왔다." (fx="default")
    ##     e "천천히." (fx="gameboy", fx_transition="fade")
    ##     e "덮개 없이." (fx="ascii", fx_overlay=False)
    ##     e "덮개만 켬." (fx_overlay=True)
    ##     e "화면이 크게 휜다." (fx_warp=3.0)          # 덮개 휘어짐. "default"면 설정값으로
    ##     e "대사만 빼고." (fx="gameboy", fx_exclude=("say",))
    ##     e "대사창까지." (fx="ascii", fx_exclude=())
    ##     e "커서도 글자로." (fx="ascii", fx_cursor="effect")   # 커서 자리 (4.2)

    _MISSING = _KEEP
    _previous_say = None

    SAY_KEYS = ("fx", "fx_transition", "fx_overlay", "fx_target", "fx_exclude", "fx_warp", "fx_cursor")

    def say_arguments(who, *args, **kwargs):
        fx = kwargs.pop("fx", _MISSING)
        tr = kwargs.pop("fx_transition", DEFAULT)
        ov = kwargs.pop("fx_overlay", DEFAULT)
        tg = kwargs.pop("fx_target", DEFAULT)
        ex = kwargs.pop("fx_exclude", DEFAULT)
        warp = kwargs.pop("fx_warp", _MISSING)
        cur = kwargs.pop("fx_cursor", _MISSING)

        fn, ln = renpy.get_filename_line()
        before = state_now()

        if warp != _MISSING:
            set_warp(warp)

        if cur != _MISSING:
            set_cursor(cur)

        if fx != _MISSING or ov != DEFAULT or tg != DEFAULT or ex != DEFAULT:
            if fx == _MISSING:
                ## 효과는 그대로 두고 덮개·글자 빼기만 바꿈
                eff = globals().get("current", None)
                if ov == DEFAULT:
                    ov = globals().get("cur_overlay", DEFAULT)
                if tg == DEFAULT and ex == DEFAULT:
                    ex = globals().get("cur_target", DEFAULT)
            else:
                eff = fx
            use(eff, transition=tr, overlay=ov, target=tg, exclude=ex)

        after = state_now()
        rt.last_say = (fn, ln, before[0], after[0], (None if fx == _MISSING else fx), before, after)

        if _previous_say is not None:
            return _previous_say(who, *args, **kwargs)

        return args, kwargs


    ## ── 화면에 씌우기 ──

    def _paused(tab):
        """편집기의 다른 탭을 쓰는 중이고 편집 중 효과 보기가 꺼져 있어서, 효과를 잠시 끌 때 True."""
        if tab is None or tab == TAB_ID or tab in MENU_TABS:
            return False
        return not editor_preview_on()

    def _effect_obj(name, editor):
        ## 4.3: 어디에 씌울지는 자리(인게임 / 타이틀 / 게임 내 메뉴)로 정하므로 scope는 보지 않음
        fx = EFFECTS.get(name)
        if fx is None or not fx.is_enabled():
            return None
        if not editor:
            if not fx.player_enabled():
                return None
        return fx

    def _fill(rv, name, ovl, ex, editor, whole=False):
        """1번(name), 2번(ovl) 효과를 rv에 채웁니다. whole: 글자 빼기 없이 화면 전체에 (타이틀, 메뉴)."""
        rv.fx = _effect_obj(name, editor) if name not in (None, NONE) else None
        rv.ex = () if whole else ex
        if ovl is not None and ovl != NONE and ovl != name:
            rv.ovl = _effect_obj(ovl, editor)
            if rv.ovl is None or whole:
                rv.ovl_ex = ()
            elif rv.fx is None:
                ## 1번이 없으면 2번이 혼자 화면을 맡음: 고른 글자 빼기, 없으면 그 효과의 설정
                rv.ovl_ex = ex if ex else _split(rv.ovl.exclude())
            elif not ex:
                ## 1번이 화면 전체(아무것도 안 뺌)면 2번도 화면 전체 (2번이 늘 위에 오도록)
                rv.ovl_ex = ()
            else:
                rv.ovl_ex = _split(rv.ovl.exclude())
        return rv

    def _slots_shown(slots, editor, whole):
        a, b = slots
        ex = () if whole else _split(_resolve_exclude(a, DEFAULT))
        return _fill(_Shown(), a, b, ex, editor, whole)

    class _Shown(store.python_object):
        """지금 화면에 보일 것 (한 프레임)."""
        fx = None
        mix = 1.0
        ex = ()             # 효과에서 빼는 글자 묶음
        ovl = None
        ovl_mix = 1.0
        ovl_ex = ()         # 덮개에서 빼는 글자 묶음
        anim = None

    _NOTHING = _Shown()

    def _shown():
        tab = editor_tab()

        if _paused(tab):
            return _NOTHING

        rv = _Shown()

        if tab == TAB_ID:
            e = editing_effect()
            if e is not None:
                ## 편집기에서 고치는 효과만 보여줌 (덮개 없이)
                fx = EFFECTS[e]
                if fx.is_enabled():
                    rv.fx = fx
                    rv.ex = _split(fx.exclude())
                return rv
            ## "셰이더 고르기" 페이지: 고른 두 자리를 미리 보여줌 (4.3)
            pv = getattr(fx_tab(), "preview_slots", None)
            pv = pv() if callable(pv) else None
            if pv is not None:
                return _slots_shown(pv, True, False)
        elif tab in MENU_TABS:
            ## 타이틀 셰이더 / 게임 내 메뉴 셰이더 탭: 그 두 자리를 보여줌
            return _slots_shown(menu_slots(MENU_TABS[tab]), True, True)
        elif tab is None and store.persistent.screen_fx_off:
            return _NOTHING

        ## 타이틀, 게임 내 메뉴는 따로 고른 두 자리 (4.3)
        ctx = menu_context()
        if ctx is not None:
            return _slots_shown(menu_slots(ctx), tab is not None, True)

        a = rt.anim
        if a is not None and (a.done() or (not a.preview and a.new != state_now())):
            rt.anim = a = None

        if a is not None:
            state, mix, ovl_mix = a.shown()
        else:
            state, mix, ovl_mix = state_now(), 1.0, 1.0

        name, ovl, ex = state
        editor = tab is not None
        ex = _split(ex)

        rv.anim = a
        rv.mix = mix
        rv.ovl_mix = ovl_mix
        return _fill(rv, name, ovl, ex, editor)

    def _split(ex):
        """대사·선택지를 따로 층에 띄우지 않으면 글자는 한꺼번에만 뺄 수 있음."""
        ex = tuple(ex or ())
        if ex and not text_layers_on():
            return ALL_TEXT
        return ex

    _split_on = [ False ]

    def text_layers_on():
        """대사창·선택지가 따로 층에 떠 있는지 (screen_fx.split_text_layers)."""
        return _split_on[0]

    def _layer_has(layer):
        """그 층에 뭔가 떠 있는지. (빈 층에 셰이더를 걸면 다른 층의 그림을 읽어 버리므로 건너뜀)"""
        try:
            return bool(renpy.game.context().scene_lists.layers.get(layer))
        except Exception:
            return True

    _lay_seen = { }

    def _watch_layered(which, fx):
        """화면 전체에 씌우다가 층마다 씌우게 바뀌면(예: gameboy.set(text_pixel=True)) 화면을 다시 만듭니다.
        (꺼져 있던 쪽 트랜스폼은 스스로 다시 불리지 않으므로)"""
        key = (fx.id, fx.layered())
        old = _lay_seen.get(which)
        _lay_seen[which] = key
        if old is not None and old != key and old[0] == key[0]:
            renpy.restart_interaction()

    def _make_layer_function(which, where, layer=None):
        """which: "fx" 효과 / "ovl" 덮개
        where: None 화면 전체 / "scene" 장면 층 / "say" "choice" "screens" 글자 층 / "image" 스크린 안의 그림
        layer: 층마다 씌울 때 그 층 이름"""

        def f(trans, st, at):
            s = _shown()

            if which == "fx":
                fx, mix, ex = s.fx, s.mix, s.ex
            else:
                fx, mix, ex = s.ovl, s.ovl_mix, s.ovl_ex

            if fx is not None:
                _watch_layered(which, fx)

            if fx is None:
                on = False
            elif where is None:
                on = not ex and not fx.layered()
            elif where == "image":
                on = bool(ex) and ("screens" in ex)
            elif where == "cursor":
                ## 따로 그리는 커서 (글자 빼기 등으로 효과를 층마다 씌울 때)
                on = (cursor_inside() and not _cursor_full(s)
                    and (which == "ovl" or current_cursor() == "effect"))
            else:
                ## 글자를 뺐거나, 안 빼도 층마다 씌우는 효과(layered)일 때
                on = (bool(ex) or fx.layered()) and (where not in ex) and (layer is None or _layer_has(layer))

            if not on:
                trans.shader = None
                trans.mesh = None
                return 0 if s.anim is not None else None

            rv = fx.apply(trans, mix)
            if where not in (None, "scene"):
                trans.u_sfx_base = 0.0
            if where in TEXT_GROUPS:
                trans.u_sfx_text = 1.0
            return 0 if s.anim is not None else rv

        return f

    TV_SHADER = "screen_fx.tv"

    register_shader(TV_SHADER,
        variables="""
            uniform sampler2D tex0;
            uniform float u_lod_bias;
            uniform float u_time;
            attribute vec2 a_tex_coord;
            varying vec2 v_tex_coord;
            uniform float u_sfx_tv_flash;
            uniform float u_sfx_tv_noise;
        """,
        fragment_functions="""
            float sfx_tv_hash(vec2 p) {
                p = fract(p * vec2(443.897, 441.423));
                p += dot(p, p.yx + 19.19);
                return fract((p.x + p.y) * p.x);
            }
        """,
        vertex_200="""
            v_tex_coord = a_tex_coord;
        """,
        fragment_300="""
            vec4 tv_c = texture2D(tex0, v_tex_coord, u_lod_bias);
            tv_c.rgb = mix(tv_c.rgb, vec3(tv_c.a), clamp(u_sfx_tv_flash, 0.0, 1.0));
            float tv_n = sfx_tv_hash(floor(v_tex_coord * vec2(480.0, 270.0)) + vec2(floor(u_time * 30.0) * 1.37, 0.0));
            tv_c.rgb = mix(tv_c.rgb, vec3(tv_n) * tv_c.a, clamp(u_sfx_tv_noise, 0.0, 1.0));
            gl_FragColor = tv_c;
        """)

    def _tv_function(trans, st, at):
        a = rt.anim
        g = None

        if a is not None and not _paused(editor_tab()) and not a.done():
            g = a.tv_geometry()

        trans.xanchor = 0.5
        trans.yanchor = 0.5
        trans.xpos = 0.5
        trans.ypos = 0.5

        if g is None:
            trans.xzoom = 1.0
            trans.yzoom = 1.0
            trans.alpha = 1.0
            trans.shader = None
            trans.mesh = None
            return None if a is None else 0

        xz, yz, al, flash, noise = g
        trans.xzoom = xz
        trans.yzoom = yz
        trans.alpha = al
        trans.mesh = True
        trans.shader = TV_SHADER
        trans.u_sfx_tv_flash = float(flash)
        trans.u_sfx_tv_noise = float(noise)
        return 0

    class _Backdrop(renpy.Displayable):
        """TV 전환 중에만 화면 뒤를 검게 칠합니다. (줄어든 화면 바깥)"""

        def render(self, width, height, st, at):
            rv = renpy.Render(width, height)
            a = rt.anim
            if a is not None and a.kind == "tv" and not a.done() and not _paused(editor_tab()):
                rv.blit(renpy.render(_BLACK, width, height, st, at), (0, 0))
                renpy.redraw(self, 0)
            return rv

    _BLACK = store.Solid("#000")

    ## 화면에 씌우는 트랜스폼
    ##   층마다(글자를 뺄 때):   효과 → 덮개
    ##   화면 전체:              효과 → 덮개 → TV 전환  (아무것도 안 뺄 때)
    fx_layer = store.Transform(function=_make_layer_function("fx", None))
    ovl_layer = store.Transform(function=_make_layer_function("ovl", None))

    def layer_group(layer):
        """층 이름 → 묶음 ("scene", "say", "choice", "screens"). 효과를 층마다 씌우지 않는 층은 None."""
        return _groups.get(layer)

    _groups = { }
    tv_layer = store.Transform(function=_tv_function)

    def tv_wrap(d):
        ## 바탕은 화면을 다시 만들 때마다 새로 (그래야 전환이 시작될 때 다시 그려짐)
        return store.Fixed(_Backdrop(), tv_layer(child=d))

    ## ── 스크린 안의 그림에 씌우기 ──
    ##     screen map_view():
    ##         add "images/map.png" at screen_fx.scene
    ## 효과에서 "메뉴·화면"(screens)을 뺐을 때, 스크린 안의 이 그림에는 효과를 씌웁니다.
    ## (메뉴·화면도 효과를 받거나 화면 전체에 걸려 있으면 이미 씌워져 있으므로 아무것도 안 함)

    class _SceneFX(store.python_object):

        def __call__(self, child=None, **kwargs):
            if child is None:
                return self
            d = store.Transform(child, function=_make_layer_function("fx", "image"))
            return store.Transform(d, function=_make_layer_function("ovl", "image"))

    scene = _SceneFX()

    ## ── 이미지 하나에 거는 효과 (5.0) ──
    ##     show ghost at screen_fx.image_fx("hologram")
    ##     show ghost at screen_fx.image_fx("halftone", cell=6.0)     # 값을 바꿔서
    ## 화면 효과 자리와 상관없이 그 이미지에만 씌웁니다. 값을 안 적으면 그 효과의 설정 파일 값.

    class _ImageFX(store.python_object):
        def __init__(self, name, values):
            self.name = name
            self.values = dict(values)

        def __call__(self, trans, st, at):
            fx = EFFECTS.get(self.name)
            if fx is None or not fx.is_enabled():
                trans.shader = None
                trans.mesh = None
                return None
            rv = fx.apply_values(trans, self.values)
            trans.u_sfx_base = 1.0
            trans.u_sfx_text = 0.0
            return rv

    def image_fx(name, **values):
        """이미지에 거는 효과. show ... at screen_fx.image_fx("이름", 값=…)"""
        name = alias(name)
        fx = EFFECTS.get(name)
        if fx is None:
            raise Exception("screen_fx.image_fx: {!r}라는 효과가 없습니다. 쓸 수 있는 이름: {}".format(name, ", ".join(names())))
        if values:
            fx.check(values, "screen_fx.image_fx({!r})".format(name))
        return store.Transform(function=_ImageFX(name, values))

    ## ── 셰이더로 그리는 장면 전환 (5.0) ──
    ##     scene bg2 with screen_fx.TileSwap(1.0)        (포토 콜라주 효과 파일에 든 전환)
    ## 셰이더는 tex0(옛 장면), tex1(새 장면), u_sfx_swap(0 → 1 진행)을 받습니다.
    ## 새 전환을 만들 때: register_shader로 셰이더를 등록하고 ShaderSwap("셰이더 이름", 시간, u_값=…)

    import renpy.display.transition as _rtrans

    class _SwapDisp(_rtrans.Transition):

        def __init__(self, shader, time, uniforms, old_widget=None, new_widget=None, **properties):
            super(_SwapDisp, self).__init__(time, **properties)
            self.shader = shader
            self.time = time
            self.uniforms = uniforms
            self.old_widget = old_widget
            self.new_widget = new_widget
            self.events = False

        def render(self, width, height, st, at):
            if st >= self.time:
                self.events = True
                return renpy.render(self.new_widget, width, height, st, at)

            complete = min(1.0, st / self.time) if self.time > 0 else 1.0
            bottom = renpy.render(self.old_widget, width, height, st, at)
            top = renpy.render(self.new_widget, width, height, st, at)
            w = max(top.width, bottom.width)
            h = max(top.height, bottom.height)

            rv = renpy.Render(w, h)
            if top.get_size() != (w, h):
                top = top.subsurface((0, 0, w, h))
            if bottom.get_size() != (w, h):
                bottom = bottom.subsurface((0, 0, w, h))

            rv.mesh = True
            rv.add_shader(self.shader)
            rv.add_uniform("u_sfx_swap", complete)
            rv.add_uniform("u_sfx_swap_size", (float(w), float(h)))
            for k, v in self.uniforms.items():
                rv.add_uniform(k, v)
            rv.blit(bottom, (0, 0), focus=False, main=False)
            rv.blit(top, (0, 0), focus=True, main=True)
            renpy.redraw(self, 0)
            return rv

    class ShaderSwap(store.python_object):
        """셰이더로 그리는 장면 전환. scene bg with screen_fx.ShaderSwap("셰이더", 1.0, u_값=…)"""

        def __init__(self, shader, time=1.0, **uniforms):
            self.shader = shader
            self.time = float(time)
            self.uniforms = { k : (tuple(float(x) for x in v) if isinstance(v, (tuple, list)) else float(v)) for k, v in uniforms.items() }

        def __call__(self, old_widget=None, new_widget=None):
            return _SwapDisp(self.shader, self.time, self.uniforms, old_widget, new_widget)

    ## ── 세이브를 불러왔을 때 ──

    def _after_load():
        rt.anim = None

        ## 없어진 효과(4.0에서 지운 흑백 등)를 쓰던 세이브는 기본 효과로
        cur = getattr(store.screen_fx, "current", None)
        if cur not in (None, NONE, DEFAULT) and cur not in EFFECTS:
            store.screen_fx.current = None

        ## 예전 버전(2.x) 세이브의 vhs_crt.set() 값을 옮김
        old = getattr(getattr(store, "vhs_crt", None), "overrides", None)
        allo = getattr(store.screen_fx, "overrides", None) or { }
        if old and "vhs_crt" not in allo:
            allo = dict(allo)
            allo["vhs_crt"] = dict(old)
            store.screen_fx.overrides = allo

    store.config.after_load_callbacks.append(_after_load)

    def _check_config():
        b = cfg("base")
        if b != NONE and b not in EFFECTS:
            raise Exception("screen_fx.base: {!r}라는 효과가 없습니다. 쓸 수 있는 이름: {}".format(
                b, ", ".join(list(ORDER) + [ NONE ])))
        _check_transition(cfg("transition"))
        _check_overlay(cfg("overlay"), "screen_fx.overlay")
        for _k in MENU_KEYS.values():
            _v = cfg(_k)
            try:
                _a, _b = _v
            except Exception:
                raise Exception("screen_fx.{}는 (1번, 2번) 두 이름으로 적습니다. 예: (\"vhs_crt\", \"none\")".format(_k))
            for _n in (_a, _b):
                if _n != NONE and _n not in EFFECTS:
                    raise Exception("screen_fx.{}: {!r}라는 효과가 없습니다. 쓸 수 있는 이름: {}".format(
                        _k, _n, ", ".join([ NONE ] + list(ORDER))))
        _cursor_flag(cfg("cursor"))
        tv = dict(globals().get("tv", None) or { })
        tv.update(_lay().get("tv", { }))
        for k in tv:
            if k not in TV_DEFAULTS:
                raise Exception("screen_fx.tv에 모르는 이름 {!r}가 있습니다. 쓸 수 있는 이름: {}".format(
                    k, ", ".join(sorted(TV_DEFAULTS))))
        for fx in EFFECTS.values():
            fx.check(fx.settings(), "{}.settings".format(fx.id))
            for name, p in fx.presets().items():
                fx.check(p, "{}.presets[{!r}]".format(fx.id, name))
            t = fx.base_conf("target", None)
            if t is not None and t not in TARGETS:
                raise Exception("{}.target {!r}는 쓸 수 없습니다. 3.2부터는 {}.exclude로 뺄 글자를 고릅니다. 예: define {}.exclude = (\"say\", \"choice\")".format(fx.id, t, fx.id, fx.id))
            e = fx.base_conf("exclude", DEFAULT)
            if e != DEFAULT:
                norm_exclude(e, "{}.exclude".format(fx.id))


## 게임 중에 바뀌는 값 (세이브·되감기에 같이 저장됨)
default screen_fx.current = None             # use()로 고른 효과. None = 기본 효과
default screen_fx.cur_overlay = "default"      # use()로 고른 덮개. "default" = 설정대로, True 켬, False 끔
default screen_fx.cur_target = "default"       # use()로 고른 글자 빼기. "default" = 효과의 설정, 튜플 = 뺄 글자 묶음
default screen_fx.cur_cursor = "default"       # set_cursor()로 고른 커서 자리. "default" = 설정대로 (4.2)
default screen_fx.overrides = { }            # 효과별 set()·preset() 값
default screen_fx.changes = { }              # 효과별 바뀐 횟수와 전환 시간 (부드럽게 바꾸기용)


## 대사 줄 괄호의 fx="…"를 받습니다. UI Kit 대사 스타일(init 990)보다 먼저 걸어서,
## 대사 스타일이 이 함수에 이어서 넘겨주게 합니다.
init 980 python in screen_fx:

    if store.config.say_arguments_callback is not say_arguments:
        _previous_say = store.config.say_arguments_callback
        store.config.say_arguments_callback = say_arguments


init 998 python in screen_fx:

    _check_config()

    ## 대사창·선택지를 각자 층에 띄움 (글자 빼기를 묶음마다 고르려고)
    ##   층 순서: master … → sfx_say(대사창) → sfx_choice(선택지) → screens(퀵메뉴·메뉴) → overlay
    if cfg("split_text_layers"):
        _split_on[0] = True
        renpy.add_layer(SAY_LAYER, below="screens")
        renpy.add_layer(CHOICE_LAYER, below="screens")

        for _l in (SAY_LAYER, CHOICE_LAYER):
            if _l not in store.config.context_clear_layers:
                store.config.context_clear_layers.append(_l)

        ## 다른 코드가 이미 바꿔 둔 층은 건드리지 않음
        if store.config.say_layer == "screens":
            store.config.say_layer = SAY_LAYER
        if store.config.choice_layer == "screens":
            store.config.choice_layer = CHOICE_LAYER
        if getattr(store.config, "nvl_layer", "screens") == "screens":
            store.config.nvl_layer = SAY_LAYER
        if getattr(store.config, "nvl_choice_layer", "screens") == "screens":
            store.config.nvl_choice_layer = CHOICE_LAYER

        ## renpy.get_screen("say") 처럼 층을 적지 않고 찾을 때도 찾히도록, 스크린이 속한 층도 바꿈
        for (_name, _variant), _scr in list(renpy.display.screen.screens.items()):
            if _scr.layer != "screens":
                continue
            if _name == "say":
                _scr.layer = store.config.say_layer
            elif _name == "choice":
                _scr.layer = store.config.choice_layer
            elif _name == "nvl":
                _scr.layer = store.config.nvl_layer

    ## 층 → 묶음 (글자를 뺄 때 효과를 층마다 씌움)
    _layers = list(store.config.layers)
    if _split_on[0]:
        _i0 = _layers.index(SAY_LAYER)
        _i1 = _layers.index(CHOICE_LAYER)
    else:
        _i0 = _i1 = _layers.index("screens") - 0.5
    for _i, _l in enumerate(_layers):
        if _l in ("transient", "overlay"):
            continue
        if _i < _i0:
            _groups[_l] = "scene"
        elif _l == SAY_LAYER:
            _groups[_l] = "say"
        elif _l == CHOICE_LAYER:
            _groups[_l] = "choice"
        else:
            _groups[_l] = "screens"

    _lt = dict(store.config.layer_transforms)
    for _l, _g in _groups.items():
        _lt[_l] = list(_lt.get(_l, [ ])) + [
            store.Transform(function=_make_layer_function("fx", _g, _l)),
            store.Transform(function=_make_layer_function("ovl", _g, _l)),
            ]
    ## 커서 자리 (4.2): 기본 효과 전 / 덮개 전 / 따로 씌울 때
    _lt[None] = list(_lt.get(None, [ ])) + [ cursor_effect_wrap, fx_layer, cursor_overlay_wrap, ovl_layer, cursor_split_wrap, tv_wrap ]
    store.config.layer_transforms = _lt


init 800 python in screen_fx:

    ## ── 셰이더 목록 파일 (5.4, docs/LINK.md 11장) ──
    ## pygaki 앱(PyKaki)이 게임을 켜지 않고도 이 프로젝트에 어떤 셰이더가 있는지, 값과 막대가 무엇인지 알 수 있게
    ## <플러그인 폴더>/shader_list.json에 적어 둡니다. 개발 모드에서 게임을 켤 때, 내용이 달라졌을 때만 다시 씁니다.
    ## (새 효과를 engine/에 넣고 게임을 한 번 켜면 앱의 목록에도 나옵니다.)
    SHADER_LIST_FILE = "shader_list.json"

    def _plain(v):
        """JSON으로 적을 수 있는 모양으로 (튜플은 목록으로)."""
        if isinstance(v, dict):
            return { str(k) : _plain(x) for k, x in v.items() }
        if isinstance(v, (tuple, list, set, frozenset)):
            return [ _plain(x) for x in v ]
        if v is None or isinstance(v, (bool, int, float, str)):
            return v
        return str(v)

    def _shader_code(fx):
        """등록한 셰이더의 코드 (앱이 샘플을 그릴 때 씀). 못 꺼내면 None."""
        try:
            import renpy.gl2.gl2shadercache as cache
            names = fx.shader if isinstance(fx.shader, (tuple, list)) else (fx.shader, )
            rv = [ ]
            for name in names:
                part = cache.shader_part[name]
                rv.append({
                    "name": name,
                    "variables": part.raw_variables,
                    "vertex_functions": part.vertex_functions,
                    "fragment_functions": part.fragment_functions,
                    "vertex": [ [ pr, text ] for pr, _n, text in sorted(part.vertex_parts) ],
                    "fragment": [ [ pr, text ] for pr, _n, text in sorted(part.fragment_parts) ],
                    })
            return rv
        except Exception:
            return None

    def shader_list():
        """셰이더 자리에서 고를 수 있는 효과 모두(끈 것도). 순서는 편집기 버튼 순서."""
        rv = [ ]
        for n, lab in slot_choices(keep=ORDER)[1:]:
            fx = EFFECTS[n]
            rv.append({
                "prefix": fx.prefix,                    # 값 이름 앞에 붙는 유니폼 머리 (u_boil_)
                "extra": type(fx).extra is not ShaderEffect.extra,  # True면 파이썬이 값·그림을 더 넣는 효과 (ASCII의 글자 그림)
                "glsl": _shader_code(fx),               # 셰이더 코드 조각들
                "id": n,
                "label": lab,                           # 셰이더 자리 버튼에 보이는 이름
                "name": fx.label,                       # 효과의 이름
                "order": fx.order,
                "overlay_only": bool(fx.overlay_only),
                "params": _plain(fx.PARAMS),            # 값 이름: [종류, 기본값(, 고를 수 있는 값)]
                "groups": _plain(fx.GROUPS),            # 편집기 막대 묶음
                })
        return { "version": 2, "screen_fx": VERSION, "shaders": rv }

    def _write_shader_list():
        if not store.config.developer or renpy.android or renpy.ios or renpy.emscripten:
            return
        try:
            import json
            text = json.dumps(shader_list(), ensure_ascii=False, indent=1, sort_keys=True) + "\n"
            path = root_path(SHADER_LIST_FILE)
            old = None
            if os.path.exists(path):
                with open(path, "rb") as f:
                    old = f.read().decode("utf-8", "replace").replace("\r\n", "\n")
            if old == text:
                return
            with open(path, "wb") as f:
                f.write(text.encode("utf-8"))
        except Exception:
            pass    # 못 써도 게임은 그대로 돕니다 (읽기 전용 폴더 등)

    _write_shader_list()


init 990 python in screen_fx:
    ## 배포판을 만들 때 플러그인 폴더의 설명서(.md)는 빼고 묶습니다.
    store.build.classify(ROOT + "/**.md", None)
