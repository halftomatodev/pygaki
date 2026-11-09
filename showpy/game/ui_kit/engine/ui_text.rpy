################################################################################
## UI Kit — UI 글 엔진 (확인 창 글, 버튼 글자 바꾸기) (3.23)
##
## 이 파일은 고칠 필요가 없습니다. 설정은 ui_text_config.rpy에서,
## 또는 편집기(개발 모드에서 Shift+M → "UI 글" 탭)에서 하세요.
##
## 렌파이의 글 번역표(기본 언어)에 "원래 글 → 새 글"을 넣어서 바꿉니다.
## 그래서 screens.rpy를 고치지 않아도 종료 확인 창, 퀵메뉴 버튼 글자 등이 바뀝니다.
################################################################################

init offset = 1

init -10 python in ui_text:

    import store
    from store import python_object

    VERSION = store.ui_kit.VERSION

    ## 설정 파일(ui_text_config.rpy)과 편집기가 저장한 파일(ui_text_layout.rpy)
    texts = { }
    layout = { }

    ## 바꿀 수 있는 글: (이름, 묶음, 설명, 원래 글들, 확인 창인지)
    ## 원래 글은 렌파이가 쓰는 글이나 screens.rpy의 _("…") 글입니다. 한국어로 만든 프로젝트와
    ## 영어로 만든 프로젝트의 글이 달라서 둘 다 적었습니다. 하나를 바꾸면 둘 다 바뀝니다.
    ITEMS = (
        ("quit", "확인 창", "게임 끄기", ("Are you sure you want to quit?",), True),
        ("main_menu", "확인 창", "메인 메뉴로 가기", ("Are you sure you want to return to the main menu?\nThis will lose unsaved progress.",), True),
        ("loading", "확인 창", "불러오기", ("Loading will lose unsaved progress.\nAre you sure you want to do this?",), True),
        ("overwrite_save", "확인 창", "저장 덮어쓰기", ("Are you sure you want to overwrite your save?",), True),
        ("delete_save", "확인 창", "저장 지우기", ("Are you sure you want to delete this save?",), True),
        ("end_replay", "확인 창", "리플레이 끝내기", ("Are you sure you want to end the replay?",), True),
        ("are_you_sure", "확인 창", "그 밖의 확인", ("Are you sure?",), True),
        ("slow_skip", "확인 창", "넘기기 시작", ("Are you sure you want to begin skipping?",), True),
        ("fast_skip_seen", "확인 창", "다음 선택지까지 넘기기", ("Are you sure you want to skip to the next choice?",), True),
        ("fast_skip_unseen", "확인 창", "안 읽은 글도 넘기기", ("Are you sure you want to skip unseen dialogue to the next choice?",), True),

        ("yes", "확인 창 버튼", "예", ("네", "Yes"), False),
        ("no", "확인 창 버튼", "아니오", ("아니오", "No"), False),

        ("q_back", "퀵메뉴", "되감기", ("되감기", "Back"), False),
        ("q_history", "퀵메뉴", "대사록 (게임 메뉴에도)", ("대사록", "History"), False),
        ("q_skip", "퀵메뉴", "넘기기", ("넘기기", "Skip"), False),
        ("q_auto", "퀵메뉴", "자동진행", ("자동진행", "Auto"), False),
        ("q_save", "퀵메뉴", "저장하기 (게임 메뉴에도)", ("저장하기", "Save"), False),
        ("q_qsave", "퀵메뉴", "Q.저장하기", ("Q.저장하기", "Q.Save"), False),
        ("q_qload", "퀵메뉴", "Q.불러오기", ("Q.불러오기", "Q.Load"), False),
        ("q_prefs", "퀵메뉴", "설정", ("설정", "Prefs"), False),
        ("q_menu", "퀵메뉴", "메뉴 (휴대폰 화면)", ("메뉴", "Menu"), False),

        ("m_start", "메인 메뉴, 게임 메뉴", "시작하기", ("시작하기", "Start"), False),
        ("m_load", "메인 메뉴, 게임 메뉴", "불러오기", ("불러오기", "Load"), False),
        ("m_prefs", "메인 메뉴, 게임 메뉴", "환경설정", ("환경설정", "Preferences"), False),
        ("m_main", "메인 메뉴, 게임 메뉴", "메인 메뉴", ("메인 메뉴", "Main Menu"), False),
        ("m_about", "메인 메뉴, 게임 메뉴", "버전정보", ("버전정보", "About"), False),
        ("m_help", "메인 메뉴, 게임 메뉴", "조작방법", ("조작방법", "Help"), False),
        ("m_quit", "메인 메뉴, 게임 메뉴", "종료하기", ("종료하기", "Quit"), False),
        ("m_return", "메인 메뉴, 게임 메뉴", "돌아가기", ("돌아가기", "Return"), False),
        ("m_end_replay", "메인 메뉴, 게임 메뉴", "리플레이 끝내기", ("리플레이 끝내기", "End Replay"), False),
        )

    ITEM = { i[0]: i for i in ITEMS }

    class _Runtime(python_object):
        ## 편집기에서 저장한 값 (다시 불러오기 전까지 ui_text_layout.rpy 대신 씀)
        saved = None

    runtime = _Runtime()

    ## 바꾸기 전의 번역 (원래 글 → 번역 또는 None)
    _orig = { }

    def _table():
        return renpy.game.script.translator.strings[None]

    def merged():
        """설정 파일 → 편집기가 저장한 값 순서로 합친 {이름: 새 글}."""
        d = dict(texts or { })
        d.update(runtime.saved if runtime.saved is not None else (layout or { }))
        return { k: v for k, v in d.items() if k in ITEM and v }

    def original(name):
        """바꾸기 전에 화면에 보이던 글."""
        st = _table()
        srcs = ITEM[name][3]
        for s in srcs:
            if s in _orig:
                t = _orig[s]
            else:
                t = st.translations.get(s)
            if t:
                return t
        return srcs[0]

    def current(name):
        d = merged()
        return d.get(name) or original(name)

    def apply(d=None):
        """{이름: 새 글}을 번역표에 넣습니다. 빠진 이름은 원래대로."""
        if d is None:
            d = merged()
        st = _table()
        want = { }
        for name, new in d.items():
            if name in ITEM and new:
                for s in ITEM[name][3]:
                    want[s] = new
        ## 원래대로 돌릴 것
        for s in list(_orig):
            if s not in want:
                if _orig[s] is None:
                    st.translations.pop(s, None)
                else:
                    st.translations[s] = _orig[s]
                del _orig[s]
        for s, new in want.items():
            if s not in _orig:
                _orig[s] = st.translations.get(s)
            st.translations[s] = new

    def show_confirm(text):
        """확인 창을 띄워 봅니다 (편집기의 [이 창 보기])."""
        store.renpy.show_screen("confirm", message=text, yes_action=store.Hide("confirm"), no_action=store.Hide("confirm"))
        store.renpy.restart_interaction()

## 모든 설정과 번역 파일을 읽은 뒤에 적용
init 990 python in ui_text:
    apply()
