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
