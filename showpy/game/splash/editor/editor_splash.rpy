################################################################################
## Splash — UI Kit 편집기 탭 "스플래시" (splash 2.0)
##
## UI Kit 플러그인이 있으면 그 편집기(개발 모드에서 Shift+M)에 탭을 더합니다.
## UI Kit이 없으면 이 파일은 아무것도 하지 않고, 페이지는 splash_config.rpy대로 나옵니다.
## PyKaki(pygaki) 앱의 [GUI 편집] 화면에도 이 탭의 패널이 그대로 나옵니다 (ui_kit 3.16 공통 틀).
##
##   가운데 화면에 고른 페이지를 다 나타난 모습 그대로 그립니다 (2.0).
##     누르면 고르고, 끌면 옮깁니다. 빈 곳을 끌면 그림·제목·본문·표 묶음 전체가 움직입니다.
##     네 모서리 손잡이로 늘리고 줄이고(글은 글자 크기, 로고는 확대), 위쪽 분홍 손잡이로 돌립니다.
##     글은 더블클릭(또는 고른 뒤 Enter)으로 그 자리에서 고칩니다. Enter 끝, Esc 취소, Shift+Enter 줄바꿈.
##     방향키 1픽셀(Shift 10), 휠·S/W 크기, Q/E 회전, Backspace 자리 되돌리기.
##   패널에서 바탕색, 바탕·로고 그림, 글꼴·색, 시간, 넘어가는 때를 바꾸고
##   페이지를 더하고, 복제하고, 지우고, 순서를 바꿉니다.
##   [이 페이지 보기]로 지금 값으로 그 페이지를 진짜 시간대로 띄워 봅니다 (클릭하면 닫힘).
##
##   저장하면 이 폴더의 splash_layout.rpy에 페이지마다 바꾼 값만 적습니다.
##   글은 _("…")로 적어서 번역 목록에 그대로 잡힙니다. 그 파일의 값은 splash_config.rpy의
##   같은 값보다 우선합니다. 지우면 설정 파일 값으로 돌아갑니다.
################################################################################

init offset = 1

