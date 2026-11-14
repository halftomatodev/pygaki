// slide: 옆으로 밀기: 새 그림이 옆에서 들어오며 앞 그림을 밀어냄
// u__dir: 그림이 움직이는 쪽. 0 왼쪽으로, 1 오른쪽으로, 2 위로, 3 아래로
// 쓰는 법:  scene bg hall with img_fx.use("slide")      scene bg hall with img_fx.use("slide", 0.8, dir=2)
@transition slide 옆으로 밀기
@time 0.6
@set u__dir 0.0
@param u__dir 0 3 방향 (0 왼쪽, 1 오른쪽, 2 위, 3 아래)
@variables
    uniform float u__dir;
@fragment
    float l__e = l__t * l__t * (3.0 - 2.0 * l__t);
    float l__d = floor(u__dir + 0.5);
    vec2 l__v = l__d < 0.5 ? vec2(-1.0, 0.0) : (l__d < 1.5 ? vec2(1.0, 0.0) : (l__d < 2.5 ? vec2(0.0, -1.0) : vec2(0.0, 1.0)));
    vec2 l__a = l__uv - l__v * l__e;
    vec2 l__b = clamp(l__a + l__v, 0.0, 1.0);
    bool l__in = l__e < 0.9999 && l__a == clamp(l__a, 0.0, 1.0);
    gl_FragColor = l__in ? texture2D(tex0, l__a) : texture2D(tex1, l__b);
