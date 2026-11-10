// bands: 띠로 덮였다 열리기: 색 띠가 차례로 화면을 덮고, 걷히면서 새 그림이 나옴
// u__count: 띠 수. u__stagger: 띠마다 늦게 출발하는 정도 (0이면 한꺼번에). u__color: 띠 색. u__vertical: 1이면 세로 띠
// 쓰는 법:  scene bg hall with img_fx.use("bands")      scene bg hall with img_fx.use("bands", 1.4, count=10, color="#c2185b")
@transition bands 띠로 덮였다 열리기
@time 1.0
@set u__count 6.0
@set u__stagger 0.5
@set u__color #111111
@set u__vertical 0.0
@param u__count 1 20 띠 수
@param u__stagger 0 0.9 띠마다 늦게
@param u__vertical 0 1 세로 띠
@variables
    uniform float u__count;
    uniform float u__stagger;
    uniform vec4 u__color;
    uniform float u__vertical;
@fragment
    vec2 l__p = u__vertical > 0.5 ? l__uv.yx : l__uv;
    float l__n = max(floor(u__count + 0.5), 1.0);
    float l__i = min(floor(l__p.y * l__n), l__n - 1.0);
    float l__lag = clamp(u__stagger, 0.0, 0.95);
    float l__delay = l__n > 1.0 ? l__i / (l__n - 1.0) * l__lag : 0.0;
    float l__a = clamp((l__t * 2.0 - l__delay) / (1.0 - l__lag), 0.0, 1.0);
    float l__b = clamp((l__t * 2.0 - 1.0 - l__delay) / (1.0 - l__lag), 0.0, 1.0);
    l__a = 1.0 - pow(1.0 - l__a, 3.0);
    l__b = 1.0 - pow(1.0 - l__b, 3.0);
    vec4 l__band = vec4(u__color.rgb, 1.0) * u__color.a;
    vec4 l__under = l__band + l__old * (1.0 - l__band.a);
    gl_FragColor = l__p.x < l__b ? l__new : (l__p.x < l__a ? l__under : l__old);
