################################################################################
## UI Kit — 커스텀 UI 엔진 (커서·클릭 대기 표시·대사 소리·텍스트 속도·퀵메뉴)
##
## 이 파일은 고칠 필요가 없습니다. 설정은 custom_ui_config.rpy에서 하세요.
## custom_ui.enabled = False면 이 파일은 아무것도 바꾸지 않습니다 (렌파이 기본).
################################################################################

## options.rpy·screens.rpy보다 늦게 실행되어 기본값을 덮어쓰도록 합니다.
init offset = 1

init -10 python in custom_ui:

    import store
    from store import python_object

    VERSION = store.ui_kit.VERSION

    DEFAULTS = dict(
        enabled=True,
        layout={ },

        cursor=False,
        cursor_frames=[ ],
        cursor_hold=2,              # 24fps에서 그림 한 장을 몇 프레임 보여줄지 (1 또는 2)
        cursor_mode="software",     # "software" 24fps (렌파이가 그림) / "hardware" 렌파이 기본 커서 (최대 20fps)
        cursor_hotspot=(0, 0),
        cursor_fps=10,              # (3.0 전 이름. 지금은 안 씀)

        ctc=False,
        ctc_name="ctc_anim",
        ctc_frames=[ ],
        ctc_hold=2,                 # 24fps에서 그림 한 장을 몇 프레임 보여줄지 (1 또는 2)
        ctc_delay=0.1,              # (3.0 전 이름. 지금은 안 씀)
        ctc_all_characters=True,
        ctc_position="nestled",

        typing_sound=None,
        typing_volume=1.0,
        typing_loop=True,
        typing_channel="typing",

        text_cps=None,
        quick_menu=True,
        )

    ## 편집기가 저장할 수 있는 값 (저장할 때 이 순서로 적습니다).
    EDIT_KEYS = ("text_cps", "typing_sound", "typing_volume",
                 "ctc", "ctc_frames", "ctc_hold",
                 "cursor", "cursor_frames", "cursor_hold", "cursor_mode", "cursor_hotspot",
                 "quick_menu")

    ## 커서·클릭 대기 표시 애니메이션은 초당 24프레임으로 고정 (3.0)
    FPS = 24
    MAX_FRAMES = 12     # 편집기에서 고를 수 있는 그림 수

    def hold_delay(hold):
        """그림 한 장을 hold 프레임 보여줄 때의 시간(초). 1 → 1/24초, 2 → 1/12초"""
        try:
            hold = int(hold)
        except Exception:
            hold = 2
        return max(1, hold) / float(FPS)

    class _Runtime(python_object):
        """편집기가 게임 실행 중에 저장한 값 (3.15).

        store 변수(custom_ui.layout)를 실행 중에 바꾸면 렌파이가 그 값을 게임 상태로 기억해서,
        저장 뒤 다시 불러오기(Shift+R 포함)를 하면 그 대사가 시작될 때의 옛 값이 새로 쓴
        custom_ui_layout.rpy 값을 덮습니다. 그래서 되감기와 저장에 들어가지 않는 보통 파이썬
        객체에 둡니다. 다시 불러오면 비워지고 파일 값을 씁니다."""
        layout = None

    runtime = _Runtime()

    def saved_layout():
        """편집기가 저장한 값: 이번 실행 중 저장한 것 → custom_ui_layout.rpy"""
        if runtime.layout is not None:
            return runtime.layout
        return globals().get("layout", None) or { }

    def cfg(name):
        """설정값. 편집기가 저장한 값(custom_ui_layout.rpy) → 설정 파일 → 기본값 순서."""
        g = globals()
        lay = saved_layout()
        if name in lay:
            return lay[name]
        if name in g:
            return g[name]
        return DEFAULTS[name]

    def on():
        return bool(cfg("enabled"))

    ## ── 클릭 대기 표시 ──

    def frame_at(frames, delay, st):
        delay = max(0.01, delay)
        n = int(st / delay) % len(frames)
        return store.renpy.displayable(frames[n]), delay

    def _ctc_frame(st, at):
        return frame_at(cfg("ctc_frames"), hold_delay(cfg("ctc_hold")), st)

    def _setup_ctc():
        if not on() or not cfg("ctc") or not cfg("ctc_frames"):
            return

        name = cfg("ctc_name")
        store.renpy.image(name, store.DynamicDisplayable(_ctc_frame))

        if not cfg("ctc_all_characters"):
            return

        ## ctc를 따로 지정하지 않은 모든 캐릭터에 기본으로 적용
        disp = store.renpy.displayable(name)
        pos = cfg("ctc_position")

        for v in list(vars(store).values()):
            if isinstance(v, store.ADVCharacter):
                if v.display_args.get("ctc", None) is None:
                    v.display_args["ctc"] = disp
                    v.display_args["ctc_position"] = pos

    ## ── 마우스 커서 ──

    def _cursor_frame(st, at):
        return frame_at(cfg("cursor_frames"), hold_delay(cfg("cursor_hold")), st)

    def _setup_cursor():
        if not on() or not cfg("cursor") or not cfg("cursor_frames"):
            return

        hx, hy = cfg("cursor_hotspot")

        if cfg("cursor_mode") == "hardware":
            ## 렌파이 기본 커서: 운영체제가 그려서 반응이 가장 빠르지만 초당 20프레임으로만 돌아감
            repeat = max(1, int(cfg("cursor_hold") or 1))
            frames = [ ]
            for f in cfg("cursor_frames"):
                frames.extend([ (f, hx, hy) ] * repeat)
            mouse = dict(store.config.mouse or { })
            mouse["default"] = frames
            store.config.mouse = mouse
            return

        ## 소프트웨어 커서: 렌파이가 화면에 직접 그림. 24fps가 정확하고 그림 크기 제한이 없음
        d = store.DynamicDisplayable(_cursor_frame)
        store.config.mouse_displayable = _Mouse(d, hx, hy)

        ## Screen FX가 있으면 화면 효과 안에도 그릴 수 있게 넘겨줌 (screen_fx.cursor, 4.2)
        sfx = getattr(store, "screen_fx", None)
        if sfx is not None and hasattr(sfx, "set_cursor_source"):
            sfx.set_cursor_source(d, hx, hy)

    def _inside_fx():
        """커서를 Screen FX가 화면 효과 안에 그리는 중인지."""
        sfx = getattr(store, "screen_fx", None)
        try:
            return sfx is not None and sfx.cursor_inside()
        except Exception:
            return False

    class _Mouse(store.MouseDisplayable):
        """맨 위 커서. 화면 효과 안에 그리는 동안에는 비워 둠 (운영체제 커서는 계속 숨김)."""

        def render(self, width, height, st, at):
            if _inside_fx():
                store.renpy.redraw(self, 0.25)
                return store.renpy.Render(width, height)
            return super(_Mouse, self).render(width, height, st, at)

    ## ── 대사 출력 소리 ──
    ## 모든 캐릭터에 자동으로 적용됩니다.
    ## 캐릭터마다 바꾸려면:  Character("이름", cb_typing_sound="audio/other.ogg")
    ## 그 캐릭터만 끄려면:   Character("이름", cb_typing_sound=None)

    _NOT_SET = object()

    def typing_callback(event, interact=True, typing_sound=_NOT_SET, **kwargs):
        if not interact or not on():
            return

        sound = cfg("typing_sound") if typing_sound is _NOT_SET else typing_sound
        channel = cfg("typing_channel")

        if event == "show_done":
            if not sound:
                return

            ## 글자가 한 번에 다 나오는 경우(속도 최대, 넘기기 중)에는 소리를 내지 않음
            if store._preferences.text_cps == 0 or store.config.skipping:
                return

            store.renpy.music.play(sound, channel=channel, loop=cfg("typing_loop"), relative_volume=cfg("typing_volume"))

        elif event in ("slow_done", "end"):
            store.renpy.music.stop(channel=channel)

    def _setup_typing():
        if not on():
            return

        channel = cfg("typing_channel")

        if not store.renpy.music.channel_defined(channel):
            store.renpy.music.register_channel(channel, "sfx", loop=cfg("typing_loop"))

        if typing_callback not in store.config.all_character_callbacks:
            store.config.all_character_callbacks.append(typing_callback)

    ## ── 퀵메뉴 ──
    ## 새 게임을 시작할 때 quick_menu 값을 정합니다. (불러온 세이브는 저장된 값 유지)

    def _start_quick_menu():
        if on():
            store.quick_menu = cfg("quick_menu")

    ## ── 텍스트 출력 속도 ──
    ## 처음 실행할 때(또는 설정 값을 바꿨을 때)만 적용하고, 그 뒤로는 플레이어가
    ## 환경설정에서 고른 값을 그대로 둡니다.
    ##
    ## options.rpy의 default preferences.text_cps와 같이 두 번째 default 문을 쓰면
    ## 두 값이 번갈아 기록되어 게임을 켤 때마다 플레이어 값이 초기화되므로,
    ## 이 플러그인은 자기 기록(persistent._ui_kit_text_cps)을 따로 둡니다.

    def apply_text_cps():
        value = cfg("text_cps")

        if not on() or value is None:
            return

        ## 환경설정 "초기화"를 눌렀을 때도 이 값으로 돌아가도록
        store.config.default_text_cps = value

        p = store.persistent

        if p._ui_kit_text_cps != value:
            store._preferences.text_cps = value
            p._ui_kit_text_cps = value


init 990 python in custom_ui:
    ## 설정 파일을 다 읽은 뒤 실행됩니다.

    _setup_cursor()
    _setup_ctc()
    _setup_typing()

    store.config.start_callbacks.append(_start_quick_menu)

    ## 처음 실행할 때 렌파이가 적용하는 기본값(config.default_text_cps)을 이 값으로
    if on() and cfg("text_cps") is not None:
        store.config.default_text_cps = cfg("text_cps")

    ## 설정 값을 바꾼 뒤 처음 실행할 때 적용 (default 문이 실행된 직후마다 확인)
    if apply_text_cps not in store.config.after_default_callbacks:
        store.config.after_default_callbacks.append(apply_text_cps)
