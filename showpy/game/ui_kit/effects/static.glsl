// static: TV 지직: 앞 화면 위로 TV 노이즈(지직거리는 점)가 덮였다가, 걷히면서 새 화면이 나옴
// 노이즈가 가장 진할 때(u__cut) 새 화면으로 바뀝니다. 지직거리는 동안 가로줄이 흔들리고 밝은 띠가 흘러내립니다.
// u__noise: 노이즈 세기 (1이면 가장 진할 때 화면이 다 덮임). u__grain: 점 크기 (픽셀). u__color: 색 노이즈 정도 (0 흑백)
// u__jitter: 가로줄 흔들림 (픽셀). u__roll: 흘러내리는 밝은 띠 세기. u__frames: 전환 동안 노이즈가 바뀌는 횟수
// u__cut: 새 화면으로 바뀌는 때 (0~1). 화면 셰이더를 이 전환으로 바꿀 때 셰이더도 이때 바뀝니다
// 소리는 따로: play sound "static.ogg" 처럼 같이 적습니다
// 쓰는 법:  scene bg hall with img_fx.use("static")      scene bg hall with img_fx.use("static", 1.5, color=0.6, jitter=40)
@transition static TV 지직
@time 1.0
@set u__noise 1.0
@set u__grain 2.0
@set u__color 0.0
@set u__jitter 18.0
@set u__roll 0.5
@set u__frames 30.0
@set u__cut 0.5
@param u__noise 0 1 노이즈 세기
@param u__grain 1 8 점 크기
@param u__color 0 1 색 노이즈
@param u__jitter 0 80 가로줄 흔들림
@param u__roll 0 1 흐르는 띠
@param u__frames 5 90 바뀌는 횟수
@param u__cut 0.05 0.95 바뀌는 때
@variables
    uniform float u__noise;
    uniform float u__grain;
    uniform float u__color;
    uniform float u__jitter;
    uniform float u__roll;
    uniform float u__frames;
    uniform float u__cut;
@fragment
    float l__cut = clamp(u__cut, 0.05, 0.95);
    float l__up = smoothstep(0.0, l__cut * 0.85, l__t);
    float l__down = 1.0 - smoothstep(l__cut + (1.0 - l__cut) * 0.15, 1.0, l__t);
    float l__e = l__t < l__cut ? l__up : l__down;
    float l__f = floor(l__t * max(u__frames, 1.0));
    vec2 l__pp = l__uv * l__size;

    // 가로줄 흔들림: 줄 묶음마다 옆으로 밀림
    float l__row = floor(l__pp.y / 3.0);
    float l__rj = fract(sin(dot(vec2(l__row, l__f), vec2(12.9898, 78.233))) * 43758.5453);
    float l__big = fract(sin(dot(vec2(floor(l__pp.y / 40.0), l__f), vec2(39.346, 11.135))) * 43758.5453);
    float l__dx = ((l__rj - 0.5) * 0.4 + (l__big > 0.8 ? (l__big - 0.9) * 6.0 : 0.0)) * u__jitter * l__e;
    vec2 l__su = clamp(l__uv + vec2(l__dx / max(l__size.x, 1.0), 0.0), 0.0, 1.0);
    vec4 l__base = l__t < l__cut ? texture2D(tex0, l__su) : texture2D(tex1, l__su);

    // 노이즈 점
    vec2 l__cell = floor(l__pp / max(u__grain, 1.0));
    vec2 l__q = l__cell + vec2(l__f * 17.13, l__f * 31.71);
    float l__n = fract(sin(dot(l__q, vec2(12.9898, 78.233))) * 43758.5453);
    float l__n2 = fract(sin(dot(l__q, vec2(63.7264, 10.873))) * 43758.5453);
    float l__n3 = fract(sin(dot(l__q, vec2(4.2131, 91.713))) * 43758.5453);
    vec3 l__col = mix(vec3(l__n), vec3(l__n, l__n2, l__n3), clamp(u__color, 0.0, 1.0));
    l__col = l__col * l__col * 1.15;

    // 흘러내리는 밝은 띠와 주사선
    float l__band = fract(l__uv.y * 1.3 - l__t * 2.7);
    l__col += vec3(smoothstep(0.82, 1.0, l__band) * 0.45 * u__roll);
    l__col *= 0.82 + 0.18 * step(0.5, fract(l__pp.y / 2.0));

    float l__k = clamp(l__e * u__noise, 0.0, 1.0);
    vec4 l__nz = vec4(clamp(l__col, 0.0, 1.0), 1.0);
    // 노이즈가 옅을 때는 밝은 점만 화면 위에 얹히고, 진해지면 화면을 덮음
    vec4 l__over = vec4(min(l__base.rgb + l__nz.rgb * l__k * 0.6 * l__base.a, vec3(l__base.a)), l__base.a);
    gl_FragColor = mix(l__over, l__nz, smoothstep(0.2, 1.0, l__k));
