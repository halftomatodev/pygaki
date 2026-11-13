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
        import functools

        def _fmt_num(v, digits):
            if digits == 0:
                return "{:.0f}".format(v)
            return ("{:." + str(digits) + "f}").format(v)

        ## ── 막대 ──

        class FxBarValue(store.BarValue, store.DictEquality):
            """탭의 값을 읽고 쓰는 막대."""

            def __init__(self, tab_id, key, lo, hi, step, digits, page=None):
                self.tab_id = tab_id
                self.key = key
                self.lo = lo
                self.hi = hi
                self.step = step
                self.digits = digits
                self.page = page        # 4.4: 화면 효과 탭의 어느 효과(또는 "tv") 값인지

            def _tab(self):
                t = _ed.get_tab(self.tab_id)
                if self.page is not None and hasattr(t, "view"):
                    return t.view(self.page)
                return t

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

            ## 그림 고르기 창(UI Kit의 "background" 창)에서 쓰는 것 (5.1, 나이트비전 화면 이미지)
            background_title = "그림 고르기 - game 폴더의 그림"
            background_none_label = "없음"

            def background_files(self):
                return store.ui_kit.game_files((".png", ".webp", ".jpg", ".jpeg", ".avif"))

        ## ── 세부 속성의 글 칸 (5.1): 줄 종류 "text" ──

        class FxTextInput(store.InputValue, store.DictEquality):
            default = False
            editable = True
            returnable = False

            def __init__(self, tab, key):
                self.tab = tab
                self.key = key
                self.text = None

            def get_text(self):
                if self.text is None:
                    return str(self.tab.val(self.key) or "").replace("\n", "\\n")
                return self.text

            def set_text(self, s):
                self.text = s
                renpy.restart_interaction()

            def enter(self):
                s = (self.text if self.text is not None else self.get_text()).replace("\\n", "\n")
                self.tab.put(self.key, s)
                self.text = None
                renpy.run(self.Disable())
                raise renpy.IgnoreEvent()

            def cancel(self):
                self.text = None
                renpy.run(self.Disable())

        _fx_text_inputs = { }

        def fx_text_input(tab, key):
            k = (id(tab), key)
            if k not in _fx_text_inputs:
                _fx_text_inputs[k] = FxTextInput(tab, key)
            return _fx_text_inputs[k]

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

        class FxView(store.python_object):
            """화면 효과 탭을 한 효과(또는 "tv")에 맞춰 보는 창 (4.4).
            1번, 2번 아래에 세부 속성을 같이 그리려고, 부를 때만 탭의 page를 잠시 그 효과로 바꿉니다."""

            def __init__(self, tab, page):
                self._t = tab
                self.view_page = page
                self.key_prefix = page + ":"
                self._fns = { }

            def _swap(self, fn, *args, **kwargs):
                t = self._t
                old = t.page
                t.page = self.view_page
                try:
                    return fn(*args, **kwargs)
                finally:
                    t.page = old

            def __getattr__(self, name):
                if name.startswith("__") or name in ("_t", "_fns", "view_page", "key_prefix"):
                    raise AttributeError(name)
                fns = self.__dict__.get("_fns")
                if fns is not None and name in fns:
                    return fns[name]
                t = self.__dict__["_t"]
                cls_attr = getattr(type(t), name, None)
                if isinstance(cls_attr, property) or not callable(cls_attr):
                    return self._swap(getattr, t, name)
                fn = getattr(t, name)
                ## 같은 함수를 돌려줘야 화면의 Function(…)이 매번 바뀐 것으로 보이지 않음
                w = functools.partial(self._swap, fn)
                fns[name] = w
                return w

        class FxTab(FlowTreeMixin, FxTabBase):

            id = TAB_ID
            label = "화면 효과"
            panel_screen = "ui_editor_screen_fx_panel"
            overlay_screen = "ui_editor_fx_tree_overlay"     # 5.2: 줄기표 서랍 (editor_flow.rpy)

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
                self.page = "lines"     # 늘 "lines"(셰이더 고르기). 효과 이름, "tv"는 FxView가 잠시 바꿀 때만 (4.4)
                self.line_sel = None    # 줄에 넣기: 고른 줄 (파일, 줄 번호)
                self.line_edits = { }   # 줄에 넣기: (파일, 줄 번호) -> {"fx", "overlay", "warp", "cursor", "transition", "remove", "expect"}
                self.list_open = True
                self.groups = { }       # 효과 이름 -> 막대 묶음 번호
                self.targets = { }      # 효과 이름 -> None(기본 설정) 또는 프리셋 이름
                self.copy_hint = "설정 파일에 붙여넣으세요."
                self.picks = None       # 셰이더 고르기: 고른 (1번, 2번). None = 아직 안 고름 (게임의 지금 값) (4.3)
                self.follow = True      # 셰이더 고르기: 고른 줄이 ▶(게임의 지금 줄)를 따라감
                self.mark_t = 0.0       # ▶ 더블 클릭 판정용
                self.detail_open = [ True, True ]   # 1번, 2번 아래 세부 속성 펴기 (4.4)
                self.tv_open = False    # 맨 아래 "처음 상태" 펴기 (4.4)
                self.apply_tr = DEFAULT # [여기에서부터 적용]으로 넣는 줄의 전환 (4.5)
                self._views = { }

            def view(self, page):
                """그 효과(또는 "tv")의 값을 고치는 창. 패널의 세부 속성 칸과 막대가 씀."""
                v = self._views.get(page)
                if v is None:
                    v = self._views[page] = FxView(self, page)
                return v

            def toggle_detail(self, slot):
                self.detail_open[slot] = not self.detail_open[slot]
                renpy.restart_interaction()

            ## ── 페이지 ──

            def fx(self):
                return EFFECTS.get(self.page)

            def is_tv(self):
                return self.page == "tv"

            def is_lines(self):
                return self.page == "lines"

            def available(self):
                if not EFFECTS:
                    return (False, "등록된 화면 효과가 없습니다.")
                return (True, "")

            def on_open(self):
                ## 4.4: 페이지 고르기가 없어지고 늘 셰이더 고르기 (세부 속성은 1번, 2번 아래)
                self.page = "lines"
                if self.line_sel is None:
                    self.follow = True
                    self._follow()
                self._sync()

            def on_close(self):
                for fx in EFFECTS.values():
                    fx.state.preview = None

            def _sync(self):
                ## 세부 속성에서 고른 프리셋을 미리 보여줌 (효과마다)
                for i, fx in EFFECTS.items():
                    fx.state.preview = self.targets.get(i)

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
                ## 색 고르기 창: "효과:값" (4.4, 1번/2번 아래 세부 속성)
                if ":" in key and self.page == "lines":
                    p, k = key.split(":", 1)
                    return self.view(p).get_value(k)
                v = self.val(key)
                return v if isinstance(v, str) else None

            def set_value(self, key, value):
                if ":" in key and self.page == "lines":
                    p, k = key.split(":", 1)
                    self.view(p).set_value(k, value)
                    return
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
                for k in ("remove", "fx", "overlay", "warp", "cursor"):
                    e.pop(k, None)
                e["slots"] = (a, b)
                e["transition"] = self.apply_tr
                _ed.msg("{}번째 줄부터 1번 {} + 2번 {} (전환 {}). 저장(Ctrl+S)하면 원고에 들어갑니다.".format(
                    self.line_sel[1], slot_label(a), slot_label(b), self.tr_label(self.apply_tr)))
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
                """고른 줄이 ▶를 따라가는 중이면 지금 줄로 맞춤.
                게임이 다른 원고 파일로 가면 다시 따라감 (4.5: 스플래시 같은 다른 파일의 줄이 남지 않게)."""
                if not self.follow and self.line_sel is not None:
                    k = self.here_key()
                    if k is not None and k[0] != self.line_sel[0]:
                        self.follow = True
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
            SHADER_HEADS = ("$ screen_fx.shaders(", "$ screen_fx.use(", "$ screen_fx.clear(", "$ screen_fx.set_overlay(", "$ screen_fx.set_warp(")
            CURSOR_HEADS = ("$ screen_fx.set_cursor(",)
            OUR_LINES = SHADER_HEADS + CURSOR_HEADS
            ## 줄마다 전환 (4.5): 설정대로 / TV / 서서히 / 바로
            TR_CHOICES = ((DEFAULT, "설정대로"), ("tv", "TV"), ("fade", "서서히"), (None, "바로"))
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

            def pick_line(self, key):
                """목록에서 줄을 누름: 그 줄을 고르고 게임도 그 줄로 옮김 (4.4).
                되감기나 다시 시작으로 화면이 바뀌므로 고른 줄을 먼저 정해 둡니다."""
                self.set_line(key)
                if key is None or self.follow:
                    return
                go = getattr(_ed, "goto_line", None)
                if go is not None:
                    go(key[0], key[1])

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
                if after and after[0] != num:
                    _ed.msg("{}번째 줄에는 넣을 수 없어서 가장 가까운 {}번째 줄을 골랐습니다.".format(num, after[0]))
                self.pick_line((fn, after[0] if after else lines[-1]))

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
                    if t is not None and not t.strip():
                        ## 빈 줄은 건너뜀 (원고 쓰기 도구도 사이의 빈 줄을 넘어 바꿈, 4.5)
                        n -= 1
                        continue
                    if t is None or t[:len(t) - len(t.lstrip(" \t"))] != ind:
                        break
                    if t.strip().startswith("# @l:"):
                        ## PyKaki 원고: 줄마다 붙은 표시 (4.5)
                        n -= 1
                        continue
                    if not t.strip().startswith(self.OUR_LINES):
                        break
                    ## 줄 끝에 붙은 PyKaki 표시(# @l:)는 떼고 봄 (ui_kit 4.5)
                    rv.insert(0, getattr(se, "_pk_strip", lambda x: x)(t).strip())
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
                if not [ t for t in self.existing_lines(self.line_sel) if t.startswith(self.SHADER_HEADS) ] and \
                        self.line_edits.get(self.line_sel, { }).get("slots") is None:
                    _ed.msg("이 줄 위에는 지울 셰이더 줄이 없습니다. (커서 줄은 커서 칸에서)")
                    return
                e = self._ledit(True)
                for k in ("fx", "overlay", "warp", "cursor", "transition", "remove"):
                    e.pop(k, None)
                e["slots"] = None
                renpy.restart_interaction()

            ## ── 셰이더가 바뀌는 줄 (4.5): 원고를 위에서부터 읽어 두 자리를 셈. 줄마다 전환 ──

            def tr_label(self, tr):
                ## "swap"(5.6)은 PyKaki가 그림 전환(픽셀소트 등)과 같이 쓰는 값이라 고르는 목록에는 없음
                return dict(self.TR_CHOICES + (("swap", "그림 전환과 같이"),)).get(tr, str(tr))

            def _file_lines(self, fn):
                se = self.se()
                if se is None or fn is None:
                    return [ ]
                try:
                    path = se.resolve(fn)
                    if path is None:
                        return [ ]
                    with open(path, encoding="utf-8-sig") as f:
                        return f.read().split("\n")
                except Exception:
                    return [ ]

            def _ov_slot(self, v):
                f = overlay_flag(v)
                if f is True or f == DEFAULT:
                    return OVERLAY if OVERLAY in EFFECTS else NONE
                if f is False:
                    return NONE
                return f if f in EFFECTS else NONE

            def _fx_slot(self, v):
                if v in (None, NONE):
                    return NONE
                if v == DEFAULT:
                    return self.start_slot(0)
                return v if v in EFFECTS else NONE

            def _call(self, text):
                """'$ screen_fx.이름(…)' → (이름, 인자 목록, 이름 붙은 인자). 못 읽으면 None."""
                import ast
                try:
                    node = ast.parse(text.strip()[1:].strip(), mode="eval").body
                    if not isinstance(node, ast.Call) or not isinstance(node.func, ast.Attribute):
                        return None
                    args = [ ast.literal_eval(a) for a in node.args ]
                    kw = { k.arg : ast.literal_eval(k.value) for k in node.keywords if k.arg }
                    return (node.func.attr, args, kw)
                except Exception:
                    return None

            def _say_kw(self, text):
                """대사 줄 끝 괄호의 fx=, fx_overlay=, fx_transition= (없으면 None)."""
                import ast, re
                ## 줄 끝에 붙은 PyKaki 표시(# @l:)는 떼고 읽음 (ui_kit 4.5)
                text = getattr(self.se(), "_pk_strip", lambda x: x)(text)
                m = re.search(r"\(([^()]*)\)\s*$", text)
                if not m or not re.search(r"\bfx(_overlay)?\s*=", m.group(1)):
                    return None
                try:
                    node = ast.parse("f(" + m.group(1) + ")", mode="eval").body
                    rv = { }
                    for k in node.keywords:
                        if k.arg in ("fx", "fx_overlay", "fx_transition"):
                            rv[k.arg] = ast.literal_eval(k.value)
                    return rv or None
                except Exception:
                    return None

            def call_slots(self, t, state):
                """'$ screen_fx.shaders(…)' 같은 줄 하나를 지난 뒤의 두 자리.
                ((1번, 2번), 두 자리 줄인지, 전환) 또는 None (셰이더 줄이 아님). 5.2: 줄기표도 씀"""
                c = self._call(t)
                if c is None:
                    return None
                name, args, kw = c
                a, b = state
                both = False
                if name == "shaders":
                    a = self._fx_slot(args[0] if args else kw.get("first", NONE))
                    b = self._fx_slot(args[1] if len(args) > 1 else kw.get("second", NONE))
                    both = True
                elif name == "use":
                    eff = args[0] if args else kw.get("effect", NONE)
                    if "overlay" in kw:
                        a, b, both = self._fx_slot(eff), self._ov_slot(kw["overlay"]), True
                    elif eff == OVERLAY:
                        a, b, both = NONE, OVERLAY, True      # 예전 use("vhs_crt") = 없음 + VHS
                    else:
                        a = self._fx_slot(eff)
                elif name == "clear":
                    a = self.start_slot(0)
                    if "overlay" in kw:
                        b, both = self._ov_slot(kw["overlay"]), True
                elif name == "set_overlay":
                    b = self._ov_slot(args[0] if args else kw.get("on", True))
                else:
                    return None
                return ((a, b), both, kw.get("transition", DEFAULT))

            def say_slots(self, t, state):
                """대사 줄 괄호의 fx=, fx_overlay= 를 지난 뒤의 두 자리. 없으면 None."""
                kw = self._say_kw(t)
                if kw is None:
                    return None
                a, b = state
                if "fx" in kw:
                    a = self._fx_slot(kw["fx"])
                if "fx_overlay" in kw:
                    b = self._ov_slot(kw["fx_overlay"])
                return ((a, b), False, kw.get("fx_transition", DEFAULT))

            def change_rows(self, fn=None):
                """이 원고 파일에서 셰이더가 바뀌는 줄. [{line, target, text, before, slots, both, tr, kind, pending}]
                두 자리는 파일을 위에서부터 읽어 셈 (게임 진행 순서가 아니라 줄 순서라 대강의 값)."""
                fn = fn or self.line_file()
                lines = self._file_lines(fn)
                stmts = [ l for l, _n in self.lines_of(fn) ]
                if not lines or not stmts:
                    return [ ]
                state = [ self.start_slot(0), self.start_slot(1) ]
                rv = [ ]
                for i, raw in enumerate(lines, 1):
                    t = raw.strip()
                    row = None
                    if t.startswith(self.SHADER_HEADS) and not t.startswith("$ screen_fx.set_warp("):
                        c = self.call_slots(t, state)
                        if c is None:
                            continue
                        tgt = [ l for l in stmts if l > i and not (lines[l - 1].strip().startswith(self.OUR_LINES)) ]
                        if not tgt:
                            continue
                        row = dict(line=i, target=(fn, tgt[0]), text=t, kind="code", slots=c[0], both=c[1], tr=c[2])
                    elif i in stmts:
                        c = self.say_slots(t, state)
                        if c is None:
                            continue
                        row = dict(line=i, target=(fn, i), text=t, kind="say", slots=c[0], both=False, tr=c[2])
                    if row is None:
                        continue
                    row["before"] = tuple(state)
                    e = self.line_edits.get(row["target"]) or { }
                    row["pending"] = "slots" in e
                    if row["pending"] and e["slots"] is not None:
                        row["slots"], row["both"], row["tr"] = tuple(e["slots"]), True, e.get("transition", DEFAULT)
                    state = list(row["slots"])
                    if len(t) > 46:
                        row["text"] = t[:45] + "…"
                    rv.append(row)
                return rv

            def _edit_for(self, key):
                e = self.line_edits.get(key)
                if e is None:
                    e = { "expect": (self.line_source(key) or "").strip() }
                    se = self.se()
                    if se is not None:
                        se.remember(key[0], key[1])
                    self.line_edits[key] = e
                return e

            def set_row_tr(self, row, tr):
                """두 자리 줄의 전환만 바꿈 (저장하면 그 줄을 shaders(…, transition=…)로 다시 씀)."""
                e = self._edit_for(row["target"])
                for k in ("remove", "fx", "overlay", "warp", "cursor"):
                    e.pop(k, None)
                e["slots"] = tuple(row["slots"])
                e["transition"] = tr
                _ed.msg("{}번째 줄 전환: {}. 저장(Ctrl+S)하면 원고에 들어갑니다.".format(row["line"], self.tr_label(tr)))
                renpy.restart_interaction()

            def make_both(self, row):
                """한 자리만 바꾸는 예전 줄을 두 자리 줄로 (그 줄에서의 1번, 2번으로). 대사 괄호면 괄호의 fx=, fx_overlay=도 지움."""
                if row["kind"] == "say":
                    say = _ed.get_tab("say") if hasattr(_ed, "get_tab") else None
                    ss = say.ss() if say is not None and hasattr(say, "ss") else None
                    if ss is None:
                        _ed.msg("대사 탭이 없어서 대사 괄호를 고칠 수 없습니다.")
                        return
                    d = ss.state.line_edits.setdefault(row["target"], { })
                    for k in ("fx", "fx_overlay", "fx_transition"):
                        d[k] = ss.REMOVE
                e = self._edit_for(row["target"])
                for k in ("remove", "fx", "overlay", "warp", "cursor"):
                    e.pop(k, None)
                e["slots"] = tuple(row["slots"])
                e["transition"] = row["tr"]
                a, b = row["slots"]
                _ed.msg("{}번째 줄을 두 자리로: 1번 {} + 2번 {}. 저장(Ctrl+S)하면 원고에 들어갑니다.".format(
                    row["line"], slot_label(a), slot_label(b)))
                renpy.restart_interaction()

            def slots_text(self, slots):
                return "1번 {} + 2번 {}".format(slot_label(slots[0]), slot_label(slots[1]))

            ## ── 커서와 셰이더 (4.5): 커서 칸에서 고르고 '여기에서부터 적용' → $ screen_fx.set_cursor("…") ──
            ## 줄 고르기(line_sel, ▶ 따라가기, 줄 누르면 게임도 그 줄로)는 셰이더 칸과 같이 씀

            CURSOR_CHOICES = CURSOR_LABELS
            cursor_pick = None

            def cursor_now(self):
                """칸에 보일 커서 자리: 고른 것, 없으면 게임의 지금 값."""
                return self.cursor_pick if self.cursor_pick is not None else current_cursor()

            def set_cursor_pick(self, mode):
                self.cursor_pick = mode
                rt.cursor_preview = mode
                renpy.restart_interaction()

            def cursor_leave(self):
                """커서 칸을 떠남: 미리 보기를 끝내고 게임의 값으로."""
                self.cursor_pick = None
                rt.cursor_preview = None
                renpy.restart_interaction()

            def cursor_apply(self):
                if self.se() is None:
                    _ed.msg("원고 쓰기 도구(UI Kit 3.0 이상)가 없습니다.")
                    return
                self._follow()
                if self.line_sel is None:
                    _ed.msg("줄을 넣을 수 있는 곳을 찾지 못했습니다. 게임을 진행한 뒤 다시 누르세요.")
                    return
                mode = self.cursor_now()
                e = self._ledit(True)
                e.pop("remove", None)
                e.pop("cursor", None)
                e["cursor_mode"] = mode
                _ed.msg("{}번째 줄부터 커서: {}. 저장(Ctrl+S)하면 원고에 들어갑니다.".format(self.line_sel[1], cursor_label(mode)))
                renpy.restart_interaction()

            def cursor_remove(self):
                if self.line_sel is None:
                    return
                have = [ t for t in self.existing_lines(self.line_sel) if t.startswith(self.CURSOR_HEADS) ]
                if not have and self.line_edits.get(self.line_sel, { }).get("cursor_mode") is None:
                    _ed.msg("이 줄 위에는 지울 커서 줄이 없습니다.")
                    return
                e = self._ledit(True)
                e.pop("remove", None)
                e["cursor_mode"] = None
                renpy.restart_interaction()

            def cursor_rows(self, fn=None):
                """이 원고 파일에서 커서 자리가 바뀌는 줄. [{line, target, mode, kind, pending}]"""
                fn = fn or self.line_file()
                lines = self._file_lines(fn)
                stmts = [ l for l, _n in self.lines_of(fn) ]
                if not lines or not stmts:
                    return [ ]
                rv = [ ]
                for i, raw in enumerate(lines, 1):
                    t = raw.strip()
                    mode = None
                    kind = "code"
                    if t.startswith(self.CURSOR_HEADS) or t.startswith("$ screen_fx.use(") or t.startswith("$ screen_fx.clear("):
                        c = self._call(t)
                        if c is None:
                            continue
                        name, args, kw = c
                        if name == "set_cursor":
                            mode = args[0] if args else kw.get("mode")
                        else:
                            mode = kw.get("cursor")
                        if mode is None:
                            continue
                        tgt = [ l for l in stmts if l > i and not (lines[l - 1].strip().startswith(self.OUR_LINES)) ]
                        if not tgt:
                            continue
                        key = (fn, tgt[0])
                    elif i in stmts and "fx_cursor" in t:
                        import re
                        m = re.search(r"\bfx_cursor\s*=\s*[\"']([a-z]+)[\"']", t)
                        if not m:
                            continue
                        mode, kind, key = m.group(1), "say", (fn, i)
                    else:
                        continue
                    e = self.line_edits.get(key) or { }
                    pending = "cursor_mode" in e
                    if pending and e["cursor_mode"] is not None:
                        mode = e["cursor_mode"]
                    rv.append(dict(line=i, target=key, mode=str(mode), label=cursor_label(mode) if mode in CURSOR_MODES else str(mode),
                        kind=kind, pending=pending))
                return rv

            def warp_restore(self, fn, line):
                """warp(게임을 다시 시작해서 그 줄로 건너뜀)는 $ 줄을 실행하지 않아서, 원고에서 그 줄 앞의
                마지막 셰이더 줄, 커서 줄을 찾아 맞춤 (4.5). 같은 파일 안에서 줄 순서로만 봄."""
                rows = [ r for r in self.change_rows(fn) if r["line"] < line ]
                if rows:
                    a, b = rows[-1]["slots"]
                    shaders(a, b, transition=None)
                crs = [ r for r in self.cursor_rows(fn) if r["line"] < line and r["mode"] in CURSOR_MODES ]
                if crs:
                    set_cursor(crs[-1]["mode"])

            def cursor_state(self):
                """앱 커서 칸이 그릴 것 (실시간 연결, 4.5)."""
                self._follow()
                hk = self.here_key()
                fn = self.line_file()
                rows = [ dict(line=l, text=(self.line_source((fn, l)) or "").strip()[:60], sel=on, here=here, dirty=dirty)
                    for l, _t, on, here, dirty in self.nearby_lines() ]
                sel = self.line_sel
                return dict(
                    choices=[ [ m, l ] for m, l in self.CURSOR_CHOICES ],
                    now=self.cursor_now(), game=current_cursor() if self.cursor_pick is None else None,
                    picked=self.cursor_pick is not None,
                    file=(sel[0] if sel else self.line_file()), line=(sel[1] if sel else None), follow=self.follow,
                    here=(list(hk) if hk else None), rows=rows,
                    have=[ t for t in self.existing_lines(sel) if t.startswith(self.CURSOR_HEADS) ] if sel else [ ],
                    pending=(sel in self.line_edits and "cursor_mode" in self.line_edits[sel]) if sel else False,
                    changes=[ dict(line=r["line"], target=list(r["target"]), label=r["label"], kind=r["kind"], pending=r["pending"]) for r in self.cursor_rows() ],
                    )

            def lreset(self):
                if self.line_sel is not None:
                    self.line_edits.pop(self.line_sel, None)
                renpy.restart_interaction()

            def _q(self, v):
                return "None" if v is None else '"{}"'.format(v)

            def _tr_arg(self, tr):
                if tr == DEFAULT:
                    return ""
                return ", transition={}".format(self._q(tr))

            def gen_lines(self, e, key=None):
                """편집 값 → 넣을 줄 목록 (앞 공백 없이).
                4.5: "slots"(두 자리, None이면 지움)와 "cursor_mode"(None이면 지움)는 서로 따로라,
                한쪽만 고치면 다른 쪽 줄은 원고에 있던 그대로 남깁니다."""
                if "slots" in e or "cursor_mode" in e:
                    have = self.existing_lines(key) if key is not None else [ ]
                    rv = [ ]
                    if "slots" in e:
                        if e["slots"] is not None:
                            a, b = e["slots"]
                            rv.append('$ screen_fx.shaders("{}", "{}"{})'.format(a, b, self._tr_arg(e.get("transition", DEFAULT))))
                    else:
                        rv += [ t for t in have if t.startswith(self.SHADER_HEADS) ]
                    if "cursor_mode" in e:
                        if e["cursor_mode"] is not None:
                            rv.append('$ screen_fx.set_cursor("{}")'.format(e["cursor_mode"]))
                    else:
                        rv += [ t for t in have if t.startswith(self.CURSOR_HEADS) ]
                    return rv
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
                return self.gen_lines(e, self.line_sel)

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
                    lines = [ ] if e.get("remove") else self.gen_lines(e, key)
                    if not lines and not e.get("remove") and not (e.get("slots", 0) is None or e.get("cursor_mode", 0) is None):
                        continue
                    ed = se.Edit(key[0], key[1], se.INSERT,
                        { "lines": lines, "replace": self.OUR_LINES }, expect=e.get("expect") or None)
                    ## 처음 고른 줄. PyKaki 원고는 저장할 때 linenumber를 표시 줄로 옮기므로 이것으로 지움 (5.2)
                    ed.key = key
                    rv.append(ed)
                return rv

            def after_script_save(self, edits):
                ## 5.2 고침: 예전에는 (파일, linenumber)로 지워서, PyKaki 원고(저장할 때 linenumber가 한 줄 위로 바뀜)에서는
                ## 저장한 편집이 남아 다음 저장 때 예전 줄 번호로 또 써졌음(셰이더 줄이 겹치거나 지운 줄이 되살아남)
                changed = set(ed.filename for ed in edits if ed.ok and getattr(ed, "changed", False))
                for ed in edits:
                    key = getattr(ed, "key", None) or (ed.filename, ed.linenumber)
                    ## 저장된 것, 그리고 줄 번호가 바뀐 파일의 남은 편집은 버림 (다시 불러오면 줄 번호가 맞지 않음)
                    if ed.ok or ed.filename in changed:
                        self.line_edits.pop(key, None)
                ## 줄이 늘어서 줄 번호가 바뀌므로, 다시 불러온 뒤 지금 줄로 다시 고름
                self.line_sel = None
                self.tree_after_save()

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
                elif k == pg.K_g and self.se() is not None:
                    self.tree_toggle()
                elif k == pg.K_DELETE and self.tree_open:
                    self.tree_delete()
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
                    m = self.pending()
                    if n:
                        rv.append("원고에 저장 안 한 줄 {}곳 (Ctrl+S)".format(n))
                    if m:
                        rv.append("저장 안 한 세부 속성, 전환 변경: {}개 (Ctrl+S)".format(m))
                    if not n and not m:
                        rv.append("저장 안 한 변경 없음")
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
                        "1번, 2번을 고르면 화면에 바로 보이고, 그 아래에서 효과의 세부 속성을 고칩니다.",
                        "목록에서 줄 누르기: 그 줄을 고르고 게임도 그 줄로 | [[ ] 앞뒤 줄 | 세모 두 번: 지금 줄로 | Ctrl+S 저장",
                        "G 줄기표: 마디를 끌어 구간 고르기 → [[이 구간에 적용] | 오른쪽 네모 점으로 전환 점 고르기 | Delete 구간/고른 점의 셰이더 지우기",
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
                    line_edits={ k : dict(v) for k, v in self.line_edits.items() },
                    tree_open=bool(self.tree_open))

            def restore(self, d):
                if d:
                    self.page = "lines"
                    self.groups = dict(d.get("groups") or { })
                    self.targets = dict(d.get("targets") or { })
                    self.line_edits = { tuple(k) : dict(v) for k, v in (d.get("line_edits") or { }).items() }
                    self.tree_open = bool(d.get("tree_open", False))

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
                self.detail_open = [ True, True ]

            ## 4.4: 1번, 2번 아래 세부 속성. 값은 화면 효과 탭과 같이 씀 (저장도 그 탭이 함)
            def fx_tab(self):
                return _ed.get_tab(TAB_ID)

            def view(self, page):
                return self.fx_tab().view(page)

            def toggle_detail(self, slot):
                self.detail_open[slot] = not self.detail_open[slot]
                renpy.restart_interaction()

            def get_value(self, key):
                return self.fx_tab().get_value(key)

            def set_value(self, key, value):
                self.fx_tab().set_value(key, value)

            def on_open(self):
                self.fx_tab()._sync()

            def on_close(self):
                for fx in EFFECTS.values():
                    fx.state.preview = None

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
                rv.append("1번, 2번 아래 세부 속성은 효과마다 하나라 인게임과 같이 씁니다.")
                n = self.pending() + self.fx_tab().pending() - (1 if self.key in cedit.edits else 0)
                rv.append("저장 안 한 변경: {}개".format(n) if n else "저장 안 한 변경 없음")
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
                bar value screen_fx.FxBarValue(tab.id, "_res", 60, 720, 10, 0, getattr(tab, "view_page", None)) xsize 160 yalign 0.5
            text ("{:.0f}줄".format(tab.res_lines())) style "ui_editor_fx_value"
        elif row[2] == "options":
            hbox:
                spacing 4
                box_wrap True
                box_wrap_spacing 4
                xmaximum 470
                for _v, _vl in row[3]:
                    textbutton _vl style "ui_editor_fx_button" action Function(tab.put, _k, _v) selected (tab.val(_k) == _v)
        elif row[2] == "text":
            ## 글 칸 (5.1): 누르고 고친 뒤 Enter. 줄바꿈은 \\n
            button:
                style "ui_editor_fx_button"
                xsize 470
                yminimum 56
                action screen_fx.fx_text_input(tab, _k).Toggle()
                input value screen_fx.fx_text_input(tab, _k) style "ui_editor_fx_button_text" length 200 xmaximum 450
        elif row[2] == "image":
            ## 그림 고르기 (5.1)
            $ _img = tab.val(_k) or ""
            textbutton (ui_editor.short_path(_img) if _img else "없음") style "ui_editor_fx_button" action Function(ui_editor.open_popup, "background", getattr(tab, "key_prefix", "") + _k)
            if _img:
                textbutton "빼기" style "ui_editor_fx_button" action Function(tab.put, _k, "")
        elif row[2] == "color":
            $ _c = tab.get_value(_k) or "#ffffff"
            button:
                style "ui_editor_fx_button"
                action Function(ui_editor.open_popup, "color", getattr(tab, "key_prefix", "") + _k)
                hbox:
                    spacing 4
                    add Solid(_c, xysize=(16, 16)) yalign 0.5
                    text _c style "ui_editor_fx_button_text" yalign 0.5
        else:
            bar value screen_fx.FxBarValue(tab.id, _k, row[2], row[3], row[4], row[5], getattr(tab, "view_page", None)) xsize 200 yalign 0.5
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
## owner가 있으면 끝에 그 자리 세부 속성 접기/펴기 (4.4)
screen ui_editor_fx_slot_row(label, slot, cur, pick, clear=None, owner=None):
    hbox:
        spacing 4
        box_wrap True
        box_wrap_spacing 4
        xmaximum 632
        use ui_editor_fx_name(label)
        for _n, _nl in screen_fx.slot_choices(keep=(cur,)):
            textbutton _nl style "ui_editor_fx_button" action Function(pick, slot, _n) selected (cur == _n)
        if clear is not None:
            textbutton "전부 셰이더 적용 취소" style "ui_editor_fx_button" action Function(clear)
        if owner is not None and cur in screen_fx.EFFECTS:
            textbutton ("세부 속성 접기" if owner.detail_open[slot] else "세부 속성 펴기") style "ui_editor_fx_button" action Function(owner.toggle_detail, slot)


