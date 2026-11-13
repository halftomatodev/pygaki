// tapestretch: 테이프 늘어짐: 비디오테이프가 늘어나듯 화면이 출렁이며 위아래로 늘어지고 색이 번졌다가, 가장 심할 때 새 화면으로 넘어감
// u__wave: 가로 출렁임 (픽셀). u__waves: 화면 위아래에 생기는 물결 수. u__stretch: 위아래로 늘어짐 (0 없음 ~ 1 두 배)
// u__sag: 아래로 처짐. u__bleed: 색 번짐 (픽셀). u__fade: 색이 바래는 정도. u__track: 아래로 흐르는 잡음 띠
// u__cut: 새 화면으로 바뀌는 때 (0~1). 화면 셰이더를 이 전환으로 바꿀 때 셰이더도 이때 바뀝니다
// 쓰는 법:  scene bg hall with img_fx.use("tapestretch")      scene bg hall with img_fx.use("tapestretch", 1.6, wave=60, stretch=0.6)
@transition tapestretch 테이프 늘어짐
@time 1.2
@set u__wave 30.0
@set u__waves 3.0
@set u__stretch 0.35
@set u__sag 0.25
@set u__bleed 10.0
@set u__fade 0.4
@set u__track 0.6
@set u__cut 0.5
@param u__wave 0 120 가로 출렁임
@param u__waves 0.5 12 물결 수
@param u__stretch 0 1 위아래 늘어짐
@param u__sag 0 1 아래로 처짐
@param u__bleed 0 40 색 번짐
@param u__fade 0 1 색 바램
@param u__track 0 1 잡음 띠
@param u__cut 0.05 0.95 바뀌는 때
@variables
    uniform float u__wave;
    uniform float u__waves;
    uniform float u__stretch;
    uniform float u__sag;
    uniform float u__bleed;
    uniform float u__fade;
    uniform float u__track;
    uniform float u__cut;
@fragment
    float l__cut = clamp(u__cut, 0.05, 0.95);
    float l__e = l__t < l__cut ? l__t / l__cut : (1.0 - l__t) / (1.0 - l__cut);
    l__e = l__e * l__e * (3.0 - 2.0 * l__e);
    float l__ph = l__t * 9.0;
    vec2 l__px = vec2(1.0) / max(l__size, vec2(1.0));

    // 위아래로 늘어지고 아래로 처짐 (위쪽은 붙들려 있고 아래로 갈수록 끌려감)
    float l__y = l__uv.y;
    float l__st = 1.0 + u__stretch * l__e;
    float l__yy = l__y / l__st;
    l__yy -= u__sag * l__e * 0.25 * l__y * l__y;
    l__yy += sin(l__y * 3.0 + l__ph) * 0.02 * u__sag * l__e;

    // 가로 출렁임: 큰 물결 + 줄마다 떨림
    float l__row = floor(l__uv.y * l__size.y / 2.0);
    float l__rn = fract(sin(dot(vec2(l__row, floor(l__t * 40.0)), vec2(12.9898, 78.233))) * 43758.5453);
    float l__dx = sin(l__y * 6.2832 * u__waves + l__ph) * u__wave * l__e;
    l__dx += sin(l__y * 31.0 - l__ph * 2.3) * u__wave * 0.18 * l__e;
    l__dx += (l__rn - 0.5) * u__wave * 0.12 * l__e;

    // 아래로 흐르는 잡음 띠
    float l__bp = fract(l__t * 1.7 + 0.2);
    float l__band = 1.0 - smoothstep(0.0, 0.05, abs(l__uv.y - l__bp));
    l__dx += l__band * (l__rn - 0.3) * 60.0 * u__track * l__e;

    vec2 l__s = vec2(l__uv.x - l__dx * l__px.x, l__yy);
    vec2 l__b = vec2(u__bleed * l__e * l__px.x, 0.0);
    vec4 l__c;
    vec4 l__cr;
    vec4 l__cb;
    if (l__t < l__cut) {
        l__c = texture2D(tex0, clamp(l__s, 0.0, 1.0));
        l__cr = texture2D(tex0, clamp(l__s + l__b, 0.0, 1.0));
        l__cb = texture2D(tex0, clamp(l__s - l__b, 0.0, 1.0));
    } else {
        l__c = texture2D(tex1, clamp(l__s, 0.0, 1.0));
        l__cr = texture2D(tex1, clamp(l__s + l__b, 0.0, 1.0));
        l__cb = texture2D(tex1, clamp(l__s - l__b, 0.0, 1.0));
    }
    vec3 l__rgb = vec3(l__cr.r, l__c.g, l__cb.b);
    float l__a = max(l__c.a, max(l__cr.a, l__cb.a));

    // 색 바램과 잡음
    float l__lum = dot(l__rgb, vec3(0.299, 0.587, 0.114));
    l__rgb = mix(l__rgb, vec3(l__lum) * vec3(1.02, 0.98, 1.08), u__fade * l__e);
    float l__n = fract(sin(dot(floor(l__uv * l__size / 2.0) + floor(l__t * 40.0) * 7.3, vec2(12.9898, 78.233))) * 43758.5453);
    l__rgb += (l__n - 0.5) * 0.25 * l__band * u__track * l__e * l__a;
    l__rgb += vec3(l__band * 0.25 * u__track * l__e) * l__a;
    gl_FragColor = vec4(clamp(l__rgb, vec3(0.0), vec3(l__a)), l__a);
