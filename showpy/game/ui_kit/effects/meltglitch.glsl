// meltglitch: 녹는 글리치: 신호가 깨진 화면처럼 글자의 밝은 곳이 가는 세로 줄로 아래로 길게 끌려 내려감. 줄 끝은 색이 갈라져 파랑, 하양으로 빛나고 몇 프레임마다 모양이 바뀜
// 렌파이는 글자를 하나씩 네모로 그려서, 글자 네모를 아래로 u__length배만큼 늘려 그 안에서 끌려 내려갑니다 (아랫줄과 겹칠 수 있음).
// u__fade: 글자가 나타나는 시간(글자 수). u__length: 가장 길게 끌린 길이 (글자 높이의 몇 배). u__width: 줄 굵기 (픽셀)
// u__amount: 끌리는 줄의 비율 (0~1). u__split: 색 갈라짐 (0~1). u__glow: 밝은 곳이 더 밝게 타는 정도. u__fps: 1초에 모양이 바뀌는 번
// u__settle: 1이면 다 나온 뒤 멈춤, 0이면 계속 깨짐. u__jump: 가끔 조각이 옆으로 튐 (픽셀)
// 쓰는 법:  e "신호가 녹는다." (cps=25, effect="meltglitch")      e "멈춘다." (cps=25, effect="meltglitch:u__settle=1:u__length=0.6")
@effect meltglitch 녹는 글리치
@cps
@slow u__fade
@redraw always
@set u__fade 4.0
@set u__length 1.2
@set u__width 2.0
@set u__amount 0.55
@set u__split 0.6
@set u__glow 0.8
@set u__fps 12.0
@set u__settle 0.0
@set u__jump 6.0
@param u__fade 0 20 나타나는 시간
@param u__length 0.1 3 끌리는 길이
@param u__width 1 12 줄 굵기
@param u__amount 0 1 끌리는 줄 비율
@param u__split 0 1 색 갈라짐
@param u__glow 0 2 밝게 타기
@param u__fps 1 30 바뀌는 빠르기
@param u__settle 0 1 다 나오면 멈춤
@param u__jump 0 40 옆으로 튐
@variables
    uniform float u__fade;
    uniform float u__length;
    uniform float u__width;
    uniform float u__amount;
    uniform float u__split;
    uniform float u__glow;
    uniform float u__fps;
    uniform float u__settle;
    uniform float u__jump;
    uniform float u_time;
    uniform float u_text_slow_duration;
    uniform float u_text_slow_time;
    uniform float u_text_to_drawable;
    uniform float u_text_main;
    uniform sampler2D tex0;
    uniform vec2 res0;
    attribute float a_text_min_time;
    attribute vec4 a_text_pos_rect;
    attribute float a_text_pseudo_glyph;
    varying vec2 v_tex_coord;
    varying vec2 v__q;
    varying vec4 v__rect;
    varying float v__in;
@vertex_20
    float l__ext = a_text_pseudo_glyph > 0.5 ? 0.0 : a_text_pos_rect.w * max(u__length, 0.0);
    float l__bottom = gl_Position.y > a_text_pos_rect.y + a_text_pos_rect.w * 0.5 ? 1.0 : 0.0;
    gl_Position.y += l__ext * l__bottom;
    v__q = gl_Position.xy - a_text_pos_rect.xy;
    v__rect = a_text_pos_rect;
    float l__fd = u__fade * u_text_slow_duration;
    v__in = l__fd > 0.0 ? clamp((u_text_slow_time - a_text_min_time) / l__fd, 0.0, 1.0) : (a_text_min_time <= u_text_slow_time ? 1.0 : 0.0);
@vertex_250
    v_tex_coord.y += l__ext * l__bottom / max(res0.y, 1.0);