## 한 효과의 세부 속성 (4.4): 1번, 2번 줄 바로 아래. v = 화면 효과 탭의 view(효과 이름)
## whole: 타이틀, 게임 내 메뉴처럼 화면 전체에 씌우는 자리 (글자 빼기 없음)
screen ui_editor_fx_detail(v, whole=False):
    hbox:
        spacing 0
        null width 16
        vbox:
            spacing 6

            if not whole:
                hbox:
                    spacing 6
                    box_wrap True
                    xmaximum 616
                    use ui_editor_fx_name("글자 빼기")
                    $ _ex = v.cur_exclude()
                    for _g, _gl in v.text_groups():
                        textbutton _gl style "ui_editor_fx_button" action Function(v.toggle_exclude, _g) selected (_g in _ex)
                    textbutton "안 뺌" style "ui_editor_fx_button" action Function(v.set_exclude, ()) selected (not _ex)
                    textbutton "전부 뺌" style "ui_editor_fx_button" action Function(v.set_exclude, "all") selected (len(_ex) == 3)

            hbox:
                spacing 6
                box_wrap True
                xmaximum 616
                use ui_editor_fx_name("세부 속성")
                textbutton "기본 설정" style "ui_editor_fx_button" action Function(v.set_target, None) selected (v.target is None)
                for _n in v.preset_names():
                    textbutton ("프리셋: " + _n) style "ui_editor_fx_button" action Function(v.set_target, _n) selected (v.target == _n)

            $ _gl = v.group_list()
            if len(_gl) > 1:
                hbox:
                    spacing 4
                    box_wrap True
                    box_wrap_spacing 4
                    xmaximum 616
                    for _i, _g in enumerate(_gl):
                        textbutton _g[0] style "ui_editor_tab" action Function(v.set_group, _i) selected (v.group == _i)

            for _row in v.rows():
                use ui_editor_fx_row(v, _row)


