// datamosh: 데이터모싱 (크래시): 지금 화면이 블록째 소용돌이치거나 바깥으로 터지며 깨지고, 깨진 채 멈췄다가 다음 화면으로 뚝 끊어 넘어감
// 동영상 코덱이 깨질 때의 모양을 흉내 냅니다. 블록마다 가운데를 도는 각도(회전)나 바깥으로 밀리는 거리(확산)를 정하고, 앞 그림을 그쪽으로 끌어 읽습니다.
// 다음 화면과 섞지 않습니다. 시간의 앞쪽(u__crash)에 깨지고, 나머지는 멈춰 있다가 u__cut에 새 화면으로 바뀝니다.
// u__mode: 0이면 회전, 1이면 확산 (사이 값은 둘을 섞음). u__strength: 깨지는 세기. u__block: 블록 크기 (픽셀)
// u__crash: 깨지는 데 쓰는 시간의 비율 (나머지는 멈춤). u__bleed: 빨강, 파랑이 번지는 정도 (픽셀). u__noise: 깨진 블록 무늬가 나오는 정도
// u__cut: 새 화면으로 끊는 때 (0~1). 화면 셰이더를 이 전환으로 바꿀 때 셰이더도 이때 바뀝니다
// 쓰는 법:  scene bg hall with img_fx.use("datamosh")      scene bg hall with img_fx.use("datamosh", 1.5, mode=1.0, strength=1.5)
@transition datamosh 데이터모싱 (크래시)
@time 1.4
@set u__mode 0.0
@set u__strength 1.0
@set u__block 16.0
@set u__crash 0.4
@set u__bleed 6.0
@set u__noise 0.5
@set u__cut 1.0
@param u__mode 0 1 회전 ↔ 확산
@param u__strength 0 3 깨지는 세기
@param u__block 4 64 블록 크기
@param u__crash 0.05 1 깨지는 시간 비율
@param u__bleed 0 20 색 번짐
@param u__noise 0 1 깨진 무늬
@variables
    uniform float u__mode;
    uniform float u__strength;
    uniform float u__block;
    uniform float u__crash;
    uniform float u__bleed;
    uniform float u__noise;
    uniform float u__cut;
@fragment
    vec2 l__px = vec2(1.0) / max(l__size, vec2(1.0));
    float l__p = smoothstep(0.0, max(u__crash, 0.01), l__t);
    float l__bs = max(u__block, 2.0);
    vec2 l__b = floor(l__uv * l__size / l__bs);
    float l__r1 = fract(sin(dot(l__b, vec2(12.9898, 78.233))) * 43758.5453);
    float l__r2 = fract(sin(dot(l__b, vec2(39.3468, 11.135))) * 24634.6345);
    float l__r3 = fract(sin(dot(l__b, vec2(73.156, 52.235))) * 63289.2117);
    vec2 l__big = floor(l__b / 4.0);
    float l__r4 = fract(sin(dot(l__big, vec2(27.619, 57.583))) * 35791.3579);
    float l__asp = l__size.x / max(l__size.y, 1.0);
    vec2 l__cell = (l__b + 0.5) * l__bs * l__px;
    vec2 l__d = (l__cell - 0.5) * vec2(l__asp, 1.0);
    float l__r = length(l__d);
    float l__m = clamp(u__mode, 0.0, 1.0);
    float l__s = u__strength * l__p;
    float l__jit = 0.6 + 0.8 * l__r1;
    float l__ang = (1.0 - l__m) * l__s * 2.4 * (1.15 - min(l__r, 1.0)) * (0.7 + 0.6 * l__r4) * l__jit;
    float l__grow = 1.0 + l__m * l__s * 0.9 * (0.4 + 0.6 * l__r4) * l__jit;
    vec4 l__acc = vec4(0.0);
    for (int l__i = 0; l__i < 4; l__i++) {
        float l__f = 1.0 - float(l__i) * 0.22;
        float l__a = l__ang * l__f;
        float l__g = mix(1.0, l__grow, l__f);
        vec2 l__q = (l__uv - 0.5) * vec2(l__asp, 1.0);
        l__q = mat2(cos(l__a), sin(l__a), -sin(l__a), cos(l__a)) * l__q / l__g;
        vec2 l__src = l__q / vec2(l__asp, 1.0) + 0.5;
        l__acc += texture2D(tex0, clamp(l__src, 0.0, 1.0)) * (0.4 - float(l__i) * 0.1);
    }
    vec4 l__col = l__acc;
    vec2 l__dir = l__r > 0.0001 ? l__d / l__r : vec2(1.0, 0.0);
    vec2 l__tan = vec2(-l__dir.y, l__dir.x);
    vec2 l__bo = mix(l__tan, l__dir, l__m) * u__bleed * l__p * l__px;
    vec2 l__q0 = (l__uv - 0.5) * vec2(l__asp, 1.0);
    l__q0 = mat2(cos(l__ang), sin(l__ang), -sin(l__ang), cos(l__ang)) * l__q0 / l__grow;
    vec2 l__src0 = l__q0 / vec2(l__asp, 1.0) + 0.5;
    l__col.r = texture2D(tex0, clamp(l__src0 + l__bo, 0.0, 1.0)).r * 0.6 + l__col.r * 0.4;
    l__col.b = texture2D(tex0, clamp(l__src0 - l__bo, 0.0, 1.0)).b * 0.6 + l__col.b * 0.4;
    if (l__r2 < clamp(u__noise, 0.0, 1.0) * 0.18 * l__p) {
        vec2 l__in = fract(l__uv * l__size / l__bs);
        float l__dct = 0.85 + 0.15 * cos(6.2831853 * floor(l__r2 * 4.0 + 1.0) * l__in.x) * cos(6.2831853 * floor(l__r3 * 4.0 + 1.0) * l__in.y);
        l__col.rgb = floor(l__col.rgb * 4.0 + 0.5) / 4.0 * l__dct;
    }
    if (l__r3 < clamp(u__noise, 0.0, 1.0) * 0.06 * l__p) {
        l__col = texture2D(tex0, clamp(l__cell + (vec2(l__r1, l__r4) - 0.5) * 0.3, 0.0, 1.0));
    }
    l__col.rgb = clamp(l__col.rgb, 0.0, 1.0);
    l__col.rgb = min(l__col.rgb, vec3(l__col.a));
    gl_FragColor = l__t >= min(u__cut, 1.0) ? l__new : l__col;
