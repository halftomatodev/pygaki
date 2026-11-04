################################################################################
## UI Kit — 편집기 (본체)
##
## 개발 모드(런처에서 실행)일 때 Shift+M으로 켜고 끕니다.
## 배포판(개발 모드 꺼짐)에서는 열리지 않으므로 그대로 둬도 괜찮습니다.
##
## 탭: 타이틀 메뉴 / 선택지 / 대사 / 이미지·영상 / 커서·대사 소리
## 각 탭은 같은 폴더의 editor_*.rpy에 있습니다.
##
## Ctrl+S로 저장하면
##   - 대사·선택지 한 줄의 값은 원고(.rpy)의 그 줄 괄호에 바로 적힙니다.
##     (engine/script_edit.rpy가 고치고, 원본은 프로젝트 폴더의 ui_kit_backup/에 남습니다)
##   - 그 밖의 값은 플러그인 폴더에 *_layout.rpy로 저장되고, 설정 파일의
##     같은 값보다 우선합니다.
################################################################################

init offset = 1

init -9 python in ui_editor:

    import store
    from store import Action, DictEquality, python_object

    try:
        import renpy.pygame as pygame
    except Exception:
        import pygame

    ## ── 상태 (세이브·롤백에 들어가지 않는 일반 파이썬 객체) ──

    class _State(python_object):
        def __init__(self):
            self.open = False
            self.tab = None         # 지금 탭의 id
            self.corner = 1         # 안내 패널 위치: 0 왼쪽 위, 1 오른쪽 위, 2 오른쪽 아래, 3 왼쪽 아래
            self.help = True        # 단축키 안내 보이기
            self.message = ""
            self.popup = None       # None, "font", "color"
            self.popup_key = None   # 팝업이 고치는 값 ("font", "color")
            self.reopen = None      # 저장 후 다시 불러오기되면 편집기를 다시 엶

            ## 패널이 화면을 가리지 않게 (2.7)
            self.mini = False       # X: 패널을 한 줄로 접기
            self.peek = False       # Space를 누르고 있는 동안 패널 숨기기
            self.dodge = True       # B: 고른 것이 패널 아래에 있으면 패널이 다른 구석으로 비킴
            self.panel_xy = None    # 패널 제목을 끌어서 놓은 자리 (None이면 구석)
            self.panel_drag = None  # 패널을 끄는 중 (마우스 x, y, 패널 x, y)
            self.panel_now = (10, 10)
            self.panel_size = None
            self.dodged = False
            self.corner_used = 1

    state = _State()

    ## 저장 직후 스크립트가 다시 불러와졌다면, 편집 상태를 이어받습니다.
    state.reopen = store.renpy.session.pop("ui_editor", None)

    def editor_key():
        for ns in ("ui_kit", "tmenu"):
            v = getattr(getattr(store, ns, None), "editor_key", None)
            if v:
                return v
        return "shift_K_m"

    def msg(s):
        state.message = s
        store.renpy.restart_interaction()

    ## ── 탭 ──

    TABS = [ ]

    class Tab(python_object):
        """탭마다 이 클래스를 이어받아 필요한 것만 다시 정의합니다."""

        id = ""
        label = ""
        panel_screen = None         # 패널 안에 들어갈 탭 화면
        overlay_screen = None       # 게임 화면 위에 그릴 표시 (클릭 영역 등)
        uses_mode = False           # 1/2 평소/선택됐을 때
        uses_scope = False          # 3 이것만/전체
        shows_line = False          # 탭이 스스로 원고 줄을 보여주는지 (아니면 패널 위에 '지금 줄' 표시)
        scope_labels = ("이것만", "전체")
        mode_labels = ("평소", "선택됐을 때")

        ## 쓸 수 있는지. (True, "") 또는 (False, "이유")
        def available(self):
            return (False, "")

        def on_open(self):
            pass

        def on_close(self):
            pass

        ## 마우스: 드래그 시작이면 아무 값이나(토큰), 아니면 None
        def drag_begin(self, x, y):
            return None

        def drag_move(self, token, dx, dy):
            pass

        def drag_end(self, token):
            pass

        def wheel(self, sign, shift):
            pass

        ## 키보드
        def move(self, dx, dy):
            pass

        def nudge(self, what, amount):
            pass

        def select(self, step):
            pass

        def set_mode(self, mode):
            pass

        def mode(self):
            return "base"

        def toggle_scope(self):
            pass

        def scope(self):
            return "item"

        def toggle_preview(self):
            pass

        def key(self, k, shift):
            """탭만 쓰는 키. 처리했으면 True."""
            return False

        def focus_rect(self):
            """고른 것의 화면 위치 (x, y, w, h). 패널이 이것을 가리면 다른 구석으로 비킵니다."""
            return None

        def replay(self):
            """R: 지금 장면을 다시 보여주기 (대사 탭)."""
            pass

        def replay_on_close(self):
            """편집기를 닫을 때 지금 장면을 다시 보여줘야 하면 True."""
            return False

        def reset_item(self):
            pass

        def discard(self):
            pass

        ## 글꼴·색 고르기
        def get_value(self, key):
            return None

        def set_value(self, key, value):
            pass

        def value_label(self, key):
            return key

        ## 저장
        def pending(self):
            """저장할 수 있는(배치 파일로) 바뀐 값의 수."""
            return 0

        def pending_lines(self):
            """스크립트에 옮기지 않은(줄별) 바뀐 줄의 수."""
            return 0

        def script_edits(self):
            """Ctrl+S로 원고에 바로 쓸 줄 목록 (script_edit.Edit). 못 쓰는 탭은 빈 목록."""
            return [ ]

        def after_script_save(self, edits):
            """원고에 쓴 뒤 불립니다. 각 Edit의 ok가 True면 그 줄은 원고에 들어갔습니다."""
            pass

        def layout_file(self):
            """(파일 이름, 내용), 그런 묶음의 목록, 또는 None"""
            return None

        def file_path(self, filename):
            """저장할 파일의 실제 경로. 다른 플러그인의 탭은 자기 폴더를 돌려줍니다."""
            return store.ui_kit.root_path(filename)

        def after_save(self):
            """저장한 값을 지금 게임에도 적용. 다시 불러와야 하면 True."""
            return False

        def copy_text(self):
            return None

        def info_lines(self):
            return [ ]

        def help_lines(self):
            return [ ]

        def session(self):
            return { }

        def restore(self, d):
            pass

    ## 탭 버튼 순서
    ORDER = ("title", "choice", "say", "stage", "custom_ui")

    ## 탭의 layout_file()이 파일 여러 개(목록)를 돌려줘도 저장할 수 있음 (2.3부터)
    LAYOUT_LISTS = True

    def register(tab):
        for i, t in enumerate(TABS):
            if t.id == tab.id:
                TABS[i] = tab
                break
        else:
            TABS.append(tab)
        TABS.sort(key=lambda t: ORDER.index(t.id) if t.id in ORDER else len(ORDER))

    def get_tab(tid):
        for t in TABS:
            if t.id == tid:
                return t
        return None

    def current_tab():
        return get_tab(state.tab)

    def tab_available(t):
        try:
            return t.available()
        except Exception as e:
            return (False, "오류: {}".format(e))

    ## 처음 열 때 고를 탭 순서 (지금 화면에 맞는 것부터)
    PRIORITY = ("choice", "say", "title", "stage", "custom_ui")

    def best_tab():
        for tid in PRIORITY:
            t = get_tab(tid)
            if t is not None and tab_available(t)[0]:
                return t
        return None

    def switch_tab(tid):
        t = get_tab(tid)
        if t is None:
            return
        ok, why = tab_available(t)
        if not ok:
            msg(why or "지금은 이 탭을 쓸 수 없습니다.")
            return
        state.tab = tid
        state.popup = None
        state.message = ""
        panel_yadj.change(0)
        store.renpy.restart_interaction()

    def next_tab(step=1):
        ids = [ t.id for t in TABS if tab_available(t)[0] ]
        if not ids:
            return
        if state.tab in ids:
            k = (ids.index(state.tab) + step) % len(ids)
        else:
            k = 0
        switch_tab(ids[k])

    ## ── 열기·닫기 ──

    def _set_editing(flag):
        for ns in ("tmenu", "cmenu", "say_style"):
            s = getattr(getattr(store, ns, None), "state", None)
            if s is not None and hasattr(s, "editing"):
                s.editing = flag

    def open_editor(tab=None):
        if not store.config.developer:
            return

        t = get_tab(tab) if tab else None
        if t is None or not tab_available(t)[0]:
            ## 지난번 탭을 지금도 쓸 수 있으면 그대로, 아니면 지금 화면에 맞는 탭
            ## (커서·대사 소리 탭은 어디서나 쓸 수 있으므로, 더 맞는 탭이 있으면 그쪽)
            prev = get_tab(state.tab) if state.tab else None
            best = best_tab()
            if prev is not None and tab_available(prev)[0] and not (prev.id == "custom_ui" and best is not prev):
                t = prev
            else:
                t = best

        if t is None:
            store.renpy.notify("showpy 편집기: 지금 화면에서 편집할 수 있는 것이 없습니다.")
            return

        state.open = True
        state.tab = t.id
        state.popup = None
        _set_editing(True)

        for i in TABS:
            i.on_open()

        ## Shift+R로 다시 불러와도 편집기가 다시 열리도록
        remember_session()

        store.renpy.restart_interaction()

    def close_editor():
        pending = sum(t.pending() for t in TABS)
        lines = sum(t.pending_lines() for t in TABS)

        state.open = False
        state.popup = None
        state.message = ""
        _set_editing(False)

        for i in TABS:
            i.on_close()

        store.renpy.session.pop("ui_editor", None)

        if pending or lines:
            store.renpy.notify("저장 안 한 변경이 있습니다. Shift+M으로 다시 열어 Ctrl+S로 저장하세요.")

        ## 편집 중인 값을 넣어 다시 보여준 장면이면, 원래 모습으로 다시 보여줍니다.
        replay = False
        for i in TABS:
            try:
                replay = replay or i.replay_on_close()
            except Exception:
                pass
        if replay:
            store.renpy.rollback(checkpoints=0, force=True, greedy=True)

        store.renpy.restart_interaction()

    class ToggleEditor(Action, DictEquality):
        """편집기를 켜고 끕니다. (개발 모드에서만 동작)"""
        def __call__(self):
            if state.open:
                close_editor()
            else:
                open_editor()

    class Reopen(Action, DictEquality):
        """저장 → 다시 불러오기 뒤에 편집기를 같은 상태로 다시 엽니다.
        (다시 불러온 직후에는 화면이 아직 준비되지 않았을 수 있어서, 그 탭을 쓸 수
        있을 때까지 잠깐 기다립니다)"""
        def __call__(self):
            r = state.reopen
            if not r or state.open:
                state.reopen = None
                return

            want = get_tab(r.get("tab"))
            if want is not None and not tab_available(want)[0]:
                state.reopen_tries = getattr(state, "reopen_tries", 0) + 1
                if state.reopen_tries < 60:
                    return

            state.reopen = None
            state.reopen_tries = 0
            state.corner = r.get("corner", 1)
            state.help = r.get("help", True)
            state.mini = r.get("mini", False)
            state.dodge = r.get("dodge", True)
            state.panel_xy = r.get("panel_xy", None)
            for t in TABS:
                t.restore(r.get("tabs", { }).get(t.id, { }))
            open_editor(r.get("tab"))
            state.message = r.get("message", "")

    def remember_session():
        store.renpy.session["ui_editor"] = dict(
            tab=state.tab,
            corner=state.corner,
            help=state.help,
            mini=state.mini,
            dodge=state.dodge,
            panel_xy=state.panel_xy,
            message=state.message,
            tabs={ t.id : t.session() for t in TABS },
            )

    ## ── 저장·복사 ──

    def save_all():
        layout_tabs = [ t for t in TABS if t.pending() ]

        ## 원고에 바로 쓸 줄
        script_tabs = [ ]
        edits = [ ]
        for t in TABS:
            try:
                es = t.script_edits()
            except Exception as e:
                msg("저장 실패 ({} 탭): {}".format(t.label, e))
                return
            if es:
                script_tabs.append((t, es))
                edits.extend(es)

        ## 원고에 바로 못 쓰는 줄별 값 (Ctrl+C로 옮겨야 함)
        copy_only = sum(t.pending_lines() for t in TABS) - len(edits)

        if not layout_tabs and not edits:
            if copy_only > 0:
                msg("저장할 변경이 없습니다. 줄별 값은 Ctrl+C로 복사해서 스크립트에 붙여넣으세요.")
            else:
                msg("저장할 변경이 없습니다.")
            return

        parts = [ ]
        reload = False

        ## 자동 새로고침(Shift+R로 켜는 기능)이 켜져 있으면 파일을 쓰자마자 다시
        ## 불러와질 수 있으므로, 쓰기 전에 편집기 상태를 남겨 둡니다.
        state.message = "저장했습니다."
        remember_session()

        ## 1. 배치 파일 (*_layout.rpy)
        saved = [ ]
        for t in layout_tabs:
            info = t.layout_file()
            if info is None:
                continue
            infos = info if isinstance(info, list) else [ info ]
            for fn, text in infos:
                path = t.file_path(fn)
                try:
                    store.ui_kit.write_text(path, text)
                except Exception as e:
                    msg("저장 실패 ({}): {}".format(fn, e))
                    return
                saved.append(fn)
            if t.after_save():
                reload = True

        if saved:
            parts.append("저장했습니다: " + ", ".join(saved))

        ## 2. 원고 (.rpy의 그 줄)
        if edits:
            se = store.script_edit
            se.apply(edits)
            for t, es in script_tabs:
                t.after_script_save(es)
            parts.append(se.report(edits))
            if any(e.changed for e in edits):
                reload = True
                ## 렌파이는 고친 줄을 같은 줄로 알아보지 못해서, 다시 불러오면 그 앞의 저장 지점부터 진행합니다.
                parts.append('원고를 다시 불러옵니다. 고친 줄은 그 앞 대사(저장 지점)부터 다시 나옵니다.')

        if copy_only > 0:
            parts.append("원고에 바로 저장하지 못한 줄별 값이 있습니다. Ctrl+C로 복사하세요.")

        text = "\n".join(parts)
        state.message = text
        remember_session()

        if reload:
            if copy_only > 0:
                ## 다시 불러오면 복사 안 한 줄별 값이 사라지므로 기다립니다.
                msg(text + "\n복사를 마친 뒤 Shift+R로 다시 불러오면 원고에 쓴 값이 반영됩니다.")
            else:
                ## 다시 불러오면 바뀐 원고로 같은 장면을 다시 보여줍니다.
                state.message = text
                remember_session()
                store.renpy.reload_script()
                return

        msg(text)

    def copy_current():
        t = current_tab()
        if t is None:
            return
        text = t.copy_text()
        if not text:
            msg("복사할 내용이 없습니다.")
            return
        try:
            store.CopyToClipboard(text)()
            msg("클립보드에 복사했습니다. " + getattr(t, "copy_hint", ""))
        except Exception:
            msg("클립보드를 쓸 수 없습니다.")

    ## ── 글꼴·색 팝업 ──

    def open_popup(kind, key):
        t = current_tab()
        if t is None:
            return
        state.popup = kind
        state.popup_key = key
        if kind == "color":
            picker.start(t, key)
        store.renpy.restart_interaction()

    def close_popup():
        state.popup = None
        store.renpy.restart_interaction()

    def pick_font(fn):
        t = current_tab()
        if t is not None:
            t.set_value(state.popup_key, fn)
        close_popup()

    class Picker(python_object):
        """HSV 색 고르기."""

        def __init__(self):
            self.tab = None
            self.key = None
            self.original = None
            self.h = 0.0
            self.s = 0.0
            self.v = 1.0
            self.a = 1.0
            self.hex = "#ffffff"

        def start(self, tab, key):
            import colorsys
            self.tab = tab
            self.key = key
            cur = tab.get_value(key) or "#ffffff"
            self.original = cur
            rgba = store.ui_kit.parse_color(cur) or (255, 255, 255, 255)
            h, s, v = colorsys.rgb_to_hsv(rgba[0] / 255.0, rgba[1] / 255.0, rgba[2] / 255.0)
            self.h = h * 360.0
            self.s = s
            self.v = v
            self.a = rgba[3] / 255.0
            self.hex = store.ui_kit.color_hex(rgba)

        def from_hsv(self):
            import colorsys
            r, g, b = colorsys.hsv_to_rgb((self.h % 360.0) / 360.0, self.s, self.v)
            self.hex = store.ui_kit.color_hex((r * 255, g * 255, b * 255, self.a * 255))
            self.apply()

        def set_hex(self, s):
            import colorsys
            s = s.strip()
            if not s.startswith("#"):
                s = "#" + s
            rgba = store.ui_kit.parse_color(s)
            if rgba is None:
                return False
            h, sat, v = colorsys.rgb_to_hsv(rgba[0] / 255.0, rgba[1] / 255.0, rgba[2] / 255.0)
            self.h = h * 360.0
            self.s = sat
            self.v = v
            self.a = rgba[3] / 255.0
            self.hex = store.ui_kit.color_hex(rgba)
            self.apply()
            return True

        def apply(self):
            if self.tab is not None:
                self.tab.set_value(self.key, self.hex)
            store.renpy.restart_interaction()

        def cancel(self):
            if self.tab is not None and self.original is not None:
                self.tab.set_value(self.key, self.original)
            close_popup()

        def hue_color(self):
            import colorsys
            r, g, b = colorsys.hsv_to_rgb((self.h % 360.0) / 360.0, 1.0, 1.0)
            return store.ui_kit.color_hex((r * 255, g * 255, b * 255, 255))

    picker = Picker()

    class HexInputValue(store.InputValue, DictEquality):
        """색 코드 입력 칸. 누르면 입력할 수 있고, 올바른 색이 되는 순간 바로 적용합니다."""
        default = False
        editable = True
        returnable = False

        def __init__(self):
            self.text = None

        def get_text(self):
            if self.text is None:
                return picker.hex
            return self.text

        def set_text(self, s):
            self.text = s
            if len(s.strip().lstrip("#")) in (3, 4, 6, 8):
                picker.set_hex(s)
            store.renpy.restart_interaction()

        def enter(self):
            if picker.set_hex(self.get_text()):
                self.text = None
            store.renpy.run(self.Disable())
            raise store.renpy.IgnoreEvent()

    hex_input = HexInputValue()

    PALETTE = [
        "#ffffff", "#cccccc", "#888888", "#444444", "#000000",
        "#ff3b3b", "#ff8c3b", "#ffd23b", "#7dff3b", "#3bd6ff",
        "#3b6bff", "#9933ff", "#ff3b8d", "#aa0000", "#fff6f6",
        ]

    def palette():
        rv = [ ]
        for name in ("accent_color", "idle_color", "hover_color", "selected_color", "text_color"):
            c = getattr(store.gui, name, None)
            if isinstance(c, str) and c not in rv:
                rv.append(c)
        for c in PALETTE:
            if c not in rv:
                rv.append(c)
        return rv[:20]

    _hue_strip = None

    def hue_strip():
        """색상 막대 배경 (무지개)."""
        global _hue_strip
        import colorsys
        if _hue_strip is None:
            n = 36
            w = 300
            kids = [ ]
            for i in range(n):
                r, g, b = colorsys.hsv_to_rgb(i / float(n), 1.0, 1.0)
                c = store.ui_kit.color_hex((r * 255, g * 255, b * 255, 255))
                kids.append(store.Transform(store.Solid(c), xpos=int(i * w / n), xsize=int(w / n) + 1, ysize=14))
            _hue_strip = store.Fixed(*kids, xsize=w, ysize=14)
        return _hue_strip

    ## ── 마우스·키보드 입력 ──

    ## 편집기가 열려 있어도 렌파이로 넘겨줄 키 (다시 불러오기, 콘솔, 개발자 메뉴, 전체 화면)
    PASSTHROUGH = ("shift_K_r", "shift_K_o", "shift_K_d", "K_f", "alt_K_RETURN", "alt_K_KP_ENTER", "K_F11")

    class EditorInput(store.renpy.Displayable):
        """편집기가 열려 있는 동안 화면 전체의 입력을 받는 보이지 않는 층.
        게임(대사 넘기기, 선택지 고르기, 되감기 등)으로는 입력이 가지 않습니다."""

        def __init__(self, **properties):
            super(EditorInput, self).__init__(**properties)
            self.drag = None

        def render(self, width, height, st, at):
            return store.renpy.Render(width, height)

        def event(self, ev, x, y, st):

            if not state.open:
                return None

            tab = current_tab()

            if ev.type in (pygame.KEYDOWN, pygame.KEYUP):
                if store.renpy.map_event(ev, editor_key()):
                    return None
                for k in PASSTHROUGH:
                    if store.renpy.map_event(ev, k):
                        return None

            ## 팝업이 열려 있으면 Esc만 처리하고 나머지는 막음
            if state.popup is not None:
                if ev.type == pygame.KEYDOWN and ev.key == pygame.K_ESCAPE:
                    if state.popup == "color":
                        picker.cancel()
                    else:
                        close_popup()
                if ev.type in (pygame.KEYDOWN, pygame.KEYUP, pygame.MOUSEBUTTONDOWN, pygame.MOUSEBUTTONUP):
                    raise store.renpy.IgnoreEvent()
                return None

            mods = getattr(ev, "mod", None)
            if mods is None:
                mods = pygame.key.get_mods()

            shift = bool(mods & pygame.KMOD_SHIFT)
            ctrl = bool(mods & (pygame.KMOD_CTRL | pygame.KMOD_META))

            ## 마우스
            if ev.type == pygame.MOUSEBUTTONDOWN:
                if ev.button == 1 and tab is not None and tab_available(tab)[0]:
                    token = tab.drag_begin(x, y)
                    if token is not None:
                        self.drag = (token, x, y)
                        store.renpy.restart_interaction()
                elif ev.button in (4, 5):
                    ## 휠: 패널 위면 패널 스크롤, 밖이면 탭의 휠 기능 (패널 쪽 key와 같은 함수)
                    panel_wheel(-1 if ev.button == 4 else 1)
                raise store.renpy.IgnoreEvent()

            if ev.type == pygame.MOUSEMOTION and self.drag is not None:
                token, mx, my = self.drag
                dx = x - mx
                dy = y - my
                if shift:
                    if abs(dx) > abs(dy):
                        dy = 0
                    else:
                        dx = 0
                if tab is not None:
                    tab.drag_move(token, dx, dy)
                store.renpy.restart_interaction()
                raise store.renpy.IgnoreEvent()

            if ev.type == pygame.MOUSEBUTTONUP:
                if self.drag is not None:
                    if tab is not None:
                        tab.drag_end(self.drag[0])
                    self.drag = None
                    store.renpy.restart_interaction()
                raise store.renpy.IgnoreEvent()

            if ev.type == getattr(pygame, "MOUSEWHEEL", -1):
                raise store.renpy.IgnoreEvent()

            ## 키보드
            if ev.type == pygame.KEYUP:
                if ev.key == pygame.K_SPACE and state.peek:
                    state.peek = False
                    store.renpy.restart_interaction()
                raise store.renpy.IgnoreEvent()

            if ev.type != pygame.KEYDOWN:
                return None

            k = ev.key
            step = 10 if shift else 1
            usable = tab is not None and tab_available(tab)[0]

            if k == pygame.K_ESCAPE:
                close_editor()
            elif ctrl and k == pygame.K_s:
                save_all()
            elif ctrl and k == pygame.K_c:
                copy_current()
            elif ctrl:
                pass
            elif k == pygame.K_t:
                next_tab(-1 if shift else 1)
            elif k == pygame.K_p:
                state.corner = (state.corner + (3 if shift else 1)) % 4
                state.panel_xy = None
            elif k == pygame.K_F1:
                state.help = not state.help
            elif k == pygame.K_x:
                state.mini = not state.mini
            elif k == pygame.K_b:
                state.dodge = not state.dodge
                msg("자동 비키기 " + ("켬" if state.dodge else "끔"))
            elif k == pygame.K_v:
                toggle_fx_preview()
            elif k == pygame.K_SPACE:
                state.peek = True

            elif not usable:
                pass

            elif tab.key(k, shift):
                pass

            elif k == pygame.K_LEFT:
                tab.move(-step, 0)
            elif k == pygame.K_RIGHT:
                tab.move(step, 0)
            elif k == pygame.K_UP:
                tab.move(0, -step)
            elif k == pygame.K_DOWN:
                tab.move(0, step)

            elif k == pygame.K_q:
                tab.nudge("rotate", -5 if shift else -1)
            elif k == pygame.K_e:
                tab.nudge("rotate", 5 if shift else 1)
            elif k == pygame.K_z:
                tab.nudge("skew", -5 if shift else -1)
            elif k == pygame.K_c:
                tab.nudge("skew", 5 if shift else 1)
            elif k == pygame.K_a:
                tab.nudge("zoom", -0.1 if shift else -0.01)
            elif k == pygame.K_d:
                tab.nudge("zoom", 0.1 if shift else 0.01)
            elif k == pygame.K_s:
                tab.nudge("size", -5 if shift else -1)
            elif k == pygame.K_w:
                tab.nudge("size", 5 if shift else 1)

            elif k == pygame.K_TAB:
                tab.select(-1 if shift else 1)
            elif k == pygame.K_h:
                tab.toggle_preview()
            elif k == pygame.K_1:
                tab.set_mode("base")
            elif k == pygame.K_2:
                tab.set_mode("hover")
            elif k == pygame.K_3:
                tab.toggle_scope()
            elif k == pygame.K_BACKSPACE:
                tab.reset_item()
            elif k == pygame.K_r:
                tab.replay()

            store.renpy.restart_interaction()
            raise store.renpy.IgnoreEvent()

    editor_input = EditorInput()

    class WheelCatcher(store.renpy.Displayable):
        """편집기 패널보다 위에 깔린 보이지 않는 층. 마우스 휠만 받아서 panel_wheel로 보냅니다.
        (패널 안의 버튼·막대보다 먼저 받아야 패널 위 어디서 굴려도 스크롤됩니다)"""

        def render(self, width, height, st, at):
            return store.renpy.Render(width, height)

        def event(self, ev, x, y, st):
            if not state.open or state.popup is not None:
                return None
            if ev.type == pygame.MOUSEBUTTONDOWN and ev.button in (4, 5):
                panel_wheel(-1 if ev.button == 4 else 1)
                raise store.renpy.IgnoreEvent()
            return None

    wheel_catcher = WheelCatcher()

    ## ── 화면 표시용 ──

    def corner_pos():
        c = state.corner
        xa = 1.0 if c in (1, 2) else 0.0
        ya = 1.0 if c in (2, 3) else 0.0
        return (xa, ya, -10 if xa else 10, -10 if ya else 10)

    def tab_buttons():
        rv = [ ]
        for t in TABS:
            ok, why = tab_available(t)
            rv.append((t, ok, why))
        return rv

    def common_help():
        rv = [
            "T 다음 탭 | Ctrl+S 저장(대사, 선택지, 이미지 줄은 원고에 바로) | Ctrl+C 복사 | Esc 닫기 | F1 안내 접기",
            "패널: 제목(=)을 끌어 옮기기 | P 구석 바꾸기 | X 접기 | Space 누르는 동안 숨기기 | B 자동 비키기 " + ("켬" if state.dodge else "끔"),
            ]
        on = fx_preview_on()
        if on is not None:
            rv.append("V 화면 효과 보기 " + ("켬" if on else "끔") + " (휘는 효과는 가장자리에서 누르는 자리가 조금 어긋남)")
        return rv

    ## ── 편집 중 화면 효과 보기 (Screen FX 플러그인이 있을 때) ──

    def _sfx_preview_api():
        sfx = getattr(store, "screen_fx", None)
        f = getattr(sfx, "editor_preview_on", None)
        t = getattr(sfx, "toggle_editor_preview", None)
        if f is None or t is None:
            return None
        return (f, t)

    def fx_preview_on():
        """편집 중에 화면 효과가 보이면 True, 꺼 두면 False, Screen FX(3.4 이상)가 없으면 None."""
        api = _sfx_preview_api()
        return api[0]() if api else None

    def toggle_fx_preview():
        """V 키: 편집 중 화면 효과 보기를 켜고 끕니다."""
        api = _sfx_preview_api()
        if api is None:
            msg("화면 효과 플러그인(Screen FX 3.4 이상)이 없습니다.")
            return
        on = api[1]()
        msg("편집 중 화면 효과 보기 " + ("켬" if on else "끔") + " (V)")

    ## ── 패널 자리 ──
    ## 기본은 구석(P로 바꿈). 고른 것(그림, 대사, 메뉴 항목 …)이 패널 아래에 있으면
    ## 그것을 가리지 않는 다른 구석으로 잠깐 비킵니다. (B로 끄기)
    ## 제목을 끌어서 옮기면 그 자리에 고정되고, 이때는 비키지 않습니다. (P로 구석으로 돌아감)

    MARGIN = 10

    ## 패널이 화면보다 길면 아래쪽(탭 내용, 안내)을 스크롤합니다.
    ## 스크롤 위치를 여기 두어서, 버튼을 눌러도 맨 위로 돌아가지 않습니다. (탭을 바꾸면 맨 위로)
    ## 편집기 층은 값만 바꿔서는 다시 그려지지 않아서, 스크롤한 뒤에는 화면을 새로 그립니다.
    ## (휠은 panel_wheel에서, 스크롤바 끌기는 손을 뗄 때)
    panel_yadj = store.ui.adjustment(step=40)    # 휠 한 칸에 40픽셀

    def panel_wheel(sign):
        """마우스 휠. 패널 위에서는 패널을 스크롤하고, 밖에서는 탭의 휠 기능(글자 크기, 회전 …)."""
        if state.popup is not None:
            return
        mx, my = store.renpy.get_mouse_pos()
        x, y = state.panel_now
        w, h = panel_size()
        if not state.peek and not live_panel_hidden() and x <= mx < x + w and y <= my < y + h:
            if panel_yadj.range > 0 and not state.mini:
                panel_yadj.change(panel_yadj.value + sign * panel_yadj.step)
                store.renpy.restart_interaction()
            return
        tab = current_tab()
        if tab is not None and tab_available(tab)[0]:
            tab.wheel(sign, bool(pygame.key.get_mods() & pygame.KMOD_SHIFT))
            store.renpy.restart_interaction()

    def panel_size():
        try:
            d = store.renpy.get_displayable("ui_editor_root", "ui_editor_panel_frame", layer="ui_editor")
        except Exception:
            d = None
        ws = getattr(d, "window_size", None)
        if ws and ws[0] > 0 and ws[1] > 0:
            state.panel_size = (int(ws[0]), int(ws[1]))
        return state.panel_size or (660, 300)

    def _corner_xy(c, w, h):
        W = store.config.screen_width
        H = store.config.screen_height
        x = W - w - MARGIN if c in (1, 2) else MARGIN
        y = H - h - MARGIN if c in (2, 3) else MARGIN
        return (max(0, x), max(0, y))

    def _overlap(a, b):
        w = min(a[0] + a[2], b[0] + b[2]) - max(a[0], b[0])
        h = min(a[1] + a[3], b[1] + b[3]) - max(a[1], b[1])
        return max(0, w) * max(0, h)

    def panel_place():
        """패널 자리 (xpos, ypos, xanchor, yanchor).
        구석에 둘 때는 그 구석을 기준점으로 삼아서, 패널 크기를 몰라도 정확히 붙습니다."""
        x, y = panel_topleft()
        if state.panel_xy is not None:
            return (x, y, 0.0, 0.0)
        c = state.corner_used
        W = store.config.screen_width
        H = store.config.screen_height
        xr = c in (1, 2)
        yb = c in (2, 3)
        return (W - MARGIN if xr else MARGIN, H - MARGIN if yb else MARGIN, 1.0 if xr else 0.0, 1.0 if yb else 0.0)

    def panel_topleft():
        """패널 왼쪽 위의 화면 좌표 (크기는 지난번에 그린 크기)."""
        w, h = panel_size()
        W = store.config.screen_width
        H = store.config.screen_height
        state.dodged = False

        if state.panel_xy is not None:
            x, y = state.panel_xy
            x = int(max(0, min(W - min(w, W), x)))
            y = int(max(0, min(H - min(h, H), y)))
            state.panel_now = (x, y)
            return (x, y)

        x, y = _corner_xy(state.corner, w, h)
        state.corner_used = state.corner

        r = None
        if state.dodge and state.panel_drag is None:
            t = current_tab()
            if t is not None and tab_available(t)[0]:
                try:
                    r = t.focus_rect()
                except Exception:
                    r = None

        if r is not None and _overlap((x, y, w, h), r) > 0:
            ## 지금 구석 → 좌우 반대 → 위아래 반대 → 대각선 순서로, 가장 덜 가리는 곳
            c = state.corner
            order = [ c, { 0: 1, 1: 0, 2: 3, 3: 2 }[c], { 0: 3, 3: 0, 1: 2, 2: 1 }[c], (c + 2) % 4 ]
            best = None
            for i, cc in enumerate(order):
                xy = _corner_xy(cc, w, h)
                score = (_overlap((xy[0], xy[1], w, h), r), i)
                if best is None or score < best[0]:
                    best = (score, xy, cc)
            if best[2] != state.corner:
                state.dodged = True
            x, y = best[1]
            state.corner_used = best[2]

        state.panel_now = (x, y)
        return (x, y)

    class PanelGrip(store.renpy.Displayable):
        """패널 제목. 끌면 패널이 따라 움직입니다."""

        def __init__(self, **properties):
            super(PanelGrip, self).__init__(**properties)
            self.size = (0, 0)
            self.child = None

        def render(self, width, height, st, at):
            if self.child is None:
                self.child = store.Text("= showpy 편집기", style="ui_editor_title")
            cr = store.renpy.render(self.child, width, height, st, at)
            self.size = cr.get_size()
            rv = store.renpy.Render(self.size[0], self.size[1])
            rv.blit(cr, (0, 0))
            return rv

        def event(self, ev, x, y, st):
            if ev.type == pygame.MOUSEBUTTONDOWN and ev.button == 1:
                if 0 <= x < self.size[0] and 0 <= y < self.size[1]:
                    mx, my = store.renpy.get_mouse_pos()
                    px, py = state.panel_now
                    state.panel_drag = (mx, my, px, py)
                    raise store.renpy.IgnoreEvent()

            if state.panel_drag is not None:
                if ev.type == pygame.MOUSEMOTION:
                    mx0, my0, px, py = state.panel_drag
                    mx, my = store.renpy.get_mouse_pos()
                    state.panel_xy = (px + mx - mx0, py + my - my0)
                    store.renpy.restart_interaction()
                    raise store.renpy.IgnoreEvent()
                if ev.type == pygame.MOUSEBUTTONUP:
                    state.panel_drag = None
                    store.renpy.restart_interaction()
                    raise store.renpy.IgnoreEvent()

            return None

    grip = PanelGrip()

    def line_header():
        """지금 실행 중인 원고 줄 (게임 중일 때만)."""
        if getattr(store, "main_menu", False):
            return ""
        n = current_node()
        if n is None:
            return ""
        return "지금 줄: " + node_place(n)

    def short_path(fn):
        if not fn:
            return "(기본)"
        return fn

    ## ── 스크립트 괄호 만들기 (선택지·대사 탭) ──

    def current_node():
        """지금 실행 중인 스크립트 문장."""
        try:
            import renpy
            return renpy.game.script.lookup(renpy.game.context().current)
        except Exception:
            return None

    def find_node(filename, linenumber, kind):
        """(파일, 줄)에 있는 스크립트 문장. kind는 renpy.ast의 클래스. 없으면 None."""
        import renpy
        script = renpy.game.script
        nodes = getattr(script, "all_stmts", None)
        if not nodes:
            nodes = list(script.namemap.values())
        for n in nodes:
            if isinstance(n, kind) and n.linenumber == linenumber and n.filename == filename:
                return n
        return None

    def node_place(node):
        if node is None:
            return ""
        fn = node.filename.replace("\\", "/")
        if fn.startswith("game/"):
            fn = fn[5:]
        return "{} {}번째 줄".format(fn, node.linenumber)

    def merge_arguments(arginfo, edits, canon=None, remove=None):
        """스크립트에 적힌 인자(arginfo)에 편집한 값(edits)을 덮어써서
        괄호 안에 들어갈 글자 목록을 만듭니다. 손대지 않은 인자는 적힌 그대로 둡니다."""

        if canon is None:
            canon = lambda n: n

        def removed(v):
            return remove is not None and isinstance(v, str) and v == remove

        fmt = store.ui_kit.format_value
        out = [ ]
        done = set()
        by_canon = { canon(k) : k for k in edits }

        if arginfo is not None:
            star = getattr(arginfo, "starred_indexes", ()) or ()
            dstar = getattr(arginfo, "doublestarred_indexes", ()) or ()

            for i, (name, expr) in enumerate(arginfo.arguments):
                if name is None:
                    prefix = "**" if i in dstar else ("*" if i in star else "")
                    out.append(prefix + expr)
                    continue

                c = canon(name)
                if c in by_canon:
                    k = by_canon[c]
                    if k in done:
                        continue
                    done.add(k)
                    if removed(edits[k]):
                        continue
                    out.append("{}={}".format(k, fmt(edits[k])))
                else:
                    out.append("{}={}".format(name, expr))

        for k, v in edits.items():
            if k in done or removed(v):
                continue
            out.append("{}={}".format(k, fmt(v)))

        return out


