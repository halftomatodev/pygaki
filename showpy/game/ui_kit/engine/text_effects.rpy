################################################################################
## UI Kit — 대사 등장 효과 (텍스트 셰이더)
##
## 이 파일은 고칠 필요가 없습니다.
##
## 렌파이에 들어 있는 효과(dissolve, typewriter, wave ...)에 더해, 글자마다
## 움직이는 등장 효과를 등록합니다. 대사 괄호의 effect에 이름을 적습니다.
##
##     e "흩어졌다가 모인다." (cps=30, effect="scatter")
##     e "쾅!" (cps=20, effect="slam")
##
##   scatter     흩어졌다 모이기: 여기저기 돌아간 채 흩어져 있다가 제자리로
##   drop        떨어지기: 위에서 떨어져 살짝 튕김
##   spin        회전하며 들어오기: 돌면서 커지며 제자리로
##   shuffle     무작위 순서: 순서 없이 하나씩 켜짐
##   flash       색 번쩍: 노란색으로 켜졌다가 원래 색으로
##   slam        크게 찍히기: 크게 나타나 줄어들며 쾅, 잠깐 흔들림
##   typecursor  커서 타자기: 하나씩 나오고 다음 글자 자리에 밑줄
##   echo        색 잔상: 파랑, 노랑 복사본이 한 박자 늦게 따라와 겹침
##   glitch      글리치: 가로로 잘려 어긋나고 색이 갈라졌다가 섬
##   glow        빛 번짐: 글자 주변이 흐리게 빛남 (한 번에 나와도 보임)
##   blurin      흐렸다 또렷해지기
##   wipe        위에서 아래로 그려지기 (글자가 크면 effect="wipe:u__span=80")
##   blockglitch 블록 글리치: 네모 칸마다 밀리거나 늘어나거나 색이 바뀌었다가 섬
##               (effect="blockglitch:u__hold=0.3"이면 다 나온 뒤에도 계속 깨짐)
##   melt        녹아내림: 흘러내린 색이 모여 글자가 됨 (u__hold로 계속 녹기)
##   mosh        데이터모싱 흉내: 네모 칸이 한쪽으로 끌리며 번졌다가 돌아옴 (u__hold로 계속)
##   liquid      일렁임: 물에 비친 것처럼 계속 출렁임 (한 번에 나와도 보임)
##   vhs         지직거리는 VHS: 주사선, 띠 찢김, 색 어긋남, 색조 바뀜, 노이즈가 계속 (한 번에 나와도 보임)
##   rise        떠오르기: 글자마다 다른 깊이에서 떠올라 제자리로
##   lean        기울며 들어오기: 크게 기운 채 옆에서 들어와 바로 섬
##   stretch     늘어나며 들어오기: 세로로 늘어났다가 원래 비율로 (u__x, u__y로 방향)
##   slidein     미끄러져 멈춤: 한쪽에서 빠르게 들어와 살짝 지나쳤다가 돌아와 멈춤
##               (u__dir 방향 도: 0 오른쪽, 90 위, 180 왼쪽, 270 아래. u__stagger=0이면 줄 통째로)
##   shake       살짝 흔들림: 다 나온 뒤에도 글자마다 조금씩 떨림. 다른 효과와 겹쳐 씀 (effect="slidein|shake")
##   inkfill     외곽선 채우기: 외곽선만 먼저 보이고 속이 차례대로 차오름 (u__mode=0이면 한 번에)
##   glyphbox    글자마다 상자: 글자 뒤에 상자가 먼저 튀어나오고 글자가 찍힘 (띄어쓰기에도 상자)
##   stamp       도장: 크게, 기운 채 찍히며 줄어들고 잉크 결이 남음 (u__color 잉크 색, u__grain 결)
##   punch       튀어나오는 줌: 깊은 곳에서 커지며 튀어나오고 잔상이 끌림 (u__zoom, u__trail)
##   squash      찌그러졌다 튕김: 납작하게 눌렸다가 고무처럼 튕기며 원래 모양 (u__amount, u__bounce)
##   extrude     입체 글자: 비스듬히 여러 겹 깔아 두께, 나올 때 두께가 자람 (u__depth, u__angle, u__shade)
##   flipin      뒤집으며 나오기: 판처럼 뒤집히며 자리 잡음 (u__axis 0 위아래, 1 좌우. 렌파이 flip과 다름)
##   led         LED 전광판: 점으로 된 전광판 글자, 꺼진 점도 흐리게 (u__cell 점 간격, u__off, u__offcolor)
##   split       위아래 갈라짐: 위 절반과 아래 절반이 위아래에서 와서 맞물림 (u__distance, u__gap)
##
## 효과 두 개를 겹치려면 | 로 잇습니다: effect="slidein|shake"
##
## 값은 콜론으로 바꿀 수 있습니다. (렌파이 텍스트 셰이더 문법)
##     effect="scatter:u__distance=200"      더 멀리서 모임
##     effect="flash:u__color=#ff4081"        번쩍이는 색
##
## 글자가 하나씩 나올 때만 움직입니다. 텍스트 속도가 "즉시"면 cps를 적으세요.
##
## 셰이더 코드는 같은 폴더의 text_effects.glsl에 있습니다. 이 파일은 그것을 읽어 등록만 합니다.
## PyKaki의 미리보기도 같은 파일로 그려서, 새 효과는 text_effects.glsl에 한 번만 쓰면 됩니다.
## 적는 법은 text_effects.glsl 맨 위에 있습니다.
################################################################################

