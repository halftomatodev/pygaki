################################################################################
## UI Kit — 편집기: PyKaki 앱과 실시간 연결 (3.14, 커서/대사 소리 3.15, 패널 통째로 3.16)
##
## PyKaki 데스크톱 앱의 showpy 화면이 이 편집기를 바깥에서 조종합니다.
## 게임 창에는 끌어서 옮기는 표시만 남고, 숫자, 목록, 대본은 앱에서 봅니다.
##
## 개발 모드로 게임을 켜면 내 컴퓨터 안(127.0.0.1)의 빈 포트를 열고 그 번호를
## game/showpy_live.json에 적습니다. 앱은 이 파일을 보고 붙습니다. 게임을 끄면 지웁니다.
## 배포판(개발 모드 꺼짐)에서는 아무것도 하지 않고, 파일도 배포판에 들어가지 않습니다.
## 주고받는 형식은 pygaki 저장소의 docs/LINK.md 9장에 있습니다.
################################################################################

init offset = 1

init -8 python in ui_editor:

    import os
    import json
    import random
    import socket
    import threading
    import time

    LIVE_FILE = "showpy_live.json"

    ## 렌파이 안에서 dict, list는 되감기용 타입을 가리킵니다. json이 만든 값은 보통 파이썬 타입이라
    ## isinstance 비교는 이 이름으로 합니다.
    _pdict = store.python_dict
    _plist = store.python_list
    LIVE_VERSION = 1

    ## 연결 스레드가 같이 쓰는 값이라, 렌파이가 되감기용으로 바꾸지 않는 보통 파이썬
    ## 객체와 목록(python_object, python_list)으로 만듭니다. (렌파이 객체를 다른 스레드에서
    ## 바꾸면 게임이 멈춥니다)
    class _Live(python_object):
        def __init__(self):
            self.server = None
            self.client = None
            self.lock = threading.Lock()
            self.inbox = store.python_list()
            self.socks = store.python_list()     # 연 소켓 전부 (다시 불러올 때 닫으려고)
            self.port = None
            self.token = None
            self.last = None
            self.hide_panel = True      # 앱이 붙어 있으면 게임 안 패널을 숨김
            self.failed = False
            self.files_due = False      # 파일 목록(소리, 그림)을 보내야 함 (붙을 때, 앱이 달라고 할 때)
            self.listen_until = None    # 앱에서 [들어보기]를 누른 대사 소리를 멈출 시각
            self.widgets = { }          # 앱으로 보낸 패널의 누를 수 있는 것: 자리 번호 -> 위젯 (3.16)

    live = _Live()

    def _live_path():
        return os.path.join(store.config.gamedir, LIVE_FILE)

    def _live_close(sock):
        try:
            sock.close()
        except Exception:
            pass

    def _live_remember(sock):
        with live.lock:
            live.socks.append(sock)

    def _live_client_loop(conn, token):
        buf = b""
        authed = False
        try:
            conn.settimeout(1.0)
            while True:
                try:
                    data = conn.recv(65536)
                except socket.timeout:
                    continue
                if not data:
                    break
                buf += data
                while b"\n" in buf:
                    line, buf = buf.split(b"\n", 1)
                    if not line.strip():
                        continue
                    try:
                        m = json.loads(line.decode("utf-8"))
                    except Exception:
                        continue
                    if not authed:
                        if isinstance(m, _pdict) and m.get("hello") == token:
                            authed = True
                            with live.lock:
                                old = live.client
                                live.client = conn
                                live.last = None
                                live.files_due = True
                            if old is not None:
                                _live_close(old)
                            continue
                        _live_close(conn)
                        return
                    if isinstance(m, _pdict):
                        with live.lock:
                            live.inbox.append(m)
        except Exception:
            pass
        with live.lock:
            if live.client is conn:
                live.client = None
        _live_close(conn)

    def _live_serve(srv, token):
        while True:
            try:
                conn, _addr = srv.accept()
            except Exception:
                return
            _live_remember(conn)
            t = threading.Thread(target=_live_client_loop, args=(conn, token))
            t.daemon = True
            t.start()

    def live_start():
        if live.server is not None or live.failed:
            return

        ## Shift+R로 다시 불러오기 전의 연결은 닫음 (앱은 바뀐 파일을 보고 다시 붙음)
        old = store.renpy.session.pop("showpy_live", None)
        if old is not None:
            for s in list(old.socks):
                _live_close(s)
        store.renpy.session["showpy_live"] = live

        try:
            srv = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            srv.bind(("127.0.0.1", 0))
            srv.listen(2)
        except Exception as e:
            live.failed = True
            print("showpy live: 포트를 열지 못했습니다:", e)
            return

        live.server = srv
        live.port = srv.getsockname()[1]
        live.token = "%016x%016x" % (random.getrandbits(64), random.getrandbits(64))
        _live_remember(srv)

        t = threading.Thread(target=_live_serve, args=(srv, live.token))
        t.daemon = True
        t.start()

        info = dict(version=LIVE_VERSION, port=live.port, token=live.token, pid=os.getpid(),
                    showpy=store.ui_kit.VERSION)
        try:
            store.ui_kit.write_text(_live_path(), json.dumps(info, ensure_ascii=False))
        except Exception as e:
            print("showpy live: {}을 쓰지 못했습니다: {}".format(LIVE_FILE, e))

    def live_cleanup():
        """게임을 끌 때 연결 파일을 지웁니다 (내가 쓴 파일일 때만)."""
        try:
            with open(_live_path(), "rb") as f:
                d = json.loads(f.read().decode("utf-8"))
            if d.get("token") == live.token:
                os.remove(_live_path())
        except Exception:
            pass
        for s in list(live.socks):
            _live_close(s)

    def live_connected():
        return live.client is not None

    def live_panel_hidden():
        """앱이 붙어 있고 패널 숨기기가 켜져 있으면 게임 안 패널을 그리지 않습니다."""
        return live.client is not None and live.hide_panel

    def _live_send(obj):
        c = live.client
        if c is None:
            return False
        try:
            c.sendall((json.dumps(obj, ensure_ascii=False) + "\n").encode("utf-8"))
            return True
        except Exception:
            with live.lock:
                if live.client is c:
                    live.client = None
            _live_close(c)
            return False

    ## ── 지금 상태 ──

    def _js(v):
        """JSON으로 보낼 수 있는 값으로."""
        if v is None or isinstance(v, (bool, int, float, str)):
            return v
        if isinstance(v, store.Color):
            return v.hexcode
        if isinstance(v, (list, tuple, _plist)):
            return [ _js(i) for i in v ]
        if isinstance(v, (dict, _pdict)):
            return { str(k) : _js(i) for k, i in v.items() }
        return str(v)

    def _shown_screens():
        rv = [ ]
        try:
            sl = store.renpy.game.context().scene_lists
            for sle in sl.layers.get("screens", [ ]):
                name = getattr(sle.displayable, "screen_name", None)
                if name:
                    rv.append(name[0])
        except Exception:
            pass
        return rv

    def _title_state():
        tm = getattr(store, "tmenu", None)
        if tm is None or not tm.cfg("enabled"):
            return None
        menu = tm.current_menu()
        try:
            items = tm.all_items(menu)
        except Exception:
            return None
        edits = tm.edits_for(menu)
        out = [ ]
        for it in items:
            x, y = tm.abs_pos(it)
            b = it.base_props
            h = it.hover_props
            out.append(dict(
                id=it.id, text=str(it.text), x=round(float(x), 1), y=round(float(y), 1), anchor=_js(it.anchor),
                rotate=it.rotate, skew=it.skew, zoom=it.zoom,
                size=_js(b.get("size")), font=_js(b.get("font")), color=_js(b.get("color")),
                hover=dict(offset=_js(it.h_offset), rotate=it.h_rotate, skew=it.h_skew, zoom=it.h_zoom,
                           size=_js(h.get("size")), font=_js(h.get("font")), color=_js(h.get("color"))),
                edited=(it.id in edits),
                ))
        t = get_tab("title")
        s = tm.state
        common = tm.common_values()
        return dict(
            ok=bool(t is not None and tab_available(t)[0]),
            menu=menu, sel=s.ed_sel, mode=s.ed_mode, scope=s.ed_scope, items=out,
            common={ k : _js(common[k]) for k in tm.EDIT_KEYS if k in common },
            common_edited=bool(s.default_edits),
            )

    def _custom_ui_state():
        """커서/대사 소리 탭 (3.15). 값은 편집 중인 값 → 저장한 값 → 설정 파일 순서로 지금 쓰는 값."""
        t = get_tab("custom_ui")
        cu = getattr(store, "custom_ui", None)
        if t is None or cu is None:
            return None
        ok, why = tab_available(t)
        if not ok:
            return dict(ok=False, why=str(why or ""))
        return dict(
            ok=True, why="",
            values={ k : _js(t.val(k)) for k in cu.EDIT_KEYS },
            edited=sorted(str(k) for k in t.edits),
            cps=_js(t.cps()),
            reload_keys=list(t.RELOAD_KEYS),
            fps=getattr(cu, "FPS", 24), max_frames=t.max_frames(),
            playing=live.listen_until is not None,
            )

    def _files():
        uk = store.ui_kit
        return dict(type="files", audio=list(uk.audio_files()),
                    images=list(uk.game_files((".png", ".webp", ".jpg", ".jpeg", ".avif"))))

    ## ── 패널 통째로 (3.16) ──
    ## 앱이 붙어 있으면 게임 안 패널(ui_editor_panel_body)과 고르기 창을 화면 밖에 그려 두고
    ## (ui_editor_live_mirror), 그 위젯을 읽어 앱으로 보냅니다. 앱은 그 모양대로 그리고, 누르면
    ## 자리 번호(id)를 돌려보냅니다(panel.do). 탭마다 앱 화면을 따로 만들지 않아도 됩니다.

    def _plain(s):
        try:
            return store.renpy.filter_text_tags(s, allow=[ ])
        except Exception:
            return s

    def _kids(d):
        try:
            return d.visit() or [ ]
        except Exception:
            return [ ]

    def _texts_in(d, out, depth=0):
        import renpy as _r
        if d is None or depth > 30:
            return
        if isinstance(d, _r.text.text.Text) and not isinstance(d, _r.display.behavior.Input):
            t = _plain(d.get_all_text()).strip()
            if t:
                out.append(t)
            return
        for k in _kids(d):
            _texts_in(k, out, depth + 1)

    def _media_in(d, out, depth=0):
        """버튼 안의 그림과 색 견본 (그림 고르기, 색 고르기 칸)."""
        import renpy as _r
        if d is None or depth > 30:
            return
        if isinstance(d, _r.display.im.Image):
            out.append(dict(k="img", p=str(d.filename)))
            return
        if isinstance(d, _r.display.imagelike.Solid):
            if _visible_color(d):
                out.append(dict(k="col", v=d.color.hexcode))
            return
        for k in _kids(d):
            _media_in(k, out, depth + 1)

    def _visible_color(d):
        """거의 투명한 바탕(#ffffff18 같은)은 색 견본이 아님"""
        try:
            return d.color is not None and d.color.alpha >= 0.4
        except Exception:
            return False

    def _input_in(d, out, depth=0):
        import renpy as _r
        if d is None or depth > 10:
            return
        if isinstance(d, _r.display.behavior.Input):
            out.append(d)
            return
        for k in _kids(d):
            _input_in(k, out, depth + 1)

    def _color_of(d):
        try:
            c = d.style.color
            if c is None:
                return None
            h = store.Color(c).hexcode
            return None if h in ("#ffffff", "#ffffffff") else h
        except Exception:
            return None

    def _button_label(d):
        label = [ ]
        _texts_in(d.child, label)
        return " ".join(label)

    def _mirror(d, path, reg, depth=0):
        """위젯 하나를 앱이 그릴 모양으로. 누를 수 있는 것은 reg[자리 번호]에 적어 둡니다."""
        import renpy as _r
        disp = _r.display
        if d is None or depth > 60:
            return None

        if isinstance(d, disp.behavior.Button):
            ## 입력칸을 감싼 버튼(누르면 입력 시작)은 입력칸으로
            found = [ ]
            _input_in(d.child, found)
            if found:
                reg[path] = found[0]
                return dict(k="in", id=path, t=str(found[0].content or ""))
            label = _button_label(d)
            extra = [ ]
            _media_in(d.child, extra)
            if not label and not extra:
                return None     # 고르기 창 바깥을 덮는 버튼 같은 것
            reg[path] = d
            try:
                ok = bool(d.is_sensitive()) and d.action is not None
            except Exception:
                ok = False
            try:
                on = bool(d.is_selected())
            except Exception:
                on = False
            node = dict(k="b", id=path, t=label, on=on, ok=ok)
            if extra:
                node["c"] = extra
            return node

        if isinstance(d, disp.behavior.Input):
            reg[path] = d
            return dict(k="in", id=path, t=str(d.content or ""))

        if isinstance(d, _r.text.text.Text):
            t = _plain(d.get_all_text())
            if not t.strip():
                return None
            node = dict(k="t", t=t)
            c = _color_of(d)
            if c:
                node["c"] = c
            return node

        if isinstance(d, disp.behavior.Bar):
            adj = d.adjustment
            ## 세로 막대는 목록 스크롤바라서 앱에서는 빼기 (앱 칸이 스스로 스크롤)
            if adj is None or getattr(d.style, "bar_vertical", False):
                return None
            reg[path] = d
            return dict(k="bar", id=path, r=_js(adj.range), v=_js(adj.value), s=_js(adj.step))

        if isinstance(d, disp.imagelike.Solid):
            if not _visible_color(d):
                return None
            return dict(k="col", v=d.color.hexcode)

        if isinstance(d, disp.im.Image):
            return dict(k="img", p=str(d.filename))

        if isinstance(d, disp.layout.Null):
            return None

        if isinstance(d, disp.layout.MultiBox):
            kind = "h" if d.default_layout == "horizontal" else "v"
            kids = d.children
        elif isinstance(d, (disp.layout.Grid, disp.viewport.VPGrid)):
            ## grid, vpgrid: 앱에서는 줄바꿈하는 가로 줄로 (격자처럼 보임)
            kind = "g"
            kids = d.children
        elif isinstance(d, disp.layout.Window):
            ## frame, window: 바탕 그림은 빼고 안쪽만
            kind = "v"
            kids = [ d.child ]
        else:
            kind = "v"
            kids = _kids(d)

        out = [ ]
        for i, k in enumerate(kids):
            n = _mirror(k, path + "." + str(i), reg, depth + 1)
            if n is not None:
                out.append(n)
        if not out:
            return None
        ## 색 띠(색상 막대 뒤의 무지개 같은 것)는 빼기
        if len(out) > 4 and all(n["k"] == "col" for n in out):
            return None
        if len(out) == 1:
            return out[0]
        return dict(k=kind, c=out)

    def _panel_state():
        if not (state.open and live_panel_hidden()):
            live.widgets = { }
            return None
        reg = { }
        rv = dict(tab=state.tab, body=None, popup=None, popup_kind=state.popup)
        for wid, key, pre in (("live_panel", "body", "p"), ("live_popup", "popup", "q")):
            try:
                w = store.renpy.get_widget("ui_editor_live_mirror", wid, layer="ui_editor")
            except Exception:
                w = None
            if w is not None:
                rv[key] = _mirror(w, pre, reg)
        live.widgets = reg
        return rv

    def _panel_do(c):
        import renpy as _r
        wid = str(c.get("id"))
        w = live.widgets.get(wid)
        if w is not None and isinstance(w, _r.display.behavior.Button) and c.get("t") is not None:
            if _button_label(w) != c.get("t"):
                w = None
        if w is None:
            msg("화면이 바뀌어서 누른 것을 찾지 못했습니다. 다시 눌러 주세요.")
            return True
        if isinstance(w, _r.display.behavior.Button):
            if w.is_sensitive() and w.action is not None:
                store.renpy.run(w.action)
        elif isinstance(w, _r.display.behavior.Bar):
            adj = w.adjustment
            v = max(0, min(adj.range, float(c.get("value", 0))))
            if isinstance(adj.range, int):
                v = int(round(v))
            adj.change(v)
        elif isinstance(w, _r.display.behavior.Input):
            if w.value is None:
                return False
            w.value.set_text(str(c.get("value", "")))
            if c.get("enter"):
                w.value.enter()
        return True

    def _where_line():
        """게임 진행 위치 (원고 파일, 줄). ESC 메뉴 같은 메뉴 화면에 있어도 게임 쪽 위치."""
        try:
            ctx = store.renpy.game.contexts[0]
            n = store.renpy.game.script.namemap.get(ctx.current, None)
            if n is not None:
                return (n.filename, n.linenumber)
        except Exception:
            pass
        try:
            return store.renpy.get_filename_line()
        except Exception:
            return (None, 0)

    def live_state():
        fn, line = _where_line()

        tab = current_tab()
        info = [ ]
        if state.open and tab is not None and tab_available(tab)[0]:
            try:
                info = [ str(i) for i in tab.info_lines() ]
            except Exception:
                info = [ ]

        tabs = [ ]
        for t in TABS:
            ok, why = tab_available(t)
            tabs.append(dict(id=t.id, label=t.label, ok=bool(ok), why=str(why or "")))

        return dict(
            type="state",
            where=dict(file=fn, line=line, screens=_shown_screens(),
                       main_menu=bool(getattr(store, "main_menu", False)), menu=bool(getattr(store, "_menu", False))),
            editor=dict(open=state.open, tab=state.tab, hide_panel=live.hide_panel, message=str(state.message or ""),
                        pending=sum(t.pending() for t in TABS), tabs=tabs, info=info),
            title=_title_state(),
            custom_ui=_custom_ui_state(),
            panel=_panel_state(),
            )

    ## ── 앱이 보낸 명령 ──

    def _title_set(tm, key, value):
        if isinstance(value, (list, _plist)):
            value = tuple(value)
        items = tm.all_items()
        if not items:
            return
        it = items[max(0, min(tm.state.ed_sel, len(items) - 1))]
        if key in ("x", "y"):
            x, y = tm.abs_pos(it)
            if key == "x":
                x = float(value)
            else:
                y = float(value)
            tm.edits_for().setdefault(it.id, { }).update(x=int(round(x)), y=int(round(y)), anchor=it.anchor)
        elif tm.state.ed_scope == "all":
            if value is None:
                tm.state.default_edits.pop(key, None)
            else:
                tm.state.default_edits[key] = value
        else:
            d = tm.edits_for().setdefault(it.id, { })
            if value is None:
                d.pop(key, None)
            else:
                d[key] = value
        tm.state.edit_serial += 1

    def _custom_ui_set(t, key, value):
        cu = t.cu()
        if key not in cu.EDIT_KEYS:
            raise ValueError("모르는 값 이름: {}".format(key))
        if key in ("ctc", "cursor", "quick_menu"):
            value = bool(value)
            ## 켤 때 그림이 하나도 없으면 첫 그림 폴더를 넣는 것까지 게임 안 패널과 같게
            if key != "quick_menu" and value != bool(t.val(key)):
                t.toggle(key)
                return
        elif key in ("ctc_frames", "cursor_frames"):
            value = list(str(i) for i in (value or [ ]))[:t.max_frames()]
        elif key in ("ctc_hold", "cursor_hold"):
            value = 1 if int(value) == 1 else 2
        elif key == "cursor_mode":
            value = "hardware" if value == "hardware" else "software"
        elif key == "cursor_hotspot":
            value = (int(value[0]), int(value[1]))
        elif key == "typing_volume":
            value = round(max(0.0, min(1.0, float(value))), 2)
        elif key == "typing_sound":
            value = str(value) if value else None
        elif key == "text_cps":
            value = None if value is None else max(0, int(value))
        t.put(key, value)

    def _custom_ui_cmd(cmd, c):
        t = get_tab("custom_ui")
        if t is None or not tab_available(t)[0]:
            return False
        if cmd == "custom_ui.set":
            _custom_ui_set(t, str(c.get("key")), c.get("value"))
        elif cmd == "custom_ui.reset":
            ## 이 값의 저장 안 한 변경 되돌리기
            t.edits.pop(str(c.get("key")), None)
        elif cmd == "custom_ui.listen":
            t.listen()
            live.listen_until = (time.time() + 1.5) if t.sound_until is not None else None
        elif cmd == "custom_ui.stop":
            t.stop_sound()
            live.listen_until = None
        return True

    def _live_cmd(c):
        """명령 하나를 처리합니다. 화면을 다시 그려야 하면 True."""
        cmd = c.get("cmd")
        tm = getattr(store, "tmenu", None)

        if cmd == "editor":
            if c.get("open"):
                if not state.open:
                    open_editor(c.get("tab"))
                elif c.get("tab"):
                    switch_tab(c["tab"])
            elif state.open:
                close_editor()
            return True

        if cmd == "tab":
            if not state.open:
                open_editor(c.get("id"))
            else:
                switch_tab(c.get("id"))
            return True

        if cmd == "panel":
            live.hide_panel = bool(c.get("hide"))
            return True

        if cmd == "goto":
            where = c.get("where")
            if where == "pause":
                if getattr(store, "main_menu", False) or getattr(store, "_menu", False):
                    msg("ESC 메뉴는 게임 진행 중에 열 수 있습니다.")
                    return True
                store.renpy.run(store.ShowMenu())
            elif where == "title":
                store.renpy.run(store.MainMenu(confirm=False))
            elif where == "start":
                ## 타이틀에서 게임 시작 (3.16). 게임 중이면 아무것도 안 함
                if getattr(store, "main_menu", False):
                    store.renpy.run(store.Start())
                else:
                    msg("게임 시작은 타이틀 화면에서 할 수 있습니다.")
            return True

        if cmd and cmd.startswith("title."):
            if tm is None:
                return False
            s = tm.state
            t = get_tab("title")
            if cmd == "title.select":
                n = len(tm.all_items())
                if n:
                    s.ed_sel = max(0, min(int(c.get("index", 0)), n - 1))
                    s.edit_serial += 1
            elif cmd == "title.mode" and t is not None:
                t.set_mode("hover" if c.get("mode") == "hover" else "base")
            elif cmd == "title.scope":
                s.ed_scope = "all" if c.get("scope") == "all" else "item"
                s.edit_serial += 1
            elif cmd == "title.set":
                _title_set(tm, str(c.get("key")), c.get("value"))
            elif cmd == "title.reset" and t is not None:
                t.reset_item()
            return True

        if cmd == "panel.do":
            return _panel_do(c)

        if cmd and cmd.startswith("custom_ui."):
            return _custom_ui_cmd(cmd, c)

        if cmd == "files":
            live.files_due = True
            return False

        if cmd == "save":
            save_all()
            return True

        if cmd == "discard":
            t = current_tab()
            if t is not None:
                t.discard()
                msg("저장 안 한 변경을 버렸습니다.")
            return True

        return False

    def _control_exceptions():
        return getattr(store.renpy.game, "CONTROL_EXCEPTIONS", ())

    def live_tick():
        """0.1초마다: 연결을 열고, 받은 명령을 처리하고, 바뀐 상태를 보냅니다."""
        if not store.config.developer:
            return
        if live.server is None:
            live_start()

        changed = False
        while True:
            with live.lock:
                if not live.inbox:
                    break
                c = live.inbox.pop(0)
            try:
                changed = _live_cmd(c) or changed
            except Exception as e:
                if isinstance(e, _control_exceptions()):
                    raise
                _live_send(dict(type="error", text="{}: {}".format(c.get("cmd"), e)))

        ## 앱에서 들어본 대사 소리는 1.5초 뒤에 멈춤 (게임 안 패널이 숨어 있어 그 타이머가 돌지 않음)
        if live.listen_until is not None and time.time() > live.listen_until:
            live.listen_until = None
            t = get_tab("custom_ui")
            if t is not None:
                t.stop_sound()

        if changed:
            store.renpy.restart_interaction()

        if live.client is None:
            return

        if live.files_due:
            live.files_due = False
            try:
                _live_send(_files())
            except Exception as e:
                _live_send(dict(type="error", text="파일 목록을 만들지 못했습니다: {}".format(e)))

        try:
            st = live_state()
            text = json.dumps(st, ensure_ascii=False, sort_keys=True)
        except Exception as e:
            st = dict(type="error", text="상태를 만들지 못했습니다: {}".format(e))
            text = json.dumps(st, ensure_ascii=False)

        if text != live.last:
            live.last = text
            _live_send(st)


