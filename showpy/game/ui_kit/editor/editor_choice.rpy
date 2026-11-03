################################################################################
## UI Kit — 편집기: 선택지 탭
##
## 화면에 떠 있는 선택지 하나를 끌어서 배치하고 모양·글꼴·색을 바꿉니다.
##
## Ctrl+S로 저장하면 원고(.rpy)의 그 선택지 줄 괄호에 바로 적힙니다.
##     "꺼져, 듣고 싶지 않으니까!" (x=300, y=350, rotate=-4):
## 원래 괄호에 적혀 있던 다른 값은 그대로 두고, 바꾼 값만 고칩니다.
## 원고에 바로 쓸 수 없는 줄은 Ctrl+C로 복사해서 붙여넣으세요.
##
## 모든 선택지의 기본값은 choice_menu_config.rpy에서 고칩니다.
################################################################################

init offset = 1

init -8 python in ui_editor:

    class ChoiceTab(Tab):

        id = "choice"
        label = "선택지"
        panel_screen = "ui_editor_choice_panel"
        overlay_screen = "ui_editor_choice_overlay"
        uses_mode = True
        uses_scope = False
        mode_labels = ("평소", "마우스 올렸을 때")
        shows_line = True
        copy_hint = "원고에 바로 저장되지 않는 줄에 쓰세요. 그 선택지 줄을 바꿔 붙여넣습니다."

        def __init__(self):
            self.sel = 0
            self.mode_ = "base"
            self.preview = True

            ## (파일, menu 줄, 선택지 번호) -> (선택지 줄, 선택지 글, 괄호 정보)
            self.lines = { }

        def cm(self):
            return getattr(store, "cmenu", None)

        ## ── 지금 화면의 선택지 ──

        def available(self):
            cm = self.cm()
            if cm is None:
                return (False, "선택지 기능이 없습니다.")
            if not cm.cfg("enabled"):
                return (False, "선택지 기능이 꺼져 있습니다. (cmenu.enabled)")
            if store.renpy.get_screen("choice") is None:
                return (False, "선택지가 화면에 있을 때 쓸 수 있습니다.")
            if cm.current_menu_key() is None:
                return (False, "스크립트의 menu 문에서 나온 선택지만 편집할 수 있습니다.")
            if not self.choices():
                return (False, "선택지를 읽는 중입니다.")
            return (True, "")

        def menu_key(self):
            return self.cm().current_menu_key()

        def choices(self):
            last = self.cm().state.last
            if last is None:
                return [ ]
            return last.all

        def _choice(self):
            cs = self.choices()
            if not cs:
                return None
            self.sel = max(0, min(self.sel, len(cs) - 1))
            return cs[self.sel]

        def _all(self):
            ## "모든 선택지 기본값"은 이제 choice_menu_config.rpy에서 고칩니다.
            return False

        def _hover(self):
            return self.mode_ == "hover"

        def _edits_for(self, c):
            key = self.menu_key() + (c.number,)
            edits = self.cm().state.edits
            if key not in edits:
                ## 처음 고칠 때 그 선택지 줄을 기억해 둡니다 (저장할 때 다른 프로그램이 바꿨는지 확인)
                info = self._choice_line(key)
                se = getattr(store, "script_edit", None)
                if info is not None and se is not None:
                    se.remember(key[0], info[0])
            return edits.setdefault(key, { })

        def _combined(self, key):
            """원고에 이미 쓴 값 + 아직 안 쓴 값."""
            s = self.cm().state
            rv = dict(s.saved.get(key, { }))
            rv.update(s.edits.get(key, { }))
            return rv

        def _choice_line(self, key):
            """(파일, menu 줄, 번호) → (선택지 줄 번호, 선택지 글, 괄호 정보). 모르면 None."""
            import renpy
            if key in self.lines:
                return self.lines[key]
            fn, menu_line, number = key
            node = find_node(fn, menu_line, renpy.ast.Menu)
            if node is None or not (0 <= number < len(node.items)):
                return None
            label, _cond, block = node.items[number]
            if not block:
                return None
            arginfo = None
            if getattr(node, "item_arguments", None) and number < len(node.item_arguments):
                arginfo = node.item_arguments[number]
            se = getattr(store, "script_edit", None)
            line = se.find_choice_line(fn, menu_line, block[0].linenumber) if se is not None else None
            rv = (line, label, arginfo)
            self.lines[key] = rv
            return rv

        def _set(self, c, **kw):
            s = self.cm().state
            if self._all():
                s.default_edits.update(kw)
            else:
                self._edits_for(c).update(kw)
            self._sync_preview()

        def _sync_preview(self):
            s = self.cm().state
            c = self._choice()
            s.ed_number = c.number if c is not None else None
            if self._hover() and self.preview and c is not None:
                s.preview_hover = c.number
            else:
                s.preview_hover = None

        def on_open(self):
            self.sel = 0
            under = self._under()
            if under is not None:
                self.sel = under
            self._sync_preview()

        def on_close(self):
            cm = self.cm()
            if cm is not None:
                cm.state.preview_hover = None
                cm.state.ed_number = None

        ## ── 화면 위치 (렌파이가 기록한 클릭 영역) ──

        def rects(self):
            """선택지 번호 → (x, y, w, h)"""
            import renpy.display.focus
            rv = { }
            for f in renpy.display.focus.focus_list:
                wid = getattr(f.widget, "id", None) or ""
                if wid.startswith("cmenu_btn_") and f.x is not None:
                    try:
                        rv[int(wid[10:])] = (f.x, f.y, f.w, f.h)
                    except Exception:
                        pass
            return rv

        def focus_rect(self):
            """고른 선택지의 클릭 영역 (패널이 가리면 비킵니다)."""
            c = self._choice()
            if c is None:
                return None
            return self.rects().get(c.number)

        def _under(self):
            """마우스가 올라간 선택지의 목록 번호."""
            try:
                import renpy.display.focus
                f = renpy.display.focus.get_focused()
                wid = getattr(f, "id", None) or ""
                if wid.startswith("cmenu_btn_"):
                    number = int(wid[10:])
                    for i, c in enumerate(self.choices()):
                        if c.number == number:
                            return i
            except Exception:
                pass
            return None

        ## ── 위치 ──

        def _abs(self, c):
            uk = store.ui_kit
            return (uk.to_pixels(c.x, store.config.screen_width), uk.to_pixels(c.y, store.config.screen_height))

        def _start(self, c):
            """드래그를 시작할 기준 위치와 쓰는 방법."""
            s = self.cm().state

            if self._all():
                ## 세로 목록 전체 위치
                lp = s.list_pos if s.list_pos is not None else self.cm().cfg("list_pos")
                if lp is not None:
                    return ("list", lp[0], lp[1])
                rs = self.rects()
                boxes = [ rs[i.number] for i in self.choices() if not i.free and i.number in rs ]
                if not boxes:
                    msg("세로 목록 선택지가 없습니다. 자유 배치 선택지는 '이 선택지만'에서 옮기세요.")
                    return None
                x1 = min(b[0] for b in boxes)
                y1 = min(b[1] for b in boxes)
                x2 = max(b[0] + b[2] for b in boxes)
                y2 = max(b[1] + b[3] for b in boxes)
                return ("list", (x1 + x2) / 2.0, (y1 + y2) / 2.0)

            if self._hover():
                return ("hover", c.h_dx, c.h_dy)

            if c.free:
                x, y = self._abs(c)
                return ("pos", x, y)

            r = self.rects().get(c.number)
            if r is None:
                return None
            return ("pos_center", r[0] + r[2] / 2.0, r[1] + r[3] / 2.0)

        def _apply(self, c, kind, x, y):
            s = self.cm().state
            REMOVE = self.cm().REMOVE

            if kind == "list":
                s.list_pos = (int(round(x)), int(round(y)))
            elif kind == "hover":
                self._edits_for(c).update(hover_offset=(int(round(x)), int(round(y))))
            else:
                e = self._edits_for(c)
                e.update(x=int(round(x)), y=int(round(y)), xalign=REMOVE, yalign=REMOVE)
                anchor = (0.5, 0.5) if kind == "pos_center" else tuple(c.anchor)
                if anchor != (0.5, 0.5):
                    e["anchor"] = anchor
                elif "anchor" in c.own_keys:
                    e["anchor"] = REMOVE
            self._sync_preview()

        def drag_begin(self, x, y):
            under = self._under()
            if under is not None:
                self.sel = under
                self._sync_preview()
            elif not self._all():
                return None
            c = self._choice()
            if c is None:
                return None
            st = self._start(c)
            if st is None:
                return None
            return (c.number, st)

        def drag_move(self, token, dx, dy):
            number, (kind, sx, sy) = token
            for c in self.choices():
                if c.number == number:
                    self._apply(c, kind, sx + dx, sy + dy)
                    return

        def move(self, dx, dy):
            c = self._choice()
            if c is None:
                return
            st = self._start(c)
            if st is None:
                return
            kind, sx, sy = st
            self._apply(c, kind, sx + dx, sy + dy)

        ## ── 모양 ──

        def _key(self, key):
            return ("hover_" + key) if self._hover() else key

        def _cur(self, c, key, fallback):
            if self._all():
                d = self.cm().default_values()
                if self._hover() and ("hover_" + key) in d:
                    return d["hover_" + key]
                return d.get(key, fallback)
            d = c.values
            if self._hover() and ("hover_" + key) in d:
                return d["hover_" + key]
            return d.get(key, fallback)

        def nudge(self, what, amount):
            c = self._choice()
            if c is None:
                return
            if what == "rotate":
                self._set(c, **{ self._key("rotate") : round(float(self._cur(c, "rotate", 0.0)) + amount, 2) })
            elif what == "skew":
                self._set(c, **{ self._key("skew") : round(float(self._cur(c, "skew", 0.0)) + amount, 2) })
            elif what == "zoom":
                self._set(c, **{ self._key("zoom") : round(max(0.05, float(self._cur(c, "zoom", 1.0)) + amount), 2) })
            elif what == "size":
                cur = self._cur(c, "size", store.gui.choice_button_text_size)
                self._set(c, **{ self._key("size") : int(max(4, int(cur) + amount)) })

        def wheel(self, sign, shift):
            under = self._under()
            if under is not None:
                self.sel = under
                self._sync_preview()
            if shift:
                self.nudge("size", -sign)
            else:
                self.nudge("rotate", sign)

        ## ── 선택·모드 ──

        def select(self, step):
            n = len(self.choices())
            if n:
                self.sel = (self.sel + step) % n
            self._sync_preview()

        def set_mode(self, mode):
            self.mode_ = mode
            if mode == "hover":
                self.preview = True
            self._sync_preview()

        def mode(self):
            return self.mode_

        def scope(self):
            return "item"

        def toggle_preview(self):
            self.preview = not self.preview
            self._sync_preview()

        def reset_item(self):
            s = self.cm().state
            c = self._choice()
            if c is not None:
                s.edits.pop(self.menu_key() + (c.number,), None)
                msg("이 선택지의 저장 안 한 변경을 되돌렸습니다.")
            self._sync_preview()

        def discard(self):
            s = self.cm().state
            s.edits = { }
            msg("모든 선택지의 저장 안 한 변경을 버렸습니다.")
            self._sync_preview()

        ## ── 글꼴·색 ──

        def value_label(self, key):
            return {
                "font": "글꼴", "color": "색",
                "hover_font": "올렸을 때 글꼴", "hover_color": "올렸을 때 색",
                }.get(key, key)

        def style_keys(self):
            if self._hover():
                return ("hover_font", "hover_color")
            return ("font", "color")

        def get_value(self, key):
            c = self._choice()
            hover = key.startswith("hover_")
            name = key[6:] if hover else key
            d = self.cm().default_values() if (self._all() or c is None) else c.values
            if hover and key in d:
                return d[key]
            v = d.get(name, None)
            return v if isinstance(v, str) else None

        def set_value(self, key, value):
            c = self._choice()
            if c is None:
                return
            self._set(c, **{ key : value })

        ## ── 원고에 쓰기·복사 ──

        def pending_lines(self):
            cm = self.cm()
            if cm is None:
                return 0
            return len([ v for v in cm.state.edits.values() if v ])

        def script_edits(self):
            cm = self.cm()
            se = getattr(store, "script_edit", None)
            if cm is None or se is None:
                return [ ]
            rv = [ ]
            for key, edits in cm.state.edits.items():
                if not edits:
                    continue
                info = self._choice_line(key)
                if info is None or info[0] is None:
                    continue
                line, label, arginfo = info
                args = merge_arguments(arginfo, self._combined(key), remove=cm.REMOVE)
                e = se.Edit(key[0], line, se.CHOICE, args, expect=label)
                e.key = key
                rv.append(e)
            return rv

        def after_script_save(self, edits):
            s = self.cm().state
            for e in edits:
                if not e.ok:
                    continue
                s.saved[e.key] = self._combined(e.key)
                s.edits.pop(e.key, None)
            self._sync_preview()

        def _arguments(self, c):
            key = self.menu_key() + (c.number,)
            info = self._choice_line(key)
            arginfo = info[2] if info is not None else None
            return merge_arguments(arginfo, self._combined(key), remove=self.cm().REMOVE)

        def _label(self, c):
            node = current_node()
            try:
                return node.items[c.number][0]
            except Exception:
                return c.caption

        def line_text(self, c):
            args = self._arguments(c)
            s = store.ui_kit.format_value(self._label(c))
            if args:
                s += " (" + ", ".join(args) + ")"
            return s + ":"

        def copy_text(self):
            c = self._choice()
            if c is None:
                return None
            return self.line_text(c)

        def copy_all(self):
            lines = [ "    " + self.line_text(c) for c in sorted(self.choices(), key=lambda i: i.number) ]
            text = "\n".join(lines)
            try:
                store.CopyToClipboard(text)()
                msg("메뉴의 선택지 줄을 모두 복사했습니다. 스크립트의 선택지 줄을 바꿔 붙여넣으세요.")
            except Exception:
                msg("클립보드를 쓸 수 없습니다.")

        ## ── 패널 ──

        def info_lines(self):
            c = self._choice()
            if c is None:
                return [ ]

            rv = [ ]
            n = len(self.choices())
            key = self.menu_key() + (c.number,)
            info = self._choice_line(key)
            fn = key[0].replace("\\", "/")
            if fn.startswith("game/"):
                fn = fn[5:]
            where_line = "{} {}번째 줄".format(fn, info[0]) if (info is not None and info[0]) else node_place(current_node())

            rv.append("선택지 {}/{}  \"{}\"   {}".format(self.sel + 1, n, c.caption, where_line))
            if self._hover():
                rv.append("이동 ({}, {})   회전 {:.1f}   기울기 {:.1f}   확대 {:.2f}   크기 {}".format(
                    c.h_dx, c.h_dy, c.h_rotate, c.h_skew, c.h_zoom,
                    c.values.get("hover_size", c.values.get("size", "-"))))
            else:
                if c.free:
                    x, y = self._abs(c)
                    where = "x {:.0f}   y {:.0f}".format(x, y)
                else:
                    where = "세로 목록 (끌면 자유 배치)"
                rv.append("{}   회전 {:.1f}   기울기 {:.1f}   확대 {:.2f}   크기 {}".format(
                    where, c.rotate, c.skew, c.zoom, c.values.get("size", "-")))
            rv.append("괄호: " + self.line_text(c))

            l = self.pending_lines()
            if l:
                rv.append("원고에 저장 안 한 선택지 {}개 (Ctrl+S)".format(l))
            elif key in self.cm().state.saved:
                rv.append("이 선택지는 원고에 저장했습니다.")
            else:
                rv.append("변경 없음")
            return rv

        def help_lines(self):
            return [
                "마우스: 드래그 이동 (Shift: 한 방향) | 휠 회전 | Shift+휠 글자 크기",
                "방향키 이동 (Shift: 10배) | Q/E 회전 | Z/C 기울기 | A/D 확대 | S/W 글자 크기",
                "Tab 다음 선택지 | 1/2 평소/올렸을 때 | H 미리보기 | Backspace 이 선택지 되돌리기",
                ]

        ## Shift+R이나 저장 뒤 다시 불러와도 원고에 아직 안 쓴 값이 남도록
        def session(self):
            cm = self.cm()
            edits = { k : dict(v) for k, v in cm.state.edits.items() if v } if cm is not None else { }
            return dict(sel=self.sel, mode=self.mode_, preview=self.preview, edits=edits)

        def restore(self, d):
            if not d:
                return
            self.sel = d.get("sel", 0)
            self.mode_ = d.get("mode", "base")
            self.preview = d.get("preview", True)
            cm = self.cm()
            if cm is not None:
                for k, v in (d.get("edits") or { }).items():
                    cm.state.edits.setdefault(k, { }).update(v)

    register(ChoiceTab())


## 세로 목록 위치 표시 (선택지 테두리는 선택지 화면이 직접 그립니다)
screen ui_editor_choice_overlay():
    $ _lp = cmenu.state.list_pos
    if _lp is not None:
        add Solid("#ffd23b", xysize=(9, 9)) pos (int(_lp[0]), int(_lp[1])) anchor (0.5, 0.5)


screen ui_editor_choice_panel(tab):

    use ui_editor_style_row(tab, tab.style_keys())

    hbox:
        spacing 6
        textbutton ("H 미리보기 켬" if tab.preview else "H 미리보기 끔") style "ui_editor_button" action Function(tab.toggle_preview)
        textbutton "메뉴 전체 복사" style "ui_editor_button" action Function(tab.copy_all)
        textbutton "이 선택지 되돌리기" style "ui_editor_button" action Function(tab.reset_item)
        textbutton "모두 버리기" style "ui_editor_button" action Function(tab.discard)