## UI Kit 편집기(init -9, -8)를 읽은 뒤에 실행됩니다.
init -6 python in splash:

    import json
    import math
    import time as _time

    _ed = getattr(store, "ui_editor", None)
    HAS_EDITOR = (_ed is not None) and hasattr(_ed, "register") and hasattr(_ed, "Tab")

    _EDITOR_FILE = store.renpy.get_filename_line()[0].replace("\\", "/")

    ## 글 값 (저장할 때 _("…")로 적음)
    TEXT_KEYS = ("title", "body", "prompt", "dont_show_again")

    def _tr(s):
        """글 하나를 번역할 수 있는 모양으로: _("…")"""
        return "_(" + json.dumps(s, ensure_ascii=False) + ")"

    def fmt_value(key, v):
        """splash_layout.rpy에 적을 값 한 개."""
        if key in TEXT_KEYS and isinstance(v, str):
            return _tr(v)
        if key == "keys" and isinstance(v, (list, tuple)):
            rows = [ "({}, {})".format(_tr(k) if isinstance(k, str) else repr(k), _tr(d) if isinstance(d, str) else repr(d)) for k, d in v ]
            return "[ " + ", ".join(rows) + " ]" if rows else "[ ]"
        if isinstance(v, float):
            return repr(round(v, 3))
        if isinstance(v, tuple) and all(isinstance(x, (int, float)) for x in v):
            return "(" + ", ".join(repr(round(x, 2)) if isinstance(x, float) else repr(x) for x in v) + ")"
        uk = getattr(store, "ui_kit", None)
        if uk is not None and hasattr(uk, "format_value"):
            return uk.format_value(v)
        return repr(v)

    if HAS_EDITOR:

        import pygame_sdl2 as pygame

        IMAGE_EXTS = (".png", ".webp", ".jpg", ".jpeg", ".avif")

        def root_path(filename):
            """이 플러그인 폴더(splash/) 안 파일의 실제 경로."""
            root = os.path.dirname(os.path.dirname(_EDITOR_FILE))
            for base in (store.config.basedir, store.config.gamedir):
                if os.path.isdir(os.path.join(base, root)):
                    return os.path.join(base, root, filename)
            return os.path.join(store.config.gamedir, filename)

        ## ── 막대 ──

        class SplashBarValue(store.BarValue, DictEquality):
            """고른 페이지의 숫자 값을 읽고 쓰는 막대."""

            def __init__(self, key, lo, hi, step, digits):
                self.key = key
                self.lo = lo
                self.hi = hi
                self.step = step
                self.digits = digits

            def changed(self, v):
                value = self.lo + v
                value = int(round(value)) if self.digits == 0 else round(value, self.digits)
                _ed.get_tab("splash").put(self.key, value)

            def get_adjustment(self):
                v = _ed.get_tab("splash").val(self.key)
                try:
                    v = float(v)
                except Exception:
                    v = self.lo
                v = max(self.lo, min(self.hi, v))
                return store.ui.adjustment(range=self.hi - self.lo, value=v - self.lo, step=self.step,
                    changed=self.changed, adjustable=True)

            def get_style(self):
                return ("ui_editor_bar", "ui_editor_bar")

        ## ── 글 입력 칸 ──

        class SplashTextInput(store.InputValue, DictEquality):
            """가운데 화면에서 글을 고치는 입력 칸. 하나만 씁니다."""
            default = True
            editable = True
            returnable = False

            def get_text(self):
                t = _ed.get_tab("splash")
                return t.edit_text if t.editing is not None else ""

            def set_text(self, s):
                t = _ed.get_tab("splash")
                t.edit_text = s
                store.renpy.restart_interaction()

            def enter(self):
                _ed.get_tab("splash").commit_edit()
                raise store.renpy.IgnoreEvent()

            ## 편집기 공통 틀(EditorInput)이 Esc, Ctrl+S에 부름 (ui_kit 4.0)
            def cancel(self):
                _ed.get_tab("splash").cancel_edit()

            def commit(self):
                _ed.get_tab("splash").commit_edit()

        text_input = SplashTextInput()

        class PanelTextInput(store.InputValue, DictEquality):
            """패널의 글 칸 (앱에서도 보임). 줄바꿈은 \\n 두 글자로 보이고 고칩니다."""
            default = False
            editable = True
            returnable = False

            def __init__(self, key, index=None, part=None):
                self.key = key          # "title" ... 또는 "keys"
                self.index = index      # 표의 줄 번호
                self.part = part        # 0 키, 1 설명
                self.text = None

            def _cur(self):
                t = _ed.get_tab("splash")
                if self.key == "keys":
                    rows = t.key_rows()
                    if self.index is None or self.index >= len(rows):
                        return ""
                    return rows[self.index][self.part] or ""
                return t.val(self.key) or ""

            def get_text(self):
                if self.text is None:
                    return self._cur().replace("\n", "\\n")
                return self.text

            def set_text(self, s):
                self.text = s
                store.renpy.restart_interaction()

            def enter(self):
                s = (self.text if self.text is not None else self.get_text()).replace("\\n", "\n")
                t = _ed.get_tab("splash")
                if self.key == "keys":
                    t.set_cell(self.index, self.part, s)
                else:
                    t.set_text(self.key, s)
                self.text = None
                store.renpy.run(self.Disable())
                raise store.renpy.IgnoreEvent()

            def cancel(self):
                self.text = None
                store.renpy.run(self.Disable())

            def commit(self):
                if self.text is not None:
                    try:
                        self.enter()
                    except store.renpy.IgnoreEvent:
                        pass

        _panel_inputs = { }

        def panel_input(key, index=None, part=None):
            k = (key, index, part)
            if k not in _panel_inputs:
                _panel_inputs[k] = PanelTextInput(key, index, part)
            return _panel_inputs[k]

        class PageIdInput(store.InputValue, DictEquality):
            """새 페이지 이름 바꾸기 칸."""
            default = False
            editable = True
            returnable = False

            def __init__(self):
                self.text = None

            def get_text(self):
                if self.text is None:
                    return _ed.get_tab("splash").cur() or ""
                return self.text

            def set_text(self, s):
                self.text = s
                store.renpy.restart_interaction()

            def enter(self):
                if self.text is not None:
                    _ed.get_tab("splash").rename_page(self.text)
                self.text = None
                store.renpy.run(self.Disable())
                raise store.renpy.IgnoreEvent()

            def cancel(self):
                self.text = None
                store.renpy.run(self.Disable())

        page_id_input = PageIdInput()

        ## ── 가운데 화면 ──

        SEL_COLOR = "#ff3b8d"
        BOX_COLOR = "#ffffff55"
        HANDLE = 12         # 손잡이 크기 (픽셀)
        ROT_GAP = 30        # 회전 손잡이가 위쪽 가장자리에서 떨어진 거리
        SNAP = 8            # 가운데 줄에 붙는 거리

        NAMES = {
            "group": "묶음", "image": "로고", "title": "제목", "body": "본문",
            "keys": "표", "prompt": "안내", "option": "보지 않기",
            }

        def _rot_pt(cx, cy, x, y, deg):
            """(cx, cy)를 축으로 (x, y)를 deg도 돌린 자리."""
            r = math.radians(deg)
            dx, dy = x - cx, y - cy
            return (cx + dx * math.cos(r) - dy * math.sin(r), cy + dx * math.sin(r) + dy * math.cos(r))

        def _box(w, h, color, thick):
            w = max(int(w), 2)
            h = max(int(h), 2)
            return store.Fixed(
                Transform(Solid(color), xysize=(w, thick)),
                Transform(Solid(color), xysize=(w, thick), ypos=h - thick),
                Transform(Solid(color), xysize=(thick, h)),
                Transform(Solid(color), xysize=(thick, h), xpos=w - thick),
                xysize=(w, h))

        class SplashEditView(SplashLayout):
            """편집기 가운데 화면: 진짜 페이지 배치 + 고른 것 테두리와 손잡이."""

            def __init__(self, run, tab, flags, **properties):
                super(SplashEditView, self).__init__(run, edit=flags, **properties)
                self.tab = tab
                self.handles = { }      # 이름 -> (x, y) 화면 자리

            def _blit_box(self, rv, cx, cy, w, h, rot, color, thick, width, height):
                d = _box(w, h, color, thick)
                if rot:
                    d = Transform(d, rotate=rot, rotate_pad=False, subpixel=True)
                r = store.renpy.render(d, width, height, 0, 0)
                rw, rh = r.get_size()
                rv.blit(r, (int(round(cx - rw / 2.0)), int(round(cy - rh / 2.0))))

            def _blit_dot(self, rv, x, y, size, color, width, height):
                r = store.renpy.render(Solid(color, xysize=(size, size)), width, height, 0, 0)
                rv.blit(r, (int(round(x - size / 2.0)), int(round(y - size / 2.0))))

            def render(self, width, height, st, at):
                rv = super(SplashEditView, self).render(width, height, st, at)
                tab = self.tab
                self.handles = { }

                ## 옮길 수 있는 것마다 흐린 테두리
                for name, (cx, cy, w, h, rot) in self.rects.items():
                    if name == "group" or name == tab.sel:
                        continue
                    self._blit_box(rv, cx, cy, w + 4, h + 4, rot, BOX_COLOR, 1, width, height)

                sel = tab.sel
                if sel in self.rects and tab.editing is None:
                    cx, cy, w, h, rot = self.rects[sel]
                    pad = 4
                    if sel == "group":
                        self._blit_box(rv, cx, cy, w + 2 * pad, h + 2 * pad, 0, SEL_COLOR + "aa", 2, width, height)
                    else:
                        self._blit_box(rv, cx, cy, w + 2 * pad, h + 2 * pad, rot, SEL_COLOR, 2, width, height)
                        hw, hh = w / 2.0 + pad, h / 2.0 + pad
                        if tab.can_scale(sel):
                            for nm, (sx, sy) in (("nw", (-1, -1)), ("ne", (1, -1)), ("sw", (-1, 1)), ("se", (1, 1))):
                                x, y = _rot_pt(cx, cy, cx + sx * hw, cy + sy * hh, rot)
                                self.handles[nm] = (x, y)
                                self._blit_dot(rv, x, y, HANDLE, SEL_COLOR, width, height)
                                self._blit_dot(rv, x, y, HANDLE - 6, "#ffffff", width, height)
                        if tab.can_rotate(sel):
                            tx, ty = _rot_pt(cx, cy, cx, cy - hh, rot)
                            x, y = _rot_pt(cx, cy, cx, cy - hh - ROT_GAP, rot)
                            self.handles["rot"] = (x, y)
                            ## 손잡이와 테두리를 잇는 선
                            n = 6
                            for i in range(1, n):
                                self._blit_dot(rv, tx + (x - tx) * i / n, ty + (y - ty) * i / n, 2, SEL_COLOR, width, height)
                            self._blit_dot(rv, x, y, 16, SEL_COLOR, width, height)
                            self._blit_dot(rv, x, y, 6, "#ffffff", width, height)

                ## 영상이면 계속 다시 그림
                if _is_movie(self.run.page.image) or _is_movie(self.run.page.background):
                    store.renpy.redraw(self, 0)
                return rv

        ## ── 탭 ──

        class SplashTab(_ed.Tab):

            id = "splash"
            label = "스플래시"
            panel_screen = "ui_editor_splash_panel"
            overlay_screen = "ui_editor_splash_overlay"
            copy_hint = "splash_config.rpy의 그 페이지 { } 안에 붙여넣으세요."

            ## 막대 (이름, 표시, 최소, 최대, 간격, 소수 자리)
            TEXT_ROWS = (
                ("title", "제목", (("title_size", "크기", 10, 160, 1, 0), ("title_rotate", "회전", -180, 180, 1, 0))),
                ("body", "본문", (("body_size", "크기", 10, 80, 1, 0), ("body_line_spacing", "줄 간격", 0, 30, 1, 0), ("body_rotate", "회전", -180, 180, 1, 0))),
                ("prompt", "안내", (("prompt_size", "크기", 8, 60, 1, 0), ("prompt_rotate", "회전", -180, 180, 1, 0))),
                ("dont_show_again", "보지 않기", (("option_size", "크기", 8, 48, 1, 0),)),
                )
            PLACE_ROWS = (
                ("xalign", "가로 (왼쪽 0 ~ 오른쪽 1)", 0.0, 1.0, 0.01, 2),
                ("yalign", "세로 (위 0 ~ 아래 1)", 0.0, 1.0, 0.01, 2),
                ("width", "글 폭 (픽셀)", 200, 1920, 10, 0),
                ("spacing", "그림, 제목, 본문 사이", 0, 120, 1, 0),
                )
            TIME_ROWS = (
                ("fade_in", "나타나는 시간 (초)", 0.0, 3.0, 0.05, 2),
                ("fade_out", "사라지는 시간 (초)", 0.0, 3.0, 0.05, 2),
                ("min_time", "클릭으로 넘기기 전 기다림 (초)", 0.0, 5.0, 0.1, 1),
                )
            ## 넘어가는 때: None 클릭할 때까지 / 숫자 그 초만큼 / "movie" 영상이 끝날 때
            DURATIONS = ((None, "클릭할 때까지"), (3.0, "시간이 지나면"), ("movie", "영상이 끝날 때"))

            ## 값 이름 → 패널에 보이는 이름 (색, 글꼴 고르기 창 제목)
            LABELS = {
                "color": "바탕색", "title_color": "제목 색", "title_font": "제목 글꼴",
                "body_color": "본문 색", "body_font": "본문 글꼴", "prompt_color": "안내 글 색",
                "prompt_font": "안내 글꼴", "option_color": "보지 않기 색",
                }

            ## 글 → 그 글을 그리는 것 이름 / 그 글의 스타일 앞말
            TEXT_ITEM = { "title": "title", "body": "body", "prompt": "prompt", "dont_show_again": "option" }
            TEXT_PREFIX = { "title": "title_", "body": "body_", "prompt": "prompt_", "dont_show_again": "option_" }
            NEW_TEXT = { "title": "제목", "body": "본문", "prompt": "클릭하면 계속합니다", "dont_show_again": "다음부터 보지 않기" }

            def __init__(self):
                self.page = None        # 고른 페이지 id
                self.pick = None        # 그림 고르는 중: "background" 또는 "image"
                self.pick_folder = None
                self.sel = None         # 가운데 화면에서 고른 것 ("group", "title" ...)
                self.editing = None     # 고치는 글: ("title",) / ("key", 줄) / ("desc", 줄)
                self.edit_text = ""
                self.last_click = (0.0, None)
                self.keys_sel = None    # 패널에서 고른 표 줄
                self._run_key = None
                self._run = None
                self._view_key = None
                self._view = None
                self._media = { }

            ## ── 페이지 ──

            def raws(self):
                return page_raws()

            def ids(self):
                return order_ids()

            def cur(self):
                ids = self.ids()
                if self.page in ids:
                    return self.page
                return ids[0] if ids else None

            def raw(self):
                pid = self.cur()
                for r in self.raws():
                    if r["id"] == pid:
                        return r
                return { }

            def set_page(self, pid):
                self.end_edit()
                self.page = pid
                self.pick = None
                self.sel = None
                store.renpy.restart_interaction()

            def available(self):
                if not self.ids() and not config_ids():
                    return (False, "splash.pages에 페이지가 없습니다. (splash_config.rpy)")
                return (True, "")

            def is_new_page(self, pid=None):
                pid = pid or self.cur()
                return pid not in config_ids()

            def _set_order(self, order):
                state.order = list(order)
                store.renpy.restart_interaction()

            def _new_id(self, base="page"):
                taken = set(self.ids()) | set(config_ids()) | set(saved_layout()) | set(state.edits)
                n = 2
                while "{}{}".format(base, n) in taken:
                    n += 1
                return "{}{}".format(base, n)

            def new_page(self):
                pid = self._new_id()
                order = self.ids()
                i = order.index(self.cur()) + 1 if self.cur() in order else len(order)
                order.insert(i, pid)
                state.edits[pid] = { "title": "새 페이지" }
                self._set_order(order)
                self.set_page(pid)
                _ed.msg("새 페이지 '{}'를 만들었습니다. 제목을 더블클릭해서 고치세요.".format(pid))

            def copy_page(self):
                src = self.cur()
                if src is None:
                    return
                pid = self._new_id(src + "_")
                full = merged(self.raw())
                base = merged({ "id": pid }, edits=False)
                state.edits[pid] = { k: v for k, v in full.items() if k != "id" and base.get(k) != v }
                order = self.ids()
                order.insert(order.index(src) + 1, pid)
                self._set_order(order)
                self.set_page(pid)
                _ed.msg("'{}'를 복제해서 '{}'를 만들었습니다.".format(src, pid))

            def delete_page(self):
                pid = self.cur()
                order = self.ids()
                if pid not in order:
                    return
                if len(order) <= 1:
                    _ed.msg("페이지가 하나뿐이라 지울 수 없습니다. 스플래시를 끄려면 splash.enabled = False")
                    return
                i = order.index(pid)
                order.remove(pid)
                if self.is_new_page(pid):
                    state.edits.pop(pid, None)
                    _ed.msg("'{}' 페이지를 지웠습니다.".format(pid))
                else:
                    _ed.msg("'{}' 페이지를 순서에서 뺐습니다. splash_config.rpy의 글은 남고, [되살리기]로 돌아옵니다.".format(pid))
                self._set_order(order)
                self.set_page(order[min(i, len(order) - 1)])

            def move_page(self, step):
                pid = self.cur()
                order = self.ids()
                if pid not in order:
                    return
                i = order.index(pid)
                j = max(0, min(len(order) - 1, i + step))
                if i == j:
                    return
                order[i], order[j] = order[j], order[i]
                self._set_order(order)

            def hidden(self):
                return hidden_config_ids()

            def restore_page(self, pid):
                order = self.ids()
                if pid not in order:
                    order.append(pid)
                    self._set_order(order)
                    self.set_page(pid)

            def rename_page(self, name):
                old = self.cur()
                name = (name or "").strip()
                if not name or name == old:
                    return
                if not self.is_new_page(old):
                    _ed.msg("splash_config.rpy에 있는 페이지 이름은 그 파일에서 바꿉니다.")
                    return
                if old in saved_layout():
                    _ed.msg("저장한 페이지 이름은 바꿀 수 없습니다. 복제해서 새 이름으로 만드세요.")
                    return
                import re
                if not re.match(r"^[A-Za-z_][A-Za-z0-9_]*$", name):
                    _ed.msg("페이지 이름은 영문, 숫자, _만 씁니다. (숫자로 시작하지 않게)")
                    return
                if name in self.ids() or name in config_ids() or name in saved_layout():
                    _ed.msg("'{}'는 이미 있는 이름입니다.".format(name))
                    return
                order = self.ids()
                order[order.index(old)] = name
                if old in state.edits:
                    state.edits[name] = state.edits.pop(old)
                self._set_order(order)
                self.page = name

            ## ── 값 ──

            def base(self, key):
                return merged(self.raw(), edits=False).get(key)

            def val(self, key):
                e = state.edits.get(self.cur(), { })
                return e[key] if key in e else self.base(key)

            def put(self, key, value):
                pid = self.cur()
                if pid is None:
                    return
                e = state.edits.setdefault(pid, { })
                if value == self.base(key) and not self.is_new_page(pid):
                    e.pop(key, None)
                    if not e:
                        state.edits.pop(pid, None)
                else:
                    e[key] = value
                store.renpy.restart_interaction()

            def toggle(self, key):
                if key == "skippable" and self.val("skippable") and self.val("duration") is None:
                    _ed.msg("'클릭할 때까지' 넘어가는 페이지는 클릭으로 넘기기를 끌 수 없습니다. 넘어가는 때를 먼저 바꾸세요.")
                    return
                self.put(key, not self.val(key))

            def num(self, key, digits):
                v = self.val(key)
                if v is None:
                    v = 0
                try:
                    v = float(v)
                except Exception:
                    return str(v)
                return "{:.0f}".format(v) if digits == 0 else ("{:." + str(digits) + "f}").format(v)

            def edited(self, key):
                return key in state.edits.get(self.cur(), { })

            def has(self, key):
                return bool(self.val(key))

            ## 글: 편집기로 고친 글인지 (저장 안 한 것 + splash_layout.rpy에 있는 것)
            def text_from_editor(self, key):
                pid = self.cur()
                if self.is_new_page(pid):
                    return False
                if key in state.edits.get(pid, { }):
                    return True
                return key in saved_layout().get(pid, { }) and key not in state.drops.get(pid, ( ))

            def revert_text(self, key):
                """설정 파일 글로 되돌리기."""
                pid = self.cur()
                state.edits.get(pid, { }).pop(key, None)
                if key in saved_layout().get(pid, { }):
                    state.drops.setdefault(pid, set()).add(key)
                store.renpy.restart_interaction()

            def set_text(self, key, s):
                s = s if s.strip() else None
                if key == "dont_show_again" and s is None:
                    self.put(key, None)
                else:
                    self.put(key, s)
                if s is None and self.sel == self.TEXT_ITEM.get(key):
                    self.sel = None

            def add_text(self, key):
                self.put(key, self.NEW_TEXT[key])
                self.sel = self.TEXT_ITEM[key]
                self.start_edit((key,))

            ## 표
            def key_rows(self):
                k = self.val("keys")
                if k == "auto" or not isinstance(k, (list, tuple)):
                    return [ ]
                return [ (r[0], r[1]) for r in k ]

            def keys_auto(self):
                return self.val("keys") == "auto"

            def keys_to_manual(self):
                self.put("keys", [ (a, b) for a, b in _keys_auto() ])
                _ed.msg("조작방법 화면 목록을 복사해 넣었습니다. 이제 칸마다 고칠 수 있습니다.")

            def set_cell(self, index, part, s):
                rows = [ list(r) for r in self.key_rows() ]
                if index is None or index >= len(rows):
                    return
                rows[index][part] = s
                if not rows[index][0].strip() and not rows[index][1].strip():
                    del rows[index]
                self.put("keys", [ tuple(r) for r in rows ])

            def add_row(self):
                rows = self.key_rows()
                i = (self.keys_sel + 1) if self.keys_sel is not None and self.keys_sel < len(rows) else len(rows)
                rows.insert(i, ("키", "설명"))
                self.keys_sel = i
                self.put("keys", rows)

            def del_row(self):
                rows = self.key_rows()
                if self.keys_sel is None or self.keys_sel >= len(rows):
                    return
                del rows[self.keys_sel]
                self.keys_sel = None
                self.put("keys", rows if rows else None)

            def move_row(self, step):
                rows = self.key_rows()
                i = self.keys_sel
                if i is None or i >= len(rows):
                    return
                j = max(0, min(len(rows) - 1, i + step))
                rows[i], rows[j] = rows[j], rows[i]
                self.keys_sel = j
                self.put("keys", rows)

            def add_keys(self):
                self.put("keys", [ ("키", "설명") ])
                self.keys_sel = 0

            ## 넘어가는 때
            def duration_kind(self):
                d = self.val("duration")
                if d is None or d == "movie":
                    return d
                return 3.0

            def set_duration(self, kind):
                ## 엔진 check()가 막는 조합은 고르지 않게 (막으면 게임을 켤 때 멈춤)
                if kind == "movie" and not (_is_movie(self.val("image")) or _is_movie(self.val("background"))):
                    _ed.msg("바탕이나 로고가 영상(.webm 등)일 때만 '영상이 끝날 때'를 고를 수 있습니다.")
                    return
                if kind is None and not self.val("skippable"):
                    _ed.msg("클릭으로 넘기기가 '안 됨'이면 '클릭할 때까지'는 고를 수 없습니다.")
                    return
                if kind == 3.0:
                    d = self.val("duration")
                    self.put("duration", d if isinstance(d, (int, float)) else 3.0)
                else:
                    self.put("duration", kind)

            ## 색·글꼴 고르기 창 (UI Kit)
            def get_value(self, key):
                v = self.val(key)
                return v if isinstance(v, str) else None

            def set_value(self, key, value):
                self.put(key, value)

            def value_label(self, key):
                return self.LABELS.get(key, key)

            ## ── 그림 고르기 (바탕, 로고) ──

            def open_pick(self, key):
                self.pick = None if self.pick == key else key
                if self.pick and self.pick_folder is None:
                    cur = self.val(key)
                    if isinstance(cur, str) and "/" in cur and not cur.startswith("#"):
                        self.pick_folder = os.path.dirname(cur)
                store.renpy.restart_interaction()

            def _files(self):
                uk = getattr(store, "ui_kit", None)
                exts = IMAGE_EXTS + MOVIE_EXTS
                if uk is not None and hasattr(uk, "game_files"):
                    return list(uk.game_files(exts))
                return sorted(f for f in store.renpy.list_files() if f.lower().endswith(exts))

            def folders(self):
                seen = { }
                for f in self._files():
                    d = os.path.dirname(f)
                    seen[d] = seen.get(d, 0) + 1
                return sorted(seen, key=lambda d: (d.startswith("gui"), d))

            def pick_files(self):
                fs = self.folders()
                folder = self.pick_folder if self.pick_folder in fs else (fs[0] if fs else None)
                return [ f for f in self._files() if os.path.dirname(f) == folder ][:80]

            def cur_folder(self):
                fs = self.folders()
                return self.pick_folder if self.pick_folder in fs else (fs[0] if fs else None)

            def set_folder(self, d):
                self.pick_folder = d
                store.renpy.restart_interaction()

            def choose(self, path):
                if self.pick:
                    self.put(self.pick, path)
                    ## 영상을 빼서 '영상이 끝날 때'가 안 맞게 되면 클릭할 때까지로
                    if self.val("duration") == "movie" and not (_is_movie(self.val("image")) or _is_movie(self.val("background"))):
                        self.put("duration", None if self.val("skippable") else 3.0)
                self.pick = None
                store.renpy.restart_interaction()

            def clear_media(self, key):
                self.pick, old = key, self.pick
                self.choose(None)
                self.pick = None if old == key else old

            def thumb(self, path):
                if path.lower().endswith(MOVIE_EXTS):
                    return None
                return store.Transform(path, fit="contain", xysize=(72, 54))

            def media_label(self, key):
                v = self.val(key)
                if not v:
                    return "(없음)"
                return str(v)

            ## ── 가운데 화면 ──

            def flags(self):
                hide = set()
                if self.editing is not None:
                    k = self.editing[0]
                    if k in self.TEXT_ITEM:
                        hide.add(self.TEXT_ITEM[k])
                return { "hide": hide, "straight": set() }

            def view(self):
                """가운데 화면에 그릴 것. 값이 바뀔 때만 새로 만듭니다(영상은 이어서 돎)."""
                raw = self.raw()
                if not raw:
                    return Solid("#000000")
                d = merged(raw)
                key = (raw.get("id"), repr(sorted((k, repr(v)) for k, v in d.items())))
                if key != self._run_key:
                    p = resolve(raw)
                    p.duration = None           # 편집 중에는 영상을 반복
                    self._run = PageRun(p, skip_min=True, media_cache=self._media)
                    self._run_key = key
                    self._view_key = None
                fl = self.flags()
                vkey = (self._run_key, frozenset(fl["hide"]), self.sel, self.editing)
                if vkey != self._view_key:
                    self._view = SplashEditView(self._run, self, fl)
                    self._view_key = vkey
                return self._view

            def background(self):
                """가운데 화면 바탕 (바탕색과 바탕 그림/영상)."""
                run = self._run
                if run is None:
                    return None
                return run.bg

            def rects(self):
                return self._view.rects if self._view is not None else { }

            def cells(self):
                return self._view.cells if self._view is not None else { }

            ## 무엇을 옮기고 돌리고 늘릴 수 있는지
            def can_rotate(self, name):
                return name in ROTATE_ITEMS

            def can_scale(self, name):
                return name in ("image", "title", "body", "keys", "prompt", "option")

            def _hit(self, name, x, y, pad=4):
                r = self.rects().get(name)
                if r is None:
                    return False
                cx, cy, w, h, rot = r
                lx, ly = _rot_pt(cx, cy, x, y, -rot) if rot else (x, y)
                return abs(lx - cx) <= w / 2.0 + pad and abs(ly - cy) <= h / 2.0 + pad

            def hit_item(self, x, y):
                """(x, y)에 있는 것 이름. 위에 그린 것부터."""
                for name in ("option", "prompt", "keys", "body", "title", "image"):
                    if self._hit(name, x, y):
                        return name
                return "group"

            def hit_cell(self, x, y):
                for k, (cx, cy, w, h) in self.cells().items():
                    if cx - 2 <= x <= cx + w + 2 and cy - 2 <= y <= cy + h + 2:
                        return k
                return None

            def hit_handle(self, x, y):
                v = self._view
                if v is None:
                    return None
                for nm, (hx, hy) in v.handles.items():
                    if abs(x - hx) <= HANDLE and abs(y - hy) <= HANDLE:
                        return nm
                return None

            ## 끌기 시작할 때의 값 (끄는 동안은 이 값 + 움직인 거리)
            def _pos_now(self, name):
                if name == "group":
                    return (float(self.val("xalign")), float(self.val("yalign")))
                if name == "image" and self.val("image_pos") is not None:
                    x, y = self.val("image_pos")
                    return (float(x), float(y))
                if name in GROUP_ITEMS:
                    v = self.val(name + "_offset")
                    return (float(v[0]), float(v[1])) if v else (0.0, 0.0)
                if name == "prompt":
                    return (float(self.val("prompt_xalign")), float(self.val("prompt_yalign")))
                if name == "option":
                    return (float(self.val("option_xalign")), float(self.val("option_yalign")))
                return (0.0, 0.0)

            def _span(self, name):
                """xalign 값 1이 몇 픽셀인지 (화면 - 그것의 크기)."""
                W, H = store.config.screen_width, store.config.screen_height
                r = self.rects().get(name)
                w, h = (r[2], r[3]) if r else (0, 0)
                return (max(1.0, W - w), max(1.0, H - h))

            def _set_pos(self, name, start, dx, dy, snap=True):
                W, H = store.config.screen_width, store.config.screen_height
                if name == "group" or name in ("prompt", "option"):
                    sw, sh = self._span(name)
                    x = start[0] + dx / sw
                    y = start[1] + dy / sh
                    if snap:
                        if abs((x - 0.5) * sw) < SNAP:
                            x = 0.5
                        if abs((y - 0.5) * sh) < SNAP:
                            y = 0.5
                    x = max(0.0, min(1.0, x))
                    y = max(0.0, min(1.0, y))
                    if name == "group":
                        self.put("xalign", round(x, 3))
                        self.put("yalign", round(y, 3))
                    else:
                        self.put(name + "_xalign", round(x, 3))
                        self.put(name + "_yalign", round(y, 3))
                    return
                x = start[0] + dx
                y = start[1] + dy
                if name == "image" and self.val("image_pos") is not None:
                    if snap and abs(x - W / 2.0) < SNAP:
                        x = W / 2.0
                    x = max(0, min(W, x))
                    y = max(0, min(H, y))
                    self.put("image_pos", (int(round(x)), int(round(y))))
                    return
                ## 묶음 안 것: 가운데가 화면 가운데 줄이나 묶음 가운데 줄에 붙음
                r = self.rects().get(name)
                if snap and r is not None:
                    cx0 = r[0] - self._pos_now(name)[0]     # 비키기 전 가운데
                    cy0 = r[1] - self._pos_now(name)[1]
                    g = self.rects().get("group")
                    for line in (W / 2.0, g[0] if g else None):
                        if line is not None and abs(cx0 + x - line) < SNAP:
                            x = line - cx0
                            break
                    if abs(cy0 + y - H / 2.0) < SNAP:
                        y = H / 2.0 - cy0
                    ## 가운데가 화면 밖으로 나가지 않게
                    x = max(-cx0, min(W - cx0, x))
                    y = max(-cy0, min(H - cy0, y))
                x, y = int(round(x)), int(round(y))
                self.put(name + "_offset", None if (x, y) == (0, 0) else (x, y))

            ## 크기 값 (늘리기 손잡이, 휠, S/W)
            SIZE_KEYS = {
                "title": ("title_size",),
                "body": ("body_size", "body_line_spacing"),
                "keys": ("key_size", "desc_size", "key_width"),
                "prompt": ("prompt_size",),
                "option": ("option_size",),
                }

            def _size_now(self, name):
                if name == "image":
                    return { "image_zoom": float(self.val("image_zoom") or 1.0) }
                return { k: self.val(k) for k in self.SIZE_KEYS.get(name, ( )) }

            def _set_scale(self, name, start, f):
                f = max(0.05, f)
                for k, v in start.items():
                    if v is None:
                        continue
                    if k == "image_zoom":
                        self.put(k, round(max(0.05, min(10.0, v * f)), 3))
                    elif k == "body_line_spacing":
                        self.put(k, max(0, int(round(v * f))))
                    else:
                        self.put(k, max(4, int(round(v * f))))

            def _step_size(self, name, amount):
                cur = self._size_now(name)
                if not cur:
                    return
                if name == "image":
                    self._set_scale(name, cur, 1.0 + amount * 0.02)
                    return
                main = list(cur.values())[0] or 1
                self._set_scale(name, cur, (main + amount) / float(main))

            def _set_rotate(self, name, deg):
                deg = ((deg + 180.0) % 360.0) - 180.0
                self.put(name + "_rotate", None if abs(deg) < 0.05 else round(deg, 1))

            ## ── 마우스 (편집기 공통 틀이 부름) ──

            def drag_begin(self, x, y):
                if self.editing is not None:
                    self.commit_edit()

                h = self.hit_handle(x, y) if self.sel else None
                if h == "rot":
                    return ("rot", self.sel)
                if h is not None:
                    r = self.rects().get(self.sel)
                    if r is None:
                        return None
                    d0 = max(4.0, math.hypot(x - r[0], y - r[1]))
                    return ("scale", self.sel, d0, self._size_now(self.sel), (r[0], r[1]))

                name = self.hit_item(x, y)

                ## 더블클릭: 글 고치기
                now = _time.time()
                last_t, last_name = self.last_click
                self.last_click = (now, name)
                if now - last_t < 0.35 and last_name == name:
                    if self.start_edit_at(name, x, y):
                        return None

                if name != self.sel:
                    self.sel = name
                    if name == "keys":
                        c = self.hit_cell(x, y)
                        self.keys_sel = c[1] if c else self.keys_sel
                store.renpy.restart_interaction()
                return ("move", name, self._pos_now(name))

            def drag_move(self, token, dx, dy):
                mods = pygame.key.get_mods()
                if token[0] == "move":
                    self._set_pos(token[1], token[2], dx, dy, snap=not (mods & pygame.KMOD_ALT))
                elif token[0] == "scale":
                    _k, name, d0, start, (cx, cy) = token
                    mx, my = store.renpy.get_mouse_pos()
                    self._set_scale(name, start, math.hypot(mx - cx, my - cy) / d0)
                elif token[0] == "rot":
                    name = token[1]
                    r = self.rects().get(name)
                    if r is None:
                        return
                    mx, my = store.renpy.get_mouse_pos()
                    if abs(mx - r[0]) + abs(my - r[1]) < 4:
                        return
                    deg = math.degrees(math.atan2(mx - r[0], -(my - r[1])))
                    if mods & pygame.KMOD_SHIFT:
                        deg = round(deg / 15.0) * 15.0
                    self._set_rotate(name, deg)

            def drag_end(self, token):
                store.renpy.restart_interaction()

            def wheel(self, sign, shift):
                if self.sel and self.can_scale(self.sel):
                    self._step_size(self.sel, -sign * (5 if shift else 1))

            def move(self, dx, dy):
                if self.sel is None:
                    return
                self._set_pos(self.sel, self._pos_now(self.sel), dx, dy, snap=False)

            def nudge(self, what, amount):
                if self.sel is None:
                    return
                if what == "rotate" and self.can_rotate(self.sel):
                    self._set_rotate(self.sel, float(self.val(self.sel + "_rotate") or 0.0) + amount)
                elif what in ("size", "zoom") and self.can_scale(self.sel):
                    self._step_size(self.sel, amount if what == "size" else amount * 50)

            def select(self, step):
                names = [ n for n in ("group", "image", "title", "body", "keys", "prompt", "option") if n in self.rects() ]
                if not names:
                    return
                i = names.index(self.sel) if self.sel in names else -1
                self.sel = names[(i + step) % len(names)]

            def key(self, k, shift):
                if k in (pygame.K_RETURN, pygame.K_KP_ENTER, pygame.K_F2) and self.sel:
                    r = self.rects().get(self.sel)
                    if r is not None:
                        self.start_edit_at(self.sel, r[0], r[1])
                    return True
                return False

            def reset_item(self):
                """Backspace / [자리 되돌리기]: 고른 것의 자리·회전·크기만 되돌림. 고른 게 없으면 페이지 전체."""
                name = self.sel
                if name is None:
                    state.edits.pop(self.cur(), None)
                    _ed.msg("이 페이지의 저장 안 한 변경을 되돌렸습니다.")
                    return
                e = state.edits.get(self.cur(), { })
                keys = [ ]
                if name == "group":
                    keys = [ "xalign", "yalign" ]
                elif name in ("prompt", "option"):
                    keys = [ name + "_xalign", name + "_yalign", name + "_rotate" ] + list(self.SIZE_KEYS.get(name, ( )))
                else:
                    keys = [ name + "_offset", name + "_rotate" ] + list(self._size_now(name))
                    if name == "image":
                        keys.append("image_pos")
                for k in keys:
                    if k in e:
                        e.pop(k)
                    elif k in saved_layout().get(self.cur(), { }):
                        state.drops.setdefault(self.cur(), set()).add(k)
                if not e:
                    state.edits.pop(self.cur(), None)
                _ed.msg("{}의 자리를 되돌렸습니다. (저장하면 splash_layout.rpy에서도 빠짐)".format(NAMES.get(name, name)))
                store.renpy.restart_interaction()

            def focus_rect(self):
                r = self.rects().get(self.sel or "group")
                if r is None:
                    return None
                cx, cy, w, h, _rot = r
                return (cx - w / 2.0, cy - h / 2.0, w, h)

            ## ── 글 고치기 ──

            def start_edit_at(self, name, x, y):
                """name을 더블클릭했을 때. 글이면 고치기 시작하고 True."""
                for key, item in self.TEXT_ITEM.items():
                    if item == name and self.val(key):
                        self.sel = name
                        return self.start_edit((key,))
                if name == "keys":
                    if self.keys_auto():
                        _ed.msg("이 표는 조작방법 화면의 목록을 그대로 씁니다(\"auto\"). 패널의 [직접 적기로 바꾸기]를 누르면 고칠 수 있습니다.")
                        return True
                    if self.val("keys_rotate"):
                        _ed.msg("돌린 표는 패널의 글 칸에서 고칩니다. (또는 회전을 0으로)")
                        return True
                    c = self.hit_cell(x, y)
                    if c is not None:
                        self.sel = "keys"
                        self.keys_sel = c[1]
                        return self.start_edit(c)
                return False

            def start_edit(self, what):
                if what[0] in ("key", "desc"):
                    rows = self.key_rows()
                    if what[1] >= len(rows):
                        return False
                    self.edit_text = rows[what[1]][0 if what[0] == "key" else 1] or ""
                else:
                    self.edit_text = self.val(what[0]) or ""
                self.editing = what
                store.renpy.restart_interaction()
                return True

            def commit_edit(self):
                what = self.editing
                if what is None:
                    return
                self.editing = None
                s = self.edit_text
                if what[0] in ("key", "desc"):
                    self.set_cell(what[1], 0 if what[0] == "key" else 1, s)
                else:
                    self.set_text(what[0], s)
                store.renpy.restart_interaction()

            def cancel_edit(self):
                self.editing = None
                store.renpy.restart_interaction()

            def end_edit(self):
                if self.editing is not None:
                    self.commit_edit()

            def on_close(self):
                self.end_edit()

            def edit_box(self):
                """입력 칸의 (가운데 x, 가운데 y, 폭, 높이)와 글자 모양."""
                what = self.editing
                if what is None:
                    return None
                p = self._run.page if self._run is not None else None
                if p is None:
                    return None
                if what[0] in ("key", "desc"):
                    c = self.cells().get(what)
                    if c is None:
                        return None
                    x, y, w, h = c
                    props = p.key_props if what[0] == "key" else p.desc_props
                    return (x + w / 2.0, y + h / 2.0, w, h, props, False)
                name = self.TEXT_ITEM[what[0]]
                r = self.rects().get(name)
                if r is None:
                    return None
                props = { "title": p.title_props, "body": p.body_props, "prompt": p.prompt_props, "option": p.option_text }[name]
                return (r[0], r[1], r[2], r[3], props, True)

            def input_props(self, props):
                keep = ("font", "size", "color", "bold", "italic", "kerning", "outlines", "line_spacing", "text_align", "antialias")
                return { k: v for k, v in props.items() if k in keep }

            ## ── 보기 ──

            def show_page(self):
                self.end_edit()
                pid = self.cur()
                if pid is not None:
                    ShowPage(pid)()

            def show_all(self):
                self.end_edit()
                preview()

            ## ── 되돌리기, 저장 ──

            def discard(self):
                self.editing = None
                state.edits = { }
                state.order = None
                state.drops = { }
                store.renpy.restart_interaction()

            def order_changed(self):
                if state.order is None:
                    return False
                return list(state.order) != order_ids(edits=False)

            def pending(self):
                n = sum(len(e) for e in state.edits.values())
                n += sum(len(d) for d in state.drops.values())
                return n + (1 if self.order_changed() else 0)

            def _merged_layout(self):
                keep = set(config_ids()) | set(order_ids())
                lay = { }
                for pid, d in saved_layout().items():
                    drops = state.drops.get(pid, ( ))
                    lay[pid] = { k: v for k, v in d.items() if k not in drops }
                for pid, e in state.edits.items():
                    lay.setdefault(pid, { }).update(e)
                ## 새 페이지는 값이 없어도 남김 (순서에 적힌 이름이 어디에도 없으면 Lint 오류)
                news = set(order_ids()) - set(config_ids())
                for pid in news:
                    lay.setdefault(pid, { })
                return { pid : d for pid, d in lay.items() if (d or pid in news) and pid in keep }

            def _order_to_save(self):
                order = order_ids()
                if order == config_ids() and saved_order() is None:
                    return None
                return order

            def file_path(self, filename):
                return root_path(filename)

            def layout_file(self):
                self.end_edit()
                lay = self._merged_layout()
                order = self._order_to_save()
                header = getattr(getattr(store, "ui_kit", None), "file_header", None)
                notes = [
                    "여기 적힌 값은 splash_config.rpy의 같은 페이지 값보다 우선합니다.",
                    "글은 _(\"…\")로 적어서 번역 목록에 잡힙니다.",
                    "이 파일을 지우면 설정 파일 값과 순서로 돌아갑니다.",
                    ]
                if header is not None:
                    lines = header("GUI 편집기가 저장한 스플래시 페이지 값입니다.", notes)
                else:
                    lines = [ "## GUI 편집기가 저장한 스플래시 페이지 값입니다. (자동 생성)", "" ]
                if order is not None:
                    lines.append("## 페이지 순서. 여기 없는 splash_config.rpy의 페이지는 보여 주지 않습니다.")
                    lines.append("define splash.page_order = [ " + ", ".join(json.dumps(pid) for pid in order) + " ]")
                    lines.append("")
                lines.append("define splash.layout = {")
                ids = order_ids()
                for pid in ids + sorted(p for p in lay if p not in ids):
                    if pid not in lay:
                        continue
                    lines.append('    "{}": {{'.format(pid))
                    for k in sorted(lay[pid]):
                        lines.append('        "{}": {},'.format(k, fmt_value(k, lay[pid][k])))
                    lines.append("    },")
                lines.append("}")
                lines.append("")
                return ("splash_layout.rpy", "\n".join(lines))

            def after_save(self):
                ## store 변수(splash.layout)가 아니라 실행 중 값으로 (다시 불러올 때 옛 값이 덮지 않게)
                state.saved = store.python_dict(self._merged_layout())
                state.saved_order = self._order_to_save()
                state.order_saved = True
                state.edits = { }
                state.order = None
                state.drops = { }
                return False

            def copy_text(self):
                d = dict(state.edits.get(self.cur(), { }))
                if not d:
                    return None
                lines = [ "# splash_config.rpy의 '{}' 페이지에 붙여넣기".format(self.cur()) ]
                for k in sorted(d):
                    lines.append('"{}": {},'.format(k, fmt_value(k, d[k])))
                return "\n".join(lines)

            def info_lines(self):
                ids = self.ids()
                pid = self.cur()
                n = len(state.edits.get(pid, { }))
                rv = [ "페이지 {}/{}: {}{}".format(ids.index(pid) + 1 if pid in ids else 0, len(ids), pid,
                        " (새 페이지)" if self.is_new_page(pid) else "") ]
                if self.sel:
                    rv.append("고른 것: " + NAMES.get(self.sel, self.sel))
                total = self.pending()
                rv.append("저장 안 한 변경: 이 페이지 {}개, 전체 {}개".format(n, total) if total else "저장 안 한 변경 없음")
                return rv

            def help_lines(self):
                return [
                    "누르면 고르고 끌면 옮김. 빈 곳을 끌면 묶음. 모서리 손잡이 크기, 분홍 손잡이 회전(Shift 15도씩)",
                    "글은 더블클릭이나 Enter로 그 자리에서 고침 (Shift+Enter 줄바꿈). 저장하면 splash/splash_layout.rpy",
                    ]

            def session(self):
                return dict(page=self.page, sel=self.sel)

            def restore(self, d):
                self.page = d.get("page", self.page)
                self.sel = d.get("sel")

        _ed.register(SplashTab())


