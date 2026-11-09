################################################################################
## Screen FX — 지글거림(boil) 효과 설정
##
## 여기만 고치면 됩니다. 적지 않은 값은 엔진의 기본값을 따릅니다.
##
## 손그림 애니메이션의 "보일링"처럼 화면 전체가 계속 지글거립니다.
## 그림 테두리가 1초에 12번쯤 1~2픽셀씩 떨리고, 고운 알갱이가 매번 바뀝니다.
## 떨림이 부드럽지 않고 뚝뚝 끊겨서 손으로 한 장씩 그린 느낌이 납니다.
##
##     $ screen_fx.shaders("boil")                   # 1번 자리에 지글거림
##     $ screen_fx.shaders("halftone", "boil")       # 망점 + 지글거림 (손으로 찍은 인쇄물 같은 느낌)
##     $ screen_fx.shaders("none")                   # 끄기
##     e "꿈속 같아." (fx="boil")                     # 대사 줄 괄호로
##     $ boil.preset("nervous")                      # 아래 presets 묶음으로
##
## UI Kit 편집기(Shift+M → T로 "화면 효과" 탭 → "지글거림")로 바꿔 저장하면
## boil_layout.rpy가 만들어지고, 그 파일의 값이 여기 값보다 우선합니다.
################################################################################

## 효과 켜기·끄기
define boil.enabled = True

## 이 효과를 1번에 쓸 때 2번(덮개, VHS)을 기본으로 켤지
define boil.overlay = False

## 글자 빼기 ("say" 대사, "choice" 선택지, "screens" 메뉴·화면)
##   define boil.exclude = ()                # 대사창까지 같이 떨림 (기본)
##   define boil.exclude = ("say", "choice") # 대사·선택지는 가만히
define boil.exclude = ()

define boil.settings = {
    "strength": 1.0,        # 전체 세기 (0 = 원래 화면)
    "amount": 1.5,          # 떨림(픽셀). 1~2가 손그림 같고, 4 넘으면 일렁임
    "fps": 12.0,            # 1초에 몇 번 바뀌는지. 손그림 애니메이션은 보통 8~12
    "scale": 40.0,          # 떨림 무늬 크기(픽셀). 작으면 테두리가 자글자글, 크면 덩어리로 출렁
    "soft": 0.3,            # 살짝 번짐 (0 = 또렷)
    "grain": 0.08,          # 알갱이 세기 (0 = 없음)
    "grain_size": 1.0,      # 알갱이 크기(픽셀)
}

define boil.presets = {
    "calm": {               # 아주 살짝 (거의 안 보이게 살아 있는 느낌)
        "amount": 0.8,
        "fps": 8.0,
        "grain": 0.04,
    },
    "nervous": {            # 불안하게 자글자글
        "amount": 2.5,
        "fps": 15.0,
        "scale": 18.0,
        "grain": 0.12,
    },
    "wobble": {             # 크게 출렁 (술에 취한 듯)
        "amount": 5.0,
        "fps": 6.0,
        "scale": 120.0,
        "grain": 0.0,
    },
}

## 게임 중에 값 바꾸기 (세이브·되감기에 저장)
##     $ boil.set(amount=3.0, duration=1.0)           # 1초 동안 점점 심하게
##     $ boil.reset()                                 # 이 파일의 값으로

define boil.warper = "ease"
define boil.redraw = 0.0
