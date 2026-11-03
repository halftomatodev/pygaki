################################################################################
## UI Kit — 편집기: PyKaki 실시간 미리보기
##
## PyKaki에서 [렌파이에서 보기]를 켜면, 지금 쓰는 대사 줄이 게임 폴더의
## pykaki_preview.json에 적힙니다. 개발 모드에서 게임을 켜 두면 이 파일이 바뀔 때마다
## 화면 위에 미리보기 창이 떠서, 그 줄을 진짜 렌파이 효과로 다시 보여줍니다.
##   R 다시 보기 | Esc 닫기
##
## 글자 모양, 속도, 등장 효과만 보여줍니다. 대사창 자리와 화면 효과는 게임을 그 줄까지
## 진행해서 봅니다. 파일 형식은 docs/LINK.md에 있습니다. 배포판에는 들어가지 않습니다.
################################################################################

init offset = 1

init -8 python in ui_editor:

    import os
    import json

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
        if isinstance(ts, str) and ts.split(":")[0] == "echo" and "outlines" not in props and ss is not None:
            props["outlines"] = list(getattr(ss, "ECHO_OUTLINES", [ ]))
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


init 991 python in ui_editor:
    if store.config.developer and "ui_editor_pk_watch" not in store.config.always_shown_screens:
        store.config.always_shown_screens.append("ui_editor_pk_watch")


init 990 python in ui_editor:
    ## 미리보기 파일은 배포판에 넣지 않습니다.
    store.build.classify("game/" + PREVIEW_FILE, None)


## 파일이 바뀌는지 지켜보는 보이지 않는 화면 (개발 모드에서만 띄움)
screen ui_editor_pk_watch():
    timer 0.25 repeat True action Function(ui_editor.preview_poll, _update_screens=False)


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
