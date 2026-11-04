################################################################################
## Screen FX — UI Kit 편집기 탭 (타이틀 일렁임, 화면 효과)
##
## UI Kit 플러그인이 있으면 그 편집기(개발 모드에서 Shift+M)에 탭 두 개를
## 더합니다. UI Kit이 없으면 이 파일은 아무것도 하지 않고, 효과는 설정 파일로
## 그대로 동작합니다.
##
##   타이틀 일렁임  → 저장하면 watermorph_layout.rpy
##   화면 효과      → 효과마다 <효과 이름>_layout.rpy (vhs_crt_layout.rpy, ascii_layout.rpy …)
##                    전환·기본 효과는 screen_fx_layout.rpy
##                    "줄에 넣기"는 원고의 고른 줄 바로 위에 $ screen_fx.use(…) 같은 줄을 넣음 (4.1)
## 만들어진 파일의 값은 설정 파일의 같은 값보다 우선합니다.
################################################################################

init offset = 1

## UI Kit 편집기(init -9, -8)를 읽은 뒤에 실행됩니다.
init -6 python in screen_fx:

    _ed = getattr(store, "ui_editor", None)
    HAS_EDITOR = (_ed is not None) and hasattr(_ed, "register") and hasattr(_ed, "Tab")

    if HAS_EDITOR:

        from store.ui_kit import format_value, file_header

        def _fmt_num(v, digits):
            if digits == 0:
                return "{:.0f}".format(v)
            return ("{:." + str(digits) + "f}").format(v)

        ## ── 막대 ──

        class FxBarValue(store.BarValue, store.DictEquality):
            """탭의 값을 읽고 쓰는 막대."""

            def __init__(self, tab_id, key, lo, hi, step, digits):
                self.tab_id = tab_id
                self.key = key
                self.lo = lo
                self.hi = hi
                self.step = step
                self.digits = digits

            def _tab(self):
                return _ed.get_tab(self.tab_id)

            def changed(self, v):
                value = self.lo + v
                if self.digits == 0:
                    value = int(round(value))
                else:
                    value = round(value, self.digits)
                if self.key == "_res":
                    self._tab().set_res_lines(value)
                else:
                    self._tab().put(self.key, value)

            def get_adjustment(self):
                if self.key == "_res":
                    v = self._tab().res_lines()
                else:
                    v = self._tab().val(self.key)
                try:
                    v = float(v)
                except Exception:
                    v = self.lo
                v = max(self.lo, min(self.hi, v))
                return store.ui.adjustment(range=self.hi - self.lo, value=v - self.lo, step=self.step,
                    changed=self.changed, adjustable=True)

            def get_style(self):
                return ("ui_editor_bar", "ui_editor_bar")

        ## ── 탭 공통: 저장 파일은 이 플러그인 폴더에 ──

        class FxTabBase(_ed.Tab):

            def file_path(self, filename):
                return root_path(filename)

        ## ── 타이틀 일렁임 ──

        class WatermorphTab(FxTabBase):

            id = "watermorph"
            label = "타이틀 일렁임"
            panel_screen = "ui_editor_watermorph_panel"
            overlay_screen = None
            copy_hint = "watermorph_config.rpy에 붙여넣으세요."

            ## (이름, 표시, 최소, 최대, 간격, 소수 자리)
            ROWS = (
                ("amount", "일렁임 세기 (픽셀)", 0.0, 30.0, 0.5, 1),
                ("scale", "물결 크기 (픽셀)", 20.0, 600.0, 5.0, 0),
                ("speed", "흐르는 속도", 0.0, 3.0, 0.05, 2),
                ("flow", "소용돌이", 0.0, 4.0, 0.05, 2),
                ("shine", "반사광", 0.0, 1.0, 0.01, 2),
                )

            RELOAD_KEYS = ("target",)

            def wm(self):
                return getattr(store, "watermorph", None)

            def available(self):
                wm = self.wm()
                if wm is None:
                    return (False, "타이틀 일렁임 기능이 없습니다.")
                if store.renpy.get_screen("main_menu") is None:
                    return (False, "타이틀 화면에서 쓸 수 있습니다. (효과가 타이틀에서만 보여서)")
                return (True, "")

            def base(self, key):
                """편집 전 값 (저장된 배치 → 설정 파일 → 기본값)."""
                wm = self.wm()
                lay = wm.saved_layout()
                if key in lay:
                    return lay[key]
                missing = object()
                v = getattr(wm, key, missing)
                if v is not missing:
                    return v
                return wm.DEFAULTS[key]

            def val(self, key):
                e = self.wm().state.edits
                return e[key] if key in e else self.base(key)

            def put(self, key, value):
                e = self.wm().state.edits
                if value == self.base(key):
                    e.pop(key, None)
                else:
                    e[key] = value
                store.renpy.restart_interaction()

            def toggle(self, key):
                self.put(key, not self.val(key))

            def reset_item(self):
                self.discard()
                _ed.msg("저장 안 한 변경을 되돌렸습니다.")

            def discard(self):
                self.wm().state.edits = { }
                store.renpy.restart_interaction()

            def pending(self):
                wm = self.wm()
                return len(wm.state.edits) if wm is not None else 0

            def _merged(self):
                lay = dict(self.wm().saved_layout())
                lay.update(self.wm().state.edits)
                return lay

            def layout_file(self):
                wm = self.wm()
                lay = self._merged()
                lines = file_header("UI Kit 편집기가 저장한 타이틀 일렁임 설정입니다.", [
                    "여기 적힌 값은 watermorph_config.rpy의 같은 값보다 우선합니다.",
                    "이 파일을 지우면 설정 파일 값으로 돌아갑니다.",
                    ])
                lines.append("define watermorph.layout = {")
                for k in [ k for k in wm.EDIT_KEYS if k in lay ] + sorted(k for k in lay if k not in wm.EDIT_KEYS):
                    lines.append('    "{}": {},'.format(k, format_value(lay[k])))
                lines.append("}")
                lines.append("")
                return ("watermorph_layout.rpy", "\n".join(lines))

            def after_save(self):
                wm = self.wm()
                changed = set(wm.state.edits)
                ## store 변수가 아니라 실행 중 값으로 (다시 불러올 때 옛 값이 덮지 않게, 3.16)
                wm.state.saved = store.python_dict(self._merged())
                wm.state.edits = { }
                return bool(changed & set(self.RELOAD_KEYS))

            def copy_text(self):
                lay = self._merged()
                lines = [ "# watermorph_config.rpy에 붙여넣기" ]
                for k in self.wm().EDIT_KEYS:
                    if k in lay:
                        lines.append("define watermorph.{} = {}".format(k, format_value(lay[k])))
                return "\n".join(lines)

            def info_lines(self):
                rv = [ ]
                if not self.val("enabled"):
                    rv.append("꺼져 있습니다. 켜야 화면에 보입니다.")
                n = self.pending()
                rv.append("저장 안 한 변경: {}개".format(n) if n else "저장 안 한 변경 없음")
                return rv

            def help_lines(self):
                return [
                    "막대를 끌면 타이틀 화면에 바로 보입니다. 적용 대상 바꾸기는 저장하면 다시 불러온 뒤 적용됩니다.",
                    "Backspace 저장 안 한 변경 되돌리기",
                    ]

            def label_of(self, key, digits):
                return _fmt_num(float(self.val(key)), digits)

        ## ── 화면 효과 (VHS 덮개, ASCII … 등록된 효과 전부 + 기본 효과, 전환) ──

        class FxTab(FxTabBase):

            id = TAB_ID
            label = "화면 효과"
            panel_screen = "ui_editor_screen_fx_panel"
            overlay_screen = None

            SCOPES = (("all", "항상"), ("game", "게임 중에만"), ("main_menu", "타이틀에서만"))

            TRANSITION_LABELS = (("tv", "TV 껐다 켜기"), ("fade", "서서히"), (None, "바로"))

            ## "전환" 쪽 막대 (이름, 표시, 최소, 최대, 간격, 소수 자리)
            TV_ROWS = (
                ("off_time", "꺼지는 시간 (초)", 0.0, 2.0, 0.05, 2),
                ("black_time", "검은 화면 (초)", 0.0, 2.0, 0.05, 2),
                ("on_time", "켜지는 시간 (초)", 0.0, 2.0, 0.05, 2),
                ("line", "가로선 두께 (픽셀)", 1, 12, 1, 0),
                ("flash", "꺼질 때 섬광", 0.0, 1.0, 0.01, 2),
                ("noise", "켜질 때 지직거림", 0.0, 1.0, 0.01, 2),
                ("volume", "소리 음량", 0.0, 1.0, 0.01, 2),
                ("fade_time", "서서히 바꾸는 시간 (초)", 0.1, 5.0, 0.1, 1),
                )

            def __init__(self):
                self.page = None        # 효과 이름, "tv"(기본 효과, 전환), "lines"(줄에 넣기)
                self.line_sel = None    # 줄에 넣기: 고른 줄 (파일, 줄 번호)
                self.line_edits = { }   # 줄에 넣기: (파일, 줄 번호) -> {"fx", "overlay", "warp", "cursor", "transition", "remove", "expect"}
                self.list_open = True
                self.groups = { }       # 효과 이름 -> 막대 묶음 번호
                self.targets = { }      # 효과 이름 -> None(기본 설정) 또는 프리셋 이름
                self.copy_hint = "설정 파일에 붙여넣으세요."
                self.picks = None       # 셰이더 고르기: 고른 (1번, 2번). None = 아직 안 고름 (게임의 지금 값) (4.3)
                self.follow = True      # 셰이더 고르기: 고른 줄이 ▶(게임의 지금 줄)를 따라감
                self.mark_t = 0.0       # ▶ 더블 클릭 판정용

            ## ── 페이지 ──

            def fx(self):
                return EFFECTS.get(self.page)

            def is_tv(self):
                return self.page == "tv"

            def pages(self):
                rv = [ ]
                if getattr(store, "script_edit", None) is not None:
                    rv.append(("lines", "셰이더 고르기"))
                rv += [ (i, slot_label(i)) for i, _l in slot_choices() if i in EFFECTS ]
                rv.append(("tv", "처음 상태, 전환"))
                return rv

            def is_lines(self):
                return self.page == "lines"

            def available(self):
                if not EFFECTS:
                    return (False, "등록된 화면 효과가 없습니다.")
                return (True, "")

            def on_open(self):
                if self.is_lines():
                    if self.line_sel is None:
                        self.follow = True
                        self._follow()
                    self._sync()
                    return
                if self.page not in EFFECTS and self.page != "tv":
                    if getattr(store, "script_edit", None) is not None:
                        self.page = "lines"
                        self.on_open()
                        return
                    cur = current_effect()
                    self.page = cur if cur in EFFECTS else ORDER[0]
                self._sync()

            def on_close(self):
                for fx in EFFECTS.values():
                    fx.state.preview = None

            def _sync(self):
                for i, fx in EFFECTS.items():
                    fx.state.preview = self.targets.get(i) if i == self.page else None

            def set_page(self, p):
                self.page = p
                if p == "lines" and self.line_sel is None:
                    self.follow = True
                    self._follow()
                self._sync()
                store.renpy.restart_interaction()

            @property
            def group(self):
                return self.groups.get(self.page, 0)

            @property
            def target(self):
                return self.targets.get(self.page)

            def set_group(self, i):
                self.groups[self.page] = i
                store.renpy.restart_interaction()

            def set_target(self, name):
                self.targets[self.page] = name
                self._sync()
                store.renpy.restart_interaction()

            def group_list(self):
                fx = self.fx()
                if fx is None:
                    return ()
                if fx.GROUPS:
                    return fx.GROUPS
                ## 막대 묶음을 정하지 않은 효과: 숫자 값을 전부 한 묶음으로
                rows = [ ]
                for k, p in sorted(fx.PARAMS.items()):
                    kind, d = p[0], p[1]
                    if kind == "bool":
                        rows.append((k, k, "bool"))
                    elif kind == "color":
                        rows.append((k, k, "color"))
                    elif kind == "choice":
                        rows.append((k, k, "options", tuple((o, str(o)) for o in fx.options(k))))
                    elif kind == "float":
                        rows.append((k, k, 0.0, max(1.0, float(d or 0) * 4), 0.01, 2))
                return (("값", tuple(rows)),)

            def rows(self):
                if self.is_tv():
                    return self.TV_ROWS
                gl = self.group_list()
                if not gl:
                    return ()
                return gl[min(self.group, len(gl) - 1)][1]

            ## ── 전환 쪽 값 ──

            def _tv_base(self, key):
                if key in TV_DEFAULTS:
                    d = dict(TV_DEFAULTS)
                    d.update(globals().get("tv", None) or { })
                    d.update(_lay().get("tv", { }))
                    return d[key]
                lay = _lay()
                if key in lay:
                    return lay[key]
                return globals().get(key, DEFAULTS[key])

            def _tv_val(self, key):
                if key in TV_DEFAULTS:
                    return cedit.tv[key] if key in cedit.tv else self._tv_base(key)
                return cedit.edits[key] if key in cedit.edits else self._tv_base(key)

            def _tv_put(self, key, value):
                d = cedit.tv if key in TV_DEFAULTS else cedit.edits
                if value == self._tv_base(key):
                    d.pop(key, None)
                else:
                    d[key] = value
                store.renpy.restart_interaction()

            def cfg_val(self, key):
                return self._tv_val(key)

            def cfg_put(self, key, value):
                self._tv_put(key, value)

            ## ── 효과 쪽 값 ──

            def preset_names(self):
                fx = self.fx()
                names = list(fx.presets())
                for n in fx.state.preset_edits:
                    if n not in names:
                        names.append(n)
                return names

            def _preset(self):
                """편집 중인 프리셋 (전체 사전). 처음 고칠 때 원본을 복사해 둡니다."""
                fx = self.fx()
                s = fx.state
                if self.target not in s.preset_edits:
                    s.preset_edits[self.target] = dict(fx.presets().get(self.target, { }))
                return s.preset_edits[self.target]

            def base(self, key):
                """기본 설정 값 (편집 전)."""
                if self.is_tv():
                    return self._tv_base(key)
                fx = self.fx()
                s = fx.settings()
                if key in s:
                    return s[key]
                return fx.PARAMS[key][1]

            def val(self, key):
                if self.is_tv():
                    return self._tv_val(key)
                fx = self.fx()
                if self.target is not None:
                    p = fx.state.preset_edits.get(self.target, fx.presets().get(self.target, { }))
                    if key in p:
                        return p[key]
                if key in fx.state.edits:
                    return fx.state.edits[key]
                return self.base(key)

            def in_preset(self, key):
                if self.is_tv() or self.target is None:
                    return False
                fx = self.fx()
                p = fx.state.preset_edits.get(self.target, fx.presets().get(self.target, { }))
                return key in p

            def put(self, key, value):
                if self.is_tv():
                    self._tv_put(key, value)
                    return
                fx = self.fx()
                if self.target is None:
                    if value == self.base(key):
                        fx.state.edits.pop(key, None)
                    else:
                        fx.state.edits[key] = value
                else:
                    self._preset()[key] = value
                store.renpy.restart_interaction()

            def toggle(self, key):
                self.put(key, not self.val(key))

            def unset(self, key):
                """프리셋에서 이 값을 빼서 기본 설정을 따르게."""
                if self.target is not None and not self.is_tv():
                    self._preset().pop(key, None)
                    store.renpy.restart_interaction()

            ## 주사선 개수 (VHS의 resolution)

            def res_auto(self):
                return self.val("resolution") is None

            def res_lines(self):
                r = self.val("resolution")
                if r is None:
                    return store.config.screen_height / 2.0
                return float(r[1])

            def set_res_auto(self, auto):
                if auto:
                    self.put("resolution", None)
                else:
                    self.set_res_lines(store.config.screen_height / 2.0)

            def set_res_lines(self, lines):
                lines = max(30, int(round(lines)))
                w = int(round(lines * store.config.screen_width / float(store.config.screen_height)))
                self.put("resolution", (w, lines))

            ## 색 (UI Kit 색 고르기 창이 씀)

            def get_value(self, key):
                v = self.val(key)
                return v if isinstance(v, str) else None

            def set_value(self, key, value):
                self.put(key, value)

            def value_label(self, key):
                for r in self.rows():
                    if r[0] == key:
                        return r[1]
                return key

            ## 켜기·범위

            def _other_default(self, fx, key):
                return { "enabled": True, "scope": "all", "target": fx.default_target, "overlay": fx.with_overlay }.get(key)

            ## ── 셰이더 고르기 (4.3): 1번, 2번 자리 ──

            def get_picks(self):
                if self.picks is None:
                    return current_slots()
                return tuple(self.picks)

            def preview_slots(self):
                """엔진이 부름: 셰이더 고르기 페이지면 고른 두 자리를 화면에 미리 보여줌."""
                if not self.is_lines() or self.picks is None:
                    return None
                return tuple(self.picks)

            def set_pick(self, slot, name):
                p = list(self.get_picks())
                p[slot] = name
                self.picks = p
                renpy.restart_interaction()

            def clear_picks(self):
                """전부 셰이더 적용 취소: 두 자리 모두 기본(아무것도 안 함)."""
                self.picks = [ NONE, NONE ]
                _ed.msg("두 자리 모두 '기본'으로 골랐습니다. [[여기에서부터 적용]을 눌러야 원고에 들어갑니다.")
                renpy.restart_interaction()

            def apply_here(self):
                """고른 줄 바로 위에 $ screen_fx.shaders(1번, 2번) 줄을 넣기로 함 (저장할 때 원고에)."""
                if self.se() is None:
                    _ed.msg("원고 쓰기 도구(UI Kit 3.0 이상)가 없습니다.")
                    return
                self._follow()
                if self.line_sel is None:
                    _ed.msg("줄을 넣을 수 있는 곳을 찾지 못했습니다. 게임을 진행한 뒤 다시 누르세요.")
                    return
                a, b = self.get_picks()
                e = self._ledit(True)
                for k in ("remove", "fx", "overlay", "warp", "cursor", "transition"):
                    e.pop(k, None)
                e["slots"] = (a, b)
                _ed.msg("{}번째 줄부터 1번 {} + 2번 {}. 저장(Ctrl+S)하면 원고에 들어갑니다.".format(
                    self.line_sel[1], slot_label(a), slot_label(b)))
                renpy.restart_interaction()

            def here_key(self):
                """▶ 게임의 지금 줄 (파일, 줄 번호). 줄을 넣을 수 있는 다음 줄로 맞춤."""
                n = self._current_node()
                if n is None:
                    return None
                lines = [ l for l, _n in self.lines_of(n.filename) ]
                if not lines:
                    return None
                after = [ l for l in lines if l >= n.linenumber ]
                return (n.filename, (after[0] if after else lines[-1]))

            def _follow(self):
                """고른 줄이 ▶를 따라가는 중이면 지금 줄로 맞춤."""
                if self.follow:
                    k = self.here_key()
                    if k is not None:
                        self.line_sel = k

            def mark_click(self):
                """▶를 두 번 누르면(더블 클릭) 고른 줄을 ▶ 줄로 옮기고 다시 따라가게 함."""
                now = time.time()
                if now - self.mark_t < 0.6:
                    self.mark_t = 0.0
                    self.follow = True
                    self._follow()
                    _ed.msg("지금 줄로 옮겼습니다. 게임을 진행하면 고른 줄이 따라갑니다.")
                else:
                    self.mark_t = now
                    _ed.msg("세모는 게임의 지금 줄입니다. 두 번 누르면 그 줄로 갑니다.")
                renpy.restart_interaction()

            def mark_font(self):
                """세모 표시용 글꼴 (Neo둥근모. 렌파이 기본 글꼴에는 세모가 없음)."""
                root = ROOT.replace("\\", "/")
                if root.startswith("game/"):
                    root = root[5:]
                return root + "/fonts/neodgm.ttf"

            ## ── 줄에 넣기 (4.1): 원고의 고른 줄 바로 위에 $ screen_fx.use(…) 같은 줄을 넣음 ──

            FOLLOW = "__follow__"
            LIST_ROWS = 7
            ## 이 글자로 시작하는 줄은 편집기가 넣는 줄로 보고, 같은 자리에 다시 넣으면 바꿈
            OUR_LINES = ("$ screen_fx.shaders(", "$ screen_fx.use(", "$ screen_fx.clear(", "$ screen_fx.set_overlay(", "$ screen_fx.set_warp(", "$ screen_fx.set_cursor(")
            WARPS = ((0.0, "0 평평"), (0.5, "0.5"), (1.0, "1 기본"), (2.0, "2"), (3.0, "3"), (5.0, "5 크게"))

            def se(self):
                return getattr(store, "script_edit", None)

            def line_file(self):
                if self.line_sel is not None:
                    return self.line_sel[0]
                n = self._current_node()
                return n.filename if n is not None else None

            def _current_node(self):
                try:
                    import renpy as _renpy
                    ctx = _renpy.game.context()
                    if ctx.current is None:
                        return None
                    n = _renpy.game.script.lookup(ctx.current)
                    fn = str(getattr(n, "filename", "") or "").replace("\\", "/")
                    if fn.startswith("renpy/"):
                        return None
                    return n
                except Exception:
                    return None

            def lines_of(self, fn):
                se = self.se()
                if se is None or fn is None or not hasattr(se, "label_lines"):
                    return [ ]
                try:
                    return se.label_lines(fn)
                except Exception:
                    return [ ]

            def line_to_current(self):
                self.follow = True
                n = self._current_node()
                if n is None:
                    _ed.msg("지금 줄을 알 수 없습니다. 게임을 진행한 뒤 다시 누르세요.")
                    renpy.restart_interaction()
                    return
                lines = [ l for l, _n in self.lines_of(n.filename) ]
                if not lines:
                    self.line_sel = None
                    return
                after = [ l for l in lines if l >= n.linenumber ]
                self.line_sel = (n.filename, (after[0] if after else lines[-1]))
                renpy.restart_interaction()

            def set_line(self, key):
                self.line_sel = key
                self.follow = (key is not None and key == self.here_key())
                renpy.restart_interaction()

            def step_line(self, step):
                fn = self.line_file()
                lines = [ l for l, _n in self.lines_of(fn) ]
                if not lines:
                    _ed.msg("이 원고 파일에서 줄을 넣을 수 있는 곳(label 안의 줄)을 찾지 못했습니다.")
                    return
                if self.line_sel is None or self.line_sel[1] not in lines:
                    self.set_line((fn, lines[0]))
                    return
                k = max(0, min(len(lines) - 1, lines.index(self.line_sel[1]) + step))
                self.set_line((fn, lines[k]))

            def goto_number(self, num):
                fn = self.line_file()
                lines = [ l for l, _n in self.lines_of(fn) ]
                if not lines:
                    return
                after = [ l for l in lines if l >= num ]
                self.set_line((fn, after[0] if after else lines[-1]))
                if self.line_sel[1] != num:
                    _ed.msg("{}번째 줄에는 넣을 수 없어서 가장 가까운 {}번째 줄을 골랐습니다.".format(num, self.line_sel[1]))

            def line_source(self, key):
                se = self.se()
                if se is None or key is None:
                    return None
                return se.read_line(key[0], key[1])

            def existing_lines(self, key):
                """고른 줄 바로 위에 이미 들어 있는 화면 효과 줄들 (글자)."""
                se = self.se()
                if se is None or key is None:
                    return [ ]
                target = se.read_line(key[0], key[1])
                if target is None:
                    return [ ]
                ind = target[:len(target) - len(target.lstrip(" \t"))]
                rv = [ ]
                n = key[1] - 1
                while n >= 1:
                    t = se.read_line(key[0], n)
                    if t is None or t[:len(t) - len(t.lstrip(" \t"))] != ind or not t.strip().startswith(self.OUR_LINES):
                        break
                    rv.insert(0, t.strip())
                    n -= 1
                return rv

            def nearby_lines(self):
                """목록에 보여줄 줄 [(줄 번호, 글자, 고른 것인지, 지금 줄인지, 저장 안 한 변경이 있는지)]"""
                self._follow()
                fn = self.line_file()
                lines = self.lines_of(fn)
                if not lines:
                    return [ ]
                nums = [ l for l, _n in lines ]
                k = nums.index(self.line_sel[1]) if (self.line_sel is not None and self.line_sel[1] in nums) else 0
                half = self.LIST_ROWS // 2
                lo = max(0, min(k - half, len(lines) - self.LIST_ROWS))
                hk = self.here_key()
                rv = [ ]
                for l, _n in lines[lo:lo + self.LIST_ROWS]:
                    key = (fn, l)
                    t = (self.line_source(key) or "").strip()
                    if len(t) > 50:
                        t = t[:49] + "…"
                    here = (hk == key)
                    rv.append((l, _ed.esc(t), key == self.line_sel, here, key in self.line_edits))
                return rv

            def _ledit(self, create=False):
                if self.line_sel is None:
                    return { }
                e = self.line_edits.get(self.line_sel)
                if e is None and create:
                    e = { "expect": (self.line_source(self.line_sel) or "").strip() }
                    se = self.se()
                    if se is not None:
                        se.remember(self.line_sel[0], self.line_sel[1])
                    self.line_edits[self.line_sel] = e
                return e or { }

            def lval(self, key):
                return self._ledit().get(key, self.FOLLOW)

            def lput(self, key, value):
                if self.line_sel is None:
                    _ed.msg("줄을 먼저 고르세요.")
                    return
                e = self._ledit(True)
                e.pop("remove", None)
                if value == self.FOLLOW:
                    e.pop(key, None)
                else:
                    e[key] = value
                if not [ k for k in e if k != "expect" ]:
                    self.line_edits.pop(self.line_sel, None)
                renpy.restart_interaction()

            def lremove(self):
                """이 줄 위의 화면 효과 줄을 지우기 (저장할 때)."""
                if self.line_sel is None:
                    return
                if not self.existing_lines(self.line_sel):
                    _ed.msg("이 줄 위에는 지울 화면 효과 줄이 없습니다.")
                    return
                e = self._ledit(True)
                for k in ("fx", "overlay", "warp", "cursor", "transition"):
                    e.pop(k, None)
                e["remove"] = True
                renpy.restart_interaction()

            def lreset(self):
                if self.line_sel is not None:
                    self.line_edits.pop(self.line_sel, None)
                renpy.restart_interaction()

            def _q(self, v):
                return "None" if v is None else '"{}"'.format(v)

            def gen_lines(self, e):
                """편집 값 → 넣을 줄 목록 (앞 공백 없이)."""
                if "slots" in e:
                    a, b = e["slots"]
                    return [ '$ screen_fx.shaders("{}", "{}")'.format(a, b) ]
                F = self.FOLLOW
                fx, ov, warp, tr = (e.get(k, F) for k in ("fx", "overlay", "warp", "transition"))
                cur = e.get("cursor", F)
                rv = [ ]
                args = [ ]
                if ov != F:
                    args.append("overlay={}".format(bool(ov)))
                if tr != F:
                    args.append("transition={}".format(self._q(tr)))
                if fx != F and cur != F:
                    ## 효과를 바꾸는 줄이 있으면 커서 자리도 그 줄에 같이 (4.2)
                    args.append('cursor="{}"'.format(cur))
                    cur = F
                if fx != F:
                    if fx == DEFAULT:
                        rv.append("$ screen_fx.clear({})".format(", ".join(args)))
                    else:
                        rv.append('$ screen_fx.use("{}"{})'.format(fx, "".join(", " + a for a in args)))
                elif ov != F:
                    rv.append("$ screen_fx.set_overlay({}{})".format(bool(ov), (", transition=" + self._q(tr)) if tr != F else ""))
                if warp != F:
                    if warp == DEFAULT:
                        rv.append('$ screen_fx.set_warp("default")')
                    else:
                        rv.append("$ screen_fx.set_warp({:g})".format(float(warp)))
                if cur != F:
                    rv.append('$ screen_fx.set_cursor("{}")'.format(cur))
                return rv

            def preview_lines(self):
                """고른 줄에 저장하면 들어갈 줄 (None = 바꾸지 않음)."""
                e = self.line_edits.get(self.line_sel) if self.line_sel is not None else None
                if not e:
                    return None
                if e.get("remove"):
                    return [ ]
                return self.gen_lines(e)

            def apply_to_lines(self):
                """효과 페이지의 '이 줄부터 이 효과': 줄에 넣기 페이지로 가서 이 효과를 고름."""
                fx = self.fx()
                if self.se() is None:
                    _ed.msg("원고 쓰기 도구(UI Kit 3.0 이상)가 없습니다.")
                    return
                if self.line_sel is None:
                    self.line_to_current()
                if self.line_sel is None:
                    _ed.msg("줄을 넣을 수 있는 곳을 찾지 못했습니다. 게임을 진행한 뒤 다시 누르세요.")
                    return
                self.page = "lines"
                self._sync()
                if fx is not None and fx.overlay_only:
                    self.lput("overlay", True)
                elif fx is not None:
                    self.lput("fx", fx.id)

            def pending_lines(self):
                return len([ e for e in self.line_edits.values() if e ])

            def script_edits(self):
                se = self.se()
                if se is None or not hasattr(se, "INSERT"):
                    return [ ]
                rv = [ ]
                for key, e in list(self.line_edits.items()):
                    if not e:
                        continue
                    lines = [ ] if e.get("remove") else self.gen_lines(e)
                    if not lines and not e.get("remove"):
                        continue
                    rv.append(se.Edit(key[0], key[1], se.INSERT,
                        { "lines": lines, "replace": self.OUR_LINES }, expect=e.get("expect") or None))
                return rv

            def after_script_save(self, edits):
                for ed in edits:
                    if ed.ok:
                        self.line_edits.pop((ed.filename, ed.linenumber), None)
                ## 줄이 늘어서 줄 번호가 바뀌므로, 다시 불러온 뒤 지금 줄로 다시 고름
                self.line_sel = None

            def key(self, k, shift):
                if not self.is_lines():
                    return False
                pg = _ed.pygame
                if k == pg.K_LEFTBRACKET:
                    self.step_line(-1)
                elif k == pg.K_RIGHTBRACKET:
                    self.step_line(1)
                elif k == pg.K_PAGEUP:
                    self.step_line(-self.LIST_ROWS)
                elif k == pg.K_PAGEDOWN:
                    self.step_line(self.LIST_ROWS)
                elif k == pg.K_l:
                    self.list_open = not self.list_open
                    renpy.restart_interaction()
                else:
                    return False
                return True

            ## ── 이 대사부터 이 효과 (대사 탭에 넘겨줌) ──

            def apply_to_line(self):
                """지금 화면의 대사 줄에 '이 대사부터 이 효과'(덮개 페이지면 '덮개 켬')를 넣고 대사 탭으로 갑니다.
                원고에는 Ctrl+S를 눌러야 적힙니다."""
                say = _ed.get_tab("say") if hasattr(_ed, "get_tab") else None
                if say is None or not hasattr(say, "set_fx"):
                    _ed.msg("대사 탭이 없습니다. (UI Kit 2.9 이상)")
                    return
                ok, why = _ed.tab_available(say)
                if not ok:
                    _ed.msg("대사가 화면에 떠 있을 때만 됩니다. 대사까지 진행한 뒤 다시 누르세요.")
                    return
                fx = self.fx()
                what = "덮개 켬" if fx.overlay_only else fx.label
                ## 대사 탭의 다시 보기는 되감기라서, 탭 바꾸기와 안내를 먼저 합니다.
                _ed.switch_tab("say")
                _ed.msg("대사 탭: 이 대사부터 {}. Ctrl+S를 누르면 원고의 이 줄에 적힙니다.".format(what))
                if fx.overlay_only:
                    say.set_fx_overlay(True)
                else:
                    say.set_fx(fx.id)

            ## 글자 빼기

            def _base_exclude(self, fx):
                """편집하기 전 값 (배치 파일 → 설정 파일 → 효과의 기본)."""
                had = fx.state.other.pop("exclude", None)
                try:
                    return fx.exclude()
                finally:
                    if had is not None:
                        fx.state.other["exclude"] = had

            def cur_exclude(self):
                return self.fx().exclude()

            def set_exclude(self, value):
                fx = self.fx()
                value = norm_exclude(value)
                if value == self._base_exclude(fx):
                    fx.state.other.pop("exclude", None)
                else:
                    fx.state.other["exclude"] = value
                renpy.restart_interaction()

            def toggle_exclude(self, group):
                cur = list(self.cur_exclude())
                if group in cur:
                    cur.remove(group)
                else:
                    cur.append(group)
                self.set_exclude(cur)

            def text_groups(self):
                return [ (g, TEXT_LABELS[g]) for g in TEXT_GROUPS ]

            def cur_other(self, key):
                fx = self.fx()
                if key in fx.state.other:
                    return fx.state.other[key]
                return fx.base_conf(key, self._other_default(fx, key))

            def put_other(self, key, value):
                fx = self.fx()
                orig = fx.base_conf(key, self._other_default(fx, key))
                if value == orig:
                    fx.state.other.pop(key, None)
                else:
                    fx.state.other[key] = value
                store.renpy.restart_interaction()

            ## ── 미리 보기 ──

            def preview(self, kind):
                preview_transition(kind)

            ## ── 되돌리기·저장 ──

            def reset_item(self):
                if self.is_lines():
                    self.lreset()
                    _ed.msg("이 줄의 저장 안 한 변경을 되돌렸습니다.")
                    return
                if self.is_tv():
                    cedit.edits = { }
                    cedit.tv = { }
                    _ed.msg("전환 설정의 저장 안 한 변경을 되돌렸습니다.")
                else:
                    fx = self.fx()
                    if self.target is None:
                        fx.state.edits = { }
                        fx.state.other = { }
                        _ed.msg("{} 기본 설정의 저장 안 한 변경을 되돌렸습니다.".format(fx.label))
                    else:
                        fx.state.preset_edits.pop(self.target, None)
                        _ed.msg("{} 프리셋 '{}'의 저장 안 한 변경을 되돌렸습니다.".format(fx.label, self.target))
                store.renpy.restart_interaction()

            def discard(self):
                for fx in EFFECTS.values():
                    fx.state.edits = { }
                    fx.state.preset_edits = { }
                    fx.state.other = { }
                cedit.edits = { }
                cedit.tv = { }
                self.line_edits = { }
                self.picks = None
                store.renpy.restart_interaction()

            def _changed_presets(self, fx):
                ps = fx.presets()
                return { n : p for n, p in fx.state.preset_edits.items() if p != ps.get(n, None) }

            def _fx_pending(self, fx):
                return len(fx.state.edits) + len(self._changed_presets(fx)) + len(fx.state.other)

            def pending(self):
                n = sum(self._fx_pending(fx) for fx in EFFECTS.values())
                return n + len(cedit.edits) + len(cedit.tv)

            def _merged(self, fx):
                lay = dict(fx.layout())
                lay.update(fx.state.other)
                s = dict(lay.get("settings", { }))
                s.update(fx.state.edits)
                if s:
                    lay["settings"] = s
                p = dict(lay.get("presets", { }))
                p.update(self._changed_presets(fx))
                if p:
                    lay["presets"] = p
                return lay

            def _merged_cfg(self):
                lay = dict(_lay())
                lay.update(cedit.edits)
                if cedit.tv:
                    t = dict(lay.get("tv", { }))
                    t.update(cedit.tv)
                    lay["tv"] = t
                return lay

            def _keys_in_order(self, fx, d):
                order = [ r[0] for g in fx.GROUPS for r in g[1] ]
                return [ k for k in order if k in d ] + sorted(k for k in d if k not in order)

            def _dict_lines(self, fx, d, indent):
                return [ '{}"{}": {},'.format(indent, k, format_value(d[k])) for k in self._keys_in_order(fx, d) ]

            def _fx_file(self, fx):
                lay = self._merged(fx)
                lines = file_header("UI Kit 편집기가 저장한 {} 효과 설정입니다.".format(fx.label), [
                    "여기 적힌 값은 {}_config.rpy의 같은 값보다 우선합니다.".format(fx.id),
                    "settings는 바꾼 값만, presets는 바꾼 프리셋 전체가 들어 있습니다.",
                    "게임 중에 {}.set()으로 바꾼 값과는 상관없습니다.".format(fx.id),
                    "이 파일을 지우면 설정 파일 값으로 돌아갑니다.",
                    ])
                lines.append("define {}.layout = {{".format(fx.id))
                if "exclude" in lay:
                    lay.pop("target", None)
                for k in ("enabled", "scope", "overlay", "target", "exclude"):
                    if k in lay:
                        lines.append('    "{}": {},'.format(k, format_value(lay[k])))
                if "settings" in lay:
                    lines.append('    "settings": {')
                    lines.extend(self._dict_lines(fx, lay["settings"], "        "))
                    lines.append("    },")
                if "presets" in lay:
                    lines.append('    "presets": {')
                    for name in sorted(lay["presets"]):
                        lines.append('        "{}": {{'.format(name))
                        lines.extend(self._dict_lines(fx, lay["presets"][name], "            "))
                        lines.append("        },")
                    lines.append("    },")
                lines.append("}")
                lines.append("")
                return ("{}_layout.rpy".format(fx.id), "\n".join(lines))

            def _cfg_file(self):
                lay = self._merged_cfg()
                lines = file_header("UI Kit 편집기가 저장한 화면 효과 전환 설정입니다.", [
                    "여기 적힌 값은 screen_fx_config.rpy의 같은 값보다 우선합니다.",
                    "이 파일을 지우면 설정 파일 값으로 돌아갑니다.",
                    ])
                lines.append("define screen_fx.layout = {")
                for k in ("base", "overlay", "title_shaders", "menu_shaders", "transition", "fade_time", "wait", "skippable"):
                    if k in lay:
                        lines.append('    "{}": {},'.format(k, format_value(lay[k])))
                if "tv" in lay:
                    lines.append('    "tv": {')
                    for k in [ k for k in TV_DEFAULTS if k in lay["tv"] ]:
                        lines.append('        "{}": {},'.format(k, format_value(lay["tv"][k])))
                    lines.append("    },")
                lines.append("}")
                lines.append("")
                return ("screen_fx_layout.rpy", "\n".join(lines))

            def layout_file(self):
                files = [ self._fx_file(EFFECTS[i]) for i in ORDER if self._fx_pending(EFFECTS[i]) ]
                if cedit.edits or cedit.tv:
                    files.append(self._cfg_file())
                if not files:
                    return None
                if not getattr(_ed, "LAYOUT_LISTS", False):
                    ## 예전 UI Kit: 한 번에 파일 하나만 저장 (Ctrl+S를 다시 누르면 다음 파일)
                    return files[0]
                return files

            def after_save(self):
                for i in ORDER:
                    fx = EFFECTS[i]
                    if not self._fx_pending(fx):
                        continue
                    fx.saved = self._merged(fx)
                    fx.state.edits = { }
                    fx.state.preset_edits = { }
                    fx.state.other = { }
                    if not getattr(_ed, "LAYOUT_LISTS", False):
                        return False
                if cedit.edits or cedit.tv:
                    cedit.saved = self._merged_cfg()
                    cedit.edits = { }
                    cedit.tv = { }
                return False

            def copy_text(self):
                if self.is_lines():
                    lines = self.preview_lines()
                    if not lines:
                        return None
                    return "\n".join(lines)
                if self.is_tv():
                    lay = self._merged_cfg()
                    lines = [ "# screen_fx_config.rpy에 붙여넣기" ]
                    for k in ("base", "overlay", "title_shaders", "menu_shaders", "transition", "fade_time", "wait", "skippable"):
                        lines.append("define screen_fx.{} = {}".format(k, format_value(self._tv_val(k))))
                    lines.append("define screen_fx.tv = {")
                    for k in TV_DEFAULTS:
                        lines.append('    "{}": {},'.format(k, format_value(self._tv_val(k))))
                    lines.append("}")
                    return "\n".join(lines)

                fx = self.fx()
                if self.target is None:
                    d = fx.settings()
                    d.update(fx.state.edits)
                    lines = [ "# {}_config.rpy의 {}.settings에 붙여넣기".format(fx.id, fx.id) ]
                    lines.extend(self._dict_lines(fx, d, ""))
                else:
                    d = fx.state.preset_edits.get(self.target, fx.presets().get(self.target, { }))
                    lines = [ "# {}_config.rpy의 {}.presets 안에 붙여넣기".format(fx.id, fx.id), '"{}": {{'.format(self.target) ]
                    lines.extend(self._dict_lines(fx, d, "    "))
                    lines.append("},")
                return "\n".join(lines)

            def info_lines(self):
                rv = [ ]
                if self.is_lines():
                    self._follow()
                    a, b = self.get_picks()
                    rv.append("고른 셰이더: 1번 {} + 2번 {}{}".format(slot_label(a), slot_label(b),
                        "" if self.picks is not None else " (게임의 지금 값)"))
                    if self.line_sel is None:
                        rv.append("고른 줄이 없습니다. [ ] 키, 목록, 줄 번호로 고르세요.")
                    else:
                        rv.append("고른 줄: {} {}번째 줄{} (이 줄부터 적용)".format(
                            self.line_sel[0].replace("\\", "/").replace("game/", "", 1), self.line_sel[1],
                            ", 지금 줄을 따라감" if self.follow else ""))
                        have = self.existing_lines(self.line_sel)
                        rv.append("지금 들어 있음: " + (" / ".join(have) if have else "없음"))
                        pv = self.preview_lines()
                        if pv is not None:
                            rv.append("저장하면: " + (" / ".join(pv) if pv else "(지움)"))
                    rv.append(self._scene_line())
                    n = self.pending_lines()
                    rv.append("원고에 저장 안 한 줄 {}곳 (Ctrl+S)".format(n) if n else "저장 안 한 변경 없음")
                    return [ _ed.esc(i) for i in rv ]
                if self.is_tv():
                    rv.append("게임을 시작할 때: 1번 {}   2번 {}".format(
                        slot_label(self.start_slot(0)), slot_label(self.start_slot(1))))
                    rv.append(self._scene_line())
                    snd = [ ]
                    c = tv_conf()
                    for k, l in (("off_sound", "꺼짐"), ("on_sound", "켜짐")):
                        snd.append("{} {}".format(l, c.get(k) or "없음"))
                    rv.append("소리: " + ", ".join(snd) + "  (경로는 screen_fx_config.rpy의 screen_fx.tv에서)")
                else:
                    fx = self.fx()
                    if not self.cur_other("enabled"):
                        rv.append("꺼져 있습니다. 켜야 화면에 보입니다.")
                    if getattr(store.persistent, fx.id + "_off"):
                        rv.append("플레이어 설정({}.Toggle)에서 꺼져 있지만, 편집 중에는 보여줍니다.".format(fx.id))
                    if fx.overrides():
                        rv.append("게임 중에 {}.set()으로 바꾼 값은 편집 중에 잠시 빼고 보여줍니다.".format(fx.id))
                    rv.append("글자 빼기: {}{}".format(exclude_label(fx.exclude()),
                        "" if text_layers_on() else "  (split_text_layers = False라서 글자는 한꺼번에만 뺄 수 있음)"))
                    rv.append("이 페이지는 {}의 세부 속성을 고칩니다. 편집하는 동안 이 효과만 보여줍니다.".format(slot_label(fx.id)))
                    rv.append("인게임, 타이틀, 게임 내 메뉴에서 같이 씁니다.")
                    rv.append(self._scene_line())
                    rv.append("지금 장면에 쓰려면 '셰이더 고르기'에서 고르고 [[여기에서부터 적용].")
                n = self.pending()
                rv.append("저장 안 한 변경: {}개".format(n) if n else "저장 안 한 변경 없음")
                return rv

            def _scene_line(self):
                a, b = current_slots()
                return "게임의 지금 장면: 1번 {} + 2번 {}".format(slot_label(a), slot_label(b))

            ## 처음 상태 (screen_fx.base, screen_fx.overlay)

            def start_slot(self, slot):
                if slot == 0:
                    b = self._tv_val("base")
                    return b if b in EFFECTS else NONE
                f = overlay_flag(self._tv_val("overlay"))
                if f is True or f == DEFAULT:
                    return OVERLAY if OVERLAY in EFFECTS else NONE
                if isinstance(f, str) and f in EFFECTS:
                    return f
                return NONE

            def set_start_slot(self, slot, name):
                if slot == 0:
                    self.cfg_put("base", name)
                else:
                    self.cfg_put("overlay", False if name == NONE else name)

            def help_lines(self):
                if self.is_lines():
                    return [
                        "1번, 2번을 고르면 화면에 바로 보입니다. 고른 줄은 세모(게임의 지금 줄)를 따라갑니다.",
                        "[[ ] 앞뒤 줄 | 목록에서 줄 누르기 | 세모 두 번 누르기: 지금 줄로 | Ctrl+S 원고에 넣기",
                        ]
                if self.is_tv():
                    return [
                        "막대를 끌고 '미리 보기'를 누르면 전환을 다시 보여줍니다.",
                        "Backspace 전환 설정 되돌리기",
                        ]
                return [
                    "막대를 끌면 바로 보입니다. 세부 속성에서 프리셋을 고르면 그 프리셋을 미리 보며 고칩니다.",
                    "프리셋에서 '빼기'를 누르면 그 값은 기본 설정을 따릅니다.",
                    ]

            def label_of(self, key, digits):
                try:
                    return _fmt_num(float(self.val(key)), digits)
                except Exception:
                    return str(self.val(key))

            def session(self):
                return dict(page=self.page, groups=dict(self.groups), targets=dict(self.targets),
                    line_edits={ k : dict(v) for k, v in self.line_edits.items() })

            def restore(self, d):
                if d:
                    self.page = d.get("page", None)
                    self.groups = dict(d.get("groups") or { })
                    self.targets = dict(d.get("targets") or { })
                    self.line_edits = { tuple(k) : dict(v) for k, v in (d.get("line_edits") or { }).items() }

        ## ── 타이틀 셰이더 / 게임 내 메뉴 셰이더 (4.3) ──
        ## 그 화면에만 씌우는 셰이더 두 자리. 저장하면 screen_fx_layout.rpy의 title_shaders / menu_shaders.

        class MenuFxTab(FxTabBase):

            panel_screen = "ui_editor_menu_fx_panel"
            overlay_screen = None
            copy_hint = "screen_fx_config.rpy에 붙여넣으세요."

            def __init__(self, tab_id, label, ctx):
                self.id = tab_id
                self.label = label
                self.ctx = ctx
                self.key = MENU_KEYS[ctx]

            def available(self):
                if not EFFECTS:
                    return (False, "등록된 화면 효과가 없습니다.")
                if menu_context() != self.ctx:
                    if self.ctx == "title":
                        return (False, "타이틀 화면에서 쓸 수 있습니다. (이 셰이더는 타이틀에만 걸려서)")
                    return (False, "게임 중 ESC 메뉴를 연 채로 쓸 수 있습니다. (이 셰이더는 그 메뉴에만 걸려서)")
                return (True, "")

            def _base(self):
                lay = _lay()
                if self.key in lay:
                    return norm_slots(lay[self.key])
                return norm_slots(globals().get(self.key, DEFAULTS[self.key]))

            def slots(self):
                if self.key in cedit.edits:
                    return norm_slots(cedit.edits[self.key])
                return self._base()

            def set_slot(self, slot, name):
                p = list(self.slots())
                p[slot] = name
                p = tuple(p)
                if p == self._base():
                    cedit.edits.pop(self.key, None)
                else:
                    cedit.edits[self.key] = p
                renpy.restart_interaction()

            def clear(self):
                self.set_slot(0, NONE)
                self.set_slot(1, NONE)
                _ed.msg("두 자리 모두 '기본'(아무것도 안 함)으로 돌렸습니다.")

            def reset_item(self):
                self.discard()

            def discard(self):
                cedit.edits.pop(self.key, None)
                renpy.restart_interaction()

            def pending(self):
                return 1 if self.key in cedit.edits else 0

            def layout_file(self):
                return _ed.get_tab(TAB_ID)._cfg_file()

            def after_save(self):
                cedit.saved = _ed.get_tab(TAB_ID)._merged_cfg()
                cedit.edits = { }
                cedit.tv = { }
                return False

            def copy_text(self):
                return "define screen_fx.{} = {}".format(self.key, format_value(self.slots()))

            def info_lines(self):
                a, b = self.slots()
                rv = [ "1번 {} + 2번 {}".format(slot_label(a), slot_label(b)) ]
                if self.ctx == "title":
                    rv.append("타이틀과 타이틀에서 연 화면(환경설정, 불러오기)에만 걸립니다. 인게임 셰이더와 따로입니다.")
                else:
                    rv.append("게임 중 ESC 메뉴와 거기서 연 화면(저장, 환경설정 …)에만 걸립니다. 뒤에 비치는 게임 화면도 이 셰이더로 보입니다.")
                rv.append("효과마다 세부 속성은 '화면 효과' 탭에서 고칩니다 (인게임과 같이 씀).")
                rv.append("저장 안 한 변경 있음" if self.pending() else "저장 안 한 변경 없음")
                return rv

            def help_lines(self):
                return [ "1번, 2번을 고르면 화면에 바로 보입니다. 같은 효과는 한 번만 씌웁니다." ]

        _ed.register(WatermorphTab())
        _ed.register(FxTab())
        _ed.register(MenuFxTab("title_fx", "타이틀 셰이더", "title"))
        _ed.register(MenuFxTab("pause_fx", "게임 내 메뉴 셰이더", "pause"))

        ## "줄에 넣기" 페이지의 줄 번호 입력 칸 (UI Kit 3.0 이상)
        fx_line_input = _ed.LineInputValue(TAB_ID) if hasattr(_ed, "LineInputValue") else None


