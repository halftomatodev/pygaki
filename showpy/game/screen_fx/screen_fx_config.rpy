################################################################################
## Screen FX — 효과 바꾸기·전환 설정
##
## 여기만 고치면 됩니다. 적지 않은 값은 엔진의 기본값을 따릅니다.
##
## UI Kit 편집기(개발 모드에서 Shift+M → T로 "화면 효과" 탭 → "전환" 버튼)로 바꿔
## 저장하면 screen_fx_layout.rpy가 만들어지고, 그 파일의 값이 여기 값보다 우선합니다.
##
## ── 화면은 셰이더 두 개를 겹쳐 그립니다 (4.0) ──────────────────────────────
##
##   1번 (기본 효과)  기본 / 아스키 / VHS / 단말기 / 게임보이 중 하나   (아래 screen_fx.base)
##   2번 (덮개)       같은 다섯 중 하나. True는 VHS, False는 없음     (아래 screen_fx.overlay) (4.3)
##
##   그림:  [게임 화면] → 기본 효과 → 덮개(VHS) → 눈에 보이는 화면
##   처음 상태(배포 설정)는 "기본 효과 없음 + 덮개 켬" = 화면 전체에 VHS.
##
## ── 스크립트에서 효과 바꾸기 (전부 실제로 쓸 수 있는 줄) ─────────────────────
##
##   $ screen_fx.use("ascii")                      # ASCII로. clear()까지 계속 ASCII
##   $ screen_fx.use("ascii", transition="tv")     # TV가 꺼졌다 켜지며 바뀜 (기본)
##   $ screen_fx.use("ascii", transition="fade")   # 서서히 바뀜
##   $ screen_fx.use("ascii", transition=None)     # 바로 바뀜
##   $ screen_fx.use("ascii", duration=2.0)        # 전환 전체 시간을 2초로
##   $ screen_fx.use("ascii", wait=False)          # 전환을 기다리지 않고 바로 다음 줄로
##   $ screen_fx.use("none")                       # 기본 효과 없음 (덮개는 설정대로)
##   $ screen_fx.use("none", overlay=False)        # 아무 효과 없는 깨끗한 화면
##   $ screen_fx.clear()                           # 선택취소: 기본 효과와 덮개를 설정대로
##
##   ## 셰이더 두 자리를 한 번에 (4.3, 편집기 "여기에서부터 적용"이 넣는 줄)
##   $ screen_fx.shaders("ascii", "vhs_crt")       # 1번 아스키 + 2번 VHS
##   $ screen_fx.shaders("gameboy")                # 1번 게임보이, 2번 없음
##   $ screen_fx.shaders("none", "none")           # 전부 셰이더 적용 취소
##   $ screen_fx.clear(transition="fade")          # 서서히 돌아감
##
##   ## 덮개(VHS) 켜고 끄기
##   $ screen_fx.use("gameboy", overlay=True)      # 게임보이 + VHS 덮개
##   $ screen_fx.use("ascii", overlay=False)       # ASCII만 (덮개 끔)
##   $ screen_fx.set_overlay(False)                # 효과는 그대로 두고 덮개만 끔
##   $ screen_fx.set_overlay(True, transition="fade")   # 덮개만 서서히 켬
##   ## use()는 부를 때마다 덮개를 새로 정합니다. overlay를 안 적으면 설정대로
##   ## (아래 screen_fx.overlay, 그리고 효과마다 <이름>.overlay. 레트로 터미널은 기본으로 덮개 끔)
##
##   ## 덮개 왜곡 정도 (vhs_crt_config.rpy의 settings가 기본값)
##   $ screen_fx.set_warp(3.0)                     # 가장자리 휘어짐 3 (0 = 평평, 1 = 기본)
##   $ screen_fx.set_warp(0.0, duration=2.0)       # 2초 동안 서서히 평평하게
##   $ screen_fx.set_warp("default")               # 설정 파일 값으로
##   $ vhs_crt.set(distort_intensity=0.15, aberration=0.2, duration=1.0)   # 다른 왜곡 값도 같이
##   $ vhs_crt.reset()                             # set()으로 바꾼 값을 전부 설정 파일 값으로
##
##   ## 글자 빼기: 이번만 바꾸기 (적지 않으면 그 효과의 설정 파일 <이름>.exclude 값)
##   ##   "say" 대사·이름 / "choice" 선택지 / "screens" 메뉴·화면(퀵메뉴, 저장 화면 등)
##   $ screen_fx.use("ascii", exclude=())                               # 아무것도 안 뺌: 대사창까지 전부 글자로
##   $ screen_fx.use("gameboy", exclude=("say",))                       # 대사·이름만 원래 색 (쉼표 꼭: ("say",))
##   $ screen_fx.use("gameboy", exclude=("say", "choice", "screens"))   # 글자 전부 원래 색, 배경·캐릭터만
##
##   ## 대사 줄 괄호로 (편집기 대사 탭에서 고르면 이렇게 저장됩니다)
##   e "화면이 이상해." (fx="ascii")                          # 이 대사가 나오기 전에 ASCII로
##   e "원래대로." (fx="default")                             # 선택취소
##   e "천천히 바뀐다." (fx="gameboy", fx_transition="fade")   # 이 줄만 다른 전환
##   e "번쩍." (fx="none", fx_overlay=False, fx_transition=None)   # 바로 깨끗한 화면으로
##   e "덮개만 걷자." (fx_overlay=False)                       # 효과는 그대로, 덮개만 끔
##   e "화면이 휜다." (fx_warp=3.0)                            # 덮개 휘어짐 3 (fx_warp="default"면 설정값)
##   e "전부 글자로." (fx="ascii", fx_exclude=())               # 이번만 아무것도 안 뺌
##   e "대사만 또렷하게." (fx="gameboy", fx_exclude=("say",))   # 이번만 대사·이름 빼기
##
##   ## 지금 켜진 효과 확인
##   if screen_fx.current_effect() == "ascii":
##       e "아직 글자 화면이야."
##   if screen_fx.overlay_on():                     # 지금 덮개(VHS)가 켜져 있는지
##       e "VHS가 덮여 있어."
##   if "say" in screen_fx.current_exclude():       # 지금 효과에서 뺀 글자 묶음 (튜플)
##       e "대사창은 멀쩡해."
##
##   ## 화면 버튼 (screens.rpy 등)
##   textbutton "ASCII" action screen_fx.Use("ascii")
##   textbutton "ASCII+VHS" action screen_fx.Use("ascii", overlay=True)
##   textbutton "VHS 덮기" action screen_fx.SetOverlay(True)
##   textbutton "덮개 걷기" action screen_fx.SetOverlay(False)
##   textbutton "원래대로" action screen_fx.Clear()
##   textbutton _("화면 효과") action screen_fx.Toggle()   # 플레이어용: 화면 효과 전부 끄기·켜기
##
##   ## 스크린 안에 add한 그림에도 효과 씌우기 (효과에서 "screens"(메뉴·화면)를 뺐을 때)
##   screen map_view():
##       add "images/map.png" at screen_fx.scene
##
## 기본 효과 이름: "default"(설정의 기본 효과), "none"(없음), "ascii", "retro_term", "gameboy"
##                + engine 폴더에 새로 넣은 효과 (README "새 효과 넣기")
## 예전 이름 "vhs_crt"를 기본 효과로 쓰면 "없음 + 덮개 켬"으로 바꿔 읽습니다. (3.x 원고 호환)
## 고른 효과·덮개·휘어짐은 세이브·되감기에 같이 저장됩니다. 새 게임을 시작하면 설정대로 돌아갑니다.
################################################################################