init 991 python in ui_editor:
    ## 개발 모드에서만 편집기 화면을 항상 띄워 둡니다. (단축키를 받기 위해)
    if store.config.developer and "ui_editor_root" not in store.config.always_shown_screens:
        store.config.always_shown_screens.append("ui_editor_root")

    ## 편집기는 맨 위 전용 층에 그립니다. 화면 전체에 씌우는 효과(VHS 등)와
    ## 화면 전환이 이 층에는 닿지 않아서, 효과를 켠 채로도 패널이 선명합니다.
    if store.config.developer and "ui_editor" not in store.config.top_layers:
        store.config.top_layers.append("ui_editor")


## ── 스타일 ───────────────────────────────────────────────────────────────────

style ui_editor_text:
    font gui.interface_text_font
    size 15
    color "#ffffff"
    outlines [ (2, "#000000", 0, 0) ]

style ui_editor_small is ui_editor_text:
    size 13
    color "#cccccc"

style ui_editor_title is ui_editor_text:
    size 18
    color "#ff3b8d"

style ui_editor_button is empty:
    padding (8, 3)
    background "#ffffff22"
    hover_background "#ff3b8d99"
    selected_background "#ff3b8d66"
    insensitive_background "#ffffff0a"

style ui_editor_button_text is ui_editor_text:
    insensitive_color "#ffffff55"
    selected_color "#ffffff"

