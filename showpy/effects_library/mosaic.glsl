// mosaic: 모자이크로 바뀌기: 앞 그림이 굵은 모자이크로 뭉개졌다가 새 그림으로 풀림
// u__size: 가장 굵을 때 모자이크 한 칸의 크기 (픽셀)
// 쓰는 법:  scene bg hall with img_fx.use("mosaic")      scene bg hall with img_fx.use("mosaic", 1.5, size=120)
@transition mosaic 모자이크로 바뀌기
@time 1.0
@set u__size 60.0
@param u__size 4 200 가장 굵을 때 칸 크기
@variables
    uniform float u__size;
@fragment
    float l__k = 1.0 - abs(l__t * 2.0 - 1.0);
    l__k = l__k * l__k * (3.0 - 2.0 * l__k);
    float l__s = mix(1.0, max(u__size, 1.0), l__k);
    vec2 l__cell = vec2(l__s) / l__size;
    vec2 l__q = (floor((l__uv - 0.5) / l__cell) + 0.5) * l__cell + 0.5;
    l__q = l__s > 1.01 ? clamp(l__q, 0.0, 1.0) : l__uv;
    gl_FragColor = mix(texture2D(tex0, l__q), texture2D(tex1, l__q), smoothstep(0.35, 0.65, l__t));
