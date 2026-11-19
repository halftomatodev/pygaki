// bendwave: 물결로 넘기기: 한 점(또는 화면 아래·왼쪽 끝)에서 색 물결이 퍼지며 화면을 렌즈처럼 휘게 하고, 물결이 지나간 자리에 새 그림이 나옴
// u__type: 퍼지는 꼴 (0 고리, 가운데 점에서 둥글게 / 1 세로, 아래 끝에서 위로 / 2 가로, 왼쪽 끝에서 오른쪽으로)
// u__x, u__y: 물결이 시작하는 자리 (0~1). 고리는 그 점, 세로는 아래 끝의 가로 자리(u__x), 가로는 왼쪽 끝의 세로 자리(u__y)
// u__bend: 세로·가로일 때 물결 앞머리가 시작 자리 쪽으로 둥글게 솟는 정도 (0이면 곧은 줄)
// u__width: 물결 띠의 두께 (화면 대비). u__amount: 휘는 세기 (픽셀). u__split: 색이 갈라지는 정도 (0 없음)
// u__glow: 물결 테두리 빛의 세기. u__rim: 테두리 빛 두께. u__colorful: 0이면 u__color 한 색, 1이면 무지개. u__hue: 무지개 색을 돌림 (0~1)
// u__wait: 물결이 나가기 전에 시작 자리 쪽으로 화면이 살짝 빨려 드는 시간 (전체의 비율)
// 쓰는 법:  scene bg hall with img_fx.use("bendwave")      scene bg hall with img_fx.use("bendwave", 1.4, type=1, x=0.5)
//           show mina with img_fx.use("bendwave", 1.0, x=0.3, y=0.6, colorful=0, color="#38bdf8")
@transition bendwave 물결로 넘기기
@time 1.2
@set u__type 0.0
@set u__x 0.5
@set u__y 0.5
@set u__bend 0.6
@set u__width 0.22
@set u__amount 40.0
@set u__split 0.35
@set u__glow 0.8
@set u__rim 0.3
@set u__colorful 1.0
@set u__color #7dd3fc
@set u__hue 0.0
@set u__wait 0.12
@param u__type 0 2 꼴 (0 고리, 1 세로, 2 가로)
@param u__x 0 1 시작 가로
@param u__y 0 1 시작 세로
@param u__bend 0 2 앞머리 솟음
@param u__width 0.05 0.6 물결 두께
@param u__amount 0 150 휘는 세기
@param u__split 0 1 색 갈라짐
@param u__glow 0 2 테두리 빛
@param u__rim 0.05 1 빛 두께
@param u__colorful 0 1 무지개
@param u__hue 0 1 색 돌리기
@param u__wait 0 0.4 빨려 드는 시간
@variables
    uniform float u__type;
    uniform float u__x;
    uniform float u__y;
    uniform float u__bend;
    uniform float u__width;
    uniform float u__amount;
    uniform float u__split;
    uniform float u__glow;
    uniform float u__rim;
    uniform float u__colorful;
    uniform vec4 u__color;
    uniform float u__hue;
    uniform float u__wait;
