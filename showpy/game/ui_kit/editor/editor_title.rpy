################################################################################
## UI Kit — 편집기: 타이틀 메뉴 탭
##
## 타이틀 화면에서 메뉴 항목을 끌어서 배치하고, 회전·기울기·확대·글자 크기·
## 글꼴·색을 바꿉니다. 저장하면 title_menu_layout.rpy가 만들어집니다.
## 게임 중 ESC 메뉴(일시정지 메뉴)가 떠 있으면 그 메뉴를 고칩니다. (3.1)
## 제목, 부제 글자와 배경(그림, 영상), 글자 효과, 회전 손잡이 (3.19)
################################################################################

init offset = 1

init -8 python in ui_editor:

    import math

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

        ## 회전 손잡이: 고른 것의 기준점에서 이만큼 떨어진 곳 (픽셀)
        ROT_RADIUS = 60
        ROT_GRAB = 14

        ## ── 기본 ──

        def focus_rect(self):
            """고른 항목 둘레 (대략). 패널이 가리면 비킵니다."""
            tm = self.tm()
            try:
                it = self._item()
                if it is None:
                    return None
                ax, ay = tm.abs_pos(it)
            except Exception:
                return None
            return (ax - 140, ay - 80, 280, 120)

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
            if not tm.entries():
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
            tm.state.rot_drag = None
            tm.state.edit_serial += 1

        def _entries(self):
            return self.tm().entries()

        def _item(self, index=None):
            tm = self.tm()
            items = self._entries()
            if not items:
                return None
            if index is None:
                index = tm.state.ed_sel
            index = max(0, min(index, len(items) - 1))
            return items[index]

        def _is_label(self, it):
            return bool(getattr(it, "is_label", False))

        def _all(self):
            return self.tm().state.ed_scope == "all"

        def _hover(self):
            return self.tm().state.ed_mode == "hover"

        def _label_edits(self):
            tm = self.tm()
            return tm.state.label_edits.setdefault(tm.current_menu(), { })

        def _set(self, it, **kw):
            s = self.tm().state
            if it is not None and self._is_label(it):
                ## 제목, 부제는 늘 그 글자 하나에만
                self._label_edits().setdefault(it.id, { }).update(kw)
            elif self._all():
                s.default_edits.update(kw)
            else:
                self.tm().edits_for().setdefault(it.id, { }).update(kw)
            s.edit_serial += 1

        def _unset(self, it, key):
            s = self.tm().state
            if it is not None and self._is_label(it):
                self._label_edits().setdefault(it.id, { }).pop(key, None)
            elif self._all():
                s.default_edits.pop(key, None)
            elif it is not None:
                self.tm().edits_for().setdefault(it.id, { }).pop(key, None)
            s.edit_serial += 1

        def set_key(self, key, value):
            """앱이나 패널에서 값 하나 바꾸기. value가 None이면 그 값을 지움(설정 파일대로)."""
            it = self._item()
            if it is None:
                return
            if key in ("x", "y"):
                x, y = self.tm().abs_pos(it)
                if key == "x":
                    x = float(value)
                else:
                    y = float(value)
                self._set_pos(it, x, y, base=True)
                return
            if value is None:
                self._unset(it, key)
            else:
                self._set(it, **{ key : value })

        ## ── 위치 ──

        def _start_pos(self, it):
            tm = self.tm()
            if self._hover() and not self._is_label(it):
                bx, by = tm.abs_pos(it)
                return (bx + it.h_offset[0], by + it.h_offset[1])
            return tm.abs_pos(it)

        def _set_pos(self, it, x, y, base=False):
            tm = self.tm()
            if self._is_label(it):
                self._label_edits().setdefault(it.id, { }).update(
                    x=int(round(x)), y=int(round(y)), anchor=it.anchor)
            elif self._hover() and not base:
                bx, by = tm.abs_pos(it)
                tm.edits_for().setdefault(it.id, { }).update(
                    hover_offset=(int(round(x - bx)), int(round(y - by))))
            else:
                tm.edits_for().setdefault(it.id, { }).update(
                    x=int(round(x)), y=int(round(y)), anchor=it.anchor)
            tm.state.edit_serial += 1

        def _no_pos_in_all(self, it=None):
            if it is not None and self._is_label(it):
                return False
            if self._all():
                msg("위치는 항목마다 정합니다. 3을 눌러 '이 항목만'으로 바꾸세요.")
                return True
            return False

        ## ── 회전 손잡이 (3.19): 고른 것 위의 작은 네모를 끌면 돌아감 ──

        def rot_center(self, it):
            """글자가 도는 가운데 (화면 픽셀)와 글자 높이. 회전은 글자 가운데를 축으로 합니다."""
            ax, ay = self.tm().abs_pos(it)
            d = getattr(it, "idle_disp", None) or getattr(it, "disp", None)
            try:
                w, h = d.size()
            except Exception:
                w, h = (0, 0)
            z = float(getattr(it, "zoom", 1.0) or 1.0)
            return (ax + (0.5 - it.anchor[0]) * w, ay + (0.5 - it.anchor[1]) * h, h * z)

        def rot_radius(self, it):
            return self.rot_center(it)[2] / 2.0 + self.ROT_RADIUS * 0.6

        def rot_handle(self, it=None):
            """회전 손잡이 자리 (x, y). 글자 가운데에서 회전 방향으로 위쪽."""
            it = it or self._item()
            if it is None:
                return None
            cx, cy, _h = self.rot_center(it)
            rr = self.rot_radius(it)
            r = math.radians(float(self._cur(it, "rotate", 0.0)))
            return (cx + rr * math.sin(r), cy - rr * math.cos(r))

        def _rot_begin(self, x, y):
            it = self._item()
            h = self.rot_handle(it)
            if h is None:
                return None
            if abs(x - h[0]) > self.ROT_GRAB or abs(y - h[1]) > self.ROT_GRAB:
                return None
            self.tm().state.rot_drag = self.tm().state.ed_sel
            return ("rot", self.tm().state.ed_sel)

        def _rot_move(self, index):
            it = self._item(index)
            if it is None:
                return
            ax, ay, _h = self.rot_center(it)
            mx, my = store.renpy.get_mouse_pos()
            if abs(mx - ax) + abs(my - ay) < 4:
                return
            deg = math.degrees(math.atan2(mx - ax, -(my - ay)))
            try:
                snap = bool(pygame.key.get_mods() & pygame.KMOD_SHIFT)
            except Exception:
                snap = False
            deg = round(deg / 15.0) * 15.0 if snap else round(deg, 1)
            key = "rotate" if (self._is_label(it) or not self._hover()) else "hover_rotate"
            self._set(it, **{ key : deg })

        def drag_begin(self, x, y):
            tm = self.tm()
            tok = self._rot_begin(x, y)
            if tok is not None:
                return tok
            under = tm.focused_index()
            if under is None:
                return None
            tm.state.ed_sel = under
            tm.state.ed_hover = under
            it = self._item(under)
            if self._no_pos_in_all(it):
                return None
            sx, sy = self._start_pos(it)
            return (under, sx, sy)

        def drag_move(self, token, dx, dy):
            if token[0] == "rot":
                self._rot_move(token[1])
                return
            index, sx, sy = token
            self._set_pos(self._item(index), sx + dx, sy + dy)

        def drag_end(self, token):
            self.tm().state.rot_drag = None

        def move(self, dx, dy):
            it = self._item()
            if it is None or self._no_pos_in_all(it):
                return
            x, y = self._start_pos(it)
            self._set_pos(it, x + dx, y + dy)

        ## ── 모양 ──

        def _cur(self, it, key, fallback):
            """지금 값. key는 hover_ 없는 이름."""
            tm = self.tm()
            hover = self._hover() and not self._is_label(it)

            if self._all() and not self._is_label(it):
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
            if key == "effect":
                return getattr(it, "effect", None)
            return fallback

        def _key(self, key, it=None):
            it = it or self._item()
            if it is not None and self._is_label(it):
                return key
            return ("hover_" + key) if self._hover() else key

        def nudge(self, what, amount):
            it = self._item()
            if it is None:
                return

            if what == "rotate":
                self._set(it, **{ self._key("rotate", it) : round(float(self._cur(it, "rotate", 0.0)) + amount, 2) })
            elif what == "skew":
                self._set(it, **{ self._key("skew", it) : round(float(self._cur(it, "skew", 0.0)) + amount, 2) })
            elif what == "zoom":
                self._set(it, **{ self._key("zoom", it) : round(max(0.05, float(self._cur(it, "zoom", 1.0)) + amount), 2) })
            elif what == "size":
                cur = self._cur(it, "size", store.gui.interface_text_size)
                self._set(it, **{ self._key("size", it) : int(max(4, int(cur) + amount)) })

        def wheel(self, sign, shift):
            tm = self.tm()
            under = tm.focused_index()
            if under is not None:
                tm.state.ed_sel = under
            if shift:
                self.nudge("size", -sign)
            else:
                self.nudge("rotate", sign)

        ## 글자 효과 (3.19)

        def effect(self):
            it = self._item()
            if it is None:
                return None
            return self._cur(it, "effect", None)

        def set_effect(self, name):
            self.set_key("effect", name)

        def effect_label(self):
            name = self.effect()
            for n, l in self.tm().effect_names(all=True):
                if n == name:
                    return l
            return str(name)

        ## ── 선택·모드 ──

        def select(self, step):
            s = self.tm().state
            n = len(self._entries())
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
            it = self._item()
            if it is not None and self._is_label(it):
                self._label_edits().pop(it.id, None)
                msg("'{}' 글자의 저장 안 한 변경을 되돌렸습니다.".format(it.name))
            elif self._all():
                s.default_edits = { }
                msg("공통 값의 저장 안 한 변경을 되돌렸습니다.")
            elif it is not None:
                self.tm().edits_for().pop(it.id, None)
                msg("'{}' 항목의 저장 안 한 변경을 되돌렸습니다.".format(it.id))
            s.edit_serial += 1

        def discard(self):
            s = self.tm().state
            s.edits = { }
            s.pause_edits = { }
            s.default_edits = { }
            s.label_edits = { "title": { }, "pause": { } }
            s.screen_edits = { }
            s.edit_serial += 1

        ## ── 배경 (3.19) ──

        def bg_key(self):
            return "pause_background" if self.tm().current_menu() == "pause" else "background"

        def background(self):
            return self.tm().screen_value(self.bg_key())

        def set_background(self, path):
            tm = self.tm()
            key = self.bg_key()
            path = path or None
            base = (tm.cfg("screen_layout") or { }).get(key, tm.cfg(key))
            if path == base:
                tm.state.screen_edits.pop(key, None)
            else:
                tm.state.screen_edits[key] = path
            tm.state.edit_serial += 1
            store.renpy.restart_interaction()

        def background_label(self):
            p = self.background()
            if not p:
                return "없음 (검은 화면)" if self.bg_key() == "background" else "없음 (투명)"
            return short_path(p)

        def background_files(self):
            """배경으로 고를 수 있는 그림, 영상 (game 폴더 기준)."""
            uk = store.ui_kit
            return uk.game_files((".png", ".webp", ".jpg", ".jpeg", ".avif") + self.tm().MOVIE_EXTS)

        ## ── 글꼴·색 ──

        def value_label(self, key):
            if key == "background":
                return "배경"
            return {
                "font": "글꼴", "color": "색",
                "hover_font": "선택됐을 때 글꼴", "hover_color": "선택됐을 때 색",
                }.get(key, key)

        def style_keys(self):
            it = self._item()
            if self._hover() and not (it is not None and self._is_label(it)):
                return ("hover_font", "hover_color")
            return ("font", "color")

        def get_value(self, key):
            tm = self.tm()
            if key == "background":
                return self.background()
            hover = key.startswith("hover_")
            name = key[6:] if hover else key
            it = self._item()

            if self._all() and not (it is not None and self._is_label(it)):
                d = tm.common_values()
                if hover and key in d:
                    return d[key]
                return d.get(name, None)

            if it is None:
                return None
            props = it.hover_props if hover else it.base_props
            return props.get(name, None)

        def set_value(self, key, value):
            if key == "background":
                self.set_background(value)
                return
            it = self._item()
            if it is None and not self._all():
                return
            self._set(it, **{ key : value })

        ## ── 저장 ──

        def pending(self):
            s = self.tm().state if self.tm() else None
            if s is None:
                return 0
            n = len(s.edits) + len(getattr(s, "pause_edits", { })) + (1 if s.default_edits else 0)
            n += sum(len(v) for v in getattr(s, "label_edits", { }).values())
            n += len(getattr(s, "screen_edits", { }))
            return n

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

        def _merged_labels(self, menu):
            tm = self.tm()
            rv = { }
            for k, v in (tm.cfg("pause_label_layout" if menu == "pause" else "label_layout") or { }).items():
                rv[k] = dict(v)
            for k, v in tm.state.label_edits.get(menu, { }).items():
                rv.setdefault(k, { }).update(v)
            return { k : v for k, v in rv.items() if v }

        def _merged_screen(self):
            tm = self.tm()
            rv = dict(tm.cfg("screen_layout") or { })
            rv.update(tm.state.screen_edits)
            return rv

        def _layout_lines(self, name, menu, layout, ids=None):
            tm = self.tm()
            lines = [ "define tmenu.{} = {{".format(name) ]
            if ids is None:
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

            for menu, name, title in (("title", "label_layout", "타이틀"), ("pause", "pause_label_layout", "게임 중 ESC 메뉴")):
                lab = self._merged_labels(menu)
                if lab:
                    lines.append("## 제목, 부제 ({})".format(title))
                    lines.extend(self._layout_lines(name, menu, lab, ids=list(tm.LABEL_IDS)))

            scr = self._merged_screen()
            if scr:
                lines.append("## 배경 (background 타이틀, pause_background ESC 메뉴. None = 타이틀은 검은 화면, ESC 메뉴는 투명)")
                lines.append("define tmenu.screen_layout = {")
                lines.extend(uk.format_dict_lines(scr, ("background", "pause_background")))
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
            tm.state.saved = store.python_dict(layout=layout, pause_layout=self._merged("pause")[0], layout_default=common,
                label_layout=self._merged_labels("title"), pause_label_layout=self._merged_labels("pause"),
                screen_layout=self._merged_screen())
            tm.state.edits = { }
            tm.state.pause_edits = { }
            tm.state.default_edits = { }
            tm.state.label_edits = { "title": { }, "pause": { } }
            tm.state.screen_edits = { }
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
            items = self._entries()

            if it is None:
                return [ "메뉴 항목이 없습니다." ]

            x, y = tm.abs_pos(it)
            size = it.size or store.gui.interface_text_size
            where = "ESC 메뉴" if tm.current_menu() == "pause" else "타이틀 메뉴"

            rv = [ ]

            if self._is_label(it):
                rv.append("{}  {} 글자 ({}/{})".format(where, it.name, tm.state.ed_sel + 1, len(items)))
                rv.append("x {:.0f}   y {:.0f}   회전 {:.1f}   확대 {:.2f}   크기 {}   효과 {}".format(
                    x, y, it.rotate, it.zoom, size, self.effect_label()))
                if it.empty:
                    rv.append("글자가 비어 있어서 화면에 안 보입니다. 내용은 PyKaki 앱의 타이틀 메뉴 칸에서 적습니다.")
            elif self._all():
                d = tm.common_values()
                h = "hover_" if self._hover() else ""
                rv.append("모든 항목 공통 값을 바꿉니다. (보기: 항목 {}/{} {})".format(tm.state.ed_sel + 1, len(items), it.id))
                rv.append("회전 {}   기울기 {}   확대 {}   크기 {}".format(
                    d.get(h + "rotate", d.get("rotate", 0)), d.get(h + "skew", d.get("skew", 0)),
                    d.get(h + "zoom", d.get("zoom", 1.0)), d.get(h + "size", d.get("size", "-"))))
                own = sorted(k for k in it.own_keys if k in ("rotate", "skew", "zoom", "size", "font", "color", "effect",
                    "hover_rotate", "hover_skew", "hover_zoom", "hover_size", "hover_font", "hover_color"))
                if own:
                    rv.append("이 항목에 따로 정한 값이 있어 공통 값보다 우선: " + ", ".join(own))
            else:
                rv.append("{}  항목 {}/{}   id: {}".format(where, tm.state.ed_sel + 1, len(items), it.id))
                if not self._hover():
                    rv.append("x {:.0f}   y {:.0f}   회전 {:.1f}   기울기 {:.1f}   확대 {:.2f}   크기 {}".format(
                        x, y, it.rotate, it.skew, it.zoom, size))
                else:
                    hsize = it.hover_props.get("size", size)
                    rv.append("이동 ({:.0f}, {:.0f})   회전 {:.1f}   기울기 {:.1f}   확대 {:.2f}   크기 {}".format(
                        it.h_offset[0], it.h_offset[1], it.h_rotate, it.h_skew, it.h_zoom, hsize))

            rv.append("배경: " + self.background_label())
            n = self.pending()
            rv.append("저장 안 한 변경: {}개".format(n) if n else "저장 안 한 변경 없음")
            return rv

        def help_lines(self):
            return [
                "마우스: 드래그 이동 (Shift: 한 방향) | 분홍 네모 끌기: 회전 (Shift: 15도씩) | 휠 회전 | Shift+휠 글자 크기",
                "방향키 이동 (Shift: 10배) | Q/E 회전 | Z/C 기울기 | A/D 확대 | S/W 글자 크기",
                "Tab 다음 항목 (제목, 부제 포함) | 1/2 평소/선택됐을 때 | 3 이 항목만/공통 | H 미리보기 | Backspace 되돌리기",
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


## 회전 손잡이 줄 (기준점 → 손잡이)
transform ui_editor_rot_line(x, y, r, length):
    pos (x, y)
    anchor (0.5, 1.0)
    transform_anchor True
    rotate r
    xysize (2, length)


## 타이틀 메뉴 항목의 클릭 영역 표시
screen ui_editor_title_overlay():

    $ _tab = ui_editor.get_tab("title")
    $ _items = tmenu.all_items()
    $ _n = len(_items)

    for i, it in enumerate(_items):
        $ _hx, _hy = tmenu.hit_offset(it)
        $ _ax, _ay = tmenu.abs_pos(it)

        frame:
            style "empty"
            background Solid(_tab.box_color(i))
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

    ## 제목, 부제 (3.19)
    for it in tmenu.label_items():
        $ _ax, _ay = tmenu.abs_pos(it)
        frame:
            style "empty"
            background Solid(_tab.box_color(_n + it.index))
            pos (it.x, it.y)
            anchor it.anchor
            padding (it.hit_padding, it.hit_padding)
            at tmenu_base(it.rotate, it.skew, it.zoom)
            add it.ed_sizer
        add Solid("#ff3b8d" if (_n + it.index) == tmenu.state.ed_sel else "#ffffff", xysize=(7, 7)) pos (int(_ax), int(_ay)) anchor (0.5, 0.5)
        text (it.name + (" (비어 있음)" if it.empty else "")):
            style "ui_editor_text"
            size 12
            pos (int(_ax) + 6, int(_ay) + 4)

    ## 회전 손잡이: 고른 것 위의 분홍 네모를 끌면 돌아감 (3.19)
    $ _sel = _tab._item()
    $ _h = _tab.rot_handle()
    if _sel is not None and _h is not None:
        $ _sx, _sy, _sh = _tab.rot_center(_sel)
        $ _r = float(_tab._cur(_sel, "rotate", 0.0))
        add Solid("#ff3b8daa") at ui_editor_rot_line(int(_sx), int(_sy), _r, int(_tab.rot_radius(_sel)))
        add Solid("#ff3b8d", xysize=(16, 16)) pos (int(_h[0]), int(_h[1])) anchor (0.5, 0.5)
        add Solid("#ffffff", xysize=(6, 6)) pos (int(_h[0]), int(_h[1])) anchor (0.5, 0.5)


screen ui_editor_title_panel(tab):

    use ui_editor_style_row(tab, tab.style_keys())

    ## 글자 효과 (3.19): 대사 등장 효과를 메뉴 글자, 제목, 부제에도
    hbox:
        spacing 4
        box_wrap True
        box_wrap_spacing 4
        xmaximum 632
        text "글자 효과:" style "ui_editor_text" yalign 0.5
        $ _ef = tab.effect()
        for _n, _nl in tmenu.effect_names(keep=_ef):
            textbutton _nl style "ui_editor_button" text_size 13 action Function(tab.set_effect, _n) selected (_ef == _n)

    ## 배경 (3.19): 그림이나 webm 영상. 없으면 타이틀은 검은 화면, ESC 메뉴는 투명
    hbox:
        spacing 6
        text "배경:" style "ui_editor_text" yalign 0.5
        textbutton tab.background_label() style "ui_editor_button" text_size 13 action Function(ui_editor.open_popup, "background", "background")
        if tab.background():
            textbutton "없애기" style "ui_editor_button" text_size 13 action Function(tab.set_background, None)

    hbox:
        spacing 6
        textbutton ("H 미리보기 켬" if tmenu.state.ed_preview else "H 미리보기 끔") style "ui_editor_button" action Function(tab.toggle_preview)
        textbutton "이 항목 되돌리기" style "ui_editor_button" action Function(tab.reset_item)
        textbutton "모두 버리기" style "ui_editor_button" action Function(tab.discard)