style ui_editor_tab is ui_editor_button:
    padding (10, 4)

style ui_editor_tab_text is ui_editor_button_text

style ui_editor_bar is empty:
    xsize 260
    ysize 14
    left_bar Solid("#ff3b8d")
    right_bar Solid("#ffffff33")
    thumb Solid("#ffffff", xsize=4, ysize=18)
    thumb_offset 2

style ui_editor_frame is empty:
    background "#000000d8"
    padding (14, 10)


## ── 화면 ─────────────────────────────────────────────────────────────────────

## 항상 떠 있는 바탕 (개발 모드에서만). 단축키를 받고, 열려 있으면 편집기를 그립니다.
screen ui_editor_root():
    layer "ui_editor"
    zorder 1000

    if config.developer:
        key ui_editor.editor_key() action ui_editor.ToggleEditor()

        if ui_editor.state.reopen is not None and not ui_editor.state.open:
            timer 0.05 repeat True action ui_editor.Reopen()

        if ui_editor.state.open:
            use ui_editor_main


screen ui_editor_main():

    $ _tab = ui_editor.current_tab()
    $ _ok = _tab is not None and ui_editor.tab_available(_tab)[0]

    ## 화면 전체 입력 (보이지 않음)
    add ui_editor.editor_input

    ## 탭이 그리는 표시 (클릭 영역 등)
    if _ok and _tab.overlay_screen:
        use expression _tab.overlay_screen

    ## PyKaki 앱이 붙어 있으면 패널은 앱에서 봅니다 (editor_live.rpy)
    if not ui_editor.state.peek and not ui_editor.live_panel_hidden():
        use ui_editor_panel

    ## 마우스 휠 (패널 위면 패널 스크롤, 밖이면 탭의 휠 기능). 패널보다 위에 둬야 먼저 받습니다.
    add ui_editor.wheel_catcher

    ## 앱이 붙어 있으면 고르기 창도 앱에서 봅니다
    if not ui_editor.live_panel_hidden():
        use ui_editor_popup