## 기본 효과: use()로 바꾸지 않았을 때, 그리고 clear()로 돌아올 때의 효과
##   "none"        없음 (배포 설정. 덮개를 켜 두면 화면 전체에 VHS만)
##   "ascii"       ASCII (ascii_config.rpy의 값)
##   "retro_term"  레트로 터미널 (retro_term_config.rpy의 값)
##   "gameboy"     게임보이 (gameboy_config.rpy의 값)
define screen_fx.base = "none"

## 덮개(VHS): 기본 효과 위에 한 번 더 씌우는 VHS. 켬 / 끔만 고릅니다.
##   True   켬 (배포 설정). 단, 효과마다 <이름>.overlay가 False면 그 효과를 쓰는 동안은 끔
##          (레트로 터미널은 자체 곡면 CRT가 있어서 retro_term.overlay = False가 기본)
##   False  끔. use(…, overlay=True)나 대사 괄호 fx_overlay=True로 켤 때만 씌움
## VHS의 값(휘어짐, 노이즈, 색 번짐 …)은 vhs_crt_config.rpy에서 정합니다.
## 덮개는 화면을 한 번 더 그리므로, 아주 느린 PC에서는 조금 무거워질 수 있습니다.
define screen_fx.overlay = True

## 효과를 바꿀 때 기본 전환 (use()나 대사 괄호에서 따로 정하지 않았을 때)
##   "tv"    TV가 꺼졌다 켜지는 것처럼 (아래 screen_fx.tv 값)
##   "fade"  앞 효과가 서서히 빠지고 새 효과가 서서히 들어옴
##   None    바로 바꿈
define screen_fx.transition = "tv"

