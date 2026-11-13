// pixelsort: 픽셀소트 (크래시): 지금 화면의 밝은 부분이 띠로 길게 늘어나며 깨지고, 깨진 채 멈췄다가 다음 화면으로 뚝 끊어 넘어감
// 진짜 정렬이 아니라 "정렬된 것처럼 보이는 띠"입니다. 밝기가 문턱 안에 있는 점이 이어진 구간을, 그 구간의 첫 점 색으로 늘여 그립니다.
// 다음 화면과 섞지 않습니다. 시간의 앞쪽(u__crash)에 띠가 늘어나고, 나머지는 멈춰 있다가 u__cut에 새 화면으로 바뀝니다.
// u__dir: 띠 방향. 0 가로, 1 세로, 2 회전 (가운데를 도는 원), 3 확산 (가운데에서 바깥으로). u__length: 가장 길 때 띠 길이 (픽셀)
// u__low, u__high: 늘어날 밝기 범위 (0 검정 ~ 1 흰색). u__split: 빨강, 파랑이 갈라지는 정도 (픽셀). u__band: 띠 굵기 (픽셀)
// u__crash: 띠가 늘어나는 데 쓰는 시간의 비율 (나머지는 멈춤). u__cut: 새 화면으로 끊는 때 (0~1). 화면 셰이더를 이 전환으로 바꿀 때 셰이더도 이때 바뀝니다
// 쓰는 법:  scene bg hall with img_fx.use("pixelsort")      scene bg hall with img_fx.use("pixelsort", 1.5, dir=3, length=600)
@transition pixelsort 픽셀소트 (크래시)
@time 1.4
@set u__dir 0.0
@set u__length 420.0
@set u__low 0.35
@set u__high 1.0
@set u__split 6.0
@set u__band 3.0
@set u__crash 0.4
@set u__cut 1.0
@param u__dir 0 3 방향 (가로·세로·회전·확산)
@param u__length 20 1600 띠 길이
@param u__low 0 1 늘어날 밝기 아래
@param u__high 0 1 늘어날 밝기 위
@param u__split 0 30 색 갈라짐
@param u__band 1 20 띠 굵기
@param u__crash 0.05 1 깨지는 시간 비율
@variables
    uniform float u__dir;
    uniform float u__length;
    uniform float u__low;
    uniform float u__high;
    uniform float u__split;
    uniform float u__band;
    uniform float u__crash;
    uniform float u__cut;
@fragment
    float l__k = smoothstep(0.0, max(u__crash, 0.01), l__t);
    float l__mode = floor(clamp(u__dir, 0.0, 3.0) + 0.5);
    vec2 l__px = vec2(1.0) / max(l__size, vec2(1.0));
    vec2 l__pp = l__uv * l__size;
    vec2 l__cp = 0.5 * l__size;
    vec2 l__rel = l__pp - l__cp;
    float l__rad = length(l__rel);
    float l__th = atan(l__rel.y, l__rel.x);
    float l__line = l__mode < 0.5 ? l__pp.y : l__mode < 1.5 ? l__pp.x : l__mode < 2.5 ? l__rad : l__th * 300.0;
    float l__rnd = fract(sin(floor(l__line / max(u__band, 1.0)) * 12.9898 + 78.233) * 43758.5453);
    float l__len = u__length * l__k * (0.25 + 0.75 * l__rnd);
    float l__step = max(l__len / 48.0, 1.0);
    float l__lo = min(u__low, u__high);
    float l__hi = max(u__low, u__high);
    vec3 l__w = vec3(0.299, 0.587, 0.114);
    float l__y = l__old.a > 0.0 ? dot(l__old.rgb, l__w) / l__old.a : 0.0;
    vec2 l__end = l__uv;
    vec2 l__tan = vec2(1.0, 0.0);
    if (l__len > 0.5 && l__y >= l__lo && l__y <= l__hi) {
        for (int l__i = 1; l__i <= 48; l__i++) {
            float l__s = float(l__i) * l__step;
            if (l__s > l__len) break;
            vec2 l__qp;
            if (l__mode < 0.5) {
                l__qp = l__pp - vec2(l__s, 0.0);
            } else if (l__mode < 1.5) {
                l__qp = l__pp - vec2(0.0, l__s);
            } else if (l__mode < 2.5) {
                float l__a = l__th - l__s / max(l__rad, 8.0);
                l__qp = l__cp + l__rad * vec2(cos(l__a), sin(l__a));
            } else {
                float l__rr = l__rad - l__s;
                if (l__rr < 0.0) break;
                l__qp = l__cp + l__rr * vec2(cos(l__th), sin(l__th));
            }
            vec2 l__q = l__qp * l__px;
            if (l__q.x < 0.0 || l__q.y < 0.0 || l__q.x > 1.0 || l__q.y > 1.0) break;
            vec4 l__c = texture2D(tex0, l__q);
            float l__cy = l__c.a > 0.0 ? dot(l__c.rgb, l__w) / l__c.a : 0.0;
            if (l__cy < l__lo || l__cy > l__hi) break;
            l__end = l__q;
        }
    }
    vec2 l__sd = l__mode < 0.5 ? vec2(1.0, 0.0) : l__mode < 1.5 ? vec2(0.0, 1.0) : l__mode < 2.5 ? vec2(-sin(l__th), cos(l__th)) : vec2(cos(l__th), sin(l__th));
    vec2 l__off = l__sd * l__px * u__split * l__k;
    vec4 l__col = texture2D(tex0, l__end);
    l__col.r = texture2D(tex0, clamp(l__end + l__off, 0.0, 1.0)).r;
    l__col.b = texture2D(tex0, clamp(l__end - l__off, 0.0, 1.0)).b;
    l__col.rgb = min(l__col.rgb, vec3(l__col.a));
    gl_FragColor = l__t >= min(u__cut, 1.0) ? l__new : l__col;