## ── 패널 ─────────────────────────────────────────────────────────────────────

## (UI Kit이 없어도 오류가 나지 않도록 UI Kit 스타일을 이어받지 않고 따로 정의)

style ui_editor_fx_label is default:
    font gui.interface_text_font
    size 15
    color "#ffffff"
    outlines [ (2, "#000000", 0, 0) ]
    xsize 150
    yalign 0.5

style ui_editor_fx_value is ui_editor_fx_label:
    size 13
    color "#cccccc"
    xsize 60

style ui_editor_fx_button is empty:
    padding (6, 2)
    background "#ffffff22"
    hover_background "#ff3b8d99"
    selected_background "#ff3b8d66"
    insensitive_background "#ffffff0a"

style ui_editor_fx_button_text is default:
    font gui.interface_text_font
    size 13
    color "#ffffff"
    outlines [ (2, "#000000", 0, 0) ]
    insensitive_color "#ffffff55"


## 막대 줄의 이름 칸 (폭을 맞춤)
screen ui_editor_fx_name(label):
    fixed:
        xsize 150
        ysize 24
        text label style "ui_editor_fx_label" xsize None


screen ui_editor_fx_row(tab, row):
    $ _k = row[0]
    hbox:
        spacing 6
        use ui_editor_fx_name(row[1])
        if row[2] == "bool":
            textbutton ("켬" if tab.val(_k) else "끔") style "ui_editor_fx_button" action Function(tab.toggle, _k) selected bool(tab.val(_k))
        elif row[2] == "resolution":
            textbutton ("자동" if tab.res_auto() else "직접") style "ui_editor_fx_button" action Function(tab.set_res_auto, not tab.res_auto()) selected tab.res_auto()
            if not tab.res_auto():
                bar value screen_fx.FxBarValue(tab.id, "_res", 60, 720, 10, 0) xsize 160 yalign 0.5
            text ("{:.0f}줄".format(tab.res_lines())) style "ui_editor_fx_value"
        elif row[2] == "options":
            hbox:
                spacing 4
                box_wrap True
                box_wrap_spacing 4
                xmaximum 470
                for _v, _vl in row[3]:
                    textbutton _vl style "ui_editor_fx_button" action Function(tab.put, _k, _v) selected (tab.val(_k) == _v)
        elif row[2] == "color":
            $ _c = tab.get_value(_k) or "#ffffff"
            button:
                style "ui_editor_fx_button"
                action Function(ui_editor.open_popup, "color", _k)
                hbox:
                    spacing 4
                    add Solid(_c, xysize=(16, 16)) yalign 0.5
                    text _c style "ui_editor_fx_button_text" yalign 0.5
        else:
            bar value screen_fx.FxBarValue(tab.id, _k, row[2], row[3], row[4], row[5]) xsize 200 yalign 0.5
            text tab.label_of(_k, row[5]) style "ui_editor_fx_value"
        if getattr(tab, "target", None) is not None and tab.in_preset(_k):
            textbutton "빼기" style "ui_editor_fx_button" action Function(tab.unset, _k)


