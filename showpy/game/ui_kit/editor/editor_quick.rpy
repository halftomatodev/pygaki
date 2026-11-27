################################################################################
## pygaki — 편집기: 퀵메뉴 탭 (pygaki v2.0-beta1)
##
## 게임 중 화면 아래 퀵메뉴의 항목을 끌어서 옮기고, 숨기고, 뒤에 그림·영상을 깝니다.
## 저장하면 quick_menu_layout.rpy가 만들어집니다. (엔진은 engine/quick_menu.rpy)
################################################################################

init offset = 1

init -8 python in ui_editor:

    class QuickTab(Tab):

        id = "quick"
        label = "퀵메뉴"
        panel_screen = "ui_editor_quick_panel"
        copy_hint = "quick_menu_config.rpy의 qmenu.items 항목에 붙여넣으세요."

        ## ── 기본 ──

        def qm(self):
            return getattr(store, "qmenu", None)

        def available(self):
            qm = self.qm()
            if qm is None:
                return (False, "퀵메뉴 기능이 없습니다.")
            if not qm.cfg("enabled"):
                return (False, "퀵메뉴 기능이 꺼져 있습니다. (qmenu.enabled)")
            if store.renpy.get_screen(qm.SCREEN) is None or not getattr(store, "quick_menu", False):
                return (False, "게임 중 퀵메뉴가 보일 때 쓸 수 있습니다.")
            if not qm.all_items():
                return (False, "퀵메뉴 항목이 없습니다.")
            return (True, "")

        def on_open(self):
            qm = self.qm()
            if qm is None:
                return
            qm.state.edit_serial += 1
            hover = qm.focused_index()
            qm.state.ed_hover = hover
            if hover is not None:
                qm.state.ed_sel = hover

        def on_close(self):
            qm = self.qm()
            if qm is None:
                return
            qm.state.ed_hover = None
            qm.state.edit_serial += 1

        def _items(self):
            return self.qm().all_items()

        def _item(self, index=None):
            items = self._items()
            if not items:
                return None
            if index is None:
                index = self.qm().state.ed_sel
            index = max(0, min(index, len(items) - 1))
            return items[index]

        def _set(self, it, **kw):
            qm = self.qm()
            qm.state.edits.setdefault(it.id, { }).update(kw)
            qm.state.edit_serial += 1
            store.renpy.restart_interaction()

        def focus_rect(self):
            it = self._item()
            if it is None:
                return None
            if it.row:
                sh = store.config.screen_height
                return (0, sh - 80, store.config.screen_width, 80)
            return (it.x - 100, it.y - 40, 200, 80)

        ## ── 위치 ──

        def drag_begin(self, x, y):
            qm = self.qm()
            under = qm.focused_index()
            if under is None:
                return None
            qm.state.ed_sel = under
            qm.state.ed_hover = under
            it = self._item(under)
            if it.row:
                c = qm.focused_center()
                if c is None:
                    return None
                sx, sy = c
            else:
                sx, sy = it.x, it.y
            return (under, sx, sy)

        def drag_move(self, token, dx, dy):
            index, sx, sy = token
            it = self._item(index)
            if it is None:
                return
            self._set(it, x=int(round(sx + dx)), y=int(round(sy + dy)))

        def move(self, dx, dy):
            it = self._item()
            if it is None:
                return
            if it.row:
                msg("아래 줄에 있는 항목은 먼저 마우스로 끌어서 꺼내세요. 그 뒤로는 방향키로도 옮깁니다.")
                return
            self._set(it, x=it.x + dx, y=it.y + dy)

        def to_row(self):
            """옮긴 항목을 아래 줄로 되돌림 (저장한 자리도 지움)."""
            it = self._item()
            if it is None:
                return
            self._set(it, x=None, y=None)
            msg("'{}' 항목을 아래 줄로 돌렸습니다.".format(it.id))

        def toggle_hidden(self):
            it = self._item()
            if it is None:
                return
            self._set(it, hidden=(None if it.hidden else True))
            msg(("'{}' 항목을 다시 보입니다." if it.hidden else "'{}' 항목을 숨깁니다.").format(it.id))

        def key(self, k, shift):
            if k == pygame.K_DELETE:
                self.toggle_hidden()
                return True
            if k == pygame.K_g:
                self.to_row()
                return True
            return False

        def wheel(self, sign, shift):
            under = self.qm().focused_index()
            if under is not None:
                self.qm().state.ed_sel = under

        def select(self, step):
            s = self.qm().state
            n = len(self._items())
            if n:
                s.ed_sel = (s.ed_sel + step) % n

        def reset_item(self):
            qm = self.qm()
            it = self._item()
            if it is None:
                return
            qm.state.edits.pop(it.id, None)
            qm.state.edit_serial += 1
            msg("'{}' 항목의 저장 안 한 변경을 되돌렸습니다.".format(it.id))

        def discard(self):
            s = self.qm().state
            s.edits = { }
            s.screen_edits = { }
            s.edit_serial += 1

        ## ── 배경 (그림·영상. 색은 설정 파일에서) ──

        @property
        def background_title(self):
            return {
                "bar_background": "막대 배경 고르기 - 그림이나 영상(webm)",
                "item_background": "모든 항목 배경 고르기 - 그림이나 영상(webm)",
                }.get(state.popup_key, "이 항목 배경 고르기 - 그림이나 영상(webm)")

        @property
        def background_none_label(self):
            if state.popup_key == "background":
                return "없음 (모든 항목 배경을 따름)"
            return "없음"

        def background_files(self):
            return store.ui_kit.game_files((".png", ".webp", ".jpg", ".jpeg", ".avif") + self.qm().MOVIE_EXTS)

        def value_label(self, key):
            return {
                "background": "이 항목 배경",
                "bar_background": "막대 배경",
                "item_background": "모든 항목 배경",
                }.get(key, key)

        def get_value(self, key):
            qm = self.qm()
            if key in qm.SCREEN_KEYS:
                return qm.screen_value(key)
            if key == "background":
                it = self._item()
                if it is None:
                    return None
                return self._own(it).get("background", None)
            return None

        def _own(self, it):
            """그 항목에 저장한 값 + 편집 중인 값 (설정 파일 값 포함)."""
            qm = self.qm()
            d = { }
            for raw in qm.raw_items():
                if raw.get("id") == it.id:
                    d.update(raw)
            qm._apply(d, (qm.cfg("layout") or { }).get(it.id, { }))
            qm._apply(d, qm.state.edits.get(it.id, { }))
            return d

        def set_value(self, key, value):
            qm = self.qm()
            value = value or None
            if key in qm.SCREEN_KEYS:
                sl = qm.cfg("screen_layout") or { }
                base = sl.get(key, qm.cfg(key))
                if value == base:
                    qm.state.screen_edits.pop(key, None)
                else:
                    qm.state.screen_edits[key] = value
                qm.state.edit_serial += 1
                store.renpy.restart_interaction()
            elif key == "background":
                it = self._item()
                if it is not None:
                    self._set(it, background=value)

        def bg_label(self, key):
            p = self.get_value(key)
            if not p:
                return "없음"
            if not isinstance(p, str):
                return "(설정 파일 값)"
            return p if p.startswith("#") else short_path(p)

        ## ── 저장 ──

        def pending(self):
            qm = self.qm()
            if qm is None:
                return 0
            return len(qm.state.edits) + len(qm.state.screen_edits)

        def _merged(self):
            qm = self.qm()
            layout = { }
            for k, v in (qm.cfg("layout") or { }).items():
                layout[k] = dict(v)
            for k, v in qm.state.edits.items():
                d = layout.setdefault(k, { })
                qm._apply(d, v)
            return { k : v for k, v in layout.items() if v }

        def _merged_screen(self):
            qm = self.qm()
            rv = dict(qm.cfg("screen_layout") or { })
            rv.update(qm.state.screen_edits)
            return rv

        def _entry(self, d):
            qm = self.qm()
            order = [ k for k in qm.EDIT_KEYS if k in d ] + sorted(k for k in d if k not in qm.EDIT_KEYS)
            return "{" + ", ".join('"{}": {}'.format(k, store.ui_kit.format_value(d[k])) for k in order) + "}"

        def layout_file(self):
            qm = self.qm()
            uk = store.ui_kit
            layout = self._merged()
            scr = self._merged_screen()

            lines = uk.file_header("pygaki editor가 저장한 퀵메뉴 배치입니다.", [
                "여기 적힌 값은 quick_menu_config.rpy의 같은 값보다 우선합니다.",
                "직접 고쳐도 되지만, 편집기에서 다시 저장하면 덮어써집니다.",
                "이 파일을 지우면 설정 파일 값으로 돌아갑니다.",
                ])

            lines.append('## 항목별 값 ("x", "y" 자리(항목 가운데), "hidden" 숨김, "background" 이 항목 배경)')
            lines.append("define qmenu.layout = {")
            ids = [ it.id for it in qm.all_items() ]
            for k in [ i for i in ids if i in layout ] + sorted(i for i in layout if i not in ids):
                lines.append('    "{}": {},'.format(k, self._entry(layout[k])))
            lines.append("}")
            lines.append("")

            lines.append("## 배경 (bar_background 막대, item_background 모든 항목. None = 없음)")
            lines.append("define qmenu.screen_layout = {")
            lines.extend(uk.format_dict_lines(scr, qm.SCREEN_KEYS))
            lines.append("}")
            lines.append("")

            return ("quick_menu_layout.rpy", "\n".join(lines))

        def after_save(self):
            qm = self.qm()
            ## store 변수가 아니라 실행 중 값으로 (다시 불러올 때 옛 값이 덮지 않게)
            qm.state.saved = store.python_dict(layout=self._merged(), screen_layout=self._merged_screen())
            qm.state.edits = { }
            qm.state.screen_edits = { }
            qm.state.edit_serial += 1
            return False

        def copy_text(self):
            layout = self._merged()
            lines = [ ]
            for it in self._items():
                if it.id in layout:
                    lines.append("# {}\n{},".format(it.id, self._entry(layout[it.id])[1:-1]))
            return "\n".join(lines)

        ## ── 패널 ──

        def info_lines(self):
            it = self._item()
            items = self._items()
            if it is None:
                return [ "퀵메뉴 항목이 없습니다." ]
            rv = [ ]
            where = "아래 줄" if it.row else "x {}   y {}".format(it.x, it.y)
            rv.append("퀵메뉴  항목 {}/{}   id: {}   {}".format(self.qm().state.ed_sel + 1, len(items), it.id, it.text))
            rv.append("자리: {}   {}".format(where, "숨김" if it.hidden else "보임"))
            rv.append("이 항목 배경: {}   막대 배경: {}".format(self.bg_label("background"), self.bg_label("bar_background")))
            n = self.pending()
            rv.append("저장 안 한 변경: {}개".format(n) if n else "저장 안 한 변경 없음")
            return rv

        def help_lines(self):
            return [
                "마우스: 항목을 끌어서 옮기기 (Shift: 한 방향) | 방향키 이동 (Shift: 10배, 끌어서 꺼낸 항목만)",
                "Tab 다음 항목 | Delete 숨기기/보이기 | G 아래 줄로 | Backspace 되돌리기",
                ]

        def session(self):
            qm = self.qm()
            if qm is None:
                return { }
            return dict(sel=qm.state.ed_sel)

        def restore(self, d):
            qm = self.qm()
            if qm is None or not d:
                return
            qm.state.ed_sel = d.get("sel", 0)

    register(QuickTab())


