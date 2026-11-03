################################################################################
## UI Kit — 편집기: 이미지/영상 탭
##
## 원고의 show / hide / scene 줄 하나를 골라 위치와 전환 효과를 고칩니다.
##   - 화면의 그림·영상을 누르면 그것을 띄운 줄이 골라지고, 끌면 위치가 바뀝니다.
##   - 위치 버튼(왼쪽, 가운데 …), 전환 효과(서서히, 이동 …)와 방향·시간
##   - 같은 원고 파일의 show/hide/scene 줄을 줄 번호와 함께 목록으로 보여주고,
##     [ ] 키로 앞뒤 줄, 줄 번호 입력, "그 줄로 가기"(렌파이의 줄 이동)
##   - R: 지금 장면을 다시 보여주기 (지난 대사 뒤에 실행된 줄의 전환을 미리 봄)
##
## Ctrl+S로 저장하면 원고의 그 줄에서 at 절과 with 절만 바꿉니다.
##     show eileen happy at stage.pos(420, 720) with Dissolve(1.0)
## 원본은 프로젝트 폴더의 ui_kit_backup/에 남습니다.
################################################################################

init offset = 1

init -8 python in ui_editor:

    def esc(s):
        """원고 글자를 렌파이 텍스트로 그대로 보여주기 ([ 와 { 를 글자로)."""
        return s.replace("[", "[[").replace("{", "{{")

    class StageTab(Tab):

        id = "stage"
        label = "이미지/영상"
        panel_screen = "ui_editor_stage_panel"
        overlay_screen = "ui_editor_stage_overlay"
        uses_mode = False
        uses_scope = False
        shows_line = True
        copy_hint = "원고에 바로 저장되지 않는 줄에 쓰세요. 그 줄을 이 줄로 바꿔 붙여넣습니다."

        TIMES = (0.3, 0.5, 0.8, 1.0, 1.5, 2.0, 3.0)
        LIST_ROWS = 7

        def __init__(self):
            self.sel = None             # (파일, 줄)
            self.list_open = True
            self.previewed = False      # 끌기 등으로 화면을 직접 바꿨음 (닫을 때 다시 보여줌)
            self._stmts = { }           # 파일 → [(줄, 종류, 문장)]
            self._lines = { }           # 파일 → (수정 시각, 줄 목록)
            self.add_lines = { }        # (파일, 줄) → [그 줄 아래에 넣을 새 줄, …]  (3.0)
            self.add_before = { }       # (파일, 줄) → [지금 대사 앞에 넣을 새 줄, …]  (3.2)
            self.pos_scope = "box"      # PyKaki 원고의 위치 저장 범위: "box" 이 상자에서만 / "all" 어디서나
            self.media_sel = None       # 그림/영상 고르기 창에서 고른 것 (이름)
            self.media_filter = "all"   # "all" / "image" / "movie"

        def st(self):
            return getattr(store, "stage", None)

        ## ── PyKaki 원고 (3.2): 위치는 stage_layout.rpy에 저장 ──

        def pk(self, key=None):
            key = key or self.sel
            se = self.se()
            return key is not None and se is not None and hasattr(se, "is_pykaki") and se.is_pykaki(key[0])

        def tag_of(self, key):
            s = self.stmt(key)
            if s is None:
                return None
            parts = self.st().imspec_parts(s[2])
            if parts is None:
                return None
            return parts[2] or (parts[0][0] if parts[0] else None)

        def placed_for(self, key):
            return self.st().placed_expr(self.se().box_of(key[0], key[1]), self.tag_of(key))

        def set_scope(self, v):
            self.pos_scope = v
            store.renpy.restart_interaction()

        def pk_pos_edits(self):
            """위치가 바뀐 PyKaki 원고의 줄 [(줄 위치, 편집 값)]"""
            return [ (k, e) for k, e in self.st().rt.edits.items() if e and "at" in e and self.pk(k) ] if self.st() is not None else [ ]

        def pending(self):
            return bool(self.pk_pos_edits())

        def _placed_after(self):
            st = self.st()
            se = self.se()
            rv = dict(st.placed)
            for key, e in self.pk_pos_edits():
                tag = self.tag_of(key)
                if tag is None:
                    continue
                box = se.box_of(key[0], key[1])
                expr = st.split_at(list(e["at"]))[0]
                rv.pop((box, tag), None)
                if self.pos_scope == "all":
                    rv.pop(tag, None)
                    if expr:
                        rv[tag] = expr
                elif expr:
                    rv[(box, tag)] = expr
            return rv

        def layout_file(self):
            uk = store.ui_kit
            lines = uk.file_header("showpy 편집기가 저장한 그림 자리입니다.", [
                "PyKaki에서 다시 내보내도 지워지지 않습니다.",
                '"ghost"는 어디서나, ("n4", "ghost")는 상자 n4에서만 쓰는 자리입니다.',
                "이 파일을 지우면 그림이 렌파이 기본 자리로 돌아갑니다.",
                ])
            lines.append("define stage.placed = {")
            for k, v in sorted(self._placed_after().items(), key=lambda i: str(i[0])):
                lines.append("    {}: {},".format(repr(k), repr(v)))
            lines.append("}")
            lines.append("")
            return ("stage_layout.rpy", "\n".join(lines))

        def after_save(self):
            st = self.st()
            st.placed = self._placed_after()
            for key, e in self.pk_pos_edits():
                e.pop("at", None)
                if not e:
                    st.rt.edits.pop(key, None)
            return False

        def se(self):
            return getattr(store, "script_edit", None)

        ## ── 쓸 수 있는지 ──

        def available(self):
            st = self.st()
            if st is None:
                return (False, "이미지/영상 기능이 없습니다.")
            if not st.on():
                return (False, "이미지/영상 기능이 꺼져 있습니다. (stage.enabled)")
            if getattr(store, "main_menu", False):
                return (False, "게임을 진행하는 중에 쓸 수 있습니다.")
            try:
                if store.renpy.context_nesting_level() > 0:
                    return (False, "게임 메뉴(저장, 불러오기 등)를 닫으면 쓸 수 있습니다.")
            except Exception:
                pass
            if current_node() is None:
                return (False, "스크립트를 진행하는 중에 쓸 수 있습니다.")
            return (True, "")

        ## ── 원고의 이미지 줄 ──

        def kind_of(self, node):
            import renpy
            st = self.st()
            if isinstance(node, renpy.ast.Show):
                kind = "show"
            elif isinstance(node, renpy.ast.Scene):
                if not node.imspec:
                    return None
                kind = "scene"
            elif isinstance(node, renpy.ast.Hide):
                kind = "hide"
            else:
                return None
            parts = st.imspec_parts(node)
            if parts is None or parts[1]:
                return None         # show expression … 은 고치지 않음
            return kind

        def statements(self, filename):
            """그 원고 파일의 show/hide/scene 줄 [(줄, 종류, 문장)] (줄 순서)."""
            if filename in self._stmts:
                return self._stmts[filename]
            import renpy
            script = renpy.game.script
            nodes = getattr(script, "all_stmts", None) or list(script.namemap.values())
            seen = set()
            rv = [ ]
            for n in nodes:
                if getattr(n, "filename", None) != filename:
                    continue
                kind = self.kind_of(n)
                if kind is None or n.linenumber in seen:
                    continue
                seen.add(n.linenumber)
                rv.append((n.linenumber, kind, n))
            rv.sort(key=lambda i: i[0])
            self._stmts[filename] = rv
            return rv

        def stmt(self, key):
            if key is None:
                return None
            for line, kind, node in self.statements(key[0]):
                if line == key[1]:
                    return (line, kind, node)
            return None

        def file_lines(self, filename):
            se = self.se()
            if se is None:
                return None
            path = se.resolve(filename)
            if path is None:
                return None
            import os
            try:
                mt = os.path.getmtime(path)
            except Exception:
                return None
            c = self._lines.get(filename)
            if c is None or c[0] != mt:
                try:
                    _bom, lines = se._read(path)
                except Exception:
                    return None
                c = (mt, [ se._split_eol(l)[0] for l in lines ])
                self._lines[filename] = c
            return c[1]

        def source(self, key):
            lines = self.file_lines(key[0])
            if lines is None or not (1 <= key[1] <= len(lines)):
                return None
            return lines[key[1] - 1]

        def parsed(self, key):
            """(ImageLine 또는 None, 이유)"""
            s = self.stmt(key)
            se = self.se()
            text = self.source(key)
            if s is None or se is None or text is None:
                return (None, "원고에서 이 줄을 읽을 수 없습니다.")
            try:
                return (se.parse_image_line(text, s[1]), "")
            except se.LineError as e:
                return (None, str(e))

        ## ── 지금 고르는 줄 ──

        def cur_file(self):
            if self._valid(self.sel):
                return self.sel[0]
            n = self.game_node()
            return n.filename if n is not None else None

        def _valid(self, key):
            return key is not None and self.st().game_file(key[0]) and self.stmt(key) is not None

        def game_node(self):
            """지금 실행 중인 문장. 렌파이 안쪽 파일(renpy/common/…)이면 None."""
            n = current_node()
            if n is None or not self.st().game_file(n.filename):
                return None
            return n

        def pick_default(self):
            rt = self.st().rt
            node = self.game_node()
            if self._valid(self.sel) and node is not None and self.sel[0] == node.filename:
                return
            for key in reversed(rt.window):
                if self._valid(key):
                    self.sel = key
                    return
            if node is not None:
                stmts = self.statements(node.filename)
                before = [ s for s in stmts if s[0] <= node.linenumber ]
                if before:
                    self.sel = (node.filename, before[-1][0])
                    return
                if stmts:
                    self.sel = (node.filename, stmts[0][0])
                    return
            self.sel = None

        def set_sel(self, key):
            if not self._valid(key):
                return
            self.sel = key
            msg("")

        def on_open(self):
            if self.available()[0]:
                self.pick_default()

        def on_close(self):
            st = self.st()
            if st is not None:
                st.rt.injected = st.rt.injected or self.previewed

        def replay_on_close(self):
            st = self.st()
            rv = bool(self.previewed or (st is not None and st.rt.injected))
            self.previewed = False
            if st is not None:
                st.rt.injected = False
            return rv

        ## ── 줄 이동 ──

        def step_line(self, step):
            fn = self.cur_file()
            if fn is None:
                return
            stmts = self.statements(fn)
            if not stmts:
                msg("이 원고 파일에는 show/hide/scene 줄이 없습니다.")
                return
            lines = [ s[0] for s in stmts ]
            if self.sel is None or self.sel[1] not in lines:
                self.set_sel((fn, lines[0]))
                return
            k = lines.index(self.sel[1]) + step
            k = max(0, min(len(lines) - 1, k))
            self.set_sel((fn, lines[k]))

        def goto_number(self, n):
            fn = self.cur_file()
            if fn is None:
                return
            stmts = self.statements(fn)
            if not stmts:
                return
            after = [ s for s in stmts if s[0] >= n ]
            self.set_sel((fn, (after[0] if after else stmts[-1])[0]))
            if self.sel[1] != n:
                msg("{}번째 줄은 show/hide/scene 줄이 아니라서 가장 가까운 {}번째 줄을 골랐습니다.".format(n, self.sel[1]))

        def to_current(self):
            self.sel = None
            self.pick_default()
            msg("")

        def nearby(self):
            """목록에 보여줄 줄 [(줄, 종류, 원고 글자, 고른 것인지, 지금 장면인지, 저장 안 한 변경이 있는지)]"""
            fn = self.cur_file()
            if fn is None:
                return [ ]
            stmts = self.statements(fn)
            if not stmts:
                return [ ]
            lines = [ s[0] for s in stmts ]
            k = lines.index(self.sel[1]) if (self.sel is not None and self.sel[1] in lines) else 0
            half = self.LIST_ROWS // 2
            lo = max(0, min(k - half, len(stmts) - self.LIST_ROWS))
            rt = self.st().rt
            rv = [ ]
            for line, kind, node in stmts[lo:lo + self.LIST_ROWS]:
                key = (fn, line)
                text = (self.source(key) or kind).strip()
                if len(text) > 54:
                    text = text[:53] + "…"
                rv.append((line, kind, esc(text), key == self.sel, key in rt.window, bool(rt.edits.get(key))))
            return rv

        def warp(self):
            if self.sel is None:
                return
            fn = self.sel[0].replace("\\", "/")
            state.message = "{}번째 줄로 갑니다. (그 앞의 변수 값은 비어 있을 수 있음)".format(self.sel[1])
            remember_session()
            try:
                store.renpy.warp_to_line("{}:{}".format(fn, self.sel[1]))
            except Exception as e:
                msg(esc("줄로 가지 못했습니다: {}".format(e)))

        ## ── 화면의 그림 ──

        def shown_list(self):
            """지금 화면에 있고, 원고의 줄로 띄운 그림 [(층, 태그, (파일, 줄), 이름)] (뒤 → 앞)"""
            rt = self.st().rt
            rv = [ ]
            layers = [ "master" ]
            for lay in sorted(set(k[0] for k in rt.shown)):
                if lay not in layers:
                    layers.append(lay)
            for lay in layers:
                try:
                    tags = store.renpy.get_showing_tags(lay, sort=True)
                except Exception:
                    continue
                for t in tags:
                    e = rt.shown.get((lay, t))
                    if e is not None:
                        rv.append((lay, t, e[0], e[1]))
            return rv

        def bounds(self, layer, tag):
            try:
                return store.renpy.get_image_bounds(tag, layer=layer)
            except Exception:
                return None

        def sel_shown(self):
            """고른 줄이 띄운 그림이 지금 화면에 있으면 (층, 태그, 이름)"""
            for lay, t, key, name in self.shown_list():
                if key == self.sel:
                    return (lay, t, name)
            return None

        def focus_rect(self):
            s = self.sel_shown()
            if s is None:
                return None
            return self.bounds(s[0], s[1])

        def anchor_point(self, layer, tag):
            b = self.bounds(layer, tag)
            if b is None:
                return None
            ax, ay = self.st().cfg("anchor")
            return (b[0] + b[2] * ax, b[1] + b[3] * ay)

        ## ── 값 ──

        def kind(self):
            s = self.stmt(self.sel)
            return s[1] if s is not None else None

        def orig_name(self):
            s = self.stmt(self.sel)
            if s is None:
                return ()
            return tuple(self.st().imspec_parts(s[2])[0])

        def name(self):
            e = self.edit()
            if e.get("name"):
                return tuple(e["name"].split())
            return self.orig_name()

        def sel_tag(self):
            """고른 줄이 띄우는 그림의 태그 (as로 적었으면 그 이름, 아니면 이름의 첫 단어)"""
            s = self.stmt(self.sel)
            if s is None:
                return None
            parts = self.st().imspec_parts(s[2])
            if parts is None:
                return None
            return parts[2] or (parts[0][0] if parts[0] else None)

        def sel_is_bg(self):
            """고른 줄이 배경(stage.bg_tag)이면 True. 배경은 위치를 옮기지 않습니다."""
            return self.st().is_bg(self.sel_tag())

        BG_LOCKED = "배경(bg)은 위치를 옮기지 않습니다. (전환은 고칠 수 있음)"

        def edit(self, create=False):
            rt = self.st().rt
            if create and self.sel not in rt.edits:
                rt.edits[self.sel] = { }
                se = self.se()
                if se is not None:
                    se.remember(self.sel[0], self.sel[1])
            return rt.edits.get(self.sel, { })

        def orig(self):
            """원고에 적힌 (at 목록, with 식). 읽을 수 없으면 None"""
            p, _why = self.parsed(self.sel)
            if p is None:
                return None
            at = list(p.at or [ ])
            if not at and self.pk():
                expr = self.placed_for(self.sel)
                if expr:
                    at = [ expr ]
            return (at, p.with_ or "")

        def cur_at(self):
            e = self.edit()
            if "at" in e:
                return list(e["at"])
            o = self.orig()
            return o[0] if o else [ ]

        def cur_with(self):
            e = self.edit()
            if "with" in e:
                return e["with"]
            o = self.orig()
            return o[1] if o else ""

        def cur_pos(self):
            return self.st().split_at(self.cur_at())[0]

        def with_spec(self):
            return self.st().parse_with(self.cur_with())

        def _tidy(self):
            """원고와 같아진 값은 지웁니다."""
            rt = self.st().rt
            e = rt.edits.get(self.sel)
            o = self.orig()
            if e is None or o is None:
                return
            if "at" in e and list(e["at"]) == o[0]:
                e.pop("at")
            if "with" in e and e["with"] == o[1]:
                e.pop("with")
            if "name" in e and tuple(e["name"].split()) == self.orig_name():
                e.pop("name")
            if not e:
                rt.edits.pop(self.sel, None)

        def _editable(self):
            if self.sel is None:
                msg("고를 줄이 없습니다.")
                return False
            p, why = self.parsed(self.sel)
            if p is None:
                msg(esc("이 줄은 고칠 수 없습니다: " + why))
                return False
            return True

        ## 위치

        def set_pos(self, expr, live=True):
            if not self._editable():
                return
            if self.kind() == "hide":
                msg("hide 줄에는 위치가 없습니다.")
                return
            if self.sel_is_bg() and expr is not None:
                ## 배경은 옮기지 않음. 예전에 적어 둔 위치를 지우는 것(기본 위치로)만 됨
                msg(self.BG_LOCKED)
                return
            st = self.st()
            _p, rest = st.split_at(self.cur_at())
            self.edit(True)["at"] = st.join_at(expr, rest)
            self._tidy()
            if live:
                self.live_show()
            store.renpy.restart_interaction()

        def live_show(self):
            """고른 줄이 띄운 그림을 지금 화면에서 바로 옮겨 보여줍니다."""
            s = self.sel_shown()
            if s is None:
                return
            lay, t, name = s
            st = self.st()
            at = self.cur_at()
            try:
                at_list = [ st._eval(i) for i in at ] or [ store.config.default_transform ]
                store.renpy.show(" ".join(name), at_list=at_list, layer=lay, tag=t)
                self.previewed = True
                st.rt.errors.pop(self.sel, None)
            except Exception as e:
                st.rt.errors[self.sel] = "위치 미리 보기 실패: {}".format(e)

        ## 전환

        def _set_with(self, expr):
            if not self._editable():
                return
            self.edit(True)["with"] = expr
            self._tidy()
            if self.in_scene():
                self.replay()
            else:
                store.renpy.restart_interaction()

        def set_kind(self, kind):
            st = self.st()
            spec = self.with_spec()
            info = st.trans_info(kind)
            if info is None:
                return
            new = dict(kind=kind, dir="", time=info[2])
            if spec["kind"] == kind:
                new = dict(spec)
            elif info[3]:
                ## 방향: 이동은 "제자리"보다 들어오기/나가기가 보기 쉬워서 왼쪽부터
                new["dir"] = spec["dir"] if spec.get("dir") in dict(info[3]) else info[3][0][0]
                if kind in ("move", "ease") and not new["dir"]:
                    new["dir"] = "left" if self.kind() != "scene" else ""
            self._set_with(st.format_with(new, self.kind()))

        def set_dir(self, d):
            spec = dict(self.with_spec())
            if spec["kind"] in ("none", "custom"):
                return
            spec["dir"] = d
            self._set_with(self.st().format_with(spec, self.kind()))

        def set_time(self, t):
            spec = dict(self.with_spec())
            info = self.st().trans_info(spec["kind"])
            if info is None or info[2] is None:
                return
            spec["time"] = t
            self._set_with(self.st().format_with(spec, self.kind()))

        def time_value(self):
            return self.with_spec().get("time")

        ## ── 다시 보기 ──

        def in_scene(self):
            return self.sel is not None and self.sel in self.st().rt.window

        def replay(self):
            """지난 대사 뒤부터 지금 대사까지 다시 실행해서, 고친 위치·전환을 보여줍니다."""
            self.previewed = False
            store.renpy.rollback(checkpoints=0, force=True, greedy=True)

        ## ── 마우스·키보드 ──

        def drag_begin(self, x, y):
            hit = None
            for lay, t, key, name in reversed(self.shown_list()):
                b = self.bounds(lay, t)
                if b is not None and b[0] <= x < b[0] + b[2] and b[1] <= y < b[1] + b[3]:
                    hit = (lay, t, key)
                    break
            if hit is None:
                return None
            lay, t, key = hit
            self.set_sel(key)
            if not self._editable() or self.kind() == "hide":
                return None
            if self.sel_is_bg():
                msg(self.BG_LOCKED)
                return None
            start = self.anchor_point(lay, t)
            p = self.st().parse_pos(self.cur_pos() or "")
            if p is not None:
                start = p
            if start is None:
                return None
            return start

        def drag_move(self, token, dx, dy):
            sx, sy = token
            self.set_pos(self.st().format_pos(sx + dx, sy + dy))

        def move(self, dx, dy):
            if self.sel is None or self.kind() == "hide":
                return
            if self.sel_is_bg():
                msg(self.BG_LOCKED)
                return
            st = self.st()
            p = st.parse_pos(self.cur_pos() or "")
            if p is None:
                s = self.sel_shown()
                p = self.anchor_point(s[0], s[1]) if s is not None else None
            if p is None:
                msg("화면에 없는 그림이라 방향키로 옮길 수 없습니다. 위치 버튼을 쓰세요.")
                return
            self.set_pos(st.format_pos(p[0] + dx, p[1] + dy))

        def select(self, step):
            """Tab: 화면에 있는 그림을 차례로 고르기 (앞에서부터)"""
            keys = [ i[2] for i in reversed(self.shown_list()) ]
            if not keys:
                msg("원고의 줄로 띄운 그림이 화면에 없습니다.")
                return
            if self.sel in keys:
                k = (keys.index(self.sel) + step) % len(keys)
            else:
                k = 0
            self.set_sel(keys[k])

        def key(self, k, shift):
            if k == pygame.K_LEFTBRACKET:
                self.step_line(-1)
            elif k == pygame.K_RIGHTBRACKET:
                self.step_line(1)
            elif k == pygame.K_l:
                self.list_open = not self.list_open
            elif k == pygame.K_PAGEUP:
                self.step_line(-self.LIST_ROWS)
            elif k == pygame.K_PAGEDOWN:
                self.step_line(self.LIST_ROWS)
            else:
                return False
            return True

        ## ── 되돌리기 ──

        def reset_item(self):
            rt = self.st().rt
            if self.add_lines.pop(self.sel, None):
                msg("이 줄 아래에 넣으려던 새 줄을 버렸습니다.")
            if rt.edits.pop(self.sel, None):
                msg("이 줄의 저장 안 한 변경을 되돌렸습니다.")
                if self.in_scene() or self.previewed:
                    self.replay()

        def discard(self):
            rt = self.st().rt
            had = bool(rt.edits)
            rt.edits.clear()
            self.add_lines = { }
            self.add_before = { }
            msg("모든 줄의 저장 안 한 변경을 버렸습니다.")
            if had or self.previewed:
                self.replay()

        ## ── 그림/영상 고르기 (3.0): images, movies 폴더의 파일 ──

        def media_list(self):
            """[(이름, 파일, 종류, 원고에 쓸 수 있는지)] 종류: "image" / "movie" / "mask"(투명 영상)"""
            import os, re
            rv = [ ]
            seen = set()
            exts = tuple(e.lower() for e in getattr(store.config, "image_extensions", (".png", ".jpg", ".jpeg", ".webp")))
            for fn in sorted(store.renpy.list_files()):
                if not fn.startswith("images/"):
                    continue
                base, ext = os.path.splitext(os.path.basename(fn))
                if ext.lower() not in exts:
                    continue
                name = base.lower().partition("@")[0].strip()
                if not name or name in seen:
                    continue
                seen.add(name)
                rv.append((name, fn, "image", self.name_ok(name)))
            st = self.st()
            for name, (fn, mask) in sorted((getattr(st.rt, "movies", None) or { }).items()):
                if name in seen:
                    continue
                seen.add(name)
                rv.append((name, fn, "mask" if mask else "movie", self.name_ok(name)))
            if self.media_filter == "image":
                rv = [ r for r in rv if r[2] == "image" ]
            elif self.media_filter == "movie":
                rv = [ r for r in rv if r[2] != "image" ]
            ## 소리 (3.2): audio 폴더의 파일. 이름은 원고에 적는 경로입니다.
            if self.media_filter in ("all", "audio"):
                if self.media_filter == "audio":
                    rv = [ ]
                for fn in sorted(store.renpy.list_files()):
                    if fn.startswith("audio/") and os.path.splitext(fn)[1].lower() in (".ogg", ".opus", ".mp3", ".wav", ".flac"):
                        rv.append((fn, fn, "audio", '"' not in fn))
            return rv

        def media_kind(self):
            for r in self.media_list():
                if r[0] == self.media_sel:
                    return r[2]
            return None

        def here(self):
            """지금 나오는 대사(또는 선택지)의 (파일, 줄)."""
            n = self.game_node()
            return (n.filename, n.linenumber) if n is not None else None

        def media_add_here(self, kind):
            """지금 대사 앞에 새 줄 넣기. kind: show, scene, music, sound"""
            name = self.media_sel
            key = self.here()
            if not name or key is None:
                return
            if kind in ("music", "sound"):
                line = 'play {} "{}"'.format(kind, name)
            elif not self.name_ok(name):
                msg(esc("'{}'는 원고에 쓸 수 없는 이름입니다. 파일 이름을 영어, 숫자, 한글과 _로 바꾸세요.".format(name)))
                return
            else:
                line = "{} {}".format(kind, name)
            self.add_before.setdefault(key, [ ]).append(line)
            close_popup()
            msg(esc("{}번째 줄 앞에 '{}'를 넣습니다. Ctrl+S로 저장".format(key[1], line)))
            if kind in ("show", "scene"):
                self.preview_name(name, scene=(kind == "scene"))

        def name_ok(self, name):
            """원고의 show 줄에 그대로 적을 수 있는 이름인지 (낱말마다 글자·숫자·_ , 첫 낱말은 숫자로 시작하지 않음)"""
            import re
            words = name.split()
            if not words or words[0][:1].isdigit():
                return False
            return all(re.match(r"^\w+$", w) for w in words)

        def open_media(self):
            self.media_sel = None
            state.popup = "media"
            store.renpy.restart_interaction()

        def pick_media(self, name):
            self.media_sel = name
            store.renpy.restart_interaction()

        def set_media_filter(self, f):
            self.media_filter = f
            store.renpy.restart_interaction()

        def can_rename(self):
            return self.sel is not None and self.kind() in ("show", "scene", "hide") and self.parsed(self.sel)[0] is not None

        def media_rename(self):
            """이 줄의 그림 바꾸기: 고른 줄의 이미지 이름만 바꿈."""
            name = self.media_sel
            if not name or not self._editable():
                return
            if not self.name_ok(name):
                msg(esc("'{}'는 원고에 쓸 수 없는 이름입니다. 파일 이름을 영어, 숫자, 한글과 _로 바꾸세요.".format(name)))
                return
            e = self.edit(True)
            e["name"] = name
            self._tidy()
            close_popup()
            msg(esc("이 줄의 그림을 '{}'로 바꿉니다. Ctrl+S로 원고에 저장".format(name)))
            if self.kind() != "hide":
                self.preview_name(name)

        def media_add(self, kind):
            """고른 줄 아래에 새 show / scene 줄 넣기."""
            name = self.media_sel
            if not name:
                return
            if self.sel is None:
                msg("줄을 먼저 고르세요.")
                return
            if not self.name_ok(name):
                msg(esc("'{}'는 원고에 쓸 수 없는 이름입니다. 파일 이름을 영어, 숫자, 한글과 _로 바꾸세요.".format(name)))
                return
            se = self.se()
            if se is not None:
                se.remember(self.sel[0], self.sel[1])
            self.add_lines.setdefault(self.sel, [ ]).append("{} {}".format(kind, name))
            close_popup()
            msg(esc("{}번째 줄 아래에 '{} {}'를 넣습니다. Ctrl+S로 원고에 저장".format(self.sel[1], kind, name)))
            self.preview_name(name, scene=(kind == "scene"))

        def preview_name(self, name, scene=False):
            """고른 그림을 지금 화면에 잠깐 보여줌 (원고에는 Ctrl+S로). 닫으면 원래 장면으로."""
            try:
                if scene:
                    store.renpy.scene()
                s = self.sel_shown() if not scene else None
                if s is not None and tuple(name.split())[0] != s[1]:
                    store.renpy.hide(s[1], layer=s[0])
                store.renpy.show(name)
                self.previewed = True
            except Exception as ex:
                msg(esc("미리 보기를 못 했습니다: {}".format(ex)))

        ## ── 원고에 쓰기 ──

        def pending_lines(self):
            st = self.st()
            if st is None:
                return 0
            ## PyKaki 원고의 위치는 원고 대신 stage_layout.rpy에 저장하므로 세지 않습니다.
            n = len([ k for k, e in st.rt.edits.items() if e and not (self.pk(k) and list(e) == [ "at" ]) ])
            return n + len([ l for l in self.add_lines.values() if l ]) + len([ l for l in self.add_before.values() if l ])

        def script_edits(self):
            st = self.st()
            se = self.se()
            if st is None or se is None:
                return [ ]
            rv = [ ]
            for key, e in list(st.rt.edits.items()):
                if not e:
                    continue
                s = self.stmt(key)
                if s is None:
                    continue
                args = { "at": e.get("at"), "with": e.get("with"), "name": e.get("name") }
                if self.pk(key):
                    args["at"] = None
                    if list(e) == [ "at" ]:
                        continue
                ed = se.Edit(key[0], key[1], s[1], args, expect=st.imspec_parts(s[2])[0])
                ed.key = key
                rv.append(ed)
            ## 고른 줄 아래에 새 줄 넣기 (3.0)
            if hasattr(se, "INSERT_AFTER"):
                for key, lines in list(self.add_lines.items()):
                    if not lines:
                        continue
                    ed = se.Edit(key[0], key[1], se.INSERT_AFTER, { "lines": list(lines), "replace": () },
                        expect=(self.source(key) or "").strip() or None)
                    ed.key = ("add", key)
                    rv.append(ed)
                ## 지금 대사 앞에 새 줄 넣기 (3.2)
                for key, lines in list(self.add_before.items()):
                    if not lines:
                        continue
                    ed = se.Edit(key[0], key[1], se.INSERT, { "lines": list(lines), "replace": () })
                    ed.key = ("before", key)
                    rv.append(ed)
            return rv

        def after_script_save(self, edits):
            rt = self.st().rt
            for e in edits:
                if e.ok:
                    k = getattr(e, "key", None)
                    if isinstance(k, tuple) and len(k) == 2 and k[0] == "add":
                        self.add_lines.pop(k[1], None)
                    elif isinstance(k, tuple) and len(k) == 2 and k[0] == "before":
                        self.add_before.pop(k[1], None)
                    else:
                        rt.edits.pop(k, None)
            self._lines = { }
            self._stmts = { }

        def new_line(self, key=None):
            """고친 값을 넣은 그 줄 (앞 공백 없이)."""
            key = key or self.sel
            s = self.stmt(key)
            se = self.se()
            text = self.source(key)
            e = self.st().rt.edits.get(key) or { }
            if s is None or se is None or text is None:
                return None
            return se.image_line_text(text, s[1], { "at": e.get("at"), "with": e.get("with"), "name": e.get("name") })

        def copy_text(self):
            if self.sel is None or not self.edit():
                return None
            return self.new_line()

        ## ── 패널 ──

        def info_lines(self):
            return [ esc(i) for i in self._info_lines() ]

        def _info_lines(self):
            st = self.st()
            rt = st.rt
            rv = [ ]
            if not self._valid(self.sel):
                ## 다시 불러온 직후처럼 고른 줄이 없거나 렌파이 안쪽 줄이면, 지금 줄 근처로 다시 고름
                self.pick_default()
            s = self.stmt(self.sel) if self._valid(self.sel) else None
            if s is None:
                rv.append("고른 줄이 없습니다. [그림/영상/소리 고르기]로 지금 대사 앞에 넣을 수 있습니다.")
                n = self.pending_lines()
                if n:
                    rv.append("원고에 저장 안 한 줄 {}개 (Ctrl+S)".format(n))
                return rv

            node = s[2]
            where = "지금 장면 (R로 다시 보기)" if self.in_scene() else "지금 장면 밖 ('그 줄로 가기'로 확인)"
            rv.append("{}   {} {}   ({})".format(node_place(node), s[1], " ".join(self.name()), where))

            mv = st.movie_for(self.name())
            if mv is not None:
                rv.append("영상: {}{}".format(mv[0], " (투명)" if mv[1] else ""))

            p, why = self.parsed(self.sel)
            if p is None:
                rv.append("이 줄은 고칠 수 없습니다: " + why)
                return rv

            if s[1] != "hide":
                rv.append("위치: {}{}   전환: {}".format(st.pos_label(self.cur_pos()), " (배경이라 고정)" if self.sel_is_bg() else "", st.with_label(self.cur_with(), s[1])))
            else:
                rv.append("전환: {}".format(st.with_label(self.cur_with(), s[1])))

            if self.edit():
                rv.append("새 줄: " + (self.new_line() or "(만들 수 없음)"))
            if self.add_lines.get(self.sel):
                rv.append("이 줄 아래에 넣을 줄: " + " / ".join(self.add_lines[self.sel]))

            err = rt.errors.get(self.sel)
            if err:
                rv.append(err)

            n = self.pending_lines()
            if n:
                rv.append("원고에 저장 안 한 줄 {}개 (Ctrl+S)".format(n))

            if self.pk():
                rv.append("PyKaki 원고: 위치는 stage_layout.rpy에, 그림 줄은 PyKaki가 받아 적습니다.")
                wait = self.se().inbox_count(self.sel[0])
                if wait:
                    rv.append("PyKaki가 아직 안 받아 적은 줄 {}개".format(wait))

            if rt.skipped:
                f, r = rt.skipped[0]
                more = " 외 {}개".format(len(rt.skipped) - 1) if len(rt.skipped) > 1 else ""
                rv.append("등록 못 한 영상: {} ({}){}".format(f, r, more))
            return rv

        def help_lines(self):
            return [
                "마우스: 그림을 누르면 그 줄 고르기, 끌면 위치 (Shift: 한 방향) | 방향키 이동 (Shift: 10배)",
                "Tab 화면의 그림 차례로 | [[ ] 앞뒤 줄 | PageUp/Down 7줄씩 | L 목록 접기 | R 다시 보기 | Backspace 이 줄 되돌리기",
                ]

        ## 다시 불러와도 저장 안 한 값이 남도록
        def session(self):
            st = self.st()
            if st is None:
                return { }
            return dict(
                sel=self.sel,
                list_open=self.list_open,
                edits={ k : dict(v) for k, v in st.rt.edits.items() if v },
                )

        def restore(self, d):
            st = self.st()
            if not d or st is None:
                return
            self.sel = d.get("sel")
            self.list_open = d.get("list_open", True)
            for k, v in (d.get("edits") or { }).items():
                st.rt.edits.setdefault(k, { }).update(v)

    register(StageTab())

    class LineInputValue(store.InputValue, DictEquality):
        """줄 번호 입력 칸. 엔터를 누르면 그 탭의 goto_number(줄 번호)를 부릅니다.
        (이미지/영상 탭, 화면 효과 탭의 "줄에 넣기")"""
        default = False
        editable = True
        returnable = False

        def __init__(self, tab_id="stage"):
            self.text = ""
            self.tab_id = tab_id

        def get_text(self):
            return self.text

        def set_text(self, s):
            self.text = s
            store.renpy.restart_interaction()

        def enter(self):
            t = get_tab(getattr(self, "tab_id", "stage"))
            try:
                n = int(self.text)
            except Exception:
                n = None
            if t is not None and n is not None:
                t.goto_number(n)
            self.text = ""
            store.renpy.run(self.Disable())
            raise store.renpy.IgnoreEvent()

    line_input = LineInputValue()


