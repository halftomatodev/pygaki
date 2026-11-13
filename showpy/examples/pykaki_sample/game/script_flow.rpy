# 샘플: 빈 병동
# PyKaki가 만든 파일이에요. 직접 고치면 다음 내보내기 때 덮어써져요.

define mina = Character("미나", color="#ff8fb1", image="mina")

init python:
    config.label_overrides["start"] = "ward"

# ── 빈 병동 ──
# @node:n1 도입
label ward:
label ward.n1:
    # @l:l1
    scene bg hall with fade
    # @l:l2
    play music "audio/hum.wav"
    # @l:l3
    "불 꺼진 병동. 복도 끝에서 소리가 났다."
    # @l:l4
    show mina normal with dissolve
    # @l:l5
    mina "여기 아무도 없는 거 맞지?"
    # @end:n1
# @node:n2 노크
label ward.n2:
    # @l:l6
    # 빈 상자
    # @l:l7
    play sound "audio/knock.wav"
    # @l:l8
    "똑, 똑."
    # @l:l23
    show mina scared with dissolve
    # @l:l9
    mina "방금 그 소리 들었어?" (fx_warp=3)
    # @end:n2
# @node:n3 고민
label ward.n3:
    # @l:l10
    mina "어떻게 할까?"
    # @end:n3
    menu:
        "문을 연다":
            jump ward.n4
        "도망친다":
            jump ending_run
        "귀를 기울인다":
            jump ward.n5
# @node:n4 문을 연다
label ward.n4:
    # @l:l11
    $ screen_fx.use("ascii", overlay=True)
    # @l:l12
    scene bg room with dissolve
    # @l:l13
    show ghost with dissolve
    # @l:l14
    "방 안의 것이 천천히 고개를 들었다."
    # @l:l15
    hide ghost with fade
    # @l:l16
    $ screen_fx.clear()
    # @l:l17
    "[[끝] 문 뒤의 것 {b}엔딩{/b}."
    # @end:n4
    return
# @node:n5 귀를 기울인다
label ward.n5:
    # @l:l18
    "문에 귀를 댔다."
    # @end:n5
    call listen
    jump ward.n3

# ── 도망 엔딩 ──
# @node:n6 달린다
label ending_run:
label ending_run.n6:
    # @l:l19
    hide mina with dissolve
    # @l:l20
    stop music fadeout 1.0
    # @l:l21
    "돌아보지 않고 달렸다. 100%% 맞는 선택이었을까."
    # @end:n6
    return

# ── 소리 듣기 (call) ──
# @node:n7 숨소리
label listen:
label listen.n7:
    # @l:l22
    "문 너머에서 누군가 같이 숨을 쉬고 있었다."
    # @end:n7
    return

