// blinds: 가로 블라인드: 가로 줄 여러 개가 한꺼번에 열리며 새 그림이 나옴
// u__count: 줄 수. u__vertical: 1이면 세로 줄. u__soft: 열리는 가장자리의 부드러움
// 쓰는 법:  scene bg hall with img_fx.use("blinds")      scene bg hall with img_fx.use("blinds", 1.0, count=14, vertical=1)
@transition blinds 가로 블라인드
@time 0.8
@set u__count 8.0
@set u__vertical 0.0
@set u__soft 0.1
@param u__count 1 30 줄 수
@param u__vertical 0 1 세로 줄
@param u__soft 0 0.5 가장자리 부드러움
@variables
    uniform float u__count;
    uniform float u__vertical;
    uniform float u__soft;
@fragment
    float l__p = u__vertical > 0.5 ? l__uv.x : l__uv.y;
    float l__n = max(floor(u__count + 0.5), 1.0);
    float l__f = fract(l__p * l__n);
    float l__e = l__t * l__t * (3.0 - 2.0 * l__t);
    float l__r = l__e * (1.0 + u__soft);
    float l__k = 1.0 - smoothstep(l__r - u__soft - 0.001, l__r, l__f);
    gl_FragColor = mix(l__old, l__new, l__k * step(0.0001, l__t));
