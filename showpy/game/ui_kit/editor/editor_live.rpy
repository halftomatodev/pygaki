################################################################################
## UI Kit — 편집기: PyKaki 앱과 실시간 연결 (3.14)
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

        if changed:
            store.renpy.restart_interaction()

        if live.client is None:
            return

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
    if store.config.developer and live_cleanup not in store.config.quit_callbacks:
        store.config.quit_callbacks.append(live_cleanup)


init 990 python in ui_editor:
    ## 연결 파일은 배포판에 넣지 않습니다.
    store.build.classify("game/" + LIVE_FILE, None)


## 연결을 지켜보는 보이지 않는 화면 (개발 모드에서만 띄움)
screen ui_editor_live():
    timer 0.1 repeat True action Function(ui_editor.live_tick, _update_screens=False)
