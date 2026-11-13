// calibrate: 조정 화면: 앞 화면이 지직 끊기고, 방송 조정 화면이 잠깐 나왔다가 다시 끊기며 새 화면으로 넘어감
// 조정 화면은 셰이더로 그린 것이라 그림 파일이 필요 없습니다.
// u__style: 0 컬러 바 (일곱 색 띠와 아래쪽 어두운 칸), 1 원 격자 (회색 격자 위에 큰 원, 색 띠, 회색 계단, 줄무늬)
// u__in: 조정 화면이 나오는 때 (0~1). u__cut: 조정 화면이 끝나고 새 화면이 나오는 때 (0~1)
// u__crt: 브라운관 느낌 (주사선, 가장자리 어둡게, 떨림). u__burst: 끊길 때 지직거림
// 화면 셰이더를 이 전환으로 바꿀 때 셰이더는 u__cut에 바뀝니다
// 쓰는 법:  scene bg hall with img_fx.use("calibrate")      scene bg hall with img_fx.use("calibrate", 2.5, style=1)
@transition calibrate 조정 화면
@time 2.0
@set u__style 0.0
@set u__in 0.15
@set u__cut 0.85
@set u__crt 0.6
@set u__burst 0.8
@param u__style 0 1 모양 (0 컬러 바, 1 원 격자)
@param u__in 0 0.5 나오는 때
@param u__cut 0.5 1 끝나는 때
@param u__crt 0 1 브라운관 느낌
@param u__burst 0 1 끊길 때 지직
@variables
    uniform float u__style;
    uniform float u__in;
    uniform float u__cut;
    uniform float u__crt;
    uniform float u__burst;
@fragment
    vec2 l__pp = l__uv * l__size;
    float l__tin = clamp(u__in, 0.0, 0.95);
    float l__tout = clamp(u__cut, l__tin + 0.01, 1.0);
    float l__f = floor(l__t * 60.0);

    // 끊길 때 지직: 나오는 때와 끝나는 때 가까이에서
    float l__bz = max(exp(-abs(l__t - l__tin) * 45.0), exp(-abs(l__t - l__tout) * 45.0)) * u__burst;
    float l__row = fract(sin(dot(vec2(floor(l__pp.y / 4.0), l__f), vec2(12.9898, 78.233))) * 43758.5453);
    vec2 l__u = clamp(l__uv + vec2((l__row - 0.5) * 0.08 * l__bz, 0.0), 0.0, 1.0);
    vec2 l__q = l__u * l__size;

    vec3 l__card;
    if (u__style < 0.5) {
        // 컬러 바
        float l__x = l__u.x;
        float l__i = floor(l__x * 7.0);
        vec3 l__bars[7];
        l__bars[0] = vec3(0.75); l__bars[1] = vec3(0.75, 0.75, 0.0); l__bars[2] = vec3(0.0, 0.75, 0.75); l__bars[3] = vec3(0.0, 0.75, 0.0);
        l__bars[4] = vec3(0.75, 0.0, 0.75); l__bars[5] = vec3(0.75, 0.0, 0.0); l__bars[6] = vec3(0.0, 0.0, 0.75);
        vec3 l__top = vec3(0.0);
        vec3 l__mid = vec3(0.0);
        for (int l__k = 0; l__k < 7; l__k++) {
            if (float(l__k) == l__i) {
                l__top = l__bars[l__k];
                l__mid = (l__k == 1 || l__k == 3 || l__k == 5) ? vec3(0.04) : l__bars[6 - l__k];
            }
        }
        vec3 l__low;
        float l__b = l__x * 28.0;
        if (l__b < 5.0) l__low = vec3(0.0, 0.13, 0.3);
        else if (l__b < 10.0) l__low = vec3(1.0);
        else if (l__b < 15.0) l__low = vec3(0.2, 0.0, 0.42);
        else if (l__b < 20.0) l__low = vec3(0.04);
        else if (l__b < 24.0) l__low = vec3(l__b < 21.33 ? 0.0 : (l__b < 22.67 ? 0.04 : 0.09));
        else l__low = vec3(0.04);
        l__card = l__u.y < 0.67 ? l__top : (l__u.y < 0.75 ? l__mid : l__low);
    } else {
        // 원 격자
        vec2 l__p = (l__q - 0.5 * l__size) / max(l__size.y, 1.0);
        float l__cs = l__size.y / 10.0;
        vec2 l__g = abs(fract(l__q / l__cs + 0.5) - 0.5) * l__cs;
        float l__line = 1.0 - smoothstep(1.0, 2.5, min(l__g.x, l__g.y));
        l__card = mix(vec3(0.42), vec3(0.95), l__line);
        float l__r = length(l__p);
        if (l__r < 0.42) {
            vec2 l__c = l__p / 0.42;
            if (l__c.y < -0.45) {
                float l__i = floor((l__c.x * 0.5 + 0.5) * 6.0);
                if (l__i < 0.5) l__card = vec3(0.85, 0.85, 0.1);
                else if (l__i < 1.5) l__card = vec3(0.1, 0.8, 0.85);
                else if (l__i < 2.5) l__card = vec3(0.1, 0.8, 0.15);
                else if (l__i < 3.5) l__card = vec3(0.85, 0.1, 0.8);
                else if (l__i < 4.5) l__card = vec3(0.85, 0.1, 0.1);
                else l__card = vec3(0.1, 0.15, 0.85);
            } else if (l__c.y < -0.12) {
                l__card = vec3(floor((l__c.x * 0.5 + 0.5) * 6.0) / 5.0);
            } else if (l__c.y < 0.25) {
                float l__fr = floor((l__c.x * 0.5 + 0.5) * 5.0) + 1.0;
                l__card = vec3(step(0.0, sin(l__c.x * 40.0 * l__fr)) * 0.85 + 0.08);
            } else {
                l__card = mix(vec3(0.95), vec3(0.05), step(0.0, l__c.x));
            }
            float l__cross = 1.0 - smoothstep(0.003, 0.006, min(abs(l__p.x), abs(l__p.y)));
            l__card = mix(l__card, vec3(0.95), l__cross * step(l__r, 0.1));
        }
        l__card = mix(l__card, vec3(0.03), 1.0 - smoothstep(0.006, 0.010, abs(l__r - 0.42)));
    }

    // 브라운관 느낌
    float l__scan = 0.75 + 0.25 * sin(l__q.y * 3.14159);
    vec2 l__vc = l__uv - 0.5;
    float l__vig = 1.0 - dot(l__vc, l__vc) * 1.6;
    float l__flick = 0.96 + 0.04 * fract(sin(l__f * 91.7) * 43758.5453);
    l__card *= mix(1.0, l__scan * l__vig * l__flick, clamp(u__crt, 0.0, 1.0));

    vec4 l__img = l__t < l__tin ? texture2D(tex0, l__u) : (l__t < l__tout ? vec4(clamp(l__card, 0.0, 1.0), 1.0) : texture2D(tex1, l__u));
    float l__n = fract(sin(dot(floor(l__pp / 2.0) + l__f * 13.1, vec2(12.9898, 78.233))) * 43758.5453);
    gl_FragColor = mix(l__img, vec4(vec3(l__n), 1.0), clamp(l__bz * 0.85, 0.0, 1.0));