@fragment_350
    float l__h = max(v__rect.w, 1.0);
    float l__amt = mix(1.0, 1.0 - v__in, clamp(u__settle, 0.0, 1.0));
    float l__tick = floor(u_time * max(u__fps, 0.5));
    vec2 l__abs = v__rect.xy + v__q;
    float l__cw = max(u__width * u_text_to_drawable, 1.0);
    float l__col = floor(l__abs.x / l__cw);

    // 가끔 가로 띠가 옆으로 튐
    float l__band = floor(l__abs.y / (6.0 * u_text_to_drawable));
    float l__bj = fract(sin(dot(vec2(l__band, l__tick), vec2(12.9898, 78.233))) * 43758.5453);
    float l__dx = l__bj > 0.9 ? (l__bj - 0.95) * 20.0 * u__jump * u_text_to_drawable * l__amt : 0.0;

    // 줄마다 끌리는 길이 (몇 프레임마다 새로)
    float l__r1 = fract(sin(dot(vec2(l__col, l__tick), vec2(39.346, 11.135))) * 43758.5453);
    float l__r2 = fract(sin(dot(vec2(l__col * 0.37, floor(l__tick / 3.0)), vec2(73.156, 52.235))) * 43758.5453);
    float l__on = step(1.0 - u__amount, l__r1) * l__amt;
    float l__len = l__on * (0.15 + 0.85 * l__r2 * l__r2) * l__h * max(u__length, 0.0);

    // 위쪽 몇 곳을 읽어 가장 진한 것을 남김: 밝은 점이 아래로 끌린 꼬리가 됨 (빨강, 초록, 파랑을 다른 길이로)
    vec3 l__lens = vec3(1.0 - 0.25 * u__split, 1.0, 1.0 + 0.35 * u__split) * l__len;
    vec4 l__acc = vec4(0.0);
    vec3 l__head = vec3(0.0);
    for (int l__k = 0; l__k < 10; l__k++) {
        float l__s = float(l__k) / 9.0;
        float l__fall = 1.0 - l__s * 0.65;
        vec3 l__ys = vec3(v__q.y) - l__lens * l__s;
        float l__xs = v__q.x + l__dx;
        float l__inx = step(0.0, l__xs) * step(l__xs, v__rect.z);
        vec4 l__cr = texture2D(tex0, (v__rect.xy + vec2(l__xs, l__ys.r)) / res0) * step(0.0, l__ys.r) * step(l__ys.r, l__h) * l__inx;
        vec4 l__cg = texture2D(tex0, (v__rect.xy + vec2(l__xs, l__ys.g)) / res0) * step(0.0, l__ys.g) * step(l__ys.g, l__h) * l__inx;
        vec4 l__cb = texture2D(tex0, (v__rect.xy + vec2(l__xs, l__ys.b)) / res0) * step(0.0, l__ys.b) * step(l__ys.b, l__h) * l__inx;
        vec4 l__c = vec4(l__cr.r, l__cg.g, l__cb.b, max(l__cr.a, max(l__cg.a, l__cb.a))) * (l__k == 0 ? 1.0 : l__fall);
        l__acc = max(l__acc, l__c);
        if (l__k > 0) {
            l__head = max(l__head, vec3(l__cr.a, l__cg.a, l__cb.a) * l__fall);
        }
    }

    // 끌린 꼬리는 밝게 타고, 끝은 색이 갈라져 빛남
    float l__body = texture2D(tex0, v_tex_coord).a * step(v__q.y, l__h);
    float l__tail = clamp(l__acc.a - l__body, 0.0, 1.0);
    vec3 l__hot = vec3(0.45, 0.7, 1.0) * l__head.b + vec3(1.0, 0.4, 0.1) * l__head.r * 0.6;
    l__acc.rgb = min(l__acc.rgb + (l__hot * u__split + vec3(0.5)) * l__tail * u__glow * l__amt, vec3(l__acc.a));
    if (u_text_main < 0.5) {
        l__acc = texture2D(tex0, v_tex_coord) * step(v__q.y, l__h);
    }
    gl_FragColor = l__acc * (v__in > 0.0 ? 1.0 : 0.0);
