################################################################################
## pygaki 게임 안 편집 화면 — "화면" 탭 (4.13)
##
## 대본 편집기의 [화면] 탭에서 만든 화면과 HUD(game/pykaki_screens.rpy)를 게임 화면 위에서 고칩니다.
## 고치는 것: 항목 자리(끌기, 화살표), HUD 붙일 곳·옮기기·크기, 글(글, 글 버튼, 놓는 곳).
## 항목 더하기·지우기, 버튼이 할 일, 꼴·막대 크기는 대본 편집기에서 고칩니다.
##
## 대본 편집기가 같이 쓰는 game/pykaki_screens.json(개발용)에서 화면 자리를 읽고,
## Ctrl+S로 저장하면 pykaki_screens.rpy의 그 줄(# @s:, # @i: 표시)을 고치고
## showpy_inbox.json에도 적어서 대본 편집기가 받아 적습니다. 형식은 docs/LINK.md 3장, 12장.
################################################################################

init -8 python in ui_editor:

    import json as _sc_json
    import os as _sc_os
    import re as _sc_re

    SCREENS_META = "pykaki_screens.json"
    SCREENS_RPY = "pykaki_screens.rpy"

    ## 붙일 곳: (이름, 가로 0~1, 세로 0~1). 3x3 차례
    SC_ANCHORS = (
        ("tl", 0.0, 0.0), ("t", 0.5, 0.0), ("tr", 1.0, 0.0),
        ("l", 0.0, 0.5), ("c", 0.5, 0.5), ("r", 1.0, 0.5),
        ("bl", 0.0, 1.0), ("b", 0.5, 1.0), ("br", 1.0, 1.0),
        )
    SC_ANCHOR = { _k: (_x, _y) for _k, _x, _y in SC_ANCHORS }
    SC_ANCHOR_NAME = {
        "tl": "왼쪽 위", "t": "위 가운데", "tr": "오른쪽 위",
        "l": "왼쪽 가운데", "c": "가운데", "r": "오른쪽 가운데",
        "bl": "왼쪽 아래", "b": "아래 가운데", "br": "오른쪽 아래",
        }
    SC_KIND = {
        "text": "글", "textbutton": "글 버튼", "image": "그림", "imagebutton": "그림 버튼",
        "bar": "막대", "drop": "놓는 곳", "look": "플래그 꼴", "voice": "음성 빛",
        }
    SC_TEXT_KINDS = ("text", "textbutton", "drop")
    SC_HUD_W = 420
    SC_HUD_H = 160

    ## JSON 글자 (대본 편집기의 원고와 같은 꼴: 큰따옴표, 한글 그대로)
    def _sc_lit(s):
        return _sc_json.dumps(s, ensure_ascii=False)

    _SC_STR = _sc_re.compile(r'"(?:[^"\\]|\\.)*"')

    def sc_patch(text, sid, hud, items):
        """pykaki_screens.rpy 글에서 화면 sid를 고칩니다.
            hud   : dict(w, h, anchor, dx, dy) 또는 None (HUD를 안 고침)
            items : { 항목 id: dict(x, y, text 중 고친 것) }
        돌려줌: (고친 글, 못 고친 것 목록)"""

        lines = text.splitlines(True)
        missing = [ ]

        def body(i):
            return lines[i].rstrip("\r\n")

        def eol(i):
            return lines[i][len(body(i)):]

        def ind(i):
            b = body(i)
            return len(b) - len(b.lstrip(" "))

        def put(i, new):
            lines[i] = new + eol(i)

        start = None
        for i in range(len(lines)):
            if body(i).rstrip().endswith("# @s:" + sid):
                start = i
                break
        if start is None:
            return text, [ "화면 표시(# @s:{})".format(sid) ]

        end = len(lines)
        for i in range(start + 1, len(lines)):
            if body(i).strip() and ind(i) == 0:
                end = i
                break

        if hud is not None:
            fx = None
            for i in range(start + 1, end):
                if ind(i) == 4 and body(i).strip() == "fixed:":
                    fx = i
                    break
            if fx is None:
                missing.append("HUD 칸")
            else:
                ax, ay = SC_ANCHOR.get(hud["anchor"], (0.0, 0.0))
                at = { }
                for i in range(fx + 1, end):
                    if ind(i) < 8 and body(i).strip():
                        break
                    if ind(i) != 8:
                        continue
                    for k in ("xysize", "align", "offset", "viewport:"):
                        if body(i).strip().startswith(k) and k not in at:
                            at[k] = i
                sp = " " * 8
                if "xysize" in at:
                    put(at["xysize"], "{}xysize ({}, {})".format(sp, int(hud["w"]), int(hud["h"])))
                if "align" in at:
                    put(at["align"], "{}align ({:.1f}, {:.1f})".format(sp, ax, ay))
                dx, dy = int(hud["dx"]), int(hud["dy"])
                if "offset" in at:
                    if dx or dy:
                        put(at["offset"], "{}offset ({}, {})".format(sp, dx, dy))
                    else:
                        lines[at["offset"]] = ""
                elif (dx or dy) and "align" in at:
                    i = at["align"]
                    lines[i] = lines[i] + "{}offset ({}, {}){}".format(sp, dx, dy, eol(i) or "\n")
                ## 스크롤: viewport 크기도 HUD 크기
                if "viewport:" in at:
                    i = at["viewport:"] + 1
                    if i < end and body(i).strip().startswith("xysize"):
                        put(i, "{}xysize ({}, {})".format(" " * 12, int(hud["w"]), int(hud["h"])))

        for iid, ch in items.items():
            m = None
            for i in range(start + 1, end):
                if body(i).rstrip().endswith("# @i:" + iid):
                    m = i
                    break
            if m is None:
                missing.append("항목 표시(# @i:{})".format(iid))
                continue
            k = ind(m)
            stop = end
            for i in range(m + 1, end):
                if body(i).strip() and ind(i) <= k:
                    stop = i
                    break
            if "x" in ch or "y" in ch:
                x, y = int(ch["x"]), int(ch["y"])
                done = False
                for i in range(m + 1, stop):
                    s = body(i).strip()
                    if ind(i) == k + 4 and s.startswith("pos (") and not done:
                        put(i, "{}pos ({}, {})".format(" " * (k + 4), x, y))
                        done = True
                    elif "_PkBack(" in s:
                        put(i, _sc_re.sub(r"_PkBack\([^)]*\)", "_PkBack({}, {})".format(x, y), body(i)))
                if not done:
                    missing.append("항목 자리(# @i:{})".format(iid))
            if "text" in ch:
                cand = [ m ] + list(range(m + 1, stop))
                done = False
                for i in cand:
                    s = body(i).strip()
                    if s.startswith('text "') or s.startswith('textbutton "'):
                        b = body(i)
                        mm = _SC_STR.search(b)
                        if mm:
                            put(i, b[:mm.start()] + _sc_lit(ch["text"]) + b[mm.end():])
                            done = True
                            break
                if not done:
                    missing.append("항목 글(# @i:{}): 글이 비어 있던 놓는 곳은 대본 편집기에서".format(iid))

        return "".join(lines), missing

    class ScreensTab(Tab):

        id = "screens"
        label = "화면"
        panel_screen = "ui_editor_screens_panel"
        overlay_screen = "ui_editor_screens_overlay"

        def __init__(self):
            self.meta = None            # pykaki_screens.json의 screens
            self.cur = None             # 고른 화면 id
            self.sel = None             # 고른 항목 id (None이면 HUD 자체)
            self.hud_edits = { }        # 화면 id -> dict(anchor, dx, dy, w, h 중 고친 것)
            self.item_edits = { }       # (화면 id, 항목 id) -> dict(x, y, text 중 고친 것)
            self.fail = ""
            self._rects = [ ]           # 그린 항목 자리 [(항목 id, (x, y, w, h))]
            self._ops = None
            self._inputs = { }

        ## ── 읽기 ──

        def load(self):
            p = _sc_os.path.join(store.config.gamedir, SCREENS_META)
            try:
                with open(p, "rb") as f:
                    d = _sc_json.loads(f.read().decode("utf-8"))
                self.meta = d.get("screens", [ ]) if d.get("format") == "pygaki-screens" else [ ]
            except Exception:
                self.meta = [ ]
            if self.meta and self.screen() is None:
                self.cur = self.meta[0]["id"]
                self.sel = None
            self.touch()

        def reload(self):
            self.load()
            msg("화면 자리를 다시 읽었습니다.")

        def available(self):
            if not store.script_edit.enabled():
                return (False, "개발 모드에서만 고칠 수 있습니다.")
            if self.meta is None:
                self.load()
            if not self.meta:
                return (False, "고칠 화면이 없습니다. 대본 편집기의 [[화면] 탭에서 화면이나 HUD를 만들고 내보내면 생깁니다.")
            return (True, "")

        def on_open(self):
            if not self.pending():
                self.load()

        def touch(self):
            store.renpy.redraw(screens_view, 0)
            store.renpy.restart_interaction()

        def screens(self):
            return self.meta or [ ]

        def screen(self, sid=None):
            sid = sid or self.cur
            for s in self.screens():
                if s["id"] == sid:
                    return s
            return None

        def is_hud(self, s=None):
            s = s or self.screen()
            return s is not None and s.get("kind") == "hud"

        def hud(self, s=None):
            """HUD의 지금 값 (고친 것 반영)."""
            s = s or self.screen()
            d = dict(w=s.get("w", SC_HUD_W), h=s.get("h", SC_HUD_H), anchor=s.get("anchor", "tl"), dx=s.get("dx", 0), dy=s.get("dy", 0))
            d.update(self.hud_edits.get(s["id"], { }))
            return d

        def items(self):
            s = self.screen()
            return s["items"] if s else [ ]

        def item(self, iid):
            for it in self.items():
                if it["id"] == iid:
                    return it
            return None

        def sel_item(self):
            return self.item(self.sel) if self.sel else None

        def ival(self, it):
            d = dict(x=it["x"], y=it["y"], text=it.get("text", ""))
            d.update(self.item_edits.get((self.cur, it["id"]), { }))
            return d

        def has_text(self, it):
            return it is not None and it["kind"] in SC_TEXT_KINDS

        def item_label(self, it):
            v = self.ival(it)
            what = v["text"] if it["kind"] in SC_TEXT_KINDS else (it.get("image") or it.get("flag") or "")
            what = (what or "").replace("\n", " ")
            if len(what) > 12:
                what = what[:12] + "..."
            return SC_KIND.get(it["kind"], it["kind"]) + (" " + what if what else "")

        def changed_item(self, it):
            return (self.cur, it["id"]) in self.item_edits

        def box(self):
            """화면 칸 (x, y, w, h). 전체 화면이면 게임 화면 전체."""
            SW, SH = store.config.screen_width, store.config.screen_height
            s = self.screen()
            if not self.is_hud(s):
                return (0, 0, SW, SH)
            h = self.hud(s)
            ax, ay = SC_ANCHOR.get(h["anchor"], (0.0, 0.0))
            return (int(round((SW - h["w"]) * ax)) + int(h["dx"]), int(round((SH - h["h"]) * ay)) + int(h["dy"]), int(h["w"]), int(h["h"]))

        ## ── 고르기 ──

        def pick_screen(self, sid):
            self.cur = sid
            self.sel = None
            self.touch()

        def pick_item(self, iid):
            self.sel = iid
            self.touch()

        def select(self, step):
            order = ([ None ] if self.is_hud() else [ ]) + [ it["id"] for it in self.items() ]
            if not order:
                return
            i = order.index(self.sel) if self.sel in order else -1
            self.sel = order[(i + step) % len(order)]
            self.touch()

        ## ── 고치기 ──

        def put_item(self, iid, **kw):
            it = self.item(iid)
            if it is None:
                return
            key = (self.cur, iid)
            e = dict(self.item_edits.get(key, { }))
            e.update(kw)
            for k in list(e):
                if e[k] == it.get(k, "" if k == "text" else None):
                    del e[k]
            if e:
                self.item_edits[key] = e
            else:
                self.item_edits.pop(key, None)
            self.touch()

        def put_hud(self, **kw):
            s = self.screen()
            if not self.is_hud(s):
                return
            base = dict(w=s.get("w", SC_HUD_W), h=s.get("h", SC_HUD_H), anchor=s.get("anchor", "tl"), dx=s.get("dx", 0), dy=s.get("dy", 0))
            e = dict(self.hud_edits.get(s["id"], { }))
            e.update(kw)
            if "w" in e:
                e["w"] = max(20, int(e["w"]))
            if "h" in e:
                e["h"] = max(20, int(e["h"]))
            for k in list(e):
                if e[k] == base[k]:
                    del e[k]
            if e:
                self.hud_edits[s["id"]] = e
            else:
                self.hud_edits.pop(s["id"], None)
            self.touch()

        def set_anchor(self, k):
            ## 붙일 곳을 바꾸면 옮긴 만큼은 0으로 (그 칸에 딱 붙음)
            self.put_hud(anchor=k, dx=0, dy=0)

        def grow(self, k, amount):
            self.put_hud(**{ k: self.hud()[k] + amount })

        def zero_offset(self):
            self.put_hud(dx=0, dy=0)

        def reset_item(self):
            if self.sel:
                self.item_edits.pop((self.cur, self.sel), None)
            elif self.is_hud():
                self.hud_edits.pop(self.cur, None)
            self.touch()

        def move(self, dx, dy):
            it = self.sel_item()
            if it is not None:
                v = self.ival(it)
                self.put_item(it["id"], x=int(v["x"] + dx), y=int(v["y"] + dy))
            elif self.is_hud():
                h = self.hud()
                self.put_hud(dx=int(h["dx"] + dx), dy=int(h["dy"] + dy))

        def drag_begin(self, x, y):
            for iid, (rx, ry, rw, rh) in reversed(self._rects):
                if rx <= x < rx + rw and ry <= y < ry + rh:
                    self.sel = iid
                    v = self.ival(self.item(iid))
                    self.touch()
                    return ("item", iid, v["x"], v["y"])
            bx, by, bw, bh = self.box()
            if self.is_hud() and bx <= x < bx + bw and by <= y < by + bh:
                self.sel = None
                h = self.hud()
                self.touch()
                return ("hud", None, h["dx"], h["dy"])
            return None

        def drag_move(self, token, dx, dy):
            kind, iid, ox, oy = token
            if kind == "item":
                self.put_item(iid, x=int(ox + dx), y=int(oy + dy))
            else:
                self.put_hud(dx=int(ox + dx), dy=int(oy + dy))

        def focus_rect(self):
            for iid, r in self._rects:
                if iid == self.sel:
                    return r
            return self.box() if self.is_hud() else None

        def text_input(self, iid):
            key = (self.cur, iid)
            if key not in self._inputs:
                self._inputs[key] = ScreenTextInput(self.cur, iid)
            return self._inputs[key]

        ## ── 저장 ──

        def pending(self):
            return len(self.hud_edits) + len(self.item_edits)

        def discard(self):
            self.hud_edits = { }
            self.item_edits = { }
            self.touch()

        def file_path(self, filename):
            return _sc_os.path.join(store.config.gamedir, filename)

        def new_meta(self):
            """고친 것을 넣은 pykaki_screens.json 내용."""
            out = [ ]
            for s in self.screens():
                s = dict(s)
                if s["id"] in self.hud_edits:
                    s.update(self.hud_edits[s["id"]])
                items = [ ]
                for it in s["items"]:
                    it = dict(it)
                    it.update(self.item_edits.get((s["id"], it["id"]), { }))
                    items.append(it)
                s["items"] = items
                out.append(s)
            return out

        def layout_file(self):
            self.fail = ""
            self._ops = None
            path = self.file_path(SCREENS_RPY)
            try:
                with open(path, "rb") as f:
                    raw = f.read()
            except Exception:
                self.fail = "{}을 읽지 못했습니다. 대본 편집기에서 다시 내보내 주세요.".format(SCREENS_RPY)
                return None
            bom = raw.startswith(b"\xef\xbb\xbf")
            text = raw[3:].decode("utf-8") if bom else raw.decode("utf-8")

            se = store.script_edit
            ops = [ ]
            missing = [ ]
            sids = set(self.hud_edits) | set(s for s, i in self.item_edits)
            for sid in sids:
                s = self.screen(sid)
                if s is None:
                    continue
                hud = None
                if sid in self.hud_edits:
                    hud = self.hud(s)
                    ops.append(dict(id=se._pk_id(), op="screen", screen=sid, set=dict(self.hud_edits[sid])))
                items = { }
                for (s2, iid), ch in self.item_edits.items():
                    if s2 != sid:
                        continue
                    it = None
                    for x in s["items"]:
                        if x["id"] == iid:
                            it = x
                    if it is None:
                        continue
                    full = dict(ch)
                    if "x" in ch or "y" in ch:
                        full.setdefault("x", it["x"])
                        full.setdefault("y", it["y"])
                    items[iid] = full
                    ops.append(dict(id=se._pk_id(), op="screen_item", screen=sid, item=iid, set=dict(ch)))
                text, miss = sc_patch(text, sid, hud, items)
                missing += miss

            if missing:
                ## 표시가 없는 예전 원고: 대본 편집기에서 한 번 다시 내보내면 표시가 붙음
                self.fail = "원고에서 고칠 줄을 찾지 못해 저장하지 않았습니다 ({}). 대본 편집기를 새 판으로 올리고 다시 내보내 주세요.".format(", ".join(missing[:3]))
                return None

            try:
                se._backup(path, raw)
            except Exception:
                pass
            self._ops = ops
            meta = _sc_json.dumps(dict(format="pygaki-screens", version=1, screens=self.new_meta()), ensure_ascii=False, indent=1) + "\n"
            data = (u"﻿" if bom else u"") + text
            return [ (SCREENS_RPY, data), (SCREENS_META, meta) ]

        def after_save(self):
            if self._ops:
                try:
                    store.script_edit._inbox_add(self.file_path(SCREENS_RPY), self._ops)
                except Exception as e:
                    self.fail = "대본 편집기에 보낼 기록을 쓰지 못했습니다: {}".format(e)
            self._ops = None
            self.hud_edits = { }
            self.item_edits = { }
            self.load()
            ## 화면 원고가 바뀌었으니 다시 불러와 게임에 보이게
            return True

        def info_lines(self):
            n = self.pending()
            rv = [
                "항목을 끌어 옮기고, HUD 안 빈 곳을 끌면 HUD가 옮겨집니다. 화살표로 1px(Shift 10px), Tab으로 항목 고르기, Backspace로 원래대로.",
                "저장 안 한 변경: {}개".format(n) if n else "저장 안 한 변경 없음",
                ]
            if self.fail:
                rv.append(self.fail)
            return rv

        def help_lines(self):
            return [
                "대본 편집기의 [[화면] 탭에서 만든 화면입니다. Ctrl+S로 저장하면 pykaki_screens.rpy를 고치고 대본 편집기에도 받아 적힙니다.",
                "항목 더하기, 지우기, 버튼이 할 일, 꼴과 막대의 크기는 대본 편집기에서 고칩니다.",
                ]

        def session(self):
            return dict(cur=self.cur, sel=self.sel)

        def restore(self, d):
            self.cur = d.get("cur", self.cur)
            self.sel = d.get("sel", self.sel)

    register(ScreensTab())

    class ScreenTextInput(store.InputValue, DictEquality):
        """화면 탭의 글 칸 (고른 항목의 글)."""
        default = False
        editable = True
        returnable = False

        def __init__(self, sid, iid):
            self.sid = sid
            self.iid = iid
            self.text = None

        def tab(self):
            return get_tab("screens")

        def get_text(self):
            if self.text is None:
                t = self.tab()
                it = t.item(self.iid) if t.cur == self.sid else None
                return (t.ival(it)["text"] if it else "").replace("\n", "\\n")
            return self.text

        def set_text(self, s):
            self.text = s
            store.renpy.restart_interaction()

        def enter(self):
            s = (self.text if self.text is not None else self.get_text()).replace("\\n", "\n")
            t = self.tab()
            if t.cur == self.sid:
                t.put_item(self.iid, text=s)
            self.text = None
            store.renpy.run(self.Disable())
            raise store.renpy.IgnoreEvent()

        def cancel(self):
            self.text = None
            store.renpy.run(self.Disable())

    class ScreensView(store.renpy.Displayable):
        """고르는 화면의 항목들을 고친 자리에 그립니다 (게임 화면은 어둡게)."""

        def __init__(self, **properties):
            super(ScreensView, self).__init__(**properties)

        def proxy(self, tab, it):
            k = it["kind"]
            v = tab.ival(it)
            size = it.get("size") or getattr(store.gui, "text_size", 22)
            tcol = it.get("color") or ("#cccccc" if k == "textbutton" else getattr(store.gui, "text_color", "#ffffff"))
            w, h = it.get("w"), it.get("h")
            if k in ("text", "textbutton"):
                return store.Text(esc(v["text"] or " "), size=size, color=tcol)
            if k in ("image", "imagebutton"):
                try:
                    return store.renpy.easy.displayable(it.get("image") or "")
                except Exception:
                    return store.Text(esc(it.get("image") or "그림 없음"), size=14, color="#ff8080")
            if k == "bar":
                return store.Solid("#e0607a99", xysize=(w, h))
            if k == "drop":
                return store.Fixed(store.Solid("#ffffff26"), store.Text(esc(v["text"] or ""), size=size, color=tcol, align=(0.5, 0.5)), xysize=(w, h))
            if k == "look":
                return store.Fixed(store.Solid("#ffffff22"), store.Text(esc(it.get("flag") or ""), size=13, color="#ffffff", align=(0.5, 0.5)), xysize=(w, h))
            if k == "voice":
                # 음성 빛 (대본 편집기 FEATURE 34): 편집 중에는 자리만 보임
                return store.Fixed(store.Solid("#7b6cff33"), store.Text("음성 빛", size=13, color="#ffffff", align=(0.5, 0.5)), xysize=(w or 200, h or 60))
            return store.Solid("#ffffff22", xysize=(w or 40, h or 20))

        def render(self, width, height, st, at):
            tab = get_tab("screens")
            r = store.renpy.Render(width, height)
            s = tab.screen() if tab is not None else None
            if s is None:
                return r
            rend = store.renpy.render
            r.blit(rend(store.Solid("#00000099"), width, height, st, at), (0, 0))
            bx, by, bw, bh = tab.box()
            hud = tab.is_hud(s)

            bg = s.get("bg")
            if bg:
                a = (s.get("bgAlpha", 100) or 0) / 100.0
                try:
                    d = store.Solid(bg) if bg.startswith("#") else store.renpy.easy.displayable(bg)
                    d = store.Transform(d, alpha=a)
                    r.blit(rend(d, bw, bh, st, at), (bx, by))
                except Exception:
                    pass

            if hud:
                cw, ch = s.get("cw"), s.get("ch")
                if cw or ch:
                    r.blit(rend(store.ui_kit.Outline("#ffffff40", 1), int(max(bw, cw or bw)), int(max(bh, ch or bh)), st, at), (bx, by))
                on = tab.sel is None
                r.blit(rend(store.ui_kit.Outline("#ff3b8d" if on else "#ffffffaa", 3 if on else 1), bw, bh, st, at), (bx, by))
                lab = rend(store.Text(esc("HUD " + s.get("title", "")), style="ui_editor_small", color="#ff3b8d" if on else "#ffffff"), width, height, st, at)
                r.blit(lab, (max(0, bx), max(0, by - 22)))

            rects = [ ]
            for it in s["items"]:
                v = tab.ival(it)
                d = self.proxy(tab, it)
                w, h = it.get("w"), it.get("h")
                cr = rend(d, w or width, h or height, st, at)
                iw, ih = (w, h) if (w and h) else cr.get_size()
                x, y = bx + int(v["x"]), by + int(v["y"])
                r.blit(cr, (x, y))
                rects.append((it["id"], (x, y, int(max(iw, 8)), int(max(ih, 8)))))
            for iid, (x, y, w, h) in rects:
                on = iid == tab.sel
                r.blit(rend(store.ui_kit.Outline("#ff3b8d" if on else "#ffffff88", 2 if on else 1), w, h, st, at), (x, y))
            tab._rects = rects
            return r

    screens_view = ScreensView()