## 1번, 2번 두 자리와 그 아래 세부 속성 (4.4)
screen ui_editor_fx_slots(owner, a, b, pick, clear, whole=False):
    use ui_editor_fx_slot_row("1번 셰이더", 0, a, pick, clear, owner)
    if a in screen_fx.EFFECTS and owner.detail_open[0]:
        use ui_editor_fx_detail(owner.view(a), whole)
    use ui_editor_fx_slot_row("2번 셰이더", 1, b, pick, clear, owner)
    if b in screen_fx.EFFECTS and b != a and owner.detail_open[1]:
        use ui_editor_fx_detail(owner.view(b), whole)


## 인게임 화면 셰이더 (4.4): 페이지 고르기 없이 1번, 2번 + 세부 속성, 줄 목록, 맨 아래 처음 상태와 전환
screen ui_editor_screen_fx_panel(tab):

    vbox:
        spacing 6

        $ _a, _b = tab.get_picks()
        use ui_editor_fx_slots(tab, _a, _b, tab.set_pick, tab.clear_picks)

        if tab.se() is not None:
            use ui_editor_fx_tree_panel(tab)
            use ui_editor_fx_lines_panel(tab)
        else:
            text "원고 쓰기 도구(UI Kit 3.0 이상)가 없어서 줄 고르기와 [[여기에서부터 적용]은 못 씁니다." style "ui_editor_small"

        textbutton ("처음 상태 접기" if tab.tv_open else "처음 상태 펴기") style "ui_editor_button" text_size 13 action ToggleField(tab, "tv_open")
        if tab.tv_open:
            use ui_editor_fx_tv_panel(tab, tab.view("tv"))


