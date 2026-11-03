// 렌파이에 들어 있는 등장 효과 (렌파이 8.5.3 renpy/common/00textshader_ren.py를 같은 형식으로 옮김)
// PyKaki 미리보기만 씁니다. 렌파이에는 이미 들어 있어서 showpy에는 없습니다.
// Copyright 2004-2026 Tom Rothamel. MIT 라이선스 (licenses 폴더 참고)
// 적는 법은 text_effects.glsl 맨 위와 같습니다.

@effect dissolve 서서히
@cps
@slow u__duration
@set u__duration 10.0
@variables
    uniform float u__duration;
    uniform float u_text_slow_duration;
    uniform float u_text_slow_time;
    attribute float a_text_time;
    varying float v_text_time;
@vertex_200
    v_text_time = a_text_time;
@fragment_350
    float l__duration = u__duration * u_text_slow_duration;
    float l__done;
    if (l__duration > 0.0) {
        l__done = clamp((u_text_slow_time - v_text_time) / l__duration, 0.0, 1.0);
    } else {
        l__done = v_text_time <= u_text_slow_time ? 1.0 : 0.0;
    }
    gl_FragColor = gl_FragColor * l__done;

@effect typewriter 타자기
@cps
@variables
    uniform float u_text_slow_time;
    attribute float a_text_min_time;
    varying float v_text_min_time;
@vertex_200
    v_text_min_time = a_text_min_time;
@fragment_350
    float l__done = v_text_min_time <= u_text_slow_time ? 1.0 : 0.0;
    gl_FragColor = gl_FragColor * l__done;

// slowalpha는 다른 효과와 함께 쓰라고 만든 것이라, 혼자 쓰면 글자가 처음부터 다 보입니다 (렌파이도 같음)
@effect slowalpha 흐리게 대기
@cps
@set u__alpha 0.2
@variables
    uniform float u__alpha
@fragment_325
    vec4 l__color = gl_FragColor;
@fragment_375
    gl_FragColor = mix(gl_FragColor, l__color, u__alpha);

@effect flip 뒤집히며
@cps
@slow u__duration
@set u__duration 10.0
@variables
    uniform float u__duration;
    uniform float u_text_slow_duration;
    uniform float u_text_slow_time;
    attribute vec2 a_text_center;
    attribute float a_text_min_time;
@vertex_20
    float l__duration = u__duration * u_text_slow_duration;
    float l__done;

    if (l__duration > 0.0) {
        l__done = clamp((u_text_slow_time - a_text_min_time) / l__duration, 0.0, 1.0);
    } else {
        l__done = a_text_min_time <= u_text_slow_time ? 1.0 : 0.0;
    }

    gl_Position.x = mix(a_text_center.x - (gl_Position.x - a_text_center.x), gl_Position.x, l__done);

@effect zoom 커지며
@cps
@slow u__duration
@set u__zoom 0.0
@set u__duration 10.0
@variables
    uniform float u__zoom;
    uniform float u__duration;
    uniform float u_text_slow_duration;
    uniform float u_text_slow_time;
    attribute vec2 a_text_center;
    attribute float a_text_min_time;
@vertex_25
    float l__duration = u__duration * u_text_slow_duration;

    if (l__duration > 0.0) {
        float l__done = clamp((u_text_slow_time - a_text_min_time) / l__duration, 0.0, 1.0);
        gl_Position.xy = mix(a_text_center + (gl_Position.xy - a_text_center) * u__zoom, gl_Position.xy, l__done);
    }

@effect jitter 떨림
@redraw always
@set u__jitter (3.0, 3.0)
@variables
    uniform vec2 u__jitter;
    uniform vec4 u_random;
    uniform float u_text_to_drawable;
@vertex_30
    vec2 l__jitter = u__jitter * u_text_to_drawable;
    gl_Position.xy += l__jitter * u_random.xy - l__jitter / 2.0;

@effect wave 물결
@redraw always
@set u__amplitude 5.0
@set u__frequency 2.0
@set u__wavelength 20.0
@variables
    uniform float u__amplitude;
    uniform float u__frequency
    uniform float u__wavelength;

    uniform float u_time;
    uniform float u_text_to_drawable;
    attribute float a_text_index;
@vertex_40
    gl_Position.y += cos(2.0 * 3.14159265359 * (a_text_index / u__wavelength + u_time * u__frequency)) * u__amplitude * u_text_to_drawable;
