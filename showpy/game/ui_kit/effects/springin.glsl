// springin: 튕기며 들어오기: 화면 밖에서 들어와 자리를 조금 지나쳤다가 되돌아오며 멈춤 (스프링 움직임)
// u__angle: 들어오는 쪽 각도 (0 오른쪽, 90 위, 180 왼쪽, 270 아래, 그 사이는 대각선)
// u__dist: 오는 거리 (1이면 어느 각도든 화면 밖에서). u__bounce: 튕김 (0이면 안 넘음). u__wobble: 흔들림 횟수
// u__only: 1이면 새로 생긴 부분만(앞 화면과 다른 곳, 보통 새로 나온 캐릭터) 움직이고 배경은 그대로, 0이면 새 화면을 통째로 밂
// 쓰는 법:  show mina with img_fx.use("springin")      show mina with img_fx.use("springin", 0.9, angle=45, bounce=0.7)
//           scene bg hall with img_fx.use("springin", 1.0, angle=270, only=0)
@transition springin 튕기며 들어오기
@time 0.9
@set u__angle 180.0
@set u__dist 1.0
@set u__bounce 0.6
@set u__wobble 1.5
@set u__only 1.0
@param u__angle 0 360 들어오는 각도 (0 오른쪽, 90 위, 180 왼쪽, 270 아래)
@param u__dist 0.1 1.2 거리 (1이면 화면 밖에서)
@param u__bounce 0 0.9 튕김
@param u__wobble 0.5 4 흔들림 횟수
@param u__only 0 1 새로 생긴 부분만 (1) / 통째로 (0)
@variables
    uniform float u__angle;
    uniform float u__dist;
    uniform float u__bounce;
    uniform float u__wobble;
    uniform float u__only;
@fragment
    // 감쇠 스프링: 1 - e^(-z w t) (cos(wd t) + z w / wd sin(wd t))
    float l__z = clamp(1.0 - u__bounce, 0.05, 0.98);
    float l__wd = 6.2831853 * max(u__wobble, 0.1);
    float l__w = l__wd / sqrt(1.0 - l__z * l__z);
    float l__x = 1.0 - exp(-l__z * l__w * l__t) * (cos(l__wd * l__t) + l__z * l__w / l__wd * sin(l__wd * l__t));
    l__x = mix(l__x, 1.0, smoothstep(0.8, 1.0, l__t));
    // 들어오는 쪽 (화면 위가 0인 자리라 세로는 뒤집음). 대각선도 1이면 화면을 다 벗어나게 늘림
    float l__r = radians(u__angle);
    vec2 l__v = vec2(cos(l__r), -sin(l__r));
    l__v /= max(max(abs(l__v.x), abs(l__v.y)), 0.0001);
    vec2 l__a = l__uv - l__v * (1.0 - l__x) * u__dist;
    bool l__in = l__a == clamp(l__a, 0.0, 1.0);
    vec4 l__n = l__in ? texture2D(tex1, l__a) : vec4(0.0);
    vec4 l__o = l__in ? texture2D(tex0, l__a) : vec4(0.0);
    // 새로 생긴 부분: 같은 자리의 앞 화면과 다른 곳
    float l__m = smoothstep(0.02, 0.08, length(l__n - l__o));
    l__m = l__in ? mix(1.0, l__m, step(0.5, u__only)) : 0.0;
    gl_FragColor = l__t >= 0.9999 ? l__new : mix(l__old, l__n, l__m);