## 처음 상태 (4.5): 게임을 시작할 때 두 자리와, 줄에 '설정대로'라고 둔 전환
## (TV 시간, 기다림, 건너뛰기는 screen_fx_config.rpy의 screen_fx.tv 등에서)
screen ui_editor_fx_tv_panel(tab, tv):

    use ui_editor_fx_slot_row("처음 1번", 0, tab.start_slot(0), tab.set_start_slot)
    use ui_editor_fx_slot_row("처음 2번", 1, tab.start_slot(1), tab.set_start_slot)

    hbox:
        spacing 6
        use ui_editor_fx_name("'설정대로' 전환")
        for _t, _tl in tab.TRANSITION_LABELS:
            textbutton _tl style "ui_editor_fx_button" action Function(tab.cfg_put, "transition", _t) selected (tab.cfg_val("transition") == _t)


## 줄 목록 (4.3): 고른 줄부터 적용 ($ screen_fx.shaders(…) 줄을 넣음). 줄을 누르면 게임도 그 줄로 (4.4)
screen ui_editor_fx_lines_panel(tab):

    use ui_editor_fx_line_list(tab)
    use ui_editor_fx_shader_apply(tab)


## 줄 고르기 (셰이더 칸, 커서 칸이 같이 씀, 4.5). 세모(▶)가 게임의 지금 줄, 줄을 누르면 게임도 그 줄로
screen ui_editor_fx_line_list(tab):

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
                            text " " size 14
                    button:
                        style "ui_editor_button"
                        xsize 594
                        padding (6, 1)
                        action Function(tab.pick_line, (tab.line_file(), _line))
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