init 991 python in ui_editor:
    if store.config.developer and "ui_editor_live" not in store.config.always_shown_screens:
        store.config.always_shown_screens.append("ui_editor_live")
    if store.config.developer and "ui_editor_live_mirror" not in store.config.always_shown_screens:
        store.config.always_shown_screens.append("ui_editor_live_mirror")
    if store.config.developer and live_cleanup not in store.config.quit_callbacks:
        store.config.quit_callbacks.append(live_cleanup)


init 990 python in ui_editor:
    ## 연결 파일은 배포판에 넣지 않습니다.
    store.build.classify("game/" + LIVE_FILE, None)


## 연결을 지켜보는 보이지 않는 화면 (개발 모드에서만 띄움)
screen ui_editor_live():
    timer 0.1 repeat True action Function(ui_editor.live_tick, _update_screens=False)


## 앱으로 보낼 패널과 고르기 창 (3.16). 화면 밖에 그려서 보이지도 눌리지도 않습니다.
screen ui_editor_live_mirror():
    layer "ui_editor"

    if config.developer and ui_editor.state.open and ui_editor.live_panel_hidden():
        fixed:
            pos (-40000, 0)
            xysize (660, 20000)
            fixed:
                id "live_panel"
                fit_first True
                use ui_editor_panel_body

        if ui_editor.state.popup is not None:
            fixed:
                id "live_popup"
                pos (-80000, 0)
                xysize (config.screen_width, config.screen_height)
                use ui_editor_popup
