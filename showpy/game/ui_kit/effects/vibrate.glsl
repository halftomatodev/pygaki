// vibrate: 진동: 새 그림이 부르르 떨면서 나타나고 점점 잦아들어 제자리에 멈춤
// u__amount: 떨리는 폭(픽셀). u__count: 그동안 떨리는 횟수. u__dir: 0 가로세로 모두, 1 가로만, 2 세로만
// u__decay: 잦아드는 정도. 1이면 끝에서 멈추고, 0이면 끝까지 같은 세기로 떨다가 제자리로
// 쓰는 법:  show mina with img_fx.use("vibrate")      scene bg hall with img_fx.use("vibrate", 0.8, amount=20, dir=1)
//           글 상자: e "쾅!" (box="media", media="images/say/boom.png", media_link=True, media_fx="vibrate")
@transition vibrate 진동
@time 0.6
@set u__amount 12.0
@set u__count 9.0
@set u__dir 0.0
@set u__decay 1.0
@param u__amount 1 60 떨리는 폭 (픽셀)
@param u__count 2 30 떨리는 횟수
@param u__dir 0 2 방향 (0 모두, 1 가로, 2 세로)
@param u__decay 0 1 잦아드는 정도 (1 끝에서 멈춤, 0 끝까지 같게)
@variables
    uniform float u__amount;
    uniform float u__count;
    uniform float u__dir;
    uniform float u__decay;
@fragment
    float l__k = mix(1.0, (1.0 - l__t) * (1.0 - l__t), clamp(u__decay, 0.0, 1.0));
    float l__w = l__t * u__count * 6.2831853;
    vec2 l__o = vec2(sin(l__w), sin(l__w * 1.37 + 1.3)) * u__amount * l__k;
    float l__d = floor(u__dir + 0.5);
    if (l__d > 0.5 && l__d < 1.5) l__o.y = 0.0;
    if (l__d > 1.5) l__o.x = 0.0;
    vec2 l__a = l__uv - l__o / max(l__size, vec2(1.0));
    vec4 l__n = l__a == clamp(l__a, 0.0, 1.0) ? texture2D(tex1, l__a) : vec4(0.0);
    // 앞 그림은 처음 조금 동안 사라짐 (새 그림은 바로 보이며 떨림)
    float l__f = smoothstep(0.0, 0.18, l__t);
    gl_FragColor = l__t >= 0.9999 ? l__new : mix(l__old, l__n, l__f);
