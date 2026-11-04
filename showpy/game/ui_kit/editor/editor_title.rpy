################################################################################
## UI Kit — 편집기: 타이틀 메뉴 탭
##
## 타이틀 화면에서 메뉴 항목을 끌어서 배치하고, 회전·기울기·확대·글자 크기·
## 글꼴·색을 바꿉니다. 저장하면 title_menu_layout.rpy가 만들어집니다.
## 게임 중 ESC 메뉴(일시정지 메뉴)가 떠 있으면 그 메뉴를 고칩니다. (3.1)
################################################################################

init offset = 1

init -8 python in ui_editor:

    class TitleTab(Tab):

        id = "title"
        label = "타이틀 메뉴"
        panel_screen = "ui_editor_title_panel"
        overlay_screen = "ui_editor_title_overlay"
        uses_mode = True
        uses_scope = True
        scope_labels = ("이 항목만", "모든 항목 공통")
        mode_labels = ("평소", "선택됐을 때")
        copy_hint = "title_menu_config.rpy의 항목에 붙여넣으세요."

        ## ── 기본 ──

        def focus_rect(self):
            """고른 항목 둘레 (대략). 패널이 가리면 비킵니다."""
            tm = self.tm()
            try:
                items = tm.all_items()
                i = tm.state.ed_sel
                if i is None or not (0 <= i < len(items)):
                    return None
                ax, ay = tm.abs_pos(items[i])
            except Exception:
                return None
            return (ax - 140, ay - 40, 280, 80)

        def tm(self):
            return getattr(store, "tmenu", None)

        def available(self):
            tm = self.tm()
            if tm is None:
                return (False, "타이틀 메뉴 기능이 없습니다.")
            if not tm.cfg("enabled"):
                return (False, "타이틀 메뉴 기능이 꺼져 있습니다. (tmenu.enabled)")
            if store.renpy.get_screen("main_menu") is None and tm.current_menu() != "pause":
                return (False, "타이틀 화면이나 ESC 메뉴에서 쓸 수 있습니다.")
            if not tm.all_items():
                return (False, "메뉴 항목이 없습니다.")
            return (True, "")

        def on_open(self):
            tm = self.tm()
            if tm is None:
                return
            s = tm.state
            s.edit_serial += 1
            hover = tm.focused_index()
            s.ed_hover = hover
            if hover is not None and (store.renpy.get_screen("main_menu") is not None or tm.current_menu() == "pause"):
                s.ed_sel = hover

        def on_close(self):
            tm = self.tm()
            if tm is None:
                return
            tm.state.ed_hover = None
            tm.state.edit_serial += 1

        def _item(self, index=None):
            tm = self.tm()
            items = tm.all_items()
            if not items:
                return None
            if index is None:
                index = tm.state.ed_sel
            index = max(0, min(index, len(items) - 1))
            return items[index]

        def _all(self):
            return self.tm().state.ed_scope == "all"

        def _hover(self):
            return self.tm().state.ed_mode == "hover"

        def _set(self, it, **kw):
            s = self.tm().state
            if self._all():
                s.default_edits.update(kw)
            else:
                self.tm().edits_for().setdefault(it.id, { }).update(kw)
            s.edit_serial += 1

        ## ── 위치 ──

        def _start_pos(self, it):
            tm = self.tm()
            if self._hover():
                bx, by = tm.abs_pos(it)
                return (bx + it.h_offset[0], by + it.h_offset[1])
            return tm.abs_pos(it)

        def _set_pos(self, it, x, y):
            tm = self.tm()
            if self._hover():
                bx, by = tm.abs_pos(it)
                self.tm().edits_for().setdefault(it.id, { }).update(
                    hover_offset=(int(round(x - bx)), int(round(y - by))))
            else:
                self.tm().edits_for().setdefault(it.id, { }).update(
                    x=int(round(x)), y=int(round(y)), anchor=it.anchor)
            self.tm().state.edit_serial += 1

        def _no_pos_in_all(self):
            if self._all():
                msg("위치는 항목마다 정합니다. 3을 눌러 '이 항목만'으로 바꾸세요.")
                return True
            return False

        def drag_begin(self, x, y):
            tm = self.tm()
            under = tm.focused_index()
            if under is None:
                return None
            tm.state.ed_sel = under
            tm.state.ed_hover = under
            if self._no_pos_in_all():
                return None
            it = self._item(under)
            sx, sy = self._start_pos(it)
            return (under, sx, sy)

        def drag_move(self, token, dx, dy):
            index, sx, sy = token
            self._set_pos(self._item(index), sx + dx, sy + dy)

        def move(self, dx, dy):
            if self._no_pos_in_all():
                return
            it = self._item()
            if it is None:
                return
            x, y = self._start_pos(it)
            self._set_pos(it, x + dx, y + dy)

        ## ── 모양 ──

        def _cur(self, it, key, fallback):
            """지금 값. key는 hover_ 없는 이름."""
            tm = self.tm()
            hover = self._hover()

            if self._all():
                d = tm.common_values()
                if hover and ("hover_" + key) in d:
                    return d["hover_" + key]
                return d.get(key, fallback)

            if key == "size":
                props = it.hover_props if hover else it.base_props
                return props.get("size", it.size or fallback)
            if key == "rotate":
                return it.h_rotate if hover else it.rotate
            if key == "skew":
                return it.h_skew if hover else it.skew
            if key == "zoom":
                return it.h_zoom if hover else it.zoom
            return fallback

        def _key(self, key):
            return ("hover_" + key) if self._hover() else key

        def nudge(self, what, amount):
            it = self._item()
            if it is None:
                return

            if what == "rotate":
                self._set(it, **{ self._key("rotate") : round(float(self._cur(it, "rotate", 0.0)) + amount, 2) })
            elif what == "skew":
                self._set(it, **{ self._key("skew") : round(float(self._cur(it, "skew", 0.0)) + amount, 2) })
            elif what == "zoom":
                self._set(it, **{ self._key("zoom") : round(max(0.05, float(self._cur(it, "zoom", 1.0)) + amount), 2) })
            elif what == "size":
                cur = self._cur(it, "size", store.gui.interface_text_size)
                self._set(it, **{ self._key("size") : int(max(4, int(cur) + amount)) })

        def wheel(self, sign, shift):
            tm = self.tm()
            under = tm.focused_index()
            if under is not None:
                tm.state.ed_sel = under
            if shift:
                self.nudge("size", -sign)
            else:
                self.nudge("rotate", sign)

        ## ── 선택·모드 ──

        def select(self, step):
            s = self.tm().state
            n = len(self.tm().all_items())
            if n:
                s.ed_sel = (s.ed_sel + step) % n

        def set_mode(self, mode):
            s = self.tm().state
            s.ed_mode = mode
            if mode == "hover":
                s.ed_preview = True
            s.edit_serial += 1

        def mode(self):
            return self.tm().state.ed_mode

        def toggle_scope(self):
            s = self.tm().state
            s.ed_scope = "all" if s.ed_scope == "item" else "item"
            s.edit_serial += 1

        def scope(self):
            return self.tm().state.ed_scope

        def toggle_preview(self):
            s = self.tm().state
            s.ed_preview = not s.ed_preview

        def reset_item(self):
            s = self.tm().state
            if self._all():
                s.default_edits = { }
                msg("공통 값의 저장 안 한 변경을 되돌렸습니다.")
            else:
                it = self._item()
                if it is not None:
                    self.tm().edits_for().pop(it.id, None)
                    msg("'{}' 항목의 저장 안 한 변경을 되돌렸습니다.".format(it.id))
            s.edit_serial += 1

        def discard(self):
            s = self.tm().state
            s.edits = { }
            s.pause_edits = { }
            s.default_edits = { }
            s.edit_serial += 1

        ## ── 글꼴·색 ──

        def value_label(self, key):
            return {
                "font": "글꼴", "color": "색",
                "hover_font": "선택됐을 때 글꼴", "hover_color": "선택됐을 때 색",
                }.get(key, key)

        def style_keys(self):
            if self._hover():
                return ("hover_font", "hover_color")
            return ("font", "color")

        def get_value(self, key):
            tm = self.tm()
            hover = key.startswith("hover_")
            name = key[6:] if hover else key

            if self._all():
                d = tm.common_values()
                if hover and key in d:
                    return d[key]
                return d.get(name, None)

            it = self._item()
            if it is None:
                return None
            props = it.hover_props if hover else it.base_props
            return props.get(name, None)

        def set_value(self, key, value):
            it = self._item()
            if it is None and not self._all():
                return
            self._set(it, **{ key : value })

        ## ── 저장 ──

        def pending(self):
            s = self.tm().state if self.tm() else None
            if s is None:
                return 0
            return len(s.edits) + len(getattr(s, "pause_edits", { })) + (1 if s.default_edits else 0)

        def _merged(self, menu="title"):
            tm = self.tm()
            layout = { }
            for k, v in tm.menu_layout(menu).items():
                layout[k] = dict(v)
            for k, v in tm.edits_for(menu).items():
                layout.setdefault(k, { }).update(v)

            common = dict(tm.cfg("layout_default"))
            common.update(tm.state.default_edits)
            return layout, common

        def _layout_lines(self, name, menu, layout):
            tm = self.tm()
            lines = [ "define tmenu.{} = {{".format(name) ]
            ids = [ it.id for it in tm.all_items(menu) ]
            keys = [ k for k in ids if k in layout ] + sorted(k for k in layout if k not in ids)
            for k in keys:
                lines.append('    "{}": {},'.format(k, self._entry(layout[k])))
            lines.append("}")
            lines.append("")
            return lines

        def layout_file(self):
            tm = self.tm()
            layout, common = self._merged()
            uk = store.ui_kit

            lines = uk.file_header("UI Kit 편집기가 저장한 타이틀 메뉴 배치입니다.", [
                "여기 적힌 값은 title_menu_config.rpy의 같은 값보다 우선합니다.",
                "직접 고쳐도 되지만, 편집기에서 다시 저장하면 덮어써집니다.",
                "이 파일을 지우면 설정 파일 값으로 돌아갑니다.",
                ])

            lines.append("## 항목별 값 (타이틀 메뉴)")
            lines.extend(self._layout_lines("layout", "title", layout))

            playout = self._merged("pause")[0]
            if playout:
                lines.append("## 항목별 값 (게임 중 ESC 메뉴)")
                lines.extend(self._layout_lines("pause_layout", "pause", playout))

            if common:
                lines.append("## 모든 항목 공통 값 (tmenu.default 위에 덮어씀)")
                lines.append("define tmenu.layout_default = {")
                lines.extend(uk.format_dict_lines(common, tm.EDIT_KEYS))
                lines.append("}")
                lines.append("")

            return ("title_menu_layout.rpy", "\n".join(lines))

        def _entry(self, d):
            tm = self.tm()
            order = [ k for k in tm.EDIT_KEYS if k in d ] + sorted(k for k in d if k not in tm.EDIT_KEYS)
            return "{" + ", ".join('"{}": {}'.format(k, store.ui_kit.format_value(d[k])) for k in order) + "}"

        def after_save(self):
            tm = self.tm()
            layout, common = self._merged()
            ## store 변수가 아니라 실행 중 값으로 (다시 불러올 때 옛 값이 덮지 않게, 3.17)
            tm.state.saved = store.python_dict(layout=layout, pause_layout=self._merged("pause")[0], layout_default=common)
            tm.state.edits = { }
            tm.state.pause_edits = { }
            tm.state.default_edits = { }
            tm.state.edit_serial += 1
            return False

        def copy_text(self):
            tm = self.tm()
            layout, common = self._merged(tm.current_menu())
            lines = [ ]

            if self._all():
                if common:
                    lines.append("# 모든 항목 공통 (tmenu.default에 붙여넣기)")
                    lines.extend(store.ui_kit.format_dict_lines(common, tm.EDIT_KEYS, indent=""))
                return "\n".join(lines)

            for it in tm.all_items():
                if it.id in layout:
                    lines.append("# {}\n{},".format(it.id, self._entry(layout[it.id])[1:-1]))

            return "\n".join(lines)

        ## ── 패널 ──

        def info_lines(self):
            tm = self.tm()
            it = self._item()
            items = tm.all_items()

            if it is None:
                return [ "메뉴 항목이 없습니다." ]

            x, y = tm.abs_pos(it)
            size = it.size or store.gui.interface_text_size

            rv = [ ]

            if self._all():
                d = tm.common_values()
                h = "hover_" if self._hover() else ""
                rv.append("모든 항목 공통 값을 바꿉니다. (보기: 항목 {}/{} {})".format(tm.state.ed_sel + 1, len(items), it.id))
                rv.append("회전 {}   기울기 {}   확대 {}   크기 {}".format(
                    d.get(h + "rotate", d.get("rotate", 0)), d.get(h + "skew", d.get("skew", 0)),
                    d.get(h + "zoom", d.get("zoom", 1.0)), d.get(h + "size", d.get("size", "-"))))
                own = sorted(k for k in it.own_keys if k in ("rotate", "skew", "zoom", "size", "font", "color",
                    "hover_rotate", "hover_skew", "hover_zoom", "hover_size", "hover_font", "hover_color"))
                if own:
                    rv.append("이 항목에 따로 정한 값이 있어 공통 값보다 우선: " + ", ".join(own))
            else:
                rv.append("{}  항목 {}/{}   id: {}".format("ESC 메뉴" if tm.current_menu() == "pause" else "타이틀 메뉴", tm.state.ed_sel + 1, len(items), it.id))
                if not self._hover():
                    rv.append("x {:.0f}   y {:.0f}   회전 {:.1f}   기울기 {:.1f}   확대 {:.2f}   크기 {}".format(
                        x, y, it.rotate, it.skew, it.zoom, size))
                else:
                    hsize = it.hover_props.get("size", size)
                    rv.append("이동 ({:.0f}, {:.0f})   회전 {:.1f}   기울기 {:.1f}   확대 {:.2f}   크기 {}".format(
                        it.h_offset[0], it.h_offset[1], it.h_rotate, it.h_skew, it.h_zoom, hsize))

            n = self.pending()
            rv.append("저장 안 한 변경: {}개".format(n) if n else "저장 안 한 변경 없음")
            return rv

        def help_lines(self):
            return [
                "마우스: 드래그 이동 (Shift: 한 방향) | 휠 회전 | Shift+휠 글자 크기",
                "방향키 이동 (Shift: 10배) | Q/E 회전 | Z/C 기울기 | A/D 확대 | S/W 글자 크기",
                "Tab 다음 항목 | 1/2 평소/선택됐을 때 | 3 이 항목만/공통 | H 미리보기 | Backspace 되돌리기",
                ]

        ## ── 다시 불러오기 뒤 이어서 ──

        def session(self):
            tm = self.tm()
            if tm is None:
                return { }
            s = tm.state
            return dict(sel=s.ed_sel, mode=s.ed_mode, scope=s.ed_scope, preview=s.ed_preview)

        def restore(self, d):
            tm = self.tm()
            if tm is None or not d:
                return
            s = tm.state
            s.ed_sel = d.get("sel", 0)
            s.ed_mode = d.get("mode", "base")
            s.ed_scope = d.get("scope", "item")
            s.ed_preview = d.get("preview", True)

        def box_color(self, i):
            s = self.tm().state
            if i == s.ed_sel:
                return "#ff3b8d66"
            if i == s.ed_hover:
                return "#3bd6ff44"
            return "#ffffff1c"

    register(TitleTab())