## 고르기 창 (글꼴, 색, 그림/영상, 프레임 그림)
screen ui_editor_popup():
    if ui_editor.state.popup == "font":
        use ui_editor_font_popup
    elif ui_editor.state.popup == "color":
        use ui_editor_color_popup
    elif ui_editor.state.popup == "media":
        use ui_editor_media_popup
    elif ui_editor.state.popup == "frame":
        use ui_editor_frame_popup
    elif ui_editor.state.popup == "background":
        use ui_editor_background_popup


## 배경 고르기 창 (3.19): 그림이나 영상 하나. 탭의 background_files()와 set_value(키, 경로)를 씀
screen ui_editor_background_popup():

    $ _tab = ui_editor.current_tab()
    $ _key = ui_editor.state.popup_key
    $ _cur = _tab.get_value(_key) if _tab else None
    $ _files = _tab.background_files() if (_tab and hasattr(_tab, "background_files")) else [ ]

    button:
        style "empty"
        xfill True
        yfill True
        background "#00000066"
        action Function(ui_editor.close_popup)

    frame:
        style "ui_editor_frame"
        modal True
        align (0.5, 0.5)
        xsize 620
        ysize 560

        vbox:
            spacing 6
            text ("배경 고르기 - 그림이나 영상(webm)") style "ui_editor_title"
            text ("지금: " + (ui_editor.short_path(_cur) if _cur else "없음")) style "ui_editor_small"

            viewport:
                scrollbars "vertical"
                mousewheel True
                ysize 430

                vbox:
                    spacing 4
                    textbutton "없음 (타이틀은 검은 화면, ESC 메뉴는 투명)":
                        style "ui_editor_button"
                        xfill True
                        action Function(ui_editor.pick_font, None)
                        selected (not _cur)
                    for _f in _files:
                        textbutton _f:
                            style "ui_editor_button"
                            xfill True
                            text_size 13
                            action Function(ui_editor.pick_font, _f)
                            selected (_cur == _f)
                    if not _files:
                        text "game 폴더에 그림(.png, .jpg, .webp)이나 영상(.webm)이 없습니다." style "ui_editor_text"

            textbutton "취소 (Esc)" style "ui_editor_button" action Function(ui_editor.close_popup)


