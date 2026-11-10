// popin: 뿅 튀어나오기: 작은 점에서 커지며 살짝 넘쳤다가 제 크기로
// u__overshoot: 넘치는 정도 (0이면 넘치지 않음). u__from: 처음 크기 (0 = 점, 0.5 = 절반)
@effect popin 뿅 튀어나오기
@cps
@slow u__duration
@set u__duration 6.0
@set u__overshoot 0.35
@set u__from 0.0
@param u__duration 2 20 걸리는 시간
@param u__overshoot 0 1 넘치는 정도
@param u__from 0 0.9 처음 크기
@variables
    uniform float u__duration;
    uniform float u__overshoot;
    uniform float u__from;
    uniform float u_text_slow_duration;
    uniform float u_text_slow_time;
    attribute float a_text_min_time;
    attribute vec2 a_text_center;
    varying float v_tfx_popin;
@vertex_30
@use T
    float l__back = max(u__overshoot, 0.0) * 5.0;
    float l__k = l__t - 1.0;
    float l__e = 1.0 + (l__back + 1.0) * l__k * l__k * l__k + l__back * l__k * l__k;
    float l__scale = mix(u__from, 1.0, l__e);
    float l__ang = 0.0;
@use ROTATE
    v_tfx_popin = l__t;
@fragment_350
    gl_FragColor = gl_FragColor * clamp(v_tfx_popin * 4.0, 0.0, 1.0);