## 타이틀 메뉴 항목의 클릭 영역 표시
screen ui_editor_title_overlay():

    $ _items = tmenu.all_items()

    for i, it in enumerate(_items):
        $ _hx, _hy = tmenu.hit_offset(it)
        $ _ax, _ay = tmenu.abs_pos(it)

        frame:
            style "empty"
            background Solid(ui_editor.get_tab("title").box_color(i))
            pos (it.x, it.y)
            anchor it.anchor
            xoffset _hx
            yoffset _hy
            padding (it.hit_padding, it.hit_padding)
            at tmenu_base(it.rotate, it.skew, it.zoom)
            add it.ed_sizer

        add Solid("#ff3b8d" if i == tmenu.state.ed_sel else "#ffffff", xysize=(7, 7)) pos (int(_ax), int(_ay)) anchor (0.5, 0.5)

        text "[it.id]":
            style "ui_editor_text"
            size 12
            pos (int(_ax) + 6, int(_ay) + 4)


screen ui_editor_title_panel(tab):

    use ui_editor_style_row(tab, tab.style_keys())

    hbox:
        spacing 6
        textbutton ("H 미리보기 켬" if tmenu.state.ed_preview else "H 미리보기 끔") style "ui_editor_button" action Function(tab.toggle_preview)
        textbutton "이 항목 되돌리기" style "ui_editor_button" action Function(tab.reset_item)
        textbutton "모두 버리기" style "ui_editor_button" action Function(tab.discard)
