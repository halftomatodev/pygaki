// spring: 튕기며 자리 잡기: 글자가 아래에서 작게 튀어 올라와 제자리를 조금 지나쳤다가 되돌아오며, 몇 번 작게 흔들린 뒤 멈춤 (용수철처럼)
// u__duration: 걸리는 시간 (글자 수). u__lift: 올라오는 거리 (글자 높이의 몇 배, 0이면 제자리에서)
// u__grow: 작게 시작하는 정도 (0이면 크기 그대로, 1이면 점에서). u__bounce: 지나치는 정도 (0 거의 안 튐 ~ 1 많이 튐)
// u__wobble: 흔들리는 횟수
// 쓰는 법:  e "튕긴다!" (cps=20, effect="spring")      e "크게 튕긴다." (effect="spring:u__bounce=0.9:u__lift=1.2")
@effect spring 튕기며 자리 잡기
@cps
@slow u__duration
@set u__duration 10.0
@set u__lift 0.6
@set u__grow 0.5
@set u__bounce 0.5
@set u__wobble 1.5
@param u__duration 3 30 걸리는 시간
@param u__lift 0 2 올라오는 거리
@param u__grow 0 1 작게 시작
@param u__bounce 0 1 지나치는 정도
@param u__wobble 0.5 4 흔들리는 횟수
@variables
    uniform float u__duration;
    uniform float u__lift;
    uniform float u__grow;
    uniform float u__bounce;
    uniform float u__wobble;
    uniform float u_text_slow_duration;
    uniform float u_text_slow_time;
    attribute float a_text_min_time;
    attribute vec2 a_text_center;
    attribute vec4 a_text_pos_rect;
    varying float v__t;
@vertex_30
@use T
    // 줄어드는 흔들림: 1 - e^(-감쇠 t) cos(2π 횟수 t). 끝(t=1)에서는 딱 제자리
    float l__damp = mix(9.0, 2.5, clamp(u__bounce, 0.0, 1.0));
    float l__e = l__t >= 1.0 ? 1.0 : 1.0 - exp(-l__damp * l__t) * cos(6.2831853 * u__wobble * l__t);
    float l__scale = max(1.0 - u__grow * (1.0 - l__e), 0.0);
    float l__ang = 0.0;
@use ROTATE
    gl_Position.y += a_text_pos_rect.w * u__lift * (1.0 - l__e);
    v__t = l__t;
@fragment_350
    gl_FragColor = gl_FragColor * clamp(v__t * 6.0, 0.0, 1.0);