screen ui_editor_watermorph_panel(tab):

    vbox:
        spacing 6

        hbox:
            spacing 6
            use ui_editor_fx_name("켜기")
            textbutton ("켬" if tab.val("enabled") else "끔") style "ui_editor_fx_button" action Function(tab.toggle, "enabled") selected bool(tab.val("enabled"))

        hbox:
            spacing 6
            use ui_editor_fx_name("적용 대상")
            textbutton "화면 전체" style "ui_editor_fx_button" action Function(tab.put, "target", "screen") selected (tab.val("target") == "screen")
            textbutton "배경만" style "ui_editor_fx_button" action Function(tab.put, "target", "background") selected (tab.val("target") == "background")
            if "target" in tab.wm().state.edits:
                text "저장하면 다시 불러온 뒤 적용" style "ui_editor_small" yalign 0.5

        for _row in tab.ROWS:
            use ui_editor_fx_row(tab, _row)

        hbox:
            spacing 6
            use ui_editor_fx_name("품질")
            for _q in (1, 2, 3):
                textbutton str(_q) style "ui_editor_fx_button" action Function(tab.put, "quality", _q) selected (tab.val("quality") == _q)

        hbox:
            spacing 6
            use ui_editor_fx_name("타이틀의 다른 화면")
            textbutton ("적용" if tab.val("in_title_menus") else "적용 안 함") style "ui_editor_fx_button" action Function(tab.toggle, "in_title_menus") selected bool(tab.val("in_title_menus"))

        hbox:
            spacing 6
            textbutton "모두 버리기" style "ui_editor_button" action Function(tab.discard)