## 가운데 화면 (게임 화면 위에 고른 페이지를 그대로)
screen ui_editor_splash_overlay():

    $ _tab = ui_editor.get_tab("splash")
    $ _view = _tab.view()

    if _tab.background() is not None:
        add Solid(_tab.val("color") or "#000000")
        add _tab.background() align (0.5, 0.5)
    else:
        add Solid(_tab.val("color") or "#000000")

    add _view

    ## 고르고 있는 것 이름
    if _tab.sel and _tab.editing is None:
        $ _r = _tab.rects().get(_tab.sel)
        if _r is not None:
            text splash.NAMES.get(_tab.sel, _tab.sel):
                style "ui_editor_small"
                color "#ff3b8d"
                size 13
                pos (int(_r[0] - _r[2] / 2.0), int(_r[1] - _r[3] / 2.0) - 22)

    ## 글 고치는 칸 (그 자리에 같은 글꼴·크기·색)
    $ _eb = _tab.edit_box()
    if _eb is not None:
        $ _cx, _cy, _w, _h, _props, _multi = _eb
        frame:
            style "empty"
            background Solid("#00000088")
            padding (6, 4)
            pos (int(_cx), int(_cy))
            anchor (0.5, 0.5)
            ## 칸이 작은 글(안내, 표 칸)도 넉넉히 보이게 최소 폭과 높이
            xminimum max(int(_w), 420) + 12
            yminimum max(int(_h), 40) + 8
            input:
                value splash.text_input
                multiline True
                xmaximum max(420, int(_w), int(_tab.val("width") or 960))
                properties _tab.input_props(_props)
        add Solid("#ff3b8d", xysize=(int(_w) + 16, 2)) pos (int(_cx), int(_cy + _h / 2.0) + 8) anchor (0.5, 0.0)


