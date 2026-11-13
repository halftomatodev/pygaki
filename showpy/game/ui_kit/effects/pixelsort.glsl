// pixelsort: 픽셀소트로 바뀌기: 밝은 부분이 가로 띠로 길게 늘어나 번지고, 가장 길 때 번쩍이며 새 그림의 띠가 줄어들어 제자리로
// 진짜 정렬이 아니라 "정렬된 것처럼 보이는 띠"입니다. 밝기가 문턱 안에 있는 점이 이어진 구간을, 그 구간의 첫 점 색으로 늘여 그립니다.
// u__length: 가장 길 때 띠 길이 (픽셀). u__low, u__high: 늘어날 밝기 범위 (0 검정 ~ 1 흰색). u__vertical: 1이면 세로 띠
// u__split: 빨강, 파랑이 갈라지는 정도 (픽셀). u__flash: 가운데에서 하얗게 번쩍이는 정도. u__band: 띠 굵기 (픽셀)
// 쓰는 법:  scene bg hall with img_fx.use("pixelsort")      scene bg hall with img_fx.use("pixelsort", 1.6, length=900, low=0.2)
@transition pixelsort 픽셀소트로 바뀌기
@time 1.2
@set u__length 900.0
@set u__low 0.25
@set u__high 1.0
@set u__vertical 0.0
@set u__split 6.0
@set u__flash 0.5
@set u__band 3.0
@param u__length 20 1600 띠 길이
@param u__low 0 1 늘어날 밝기 아래
@param u__high 0 1 늘어날 밝기 위
@param u__vertical 0 1 세로 띠
@param u__split 0 30 색 갈라짐
@param u__flash 0 1 번쩍임
@param u__band 1 20 띠 굵기
@variables
    uniform float u__length;
    uniform float u__low;
    uniform float u__high;
    uniform float u__vertical;
    uniform float u__split;
    uniform float u__flash;
    uniform float u__band;
@fragment
    float l__k = 1.0 - abs(l__t * 2.0 - 1.0);
    l__k = l__k * l__k * (3.0 - 2.0 * l__k);
    bool l__late = l__t >= 0.5;
    bool l__vert = u__vertical > 0.5;
    vec2 l__px = vec2(1.0) / max(l__size, vec2(1.0));
    vec2 l__dir = l__vert ? vec2(0.0, -l__px.y) : vec2(-l__px.x, 0.0);
    float l__line = l__vert ? l__uv.x * l__size.x : l__uv.y * l__size.y;
    float l__rnd = fract(sin(floor(l__line / max(u__band, 1.0)) * 12.9898 + 78.233) * 43758.5453);
    float l__len = u__length * l__k * (0.25 + 0.75 * l__rnd);
    float l__step = max(l__len / 48.0, 1.0);
    float l__lo = min(u__low, u__high);
    float l__hi = max(u__low, u__high);
    vec3 l__w = vec3(0.299, 0.587, 0.114);
    vec4 l__here = l__late ? l__new : l__old;
    float l__y = l__here.a > 0.0 ? dot(l__here.rgb, l__w) / l__here.a : 0.0;
    float l__d = 0.0;
    if (l__len > 0.5 && l__y >= l__lo && l__y <= l__hi) {
        for (int l__i = 1; l__i <= 48; l__i++) {
            float l__s = float(l__i) * l__step;
            if (l__s > l__len) break;
            vec2 l__q = l__uv + l__dir * l__s;
            if (l__q.x < 0.0 || l__q.y < 0.0) break;
            vec4 l__c = l__late ? texture2D(tex1, l__q) : texture2D(tex0, l__q);
            float l__cy = l__c.a > 0.0 ? dot(l__c.rgb, l__w) / l__c.a : 0.0;
            if (l__cy < l__lo || l__cy > l__hi) break;
            l__d = l__s;
        }
    }
    vec2 l__q0 = clamp(l__uv + l__dir * l__d, 0.0, 1.0);
    vec2 l__off = -normalize(l__dir) * l__px * u__split * l__k;
    vec2 l__qr = clamp(l__q0 + l__off, 0.0, 1.0);
    vec2 l__qb = clamp(l__q0 - l__off, 0.0, 1.0);
    vec4 l__col;
    if (l__late) {
        l__col = texture2D(tex1, l__q0);
        l__col.r = texture2D(tex1, l__qr).r;
        l__col.b = texture2D(tex1, l__qb).b;
    } else {
        l__col = texture2D(tex0, l__q0);
        l__col.r = texture2D(tex0, l__qr).r;
        l__col.b = texture2D(tex0, l__qb).b;
    }
    l__col.rgb = min(l__col.rgb, vec3(l__col.a));
    l__col.rgb = mix(l__col.rgb, vec3(l__col.a), clamp(u__flash, 0.0, 1.0) * pow(l__k, 40.0));
    gl_FragColor = l__col;