## 셰이더 한 자리 고르기 줄 (1번 / 2번). pick(slot, name)으로 고름 (4.3)
screen ui_editor_fx_slot_row(label, slot, cur, pick, clear=None):
    hbox:
        spacing 4
        box_wrap True
        box_wrap_spacing 4
        xmaximum 632
        use ui_editor_fx_name(label)
        for _n, _nl in screen_fx.slot_choices():
            textbutton _nl style "ui_editor_fx_button" action Function(pick, slot, _n) selected (cur == _n)
        if clear is not None:
            textbutton "전부 셰이더 적용 취소" style "ui_editor_fx_button" action Function(clear)


screen ui_editor_screen_fx_panel(tab):

    vbox:
        spacing 6

        ## 페이지 고르기: 셰이더 고르기 / 효과마다 세부 속성 / 처음 상태, 전환
        hbox:
            spacing 4
            box_wrap True
            box_wrap_spacing 4
            xmaximum 632
            for _p, _pl in tab.pages():
                textbutton _pl style "ui_editor_tab" action Function(tab.set_page, _p) selected (tab.page == _p)

        if tab.is_lines():
            use ui_editor_fx_lines_panel(tab)

        elif tab.is_tv():

            use ui_editor_fx_slot_row("처음 1번", 0, tab.start_slot(0), tab.set_start_slot)
            use ui_editor_fx_slot_row("처음 2번", 1, tab.start_slot(1), tab.set_start_slot)

            hbox:
                spacing 6
                use ui_editor_fx_name("바꿀 때 전환")
                for _t, _tl in tab.TRANSITION_LABELS:
                    textbutton _tl style "ui_editor_fx_button" action Function(tab.cfg_put, "transition", _t) selected (tab.cfg_val("transition") == _t)

            for _row in tab.rows():
                use ui_editor_fx_row(tab, _row)

            hbox:
                spacing 6
                use ui_editor_fx_name("전환을 기다림")
                textbutton ("기다림" if tab.cfg_val("wait") else "안 기다림") style "ui_editor_fx_button" action Function(tab.cfg_put, "wait", not tab.cfg_val("wait")) selected bool(tab.cfg_val("wait"))
                use ui_editor_fx_name("클릭으로 건너뛰기")
                textbutton ("됨" if tab.cfg_val("skippable") else "안 됨") style "ui_editor_fx_button" action Function(tab.cfg_put, "skippable", not tab.cfg_val("skippable")) selected bool(tab.cfg_val("skippable"))

            hbox:
                spacing 6
                textbutton "미리 보기: TV" style "ui_editor_button" action Function(tab.preview, "tv")
                textbutton "미리 보기: 서서히" style "ui_editor_button" action Function(tab.preview, "fade")

        else:

            hbox:
                spacing 6
                box_wrap True
                xmaximum 632
                use ui_editor_fx_name("글자 빼기")
                $ _ex = tab.cur_exclude()
                for _g, _gl in tab.text_groups():
                    textbutton _gl style "ui_editor_fx_button" action Function(tab.toggle_exclude, _g) selected (_g in _ex)
                textbutton "안 뺌" style "ui_editor_fx_button" action Function(tab.set_exclude, ()) selected (not _ex)
                textbutton "전부 뺌" style "ui_editor_fx_button" action Function(tab.set_exclude, "all") selected (len(_ex) == 3)

            hbox:
                spacing 6
                box_wrap True
                xmaximum 630
                use ui_editor_fx_name("세부 속성")
                textbutton "기본 설정" style "ui_editor_fx_button" action Function(tab.set_target, None) selected (tab.target is None)
                for _n in tab.preset_names():
                    textbutton ("프리셋: " + _n) style "ui_editor_fx_button" action Function(tab.set_target, _n) selected (tab.target == _n)

            if len(tab.group_list()) > 1:
                hbox:
                    spacing 4
                    box_wrap True
                    box_wrap_spacing 4
                    xmaximum 632
                    for _i, _g in enumerate(tab.group_list()):
                        textbutton _g[0] style "ui_editor_tab" action Function(tab.set_group, _i) selected (tab.group == _i)

            for _row in tab.rows():
                use ui_editor_fx_row(tab, _row)