screen ui_editor_panel():

    $ _tab = ui_editor.current_tab()
    $ _ok, _why = ui_editor.tab_available(_tab) if _tab is not None else (False, "")
    $ _px, _py, _pax, _pay = ui_editor.panel_place()

    frame:
        id "ui_editor_panel_frame"
        style "ui_editor_frame"
        modal True
        pos (_px, _py)
        anchor (_pax, _pay)
        xmaximum 660
        ## 화면 위아래 여백 안에 들어가게. 넘치는 부분은 아래 viewport가 스크롤합니다.
        ymaximum (config.screen_height - 2 * ui_editor.MARGIN)

        if ui_editor.state.mini:
            ## 접은 패널: 제목, 탭 이름, 지금 줄, 펼치기
            vbox:
                spacing 2
                hbox:
                    spacing 8
                    add ui_editor.grip yalign 0.5
                    text (_tab.label if _tab is not None else "") style "ui_editor_text" yalign 0.5
                    textbutton "X 펼치기" style "ui_editor_button" text_size 13 action ToggleField(ui_editor.state, "mini") yalign 0.5
                    textbutton "저장" style "ui_editor_button" text_size 13 action Function(ui_editor.save_all) yalign 0.5
                $ _lines = _tab.info_lines()[:1] if (_tab is not None and _ok) else [ ]
                for _line in _lines:
                    text _line style "ui_editor_small"
                if ui_editor.state.message:
                    text ui_editor.state.message style "ui_editor_small" color "#ffd23b"

        else:
            vbox:
                spacing 4

                hbox:
                    spacing 6
                    box_wrap True
                    box_wrap_spacing 4
                    xmaximum 632
                    add ui_editor.grip yalign 0.5

                    for _t, _tok, _twhy in ui_editor.tab_buttons():
                        textbutton _t.label:
                            style "ui_editor_tab"
                            action Function(ui_editor.switch_tab, _t.id)
                            selected (ui_editor.state.tab == _t.id)
                            sensitive _tok

                hbox:
                    spacing 6
                    textbutton "저장 (Ctrl+S)" style "ui_editor_button" action Function(ui_editor.save_all)
                    textbutton "복사 (Ctrl+C)" style "ui_editor_button" action Function(ui_editor.copy_current)
                    textbutton "닫기 (Esc)" style "ui_editor_button" action ui_editor.ToggleEditor()
                    textbutton "X 접기" style "ui_editor_button" action ToggleField(ui_editor.state, "mini")

                if _ok and not getattr(_tab, "shows_line", False) and ui_editor.line_header():
                    text ui_editor.line_header() style "ui_editor_small"

                null height 2

                ## 여기부터는 스크롤 영역. 위 줄(탭, 저장 버튼)은 늘 보입니다.
                ## vbox의 마지막 칸이라 남은 높이만큼만 차지하고, 넘치면 오른쪽에 스크롤바가 생깁니다.
                ## 내용이 짧으면 스크롤바는 숨고 패널도 내용 높이만큼만 그려집니다.
                ## (fit_first: 이 칸의 크기는 viewport 크기를 따릅니다. 스크롤바는 그 오른쪽 끝에 겹쳐 둡니다)
                fixed:
                    fit_first True

                    viewport:
                        yadjustment ui_editor.panel_yadj
                        mousewheel False    # 휠은 ui_editor.wheel_catcher가 받습니다
                        xfill True
                        yfill False     # 렌파이 기본값은 True(남은 높이를 다 채움)라서 꺼야 내용 높이만큼만 그려집니다
                        child_size (None, 10000)    # 안쪽 내용에 넉넉한 높이를 줘야 넘치는 줄까지 다 재서 끝까지 스크롤됩니다

                        use ui_editor_panel_body

                    vbar:
                        adjustment ui_editor.panel_yadj
                        xalign 1.0
                        xsize 8
                        unscrollable "hide"
                        base_bar Solid("#ffffff22")
                        thumb Solid("#ff3b8d")
                        hover_thumb Solid("#ff6aa9")
                        released Function(renpy.restart_interaction)    # 손을 떼면 내용이 따라옵니다