## 셰이더 칸: 적용, 지우기, 셰이더가 바뀌는 줄
screen ui_editor_fx_shader_apply(tab):

    hbox:
        spacing 4
        box_wrap True
        box_wrap_spacing 4
        xmaximum 632
        use ui_editor_fx_name("적용할 때 전환")
        for _t, _tl in tab.TR_CHOICES:
            textbutton _tl style "ui_editor_fx_button" action SetField(tab, "apply_tr", _t) selected (tab.apply_tr == _t)

    hbox:
        spacing 6
        textbutton "여기에서부터 적용" style "ui_editor_button" action Function(tab.apply_here)
        textbutton "이 줄 위의 셰이더 줄 지우기" style "ui_editor_button" action Function(tab.lremove)

    ## 셰이더가 바뀌는 줄 (4.5): 1번, 2번은 늘 같이 바뀜. 줄마다 전환만 고름
    $ _ch = tab.change_rows()
    text ("셰이더가 바뀌는 줄 (이 파일 {}곳)".format(len(_ch)) if _ch else "이 파일에는 셰이더가 바뀌는 줄이 없습니다.") style "ui_editor_small" color "#cccccc"
    vbox:
        spacing 2
        for _r in _ch:
            hbox:
                spacing 4
                box_wrap True
                box_wrap_spacing 2
                xmaximum 632
                textbutton ("{}{:>4}".format("* " if _r["pending"] else "", _r["line"])) style "ui_editor_fx_button" action Function(tab.pick_line, _r["target"]) selected (tab.line_sel == _r["target"])
                text tab.slots_text(_r["slots"]) style "ui_editor_small" color "#ffffff" yalign 0.5
                if _r["both"]:
                    for _t, _tl in tab.TR_CHOICES:
                        textbutton _tl style "ui_editor_fx_button" action Function(tab.set_row_tr, _r, _t) selected (_r["tr"] == _t)
                else:
                    text ("(대사 괄호, 한 자리만)" if _r["kind"] == "say" else "(한 자리만)") style "ui_editor_small" color "#ffd23b" yalign 0.5
                    textbutton "두 자리로 바꾸기" style "ui_editor_fx_button" action Function(tab.make_both, _r)