screen ui_editor_quick_panel(tab):

    $ _it = tab._item()

    hbox:
        spacing 6
        box_wrap True
        box_wrap_spacing 4
        xmaximum ui_editor.W(632)
        if _it is not None:
            textbutton ("Delete 보이기" if _it.hidden else "Delete 숨기기") style "ui_editor_button" action Function(tab.toggle_hidden) selected _it.hidden
            if not _it.row:
                textbutton "G 아래 줄로" style "ui_editor_button" action Function(tab.to_row)
        textbutton "이 항목 되돌리기" style "ui_editor_button" action Function(tab.reset_item)
        textbutton "모두 버리기" style "ui_editor_button" action Function(tab.discard)

    ## 배경: 그림이나 webm 영상 (색은 설정 파일 quick_menu_config.rpy에서)
    for _k in ("background", "item_background", "bar_background"):
        hbox:
            spacing 6
            text (tab.value_label(_k) + ":") style "ui_editor_text" yalign 0.5
            textbutton tab.bg_label(_k) style "ui_editor_button" text_size ui_editor.T(13) action Function(ui_editor.open_popup, "background", _k)
            if tab.get_value(_k):
                textbutton "없애기" style "ui_editor_button" text_size ui_editor.T(13) action Function(tab.set_value, _k, None)
