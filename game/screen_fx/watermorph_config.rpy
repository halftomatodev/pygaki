################################################################################
## Screen FX — 타이틀 일렁임(watermorph) 설정
##
## 타이틀 화면을 투명한 액체 너머로 보는 것처럼 일렁이게 합니다.
##
## UI Kit 편집기(개발 모드에서 Shift+M → T로 "타이틀 일렁임" 탭)로 바꿔 저장하면
## watermorph_layout.rpy가 만들어지고, 그 파일의 값이 여기 값보다 우선합니다.
################################################################################

init offset = 1


## 켜기 / 끄기
define watermorph.enabled = True

## 적용 대상
##   "screen"     타이틀 화면 전체 (배경 + 메뉴 글자)
##   "background" 배경만 (메뉴 글자는 선명하게)
define watermorph.target = "screen"

## 일렁임 세기 (픽셀). 화면만 휘고 클릭 영역은 그대로라서
## "screen"일 때는 8 이하를 권장합니다.
define watermorph.amount = 6.0

## 물결 하나의 크기 (픽셀). 클수록 느긋하고 큰 물결
define watermorph.scale = 180.0

## 흐르는 속도
define watermorph.speed = 0.6

## 소용돌이 정도. 0이면 단순한 물결, 클수록 휘감기는 흐름
define watermorph.flow = 1.2

## 액체 표면에 비친 빛의 세기 (0이면 없음)
define watermorph.shine = 0.15

## 품질 1 ~ 3. 높을수록 물결이 섬세하지만 계산이 많아요.
## 저사양 PC나 모바일을 생각하면 1~2.
define watermorph.quality = 2

## 타이틀에서 연 환경설정·불러오기 화면에도 적용할지 ("screen"일 때만)
define watermorph.in_title_menus = False