## 타이틀 셰이더 / 게임 내 메뉴 셰이더 탭 (4.3). 세부 속성은 1번, 2번 아래 (4.4, 인게임과 같은 값)
screen ui_editor_menu_fx_panel(tab):

    vbox:
        spacing 6
        $ _a, _b = tab.slots()
        use ui_editor_fx_slots(tab, _a, _b, tab.set_slot, tab.clear, True)


## 커서 칸 (UI Kit "커서/대사 소리" 탭 아래, 4.5): 커서가 셰이더를 받을지 '여기에서부터'
screen ui_editor_fx_cursor_panel(tab):

    vbox:
        spacing 6
        text "커서와 셰이더 (여기에서부터)" style "ui_editor_row_label"
        hbox:
            spacing 4
            box_wrap True
            xmaximum 632
            for _m, _ml in tab.CURSOR_CHOICES:
                textbutton _ml style "ui_editor_fx_button" action Function(tab.set_cursor_pick, _m) selected (tab.cursor_now() == _m)
        use ui_editor_fx_line_list(tab)
        hbox:
            spacing 6
            textbutton "여기에서부터 적용" style "ui_editor_button" action Function(tab.cursor_apply)
            textbutton "이 줄 위의 커서 줄 지우기" style "ui_editor_button" action Function(tab.cursor_remove)
        $ _cr = tab.cursor_rows()
        text ("커서가 바뀌는 줄 (이 파일 {}곳)".format(len(_cr)) if _cr else "이 파일에는 커서가 바뀌는 줄이 없습니다. (처음 값은 설정 screen_fx.cursor)") style "ui_editor_small" color "#cccccc"
        for _r in _cr:
            hbox:
                spacing 4
                textbutton ("{}{:>4}".format("* " if _r["pending"] else "", _r["line"])) style "ui_editor_fx_button" action Function(tab.pick_line, _r["target"]) selected (tab.line_sel == _r["target"])
                text (_r["label"] + (" (대사 괄호)" if _r["kind"] == "say" else "")) style "ui_editor_small" color "#ffffff" yalign 0.5
