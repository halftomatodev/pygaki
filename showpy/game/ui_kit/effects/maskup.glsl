// maskup: 아래에서 올라오기: 보이지 않는 선 아래에 숨어 있다가 글자가 위로 올라옴
// u__duration: 걸리는 시간(글자 수). u__distance: 올라오는 거리(글자 높이의 몇 배)
@effect maskup 아래에서 올라오기
@cps
@slow u__duration
@set u__duration 8.0
@set u__distance 1.0
@param u__duration 2 24 걸리는 시간
@param u__distance 0.3 2 올라오는 거리
@variables
    uniform float u__duration;
    uniform float u__distance;
    uniform float u_text_slow_duration;
    uniform float u_text_slow_time;
    attribute float a_text_min_time;
    attribute vec4 a_text_pos_rect;
    varying float v_tfx_maskup;
    varying float v_tfx_maskup_y;
@vertex_30
@use T
    float l__e = 1.0 - pow(1.0 - l__t, 3.0);
    gl_Position.y += a_text_pos_rect.w * u__distance * (1.0 - l__e);
    v_tfx_maskup_y = gl_Position.y - (a_text_pos_rect.y + a_text_pos_rect.w);
    v_tfx_maskup = l__t;
@fragment_350
    gl_FragColor = gl_FragColor * (v_tfx_maskup > 0.0 ? 1.0 : 0.0) * (1.0 - clamp(v_tfx_maskup_y + 0.5, 0.0, 1.0));
