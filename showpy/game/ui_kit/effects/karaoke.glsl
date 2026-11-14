// karaoke: 노래방: 줄이 처음부터 다 보이고, 부르는 만큼 왼쪽부터 다른 색으로 칠해짐 (노래방 자막처럼). 글자 안에서도 부드럽게 칠해짐
// 칠해지는 빠르기는 그 대사의 글자/초(cps)입니다. 클릭하면 남은 곳이 한꺼번에 칠해집니다.
// u__color: 칠해진 글자 색. u__outline: 칠해진 외곽선 색 (외곽선이 있을 때). u__base: 아직 안 칠한 글자 색. u__base_amount: 그 색이 드는 정도 (0이면 글자 원래 색)
// u__soft: 칠해지는 경계의 부드러움 (글자 수). u__glow: 경계가 밝게 빛나는 정도
// 대사에 외곽선을 적지 않았으면 검은 외곽선(3픽셀)을 깔아 줍니다.
// 쓰는 법:  e "미안해 솔직하지 못한 내가" (cps=8, effect="karaoke")      e "파란 외곽선." (cps=10, effect="karaoke:u__color=#ffe14d:u__outline=#1e40ff")
// 뒤에 상자와 겹치기:  effect="backbox:u__grow=0:u__hide=0|karaoke"
@effect karaoke 노래방
@cps
@outline 3 #000000 0 0
@set u__color #ffe14d
@set u__outline #1e40ff
@set u__base #ffffff
@set u__base_amount 0.0
@set u__soft 0.3
@set u__glow 0.0
@param u__color 0 0 칠한 글자 색
@param u__outline 0 0 칠한 외곽선 색
@param u__base 0 0 안 칠한 글자 색
@param u__base_amount 0 1 안 칠한 색 드는 정도
@param u__soft 0 3 경계 부드러움
@param u__glow 0 1 경계 빛
@variables
    uniform vec4 u__color;
    uniform vec4 u__outline;
    uniform vec4 u__base;
    uniform float u__base_amount;
    uniform float u__soft;
    uniform float u__glow;
    uniform float u_text_slow_duration;
    uniform float u_text_slow_time;
    uniform float u_text_main;
    attribute float a_text_time;
    varying float v__time;
@vertex_20
    v__time = a_text_time;
@fragment_340
    float l__sd = u_text_slow_duration;
    float l__f = 1.0;
    float l__edge = 0.0;
    if (l__sd > 0.0) {
        float l__w = max(u__soft * l__sd, 0.0001);
        l__f = clamp((u_text_slow_time - v__time) / l__w + 0.5, 0.0, 1.0);
        l__edge = 1.0 - abs(l__f * 2.0 - 1.0);
    }
    vec4 l__c = gl_FragColor;
    vec4 l__fill = u_text_main > 0.5 ? u__color : u__outline;
    vec3 l__fc = l__fill.rgb / max(l__fill.a, 0.001);
    vec3 l__bc = u_text_main > 0.5 ? mix(l__c.rgb, u__base.rgb / max(u__base.a, 0.001) * l__c.a, u__base_amount) : l__c.rgb;
    vec3 l__rgb = mix(l__bc, l__fc * l__c.a, l__f * l__fill.a);
    l__rgb = min(l__rgb + vec3(l__edge * u__glow * 0.6) * l__c.a * step(0.5, u_text_main), vec3(l__c.a));
    gl_FragColor = vec4(l__rgb, l__c.a);
