// pushup: 밀어 올리기: 오래된 메뉴 화면처럼 새 화면이 아래에서 올라오며 앞 화면을 밀어냄. 경계에 어두운 띠가 따라오고 빛이 번쩍임
// u__dir: 새 화면이 움직이는 쪽. 0 위로 (아래에서 들어옴), 1 아래로, 2 왼쪽으로, 3 오른쪽으로
// u__band: 경계를 따라오는 어두운 띠 굵기 (픽셀, 0이면 없음). u__band_color: 띠 색
// u__glow: 경계의 빛 줄기. u__flare: 화면 전체가 번쩍이는 정도. u__blur: 움직일 때 번짐 (픽셀)
// 쓰는 법:  scene bg hall with img_fx.use("pushup")      scene bg hall with img_fx.use("pushup", 0.8, dir=2, flare=0.2)
@transition pushup 밀어 올리기
@time 0.7
@set u__dir 0.0
@set u__band 24.0
@set u__band_color #15170f
@set u__glow 0.6
@set u__flare 0.25
@set u__blur 18.0
@param u__dir 0 3 방향 (0 위, 1 아래, 2 왼쪽, 3 오른쪽)
@param u__band 0 120 어두운 띠
@param u__glow 0 2 경계 빛
@param u__flare 0 1 번쩍임
@param u__blur 0 60 움직임 번짐
@variables
    uniform float u__dir;
    uniform float u__band;
    uniform vec4 u__band_color;
    uniform float u__glow;
    uniform float u__flare;
    uniform float u__blur;
@fragment
    float l__d = floor(clamp(u__dir, 0.0, 3.0) + 0.5);
    bool l__vert = l__d < 1.5;
    float l__s = (l__d < 0.5 || (l__d > 1.5 && l__d < 2.5)) ? 1.0 : -1.0;
    vec2 l__ax = l__vert ? vec2(0.0, 1.0) : vec2(1.0, 0.0);
    float l__len = l__vert ? l__size.y : l__size.x;
    float l__co = l__vert ? l__uv.y : l__uv.x;
    float l__a = l__s > 0.0 ? l__co : 1.0 - l__co;

    float l__e = l__t * l__t * l__t * (l__t * (l__t * 6.0 - 15.0) + 10.0);
    float l__pk = sin(3.14159 * clamp(l__t, 0.0, 1.0));
    vec2 l__step = l__ax * l__s * (u__blur * l__pk / max(l__len, 1.0)) * 0.25;

    // 앞 화면은 a + e < 1인 곳, 새 화면은 그 너머
    bool l__isold = l__a + l__e < 1.0;
    vec2 l__src = l__isold ? l__uv + l__ax * l__s * l__e : l__uv + l__ax * l__s * (l__e - 1.0);
    vec4 l__c = vec4(0.0);
    for (int l__k = 0; l__k < 5; l__k++) {
        vec2 l__p = clamp(l__src + l__step * (float(l__k) - 2.0), 0.0, 1.0);
        l__c += (l__isold ? texture2D(tex0, l__p) : texture2D(tex1, l__p)) * 0.2;
    }
    if (l__t <= 0.0001) l__c = l__old;
    if (l__t >= 0.9999) l__c = l__new;

    // 경계를 따라오는 어두운 띠 (새 화면 앞머리)
    float l__px = (l__a + l__e - 1.0) * l__len;
    if (u__band > 0.5 && l__px >= 0.0 && l__px < u__band && l__t > 0.0001 && l__t < 0.9999) {
        vec4 l__bc = vec4(u__band_color.rgb, 1.0) * sign(u__band_color.a);
        float l__hl = 1.0 - smoothstep(0.0, 2.0, abs(l__px - u__band * 0.5));
        l__c = mix(l__c, l__bc, 0.92) + vec4(vec3(l__hl * 0.25), 0.0);
    }

    // 빛: 경계의 빛 줄기와 화면 전체 번쩍임
    float l__dist = abs(l__px) / max(l__len, 1.0);
    float l__beam = exp(-l__dist * 30.0) * u__glow * l__pk;
    float l__flash = u__flare * l__pk * l__pk;
    vec3 l__light = vec3(1.0, 0.97, 0.85) * (l__beam + l__flash);
    l__c.rgb = min(l__c.rgb + l__light * l__c.a, vec3(l__c.a));
    gl_FragColor = l__c;