## 패널 안쪽 (탭 내용, 메시지, 도움말). PyKaki 앱이 붙어 있으면 editor_live.rpy가
## 같은 화면을 화면 밖에 그려서 앱으로 보냅니다 (3.16)
screen ui_editor_panel_body():

    $ _tab = ui_editor.current_tab()
    $ _ok, _why = ui_editor.tab_available(_tab) if _tab is not None else (False, "")

    vbox:
        spacing 4
        xmaximum 620

        if _tab is None:
            text "편집할 탭이 없습니다." style "ui_editor_text"
        elif not _ok:
            text (_why or "지금은 이 탭을 쓸 수 없습니다.") style "ui_editor_text" color "#ffd23b"
        else:
            if _tab.uses_mode or _tab.uses_scope:
                hbox:
                    spacing 6
                    if _tab.uses_mode:
                        textbutton ("1 " + _tab.mode_labels[0]) style "ui_editor_button" action Function(_tab.set_mode, "base") selected (_tab.mode() == "base")
                        textbutton ("2 " + _tab.mode_labels[1]) style "ui_editor_button" action Function(_tab.set_mode, "hover") selected (_tab.mode() == "hover")
                    if _tab.uses_scope:
                        textbutton ("3 " + (_tab.scope_labels[0] if _tab.scope() == "item" else _tab.scope_labels[1])) style "ui_editor_button" action Function(_tab.toggle_scope) selected True

            for _line in _tab.info_lines():
                text _line style "ui_editor_text"

            if _tab.panel_screen:
                use expression _tab.panel_screen pass (_tab)

        if ui_editor.state.message:
            text ui_editor.state.message style "ui_editor_text" color "#ffd23b"

        if ui_editor.state.help:
            null height 2
            if _tab is not None and _ok:
                for _line in _tab.help_lines():
                    text _line style "ui_editor_small"
            for _line in ui_editor.common_help():
                text _line style "ui_editor_small"