@fragment
    vec2 l__px = l__uv * l__size;
    float l__asp = l__size.x / max(l__size.y, 1.0);
    vec2 l__src = vec2(u__x, u__y);
    float l__d = 0.0;
    vec2 l__dir = vec2(0.0, -1.0);
    float l__along = 0.0;

    // 시작 자리에서 이 점까지의 거리 (0~1로 맞춤)와 물결이 나아가는 쪽
    if (u__type < 0.5) {
        vec2 l__v = l__px - l__src * l__size;
        float l__far = length(max(l__src, 1.0 - l__src) * l__size);
        l__d = length(l__v) / max(l__far, 1.0);
        l__dir = l__v / max(length(l__v), 0.001);
        l__along = atan(l__v.y, l__v.x) / 6.28318;
    } else if (u__type < 1.5) {
        float l__bx = (l__uv.x - u__x) * l__asp;
        float l__mx = max(u__x, 1.0 - u__x) * l__asp;
        l__d = ((1.0 - l__uv.y) + u__bend * 0.5 * l__bx * l__bx) / (1.0 + u__bend * 0.5 * l__mx * l__mx);
        l__dir = normalize(vec2(u__bend * l__bx, -1.0));
        l__along = l__uv.x;
    } else {
        float l__by = (l__uv.y - u__y) / l__asp;
        float l__my = max(u__y, 1.0 - u__y) / l__asp;
        l__d = (l__uv.x + u__bend * 0.5 * l__by * l__by) / (1.0 + u__bend * 0.5 * l__my * l__my);
        l__dir = normalize(vec2(1.0, u__bend * l__by));
        l__along = l__uv.y;
    }

    // 진행: 처음 u__wait 동안은 빨려 들기만, 그 뒤에 물결이 끝까지 나감
    float l__wt = clamp(u__wait, 0.0, 0.6);
    float l__tt = clamp((l__t - l__wt) / max(1.0 - l__wt, 0.001), 0.0, 1.0);
    float l__e = l__tt * l__tt * (3.0 - 2.0 * l__tt);
    float l__w = max(u__width, 0.01);
    float l__r = mix(-l__w, 1.0 + l__w, l__e);
    float l__x = clamp((l__d - l__r) / l__w, -1.0, 1.0);

    // 렌즈: 물결 띠 안에서 나아가는 쪽으로 밀었다 당김. 빨려 들기는 시작 자리 가까운 곳만
    float l__lens = sin(l__x * 3.14159) * (1.0 - abs(l__x));
    float l__suck = sin(clamp(l__t / max(l__wt, 0.001), 0.0, 1.0) * 3.14159) * step(0.001, l__wt) * (1.0 - smoothstep(0.0, 0.5, l__d)) * 0.35;
    vec2 l__off = -l__dir * (u__amount * l__lens + u__amount * l__suck) / l__size;
    float l__ab = clamp(u__split, 0.0, 1.0) * abs(l__lens);
    vec2 l__o1 = l__off * (1.0 + l__ab);
    vec2 l__o2 = l__off * (1.0 - l__ab);

    vec4 l__oc = texture2D(tex0, clamp(l__uv + l__off, 0.0, 1.0));
    l__oc.r = texture2D(tex0, clamp(l__uv + l__o1, 0.0, 1.0)).r;
    l__oc.b = texture2D(tex0, clamp(l__uv + l__o2, 0.0, 1.0)).b;
    vec4 l__nc = texture2D(tex1, clamp(l__uv + l__off, 0.0, 1.0));
    l__nc.r = texture2D(tex1, clamp(l__uv + l__o1, 0.0, 1.0)).r;
    l__nc.b = texture2D(tex1, clamp(l__uv + l__o2, 0.0, 1.0)).b;
    // 색을 갈라 읽으면 투명도를 넘을 수 있어 맞춤 (투명도를 곱한 색)
    l__oc.rgb = min(l__oc.rgb, vec3(l__oc.a));
    l__nc.rgb = min(l__nc.rgb, vec3(l__nc.a));

    // 물결 안쪽(지나간 자리)은 새 그림
    float l__k = 1.0 - smoothstep(-0.35, 0.35, (l__d - l__r) / l__w);
    vec4 l__col = mix(l__oc, l__nc, l__k);

    // 테두리 빛: 무지개(자리와 시간으로 색이 흐름) 또는 한 색. 끝날 때는 사라짐
    float l__rw = max(u__rim, 0.02);
    float l__q = (l__d - l__r) / (l__w * l__rw);
    float l__ring = exp(-l__q * l__q) * (1.0 - smoothstep(0.85, 1.0, l__tt)) * step(0.0001, l__tt);
    vec3 l__rain = 0.5 + 0.5 * cos(6.28318 * (l__along + l__tt * 0.6 + u__hue + vec3(0.0, 0.33, 0.67)));
    vec3 l__one = u__color.rgb / max(u__color.a, 0.001);
    vec3 l__rc = mix(l__one, l__rain, clamp(u__colorful, 0.0, 1.0));
    l__col.rgb = min(l__col.rgb + l__rc * l__ring * u__glow * l__col.a, vec3(l__col.a));

    gl_FragColor = mix(l__old, mix(l__col, l__new, step(1.0, l__t)), step(0.0001, l__t));
