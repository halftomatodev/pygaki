// scramble: 글자 해독: 글자 자리에 흐린 무작위 기호(점 격자)가 빠르게 바뀌며 돌다가, 왼쪽부터 차례로 제 글자로 자리 잡음 (해커 화면, 매트릭스 글자처럼)
// 기호는 셰이더가 그리는 점 격자라 실제 글자가 아닙니다. 빈칸 자리는 비워 둡니다.
// u__lead: 제 차례보다 몇 글자 먼저 기호로 나타나는지 (크게 하면 줄 전체가 처음부터 돎). u__churn: 제 차례가 지나고도 더 도는 시간 (글자 수)
// u__fps: 기호가 1초에 바뀌는 번. u__dim: 도는 기호의 진하기 (0~1). u__density: 격자에서 켜지는 점의 비율
// u__cols, u__rows: 격자 칸 수. u__tint: 도는 기호를 u__color로 칠하는 정도 (0이면 글자 색 그대로)
// 쓰는 법:  e "접속을 확인합니다." (cps=20, effect="scramble")      e "ACCESS GRANTED" (cps=15, effect="scramble:u__lead=30:u__tint=1")
@effect scramble 글자 해독
@cps
@slow u__churn
@set u__lead 6.0
@set u__churn 3.0
@set u__fps 18.0
@set u__dim 0.55
@set u__density 0.45
@set u__cols 5.0
@set u__rows 7.0
@set u__tint 0.0
@set u__color #5cff9d
@param u__lead 0 40 먼저 도는 글자 수
@param u__churn 0 20 더 도는 시간
@param u__fps 1 60 바뀌는 빠르기
@param u__dim 0 1 기호 진하기
@param u__density 0.1 0.9 점 비율
@param u__cols 2 10 격자 가로 칸
@param u__rows 2 12 격자 세로 칸
@param u__tint 0 1 기호 색 칠하기
@variables
    uniform float u__lead;
    uniform float u__churn;
    uniform float u__fps;
    uniform float u__dim;
    uniform float u__density;
    uniform float u__cols;
    uniform float u__rows;
    uniform float u__tint;
    uniform vec4 u__color;
    uniform float u_text_slow_duration;
    uniform float u_text_slow_time;
    uniform float u_text_main;
    uniform sampler2D tex0;
    uniform vec2 res0;
    attribute float a_text_min_time;
    attribute float a_text_index;
    attribute vec4 a_text_pos_rect;
    varying vec2 v__q;
    varying vec4 v__rect;
    varying float v__state;
    varying float v__tick;
    varying float v__id;
@vertex_20
    v__q = gl_Position.xy - a_text_pos_rect.xy;
    v__rect = a_text_pos_rect;
    v__id = a_text_index;
    // v__state: 0 아직 안 보임, 0~1 기호로 도는 중(나타나는 정도), 2 제 글자
    float l__cd = u_text_slow_duration;
    float l__now = u_text_slow_time;
    if (l__cd <= 0.0) {
        v__state = a_text_min_time <= l__now ? 2.0 : 0.0;
    } else {
        float l__show = a_text_min_time - max(u__lead, 0.0) * l__cd;
        float l__lock = a_text_min_time + max(u__churn, 0.0) * l__cd;
        if (l__now >= l__lock) {
            v__state = 2.0;
        } else if (l__now < l__show) {
            v__state = 0.0;
        } else {
            v__state = clamp((l__now - l__show) / max(l__cd * 1.5, 0.0001), 0.05, 1.0);
        }
    }
    v__tick = floor(l__now * max(u__fps, 1.0));
@fragment_350
    if (v__state < 1.5) {
        // 이 글자 그림에서 가장 진한 곳의 색을 기호 색으로 (빈칸이면 아무것도 안 그림)
        vec4 l__ink = vec4(0.0);
        // 가는 글자(-, .)도 찾도록 세로로 촘촘히
        for (int l__i = 0; l__i < 5; l__i++) {
            for (int l__j = 0; l__j < 12; l__j++) {
                vec2 l__p = v__rect.xy + v__rect.zw * vec2((float(l__i) + 0.5) / 5.0, (float(l__j) + 0.5) / 12.0);
                vec4 l__s = texture2D(tex0, l__p / res0);
                if (l__s.a > l__ink.a) {
                    l__ink = l__s;
                }
            }
        }
        vec3 l__col = l__ink.a > 0.0 ? l__ink.rgb / l__ink.a : vec3(1.0);
        l__col = mix(l__col, u__color.rgb, clamp(u__tint, 0.0, 1.0));

        // 글자 네모 안쪽에 점 격자를 그림. 점마다 켜지는지는 글자 번호와 지금 순간으로 정함
        // 칸 크기는 글자 높이로 정해서 좁은 글자(i, l)와 넓은 글자의 기호가 같은 크기 (좁은 글자는 잘림)
        float l__cols = floor(max(u__cols, 2.0));
        float l__rows = floor(max(u__rows, 2.0));
        float l__bh = v__rect.w * 0.68;
        vec2 l__boxs = vec2(l__bh / l__rows * l__cols * 0.85, l__bh);
        vec2 l__box0 = vec2((v__rect.z - l__boxs.x) * 0.5, v__rect.w * 0.17);
        vec2 l__g = (v__q - l__box0) / max(l__boxs, vec2(1.0));
        vec2 l__cell = floor(l__g * vec2(l__cols, l__rows));
        vec2 l__in = fract(l__g * vec2(l__cols, l__rows));
        float l__inside = step(0.0, l__g.x) * step(l__g.x, 0.9999) * step(0.0, l__g.y) * step(l__g.y, 0.9999);
        float l__seed = v__id * 7.13 + v__tick * 1.731 + l__cell.x * 13.7 + l__cell.y * 3.37;
        float l__r = fract(sin(l__seed) * 43758.5453);
        float l__dot = step(1.0 - clamp(u__density, 0.0, 1.0), l__r);
        // 점은 칸보다 조금 작게 (사이가 비게)
        float l__sq = step(0.12, l__in.x) * step(l__in.x, 0.88) * step(0.12, l__in.y) * step(l__in.y, 0.88);
        // 외곽선·그림자 겹은 자리가 달라 점이 어긋나므로, 도는 동안에는 글자 겹에만 그림
        float l__a = l__dot * l__sq * l__inside * step(0.05, l__ink.a) * clamp(u__dim, 0.0, 1.0) * v__state * step(0.5, u_text_main);
        gl_FragColor = vec4(l__col * l__a, l__a);
    }
