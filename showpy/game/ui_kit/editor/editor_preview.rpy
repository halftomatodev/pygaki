################################################################################
## UI Kit — 편집기: PyKaki 실시간 미리보기
##
## PyKaki에서 [렌파이에서 보기]를 켜면, 지금 쓰는 대사 줄이 게임 폴더의
## pykaki_preview.json에 적힙니다. 개발 모드에서 게임을 켜 두면 이 파일이 바뀔 때마다
## 화면 위에 미리보기 창이 떠서, 그 줄을 진짜 렌파이 효과로 다시 보여줍니다.
##   R 다시 보기 | Esc 닫기
##
## 글자 모양, 속도, 등장 효과만 보여줍니다. 대사창 자리와 화면 효과는 게임을 그 줄까지
## 진행해서 봅니다. 파일 형식은 pygaki 저장소의 docs/LINK.md에 있습니다. 배포판에는 들어가지 않습니다.
################################################################################

init offset = 1

init -8 python in ui_editor:

    import os
    import json
    import time

    PREVIEW_FILE = "pykaki_preview.json"

    ## 미리보기 창에서 쓰지 않는 값 (위치, 이름은 대사창에서만 의미가 있음)
    _PREVIEW_SKIP = ("x", "y", "pos", "name_x", "name_y", "name_size", "name_font", "name_color")

    class _PreviewState(store.NoRollback):
        def __init__(self):
            self.mtime = None
            self.started = False
            self.data = None
            self.disp = None

    preview = _PreviewState()

    def _preview_path():
        return os.path.join(store.config.gamedir, PREVIEW_FILE)

    def _preview_props(say):
        """PyKaki가 적은 대사 괄호 값 → Text 스타일 속성. size → size, cps → slow_cps, effect → textshader"""
        ss = getattr(store, "say_style", None)
        props = { }
        for k, v in (say or { }).items():
            if v is None or v == "" or k in _PREVIEW_SKIP:
                continue
            n = ss.native(k) if ss is not None else k
            if n.startswith("what_"):
                props[n[5:]] = v
        ts = props.get("textshader")
        outlines = getattr(ss, "TFX_OUTLINES", { }) if ss is not None else { }
        if isinstance(ts, str) and ts.split(":")[0] in outlines and "outlines" not in props:
            props["outlines"] = list(outlines[ts.split(":")[0]])
        return props

    def preview_replay():
        """지금 미리보기 줄을 처음부터 다시 보여줍니다. (Text를 새로 만들면 처음부터 나옴)"""
        d = preview.data
        if not d:
            return
        props = _preview_props(d.get("say"))
        text = d.get("text") or "효과 미리보기"
        try:
            preview.disp = store.Text(text, slow=True, substitute=False, **props)
        except Exception as e:
            preview.disp = store.Text("미리보기를 만들지 못했습니다: {}".format(e).replace("{", "{{").replace("[", "[["), size=20, color="#ff8080")
        store.renpy.restart_interaction()

    def preview_hide():
        preview.data = None
        preview.disp = None
        store.renpy.hide_screen("ui_editor_pk_preview", layer="ui_editor")
        store.renpy.restart_interaction()

    def preview_poll():
        """파일이 바뀌었으면 읽어서 미리보기 창을 띄웁니다. 0.25초마다 불립니다."""
        try:
            mt = os.path.getmtime(_preview_path())
        except Exception:
            ## 켤 때 파일이 없었으면, PyKaki가 처음 쓴 파일부터 보여줍니다.
            preview.started = True
            return
        if mt == preview.mtime:
            return
        first = not preview.started
        preview.started = True
        preview.mtime = mt
        ## 게임을 켤 때 이미 있던 파일은 보여주지 않습니다. (예전 미리보기가 뜨지 않게)
        if first:
            return
        try:
            with open(_preview_path(), "rb") as f:
                d = json.loads(f.read().decode("utf-8"))
        except Exception:
            ## PyKaki가 쓰는 중이면 다음에 다시 읽습니다.
            preview.mtime = None
            return
        if not d.get("enabled", True):
            preview_hide()
            return
        preview.data = d
        preview_replay()
        store.renpy.show_screen("ui_editor_pk_preview", _layer="ui_editor")

    ## ── PyKaki가 내보낸 원고가 바뀌면 다시 불러오기 (ui_kit 4.2) ──
    ## 게임을 켠 채 PyKaki에서 Ctrl+E로 내보내면 game 폴더의 원고가 바뀝니다.
    ## 렌파이는 저절로 다시 읽지 않아서, 바뀐 것(새로 생긴 것 포함)을 보면 Shift+R처럼 다시 불러옵니다.
    ## 편집기에 저장 안 한 값이 있으면 그 값이 사라지지 않게 다시 불러오지 않고 알리기만 합니다.

    PK_SCRIPT = "script_flow.rpy"
    PK_MARK = "PyKaki가 만든 파일이에요"

    class _ScriptWatch(store.NoRollback):
        def __init__(self):
            self.seen = None        # 게임을 켤 때(다시 불러온 뒤 포함) 본 (mtime, 크기)
            self.last = None        # 바로 전에 본 (mtime, 크기)
            self.told = None        # 알린 (mtime, 크기)
            self.text = None        # seen 때의 원고 글
            self.keep = None        # 타이틀로 가면 되돌아갈 (파일, 줄)
            self.keep_until = 0.0

    script_watch = _ScriptWatch()

    def _pk_script_stamp():
        p = os.path.join(store.config.gamedir, PK_SCRIPT)
        try:
            st = os.stat(p)
        except Exception:
            return None
        return (st.st_mtime, st.st_size)

    def _pk_script_is_pykaki():
        try:
            with open(os.path.join(store.config.gamedir, PK_SCRIPT), "rb") as f:
                head = f.read(400).decode("utf-8", "ignore")
        except Exception:
            return False
        return PK_MARK in head

    def _editor_pending():
        try:
            return sum(t.pending() + t.pending_lines() for t in TABS)
        except Exception:
            return 0

    def _pk_script_text():
        try:
            with open(os.path.join(store.config.gamedir, PK_SCRIPT), "rb") as f:
                return f.read().decode("utf-8", "ignore")
        except Exception:
            return None

    def script_poll():
        """PyKaki 원고가 바뀌었으면 다시 불러옵니다. 0.25초마다 불립니다."""
        cur = _pk_script_stamp()
        w = script_watch
        if w.seen is None:
            w.seen = cur or (0, 0)
            w.text = _pk_script_text()
            _goto_after_reload()
            return
        _keep_poll()
        if cur is None or cur == w.seen:
            return
        ## 쓰는 도중일 수 있으니, 같은 값을 두 번 본 뒤에 넘어감
        if w.last != cur:
            w.last = cur
            return
        text = _pk_script_text()
        if text is None or PK_MARK not in text[:400]:
            w.seen = cur
            w.text = text
            return
        if _editor_pending():
            if w.told != cur:
                w.told = cur
                store.renpy.notify("PyKaki에서 원고를 내보냈어요. GUI 편집기에 저장 안 한 값이 있어서 다시 불러오지 않았어요. 저장하거나 버린 뒤 Shift+R")
            return
        old = getattr(w, "text", None)
        w.seen = cur
        w.text = text
        ## 다시 불러온 뒤에 쓸 것은 renpy.session에 (다시 불러와도 남음)
        ##   GOTO: PyKaki가 적은 '옮겨 갈 줄' (게임 줄 따라가기)
        ##   KEEP: 지금 보던 줄. 렌파이는 줄로 건너뛰어(warp) 들어간 게임을 다시 불러오면 타이틀로 가 버려서, 그때 이 줄로 되돌림
        g = _read_goto(cur[0])
        if g is not None:
            store.renpy.session[GOTO_SESSION] = g
        else:
            k = _keep_place(old, text)
            if k is not None:
                store.renpy.session[KEEP_SESSION] = k
        store.renpy.reload_script()

    GOTO_FILE = "pykaki_goto.json"
    GOTO_SESSION = "_pykaki_goto"
    KEEP_SESSION = "_pykaki_keep"

    def _read_goto(script_mtime):
        """pykaki_goto.json → (파일, 줄) 또는 None. PyKaki가 '게임 줄 따라가기'를 끄면 line이 null.
        원고보다 한참 전에 쓴 파일은 지난번 것이라 쓰지 않음."""
        p = os.path.join(store.config.gamedir, GOTO_FILE)
        try:
            if os.path.getmtime(p) < script_mtime - 5.0:
                return None
            with open(p, "rb") as f:
                d = json.loads(f.read().decode("utf-8"))
            line = d.get("line")
            if not line:
                return None
            return (str(d.get("file") or ("game/" + PK_SCRIPT)), int(line))
        except Exception:
            return None

    def _keep_place(old, new):
        """지금 보던 줄이 PyKaki 원고면, 그 줄의 표시(# @l:)를 새 원고에서 찾아 (파일, 줄). 아니면 None."""
        if not old or not new:
            return None
        try:
            fn, ln = store.renpy.get_filename_line()
        except Exception:
            return None
        if not fn or fn.replace("\\", "/").split("/")[-1] != PK_SCRIPT or store.main_menu:
            return None
        rows = old.splitlines()
        mark = None
        for i in range(min(ln, len(rows)) - 1, -1, -1):
            t = rows[i].strip()
            if t.startswith("# @l:") or t.startswith("# @node:"):
                mark = t.split()[1]
                break
        if mark is None:
            return None
        rows = new.splitlines()
        for i, r in enumerate(rows):
            t = r.strip()
            if (t.startswith("# @l:") or t.startswith("# @node:")) and t.split()[1] == mark:
                for j in range(i + 1, len(rows)):
                    u = rows[j].strip()
                    if u and not u.startswith("#"):
                        return ("game/" + PK_SCRIPT, j + 1)
        return None

    def _goto_after_reload():
        g = store.renpy.session.pop(GOTO_SESSION, None)
        k = store.renpy.session.pop(KEEP_SESSION, None)
        go = globals().get("goto_line")
        if go is None:
            return
        if g is not None:
            go(g[0], g[1])
        elif k is not None:
            ## 다시 불러온 직후에는 스플래시일 수 있어서, 타이틀에 닿을 때까지 (10초) 기다림
            script_watch.keep = k
            script_watch.keep_until = time.time() + 10.0

    def _keep_poll():
        """자리를 못 되살려 타이틀로 갔으면 보던 줄로. 게임 원고 안에 있으면 그대로 둠."""
        w = script_watch
        k = w.keep
        if k is None:
            return
        if store.main_menu:
            w.keep = None
            go = globals().get("goto_line")
            if go is not None:
                go(k[0], k[1])
            return
        try:
            fn = store.renpy.get_filename_line()[0] or ""
        except Exception:
            fn = ""
        if fn.replace("\\", "/").split("/")[-1] == PK_SCRIPT or time.time() > w.keep_until:
            w.keep = None


