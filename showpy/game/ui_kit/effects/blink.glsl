// blink: 점멸: 고른 색으로 화면이 몇 번 깜빡이고, 그사이에 새 화면으로 바뀜
// 걸리는 시간 동안 u__count번 고르게 깜빡입니다. 시간은 img_fx.use("blink", 1.5)처럼 두 번째 칸에 적습니다.
// u__color: 깜빡이는 색. u__count: 깜빡이는 횟수. u__on: 한 번 깜빡일 때 켜져 있는 비율 (0~1)
// u__fade: 0이면 뚝 켜고 뚝 끔, 1이면 켜진 뒤 서서히 꺼짐. u__strength: 색이 덮는 정도 (1이면 화면이 다 가려짐)
// u__cut: 새 화면으로 바뀌는 때 (0~1). 깜빡이는 순간에 맞추면 바뀌는 게 안 보입니다 (3번이면 0.5가 가운데 깜빡임)
// 쓰는 법:  scene bg hall with img_fx.use("blink")      scene bg hall with img_fx.use("blink", 1.2, count=5, color="#ff0000", cut=0.5)
@transition blink 점멸
@time 1.0
@set u__color #ffffff
@set u__count 3.0
@set u__on 0.5
@set u__fade 0.0
@set u__strength 1.0
@set u__cut 0.5
@param u__count 1 12 횟수
@param u__on 0.05 1 켜져 있는 비율
@param u__fade 0 1 서서히 꺼짐
@param u__strength 0 1 덮는 정도
@param u__cut 0 1 바뀌는 때
@variables
    uniform vec4 u__color;
    uniform float u__count;
    uniform float u__on;
    uniform float u__fade;
    uniform float u__strength;
    uniform float u__cut;
@fragment
    float l__n = max(floor(u__count + 0.5), 1.0);
    float l__k = fract(l__t * l__n) - 0.5;
    float l__w = clamp(u__on, 0.01, 1.0) * 0.5;
    float l__in = abs(l__k) <= l__w ? 1.0 : 0.0;
    float l__decay = clamp(1.0 - (l__k + l__w) / max(2.0 * l__w, 0.001), 0.0, 1.0);
    float l__i = l__in * mix(1.0, l__decay, clamp(u__fade, 0.0, 1.0)) * clamp(u__strength, 0.0, 1.0);
    l__i *= step(0.0001, l__t) * step(l__t, 0.9999);
    vec4 l__base = l__t < u__cut ? l__old : l__new;
    gl_FragColor = l__base * (1.0 - l__i * u__color.a) + u__color * l__i;
