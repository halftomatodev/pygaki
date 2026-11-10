// tracking: 자간이 좁아지며: 줄 전체가 넓게 벌어진 채 흐리게 나타나 제 간격으로 모임 (줄 통째로 움직임)
// u__spread: 처음에 벌어진 정도 (0.5 = 간격이 1.5배). u__duration: 걸리는 시간(글자 수)
@effect tracking 자간이 좁아지며
@cps
@slow u__duration
@set u__duration 20.0
@set u__spread 0.5
@param u__duration 6 60 걸리는 시간
@param u__spread 0.1 1.5 벌어진 정도
@variables
    uniform float u__duration;
    uniform float u__spread;
    uniform float u_text_slow_duration;
    uniform float u_text_slow_time;
    attribute vec2 a_text_center;
    varying float v_tfx_tracking;
@vertex_30
    float l__dur = u__duration * u_text_slow_duration;
    float l__t = l__dur > 0.0 ? clamp(u_text_slow_time / l__dur, 0.0, 1.0) : 1.0;
    float l__e = 1.0 - pow(1.0 - l__t, 4.0);
    gl_Position.x += a_text_center.x * u__spread * (1.0 - l__e);
    v_tfx_tracking = l__t;
@fragment_350
    gl_FragColor = gl_FragColor * clamp(v_tfx_tracking * 2.5, 0.0, 1.0);