screen ui_editor_screens_overlay():
    add ui_editor.screens_view


screen ui_editor_screens_panel(tab):

    vbox:
        spacing 6

        ## 화면 고르기
        hbox:
            spacing 4
            box_wrap True
            box_wrap_spacing 4
            xmaximum 632
            for _s in tab.screens():
                textbutton ui_editor.esc(_s.get("title", _s["name"]) + (" (HUD)" if _s.get("kind") == "hud" else "")):
                    style "ui_editor_button"
                    text_size 13
                    selected (_s["id"] == tab.cur)
                    action Function(tab.pick_screen, _s["id"])
            textbutton "다시 읽기" style "ui_editor_button" text_size 13 action Function(tab.reload)

        if tab.is_hud():
            $ _h = tab.hud()
            hbox:
                spacing 10
                text "붙일 곳" style "ui_editor_small" yalign 0.5 min_width 72
                grid 3 3:
                    spacing 2
                    for _k, _ax, _ay in ui_editor.SC_ANCHORS:
                        button:
                            style "ui_editor_button"
                            xysize (24, 16)
                            selected (_h["anchor"] == _k)
                            action Function(tab.set_anchor, _k)
                text ui_editor.SC_ANCHOR_NAME.get(_h["anchor"], "") style "ui_editor_small" yalign 0.5
            hbox:
                spacing 4
                text "크기" style "ui_editor_small" yalign 0.5 min_width 72
                textbutton "-10" style "ui_editor_button" text_size 12 action Function(tab.grow, "w", -10)
                text "가로 {}".format(_h["w"]) style "ui_editor_text" yalign 0.5 min_width 80
                textbutton "+10" style "ui_editor_button" text_size 12 action Function(tab.grow, "w", 10)
                null width 8
                textbutton "-10" style "ui_editor_button" text_size 12 action Function(tab.grow, "h", -10)
                text "세로 {}".format(_h["h"]) style "ui_editor_text" yalign 0.5 min_width 80
                textbutton "+10" style "ui_editor_button" text_size 12 action Function(tab.grow, "h", 10)
            hbox:
                spacing 6
                text "옮기기" style "ui_editor_small" yalign 0.5 min_width 72
                text "가로 {}, 세로 {}".format(_h["dx"], _h["dy"]) style "ui_editor_text" yalign 0.5
                textbutton "0으로" style "ui_editor_button" text_size 12 action Function(tab.zero_offset)
                textbutton ("HUD 고름" if tab.sel is None else "HUD 고르기") style "ui_editor_button" text_size 12 selected (tab.sel is None) action Function(tab.pick_item, None)

        text "항목" style "ui_editor_title" size 16
        hbox:
            spacing 4
            box_wrap True
            box_wrap_spacing 4
            xmaximum 632
            for _it in tab.items():
                textbutton ui_editor.esc(tab.item_label(_it) + (" (바꿈)" if tab.changed_item(_it) else "")):
                    style "ui_editor_button"
                    text_size 12
                    selected (_it["id"] == tab.sel)
                    action Function(tab.pick_item, _it["id"])

        $ _it = tab.sel_item()
        if _it is not None:
            $ _v = tab.ival(_it)
            hbox:
                spacing 6
                text "자리" style "ui_editor_small" yalign 0.5 min_width 72
                text "x {}, y {}".format(_v["x"], _v["y"]) style "ui_editor_text" yalign 0.5
                if tab.changed_item(_it):
                    textbutton "원래대로" style "ui_editor_button" text_size 12 action Function(tab.reset_item)
            if tab.has_text(_it):
                hbox:
                    spacing 6
                    text "글" style "ui_editor_small" yalign 0.5 min_width 72
                    button:
                        style "ui_editor_button"
                        xsize 540
                        yminimum 32
                        action tab.text_input(_it["id"]).Toggle()
                        input value tab.text_input(_it["id"]) style "ui_editor_text" size 15 length 200 xmaximum 516


init 990 python in ui_editor:
    ## 화면 자리 파일은 개발용이라 배포판에 넣지 않습니다.
    store.build.classify("game/" + SCREENS_META, None)
