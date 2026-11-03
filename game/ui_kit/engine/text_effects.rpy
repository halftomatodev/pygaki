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
##
## 값은 콜론으로 바꿀 수 있습니다. (렌파이 텍스트 셰이더 문법)
##     effect="scatter:u__distance=200"      더 멀리서 모임
##     effect="flash:u__color=#ff4081"        번쩍이는 색
##
## 글자가 하나씩 나올 때만 움직입니다. 텍스트 속도가 "즉시"면 cps를 적으세요.
## PyKaki의 플레이 화면과 미리보기도 같은 모양을 흉내 냅니다.
################################################################################

init -10 python in say_style:

    ## 공통: 이 글자가 나오기 시작한 뒤 얼마나 지났는지 (0 → 1)
    _TFX_T = """
    float l__dur = u__duration * u_text_slow_duration;
    float l__t;
    if (l__dur > 0.0) {
        l__t = clamp((u_text_slow_time - a_text_min_time) / l__dur, 0.0, 1.0);
    } else {
        l__t = a_text_min_time <= u_text_slow_time ? 1.0 : 0.0;
    }
    """

    ## 글자마다 다른 값(0~1). 글자 번호로 정해져서 볼 때마다 같다
    def _tfx_rand(seed):
        return "fract(sin(a_text_index * 12.9898 + {}) * 43758.5453)".format(seed)

    ## 글자 중심(밑줄 자리)을 기준으로 l__ang만큼 돌리고 l__scale만큼 키운다
    _TFX_ROTATE = """
    vec2 l__p = (gl_Position.xy - a_text_center) * l__scale;
    float l__c = cos(l__ang);
    float l__s = sin(l__ang);
    gl_Position.xy = a_text_center + vec2(l__p.x * l__c - l__p.y * l__s, l__p.x * l__s + l__p.y * l__c);
    """

    def _tfx_adjust(ts, u__duration, **kwargs):
        ts.extra_slow_duration = u__duration

    def _tfx_adjust_shuffle(ts, u__spread, u__fade, **kwargs):
        ts.extra_slow_duration = u__spread + u__fade

    _TFX_ALPHA = """
    gl_FragColor = gl_FragColor * {};
    """

    store.renpy.register_textshader(
        "scatter",
        include_default=False,
        adjust_function=_tfx_adjust,
        variables="""
        uniform float u__duration;
        uniform float u__distance;
        uniform float u_text_slow_duration;
        uniform float u_text_slow_time;
        uniform float u_text_to_drawable;
        attribute float a_text_min_time;
        attribute float a_text_index;
        attribute vec2 a_text_center;
        varying float v_tfx_scatter;
        """,
        vertex_30=_TFX_T + """
        float l__e = 1.0 - pow(1.0 - l__t, 3.0);
        float l__ang = ({} * 2.0 - 1.0) * 3.14159 * (1.0 - l__e);
        float l__scale = 1.0;
        """.format(_tfx_rand(1.0)) + _TFX_ROTATE + """
        vec2 l__off = vec2({}, {}) * 2.0 - 1.0;
        gl_Position.xy += l__off * u__distance * u_text_to_drawable * (1.0 - l__e);
        v_tfx_scatter = l__t;
        """.format(_tfx_rand(2.0), _tfx_rand(3.0)),
        fragment_350=_TFX_ALPHA.format("clamp(v_tfx_scatter * 3.0, 0.0, 1.0)"),
        u__duration=12.0,
        u__distance=90.0,
        )

    store.renpy.register_textshader(
        "drop",
        include_default=False,
        adjust_function=_tfx_adjust,
        variables="""
        uniform float u__duration;
        uniform float u__height;
        uniform float u_text_slow_duration;
        uniform float u_text_slow_time;
        uniform float u_text_to_drawable;
        attribute float a_text_min_time;
        varying float v_tfx_drop;
        """,
        vertex_30=_TFX_T + """
        float l__k = l__t - 1.0;
        float l__e = 1.0 + 2.70158 * l__k * l__k * l__k + 1.70158 * l__k * l__k;
        gl_Position.y -= u__height * u_text_to_drawable * (1.0 - l__e);
        v_tfx_drop = l__t;
        """,
        fragment_350=_TFX_ALPHA.format("clamp(v_tfx_drop * 4.0, 0.0, 1.0)"),
        u__duration=8.0,
        u__height=40.0,
        )

    store.renpy.register_textshader(
        "spin",
        include_default=False,
        adjust_function=_tfx_adjust,
        variables="""
        uniform float u__duration;
        uniform float u__angle;
        uniform float u_text_slow_duration;
        uniform float u_text_slow_time;
        attribute float a_text_min_time;
        attribute vec2 a_text_center;
        varying float v_tfx_spin;
        """,
        vertex_30=_TFX_T + """
        float l__e = 1.0 - pow(1.0 - l__t, 3.0);
        float l__ang = radians(u__angle) * (1.0 - l__e);
        float l__scale = mix(0.3, 1.0, l__e);
        """ + _TFX_ROTATE + """
        v_tfx_spin = l__t;
        """,
        fragment_350=_TFX_ALPHA.format("clamp(v_tfx_spin * 3.0, 0.0, 1.0)"),
        u__duration=8.0,
        u__angle=-90.0,
        )

    store.renpy.register_textshader(
        "shuffle",
        include_default=False,
        adjust_function=_tfx_adjust_shuffle,
        variables="""
        uniform float u__spread;
        uniform float u__fade;
        uniform float u_text_slow_duration;
        uniform float u_text_slow_time;
        attribute float a_text_min_time;
        attribute float a_text_index;
        varying float v_tfx_shuffle;
        """,
        vertex_30="""
        float l__start = a_text_min_time + {} * u__spread * u_text_slow_duration;
        float l__dur = u__fade * u_text_slow_duration;
        if (l__dur > 0.0) {{
            v_tfx_shuffle = clamp((u_text_slow_time - l__start) / l__dur, 0.0, 1.0);
        }} else {{
            v_tfx_shuffle = a_text_min_time <= u_text_slow_time ? 1.0 : 0.0;
        }}
        """.format(_tfx_rand(4.0)),
        fragment_350=_TFX_ALPHA.format("v_tfx_shuffle"),
        u__spread=10.0,
        u__fade=3.0,
        )

    store.renpy.register_textshader(
        "flash",
        include_default=False,
        adjust_function=_tfx_adjust,
        variables="""
        uniform float u__duration;
        uniform vec4 u__color;
        uniform float u_text_slow_duration;
        uniform float u_text_slow_time;
        attribute float a_text_min_time;
        varying float v_tfx_flash;
        varying float v_tfx_flash_on;
        """,
        vertex_30=_TFX_T + """
        v_tfx_flash = l__t;
        v_tfx_flash_on = a_text_min_time <= u_text_slow_time ? 1.0 : 0.0;
        """,
        fragment_350="""
        float l__e = 1.0 - pow(1.0 - v_tfx_flash, 2.0);
        gl_FragColor.rgb = mix(u__color.rgb * gl_FragColor.a, gl_FragColor.rgb, l__e);
        gl_FragColor = gl_FragColor * v_tfx_flash_on;
        """,
        u__duration=12.0,
        u__color="#ffc400",
        )

    store.renpy.register_textshader(
        "slam",
        include_default=False,
        adjust_function=_tfx_adjust,
        variables="""
        uniform float u__duration;
        uniform float u__zoom;
        uniform float u__shake;
        uniform float u_text_slow_duration;
        uniform float u_text_slow_time;
        uniform float u_text_to_drawable;
        attribute float a_text_min_time;
        attribute float a_text_index;
        attribute vec2 a_text_center;
        varying float v_tfx_slam;
        """,
        vertex_30=_TFX_T + """
        float l__z = clamp(l__t / 0.35, 0.0, 1.0);
        float l__e = 1.0 - pow(1.0 - l__z, 3.0);
        float l__ang = 0.0;
        float l__scale = mix(u__zoom, 1.0, l__e);
        """ + _TFX_ROTATE + """
        float l__amp = l__t > 0.35 && l__t < 1.0 ? (1.0 - l__t) * u__shake : 0.0;
        float l__tick = floor(u_text_slow_time * 30.0);
        vec2 l__j = vec2(fract(sin(a_text_index * 7.31 + l__tick * 12.9898) * 43758.5453),
                         fract(sin(a_text_index * 3.17 + l__tick * 78.233) * 43758.5453)) * 2.0 - 1.0;
        gl_Position.xy += l__j * l__amp * u_text_to_drawable;
        v_tfx_slam = l__z;
        """,
        fragment_350=_TFX_ALPHA.format("clamp(v_tfx_slam * 2.0, 0.0, 1.0)"),
        u__duration=10.0,
        u__zoom=3.0,
        u__shake=6.0,
        )

    ## 커서 타자기: 글자 조각은 줄 높이 전체를 덮고 기준점이 글자의 밑줄 자리라서,
    ## 아직 안 나온 첫 글자의 조각 아래쪽에 밑줄을 그린다
    store.renpy.register_textshader(
        "typecursor",
        include_default=False,
        variables="""
        uniform vec4 u__color;
        uniform float u__offset;
        uniform float u__thick;
        uniform float u_text_slow_duration;
        uniform float u_text_slow_time;
        uniform float u_text_to_drawable;
        uniform float u_text_main;
        attribute float a_text_min_time;
        attribute vec2 a_text_center;
        varying float v_tfx_cur_min;
        varying float v_tfx_cur_y;
        """,
        vertex_10="""
        v_tfx_cur_min = a_text_min_time;
        v_tfx_cur_y = (gl_Position.y - a_text_center.y) / u_text_to_drawable;
        """,
        fragment_350="""
        float l__wait = v_tfx_cur_min - u_text_slow_time;
        float l__next = (l__wait > 0.0 && l__wait <= u_text_slow_duration && u_text_main > 0.5) ? 1.0 : 0.0;
        float l__bar = (v_tfx_cur_y >= u__offset && v_tfx_cur_y <= u__offset + u__thick) ? 1.0 : 0.0;
        if (v_tfx_cur_min <= u_text_slow_time) {
            gl_FragColor = gl_FragColor;
        } else if (l__next * l__bar > 0.5) {
            gl_FragColor = vec4(u__color.rgb * u__color.a, u__color.a);
        } else {
            gl_FragColor = vec4(0.0);
        }
        """,
        u__color="#ffffff",
        u__offset=4.0,
        u__thick=3.0,
        )

    ## ── 시험이 필요했던 효과 (3.6) ──────────────────────────────────────────
    ##   echo     색 잔상: 노랑, 파랑 복사본이 한 박자 늦게 따라와 겹친다
    ##            (복사본은 글자 외곽선 겹으로 그린다. 외곽선을 따로 적지 않으면 say_style이 넣는다)
    ##   glitch   글리치: 글자가 가로로 잘려 어긋나고 색이 갈라졌다가 바로 선다
    ##   glow     빛 번짐: 글자 주변이 흐리게 빛난다
    ##   blurin   흐렸다 또렷해지기: 번진 글자가 선명해지며 나타난다
    ##   wipe     위에서 아래로 그려지기: 글자가 위에서부터 드러난다

    ## 색 잔상의 복사본 (외곽선 굵기 0, 색, 가로, 세로)
    ECHO_OUTLINES = [ (0, "#2a4cff", 0, 0), (0, "#ffc400", 0, 0) ]

    def _tfx_adjust_echo(ts, u__duration, u__lag, **kwargs):
        ts.extra_slow_duration = u__duration + u__lag * 2

    store.renpy.register_textshader(
        "echo",
        include_default=False,
        adjust_function=_tfx_adjust_echo,
        variables="""
        uniform float u__duration;
        uniform float u__lag;
        uniform float u__rise;
        uniform float u_text_slow_duration;
        uniform float u_text_slow_time;
        uniform float u_text_to_drawable;
        uniform float u_text_depth;
        uniform float u_text_main;
        attribute float a_text_min_time;
        varying float v_tfx_echo;
        """,
        vertex_30="""
        float l__lag = u_text_main > 0.5 ? 0.0 : u_text_depth * u__lag;
        float l__dur = u__duration * u_text_slow_duration;
        float l__t;
        if (l__dur > 0.0) {
            l__t = clamp((u_text_slow_time - a_text_min_time - l__lag * u_text_slow_duration) / l__dur, 0.0, 1.0);
        } else {
            l__t = a_text_min_time <= u_text_slow_time ? 1.0 : 0.0;
        }
        float l__e = 1.0 - pow(1.0 - l__t, 3.0);
        gl_Position.y -= u__rise * u_text_to_drawable * (1.0 - l__e);
        if (u_text_main > 0.5) {
            v_tfx_echo = clamp(l__t * 3.0, 0.0, 1.0);
        } else {
            v_tfx_echo = clamp(l__t * 4.0, 0.0, 1.0) * (1.0 - l__t);
        }
        """,
        fragment_350=_TFX_ALPHA.format("v_tfx_echo"),
        u__duration=10.0,
        u__lag=2.0,
        u__rise=30.0,
        )

    store.renpy.register_textshader(
        "glitch",
        include_default=False,
        adjust_function=_tfx_adjust,
        variables="""
        uniform float u__duration;
        uniform float u__shift;
        uniform float u__split;
        uniform float u__band;
        uniform float u_text_slow_duration;
        uniform float u_text_slow_time;
        uniform float u_text_to_drawable;
        uniform float u_text_main;
        uniform sampler2D tex0;
        uniform vec2 res0;
        attribute float a_text_min_time;
        varying vec2 v_tex_coord;
        varying float v_tfx_glitch;
        """,
        vertex_30=_TFX_T + """
        v_tfx_glitch = l__t;
        """,
        fragment_340="""
        float l__amt = 1.0 - v_tfx_glitch;
        if (v_tfx_glitch > 0.0 && l__amt > 0.0 && u_text_main > 0.5) {
            float l__band = floor(gl_FragCoord.y / (u__band * u_text_to_drawable));
            float l__tick = floor(u_text_slow_time * 24.0);
            float l__r = fract(sin(l__band * 12.9898 + l__tick * 78.233) * 43758.5453);
            float l__dx = (l__r > 0.55 ? (l__r - 0.775) * 2.0 * u__shift : 0.0) * l__amt * u_text_to_drawable;
            vec2 l__o = vec2(l__dx, 0.0) / res0;
            vec2 l__s = vec2(u__split * l__amt * u_text_to_drawable, 0.0) / res0;
            vec4 l__c = texture2D(tex0, v_tex_coord + l__o);
            float l__ar = texture2D(tex0, v_tex_coord + l__o + l__s).a;
            float l__ab = texture2D(tex0, v_tex_coord + l__o - l__s).a;
            gl_FragColor = vec4(max(l__c.r, l__ar), l__c.g, max(l__c.b, l__ab), max(l__c.a, max(l__ar, l__ab)));
        }
        """,
        fragment_350=_TFX_ALPHA.format("(v_tfx_glitch > 0.0 ? 1.0 : 0.0)"),
        u__duration=10.0,
        u__shift=14.0,
        u__split=3.0,
        u__band=5.0,
        )

    store.renpy.register_textshader(
        "glow",
        include_default=False,
        adjust_function=_tfx_adjust,
        variables="""
        uniform float u__duration;
        uniform float u__radius;
        uniform float u__strength;
        uniform vec4 u__color;
        uniform float u_text_slow_duration;
        uniform float u_text_slow_time;
        uniform float u_text_to_drawable;
        uniform float u_text_main;
        uniform sampler2D tex0;
        uniform vec2 res0;
        attribute float a_text_min_time;
        varying vec2 v_tex_coord;
        varying float v_tfx_glow;
        """,
        vertex_30=_TFX_T + """
        v_tfx_glow = l__t;
        """,
        fragment_340="""
        if (u_text_main > 0.5) {
            float l__h = 0.0;
            for (int l__i = 0; l__i < 12; l__i++) {
                float l__ang = float(l__i) * 0.5236;
                vec2 l__d = vec2(cos(l__ang), sin(l__ang)) * u__radius * u_text_to_drawable / res0;
                l__h += texture2D(tex0, v_tex_coord + l__d).a + texture2D(tex0, v_tex_coord + l__d * 0.5).a;
            }
            l__h = clamp(l__h / 24.0 * u__strength, 0.0, 1.0);
            vec4 l__g = vec4(u__color.rgb, 1.0) * u__color.a * l__h;
            gl_FragColor = gl_FragColor + l__g * (1.0 - gl_FragColor.a);
        }
        """,
        fragment_350=_TFX_ALPHA.format("clamp(v_tfx_glow * 2.0, 0.0, 1.0)"),
        u__duration=10.0,
        u__radius=8.0,
        u__strength=1.6,
        u__color="#ffffff",
        )

    store.renpy.register_textshader(
        "blurin",
        include_default=False,
        adjust_function=_tfx_adjust,
        variables="""
        uniform float u__duration;
        uniform float u__radius;
        uniform float u_text_slow_duration;
        uniform float u_text_slow_time;
        uniform float u_text_to_drawable;
        uniform float u_text_main;
        uniform sampler2D tex0;
        uniform vec2 res0;
        attribute float a_text_min_time;
        varying vec2 v_tex_coord;
        varying float v_tfx_blur;
        """,
        vertex_30=_TFX_T + """
        v_tfx_blur = l__t;
        """,
        fragment_340="""
        float l__e = 1.0 - pow(1.0 - v_tfx_blur, 2.0);
        float l__r = u__radius * (1.0 - l__e) * u_text_to_drawable;
        if (l__r > 0.01) {
            vec4 l__sum = vec4(0.0);
            for (int l__x = -2; l__x <= 2; l__x++) {
                for (int l__y = -2; l__y <= 2; l__y++) {
                    l__sum += texture2D(tex0, v_tex_coord + vec2(float(l__x), float(l__y)) * l__r * 0.5 / res0);
                }
            }
            gl_FragColor = l__sum / 25.0;
        }
        """,
        fragment_350=_TFX_ALPHA.format("clamp(v_tfx_blur * 2.0, 0.0, 1.0)"),
        u__duration=12.0,
        u__radius=8.0,
        )

    store.renpy.register_textshader(
        "wipe",
        include_default=False,
        adjust_function=_tfx_adjust,
        variables="""
        uniform float u__duration;
        uniform float u__span;
        uniform float u_text_slow_duration;
        uniform float u_text_slow_time;
        uniform float u_text_to_drawable;
        attribute float a_text_min_time;
        attribute vec2 a_text_center;
        varying float v_tfx_wipe;
        varying float v_tfx_wipe_y;
        """,
        vertex_10="""
        v_tfx_wipe_y = (gl_Position.y - a_text_center.y) / u_text_to_drawable;
        """,
        vertex_30=_TFX_T + """
        v_tfx_wipe = l__t;
        """,
        fragment_350="""
        float l__edge = mix(-u__span, u__span * 0.35, v_tfx_wipe);
        float l__show = v_tfx_wipe >= 1.0 ? 1.0 : clamp((l__edge - v_tfx_wipe_y) / 3.0, 0.0, 1.0);
        gl_FragColor = gl_FragColor * l__show * (v_tfx_wipe > 0.0 ? 1.0 : 0.0);
        """,
        u__duration=8.0,
        u__span=40.0,
        )

    ## ── 블록 글리치 (3.7) ───────────────────────────────────────────────────
    ##   blockglitch  화면을 네모 칸으로 나눠, 칸마다 무작위로 밀리거나 옆으로 늘어나거나
    ##                색이 바뀌었다가 선다. 디지털 글리치(데이터 글리치)의 블록 깨짐.
    ##     effect="blockglitch:u__hold=0.3"   다 나온 뒤에도 30% 세기로 계속 깨짐
    ##     effect="blockglitch:u__block=20"   칸 크기 (기본 12픽셀)

    def _tfx_adjust_block(ts, u__duration, u__hold, **kwargs):
        ts.extra_slow_duration = u__duration
        if u__hold > 0.0:
            ts.redraw = 0.0

    store.renpy.register_textshader(
        "blockglitch",
        include_default=False,
        adjust_function=_tfx_adjust_block,
        variables="""
        uniform float u__duration;
        uniform float u__block;
        uniform float u__shift;
        uniform float u__rate;
        uniform float u__hold;
        uniform float u_text_slow_duration;
        uniform float u_text_slow_time;
        uniform float u_text_to_drawable;
        uniform float u_text_main;
        uniform float u_time;
        uniform sampler2D tex0;
        uniform vec2 res0;
        attribute float a_text_min_time;
        varying vec2 v_tex_coord;
        varying float v_tfx_block;
        """,
        vertex_30=_TFX_T + """
        v_tfx_block = l__t;
        """,
        fragment_340="""
        float l__amt = max(1.0 - v_tfx_block, u__hold);
        if (v_tfx_block > 0.0 && l__amt > 0.0 && u_text_main > 0.5) {
            float l__size = u__block * u_text_to_drawable;
            vec2 l__cell = floor(gl_FragCoord.xy / l__size);
            float l__tick = floor(u_time * u__rate);
            float l__r1 = fract(sin(dot(l__cell + l__tick, vec2(12.9898, 78.233))) * 43758.5453);
            float l__r2 = fract(sin(dot(l__cell + l__tick, vec2(39.346, 11.135))) * 43758.5453);
            float l__r3 = fract(sin(dot(l__cell + l__tick, vec2(73.156, 52.235))) * 43758.5453);
            vec2 l__uv = v_tex_coord;
            float l__hit = l__r1 > 1.0 - 0.5 * l__amt ? 1.0 : 0.0;
            if (l__hit > 0.5) {
                if (l__r2 < 0.5) {
                    // 칸째로 밀기
                    vec2 l__d = vec2((l__r3 - 0.5) * 2.0, (l__r2 - 0.25) * 2.0) * u__shift * u_text_to_drawable;
                    l__uv += l__d / res0;
                } else {
                    // 칸의 왼쪽 한 줄을 옆으로 늘이기
                    float l__x0 = l__cell.x * l__size;
                    l__uv.x -= (gl_FragCoord.x - l__x0) / res0.x;
                }
            }
            vec4 l__c = texture2D(tex0, l__uv);
            if (l__hit > 0.5 && l__r3 > 0.55) {
                // 컬러 바처럼 칸의 색을 바꾼다
                vec3 l__hue = clamp(abs(fract(l__r2 + vec3(0.0, 2.0 / 3.0, 1.0 / 3.0)) * 6.0 - 3.0) - 1.0, 0.0, 1.0);
                l__c.rgb = mix(l__c.rgb, l__hue * l__c.a, 0.85);
            }
            gl_FragColor = l__c;
        }
        """,
        fragment_350=_TFX_ALPHA.format("(v_tfx_block > 0.0 ? 1.0 : 0.0)"),
        u__duration=12.0,
        u__block=12.0,
        u__shift=10.0,
        u__rate=14.0,
        u__hold=0.0,
        )

    ## ── 녹아내림, 데이터모싱 흉내, 일렁임 (3.8) ──────────────────────────────
    ##   melt    녹아내림: 세로 줄마다 다른 길이로 색이 흘러내렸다가 모여 글자가 된다
    ##   mosh    데이터모싱 흉내: 네모 칸이 제각각 한쪽으로 끌리며 번졌다가 돌아온다
    ##   liquid  일렁임: 물에 비친 것처럼 계속 출렁인다 (한 번에 나와도 보임)
    ## melt, mosh는 u__hold를 주면 다 나온 뒤에도 계속 녹거나 번진다.
    ## 렌파이는 글자마다 줄 높이만큼의 칸에만 그려서, 아래 줄까지 길게 흐르지는 않는다.

    def _tfx_adjust_hold(ts, u__duration, u__hold, **kwargs):
        ts.extra_slow_duration = u__duration
        if u__hold > 0.0:
            ts.redraw = 0.0

    ## 흘러내린 방향(l__dir, 텍스처 좌표)으로 여러 점을 보고 가장 진한 색을 고른다. 끌린 자국이 생긴다
    _TFX_STREAK = """
            vec4 l__best = texture2D(tex0, l__uv);
            for (int l__k = 1; l__k <= 10; l__k++) {
                vec4 l__s = texture2D(tex0, l__uv - l__dir * float(l__k) / 10.0);
                l__best = l__s.a > l__best.a ? mix(l__s, l__best, float(l__k) / 14.0) : l__best;
            }
            gl_FragColor = l__best;
    """

    store.renpy.register_textshader(
        "melt",
        include_default=False,
        adjust_function=_tfx_adjust_hold,
        variables="""
        uniform float u__duration;
        uniform float u__length;
        uniform float u__width;
        uniform float u__hold;
        uniform float u_text_slow_duration;
        uniform float u_text_slow_time;
        uniform float u_text_to_drawable;
        uniform float u_text_main;
        uniform float u_time;
        uniform sampler2D tex0;
        uniform vec2 res0;
        attribute float a_text_min_time;
        varying vec2 v_tex_coord;
        varying float v_tfx_melt;
        """,
        vertex_30=_TFX_T + """
        v_tfx_melt = l__t;
        """,
        fragment_340="""
        if (v_tfx_melt > 0.0 && u_text_main > 0.5) {
            float l__e = 1.0 - pow(1.0 - v_tfx_melt, 2.0);
            float l__x = gl_FragCoord.x / (u__width * u_text_to_drawable);
            float l__i = floor(l__x);
            float l__a = fract(sin(l__i * 12.9898) * 43758.5453);
            float l__b = fract(sin((l__i + 1.0) * 12.9898) * 43758.5453);
            float l__n = mix(l__a, l__b, smoothstep(0.0, 1.0, fract(l__x)));
            float l__wave = 0.5 + 0.5 * sin(u_time * 1.7 + l__i * 2.3);
            float l__amt = max(1.0 - l__e, u__hold * l__wave);
            float l__drip = u__length * u_text_to_drawable * l__n * l__n * l__amt;
            vec2 l__uv = v_tex_coord;
            vec2 l__dir = vec2(0.0, l__drip) / res0;
            """ + _TFX_STREAK + """
        }
        """,
        fragment_350=_TFX_ALPHA.format("(v_tfx_melt > 0.0 ? 1.0 : 0.0)"),
        u__duration=14.0,
        u__length=28.0,
        u__width=3.0,
        u__hold=0.0,
        )

    store.renpy.register_textshader(
        "mosh",
        include_default=False,
        adjust_function=_tfx_adjust_hold,
        variables="""
        uniform float u__duration;
        uniform float u__block;
        uniform float u__length;
        uniform float u__rate;
        uniform float u__hold;
        uniform float u_text_slow_duration;
        uniform float u_text_slow_time;
        uniform float u_text_to_drawable;
        uniform float u_text_main;
        uniform float u_time;
        uniform sampler2D tex0;
        uniform vec2 res0;
        attribute float a_text_min_time;
        varying vec2 v_tex_coord;
        varying float v_tfx_mosh;
        """,
        vertex_30=_TFX_T + """
        v_tfx_mosh = l__t;
        """,
        fragment_340="""
        float l__amt = max(1.0 - v_tfx_mosh, u__hold);
        if (v_tfx_mosh > 0.0 && l__amt > 0.0 && u_text_main > 0.5) {
            vec2 l__cell = floor(gl_FragCoord.xy / (u__block * u_text_to_drawable));
            float l__tick = floor(u_time * u__rate);
            float l__r1 = fract(sin(dot(l__cell + l__tick, vec2(12.9898, 78.233))) * 43758.5453);
            float l__r2 = fract(sin(dot(l__cell + l__tick, vec2(39.346, 11.135))) * 43758.5453);
            float l__r3 = fract(sin(dot(l__cell + l__tick, vec2(73.156, 52.235))) * 43758.5453);
            vec2 l__uv = v_tex_coord;
            vec2 l__dir = vec2(0.0);
            if (l__r1 > 1.0 - 0.6 * l__amt) {
                // 칸마다 흐르는 방향. 아래쪽으로 조금 더 흐르게
                vec2 l__v = normalize(vec2(l__r2 - 0.5, l__r3 - 0.2) + 0.001);
                l__dir = l__v * u__length * u_text_to_drawable * l__amt / res0;
                l__uv -= l__dir * 0.5;
            }
            """ + _TFX_STREAK + """
        }
        """,
        fragment_350=_TFX_ALPHA.format("(v_tfx_mosh > 0.0 ? 1.0 : 0.0)"),
        u__duration=14.0,
        u__block=16.0,
        u__length=24.0,
        u__rate=5.0,
        u__hold=0.0,
        )

    store.renpy.register_textshader(
        "liquid",
        include_default=False,
        redraw=0.0,
        variables="""
        uniform float u__amplitude;
        uniform float u__wavelength;
        uniform float u__speed;
        uniform float u_text_to_drawable;
        uniform float u_text_main;
        uniform float u_time;
        uniform float u_text_slow_time;
        uniform sampler2D tex0;
        uniform vec2 res0;
        attribute float a_text_min_time;
        varying vec2 v_tex_coord;
        varying float v_tfx_liquid_min;
        """,
        vertex_30="""
        v_tfx_liquid_min = a_text_min_time;
        """,
        fragment_340="""
        if (u_text_main > 0.5) {
            vec2 l__p = gl_FragCoord.xy / (u__wavelength * u_text_to_drawable);
            vec2 l__o = vec2(sin(l__p.y * 6.2832 + u_time * u__speed), cos(l__p.x * 6.2832 + u_time * u__speed * 1.3));
            gl_FragColor = texture2D(tex0, v_tex_coord + l__o * u__amplitude * u_text_to_drawable / res0);
        }
        """,
        fragment_350=_TFX_ALPHA.format("(v_tfx_liquid_min <= u_text_slow_time ? 1.0 : 0.0)"),
        u__amplitude=2.0,
        u__wavelength=24.0,
        u__speed=2.5,
        )

    ## ── VHS 노이즈 (3.9) ────────────────────────────────────────────────────
    ##   vhs     지직거리는 VHS 화면: 주사선, 가로 띠 찢김, 빨강/파랑 어긋남,
    ##           순간적인 색조 바뀜(노랑, 빨강, 파랑, 초록, 흑백), 지글거리는 노이즈.
    ##           다 나온 뒤에도 계속 지직거린다. 한 번에 나와도 보인다.
    ##     effect="vhs:u__tear=0.6"      띠 찢김을 더 자주 (기본 0.3)
    ##     effect="vhs:u__tint=0.0"      색조 바뀜 끄기 (기본 0.35)

    store.renpy.register_textshader(
        "vhs",
        include_default=False,
        redraw=0.0,
        variables="""
        uniform float u__band;
        uniform float u__tear;
        uniform float u__shift;
        uniform float u__split;
        uniform float u__scan;
        uniform float u__tint;
        uniform float u__noise;
        uniform float u__rate;
        uniform float u_text_slow_time;
        uniform float u_text_to_drawable;
        uniform float u_text_main;
        uniform float u_time;
        uniform sampler2D tex0;
        uniform vec2 res0;
        attribute float a_text_min_time;
        varying vec2 v_tex_coord;
        varying float v_tfx_vhs_min;
        """,
        vertex_30="""
        v_tfx_vhs_min = a_text_min_time;
        """,
        fragment_340="""
        if (u_text_main > 0.5) {
            float l__td = u_text_to_drawable;
            float l__tick = floor(u_time * u__rate);

            // 가로 띠 찢김: 띠마다 가끔 옆으로 크게 밀린다
            float l__band = floor(gl_FragCoord.y / (u__band * l__td));
            float l__rb = fract(sin(l__band * 12.9898 + l__tick * 78.233) * 43758.5453);
            float l__dx = l__rb > 1.0 - u__tear ? (fract(l__rb * 91.7) - 0.5) * 2.0 * u__shift : 0.0;
            // 화면 전체가 살짝 흔들림
            l__dx += (fract(sin(l__tick * 3.71) * 43758.5453) - 0.5) * 1.5;
            vec2 l__uv = v_tex_coord + vec2(l__dx * l__td, 0.0) / res0;

            // 빨강, 파랑 어긋남 (박자마다 세기가 바뀜)
            float l__sp = u__split * (0.5 + fract(sin(l__tick * 7.13) * 43758.5453)) * l__td;
            vec4 l__c = texture2D(tex0, l__uv);
            float l__ar = texture2D(tex0, l__uv + vec2(l__sp, 0.0) / res0).a;
            float l__ab = texture2D(tex0, l__uv - vec2(l__sp, 0.0) / res0).a;
            float l__a = max(l__c.a, max(l__ar, l__ab));
            vec3 l__rgb = vec3(max(l__c.r, l__ar * 0.95), l__c.g, max(l__c.b, l__ab * 0.95));

            // 순간적인 색조 바뀜
            float l__rt = fract(sin(l__tick * 5.17) * 43758.5453);
            if (l__rt < u__tint) {
                float l__pick = floor(fract(l__rt * 37.3) * 5.0);
                vec3 l__tone = l__pick < 1.0 ? vec3(1.0, 0.85, 0.35) : l__pick < 2.0 ? vec3(1.0, 0.4, 0.4) : l__pick < 3.0 ? vec3(0.45, 0.6, 1.0) : l__pick < 4.0 ? vec3(0.55, 1.0, 0.45) : vec3(0.75);
                float l__g = dot(l__rgb, vec3(0.3, 0.59, 0.11));
                l__rgb = l__pick < 4.0 ? mix(l__rgb, l__g * l__tone * 1.3, 0.7) : vec3(l__g);
            }

            // 주사선: 가로 두 줄마다 한 줄을 어둡게
            float l__line = mod(floor(gl_FragCoord.y / l__td), 2.0);
            l__rgb *= 1.0 - u__scan * l__line;

            // 지글거리는 노이즈와 밝기 떨림
            float l__n = fract(sin(dot(floor(gl_FragCoord.xy / l__td) + l__tick, vec2(12.9898, 78.233))) * 43758.5453);
            l__rgb += (l__n - 0.5) * u__noise * l__a;
            l__rgb *= 0.9 + 0.2 * fract(sin(l__tick * 9.31) * 43758.5453);

            gl_FragColor = vec4(clamp(l__rgb, 0.0, 1.0) * l__a, l__a);
        }
        """,
        fragment_350=_TFX_ALPHA.format("(v_tfx_vhs_min <= u_text_slow_time ? 1.0 : 0.0)"),
        u__band=6.0,
        u__tear=0.3,
        u__shift=8.0,
        u__split=2.0,
        u__scan=0.45,
        u__tint=0.35,
        u__noise=0.35,
        u__rate=12.0,
        )

    ## ── 떠오르기, 기울며 들어오기, 늘어나며 들어오기 (3.10) ─────────────────
    ##   rise     떠오르기: 글자마다 다른 깊이에서 떠올라 제자리에 맞춰짐
    ##   lean     기울며 들어오기: 크게 기운 채 옆에서 들어와 바로 섬
    ##   stretch  늘어나며 들어오기: 세로로 길게 늘어났다가 원래 비율로
    ##            (effect="stretch:u__x=2.5:u__y=1.0"이면 가로로 늘어남)

    store.renpy.register_textshader(
        "rise",
        include_default=False,
        adjust_function=_tfx_adjust,
        variables="""
        uniform float u__duration;
        uniform float u__depth;
        uniform float u_text_slow_duration;
        uniform float u_text_slow_time;
        uniform float u_text_to_drawable;
        attribute float a_text_min_time;
        attribute float a_text_index;
        varying float v_tfx_rise;
        """,
        vertex_30=_TFX_T + """
        float l__e = 1.0 - pow(1.0 - l__t, 3.0);
        float l__d = 0.4 + 0.8 * {};
        gl_Position.y += u__depth * l__d * u_text_to_drawable * (1.0 - l__e);
        v_tfx_rise = l__t;
        """.format(_tfx_rand(5.0)),
        fragment_350=_TFX_ALPHA.format("clamp(v_tfx_rise * 2.0, 0.0, 1.0)"),
        u__duration=10.0,
        u__depth=40.0,
        )

    store.renpy.register_textshader(
        "lean",
        include_default=False,
        adjust_function=_tfx_adjust,
        variables="""
        uniform float u__duration;
        uniform float u__angle;
        uniform float u__slide;
        uniform float u_text_slow_duration;
        uniform float u_text_slow_time;
        uniform float u_text_to_drawable;
        attribute float a_text_min_time;
        attribute vec2 a_text_center;
        varying float v_tfx_lean;
        """,
        vertex_30=_TFX_T + """
        float l__e = 1.0 - pow(1.0 - l__t, 3.0);
        float l__k = tan(radians(u__angle)) * (1.0 - l__e);
        gl_Position.x += (a_text_center.y - gl_Position.y) * l__k - u__slide * u_text_to_drawable * (1.0 - l__e);
        v_tfx_lean = l__t;
        """,
        fragment_350=_TFX_ALPHA.format("clamp(v_tfx_lean * 3.0, 0.0, 1.0)"),
        u__duration=8.0,
        u__angle=35.0,
        u__slide=20.0,
        )

    store.renpy.register_textshader(
        "stretch",
        include_default=False,
        adjust_function=_tfx_adjust,
        variables="""
        uniform float u__duration;
        uniform float u__x;
        uniform float u__y;
        uniform float u_text_slow_duration;
        uniform float u_text_slow_time;
        attribute float a_text_min_time;
        attribute vec2 a_text_center;
        varying float v_tfx_stretch;
        """,
        vertex_30=_TFX_T + """
        float l__e = 1.0 - pow(1.0 - l__t, 3.0);
        vec2 l__s = mix(vec2(u__x, u__y), vec2(1.0), l__e);
        gl_Position.xy = a_text_center + (gl_Position.xy - a_text_center) * l__s;
        v_tfx_stretch = l__t;
        """,
        fragment_350=_TFX_ALPHA.format("clamp(v_tfx_stretch * 3.0, 0.0, 1.0)"),
        u__duration=8.0,
        u__x=0.6,
        u__y=2.6,
        )