## "fade" 전환 전체 시간(초)
define screen_fx.fade_time = 1.0

## True: 전환이 끝날 때까지 기다렸다가 다음 줄(대사)로 넘어감
## False: 전환을 시작하고 바로 다음 줄로 (대사가 전환 중에 나오기 시작함)
define screen_fx.wait = True

## True: 플레이어가 클릭하면 전환을 건너뛰고 바로 새 효과로
## False: 전환이 끝날 때까지 클릭을 받지 않음 (건너뛰기(Ctrl) 중에는 항상 바로 바뀜)
define screen_fx.skippable = True

## 마우스 커서를 화면 효과의 어디에 그릴지 (4.2)
## UI Kit의 커서(custom_ui.cursor = True, cursor_mode = "software")를 쓸 때만 해당됩니다.
##   "effect"   기본 효과와 덮개를 다 받음. ASCII면 커서도 글자로, 게임보이면 4색 점으로 (기본)
##   "overlay"  덮개(VHS)만 받음. 주사선, 색 번짐, 휘어짐은 받고 ASCII 등은 안 받음
##   "top"      효과를 안 받음. 늘 맨 위에 깨끗하게 (4.1까지와 같음)
## 커서도 화면과 같이 휘어서, 가장자리에서 보이는 자리와 눌리는 자리가 거의 맞습니다.
## 편집기(Shift+M)를 연 동안에는 늘 맨 위에 그립니다.
## 게임 중에 바꾸기 (다시 바꿀 때까지 유지, 세이브에 저장):
##   $ screen_fx.set_cursor("top")                    # 여기부터 커서는 효과 안 받음
##   $ screen_fx.set_cursor("default")                # 이 설정값으로 돌아감
##   $ screen_fx.use("ascii", cursor="overlay")       # 효과를 바꾸면서 같이
##   e "커서가 깨끗해졌다." (fx_cursor="top")           # 대사 괄호
define screen_fx.cursor = "effect"

## ── 타이틀, 게임 내 메뉴 셰이더 (4.3) ──────────────────────────────────────
## 타이틀(과 타이틀에서 연 환경설정, 불러오기 화면)과 게임 중 ESC 메뉴(와 거기서 연 저장, 환경설정 화면)에는
## 인게임 셰이더 대신 여기서 고른 두 자리를 화면 전체에 씌웁니다. (1번, 2번) 순서.
##   "none"        기본 (아무것도 안 함)
##   "ascii"       아스키
##   "vhs_crt"     VHS
##   "retro_term"  단말기 (레트로 터미널)
##   "gameboy"     게임보이
##   "ripple"      일렁임 (5.5)
## 예: define screen_fx.title_shaders = ("vhs_crt", "none")      # 타이틀에 VHS
##     define screen_fx.menu_shaders = ("gameboy", "vhs_crt")    # ESC 메뉴에 게임보이 + VHS
## 편집기(Shift+M) "타이틀 셰이더", "게임 내 메뉴 셰이더" 탭에서 고르고 저장하면 screen_fx_layout.rpy에 들어갑니다.
## 효과마다 세부 값(휘어짐, 글자 크기 …)은 인게임과 같이 씁니다 (<이름>_config.rpy).
define screen_fx.title_shaders = ("ripple", "none")   # 타이틀에 일렁임 (5.5. 예전 "타이틀 일렁임")
define screen_fx.menu_shaders = ("none", "none")