init -10 python in say_style:

    ## 셰이더 파일. ui_kit을 다른 폴더에 넣었으면 이름으로 찾습니다
    TFX_FILE = "ui_kit/engine/text_effects.glsl"

    def _tfx_find():
        if store.renpy.loadable(TFX_FILE):
            return TFX_FILE
        for fn in store.renpy.list_files():
            if fn.endswith("/text_effects.glsl"):
                return fn
        raise Exception("[say_style] text_effects.glsl을 찾지 못했습니다. ui_kit/engine 폴더에 같이 넣어 주세요.")

    def tfx_parse(text):
        """text_effects.glsl → 효과 목록. PyKaki src/fx/textShaders.ts의 parseShaders와 같은 규칙입니다."""
        parts = { }
        effects = [ ]
        cur = None
        eff = None
        for raw in text.splitlines():
            s = raw.strip()
            ## 맨 앞에서 시작하는 // 줄은 설명이라 뺍니다 (코드는 들여 씀)
            if raw.startswith("//"):
                continue
            if not s.startswith("@"):
                if cur is not None:
                    cur.append(raw)
                continue
            word, _, rest = s[1:].partition(" ")
            rest = rest.strip()
            if word == "part":
                cur = parts[rest] = [ ]
                eff = None
            elif word == "effect":
                name, _, label = rest.partition(" ")
                eff = { "name": name, "label": label.strip(), "cps": False, "slow": None, "redraw": None,
                        "outlines": [ ], "uniforms": [ ], "code": [ ] }
                effects.append(eff)
                cur = None
            elif eff is None:
                raise Exception("[say_style] text_effects.glsl: @effect 밖의 줄 " + s)
            elif word == "use":
                if cur is None or rest not in parts:
                    raise Exception("[say_style] text_effects.glsl: " + s)
                cur.extend(parts[rest])
            elif word == "cps":
                eff["cps"] = True
            elif word == "slow":
                eff["slow"] = rest
            elif word == "redraw":
                eff["redraw"] = rest
            elif word == "outline":
                size, color, x, y = rest.split()
                eff["outlines"].append((int(size), color, int(x), int(y)))
            elif word == "set":
                k, _, v = rest.partition(" ")
                v = v.strip()
                try:
                    v = float(v)
                except ValueError:
                    pass
                eff["uniforms"].append((k, v))
            elif word == "variables" or word.startswith("vertex_") or word.startswith("fragment_"):
                cur = [ ]
                eff["code"].append((word, cur))
            else:
                raise Exception("[say_style] text_effects.glsl: 모르는 표시 " + s)
        for e in effects:
            e["code"] = [ (k, _tfx_rand("\n".join(v) + "\n")) for k, v in e["code"] ]
        return effects

    ## RAND(1.0) → 글자마다 다른 값(0~1). 글자 번호로 정해져서 볼 때마다 같다
    def _tfx_rand(code):
        import re
        return re.sub(r"RAND\(([^()]*)\)", r"fract(sin(a_text_index * 12.9898 + \1) * 43758.5453)", code)

    ## @slow 식: "u__duration", "u__spread + u__fade", "u__duration + u__lag * 2"
    def _tfx_eval(expr, kw):
        total = 0.0
        for term in expr.split("+"):
            v = 1.0
            for f in term.split("*"):
                f = f.strip()
                v *= float(kw[f]) if f in kw else float(f)
            total += v
        return total

    def _tfx_adjuster(slow, redraw):
        if not slow and (not redraw or redraw == "always"):
            return None
        def adjust(ts, **kw):
            if slow:
                ts.extra_slow_duration = _tfx_eval(slow, kw)
            if redraw and redraw != "always" and float(kw.get(redraw, 0.0)) > 0.0:
                ts.redraw = 0.0
        return adjust

    ## 효과마다 글자 뒤에 깔 외곽선 겹. 대사에 외곽선을 따로 적지 않았을 때 say_style이 넣습니다
    TFX_OUTLINES = { }

    ## 등록한 효과 목록 (편집기 대사 탭의 효과 버튼이 씀)
    TFX_EFFECTS = [ ]

    def _tfx_register():
        with store.renpy.open_file(_tfx_find(), encoding="utf-8") as f:
            effects = tfx_parse(f.read())
        TFX_EFFECTS[:] = effects
        for e in effects:
            kw = dict(e["code"])
            kw.update(e["uniforms"])
            if e["redraw"] == "always":
                kw["redraw"] = 0.0
            store.renpy.register_textshader(e["name"], include_default=False,
                adjust_function=_tfx_adjuster(e["slow"], e["redraw"]), **kw)
            if e["outlines"]:
                TFX_OUTLINES[e["name"]] = e["outlines"]

    _tfx_register()

    ## 색 잔상의 복사본 (외곽선 굵기 0, 색, 가로, 세로). 예전 이름이라 남겨 둡니다
    ECHO_OUTLINES = TFX_OUTLINES.get("echo", [ ])
