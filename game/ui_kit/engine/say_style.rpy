################################################################################
## UI Kit — 대사 스타일 엔진
##
## 이 파일은 고칠 필요가 없습니다. 설정은 say_style_config.rpy에서 하세요.
##
## 대사 뒤 괄호에 짧은 이름으로 위치·글꼴·크기·색 등을 적으면
## 그 한 줄에만 적용됩니다.
##
##     t "글쎄, 난 봤다니까요." (x=520, y=264, size=30, color="#aa0000")
##     e "어디 갔었어?" (name_x=820, name_y=-60, speed=0.5, effect="jitter")
##
## say_style.enabled = False면 괄호의 짧은 이름(x, size ...)은 무시하고
## 캐릭터 기본값으로 보여줍니다. (렌파이 원래 이름 what_xpos 등은 그대로 적용)
################################################################################

init -10 python in say_style:

    import store

    VERSION = store.ui_kit.VERSION

    DEFAULT_ALIAS = {
        "x": "what_xpos",
        "y": "what_ypos",
        "pos": "what_pos",
        "font": "what_font",
        "size": "what_size",
        "color": "what_color",
        "outline": "what_outlines",
        "spacing": "what_line_spacing",
        "bold": "what_bold",
        "italic": "what_italic",
        "kerning": "what_kerning",
        "width": "what_xmaximum",
        "align": "what_text_align",

        ## 대사 나오는 속도 (배율. 0.5 = 절반 속도, 2 = 두 배 빠르게)
        ## 플레이어가 환경설정에서 고른 텍스트 속도에 곱해집니다.
        "speed": "what_slow_cps_multiplier",

        ## 대사 나오는 속도 (1초에 몇 글자. 플레이어의 텍스트 속도 설정과 상관없이 이 값으로)
        "cps": "what_slow_cps",

        ## 대사 등장 효과 (렌파이 텍스트 셰이더: "dissolve", "typewriter", "wave" ...)
        "effect": "what_textshader",

        ## 이름 상자 위치 (대사 창 왼쪽 위 기준). 이름 배경 그림도 같이 움직입니다.
        "name_x": "namebox_xpos",
        "name_y": "namebox_ypos",

        ## 이름 글자
        "name_font": "who_font",
        "name_size": "who_size",
        "name_color": "who_color",
        }

    ## 편집기가 다루는 짧은 이름 (저장·복사할 때 이 순서로 적습니다).
    EDIT_KEYS = ("x", "y", "size", "font", "color", "speed", "effect",
                 "name_x", "name_y", "name_size", "name_font", "name_color")

    ## 편집기가 "이 값은 원고에서 지움"을 나타낼 때 쓰는 표시
    REMOVE = "__ui_kit_remove__"

    _previous = None

    ## 편집 상태는 되감기(롤백)에 영향받지 않습니다. (편집기의 '다시 보기'가 되감기를 씀)
    class _State(store.NoRollback):
        def __init__(self):
            self.last = None            # 마지막으로 보여준 대사 줄 (편집기용)

            ## 편집기 (editor/editor_say.rpy가 씀)
            self.editing = False
            self.line_edits = { }       # (파일, 줄) -> {짧은 이름: 값}  원고에 아직 안 쓴 값
            self.saved = { }            # (파일, 줄) -> {짧은 이름: 값}  원고에 썼지만 다시 불러오기 전인 값

    state = _State()

    def is_on():
        return bool(globals().get("enabled", True))

    def alias_map():
        a = dict(DEFAULT_ALIAS)
        a.update(globals().get("alias", { }) or { })
        return a

    def native(name):
        """짧은 이름 → 렌파이 속성 이름 (what_xpos 등)."""
        return alias_map().get(name, name)

    def short_name(native_name):
        for k, v in alias_map().items():
            if v == native_name:
                return k
        return native_name

    def character_name(who):
        """캐릭터 객체의 변수 이름. (define t = Character(...) 이면 "t")"""
        if who is None:
            return "narrator"
        for k, v in vars(store).items():
            if v is who and not k.startswith("_"):
                return k
        return None

    class LineInfo(store.python_object):
        pass

    def say_arguments(who, *args, **kwargs):
        a = alias_map()

        ## 편집기용: 이 줄의 정보 기록 (원고에 적힌 값 그대로)
        info = LineInfo()
        info.who = who
        info.kwargs = dict(kwargs)
        info.filename, info.linenumber = store.renpy.get_filename_line()
        info.injected = False
        state.last = info

        ## 편집기가 열려 있으면, 이 줄에서 고치는 중인 값을 같이 보여줍니다.
        ## (편집기가 "다시 보기"로 같은 줄을 다시 보여줄 때 쓰임)
        if state.editing:
            key = (info.filename, info.linenumber)
            extra = dict(state.saved.get(key, { }))
            extra.update(state.line_edits.get(key, { }))
            if extra:
                kwargs = dict(kwargs)
                for k, v in extra.items():
                    n = a.get(k, k)
                    for old in [ o for o in kwargs if a.get(o, o) == n ]:
                        del kwargs[old]
                    if not (isinstance(v, str) and v == REMOVE):
                        kwargs[k] = v
                info.injected = True

        if is_on():
            kwargs = { a.get(k, k) : v for k, v in kwargs.items() }
        else:
            kwargs = { k : v for k, v in kwargs.items() if k not in a }

        ## 색 잔상(echo)은 외곽선 겹으로 복사본을 그립니다. 외곽선을 따로 적지 않았으면 넣어 줍니다.
        ts = kwargs.get("what_textshader")
        if isinstance(ts, str) and ts.split(":")[0] == "echo" and "what_outlines" not in kwargs:
            kwargs["what_outlines"] = list(ECHO_OUTLINES)

        ## 이름 상자 위치(name_x, name_y)는 screens.rpy의 이 줄이 있어야 동작합니다.
        if any(k.startswith("namebox_") for k in kwargs) and "namebox" not in store.config.character_id_prefixes:
            raise Exception(
                "[say_style] 이름 상자 위치(name_x, name_y)를 쓰려면 screens.rpy에 아래 두 줄이 있어야 합니다.\n"
                "init python:\n"
                "    config.character_id_prefixes.append('namebox')\n"
                "(렌파이로 새로 만든 프로젝트의 screens.rpy에는 say 스크린 바로 아래에 들어 있습니다)")

        ## 다른 곳에서 이미 지정해 둔 콜백이 있으면 이어서 호출
        if _previous is not None:
            return _previous(who, *args, **kwargs)

        return args, kwargs

    def apply_layout():
        """편집기가 저장한 캐릭터 기본값(say_style_layout.rpy)을 캐릭터에 적용."""
        if not is_on():
            return

        for name, props in (globals().get("layout", None) or { }).items():
            ch = getattr(store, name, None)
            if not isinstance(ch, store.ADVCharacter):
                continue
            for k, v in props.items():
                n = native(k)
                if n.startswith("what_"):
                    ch.what_args[n[5:]] = v


init 990 python in say_style:

    if store.config.say_arguments_callback is not say_arguments:
        _previous = store.config.say_arguments_callback
        store.config.say_arguments_callback = say_arguments

    apply_layout()
