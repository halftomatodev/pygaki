// datamosh: 데이터모싱으로 바뀌기: 앞 그림이 네모 블록 단위로 녹아 흘러내리고, 새 그림의 윤곽이 앞 그림 색을 끌고 다니다가 블록씩 새 그림으로 채워짐
// 동영상 코덱이 깨질 때의 모양을 흉내 냅니다. 블록마다 움직이는 방향을 정하고(새 그림의 윤곽 + 블록마다 다른 난수), 앞 그림을 그쪽으로 끌어 읽습니다.
// u__block: 블록 크기 (픽셀). u__strength: 가장 많이 밀릴 때 거리 (픽셀). u__follow: 0이면 아무렇게나, 1이면 새 그림 윤곽을 따라 흐름
// u__ghost: 앞 그림 위에 새 그림 윤곽이 비치는 정도. u__bleed: 빨강, 파랑이 번지는 정도 (픽셀). u__noise: 깨진 블록 무늬가 나오는 정도
// 쓰는 법:  scene bg hall with img_fx.use("datamosh")      scene bg hall with img_fx.use("datamosh", 2.0, block=24, strength=200)
@transition datamosh 데이터모싱으로 바뀌기
@time 1.6
@set u__block 16.0
@set u__strength 120.0
@set u__follow 0.6
@set u__ghost 0.5
@set u__bleed 4.0
@set u__noise 0.5
@param u__block 4 64 블록 크기
@param u__strength 0 400 밀리는 거리
@param u__follow 0 1 새 그림 윤곽 따르기
@param u__ghost 0 1 새 그림 윤곽 비침
@param u__bleed 0 20 색 번짐
@param u__noise 0 1 깨진 무늬
@variables
    uniform float u__block;
    uniform float u__strength;
    uniform float u__follow;
    uniform float u__ghost;
    uniform float u__bleed;
    uniform float u__noise;
@fragment
    vec2 l__px = vec2(1.0) / max(l__size, vec2(1.0));
    float l__bs = max(u__block, 2.0);
    vec2 l__b = floor(l__uv * l__size / l__bs);
    vec2 l__cell = (l__b + 0.5) * l__bs * l__px;
    float l__r1 = fract(sin(dot(l__b, vec2(12.9898, 78.233))) * 43758.5453);
    float l__r2 = fract(sin(dot(l__b, vec2(39.3468, 11.135))) * 24634.6345);
    float l__r3 = fract(sin(dot(l__b, vec2(73.156, 52.235))) * 63289.2117);
    float l__k = sin(3.14159265 * l__t);
    vec3 l__w = vec3(0.299, 0.587, 0.114);
    vec2 l__e = l__px * l__bs;
    float l__yl = dot(texture2D(tex1, clamp(l__cell - vec2(l__e.x, 0.0), 0.0, 1.0)).rgb, l__w);
    float l__yr = dot(texture2D(tex1, clamp(l__cell + vec2(l__e.x, 0.0), 0.0, 1.0)).rgb, l__w);
    float l__yu = dot(texture2D(tex1, clamp(l__cell - vec2(0.0, l__e.y), 0.0, 1.0)).rgb, l__w);
    float l__yd = dot(texture2D(tex1, clamp(l__cell + vec2(0.0, l__e.y), 0.0, 1.0)).rgb, l__w);
    vec2 l__grad = vec2(l__yr - l__yl, l__yd - l__yu);
    vec2 l__rand = vec2(l__r1, l__r2) - 0.5;
    vec2 l__mv = mix(l__rand, l__grad * 2.0, clamp(u__follow, 0.0, 1.0));
    vec2 l__disp = l__mv * u__strength * l__px * smoothstep(0.0, 0.85, l__t);
    vec4 l__acc = vec4(0.0);
    for (int l__i = 0; l__i < 4; l__i++) {
        float l__f = 1.0 - float(l__i) * 0.25;
        l__acc += texture2D(tex0, clamp(l__uv - l__disp * l__f, 0.0, 1.0)) * (0.4 - float(l__i) * 0.1);
    }
    vec4 l__mosh = l__acc;
    vec2 l__bo = vec2(u__bleed * l__k, 0.0) * l__px;
    l__mosh.r = texture2D(tex0, clamp(l__uv - l__disp + l__bo, 0.0, 1.0)).r * 0.6 + l__mosh.r * 0.4;
    l__mosh.b = texture2D(tex0, clamp(l__uv - l__disp - l__bo, 0.0, 1.0)).b * 0.6 + l__mosh.b * 0.4;
    float l__avg = (l__yl + l__yr + l__yu + l__yd) * 0.25;
    float l__detail = dot(l__new.rgb, l__w) - l__avg;
    l__mosh.rgb += vec3(l__detail * clamp(u__ghost, 0.0, 1.0) * 1.5 * smoothstep(0.1, 0.6, l__t));
    vec2 l__big = floor(l__b / 4.0);
    float l__r4 = fract(sin(dot(l__big, vec2(27.619, 57.583))) * 35791.3579);
    float l__edge = clamp(length(l__grad) * 4.0, 0.0, 1.0);
    float l__order = clamp(l__r4 * 0.6 + l__r3 * 0.4 - l__edge * 0.1, 0.0, 1.0);
    float l__done = smoothstep(0.6, 0.98, l__t);
    bool l__fresh = l__order < l__done;
    vec4 l__col = l__fresh ? l__new : l__mosh;
    if (!l__fresh && l__r1 < clamp(u__noise, 0.0, 1.0) * 0.15 * l__k) {
        vec2 l__in = fract(l__uv * l__size / l__bs);
        float l__dct = 0.85 + 0.15 * cos(6.2831853 * floor(l__r2 * 4.0 + 1.0) * l__in.x) * cos(6.2831853 * floor(l__r3 * 4.0 + 1.0) * l__in.y);
        l__col.rgb = floor(l__col.rgb * 4.0 + 0.5) / 4.0 * l__dct;
    }
    l__col.rgb = clamp(l__col.rgb, 0.0, 1.0);
    l__col.rgb = min(l__col.rgb, vec3(l__col.a));
    gl_FragColor = l__t >= 1.0 ? l__new : l__col;