## UI Kit 편집기(Shift+M)를 연 동안에도 화면 효과를 보여줄지 (3.4)
##   True   효과를 켠 채로 편집. 편집기 패널은 효과 위에 깨끗하게 보임 (기본)
##   False  "화면 효과" 탭이 아닌 탭에서는 효과를 잠시 끔 (3.3까지의 방식)
## 편집 중에 V 키로 언제든 켜고 끌 수 있습니다. (게임을 다시 켜면 이 값으로 돌아감)
## VHS/CRT처럼 화면을 휘는 효과는 가장자리에서 눈에 보이는 자리와 눌리는 자리가 조금 어긋나니,
## 그림을 정확히 끌어 놓을 때는 V로 잠깐 끄세요.
define screen_fx.editor_preview = True

## TV 꺼짐·켜짐 전환
##   꺼짐: 화면이 위아래로 눌려 밝은 가로선 → 가로선이 가운데 점으로
##   검은 화면 (이때 효과가 바뀜)
##   켜짐: 점 → 가로선 → 화면이 펴짐 (지직거림이 서서히 빠짐)
define screen_fx.tv = {
    "off_time": 0.35,       # 꺼지는 시간(초)
    "black_time": 0.25,     # 꺼진 채 검은 화면(초)
    "on_time": 0.45,        # 켜지는 시간(초)
    "line": 3,              # 가로선·점 두께(픽셀)
    "flash": 0.8,           # 꺼질 때 하얗게 빛나는 정도 (0 = 안 빛남, 1 = 새하얗게)
    "noise": 0.5,           # 켜질 때 지직거림 (0 = 없음, 1 = 화면이 노이즈로 가득)

    ## 소리 (game 폴더 기준 경로, None = 소리 없음). 환경설정의 효과음 음량을 따릅니다.
    "off_sound": None,      # 예: "audio/tv_off.ogg"  꺼지기 시작할 때
    "on_sound": None,       # 예: "audio/tv_on.ogg"   켜지기 시작할 때
    "volume": 1.0,          # 두 소리의 음량 (0~1)
}

## 기능을 하나만 쓰고 싶을 때:
##   - VHS만 쓰고 바꾸는 기능은 안 씀: 그냥 use()를 안 쓰면 됩니다.
##   - 평소에는 깨끗하고 특정 장면에서만 효과: define screen_fx.base = "none"
##   - 전환 연출 없이 늘 바로 바꿈: define screen_fx.transition = None
##   - 어떤 효과로 바꿔도 VHS 질감은 늘 남김: define screen_fx.overlay = "vhs_crt"
##
## 글자 빼기는 효과마다 따로 정합니다:
##   vhs_crt_config.rpy의 vhs_crt.exclude, ascii_config.rpy의 ascii.exclude, gameboy_config.rpy의 gameboy.exclude …
## (3.1의 <이름>.target = "screen"/"scene"도 그대로 됩니다. "scene"은 글자 전부 빼기와 같음)

## 대사창과 선택지를 각자 층에 띄울지 (글자 빼기를 "대사·이름" / "선택지" / "메뉴·화면"으로 나눠 고르려면 True)
##   True   대사창은 sfx_say 층, 선택지는 sfx_choice 층에 뜸 (기본). 층 순서: 장면 → 대사창 → 선택지 → 퀵메뉴·메뉴
##   False  렌파이 기본처럼 전부 screens 층. 다른 코드가 대사창 층을 "screens"로 정해 두고 쓸 때.
##          이때 글자 빼기는 "전부 빼기"와 "안 빼기"만 됨 (하나라도 고르면 글자 전부 뺌)
define screen_fx.split_text_layers = True
