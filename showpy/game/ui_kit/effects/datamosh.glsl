// datamosh: 데이터모싱 (크래시): 키프레임을 잃은 동영상처럼, 지금 화면이 블록째 끌려가며 녹고 다음 화면의 윤곽만 그 위에 비쳐 보이다가 다음 화면으로 뚝 끊어 넘어감
// 동영상 코덱이 하는 일(앞 프레임 + 블록마다 움직임 벡터 + 잔차)을 흉내 냅니다. 새 프레임을 받지 못한 채 앞 그림만 프레임마다 벡터대로 다시 끌어 오니 오류가 쌓입니다.
//   - 블록마다 벡터 하나: 회전(소용돌이)·확산(바깥으로) 흐름 + 다음 화면 밝기의 기울기(다음 화면의 모양을 따라 흐름) + 조금씩 다른 흔들림. 반 픽셀 단위로 끊습니다.
//   - 몇몇 블록은 옆 블록의 벡터를 잘못 읽고(u__mismatch), 몇몇은 움직이지 않으며(u__skip), 몇몇 구역은 데이터가 빠진 듯 중간에 멈춥니다(u__lost).
//   - 잔차: 다음 화면에서 앞 그림보다 또렷한 윤곽만 거칠게 끊어 얹습니다(u__residual). 다음 화면의 모양이 앞 그림의 색으로 비쳐 보입니다.
// 시간의 앞쪽(u__crash)에 깨지고, 나머지는 멈춰 있다가 u__cut에 새 화면으로 바뀝니다(그때 화면 셰이더도 바뀜).
// u__mode: 0이면 회전, 1이면 확산 (사이 값은 둘을 섞음). u__strength: 한 프레임에 끌려가는 세기. u__block: 블록 크기 (픽셀)
// 쓰는 법:  scene bg hall with img_fx.use("datamosh")      scene bg hall with img_fx.use("datamosh", 1.5, mode=1.0, strength=1.5)
@transition datamosh 데이터모싱 (크래시)
@time 1.4
@set u__mode 0.0
@set u__strength 1.0
@set u__block 16.0
@set u__crash 0.45
@set u__mismatch 0.15
@set u__skip 0.2
@set u__lost 0.3
@set u__residual 1.0
@set u__cut 1.0
@param u__mode 0 1 회전 ↔ 확산
@param u__strength 0 3 끌려가는 세기
@param u__block 4 64 블록 크기
@param u__crash 0.05 1 깨지는 시간 비율
@param u__mismatch 0 1 벡터를 잘못 읽는 블록
@param u__skip 0 1 멈춰 있는 블록
@param u__lost 0 1 빠진 구역
@param u__residual 0 3 다음 화면 윤곽
@variables
    uniform float u__mode;
    uniform float u__strength;
    uniform float u__block;
    uniform float u__crash;
    uniform float u__mismatch;
    uniform float u__skip;
    uniform float u__lost;
    uniform float u__residual;
    uniform float u__cut;
