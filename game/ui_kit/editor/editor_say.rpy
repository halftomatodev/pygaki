################################################################################
## UI Kit — 편집기: 대사 탭
##
## 화면에 떠 있는 대사 한 줄을 고칩니다.
##   - 대사 글자: 끌어서 옮기기, 글자 크기·글꼴·색
##   - 이름: 이름 상자를 끌어서 옮기기(배경 그림째), 이름 글자 크기·글꼴·색
##   - 대사 나오는 속도(배율)와 등장 효과. R로 그 줄을 다시 보여줍니다.
##   - 화면 효과 (screen_fx 플러그인이 있을 때): 이 대사부터 켤 효과, 선택취소, 전환, 덮개(VHS), 휘어짐
##       e "갑자기 눈앞이…" (fx="ascii")                      # 이 대사부터 ASCII
##       e "돌아왔다." (fx="default")                          # 선택취소 (기본 효과로)
##       e "천천히." (fx="gameboy", fx_transition="fade")      # 전환을 따로
##       e "덮개 없이." (fx="ascii", fx_overlay=False)          # 덮개(VHS) 끔. True면 켬
##       e "화면이 휜다." (fx_warp=3.0)                          # 덮개 휘어짐. "default"면 설정값으로
##       e "커서는 깨끗하게." (fx_cursor="top")                   # 커서 자리 (Screen FX 4.2)
##       e "대사창까지." (fx="ascii", fx_exclude=())             # 글자 빼기: () 안 뺌 / ("say", "choice") 대사·선택지 빼기
##
## Ctrl+S로 저장하면 원고(.rpy)의 그 대사 줄 괄호에 바로 적힙니다.
##     e "어디 갔었어?" (x=520, y=60, name_x=820, name_y=-60, speed=0.5, effect="jitter")
## 원래 괄호에 적혀 있던 다른 값은 그대로 두고, 바꾼 값만 고칩니다.
## 원고에 바로 쓸 수 없는 줄(여러 줄에 걸친 대사 등)은 Ctrl+C로 복사해서
## 붙여넣으세요.
##
## PyKaki가 만든 원고에서는 위치(대사, 이름)와 화면 효과만 고칩니다. 저장하면 원고와
## showpy_inbox.json에 같이 적습니다. 글자 모양, 속도, 등장 효과는 PyKaki에서 고칩니다.
##
## 캐릭터의 기본 모양은 say_style_config.rpy 등의 캐릭터 정의에서 고칩니다.
################################################################################

init offset = 1