## "셰이더 고르기" 페이지 (4.3): 1번, 2번을 고르고 고른 줄부터 적용 ($ screen_fx.shaders(…) 줄을 넣음)
screen ui_editor_fx_lines_panel(tab):

    $ _a, _b = tab.get_picks()
    use ui_editor_fx_slot_row("1번 셰이더", 0, _a, tab.set_pick, tab.clear_picks)
    use ui_editor_fx_slot_row("2번 셰이더", 1, _b, tab.set_pick, tab.clear_picks)

    hbox:
        spacing 4
        box_wrap True
        box_wrap_spacing 4
        xmaximum 632
        textbutton "< [[" style "ui_editor_button" text_size 13 action Function(tab.step_line, -1)
        textbutton "] >" style "ui_editor_button" text_size 13 action Function(tab.step_line, 1)
        if screen_fx.fx_line_input is not None:
            text "줄 번호" style "ui_editor_text" yalign 0.5
            button:
                style "ui_editor_button"
                xsize 70
                action screen_fx.fx_line_input.Toggle()
                input value screen_fx.fx_line_input style "ui_editor_text" length 6 allow "0123456789"
        textbutton ("L 목록 접기" if tab.list_open else "L 목록 펴기") style "ui_editor_button" text_size 13 action ToggleField(tab, "list_open")

    if tab.list_open:
        $ _rows = tab.nearby_lines()
        $ _hk = tab.here_key()
        vbox:
            spacing 1
            for _line, _text, _on, _here, _dirty in _rows:
                hbox:
                    spacing 2
                    ## 세모: 게임의 지금 줄. 두 번 누르면 고른 줄이 이 줄로 (그다음부터 따라감)
                    button:
                        style "ui_editor_button"
                        xsize 26
                        padding (2, 1)
                        action Function(tab.mark_click)
                        sensitive _here
                        if _here:
                            text "▶" font tab.mark_font() size 14 color "#ff3b8d" xalign 0.5
                        else:
                            null width 1
                    button:
                        style "ui_editor_button"
                        xsize 594
                        padding (6, 1)
                        action Function(tab.set_line, (tab.line_file(), _line))
                        selected _on
                        hbox:
                            spacing 6
                            text ("{:>4}".format(_line)) style "ui_editor_small" color ("#ff3b8d" if _here else "#cccccc") min_width 34
                            text (("* " if _dirty else "") + _text) style "ui_editor_small" color "#ffffff"
            ## 세모가 목록 밖이면 (다른 파일이거나 멀리 있으면) 따로 한 줄
            if _hk is not None and not [ r for r in _rows if r[3] ]:
                hbox:
                    spacing 2
                    button:
                        style "ui_editor_button"
                        xsize 26
                        padding (2, 1)
                        action Function(tab.mark_click)
                        text "▶" font tab.mark_font() size 14 color "#ff3b8d" xalign 0.5
                    text ("지금 줄: {} {}번째 (세모를 두 번 누르면 그 줄로)".format(_hk[0].replace("\\", "/").replace("game/", "", 1), _hk[1])) style "ui_editor_small" yalign 0.5

    hbox:
        spacing 6
        textbutton "여기에서부터 적용" style "ui_editor_button" action Function(tab.apply_here)
        textbutton "이 줄 위의 셰이더 줄 지우기" style "ui_editor_button" action Function(tab.lremove)


## 타이틀 셰이더 / 게임 내 메뉴 셰이더 탭 (4.3)
screen ui_editor_menu_fx_panel(tab):

    vbox:
        spacing 6
        $ _a, _b = tab.slots()
        use ui_editor_fx_slot_row("1번 셰이더", 0, _a, tab.set_slot, tab.clear)
        use ui_editor_fx_slot_row("2번 셰이더", 1, _b, tab.set_slot, tab.clear)
