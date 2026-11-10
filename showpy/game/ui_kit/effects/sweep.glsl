// sweep: 빛 지나가기: 어둡게 나온 글자 위로 비스듬한 빛 띠가 지나가며 제 밝기가 됨
// u__dim: 빛이 닿기 전 밝기 (0 검정 ~ 1 그대로). u__width: 빛 띠 폭. u__strength: 빛 세기. u__color: 빛 색
@effect sweep 빛 지나가기
@cps
@slow u__duration
@set u__duration 10.0
@set u__dim 0.3
@set u__width 0.4
@set u__strength 0.8
@set u__color #ffffff
@param u__duration 3 30 걸리는 시간
@param u__dim 0 1 닿기 전 밝기
@param u__width 0.1 1 빛 띠 폭
@param u__strength 0 1 빛 세기
@variables
    uniform float u__duration;
    uniform float u__dim;
    uniform float u__width;
    uniform float u__strength;
    uniform vec4 u__color;
    uniform float u_text_slow_duration;
    uniform float u_text_slow_time;
    uniform float u_text_main;
    attribute float a_text_min_time;
    attribute vec4 a_text_pos_rect;
    varying float v_tfx_sweep;
    varying vec2 v_tfx_sweep_q;
@vertex_10
    v_tfx_sweep_q = (gl_Position.xy - a_text_pos_rect.xy) / max(a_text_pos_rect.zw, vec2(0.001));
@vertex_30
@use T
    v_tfx_sweep = l__t;
@fragment_350
    float l__in = clamp(v_tfx_sweep * 6.0, 0.0, 1.0);
    if (u_text_main > 0.5) {
        float l__w = max(u__width, 0.01);
        float l__x = v_tfx_sweep_q.x + (1.0 - v_tfx_sweep_q.y) * 0.35;
        float l__pos = mix(-l__w, 1.35 + l__w, v_tfx_sweep);
        float l__lit = smoothstep(l__x - l__w * 0.5, l__x + l__w * 0.5, l__pos);
        float l__band = (1.0 - smoothstep(0.0, l__w, abs(l__x - l__pos))) * u__strength;
        vec3 l__c = gl_FragColor.rgb * mix(u__dim, 1.0, l__lit);
        l__c = mix(l__c, u__color.rgb * gl_FragColor.a, l__band * u__color.a);
        gl_FragColor = vec4(l__c, gl_FragColor.a) * l__in;
    } else {
        gl_FragColor = gl_FragColor * l__in;
    }
