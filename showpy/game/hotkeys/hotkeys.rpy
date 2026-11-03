################################################################################
## Hotkeys 플러그인 — 엔진
##
## 이 파일은 고칠 필요가 없습니다. 설정은 hotkeys_config.rpy에서 하세요.
##
## 버전 1.0 · Ren'Py 8.5.3에서 제작·테스트
##
## - 단축키를 추가하거나, 렌파이 기본 단축키에서 키를 뺍니다.
## - 조작방법 화면의 키보드 설명을 설정 파일의 목록으로 보여줍니다.
##   (렌파이 기본 screens.rpy의 keyboard_help 스크린을 대신 정의합니다)
################################################################################

init offset = 1

init -10 python in hotkeys:

    VERSION = "1.0"

    DEFAULTS = dict(
        bindings=[ ],
        unbind={ },
        keyboard_help=None,
        )

    def cfg(name):
        g = globals()
        if name in g:
            return g[name]
        return DEFAULTS[name]

    def _default_help():
        import store
        _ = store._
        return [
            (_("엔터(Enter)"), _("대사 진행 및 UI (선택지 포함) 선택.")),
            (_("스페이스(Space)"), _("대사를 진행하되 선택지는 선택하지 않음.")),
            (_("화살표 키"), _("UI 이동.")),
            (_("이스케이프(Esc)"), _("게임 메뉴 불러옴.")),
            (_("컨트롤(Ctrl)"), _("누르고 있는 동안 대사를 스킵.")),
            (_("탭(Tab)"), _("대사 스킵 토글.")),
            (_("페이지 업(Page Up)"), _("이전 대사로 롤백.")),
            (_("페이지 다운(Page Down)"), _("이후 대사로 롤포워드.")),
            ("H", _("UI를 숨김.")),
            ("S", _("스크린샷 저장.")),
            ("V", _("{a=https://www.renpy.org/l/voicing}대사 읽어주기 기능{/a} 토글.")),
            ("Shift+A", _("접근성 메뉴를 엽니다.")),
            ]

    def help_lines():
        lines = cfg("keyboard_help")
        if lines is None:
            lines = _default_help()
        return lines

    def _setup():
        import store

        ## 기본 단축키에서 키 빼기
        for name, keys in cfg("unbind").items():
            if isinstance(keys, str):
                keys = [ keys ]

            current = store.config.keymap.get(name, None)
            if current is None:
                raise Exception("[hotkeys] unbind: '{}'라는 기본 단축키 이름이 없습니다.".format(name))

            for k in keys:
                while k in current:
                    current.remove(k)

        ## 새 단축키
        actions = { }

        for i, b in enumerate(cfg("bindings")):
            keys = b["keys"]
            if isinstance(keys, str):
                keys = [ keys ]

            name = b.get("name", "hotkeys_{}".format(i))
            store.config.keymap[name] = list(keys)
            actions[name] = b["action"]

        if actions:
            store.config.underlay.append(store.renpy.Keymap(**actions))


init 990 python in hotkeys:
    import store

    _setup()

    ## 배포판을 만들 때 이 폴더의 설명서(.md)는 빼고 묶습니다.
    import os as _os
    PLUGIN_DIR = _os.path.dirname(store.renpy.get_filename_line()[0]).replace("\\", "/")
    store.build.classify(PLUGIN_DIR + "/**.md", None)


## 조작방법 화면의 키보드 설명. (렌파이 기본 keyboard_help 스크린을 대신합니다)
screen keyboard_help():

    for _key, _desc in hotkeys.help_lines():
        hbox:
            label _key
            text _desc
