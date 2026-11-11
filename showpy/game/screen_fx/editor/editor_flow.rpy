################################################################################
## Screen FX — 줄기표 (screen_fx 5.2)
##
## "인게임 화면 셰이더" 칸에서 G(또는 [줄기표 펴기])를 누르면 게임 화면 옆에
## 원고의 줄기표가 나옵니다. 렌파이가 읽은 원고(label, menu, if, jump)를 줄 번호
## 순서대로 마디로 그리고, 선택지와 if는 옆으로 갈라지는 가지로 그립니다.
##
##   마디를 누르기        → 그 줄을 고르고 게임도 그 줄로 (줄 목록과 같음)
##   마디를 끌기          → 구간 고르기. 패널의 [이 구간에 적용]으로 셰이더를 넣음
##                          (시작 줄 위에 shaders(1번, 2번), 끝 다음 줄 위에 원래 두 자리로)
##   오른쪽 끝 동그라미   → 셰이더가 바뀌는 곳(전환 점). 눌러서 고르고 패널에서 전환을 고름
##   휠                   → 줄기표 스크롤
##
## UI Kit 편집기가 없으면 이 파일은 아무것도 하지 않습니다.
################################################################################

init offset = 1

## editor_fx.rpy(init -6 + 1)보다 먼저 읽혀야 FxTab이 이것을 이어받습니다.
init -7 python in screen_fx:

    class FlowTreeMixin(store.python_object):
        """화면 효과 탭(FxTab)에 줄기표를 더하는 것. FxTab의 줄 고르기, 줄에 넣기를 그대로 씀."""

        tree_open = False
        tree_scroll = 0         # 맨 위에 보이는 줄기표 줄 번호(행)
        tree_range = None       # (파일, 시작 행, 끝 행)
        tree_end_mode = "next"  # 되돌리기 자리: "next" 끝 다음 줄 / "merge" 가지가 합쳐지는 곳 / "none" 넣지 않음
        tree_tr_sel = ()        # 고른 전환 점 (파일, 줄) 목록
        _tdrag = None
        _tcache = None

        TREE_ROW = 20
        TREE_LANE = 14
        TREE_HEAD = 30
        TREE_FOOT = 22
        TREE_DOT = 22

        ## ── 열고 닫기, 자리 ──

        def tree_toggle(self):
            self.tree_open = not self.tree_open
            if self.tree_open:
                ## 패널의 구간 칸이 보이게 1번, 2번 세부 속성은 접음 (다시 펼 수 있음)
                self.detail_open = [ False, False ]
                self.tree_show_here()
                _ed.msg("줄기표를 폈습니다. 마디를 끌어서 구간을 고르세요. (G 접기)")
            renpy.restart_interaction()

        def tree_on(self):
            """게임 창에 서랍을 그릴지. pygaki 앱이 패널을 가져가 있으면 줄기표도 앱에서 봄 (F9로 게임 창에 보이게 하면 같이 나옴)."""
            if not self.tree_open or getattr(_ed.state, "peek", False):
                return False
            try:
                if hasattr(_ed, "live_panel_hidden") and _ed.live_panel_hidden():
                    return False
            except Exception:
                pass
            return True

        def tree_box(self):
            """서랍 자리 (x, y, 폭, 높이). 편집기 패널의 반대쪽에 둠."""
            W = store.config.screen_width
            H = store.config.screen_height
            M = getattr(_ed, "MARGIN", 10)
            w = int(min(460, max(320, W * 0.36)))
            left = True
            try:
                hidden = _ed.live_panel_hidden() if hasattr(_ed, "live_panel_hidden") else False
                if not hidden:
                    st = _ed.state
                    if st.panel_xy is not None:
                        pw, _ph = _ed.panel_size()
                        left = (st.panel_xy[0] + pw / 2.0) > W / 2.0
                    else:
                        left = getattr(st, "corner_used", st.corner) in (1, 2)
            except Exception:
                pass
            x = M if left else W - M - w
            return (x, M, w, H - 2 * M)

        def tree_view_rect(self):
            x, y, w, h = self.tree_box()
            return (x + 6, y + self.TREE_HEAD, w - 12, h - self.TREE_HEAD - self.TREE_FOOT)

        def tree_visible(self):
            return max(1, int(self.tree_view_rect()[3] // self.TREE_ROW))

        ## ── 원고 읽기 ──

        _tree_fn = None

        def tree_file(self):
            """보여 줄 원고 파일: 고른 줄이나 게임의 지금 줄의 파일. 렌파이 안쪽(저장 중 등)이면 지난번 파일."""
            fn = self.line_file()
            if fn and self.lines_of(fn):
                self._tree_fn = fn
                return fn
            return self._tree_fn or fn

        def tree_short(self, fn):
            fn = (fn or "").replace("\\", "/")
            return fn[5:] if fn.startswith("game/") else fn

        def _src_lines(self, fn):
            return self._file_lines(fn)

        def tree_rows(self):
            """줄기표 행 목록 (덮인 셰이더까지 셈한 것)."""
            fn = self.tree_file()
            if fn is None:
                return [ ]
            rows, items = self._tree_build(fn)
            self._tree_cover(fn, rows, items)
            return rows

        def _tree_build(self, fn):
            import renpy as _r
            script = _r.game.script
            ## 다시 읽을 때: 렌파이가 읽은 줄 번호가 바뀌었거나(저장 → 다시 불러오기) 원고 파일이 바뀌었을 때.
            ## (5.2 고침: 예전에는 script 객체의 id로 봤는데, 다시 불러온 뒤 같은 id가 다시 쓰여서
            ##  예전 줄 번호를 그대로 쓰는 바람에 셰이더 줄이 두 줄 위에 들어가고 지우기가 빗나갔음)
            import os
            se = self.se()
            try:
                mt = os.path.getmtime(se.resolve(fn)) if se is not None else 0
            except Exception:
                mt = 0
            key = (fn, tuple(l for l, _n in self.lines_of(fn)), mt)
            c = self._tcache
            if c is not None and c[0] == key:
                return c[1], c[2]

            src = self._src_lines(fn)
            ins = set(l for l, _n in self.lines_of(fn))
            rows = [ ]
            spans = [ ]
            seen = set()
            skip = ("Init", "Define", "Default", "Image", "Transform", "Screen", "Style", "Testcase",
                    "EndTranslate", "TranslateBlock", "TranslateEarlyBlock", "TranslatePython", "RPY")

            def text_of(line):
                if 1 <= line <= len(src):
                    return src[line - 1].strip()
                return ""

            def head_line(block, fallback):
                """선택지 글이나 elif/else 줄: 블록 첫 줄보다 덜 들여쓴 바로 위 줄."""
                try:
                    first = block[0].linenumber
                except Exception:
                    return fallback
                ref = src[first - 1] if 1 <= first <= len(src) else ""
                ind = len(ref) - len(ref.lstrip())
                n = first - 1
                while n > fallback:
                    s = src[n - 1] if n <= len(src) else ""
                    if s.strip() and not s.strip().startswith("#") and len(s) - len(s.lstrip()) < ind:
                        return n
                    n -= 1
                return fallback

            def add(node, kind, line, text, depth, path):
                r = dict(node=node, kind=kind, line=line, text=text, depth=depth, path=path,
                    ins=(line in ins and kind not in ("label", "branch")), guides=set())
                rows.append(r)
                return len(rows) - 1

            def walk(block, depth, path, out):
                first = len(rows)
                for n in block or ():
                    cls = type(n).__name__
                    if cls in skip:
                        continue
                    if getattr(n, "filename", None) != fn:
                        continue
                    if cls == "Translate":
                        walk(getattr(n, "block", None), depth, path, out)
                        continue
                    if cls == "Label":
                        seen.add(id(n))
                        i = add(n, "label", n.linenumber, "label {}:".format(n.name), depth, path)
                        it = dict(row=i, branches=None)
                        out.append(it)
                        walk(n.block, depth, path, out)
                        continue
                    if cls == "Pass" and rows and rows[-1]["line"] == n.linenumber:
                        ## call 뒤에 렌파이가 같은 줄로 붙이는 빈 문장
                        continue
                    t = text_of(n.linenumber)
                    kind = "stmt"
                    if cls in ("Say", "TranslateSay"):
                        kind = "say"
                    elif cls == "Python" and t.startswith(self.SHADER_HEADS) and not t.startswith("$ screen_fx.set_warp("):
                        kind = "fx"
                    elif cls in ("Jump", "Return"):
                        kind = "jump"
                    elif cls == "Call":
                        kind = "call"
                    elif cls in ("Scene", "Show", "Hide", "With"):
                        kind = "show"
                    elif cls in ("Menu", "If", "While"):
                        kind = "menu"
                    i = add(n, kind, n.linenumber, t, depth, path)
                    it = dict(row=i, branches=None, cls=cls)
                    out.append(it)
                    if cls == "Menu":
                        brs = [ ]
                        last_line = n.linenumber
                        for k, item in enumerate(getattr(n, "items", ())):
                            if len(item) < 3 or not item[2]:
                                continue
                            hl = head_line(item[2], last_line)
                            b = [ ]
                            add(None, "branch", hl, text_of(hl), depth + 1, path + ((id(n), k),))
                            b_first = len(rows) - 1
                            walk(item[2], depth + 1, path + ((id(n), k),), b)
                            spans.append((depth + 1, b_first, len(rows) - 1))
                            brs.append((b_first, b))
                            last_line = rows[-1]["line"]
                        it["branches"] = brs
                        it["exhaustive"] = True
                    elif cls == "If":
                        brs = [ ]
                        last_line = n.linenumber
                        has_else = False
                        for k, (cond, blk) in enumerate(getattr(n, "entries", ())):
                            hl = n.linenumber if k == 0 else head_line(blk, last_line)
                            if str(cond).strip() == "True":
                                has_else = True
                            add(None, "branch", hl, "(맞으면)" if k == 0 else text_of(hl), depth + 1, path + ((id(n), k),))
                            b_first = len(rows) - 1
                            b = [ ]
                            walk(blk, depth + 1, path + ((id(n), k),), b)
                            spans.append((depth + 1, b_first, len(rows) - 1))
                            brs.append((b_first, b))
                            last_line = rows[-1]["line"]
                        it["branches"] = brs
                        it["exhaustive"] = has_else
                    elif cls == "While":
                        b = [ ]
                        b_first = len(rows)
                        walk(getattr(n, "block", None), depth + 1, path + ((id(n), 0),), b)
                        if len(rows) > b_first:
                            spans.append((depth + 1, b_first, len(rows) - 1))
                        it["branches"] = [ (b_first, b) ]
                        it["exhaustive"] = False
                if len(rows) > first:
                    spans.append((depth, first, len(rows) - 1))

            items = [ ]
            labels = sorted([ n for n in script.namemap.values()
                if type(n).__name__ == "Label" and getattr(n, "filename", None) == fn ], key=lambda n: n.linenumber)
            done = set()
            for lab in labels:
                if id(lab) in seen or id(lab) in done:
                    continue
                done.add(id(lab))
                walk([ lab ], 0, (), items)

            ## 줄기 (세로선): 블록이 걸친 행마다
            for d, a, b in spans:
                for k in range(a, b + 1):
                    rows[k]["guides"].add(d)

            ## 셰이더 줄(fx)이 넣어지는 대상: 같은 블록의 다음 보통 문장
            def link(items_):
                pend = [ ]
                for it in items_:
                    r = rows[it["row"]]
                    if r["kind"] == "fx":
                        pend.append(r)
                    else:
                        if r["ins"]:
                            for p in pend:
                                p["target"] = (fn, r["line"])
                            r["fx_rows"] = list(pend)
                        pend = [ ]
                    for _b0, b in it.get("branches") or ():
                        link(b)
            link(items)

            self._tcache = (key, rows, items)
            return rows, items

        def _tree_cover(self, fn, rows, items):
            """행마다 덮인 두 자리(slots)와, 셰이더가 바뀌는 곳(point)을 셈. 가지는 갈라진 곳의 값으로 시작."""
            edits = self.line_edits
            pre = { }

            def visit(items_, state):
                for it in items_:
                    r = rows[it["row"]]
                    r["before"] = tuple(state)
                    r["change"] = False
                    r["point"] = None
                    r["pending"] = False
                    if r["kind"] == "fx":
                        tgt = r.get("target")
                        e = edits.get(tgt) if tgt else None
                        if tgt is not None:
                            pre.setdefault(tgt, tuple(state))
                        if not (e and "slots" in e):
                            c = self.call_slots(r["text"], state)
                            if c is not None:
                                state = list(c[0])
                                r["change"] = True
                                if tgt is not None:
                                    r["point"] = dict(target=tgt, slots=c[0], both=c[1], tr=c[2], line=r["line"], kind="code")
                    elif r["ins"]:
                        key = (fn, r["line"])
                        pre.setdefault(key, tuple(state))
                        e = edits.get(key)
                        if e and "slots" in e:
                            r["pending"] = True
                            if e["slots"] is not None:
                                state = list(e["slots"])
                                r["change"] = True
                                r["point"] = dict(target=key, slots=tuple(e["slots"]), both=True,
                                    tr=e.get("transition", DEFAULT), line=r["line"], kind="code")
                            elif r.get("fx_rows"):
                                ## 지울 셰이더 줄: 그 앞의 값으로 되돌림
                                state = list(pre.get(key, state))
                        if r["kind"] == "say" and not self._say_fx_removed(key):
                            c = self.say_slots(r["text"], state)
                            if c is not None:
                                state = list(c[0])
                                r["change"] = True
                                r["point"] = dict(target=key, slots=c[0], both=False, tr=c[2], line=r["line"], kind="say")
                    r["slots"] = tuple(state)
                    brs = it.get("branches")
                    if brs:
                        outs = [ ]
                        for b0, b in brs:
                            hr = rows[b0]
                            hr["before"] = hr["slots"] = tuple(state)
                            hr["change"] = False
                            hr["point"] = None
                            hr["pending"] = False
                            o = tuple(visit(b, list(state)))
                            ## jump/return으로 끝나는 가지는 합쳐지는 곳으로 오지 않음
                            if b and rows[b[-1]["row"]]["kind"] == "jump":
                                continue
                            outs.append(o)
                        if not it.get("exhaustive"):
                            outs.append(tuple(state))
                        if outs and all(o == outs[0] for o in outs):
                            state = list(outs[0])
                return state

            visit(items, [ self.start_slot(0), self.start_slot(1) ])
            self._tpre = pre

        ## ── 스크롤 ──

        def tree_show_here(self):
            """▶(게임의 지금 줄)이나 고른 줄이 보이게 스크롤."""
            rows = self.tree_rows()
            want = self.line_sel or self.here_key()
            if not rows or want is None:
                return
            for i, r in enumerate(rows):
                if r["line"] >= want[1]:
                    vis = self.tree_visible()
                    if not (self.tree_scroll <= i < self.tree_scroll + vis):
                        self.tree_scroll = max(0, i - vis // 3)
                    break

        def tree_scroll_by(self, n):
            rows = self.tree_rows()
            vis = self.tree_visible()
            self.tree_scroll = int(max(0, min(max(0, len(rows) - vis), self.tree_scroll + n)))
            renpy.restart_interaction()

        def wheel(self, sign, shift):
            if not self.tree_on():
                return
            mx, my = renpy.get_mouse_pos()
            x, y, w, h = self.tree_box()
            if x <= mx < x + w and y <= my < y + h:
                self.tree_scroll_by(sign * (10 if shift else 3))

        ## ── 마우스 (편집기 입력층이 부름) ──

        def _tree_row_at(self, y, clamp=False):
            vx, vy, vw, vh = self.tree_view_rect()
            i = self.tree_scroll + int((y - vy) // self.TREE_ROW)
            n = len(self.tree_rows())
            if clamp:
                return max(0, min(n - 1, i))
            return i if 0 <= i < n and vy <= y < vy + vh else None

        def drag_begin(self, x, y):
            if not self.tree_on():
                return None
            vx, vy, vw, vh = self.tree_view_rect()
            if not (vx <= x < vx + vw and vy <= y < vy + vh):
                return None
            i = self._tree_row_at(y)
            if i is None:
                return None
            r = self.tree_rows()[i]
            if x >= vx + vw - self.TREE_DOT and r.get("point"):
                self.tree_toggle_point(r["point"]["target"])
                return None
            self._tdrag = [ i, i, False ]
            return "tree"

        def drag_move(self, token, dx, dy):
            if token != "tree" or self._tdrag is None:
                return
            mx, my = renpy.get_mouse_pos()
            vx, vy, vw, vh = self.tree_view_rect()
            if my < vy:
                self.tree_scroll = max(0, self.tree_scroll - 1)
            elif my >= vy + vh:
                self.tree_scroll_by(1)
            i = self._tree_row_at(my, clamp=True)
            if i != self._tdrag[1] or abs(dy) > 4:
                self._tdrag[2] = True
            self._tdrag[1] = i
            if self._tdrag[2]:
                a, b = sorted(self._tdrag[:2])
                self.tree_range = (self.tree_file(), a, b)
                self.tree_end_mode = "next"

        def drag_end(self, token):
            if token != "tree" or self._tdrag is None:
                return
            i0, i1, moved = self._tdrag
            self._tdrag = None
            rows = self.tree_rows()
            if not moved or i0 == i1:
                ## 그냥 누름: 그 줄을 고르고 게임도 그 줄로
                k = self._tree_ins_from(rows, i0)
                if k is None:
                    _ed.msg("이 마디 아래에는 고를 수 있는 줄이 없습니다.")
                    return
                self.tree_range = None
                self.pick_line(k)
                return
            a, b = sorted((i0, i1))
            _ed.msg("{}~{}번째 줄을 골랐습니다. 1번, 2번 셰이더를 고르고 [[이 구간에 적용]을 누르세요.".format(
                rows[a]["line"], rows[b]["line"]))

        ## ── 구간 ──

        def _tree_can_insert(self, fn, line):
            """그 줄 위에 셰이더 줄을 넣을 수 있는지. PyKaki 원고는 줄마다 '# @l:' 표시가 있는 줄만 (menu: 같은 줄은 안 됨).
            표시는 줄 끝이나 바로 윗줄에 있습니다. (ui_kit 4.5)"""
            se = self.se()
            if se is None or not hasattr(se, "is_pykaki") or not se.is_pykaki(fn):
                return True
            src = self._file_lines(fn)
            if hasattr(se, "_pk_mark"):
                return se._pk_mark(src, line, "# @l:") is not None
            return 2 <= line <= len(src) + 1 and src[line - 2].strip().startswith("# @l:")

        def _tree_ins_from(self, rows, i):
            """i행부터 아래로 처음 나오는, 줄을 넣을 수 있는 문장 (파일, 줄)."""
            fn = self.tree_file()
            for r in rows[i:]:
                if r["ins"] and r["kind"] != "fx" and self._tree_can_insert(fn, r["line"]):
                    return (fn, r["line"])
            return None

        def tree_range_rows(self):
            rg = self.tree_range
            if rg is None or rg[0] != self.tree_file():
                return None
            rows = self.tree_rows()
            if not rows:
                return None
            a = max(0, min(len(rows) - 1, rg[1]))
            b = max(a, min(len(rows) - 1, rg[2]))
            return rows, a, b

        def _skip_ours(self, n):
            """.next를 따라가며 우리가 넣은 셰이더 줄, label 머리를 건너뛴 다음 문장."""
            k = 0
            while n is not None and k < 200:
                k += 1
                cls = type(n).__name__
                if cls == "Label":
                    blk = getattr(n, "block", None)
                    n = blk[0] if blk else getattr(n, "next", None)
                    continue
                if cls == "Python":
                    t = ""
                    se = self.se()
                    if se is not None:
                        t = (se.read_line(n.filename, n.linenumber) or "").strip()
                    if t.startswith(self.OUR_LINES):
                        n = getattr(n, "next", None)
                        continue
                return n
            return None

        def tree_range_plan(self):
            """[이 구간에 적용]을 누르면 할 일. None 또는 dict."""
            rr = self.tree_range_rows()
            if rr is None:
                return None
            rows, a, b = rr
            fn = self.tree_file()
            start = self._tree_ins_from(rows, a)
            if start is None or start[1] > max(rows[b]["line"], rows[a]["line"]):
                return dict(error="구간 안에 셰이더 줄을 넣을 수 있는 문장이 없습니다.")
            si = [ i for i, r in enumerate(rows) if r["ins"] and r["line"] == start[1] and r["kind"] != "fx" ][0]
            ## 끝 문장: 구간 안의 마지막 진짜 문장
            ei = None
            for i in range(b, a - 1, -1):
                if rows[i]["node"] is not None and rows[i]["kind"] not in ("label", "fx"):
                    ei = i
                    break
            if ei is None or ei < si:
                ei = si
            end = rows[ei]
            ins = set(l for l, _n in self.lines_of(fn))
            warn = [ ]

            pk_skip = [ ]

            def target_of(node):
                n = self._skip_ours(node)
                if n is None or getattr(n, "filename", None) != fn or n.linenumber not in ins:
                    return None
                if not self._tree_can_insert(fn, n.linenumber):
                    pk_skip.append(n.linenumber)
                    return None
                return (fn, n.linenumber)

            nxt = None
            if end["kind"] == "jump":
                warn.append("끝 줄이 jump/return이라 끝 다음 줄이 없습니다. 되돌리기는 넣지 않습니다.")
            else:
                nxt = target_of(getattr(end["node"], "next", None))
                if nxt is None and pk_skip:
                    warn.append("PyKaki 원고라 끝 다음 {}번째 줄(menu 같은 줄) 앞에는 줄을 넣을 수 없어서 되돌리기는 넣지 않습니다. 구간 끝을 한 줄 앞으로 잡아 보세요.".format(pk_skip[-1]))
                elif nxt is None:
                    warn.append("끝 다음에 이 파일에서 이어지는 줄이 없어서 되돌리기는 넣지 않습니다.")
            ## 시작과 끝이 다른 가지에 있으면: 가지가 합쳐지는 곳
            merge = None
            ps, pe = rows[si]["path"], end["path"]
            k = 0
            while k < len(ps) and k < len(pe) and ps[k] == pe[k]:
                k += 1
            if len(pe) > k:
                bid = pe[k][0]
                for r in rows:
                    if r["node"] is not None and id(r["node"]) == bid:
                        merge = target_of(getattr(r["node"], "next", None))
                        break
                warn.append("끝 줄이 선택지/if 가지 안이라, 다른 가지로 가면 끝 다음 줄을 지나지 않습니다.")
            mode = self.tree_end_mode
            if mode == "merge" and merge is None:
                mode = "next"
            restore = { "next": nxt, "merge": merge, "none": None }.get(mode)
            before = tuple(self._tpre.get(start, rows[si]["before"]))
            picks = tuple(self.get_picks())
            ## 구간 안에 이미 있는 셰이더가 바뀌는 곳
            stop = None
            if restore is not None:
                for i, r in enumerate(rows):
                    if r["ins"] and r["line"] == restore[1] and r["kind"] != "fx":
                        stop = i
                        break
            last = (stop - 1) if (stop is not None and stop > ei) else ei
            inner = [ r["point"] for r in rows[si:last + 1]
                if r.get("point") and r["point"]["target"] not in (start, restore) ]
            ## 되돌리기 자리에 이미 셰이더 줄이 있으면 그 줄을 따름
            restore_busy = False
            if restore is not None:
                e = self.line_edits.get(restore) or { }
                have = [ t for t in self.existing_lines(restore) if t.startswith(self.SHADER_HEADS) ]
                if ("slots" in e and e["slots"] is not None) or (have and "slots" not in e):
                    restore_busy = True
            return dict(start=start, end_line=end["line"], restore=restore, next=nxt, merge=merge,
                mode=mode, before=before, picks=picks, inner=inner, warn=warn, restore_busy=restore_busy, error=None)

        def tree_apply_range(self):
            p = self.tree_range_plan()
            if p is None:
                _ed.msg("줄기표에서 마디를 끌어 구간을 먼저 고르세요.")
                return
            if p.get("error"):
                _ed.msg(p["error"])
                return
            if self.se() is None:
                _ed.msg("원고 쓰기 도구(UI Kit 3.0 이상)가 없습니다.")
                return
            e = self._edit_for(p["start"])
            for k in ("remove", "fx", "overlay", "warp", "cursor"):
                e.pop(k, None)
            e["slots"] = p["picks"]
            e["transition"] = self.apply_tr
            sel = [ p["start"] ]
            note = ""
            r = p["restore"]
            if r is not None and not p["restore_busy"] and p["before"] != p["picks"]:
                e2 = self._edit_for(r)
                for k in ("remove", "fx", "overlay", "warp", "cursor"):
                    e2.pop(k, None)
                e2["slots"] = p["before"]
                e2["transition"] = self.apply_tr
                sel.append(r)
                note = " {}번째 줄부터 원래대로({}).".format(r[1], self.slots_text(p["before"]))
            elif r is not None and p["restore_busy"]:
                note = " 끝 다음 {}번째 줄에는 이미 셰이더 줄이 있어서 되돌리기는 넣지 않았습니다.".format(r[1])
            self.tree_tr_sel = tuple(sel)
            self.line_sel = p["start"]
            self.follow = False
            _ed.msg("{}번째 줄부터 {}.{} 전환 점 {}곳을 골라 두었습니다. 저장(Ctrl+S)하면 원고에 들어갑니다.".format(
                p["start"][1], self.slots_text(p["picks"]), note, len(sel)))
            renpy.restart_interaction()

        def tree_clear_inner(self):
            """구간 안에서 셰이더가 바뀌는 줄을 지우기로 함 (저장할 때)."""
            p = self.tree_range_plan()
            if not p or p.get("error") or not p["inner"]:
                _ed.msg("구간 안에 지울 셰이더 줄이 없습니다.")
                return
            n = 0
            for pt in p["inner"]:
                if pt["kind"] != "code":
                    continue
                t = pt["target"]
                have = [ x for x in self.existing_lines(t) if x.startswith(self.SHADER_HEADS) ]
                if have:
                    e = self._edit_for(t)
                    for k in ("fx", "overlay", "warp", "cursor", "transition", "remove"):
                        e.pop(k, None)
                    e["slots"] = None
                else:
                    e = self.line_edits.get(t)
                    if e is not None:
                        e.pop("slots", None)
                        e.pop("transition", None)
                        if not [ k for k in e if k != "expect" ]:
                            self.line_edits.pop(t, None)
                n += 1
            _ed.msg("구간 안의 셰이더 줄 {}곳을 지우기로 했습니다. (대사 괄호의 fx=는 그대로)".format(n))
            renpy.restart_interaction()

        def tree_set_end_mode(self, m):
            self.tree_end_mode = m
            renpy.restart_interaction()

        def tree_range_from_line(self, which):
            """앱에서: 고른 줄(원고 칸이나 목록에서 고른 것)을 구간의 시작/끝으로."""
            rows = self.tree_rows()
            if not rows or self.line_sel is None or self.line_sel[0] != self.tree_file():
                _ed.msg("줄을 먼저 고르세요.")
                return
            idx = [ i for i, r in enumerate(rows) if r["line"] == self.line_sel[1] and r["kind"] not in ("label", "branch") ]
            if not idx:
                _ed.msg("고른 줄이 줄기표에 없습니다.")
                return
            i = idx[0]
            rg = self.tree_range_rows()
            a, b = (rg[1], rg[2]) if rg else (i, i)
            if which == "start":
                a = i
                b = max(b, i)
            else:
                b = i
                a = min(a, i)
            self.tree_range = (self.tree_file(), a, b)
            self.tree_end_mode = "next"
            renpy.restart_interaction()

        def tree_clear_range(self):
            self.tree_range = None
            renpy.restart_interaction()

        ## ── 전환 점 ──

        def tree_points(self):
            return [ r["point"] for r in self.tree_rows() if r.get("point") ]

        def tree_toggle_point(self, target):
            sel = list(self.tree_tr_sel)
            if target in sel:
                sel.remove(target)
            else:
                sel.append(target)
            self.tree_tr_sel = tuple(sel)
            _ed.msg("전환 점 {}곳을 골랐습니다. 패널의 '고른 전환 점'에서 전환을 고르세요.".format(len(sel)) if sel else "고른 전환 점이 없습니다.")
            renpy.restart_interaction()

        def tree_sel_points(self):
            pts = dict((p["target"], p) for p in self.tree_points())
            return [ pts[t] for t in self.tree_tr_sel if t in pts ]

        def tree_select_range_points(self):
            """구간이 닿는 곳(구간 안과 끝 다음)의 전환 점을 모두 고름."""
            p = self.tree_range_plan()
            rr = self.tree_range_rows()
            if p is None or rr is None or p.get("error"):
                _ed.msg("줄기표에서 구간을 먼저 고르세요.")
                return
            rows, a, b = rr
            lo = p["start"][1]
            hi = p["restore"][1] if p["restore"] else rows[b]["line"]
            self.tree_tr_sel = tuple(pt["target"] for pt in self.tree_points() if lo <= pt["target"][1] <= hi)
            _ed.msg("구간이 닿는 전환 점 {}곳을 골랐습니다.".format(len(self.tree_tr_sel)))
            renpy.restart_interaction()

        def tree_set_tr(self, tr):
            pts = self.tree_sel_points()
            if not pts:
                _ed.msg("줄기표 오른쪽 동그라미를 눌러 전환 점을 먼저 고르세요.")
                return
            n = 0
            skipped = 0
            for pt in pts:
                if pt["kind"] == "say":
                    skipped += 1
                    continue
                e = self._edit_for(pt["target"])
                for k in ("remove", "fx", "overlay", "warp", "cursor"):
                    e.pop(k, None)
                e["slots"] = tuple(pt["slots"])
                e["transition"] = tr
                n += 1
            _ed.msg("전환 점 {}곳의 전환: {}.{} 저장(Ctrl+S)하면 원고에 들어갑니다.".format(
                n, self.tr_label(tr), " 대사 괄호 줄 {}곳은 '셰이더가 바뀌는 줄'에서 [[두 자리로 바꾸기] 먼저.".format(skipped) if skipped else ""))
            renpy.restart_interaction()

        def tree_sel_tr(self):
            """고른 전환 점의 전환이 모두 같으면 그 값, 아니면 None."""
            trs = set(p["tr"] for p in self.tree_sel_points())
            return trs.pop() if len(trs) == 1 else "__mixed__"

        def tree_row_text(self, r):
            """줄기표 행에 보일 (글, 색). 게임 서랍과 앱이 같이 씀."""
            tab = self
            if r["kind"] == "fx":
                pt = r.get("point")
                if pt:
                    s = "셰이더: {} ({})".format(tab.slots_text(pt["slots"]), tab.tr_label(pt["tr"]))
                else:
                    s = r["text"]
                col = "#ff8fbf" if r.get("point") else "#777777"
                if r.get("target") and "slots" in (tab.line_edits.get(r["target"]) or { }):
                    col = "#777777"
                    s = "(바꿀 예정) " + s
            elif r["kind"] == "label":
                s, col = r["text"], "#ffd23b"
            elif r["kind"] == "branch":
                s, col = r["text"], "#ffe58a"
            elif r["kind"] == "jump":
                s, col = r["text"].replace("jump ", "-> ", 1), "#8fd8ff"
            else:
                s, col = r["text"], ("#ffffff" if r["kind"] == "say" else "#bbbbbb")
            if r.get("pending") and r.get("point"):
                s = "* {} | {}".format(tab.slots_text(r["point"]["slots"]), s)
                col = "#ff8fbf"
            elif r.get("pending"):
                s = "* (셰이더 줄 지움) " + s
                col = "#ffb27a"
            return s, col

        ## ── 지우기 (Delete): 구간이나 고른 전환 점의 셰이더 줄을 지움. 그 자리는 앞에서 이어진 값을 따름 ──

        def _say_tab(self):
            say = _ed.get_tab("say") if hasattr(_ed, "get_tab") else None
            return say.ss() if (say is not None and hasattr(say, "ss")) else None

        def _say_fx_removed(self, key):
            """대사 탭에서 이 줄 괄호의 fx=를 빼기로 했는지 (저장 전)."""
            ss = self._say_tab()
            if ss is None:
                return False
            try:
                d = ss.state.line_edits.get(key) or { }
                return d.get("fx") == ss.REMOVE and d.get("fx_overlay") == ss.REMOVE
            except Exception:
                return False

        def _tree_drop_point(self, pt):
            """전환 점 하나를 지우기로 함. 됐으면 True."""
            t = pt["target"]
            if pt["kind"] == "say":
                ss = self._say_tab()
                if ss is None:
                    return False
                d = ss.state.line_edits.setdefault(t, { })
                for k in ("fx", "fx_overlay", "fx_transition"):
                    d[k] = ss.REMOVE
                return True
            have = [ x for x in self.existing_lines(t) if x.startswith(self.SHADER_HEADS) ]
            if have:
                e = self._edit_for(t)
                for k in ("fx", "overlay", "warp", "cursor", "transition", "remove"):
                    e.pop(k, None)
                e["slots"] = None
                return True
            e = self.line_edits.get(t)
            if e is not None and "slots" in e:
                e.pop("slots", None)
                e.pop("transition", None)
                if not [ k for k in e if k != "expect" ]:
                    self.line_edits.pop(t, None)
                return True
            return False

        def tree_delete(self):
            """Delete: 고른 구간 안(끝 다음의 '원래대로' 줄까지)과 고른 전환 점의 셰이더 줄을 지움."""
            if not self.tree_open:
                return
            rows = self.tree_rows()
            pts = [ (i, r["point"]) for i, r in enumerate(rows) if r.get("point") ]
            pick = [ ]
            rr = self.tree_range_rows()
            lo = hi = None
            if rr is not None:
                _rows, a, b = rr
                lo, hi = a, b
                p = self.tree_range_plan()
                restore = p.get("restore") if (p and not p.get("error")) else None
                ## 구간 안 문장 바로 위의 셰이더 줄(대상이 구간 안인 점)도 같이
                inside = set((self.tree_file(), r["line"]) for r in rows[a:b + 1] if r["ins"])
                for i, pt in pts:
                    if a <= i <= b or pt["target"] in inside or (restore is not None and pt["target"] == restore):
                        pick.append(pt)
            sel = set(self.tree_tr_sel)
            for i, pt in pts:
                if pt["target"] in sel:
                    pick.append(pt)
            seen = set()
            n = 0
            for pt in pick:
                k = (pt["target"], pt["kind"])
                if k in seen:
                    continue
                seen.add(k)
                if self._tree_drop_point(pt):
                    n += 1
            self.tree_tr_sel = ()
            if not n:
                _ed.msg("지울 셰이더 줄이 없습니다. 줄기표에서 구간을 끌어 고르거나 오른쪽 네모 점을 고르세요.")
                renpy.restart_interaction()
                return
            note = ""
            if lo is not None:
                rows = self.tree_rows()
                left = [ r["slots"] for r in rows[lo:hi + 1] if r.get("slots") and r["slots"] != (NONE, NONE) ]
                if left:
                    note = " 이 구간에는 앞에서 이어진 셰이더({})가 보입니다. 둘 다 기본으로 하려면 앞의 셰이더 줄도 지우세요.".format(self.slots_text(left[0]))
            self.tree_range = None
            _ed.msg("셰이더 줄 {}곳을 지우기로 했습니다.{} 저장(Ctrl+S)하면 원고에서 빠집니다.".format(n, note))
            renpy.restart_interaction()

        ## ── pygaki 앱과 이어질 때 (docs/LINK.md 9장 state.flow, cmd flow) ──

        def flow_state(self):
            """앱에 보낼 줄기표. 접혀 있으면 {"open": false}만."""
            if not self.tree_open:
                return dict(open=False)
            fn = self.tree_file()
            rows = self.tree_rows() if fn else [ ]
            hk = self.here_key()
            out = [ ]
            for r in rows:
                s, col = self.tree_row_text(r)
                a, b = r.get("slots") or (NONE, NONE)
                pt = r.get("point")
                out.append(dict(
                    l=r["line"], k=r["kind"], d=r["depth"], g=sorted(r["guides"]), t=s, c=col,
                    a=_flow_color(a), b=_flow_color(b), s=self.slots_text((a, b)),
                    p=([ pt["target"][0], pt["target"][1] ] if pt else None),
                    i=bool(r["ins"] and r["kind"] != "fx"),
                    ))
            rr = self.tree_range_rows()
            return dict(
                open=True,
                file=fn,
                rows=out,
                range=([ rr[1], rr[2] ] if rr else None),
                sel=(self.line_sel[1] if (self.line_sel and self.line_sel[0] == fn) else None),
                here=(hk[1] if (hk and hk[0] == fn) else None),
                points=[ [ t[0], t[1] ] for t in self.tree_tr_sel ],
                )

        def flow_cmd(self, c):
            """앱에서 온 명령 {"cmd": "flow", "do": …}. 화면을 다시 그려야 하면 True."""
            do = c.get("do")
            if do in ("open", "close", "toggle"):
                want = (not self.tree_open) if do == "toggle" else (do == "open")
                if want != bool(self.tree_open):
                    self.tree_toggle()
                return True
            if not self.tree_open:
                return False
            rows = self.tree_rows()
            if do == "range":
                if c.get("a") is None:
                    self.tree_range = None
                else:
                    a, b = sorted((int(c["a"]), int(c["b"])))
                    a = max(0, min(len(rows) - 1, a))
                    b = max(0, min(len(rows) - 1, b))
                    self.tree_range = (self.tree_file(), a, b)
                    self.tree_end_mode = "next"
                    _ed.msg("{}~{}번째 줄을 골랐습니다. 1번, 2번 셰이더를 고르고 [[이 구간에 적용]을 누르세요.".format(
                        rows[a]["line"], rows[b]["line"]))
                return True
            if do == "pick":
                i = int(c.get("row", -1))
                if not (0 <= i < len(rows)):
                    return False
                k = self._tree_ins_from(rows, i)
                if k is None:
                    _ed.msg("이 마디 아래에는 고를 수 있는 줄이 없습니다.")
                    return True
                self.tree_range = None
                self.pick_line(k)
                return True
            if do == "delete":
                self.tree_delete()
                return True
            if do == "point":
                t = c.get("target") or [ ]
                if len(t) == 2:
                    self.tree_toggle_point((str(t[0]), int(t[1])))
                return True
            return False

        def tree_after_save(self):
            self.tree_range = None
            self.tree_tr_sel = ()
            self._tcache = None

    ## ── 줄기표 그리기 ──

    _FLOW_COLORS = ("#ff5fa2", "#4fc3f7", "#ffd23b", "#7ee787", "#c39bff", "#ff9e57", "#5ee6d0", "#f0f0f0")
    _flow_texts = { }

    def _flow_color(name):
        if name in (None, NONE):
            return None
        h = 0
        for ch in str(name):
            h = (h * 31 + ord(ch)) & 0xffff
        return _FLOW_COLORS[h % len(_FLOW_COLORS)]

    def _flow_text(s, color, size=12):
        k = (s, color, size)
        t = _flow_texts.get(k)
        if t is None:
            if len(_flow_texts) > 3000:
                _flow_texts.clear()
            t = _flow_texts[k] = store.Text(s, style="ui_editor_small", size=size, color=color, outlines=[ ], substitute=False)
        return t

    class FlowTreeView(store.renpy.Displayable):
        """줄기표 본문. 입력은 편집기 입력층이 탭의 drag_begin/drag_move/drag_end로 넘겨줌."""

        def __init__(self, tab, **kw):
            super(FlowTreeView, self).__init__(**kw)
            self.tab = tab

        def render(self, width, height, st, at):
            tab = self.tab
            vx, vy, vw, vh = tab.tree_view_rect()
            rv = renpy.Render(vw, vh)
            rows = tab.tree_rows()
            R = tab.TREE_ROW
            L = tab.TREE_LANE
            vis = tab.tree_visible()
            top = int(max(0, min(tab.tree_scroll, max(0, len(rows) - vis))))
            tab.tree_scroll = top
            rr = tab.tree_range_rows()
            ra, rb = (rr[1], rr[2]) if rr else (-1, -1)
            hk = tab.here_key()
            sel = tab.line_sel
            trs = set(tab.tree_tr_sel)
            gx = 40
            band_x = vw - tab.TREE_DOT - 12
            fn = tab.tree_file()

            def solid(c, x, y, w, h):
                if w <= 0 or h <= 0:
                    return
                rv.blit(renpy.render(store.Solid(c), w, h, st, at), (int(x), int(y)))

            for k in range(vis):
                i = top + k
                if i >= len(rows):
                    break
                r = rows[i]
                y = k * R
                key = (fn, r["line"])
                ## 바탕: 구간, 고른 줄
                if ra <= i <= rb:
                    solid("#ff3b8d44", 0, y, vw, R)
                elif r["ins"] and sel == key:
                    solid("#ffffff22", 0, y, vw, R)
                if r["ins"] and hk == key:
                    solid("#ff3b8d", 0, y + 2, 3, R - 4)
                ## 줄 번호
                num = _flow_text("{}".format(r["line"]), "#ff3b8d" if (r["ins"] and hk == key) else "#888888", 11)
                nr = renpy.render(num, 40, R, st, at)
                rv.blit(nr, (int(gx - 6 - nr.width), int(y + (R - nr.height) / 2)))
                ## 줄기
                d = min(r["depth"], 8)
                for g in r["guides"]:
                    if g <= 8:
                        solid("#ffffff40", gx + g * L + 4, y, 2, R)
                cx = gx + d * L + 5
                cy = y + R // 2
                if r["kind"] == "branch":
                    solid("#ffd23b", gx + (d - 1) * L + 4, cy - 1, L + 2, 2)
                    solid("#ffd23b", cx - 4, cy - 4, 8, 8)
                    solid("#202028", cx - 2, cy - 2, 4, 4)
                elif r["kind"] == "label":
                    solid("#ffd23b", cx - 5, cy - 5, 10, 10)
                else:
                    c = { "fx": "#ff3b8d", "jump": "#4fc3f7", "call": "#4fc3f7", "menu": "#ffd23b",
                          "show": "#7ee787", "say": "#dddddd" }.get(r["kind"], "#999999")
                    s = 6 if r["kind"] != "fx" else 8
                    solid(c, cx - s // 2, cy - s // 2, s, s)
                ## 덮인 셰이더 띠 (1번 왼쪽, 2번 오른쪽)
                a, b = r.get("slots") or (NONE, NONE)
                ca, cb = _flow_color(a), _flow_color(b)
                if ca:
                    solid(ca, band_x, y, 5, R)
                if cb:
                    solid(cb, band_x + 6, y, 5, R)
                ## 글
                tx = gx + (d + 1) * L + 4
                avail = band_x - 6 - tx
                s, col = tab.tree_row_text(r)
                if len(s) > 90:
                    s = s[:89]
                if avail > 10:
                    tr = renpy.render(_flow_text(s, col), 2000, R, st, at)
                    w = min(tr.width, avail)
                    rv.blit(tr.subsurface((0, 0, w, min(tr.height, R))), (int(tx), int(y + (R - min(tr.height, R)) / 2)))
                ## 전환 점
                pt = r.get("point")
                if pt:
                    dx = vw - tab.TREE_DOT // 2 - 1
                    on = pt["target"] in trs
                    solid("#ffffff" if on else "#ff3b8d", dx - 6, cy - 6, 12, 12)
                    solid("#ff3b8d" if on else "#202028", dx - 3, cy - 3, 6, 6)
            return rv

    def flow_view(tab):
        return FlowTreeView(tab)


## 줄기표 서랍 (게임 화면 위). 편집기 패널의 반대쪽에 그림
screen ui_editor_fx_tree_overlay():

    $ tab = ui_editor.current_tab()
    if tab is not None and hasattr(tab, "tree_on") and tab.tree_on():
        $ _x, _y, _w, _h = tab.tree_box()
        $ _vx, _vy, _vw, _vh = tab.tree_view_rect()
        $ _fn = tab.tree_file()
        $ _rows = tab.tree_rows()

        add Solid("#14141cee") pos (_x, _y) xysize (_w, _h)
        add Solid("#ff3b8d") pos (_x, _y) xysize (_w, 2)

        hbox:
            pos (_x + 8, _y + 4)
            spacing 6
            text ("줄기표 - " + (tab.tree_short(_fn) if _fn else "원고 없음")) style "ui_editor_text" size 14 yalign 0.5
            textbutton "지금 줄" style "ui_editor_button" text_size 12 padding (4, 1) action Function(tab.tree_show_here) yalign 0.5
            textbutton "G 접기" style "ui_editor_button" text_size 12 padding (4, 1) action Function(tab.tree_toggle) yalign 0.5

        if _rows:
            add screen_fx.flow_view(tab) pos (_vx, _vy)
        else:
            text "이 원고 파일에서 label 안의 줄을 찾지 못했습니다. 게임을 진행한 뒤 다시 펴세요." style "ui_editor_small" pos (_vx, _vy) xmaximum _vw

        text "누르기: 그 줄로 | 끌기: 구간 | 네모 점: 전환 점 | Delete: 셰이더 지우기 | 휠: 스크롤" style "ui_editor_small" size 11 pos (_x + 8, _y + _h - 18)


## 패널 안 줄기표 칸 (앱에도 보임)
screen ui_editor_fx_tree_panel(tab):

    vbox:
        spacing 4

        hbox:
            spacing 6
            box_wrap True
            box_wrap_spacing 4
            xmaximum 632
            textbutton ("G 줄기표 접기" if tab.tree_open else "G 줄기표 펴기") style "ui_editor_button" action Function(tab.tree_toggle) selected tab.tree_open
            if tab.tree_open:
                textbutton "고른 줄을 구간 시작으로" style "ui_editor_fx_button" action Function(tab.tree_range_from_line, "start")
                textbutton "구간 끝으로" style "ui_editor_fx_button" action Function(tab.tree_range_from_line, "end")

        if tab.tree_open:
            $ _p = tab.tree_range_plan()
            if _p is None:
                text "줄기표에서 마디를 끌어 구간을 고르세요. (앱에서는 원고 칸에서 줄을 고르고 위 두 버튼)" style "ui_editor_small"
            elif _p.get("error"):
                text _p["error"] style "ui_editor_small" color "#ffd23b"
                textbutton "구간 풀기" style "ui_editor_fx_button" action Function(tab.tree_clear_range)
            else:
                text ("구간: {}~{}번째 줄 → {}".format(_p["start"][1], _p["end_line"], tab.slots_text(_p["picks"]))) style "ui_editor_small" color "#ffffff"
                if _p["restore"] is not None:
                    text ("끝난 뒤 {}번째 줄부터 원래대로: {}{}".format(_p["restore"][1], tab.slots_text(_p["before"]),
                        " (그 줄에 이미 셰이더 줄이 있어서 안 넣음)" if _p["restore_busy"] else "")) style "ui_editor_small"
                else:
                    text "끝난 뒤 되돌리기: 넣지 않음" style "ui_editor_small"
                if _p["merge"] is not None and _p["merge"] != _p["next"]:
                    hbox:
                        spacing 4
                        box_wrap True
                        xmaximum 632
                        use ui_editor_fx_name("되돌리는 곳")
                        textbutton "끝 다음 줄" style "ui_editor_fx_button" action Function(tab.tree_set_end_mode, "next") selected (_p["mode"] == "next")
                        textbutton "가지가 합쳐지는 곳" style "ui_editor_fx_button" action Function(tab.tree_set_end_mode, "merge") selected (_p["mode"] == "merge")
                        textbutton "안 넣음" style "ui_editor_fx_button" action Function(tab.tree_set_end_mode, "none") selected (_p["mode"] == "none")
                for _w in _p["warn"]:
                    text _w style "ui_editor_small" color "#ffd23b"
                if _p["inner"]:
                    text ("구간 안에 셰이더가 바뀌는 줄이 {}곳 있습니다. 그 줄부터는 그 줄의 셰이더가 보입니다.".format(len(_p["inner"]))) style "ui_editor_small" color "#ffd23b"
                hbox:
                    spacing 6
                    box_wrap True
                    box_wrap_spacing 4
                    xmaximum 632
                    textbutton "이 구간에 적용" style "ui_editor_button" action Function(tab.tree_apply_range)
                    if _p["inner"]:
                        textbutton "구간 안 셰이더 줄 지우기" style "ui_editor_fx_button" action Function(tab.tree_clear_inner)
                    textbutton "구간이 닿는 전환 점 고르기" style "ui_editor_fx_button" action Function(tab.tree_select_range_points)
                    textbutton "구간 풀기" style "ui_editor_fx_button" action Function(tab.tree_clear_range)
                    textbutton "구간의 셰이더 지우기 (Delete)" style "ui_editor_fx_button" action Function(tab.tree_delete)

            $ _sp = tab.tree_sel_points()
            if _sp:
                $ _cur = tab.tree_sel_tr()
                hbox:
                    spacing 4
                    box_wrap True
                    box_wrap_spacing 4
                    xmaximum 632
                    use ui_editor_fx_name("고른 전환 점 {}곳 ({}번째 줄)".format(len(_sp), ", ".join(str(p["line"]) for p in _sp[:6]) + (" …" if len(_sp) > 6 else "")))
                    for _t, _tl in tab.TR_CHOICES:
                        textbutton _tl style "ui_editor_fx_button" action Function(tab.tree_set_tr, _t) selected (_cur == _t)
                    textbutton "고르기 풀기" style "ui_editor_fx_button" action SetField(tab, "tree_tr_sel", ())
                    textbutton "고른 점 지우기 (Delete)" style "ui_editor_fx_button" action Function(tab.tree_delete)