## 글꼴·색 줄 (탭 화면에서 씁니다)
screen ui_editor_style_row(tab, keys):
    hbox:
        spacing 6
        for _k in keys:
            $ _v = tab.get_value(_k)
            text (tab.value_label(_k) + ":") style "ui_editor_text" yalign 0.5
            if _k.endswith("font"):
                textbutton (ui_editor.short_path(_v)):
                    style "ui_editor_button"
                    text_size 13
                    action Function(ui_editor.open_popup, "font", _k)
            else:
                button:
                    style "ui_editor_button"
                    action Function(ui_editor.open_popup, "color", _k)
                    hbox:
                        spacing 4
                        add Solid(_v or "#00000000", xysize=(16, 16)) yalign 0.5
                        text (_v or "(기본)") style "ui_editor_button_text" size 13 yalign 0.5


screen ui_editor_font_popup():

    $ _tab = ui_editor.current_tab()
    $ _cur = _tab.get_value(ui_editor.state.popup_key) if _tab else None

    ## 바깥을 누르면 닫힘
    button:
        style "empty"
        xfill True
        yfill True
        background "#00000066"
        action Function(ui_editor.close_popup)

    frame:
        style "ui_editor_frame"
        modal True
        align (0.5, 0.5)
        xsize 620
        ysize 560

        vbox:
            spacing 6
            text ("글꼴 고르기 - " + (_tab.value_label(ui_editor.state.popup_key) if _tab else "")) style "ui_editor_title"
            text ("지금: " + ui_editor.short_path(_cur)) style "ui_editor_small"

            viewport:
                scrollbars "vertical"
                mousewheel True
                ysize 430

                vbox:
                    spacing 4
                    for _f in ui_kit.font_files():
                        button:
                            style "ui_editor_button"
                            xfill True
                            action Function(ui_editor.pick_font, _f)
                            selected ui_kit.same_file(_f, _cur)
                            vbox:
                                text _f style "ui_editor_small"
                                text "가나다라 마바사 ABC abc 123" font _f size 22 color "#ffffff"

                    if not ui_kit.font_files():
                        text "game 폴더에 글꼴 파일(.ttf, .otf)이 없습니다." style "ui_editor_text"

            textbutton "취소 (Esc)" style "ui_editor_button" action Function(ui_editor.close_popup)