## 화면의 그림 테두리와 줄 번호
screen ui_editor_stage_overlay():

    $ _tab = ui_editor.get_tab("stage")

    for _lay, _t, _key, _name in _tab.shown_list():
        $ _b = _tab.bounds(_lay, _t)
        if _b is not None and _b[2] > 0 and _b[3] > 0:
            $ _on = (_key == _tab.sel)
            frame:
                style "empty"
                background ui_kit.Outline("#ff3b8d" if _on else "#ffffff88", 3 if _on else 1)
                pos (int(_b[0]), int(_b[1]))
                xysize (int(_b[2]), int(_b[3]))
                null
            text ui_editor.esc("{}번째 줄 {}".format(_key[1], " ".join(_name))):
                style "ui_editor_small"
                color ("#ff3b8d" if _on else "#ffffff")
                pos (int(max(0, _b[0])) + 4, int(max(0, _b[1])) + 2)


screen ui_editor_stage_panel(tab):

    $ _kind = tab.kind()

    ## 줄 이동
    hbox:
        spacing 4
        box_wrap True
        box_wrap_spacing 4
        xmaximum 632
        textbutton "◀ [[" style "ui_editor_button" text_size 13 action Function(tab.step_line, -1)
        textbutton "] ▶" style "ui_editor_button" text_size 13 action Function(tab.step_line, 1)
        text "줄 번호" style "ui_editor_text" yalign 0.5
        button:
            style "ui_editor_button"
            xsize 70
            action ui_editor.line_input.Toggle()
            input value ui_editor.line_input style "ui_editor_text" length 6 allow "0123456789"
        textbutton "지금 장면으로" style "ui_editor_button" text_size 13 action Function(tab.to_current)
        textbutton "그림/영상/소리 고르기" style "ui_editor_button" text_size 13 action Function(tab.open_media)
        textbutton "그 줄로 가기" style "ui_editor_button" text_size 13 action Function(tab.warp) sensitive (tab.sel is not None)
        textbutton ("L 목록 접기" if tab.list_open else "L 목록 펴기") style "ui_editor_button" text_size 13 action ToggleField(tab, "list_open")

    if tab.list_open:
        vbox:
            spacing 1
            for _line, _k, _text, _on, _here, _dirty in tab.nearby():
                button:
                    style "ui_editor_button"
                    xsize 632
                    padding (6, 1)
                    action Function(tab.set_sel, (tab.cur_file(), _line))
                    selected _on
                    hbox:
                        spacing 6
                        text ("{:>4}".format(_line)) style "ui_editor_small" color ("#ff3b8d" if _here else "#cccccc") min_width 34
                        text (("* " if _dirty else "") + _text) style "ui_editor_small" color "#ffffff"

    if _kind is not None and _kind != "hide" and tab.pk() and not tab.sel_is_bg():
        hbox:
            spacing 4
            text "위치 저장:" style "ui_editor_text" yalign 0.5
            textbutton "이 상자에서만" style "ui_editor_button" text_size 13 action Function(tab.set_scope, "box") selected (tab.pos_scope == "box")
            textbutton "어디서나" style "ui_editor_button" text_size 13 action Function(tab.set_scope, "all") selected (tab.pos_scope == "all")

    if _kind is not None and _kind != "hide":
        hbox:
            spacing 4
            box_wrap True
            box_wrap_spacing 4
            xmaximum 632
            $ _p = tab.cur_pos()
            text "위치:" style "ui_editor_text" yalign 0.5
            if tab.sel_is_bg():
                ## 배경은 위치 버튼을 보여주지 않음 (stage_config.rpy의 stage.bg_tag)
                text "배경(bg)이라 고정" style "ui_editor_small" yalign 0.5
                if _p is not None:
                    ## 예전에 옮겨서 원고에 위치가 적혀 있으면 지울 수 있게
                    textbutton "기본 위치로 되돌리기" style "ui_editor_button" text_size 13 action Function(tab.set_pos, None)
            else:
                textbutton "기본" style "ui_editor_button" text_size 13 action Function(tab.set_pos, None) selected (_p is None)
                for _n, _l in stage.cfg("positions"):
                    textbutton _l style "ui_editor_button" text_size 13 action Function(tab.set_pos, _n) selected (_p == _n)

    if _kind is not None:
        $ _spec = tab.with_spec()
        hbox:
            spacing 4
            box_wrap True
            box_wrap_spacing 4
            xmaximum 632
            text "전환:" style "ui_editor_text" yalign 0.5
            for _tk, _tl, _tt, _td in stage.TRANSITIONS:
                textbutton _tl style "ui_editor_button" text_size 13 action Function(tab.set_kind, _tk) selected (_spec["kind"] == _tk)

        $ _info = stage.trans_info(_spec["kind"])
        if _info is not None and _info[3]:
            hbox:
                spacing 4
                text ("나가는 쪽:" if (_kind == "hide" and _spec["kind"] in ("move", "ease", "slide")) else "방향:") style "ui_editor_text" yalign 0.5
                for _dv, _dl in _info[3]:
                    textbutton _dl style "ui_editor_button" text_size 13 action Function(tab.set_dir, _dv) selected (_spec["dir"] == _dv)

        if _info is not None and _info[2] is not None:
            hbox:
                spacing 4
                box_wrap True
                xmaximum 632
                text "시간:" style "ui_editor_text" yalign 0.5
                for _tv in tab.TIMES:
                    textbutton ("{:g}초".format(_tv)) style "ui_editor_button" text_size 13 action Function(tab.set_time, _tv) selected (_spec["time"] is not None and abs(_spec["time"] - _tv) < 0.001)

    hbox:
        spacing 6
        textbutton "R 다시 보기" style "ui_editor_button" action Function(tab.replay)
        textbutton "이 줄 되돌리기" style "ui_editor_button" action Function(tab.reset_item)
        textbutton "모두 버리기" style "ui_editor_button" action Function(tab.discard)