## 스플래시 탭 패널 (UI Kit 편집기 안)
screen ui_editor_splash_panel(tab):

    $ _ids = tab.ids()
    $ _cur = tab.cur()

    vbox:
        spacing 6

        hbox:
            spacing 4
            box_wrap True
            box_wrap_spacing 4
            xmaximum 632
            text "페이지:" style "ui_editor_text" yalign 0.5
            for _id in _ids:
                textbutton _id style "ui_editor_tab" action Function(tab.set_page, _id) selected (_cur == _id)

        hbox:
            spacing 4
            box_wrap True
            box_wrap_spacing 4
            xmaximum 632
            textbutton "+ 새 페이지" style "ui_editor_button" text_size 13 action Function(tab.new_page)
            textbutton "복제" style "ui_editor_button" text_size 13 action Function(tab.copy_page)
            textbutton "지우기" style "ui_editor_button" text_size 13 action Function(tab.delete_page) sensitive (len(_ids) > 1)
            textbutton "◀ 앞으로" style "ui_editor_button" text_size 13 action Function(tab.move_page, -1) sensitive (_cur in _ids and _ids.index(_cur) > 0)
            textbutton "뒤로 ▶" style "ui_editor_button" text_size 13 action Function(tab.move_page, 1) sensitive (_cur in _ids and _ids.index(_cur) < len(_ids) - 1)

        if tab.is_new_page():
            hbox:
                spacing 6
                text "페이지 이름" style "ui_editor_text" yalign 0.5 min_width 110
                button:
                    style "ui_editor_button"
                    xsize 200
                    action splash.page_id_input.Toggle()
                    input value splash.page_id_input style "ui_editor_text" length 30 allow "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789_"

        if tab.hidden():
            hbox:
                spacing 4
                box_wrap True
                xmaximum 632
                text "숨긴 페이지:" style "ui_editor_small" yalign 0.5
                for _h in tab.hidden():
                    textbutton ("되살리기 " + _h) style "ui_editor_button" text_size 12 action Function(tab.restore_page, _h)

        hbox:
            spacing 6
            textbutton "이 페이지 보기" style "ui_editor_button" action Function(tab.show_page)
            textbutton "처음부터 보기" style "ui_editor_button" action Function(tab.show_all)

        ## 고른 것
        hbox:
            spacing 6
            text ("고른 것: " + splash.NAMES.get(tab.sel, "없음 (화면을 누르세요)")) style "ui_editor_text" yalign 0.5
            textbutton "자리 되돌리기" style "ui_editor_button" text_size 13 action Function(tab.reset_item) sensitive (tab.sel is not None)

        ## 바탕
        hbox:
            spacing 6
            text "바탕색" style "ui_editor_text" yalign 0.5 min_width 110
            button:
                style "ui_editor_button"
                action Function(ui_editor.open_popup, "color", "color")
                hbox:
                    spacing 4
                    add Solid(tab.get_value("color") or "#000000", xysize=(16, 16)) yalign 0.5
                    text (tab.get_value("color") or "#000000") style "ui_editor_button_text" size 13 yalign 0.5

        for _key, _label in (("background", "바탕 그림/영상"), ("image", "로고 그림/영상")):
            hbox:
                spacing 6
                text _label style "ui_editor_text" yalign 0.5 min_width 110
                text tab.media_label(_key) style "ui_editor_small" yalign 0.5 xmaximum 260
                textbutton ("고르기 닫기" if tab.pick == _key else "고르기") style "ui_editor_button" text_size 13 action Function(tab.open_pick, _key) selected (tab.pick == _key)
                textbutton "없음" style "ui_editor_button" text_size 13 action Function(tab.clear_media, _key) sensitive tab.has(_key)

            if tab.pick == _key:
                use ui_editor_splash_picker(tab)

        if tab.has("image"):
            hbox:
                spacing 6
                text "로고 확대" style "ui_editor_text" yalign 0.5 min_width 110
                bar value splash.SplashBarValue("image_zoom", 0.1, 3.0, 0.05, 2) xsize 180 yalign 0.5
                text ("{:.2f}".format(float(tab.val("image_zoom") or 1.0))) style "ui_editor_small" yalign 0.5
            hbox:
                spacing 6
                text "  회전" style "ui_editor_small" yalign 0.5 min_width 110
                bar value splash.SplashBarValue("image_rotate", -180, 180, 1, 0) xsize 180 yalign 0.5
                text tab.num("image_rotate", 0) style "ui_editor_small" yalign 0.5

        ## 글
        for _what, _label, _rows in tab.TEXT_ROWS:
            if tab.has(_what):
                hbox:
                    spacing 6
                    text _label style "ui_editor_text" yalign 0.5 min_width 110
                    if tab.text_from_editor(_what):
                        textbutton "설정 파일 글로" style "ui_editor_button" text_size 12 action Function(tab.revert_text, _what)
                ## 글 칸: 패널 폭 가득, 긴 글은 칸 안에서 줄을 바꿔 다 보임
                button:
                    style "ui_editor_button"
                    xsize 620
                    yminimum 78
                    action splash.panel_input(_what).Toggle()
                    input value splash.panel_input(_what) style "ui_editor_text" size 16 length 1000 xmaximum 596
                hbox:
                    spacing 6
                    text ("  편집기 글" if tab.text_from_editor(_what) else "  ") style "ui_editor_small" yalign 0.5 min_width 110
                    $ _pre = tab.TEXT_PREFIX[_what]
                    button:
                        style "ui_editor_button"
                        action Function(ui_editor.open_popup, "color", _pre + "color")
                        hbox:
                            spacing 4
                            add Solid(tab.get_value(_pre + "color") or "#ffffff", xysize=(16, 16)) yalign 0.5
                            text (tab.get_value(_pre + "color") or "(기본)") style "ui_editor_button_text" size 13 yalign 0.5
                    if _what != "dont_show_again":
                        textbutton (ui_editor.short_path(tab.get_value(_pre + "font")) if tab.get_value(_pre + "font") else "글꼴 (기본)") style "ui_editor_button" text_size 13 action Function(ui_editor.open_popup, "font", _pre + "font")
                for _k, _l, _lo, _hi, _st, _dg in _rows:
                    hbox:
                        spacing 6
                        text ("  " + _l) style "ui_editor_small" yalign 0.5 min_width 110
                        bar value splash.SplashBarValue(_k, _lo, _hi, _st, _dg) xsize 180 yalign 0.5
                        text tab.num(_k, _dg) style "ui_editor_small" yalign 0.5

        hbox:
            spacing 4
            box_wrap True
            xmaximum 632
            for _what, _label, _rows in tab.TEXT_ROWS:
                if not tab.has(_what):
                    textbutton (_label + " 넣기") style "ui_editor_button" text_size 13 action Function(tab.add_text, _what)
            if tab.val("keys") is None:
                textbutton "조작 방법 표 넣기" style "ui_editor_button" text_size 13 action Function(tab.add_keys)

        ## 조작 방법 표
        if tab.val("keys") is not None:
            text "조작 방법 표" style "ui_editor_text"
            if tab.keys_auto():
                hbox:
                    spacing 6
                    text "  조작방법 화면 목록을 그대로 씀 (\"auto\")" style "ui_editor_small" yalign 0.5
                    textbutton "직접 적기로 바꾸기" style "ui_editor_button" text_size 13 action Function(tab.keys_to_manual)
            else:
                for _i in range(len(tab.key_rows())):
                    hbox:
                        spacing 4
                        textbutton str(_i + 1) style "ui_editor_button" text_size 12 action SetField(tab, "keys_sel", _i) selected (tab.keys_sel == _i)
                        button:
                            style "ui_editor_button"
                            xsize 210
                            yminimum 36
                            action splash.panel_input("keys", _i, 0).Toggle()
                            input value splash.panel_input("keys", _i, 0) style "ui_editor_text" size 15 length 200 xmaximum 190
                        button:
                            style "ui_editor_button"
                            xsize 370
                            yminimum 36
                            action splash.panel_input("keys", _i, 1).Toggle()
                            input value splash.panel_input("keys", _i, 1) style "ui_editor_text" size 15 length 300 xmaximum 350
                hbox:
                    spacing 4
                    textbutton "줄 더하기" style "ui_editor_button" text_size 13 action Function(tab.add_row)
                    textbutton "줄 지우기" style "ui_editor_button" text_size 13 action Function(tab.del_row) sensitive (tab.keys_sel is not None)
                    textbutton "위로" style "ui_editor_button" text_size 13 action Function(tab.move_row, -1) sensitive (tab.keys_sel is not None)
                    textbutton "아래로" style "ui_editor_button" text_size 13 action Function(tab.move_row, 1) sensitive (tab.keys_sel is not None)
            hbox:
                spacing 6
                text "  회전" style "ui_editor_small" yalign 0.5 min_width 110
                bar value splash.SplashBarValue("keys_rotate", -180, 180, 1, 0) xsize 180 yalign 0.5
                text tab.num("keys_rotate", 0) style "ui_editor_small" yalign 0.5

        ## 위치
        text "위치 (그림, 제목, 본문 묶음)" style "ui_editor_text"
        for _k, _l, _lo, _hi, _st, _dg in tab.PLACE_ROWS:
            hbox:
                spacing 6
                text ("  " + _l) style "ui_editor_small" yalign 0.5 min_width 180
                bar value splash.SplashBarValue(_k, _lo, _hi, _st, _dg) xsize 200 yalign 0.5
                text tab.num(_k, _dg) style "ui_editor_small" yalign 0.5

        ## 넘어가는 때
        hbox:
            spacing 4
            box_wrap True
            xmaximum 632
            text "넘어가는 때" style "ui_editor_text" yalign 0.5 min_width 110
            $ _dk = tab.duration_kind()
            for _v, _l in tab.DURATIONS:
                textbutton _l style "ui_editor_button" text_size 13 action Function(tab.set_duration, _v) selected (_dk == _v)
        if tab.duration_kind() == 3.0:
            hbox:
                spacing 6
                text "  보여 주는 시간 (초)" style "ui_editor_small" yalign 0.5 min_width 180
                bar value splash.SplashBarValue("duration", 0.5, 15.0, 0.1, 1) xsize 200 yalign 0.5
                text tab.num("duration", 1) style "ui_editor_small" yalign 0.5

        for _k, _l, _lo, _hi, _st, _dg in tab.TIME_ROWS:
            hbox:
                spacing 6
                text ("  " + _l) style "ui_editor_small" yalign 0.5 min_width 180
                bar value splash.SplashBarValue(_k, _lo, _hi, _st, _dg) xsize 200 yalign 0.5
                text tab.num(_k, _dg) style "ui_editor_small" yalign 0.5

        hbox:
            spacing 6
            text "클릭으로 넘기기" style "ui_editor_text" yalign 0.5 min_width 110
            textbutton ("됨" if tab.val("skippable") else "안 됨") style "ui_editor_button" text_size 13 action Function(tab.toggle, "skippable") selected bool(tab.val("skippable"))
            text "처음 한 번만" style "ui_editor_text" yalign 0.5
            textbutton ("켬" if tab.val("once") else "끔") style "ui_editor_button" text_size 13 action Function(tab.toggle, "once") selected bool(tab.val("once"))

        hbox:
            spacing 6
            textbutton "모두 버리기" style "ui_editor_button" action Function(tab.discard)


## 바탕·로고 그림 고르기 (패널 안에 펼침)
screen ui_editor_splash_picker(tab):
    $ _cf = tab.cur_folder()
    frame:
        style "empty"
        background "#ffffff10"
        padding (8, 6)
        xmaximum 630
        vbox:
            spacing 4
            hbox:
                spacing 4
                box_wrap True
                box_wrap_spacing 4
                xmaximum 610
                for _d in tab.folders():
                    textbutton (_d or "game") style "ui_editor_button" text_size 12 action Function(tab.set_folder, _d) selected (_cf == _d)
            vpgrid:
                cols 6
                spacing 4
                allow_underfull True
                for _f in tab.pick_files():
                    button:
                        style "ui_editor_button"
                        xsize 96
                        ysize 82
                        action Function(tab.choose, _f)
                        selected (tab.val(tab.pick) == _f)
                        vbox:
                            xalign 0.5
                            $ _t = tab.thumb(_f)
                            if _t is not None:
                                add _t xalign 0.5
                            else:
                                text "영상" style "ui_editor_small" xalign 0.5
                            text _f.split("/")[-1] style "ui_editor_small" size 11 xalign 0.5
