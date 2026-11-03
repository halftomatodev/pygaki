################################################################################
## UI Kit — 이미지·영상 배치 설정 (stage)
##
## 이 파일만 고치면 됩니다.
##
## 하는 일
##   1. game/movies/ 폴더의 영상(.webm)을 이름만으로 쓸 수 있게 자동 등록합니다.
##        movies/rain.webm          →  show rain
##        movies/mask_ghost.webm    →  show ghost   (이름 앞 mask_ = 투명 영상)
##      그림은 렌파이가 원래 game/images/ 폴더를 자동 등록하므로 따로 할 일이 없습니다.
##   2. bg 태그(show bg room, scene bg street …)는 항상 맨 뒤에 그립니다.
##   3. 편집기(개발 모드에서 Shift+M)의 "이미지/영상" 탭에서 show·hide·scene 줄의
##      위치와 전환 효과를 고르고, Ctrl+S로 원고의 그 줄에 바로 저장합니다.
##        show eileen happy at stage.pos(420, 720) with Dissolve(1.0)
##        hide eileen with stage.ease("outright", 0.8)
################################################################################

init offset = 1


## ── 이 기능을 쓸지 ───────────────────────────────────────────────────────────
## False면 영상 자동 등록, bg 고정, 편집기의 "이미지/영상" 탭이 모두 꺼집니다.
## (원고에 이미 적힌 stage.pos(…), stage.move(…) 등은 False여도 그대로 동작합니다)

define stage.enabled = True


## ── 영상 자동 등록 ───────────────────────────────────────────────────────────

## 영상을 넣을 폴더 (game 폴더 기준). 안쪽 폴더에 넣어도 됩니다.
define stage.movies_dir = "movies"

## 등록할 영상 파일 종류
define stage.movie_extensions = (".webm",)

## 이 글자로 시작하는 파일은 투명 영상(side_mask: 왼쪽 절반 색, 오른쪽 절반 투명도)으로 읽고,
## 이름에서는 이 글자를 뺍니다.  movies/mask_ghost.webm → show ghost
define stage.mask_prefix = "mask_"

## 영상을 반복 재생할지. 한 번만 재생할 영상은 아래 목록에 이름을 적습니다.
define stage.movie_loop = True
define stage.movie_once = [ ]           # 예: [ "door_open", "explosion" ]


## ── bg 태그 (배경) ──────────────────────────────────────────────────────────
## 이 태그의 그림은 배경으로 봅니다.
##   - 항상 다른 그림보다 뒤에 그립니다. (show bg room zorder 5 처럼 zorder를 적어도 맨 뒤)
##   - 편집기 "이미지/영상" 탭에서 끌기, 방향키, 위치 버튼으로 옮기지 않습니다. (전환 효과는 고칠 수 있음)
##
## 태그는 그림 이름의 첫 단어입니다.  scene bg room → 태그 "bg",  scene fx_bg → 태그 "fx_bg"
## (show eileen as ghost 처럼 as를 적었으면 as 뒤의 이름이 태그)
## 여러 개면 목록으로 적습니다.
##   define stage.bg_tag = [ "bg" ]                  # 기본: bg 하나
##   define stage.bg_tag = [ "bg", "fx_bg" ]         # fx_bg도 배경으로
##   define stage.bg_tag = [ "bg", "room", "sky" ]   # 이름이 room, sky로 시작하는 그림도 배경으로
##   define stage.bg_tag = "bg"                      # 예전처럼 글자 하나로 적어도 됨
##   define stage.bg_tag = [ ]                       # 배경 처리를 끔 (맨 뒤, 위치 고정 둘 다)

define stage.bg_tag = [ "bg" ]
define stage.bg_zorder = -1000      # 배경을 그리는 깊이 (작을수록 뒤)


## ── 편집기: 위치 ─────────────────────────────────────────────────────────────
## 끌어서 옮기면 원고에 at stage.pos(x, y)로 적힙니다.
## x, y는 그림의 기준점이 놓일 화면 좌표(픽셀)이고, 기준점은 아래 값입니다.
## (0.5, 1.0) = 그림의 아래 가운데. 렌파이 기본 위치(left, center, right)와 같은 기준.

define stage.anchor = (0.5, 1.0)

## 위치 버튼 (렌파이에 들어 있는 위치 이름, 버튼 글자)
define stage.positions = [
    ("left", "왼쪽"),
    ("center", "가운데"),
    ("right", "오른쪽"),
    ("truecenter", "정중앙"),
    ("offscreenleft", "화면 밖 왼쪽"),
    ("offscreenright", "화면 밖 오른쪽"),
]