screen ui_editor_color_popup():

    $ _tab = ui_editor.current_tab()
    $ _p = ui_editor.picker

    button:
        style "empty"
        xfill True
        yfill True
        background "#00000044"
        action Function(ui_editor.close_popup)

    frame:
        style "ui_editor_frame"
        modal True
        align (0.5, 0.5)
        xsize 420

        vbox:
            spacing 8
            text ("색 고르기 - " + (_tab.value_label(_p.key) if _tab else "")) style "ui_editor_title"

            hbox:
                spacing 12
                add Solid(_p.hex, xysize=(64, 64))
                vbox:
                    spacing 4
                    hbox:
                        spacing 6
                        text "코드" style "ui_editor_text" yalign 0.5
                        button:
                            style "ui_editor_button"
                            xsize 130
                            action ui_editor.hex_input.Toggle()
                            input value ui_editor.hex_input style "ui_editor_text" length 9 allow "#0123456789abcdefABCDEF"
                    hbox:
                        spacing 6
                        text "원래" style "ui_editor_small" yalign 0.5
                        add Solid(_p.original or "#00000000", xysize=(16, 16)) yalign 0.5
                        text (_p.original or "(기본)") style "ui_editor_small" yalign 0.5

            hbox:
                spacing 6
                text "색상" style "ui_editor_text" xsize 56
                fixed:
                    xsize 300
                    ysize 18
                    add ui_editor.hue_strip() yalign 0.5
                    bar value FieldValue(_p, "h", 360.0, step=1, action=Function(_p.from_hsv)) style "ui_editor_bar" xsize 300 left_bar Null() right_bar Null() yalign 0.5
            hbox:
                spacing 6
                text "채도" style "ui_editor_text" xsize 56
                bar value FieldValue(_p, "s", 1.0, step=0.01, action=Function(_p.from_hsv)) style "ui_editor_bar" xsize 300 left_bar Solid(_p.hue_color())
            hbox:
                spacing 6
                text "밝기" style "ui_editor_text" xsize 56
                bar value FieldValue(_p, "v", 1.0, step=0.01, action=Function(_p.from_hsv)) style "ui_editor_bar" xsize 300 left_bar Solid("#ffffff")
            hbox:
                spacing 6
                text "불투명" style "ui_editor_text" xsize 56
                bar value FieldValue(_p, "a", 1.0, step=0.01, action=Function(_p.from_hsv)) style "ui_editor_bar" xsize 300 left_bar Solid("#aaaaaa")

            hbox:
                box_wrap True
                spacing 4
                xmaximum 392
                for _c in ui_editor.palette():
                    button:
                        style "empty"
                        background Solid(_c)
                        hover_background Solid("#ff3b8d")
                        xysize (24, 24)
                        padding (2, 2)
                        action Function(_p.set_hex, _c)
                        add Solid(_c)

            hbox:
                spacing 6
                textbutton "확인" style "ui_editor_button" action Function(ui_editor.close_popup)
                textbutton "취소 (Esc)" style "ui_editor_button" action Function(_p.cancel)