@fragment
    vec2 l__px = vec2(1.0) / max(l__size, vec2(1.0));
    vec3 l__w = vec3(0.299, 0.587, 0.114);
    float l__p = smoothstep(0.0, max(u__crash, 0.01), l__t);
    float l__frames = l__p * 24.0;
    float l__bs = max(u__block, 2.0);
    vec2 l__nb = max(floor(l__size / l__bs), vec2(1.0));
    float l__asp = l__size.x / max(l__size.y, 1.0);
    float l__m = clamp(u__mode, 0.0, 1.0);
    float l__sp = u__strength * 6.0;
    vec2 l__buv = (floor(l__uv * l__nb) + 0.5) / l__nb;
    vec2 l__lg = l__buv * vec2(7.0, 5.0);
    vec2 l__lc = floor(l__lg);
    float l__lr = fract(sin(dot(l__lc, vec2(41.31, 17.77))) * 21345.678);
    vec2 l__lctr = 0.2 + 0.6 * vec2(fract(l__lr * 13.7), fract(l__lr * 71.3));
    vec2 l__lhalf = vec2(0.1) + vec2(0.4, 0.3) * fract(l__lr * 5.3);
    vec2 l__ld = abs(fract(l__lg) - l__lctr) - l__lhalf;
    float l__lost = (l__lr < u__lost && l__ld.x < 0.0 && l__ld.y < 0.0) ? 1.0 : 0.0;
    float l__stop = mix(l__frames, l__frames * 0.6 * fract(l__lr * 3.1), l__lost);
    vec2 l__q = l__uv;
    for (int l__i = 0; l__i < 24; l__i++) {
        if (float(l__i) >= l__stop) break;
        vec2 l__b = floor(l__q * l__nb);
        float l__h1 = fract(sin(dot(l__b, vec2(12.9898, 78.233))) * 43758.5453);
        float l__h2 = fract(sin(dot(l__b, vec2(39.3468, 11.135))) * 24634.6345);
        float l__h3 = fract(sin(dot(l__b, vec2(73.156, 52.235))) * 63289.2117);
        l__b += step(l__h1, u__mismatch) * (floor(vec2(l__h2, l__h3) * 3.0) - 1.0);
        vec2 l__c = (l__b + 0.5) / l__nb;
        vec2 l__d = (l__c - 0.5) * vec2(l__asp, 1.0);
        float l__r = length(l__d);
        vec2 l__dir = l__r > 0.0001 ? l__d / l__r : vec2(1.0, 0.0);
        vec2 l__flow = mix(vec2(-l__dir.y, l__dir.x), l__dir, l__m) * (0.35 + l__r);
        vec2 l__gs = l__bs * l__px;
        float l__g0 = dot(texture2D(tex1, clamp(l__c, 0.0, 1.0)).rgb, l__w);
        float l__gx = dot(texture2D(tex1, clamp(l__c + vec2(l__gs.x, 0.0), 0.0, 1.0)).rgb, l__w) - l__g0;
        float l__gy = dot(texture2D(tex1, clamp(l__c + vec2(0.0, l__gs.y), 0.0, 1.0)).rgb, l__w) - l__g0;
        vec2 l__v = (l__flow + vec2(l__gx, l__gy) * 3.0 + (vec2(l__h2, l__h3) - 0.5) * 0.6) * l__sp;
        l__v *= step(u__skip, fract(l__h1 * 7.31));
        l__v = floor(l__v * 2.0 + 0.5) * 0.5;
        l__q -= l__v * l__px;
    }
    l__q = clamp(l__q, 0.0, 1.0);
    vec4 l__col = texture2D(tex0, l__q);
    vec2 l__rr = 1.5 * l__px;
    vec3 l__lowc = texture2D(tex1, l__uv + vec2(l__rr.x, 0.0)).rgb + texture2D(tex1, l__uv - vec2(l__rr.x, 0.0)).rgb
        + texture2D(tex1, l__uv + vec2(0.0, l__rr.y)).rgb + texture2D(tex1, l__uv - vec2(0.0, l__rr.y)).rgb;
    vec3 l__lowp = texture2D(tex0, clamp(l__q + vec2(l__rr.x, 0.0), 0.0, 1.0)).rgb + texture2D(tex0, clamp(l__q - vec2(l__rr.x, 0.0), 0.0, 1.0)).rgb
        + texture2D(tex0, clamp(l__q + vec2(0.0, l__rr.y), 0.0, 1.0)).rgb + texture2D(tex0, clamp(l__q - vec2(0.0, l__rr.y), 0.0, 1.0)).rgb;
    float l__hc = dot(l__new.rgb - l__lowc * 0.25, l__w);
    float l__hp = dot(l__col.rgb - l__lowp * 0.25, l__w);
    float l__res = abs(l__hc) > abs(l__hp) ? l__hc - l__hp : 0.0;
    l__res = floor(l__res * 6.0 + 0.5) / 6.0;
    l__col.rgb += vec3(l__res * u__residual * l__p);
    l__col.rgb = clamp(l__col.rgb, 0.0, 1.0);
    l__col.rgb = min(l__col.rgb, vec3(l__col.a));
    gl_FragColor = l__t >= min(u__cut, 1.0) ? l__new : l__col;