init 991 python in ui_editor:
    if store.config.developer and "ui_editor_pk_watch" not in store.config.always_shown_screens:
        store.config.always_shown_screens.append("ui_editor_pk_watch")


init 990 python in ui_editor:
    ## 미리보기 파일은 배포판에 넣지 않습니다.
    store.build.classify("game/" + PREVIEW_FILE, None)
    store.build.classify("game/" + GOTO_FILE, None)


## 파일이 바뀌는지 지켜보는 보이지 않는 화면 (개발 모드에서만 띄움)
screen ui_editor_pk_watch():
    timer 0.25 repeat True action [ Function(ui_editor.preview_poll, _update_screens=False),
                                    Function(ui_editor.script_poll, _update_screens=False) ]


screen ui_editor_pk_preview():
    layer "ui_editor"
    zorder 50

    key "r" action Function(ui_editor.preview_replay)
    key "K_ESCAPE" action Function(ui_editor.preview_hide)

    frame:
        style "ui_editor_frame"
        xalign 0.5
        ypos 24
        xmaximum 1100
        has vbox
        spacing 8
        hbox:
            spacing 12
            text "PyKaki 미리보기" style "ui_editor_title"
            text "R 다시 보기 | Esc 닫기" style "ui_editor_small" yalign 0.5
            textbutton "다시 보기" style "ui_editor_button" action Function(ui_editor.preview_replay)
            textbutton "닫기" style "ui_editor_button" action Function(ui_editor.preview_hide)
        if ui_editor.preview.disp is not None:
            add ui_editor.preview.disp