init -8 python in ui_editor:

    class SayTab(Tab):

        id = "say"
        label = "대사"
        panel_screen = "ui_editor_say_panel"
        overlay_screen = None
        uses_mode = False
        uses_scope = False
        shows_line = True
        copy_hint = "원고에 바로 저장되지 않는 줄에 쓰세요. 그 대사 줄 괄호에 붙여넣습니다."

        ## 고칠 대상별 짧은 이름
        KEYS = {
            "what": dict(x="x", y="y", size="size", font="font", color="color"),
            "name": dict(x="name_x", y="name_y", size="name_size", font="name_font", color="name_color"),
            }

        ## say 스크린의 부분(id)과 그 기본 스타일
        WIDGETS = (("what", "say_dialogue"), ("who", "say_label"), ("namebox", "namebox"), ("window", "window"))

        ## 속도 배율 버튼
        SPEEDS = (0.25, 0.5, 0.75, 1.0, 1.5, 2.0, 4.0)

        ## 등장 효과 버튼 (렌파이 내장 텍스트 셰이더)
        EFFECTS = (
            (None, "없음"),
            ("dissolve", "서서히"),
            ("typewriter", "타자기"),
            ("slowalpha", "흐리게 대기"),
            ("flip", "뒤집히며"),
            ("zoom", "커지며"),
            ("jitter", "떨림"),
            ("wave", "물결"),
            )

        def __init__(self):
            self.target = "what"        # "what" 대사 글자, "name" 이름
            self.orig_screen = None
            self.orig_props = None      # 편집 전 say 스크린 부분별 속성 { "what": {...}, ... }

            ## (파일, 줄) -> 그 줄의 Say 문장. 원고에 쓸 때 원래 괄호와 대사를 확인합니다.
            self.nodes = { }

        def ss(self):
            return getattr(store, "say_style", None)

        def se(self):
            return getattr(store, "script_edit", None)

        def k(self, name):
            """지금 대상의 짧은 이름. k("x") → "x" 또는 "name_x"."""
            return self.KEYS[self.target][name]

        ## PyKaki 원고에서 저장하는 값
        PK_POS = ("x", "y", "name_x", "name_y")
        PK_FX = ("fx", "fx_transition", "fx_overlay", "fx_warp", "fx_cursor", "fx_exclude")

        def _pk_fx_value(self, k, v):
            """괄호의 화면 효과 값 → PyKaki 대본에 적는 값. 지운 값은 None."""
            if isinstance(v, str) and v == self.ss().REMOVE:
                return None
            if k == "fx":
                return "default" if v is None else v
            if k == "fx_transition":
                return "none" if v is None else v
            if k == "fx_overlay":
                return "on" if v else "off"
            if k == "fx_warp":
                return "default" if v in (None, "default") else "{:g}".format(float(v))
            if k == "fx_exclude":
                return list(v)
            return v

        def pk(self):
            """지금 줄이 PyKaki 원고인지. 그러면 위치만 고칩니다."""
            se = self.se()
            last = self.line() if self.ss() is not None else None
            return bool(se is not None and last is not None and se.is_pykaki(last.filename))

        ## ── 지금 화면의 대사 ──

        def available(self):
            ss = self.ss()
            if ss is None:
                return (False, "대사 스타일 기능이 없습니다.")
            if not ss.is_on():
                return (False, "대사 스타일 기능이 꺼져 있습니다. (say_style.enabled)")
            if store.renpy.get_screen("say") is None:
                return (False, "대사가 화면에 있을 때 쓸 수 있습니다.")
            if self.line() is None:
                return (False, "스크립트의 대사 줄에서 쓸 수 있습니다.")
            return (True, "")

        def line(self):
            """지금 보이는 대사 줄의 기록 (say_style 엔진이 남긴 것)."""
            import renpy
            node = current_node()
            last = self.ss().state.last
            if node is None or last is None or not isinstance(node, renpy.ast.Say):
                return None
            if (last.filename, last.linenumber) != (node.filename, node.linenumber):
                return None
            return last

        def char_name(self):
            last = self.line()
            if last is None:
                return None
            return self.ss().character_name(last.who)

        def line_key(self):
            last = self.line()
            return (last.filename, last.linenumber)

        def name_ok(self):
            """이름을 고칠 수 있는지. (True, "") 또는 (False, "이유")"""
            if "namebox" not in store.config.character_id_prefixes:
                return (False, "screens.rpy에 config.character_id_prefixes.append('namebox') 줄이 없어서 이름 위치를 바꿀 수 없습니다.")
            try:
                if store.renpy.get_displayable("say", "namebox") is None:
                    return (False, "이 대사에는 이름이 없습니다.")
            except Exception:
                return (False, "이 대사에는 이름이 없습니다.")
            return (True, "")

        def set_target(self, target):
            if target == "name":
                ok, why = self.name_ok()
                if not ok:
                    msg(why)
                    return
            self.target = target
            msg("")

        def select(self, step):
            self.set_target("name" if self.target == "what" else "what")

        ## ── 바꾼 값 ──

        def _edits(self):
            """지금 줄의 바꾼 값 (처음 고칠 때 그 줄을 기억해 둡니다)."""
            key = self.line_key()
            if key not in self.nodes:
                self.nodes[key] = current_node()
                se = self.se()
                if se is not None:
                    se.remember(key[0], key[1])
            return self.ss().state.line_edits.setdefault(key, { })

        def _combined(self, key):
            """원고에 이미 쓴 값 + 아직 안 쓴 값."""
            s = self.ss().state
            rv = dict(s.saved.get(key, { }))
            rv.update(s.line_edits.get(key, { }))
            return rv

        def _script_has(self, short):
            """원고의 이 줄 괄호에 이 값(같은 뜻의 다른 이름 포함)이 적혀 있는지."""
            last = self.line()
            if last is None:
                return False
            ss = self.ss()
            n = ss.native(short)
            return any(ss.native(k) == n for k in last.kwargs)

        def _set_or_default(self, short, value):
            """value가 None이면 '기본으로' (원고에 적혀 있었으면 지움)."""
            e = self._edits()
            if value is None:
                if self._script_has(short):
                    e[short] = self.ss().REMOVE
                else:
                    e.pop(short, None)
            else:
                e[short] = value

        ## ── 화면에 바로 보여주기 ──
        ## say 스크린의 부분별 속성을 바꿔서 다시 그립니다. (끌기·크기·색은 바로 보임)

        def _split(self, short):
            """짧은 이름 → (부분 id, 속성). x → ("what", "xpos"), name_x → ("namebox", "xpos")"""
            n = self.ss().native(short)
            for wid, _st in self.WIDGETS:
                if n.startswith(wid + "_"):
                    return wid, n[len(wid) + 1:]
            return None

        def _screen(self):
            return store.renpy.get_screen("say")

        def _ensure_orig(self):
            scr = self._screen()
            if scr is None:
                return None
            if self.orig_screen is not scr:
                self.orig_screen = scr
                self.orig_props = { wid : dict(scr.widget_properties.get(wid, { }) or { }) for wid, _st in self.WIDGETS }
            return scr

        def _props(self, wid):
            """지금 줄에 보여줄 부분(wid)의 속성."""
            scr = self._ensure_orig()
            if scr is None:
                return { }
            base = dict(self.orig_props.get(wid, { }))
            if self.line() is not None:
                REMOVE = self.ss().REMOVE
                for k, v in self._combined(self.line_key()).items():
                    s = self._split(k)
                    if s is None or s[0] != wid:
                        continue
                    if isinstance(v, str) and v == REMOVE:
                        base.pop(s[1], None)
                    else:
                        base[s[1]] = v
            return base

        def refresh(self):
            scr = self._ensure_orig()
            if scr is None:
                return
            for wid in ("what", "who", "namebox"):
                if wid in scr.widget_properties or self._props(wid):
                    scr.widget_properties[wid] = self._props(wid)
            store.renpy.restart_interaction()

        def restore_screen(self):
            scr = self._screen()
            if scr is not None and scr is self.orig_screen and self.orig_props is not None:
                for wid in ("what", "who", "namebox"):
                    if wid in scr.widget_properties:
                        scr.widget_properties[wid] = dict(self.orig_props.get(wid, { }))
                store.renpy.restart_interaction()
            self.orig_screen = None
            self.orig_props = None

        def on_open(self):
            if self.target == "name" and not self.name_ok()[0]:
                self.target = "what"
            if self.available()[0]:
                self.refresh()

        def on_close(self):
            self.restore_screen()

        def replay_on_close(self):
            """닫을 때 그 줄을 다시 보여줘야 하는지. (다시 보기로 편집 값이 들어간 채 보이고 있으면)"""
            last = self.ss().state.last if self.ss() is not None else None
            return bool(last is not None and getattr(last, "injected", False))

        ## ── 다시 보기 ──
        ## 렌파이 말풍선 편집기와 같은 방법: 그 줄의 처음으로 되감아 다시 보여줍니다.
        ## 다시 보여줄 때 say_style 엔진이 편집 중인 값을 그 줄에 넣어 줍니다.

        def replay(self):
            if self.line() is None:
                return
            self.restore_screen()
            store.renpy.rollback(checkpoints=0, force=True, greedy=True)

        ## ── 값 읽기 ──

        def _style_value(self, wid, prop):
            props = self._props(wid)
            if prop in props:
                return props[prop]
            st = props.get("style", dict(self.WIDGETS)[wid])
            try:
                if isinstance(st, str):
                    st = getattr(store.style, st)
                return getattr(st, prop)
            except Exception:
                return None

        def cur(self, short):
            s = self._split(short)
            if s is None:
                return None
            return self._style_value(*s)

        def _num(self, v, size):
            if v is None:
                return 0
            if hasattr(v, "absolute") and hasattr(v, "relative"):
                return float(v.absolute) + float(v.relative) * size
            if type(v).__name__ == "absolute":
                return float(v)
            if isinstance(v, float) and abs(v) <= 1.0:
                return v * size
            try:
                return float(v)
            except Exception:
                return 0

        def speed(self):
            v = self.cur("speed")
            try:
                return float(v) if v is not None else 1.0
            except Exception:
                return 1.0

        def effect(self):
            v = self.cur("effect")
            return v if isinstance(v, str) else None

        def effect_label(self):
            e = self.effect()
            for name, label in self.EFFECTS:
                if name == e:
                    return label
            return e or "없음"

        ## ── 대사 창 위치 (화면 기준 숫자를 보여주기 위해) ──

        def window_origin(self):
            """대사 창 왼쪽 위의 화면 좌표 (x, y). 계산할 수 없으면 None."""
            if self._ensure_orig() is None:
                return None
            props = dict(self.orig_props.get("window", { }))
            st = props.get("style", "window")
            try:
                if isinstance(st, str):
                    st = getattr(store.style, st)
            except Exception:
                return None

            ## 묶음 속성 풀기 (yalign → ypos + yanchor 등)
            for short, (a, b) in (("align", ("xalign", "yalign")), ("pos", ("xpos", "ypos")),
                    ("anchor", ("xanchor", "yanchor")), ("xysize", ("xsize", "ysize"))):
                if short in props and props[short] is not None:
                    props.setdefault(a, props[short][0])
                    props.setdefault(b, props[short][1])
            for ax in "xy":
                if ax + "align" in props:
                    props.setdefault(ax + "pos", props[ax + "align"])
                    props.setdefault(ax + "anchor", props[ax + "align"])

            def prop(name):
                if name in props:
                    return props[name]
                return getattr(st, name, None)

            def axis(ax, full):
                size = prop(ax + "size")
                if size is None:
                    ## xsize/ysize는 스타일에 xminimum/xmaximum으로 들어 있습니다.
                    lo = prop(ax + "minimum")
                    hi = prop(ax + "maximum")
                    if lo is not None and lo == hi:
                        size = lo
                if size is None and prop(ax + "fill"):
                    size = full
                pos = self._num(prop(ax + "pos"), full)
                anchor = prop(ax + "anchor")
                if anchor is None:
                    return pos
                if isinstance(anchor, float) and not hasattr(anchor, "absolute") and type(anchor).__name__ != "absolute":
                    if size is None:
                        return pos if anchor == 0 else None
                    return pos - anchor * self._num(size, full)
                return pos - self._num(anchor, full)

            x = axis("x", store.config.screen_width)
            y = axis("y", store.config.screen_height)
            if x is None or y is None:
                return None
            return (x, y)

        def focus_rect(self):
            """고르고 있는 대사 글자(또는 이름)의 대략 둘레. 패널이 가리면 비킵니다."""
            if self.line() is None:
                return None
            org = self.window_origin()
            if org is None:
                return None
            x, y = self._start()
            if self.target == "name":
                return (org[0] + x - 20, org[1] + y - 10, 260, 70)
            w = self._num(self.cur("width"), store.config.screen_width) or 600
            return (org[0] + x - 10, org[1] + y - 10, min(int(w), 900) + 20, 140)

        ## ── 위치 ──

        def _start(self):
            return (self._num(self.cur(self.k("x")), store.config.screen_width),
                    self._num(self.cur(self.k("y")), store.config.screen_height))

        def _set(self, **kw):
            self._edits().update(kw)
            self.refresh()

        def _check_target(self):
            if self.target == "name":
                ok, why = self.name_ok()
                if not ok:
                    self.target = "what"
                    msg(why)
                    return False
            return True

        def drag_begin(self, x, y):
            if not self._check_target():
                return None
            return self._start()

        def drag_move(self, token, dx, dy):
            sx, sy = token
            self._set(**{ self.k("x") : int(round(sx + dx)), self.k("y") : int(round(sy + dy)) })

        def move(self, dx, dy):
            if not self._check_target():
                return
            sx, sy = self._start()
            self._set(**{ self.k("x") : int(round(sx + dx)), self.k("y") : int(round(sy + dy)) })

        def nudge(self, what, amount):
            if what != "size" or not self._check_target():
                return
            if self.pk():
                msg("PyKaki 원고입니다. 글자 크기는 PyKaki에서 고치세요.")
                return
            cur =self.cur(self.k("size")) or store.gui.text_size
            self._set(**{ self.k("size") : int(max(4, int(cur) + amount)) })

        def wheel(self, sign, shift):
            self.nudge("size", -sign * (5 if shift else 1))

        ## ── 속도·효과 (바꾸면 그 줄을 다시 보여줌) ──

        def set_speed(self, v):
            self._set_or_default("speed", None if abs(v - 1.0) < 1e-9 else v)
            self.replay()

        def set_effect(self, name):
            self._set_or_default("effect", name)
            self.replay()

        ## ── 화면 효과 (screen_fx 플러그인이 있을 때) ──
        ## fx는 그 대사가 나오기 전에 화면 효과를 바꾸고, 다음에 바꿀 때까지 유지됩니다.

        FX_TRANSITIONS = (("tv", "TV 껐다 켜기"), ("fade", "서서히"), (None, "바로"))

        def sfx(self):
            m = getattr(store, "screen_fx", None)
            if m is None or not hasattr(m, "choices") or not hasattr(m, "rt"):
                return None
            return m

        def fx_choices(self):
            m = self.sfx()
            return m.choices() if m is not None else [ ]

        def _line_value(self, short):
            """이 줄 괄호의 값 (편집 중인 값 포함). (있는지, 값)"""
            key = self.line_key()
            c = self._combined(key)
            REMOVE = self.ss().REMOVE
            if short in c:
                v = c[short]
                if isinstance(v, str) and v == REMOVE:
                    return (False, None)
                return (True, v)
            last = self.line()
            if last is not None and short in last.kwargs:
                return (True, last.kwargs[short])
            return (False, None)

        def fx_line(self):
            """이 줄에서 켜는 효과 이름. 이 줄에서 안 바꾸면 None."""
            has, v = self._line_value("fx")
            if not has:
                return None
            return "default" if v is None else v

        def fx_transition_value(self):
            has, v = self._line_value("fx_transition")
            if has:
                return v
            m = self.sfx()
            return m.cfg("transition") if m is not None else "tv"

        def set_fx(self, name):
            """name: 효과 이름, "default"(선택취소), None(이 줄에서 안 바꿈)"""
            self._set_or_default("fx", name)
            if name is None:
                ## 덮개·휘어짐은 효과와 따로 고르므로 그대로 둠
                self._set_or_default("fx_transition", None)
                self._set_or_default("fx_target", None)
                self._set_or_default("fx_exclude", None)
            self.replay()

        ## 덮개 (fx_overlay): FOLLOW = 괄호에 안 적음(앞에서 이어짐/설정대로), True = 켬, False = 끔
        FOLLOW = "__follow__"

        def fx_overlay_value(self):
            has, v = self._line_value("fx_overlay")
            if not has:
                return self.FOLLOW
            m = self.sfx()
            f = m.overlay_flag(v) if (m is not None and hasattr(m, "overlay_flag")) else v
            return self.FOLLOW if f == "default" else f

        def set_fx_overlay(self, v):
            if v == self.FOLLOW:
                self._set_or_default("fx_overlay", None)
            else:
                self._edits()["fx_overlay"] = bool(v)
            self.replay()

        def overlay_choices(self):
            return [ (self.FOLLOW, "그대로"), (True, "켬"), (False, "끔") ]

        ## 덮개 휘어짐 (fx_warp): FOLLOW = 괄호에 안 적음(앞에서 이어짐), "default" = 설정값으로, 숫자
        WARPS = ((0.0, "0 평평"), (0.5, "0.5"), (1.0, "1 기본"), (2.0, "2"), (3.0, "3"), (5.0, "5 크게"))

        def has_warp(self):
            m = self.sfx()
            return m is not None and hasattr(m, "set_warp")

        def fx_warp_value(self):
            has, v = self._line_value("fx_warp")
            if not has:
                return self.FOLLOW
            if v is None or v == "default":
                return "default"
            try:
                return float(v)
            except Exception:
                return v

        def set_fx_warp(self, v):
            if v == self.FOLLOW:
                self._set_or_default("fx_warp", None)
            else:
                self._edits()["fx_warp"] = v
            self.replay()

        def warp_now(self):
            m = self.sfx()
            w = m.warp_value() if (m is not None and hasattr(m, "warp_value")) else None
            return None if w is None else "{:g}".format(float(w))

        ## 커서 자리 (fx_cursor, Screen FX 4.2): FOLLOW = 괄호에 안 적음(앞에서 이어짐), "default" = 설정대로,
        ##   "effect" 효과까지 / "overlay" 덮개 밑 / "top" 효과 안 받음
        def has_cursor(self):
            m = self.sfx()
            return m is not None and hasattr(m, "set_cursor")

        def fx_cursor_value(self):
            has, v = self._line_value("fx_cursor")
            if not has:
                return self.FOLLOW
            return "default" if v is None else v

        def set_fx_cursor(self, v):
            if v == self.FOLLOW:
                self._set_or_default("fx_cursor", None)
            else:
                self._edits()["fx_cursor"] = v
            self.replay()

        def cursor_choices(self):
            m = self.sfx()
            return [ (self.FOLLOW, "그대로"), ("default", "설정값") ] + list(m.CURSOR_LABELS)

        ## 글자 빼기 (fx_exclude): FOLLOW = 괄호에 안 적음(효과의 설정대로), 튜플 = 뺄 글자 묶음
        ##   예전 괄호 fx_target="screen"/"scene"도 읽음
        def has_exclude(self):
            m = self.sfx()
            return m is not None and hasattr(m, "TEXT_GROUPS")

        def text_groups(self):
            m = self.sfx()
            return [ (g, m.TEXT_LABELS[g]) for g in m.TEXT_GROUPS ]

        def fx_exclude_value(self):
            """괄호에 적힌 값 (튜플) 또는 FOLLOW."""
            m = self.sfx()
            has, v = self._line_value("fx_exclude")
            if has:
                try:
                    return m.norm_exclude(v)
                except Exception:
                    return self.FOLLOW
            has, v = self._line_value("fx_target")
            if has and v in m.TARGETS:
                return m.target_exclude(v)
            return self.FOLLOW

        def fx_exclude_effective(self):
            """이 줄에서 실제로 빠지는 글자 묶음 (설정대로일 때는 고른 효과의 설정)."""
            m = self.sfx()
            v = self.fx_exclude_value()
            if v != self.FOLLOW:
                return v
            name = self.fx_line()
            fx = m.EFFECTS.get(m.resolve(name)) if name is not None else None
            return fx.exclude() if fx is not None else ()

        def follow_exclude(self):
            self._set_or_default("fx_exclude", None)
            self._set_or_default("fx_target", None)
            self.replay()

        def toggle_exclude(self, group):
            cur = list(self.fx_exclude_effective())
            if group in cur:
                cur.remove(group)
            else:
                cur.append(group)
            m = self.sfx()
            self._set_or_default("fx_target", None)
            self._edits()["fx_exclude"] = m.norm_exclude(cur)
            self.replay()

        def set_fx_transition(self, kind):
            m = self.sfx()
            if m is not None and kind == m.cfg("transition"):
                self._set_or_default("fx_transition", None)
            else:
                self._edits()["fx_transition"] = kind
            store.renpy.restart_interaction()

        def fx_preview_on(self):
            """편집 중 화면 효과 보기 (screen_fx의 값, V 키와 같음)"""
            m = self.sfx()
            return bool(m is not None and m.editor_preview_on())

        def toggle_fx_preview(self):
            toggle_fx_preview()

        def _fx_record(self):
            """이 줄이 나올 때 기록된 (바뀌기 전, 바뀐 뒤). 없으면 None."""
            m = self.sfx()
            last = self.line()
            r = m.rt.last_say if m is not None else None
            if r is None or last is None or (r[0], r[1]) != (last.filename, last.linenumber):
                return None
            return (r[2], r[3])

        def _fx_states(self):
            """이 줄이 나올 때 기록된 (바뀌기 전 상태, 바뀐 뒤 상태). 상태 = (효과, 덮개, 적용 대상)"""
            m = self.sfx()
            last = self.line()
            r = m.rt.last_say if m is not None else None
            if r is None or last is None or (r[0], r[1]) != (last.filename, last.linenumber) or len(r) < 7:
                return None
            return (r[5], r[6])

        def preview_fx(self):
            """이 줄의 전환을 다시 보여줍니다. (편집 중에는 효과를 보여주도록 켬)"""
            m = self.sfx()
            rec = self._fx_record()
            if m is None or rec is None:
                return
            m.rt.editor_preview = True
            kind = self.fx_transition_value()
            if kind is None:
                msg("이 줄의 전환은 '바로'라서 보여줄 전환이 없습니다.")
                store.renpy.restart_interaction()
                return
            st = self._fx_states()
            if st is not None:
                m.preview_transition(kind, st[0], st[1])
            else:
                m.preview_transition(kind, rec[0], rec[1])

        def fx_info(self):
            m = self.sfx()
            if m is None:
                return None
            rec = self._fx_record()
            fx = self.fx_line()
            st = self._fx_states()
            extra = ""
            if st is not None:
                after = st[1]
                if after[1]:
                    extra += " + 덮개 VHS"
                    if self.warp_now() is not None:
                        extra += " (휘어짐 {})".format(self.warp_now())
                else:
                    extra += ", 덮개 끔"
                extra += ", " + m.target_label(after[2])
                if hasattr(m, "current_cursor"):
                    extra += ", 커서 " + dict(m.CURSOR_LABELS).get(m.current_cursor(), "")
            if fx is not None:
                tl = dict(self.FX_TRANSITIONS).get(self.fx_transition_value(), str(self.fx_transition_value()))
                shown = m.effect_label(m.resolve(fx))
                if fx == "default":
                    return "화면 효과: 선택취소 → {}{} ({})".format(shown, extra, tl)
                return "화면 효과: 이 줄부터 {}{} ({})".format(shown, extra, tl)
            if rec is not None:
                return "화면 효과: {}{} (앞에서 이어짐)".format(m.effect_label(rec[1]), extra)
            return "화면 효과: {} (앞에서 이어짐)".format(m.effect_label(m.current_effect()))

        ## ── 되돌리기 ──

        def reset_item(self):
            self.ss().state.line_edits.pop(self.line_key(), None)
            msg("이 줄의 저장 안 한 변경을 되돌렸습니다.")
            self.replay()

        def discard(self):
            self.ss().state.line_edits = { }
            msg("모든 줄의 저장 안 한 변경을 버렸습니다.")
            self.replay()

        ## ── 글꼴·색 ──

        def style_keys(self):
            if self.pk():
                return ()
            return (self.k("font"), self.k("color"))

        def value_label(self, key):
            return {
                "font": "글꼴", "color": "색",
                "name_font": "이름 글꼴", "name_color": "이름 색",
                }.get(key, key)

        def get_value(self, key):
            v = self.cur(key)
            return v if isinstance(v, str) else None

        def set_value(self, key, value):
            self._set(**{ key : value })

        ## ── 원고에 쓰기 ──

        def pending_lines(self):
            ss = self.ss()
            if ss is None:
                return 0
            return len([ v for v in ss.state.line_edits.values() if v ])

        def _node(self, key):
            import renpy
            node = self.nodes.get(key)
            if node is None:
                node = find_node(key[0], key[1], renpy.ast.Say)
                if node is not None:
                    self.nodes[key] = node
            return node

        def _arguments(self, key):
            node = self._node(key)
            arginfo = getattr(node, "arguments", None)
            ss = self.ss()
            return merge_arguments(arginfo, self._combined(key), canon=ss.native, remove=ss.REMOVE)

        def script_edits(self):
            ss = self.ss()
            se = self.se()
            if ss is None or se is None:
                return [ ]
            rv = [ ]
            for key, edits in ss.state.line_edits.items():
                if not edits:
                    continue
                node = self._node(key)
                if node is None:
                    continue
                e = se.Edit(key[0], key[1], se.SAY, self._arguments(key), expect=node.what)
                if se.is_pykaki(key[0]):
                    REMOVE = ss.REMOVE
                    c = self._combined(key)
                    e.pk_pos = { k : v for k, v in c.items() if k in self.PK_POS and not (isinstance(v, str) and v == REMOVE) }
                    e.pk_fx = { ("fx" if k == "fx" else k[3:]) : self._pk_fx_value(k, v) for k, v in c.items() if k in self.PK_FX }
                e.key = key
                rv.append(e)
            return rv

        def after_script_save(self, edits):
            s = self.ss().state
            for e in edits:
                if not e.ok:
                    continue
                key = e.key
                s.saved[key] = self._combined(key)
                s.line_edits.pop(key, None)
            self.refresh()

        def line_text(self):
            args = self._arguments(self.line_key())
            return "(" + ", ".join(args) + ")" if args else "(괄호 없음)"

        def copy_text(self):
            if self.line() is None or not self._arguments(self.line_key()):
                return None
            return self.line_text()

        ## ── 패널 ──

        def info_lines(self):
            last = self.line()
            if last is None:
                return [ ]
            node = current_node()
            name = self.char_name() or "(이름 없는 캐릭터)"
            rv = [ ]
            rv.append("{}   캐릭터: {}".format(node_place(node), name))

            x, y = self._start()
            org = self.window_origin()
            where = ", 화면 기준 {:.0f}, {:.0f}".format(org[0] + x, org[1] + y) if org is not None else ""
            what = "이름 상자" if self.target == "name" else "대사"
            rv.append("{} x {:.0f}   y {:.0f}   (대사 창 기준{})   크기 {}".format(
                what, x, y, where, self.cur(self.k("size")) or "-"))

            if self.pk():
                rv.append("PyKaki 원고입니다. 여기서는 위치와 화면 효과를 고치고, 글자 모양, 속도, 등장 효과는 PyKaki에서 고칩니다.")
            else:
                rv.append("속도 ×{:g}   효과 {}".format(self.speed(), self.effect_label()))

            fxi = self.fx_info()
            if fxi:
                rv.append(fxi + ("" if self.fx_preview_on() else " - 편집 중에는 꺼 둠 (V로 켜기)"))

            try:
                import renpy
                if renpy.game.preferences.text_cps == 0:
                    rv.append("텍스트 속도가 '즉시'라서 속도와 서서히/타자기 같은 효과는 안 보입니다. (물결, 떨림은 보임)")
                    rv.append("보려면 게임의 환경설정에서 텍스트 속도를 낮추세요.")
            except Exception:
                pass

            rv.append("괄호: " + self.line_text())
            n = self.pending_lines()
            if n:
                rv.append("원고에 저장 안 한 대사 {}줄 (Ctrl+S)".format(n))
            elif self.line_key() in self.ss().state.saved:
                rv.append("이 줄은 원고에 저장했습니다.")
            else:
                rv.append("변경 없음")
            return rv

        def help_lines(self):
            if self.pk():
                return [
                    "마우스: 드래그하면 고르는 것(대사/이름)이 움직임 (Shift: 한 방향)",
                    "Tab 대사/이름 바꾸기 | 방향키 이동 (Shift: 10배) | R 다시 보기 | Backspace 이 줄 되돌리기",
                    ]
            return [
                "마우스: 드래그하면 고르는 것(대사/이름)이 움직임 (Shift: 한 방향) | 휠 글자 크기",
                "Tab 대사/이름 바꾸기 | 방향키 이동 (Shift: 10배) | S/W 글자 크기 | R 다시 보기 | Backspace 이 줄 되돌리기",
                ]

        ## Shift+R이나 저장 뒤 다시 불러와도 원고에 아직 안 쓴 값이 남도록
        def session(self):
            ss = self.ss()
            if ss is None:
                return { }
            return dict(
                target=self.target,
                line_edits={ k : dict(v) for k, v in ss.state.line_edits.items() if v },
                )

        def restore(self, d):
            ss = self.ss()
            if not d or ss is None:
                return
            self.target = d.get("target", "what")
            for k, v in (d.get("line_edits") or { }).items():
                ss.state.line_edits.setdefault(k, { }).update(v)

    register(SayTab())