## 그림/영상 고르기 창 (3.0): game/images, game/movies의 파일
screen ui_editor_media_popup():

    $ _tab = ui_editor.get_tab("stage")

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
        xsize 720
        ysize 600

        vbox:
            spacing 6
            text "그림/영상/소리 고르기" style "ui_editor_title"
            text "game/images, movies, audio 폴더의 파일입니다." style "ui_editor_small"

            hbox:
                spacing 4
                for _f, _fl in (("all", "전부"), ("image", "그림"), ("movie", "영상"), ("audio", "소리")):
                    textbutton _fl style "ui_editor_button" text_size 13 action Function(_tab.set_media_filter, _f) selected (_tab.media_filter == _f)

            viewport:
                scrollbars "vertical"
                mousewheel True
                ysize 380

                vpgrid:
                    cols 5
                    spacing 6
                    allow_underfull True
                    for _name, _fn, _kind, _ok in _tab.media_list():
                        button:
                            style "ui_editor_button"
                            xsize 128
                            ysize 112
                            action Function(_tab.pick_media, _name)
                            selected (_tab.media_sel == _name)
                            sensitive _ok
                            vbox:
                                spacing 2
                                xalign 0.5
                                if _kind == "image":
                                    add Transform(_fn, fit="contain", xysize=(112, 72)) xalign 0.5
                                else:
                                    fixed:
                                        xysize (112, 72)
                                        add Solid("#ffffff18")
                                        text ({ "mask": "투명 영상", "audio": "소리" }.get(_kind, "영상")) style "ui_editor_small" align (0.5, 0.5)
                                text ui_editor.esc(_name.rpartition("/")[2]) style "ui_editor_small" xalign 0.5 size 12

            if not _tab.media_list():
                text "images, movies 폴더에 파일이 없습니다." style "ui_editor_text"

            $ _mk = _tab.media_kind()
            $ _isimg = _mk in ("image", "movie", "mask")

            text ui_editor.esc("고른 것: " + (_tab.media_sel or "(없음)") + ("    /    고른 줄: {}번째 줄 {}".format(_tab.sel[1], _tab.kind() or "") if _tab.sel else "")) style "ui_editor_small"

            hbox:
                spacing 6
                text "지금 대사 앞에:" style "ui_editor_small" yalign 0.5
                textbutton "show" style "ui_editor_button" action Function(_tab.media_add_here, "show") sensitive _isimg
                textbutton "scene" style "ui_editor_button" action Function(_tab.media_add_here, "scene") sensitive _isimg
                textbutton "음악" style "ui_editor_button" action Function(_tab.media_add_here, "music") sensitive (_mk == "audio")
                textbutton "효과음" style "ui_editor_button" action Function(_tab.media_add_here, "sound") sensitive (_mk == "audio")

            hbox:
                spacing 6
                text "고른 줄에:" style "ui_editor_small" yalign 0.5
                textbutton "그림 바꾸기" style "ui_editor_button" action Function(_tab.media_rename) sensitive (_isimg and _tab.can_rename())
                textbutton "아래에 show" style "ui_editor_button" action Function(_tab.media_add, "show") sensitive (_isimg and _tab.sel is not None)
                textbutton "아래에 scene" style "ui_editor_button" action Function(_tab.media_add, "scene") sensitive (_isimg and _tab.sel is not None)
                textbutton "취소 (Esc)" style "ui_editor_button" action Function(ui_editor.close_popup)