screen ui_editor_say_panel(tab):

    hbox:
        spacing 6
        text "고칠 것:" style "ui_editor_text" yalign 0.5
        textbutton "대사" style "ui_editor_button" action Function(tab.set_target, "what") selected (tab.target == "what")
        textbutton "이름" style "ui_editor_button" action Function(tab.set_target, "name") selected (tab.target == "name") sensitive tab.name_ok()[0]

    use ui_editor_style_row(tab, tab.style_keys())

    if not tab.pk():
        hbox:
            spacing 4
            box_wrap True
            box_wrap_spacing 4
            xmaximum 632
            text "속도:" style "ui_editor_text" yalign 0.5
            for _v in tab.SPEEDS:
                textbutton ("×{:g}".format(_v)) style "ui_editor_button" text_size 13 action Function(tab.set_speed, _v) selected (abs(tab.speed() - _v) < 0.001)

        hbox:
            spacing 4
            box_wrap True
            box_wrap_spacing 4
            xmaximum 632
            text "효과:" style "ui_editor_text" yalign 0.5
            for _name, _label in tab.EFFECTS:
                textbutton _label style "ui_editor_button" text_size 13 action Function(tab.set_effect, _name) selected (tab.effect() == _name)

    if tab.sfx() is not None:
        hbox:
            spacing 4
            box_wrap True
            box_wrap_spacing 4
            xmaximum 632
            text "화면 효과:" style "ui_editor_text" yalign 0.5
            textbutton "그대로" style "ui_editor_button" text_size 13 action Function(tab.set_fx, None) selected (tab.fx_line() is None)
            for _n, _l in tab.fx_choices():
                textbutton (("선택취소 → " + _l) if _n == "default" else _l) style "ui_editor_button" text_size 13 action Function(tab.set_fx, _n) selected (tab.fx_line() == _n)

        hbox:
            spacing 4
            box_wrap True
            box_wrap_spacing 4
            xmaximum 632
            if tab.fx_line() is not None:
                text "전환:" style "ui_editor_text" yalign 0.5
                for _t, _tl in tab.FX_TRANSITIONS:
                    textbutton _tl style "ui_editor_button" text_size 13 action Function(tab.set_fx_transition, _t) selected (tab.fx_transition_value() == _t)
                textbutton "전환 미리 보기" style "ui_editor_button" text_size 13 action Function(tab.preview_fx)
            textbutton ("화면 효과 보기(V): " + ("켬" if tab.fx_preview_on() else "끔")) style "ui_editor_button" text_size 13 action Function(tab.toggle_fx_preview) selected tab.fx_preview_on()

        ## 덮개(VHS)와 휘어짐은 효과를 바꾸지 않는 줄에서도 고를 수 있음
        hbox:
            spacing 4
            box_wrap True
            box_wrap_spacing 4
            xmaximum 632
            text "덮개(VHS):" style "ui_editor_text" yalign 0.5
            $ _ov = tab.fx_overlay_value()
            for _v, _vl in tab.overlay_choices():
                textbutton _vl style "ui_editor_button" text_size 13 action Function(tab.set_fx_overlay, _v) selected (_ov == _v and type(_ov) == type(_v))
        if tab.has_warp():
            hbox:
                spacing 4
                box_wrap True
                box_wrap_spacing 4
                xmaximum 632
                text "덮개 휘어짐:" style "ui_editor_text" yalign 0.5
                $ _wv = tab.fx_warp_value()
                textbutton "그대로" style "ui_editor_button" text_size 13 action Function(tab.set_fx_warp, tab.FOLLOW) selected (_wv == tab.FOLLOW)
                textbutton "설정값" style "ui_editor_button" text_size 13 action Function(tab.set_fx_warp, "default") selected (_wv == "default")
                for _w, _wl in tab.WARPS:
                    textbutton _wl style "ui_editor_button" text_size 13 action Function(tab.set_fx_warp, _w) selected (_wv == _w)
        if tab.has_cursor():
            hbox:
                spacing 4
                box_wrap True
                box_wrap_spacing 4
                xmaximum 632
                text "커서:" style "ui_editor_text" yalign 0.5
                $ _cv = tab.fx_cursor_value()
                for _c, _cl in tab.cursor_choices():
                    textbutton _cl style "ui_editor_button" text_size 13 action Function(tab.set_fx_cursor, _c) selected (_cv == _c)

        if tab.fx_line() is not None:
            if tab.has_exclude():
                hbox:
                    spacing 4
                    box_wrap True
                    box_wrap_spacing 4
                    xmaximum 632
                    text "글자 빼기:" style "ui_editor_text" yalign 0.5
                    textbutton "효과 설정대로" style "ui_editor_button" text_size 13 action Function(tab.follow_exclude) selected (tab.fx_exclude_value() == tab.FOLLOW)
                    $ _eff = tab.fx_exclude_effective()
                    for _g, _gl in tab.text_groups():
                        textbutton _gl style "ui_editor_button" text_size 13 action Function(tab.toggle_exclude, _g) selected (_g in _eff)

    hbox:
        spacing 6
        textbutton "R 다시 보기" style "ui_editor_button" action Function(tab.replay)
        textbutton "이 줄 되돌리기" style "ui_editor_button" action Function(tab.reset_item)
        textbutton "모두 버리기" style "ui_editor_button" action Function(tab.discard)
