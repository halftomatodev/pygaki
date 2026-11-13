// droplets: 물방울: 모양이 일정하지 않은 물방울들이 글자 위를 천천히 돌아다니며, 물방울 아래 글자가 볼록렌즈처럼 커지고 휘어 보임
// 물방울 가장자리는 색이 갈라지고(빨강, 파랑), 위쪽에 빛이 맺힙니다. 물방울끼리 가까워지면 하나로 붙었다 떨어집니다.
// 글자 네모 안에서만 그려서, 글자가 없는 빈 곳에는 물방울이 보이지 않습니다.
// u__fade: 글자가 나타나는 시간(글자 수). u__size: 물방울 크기 (픽셀). u__count: 물방울이 있는 정도 (0~1)
// u__speed: 돌아다니는 빠르기. u__refract: 굴절 (픽셀). u__magnify: 가운데 확대. u__chroma: 가장자리 색 갈라짐 (픽셀)
// u__shine: 빛 맺힘. u__wobble: 물방울 모양이 일렁이는 정도. u__tint: 물방울 색. u__tint_amount: 그 색이 드는 정도
// 쓰는 법:  e "물방울이 지나간다." (cps=30, effect="droplets")      e "크게." (effect="droplets:u__size=40:u__refract=8")
@effect droplets 물방울
@cps
@slow u__fade
@redraw always
@set u__fade 4.0
@set u__size 30.0
@set u__count 0.7
@set u__speed 0.35
@set u__refract 10.0
@set u__magnify 0.6
@set u__chroma 2.0
@set u__shine 0.7
@set u__wobble 0.35
@set u__tint #9fd8ff
@set u__tint_amount 0.25
@param u__fade 0 20 나타나는 시간
@param u__size 6 80 물방울 크기
@param u__count 0 1 물방울 양
@param u__speed 0 2 돌아다니는 빠르기
@param u__refract 0 20 굴절
@param u__magnify 0 1 가운데 확대
@param u__chroma 0 6 색 갈라짐
@param u__shine 0 2 빛 맺힘
@param u__wobble 0 1 모양 일렁임
@param u__tint_amount 0 1 색 드는 정도
@variables
    uniform float u__fade;
    uniform float u__size;
    uniform float u__count;
    uniform float u__speed;
    uniform float u__refract;
    uniform float u__magnify;
    uniform float u__chroma;
    uniform float u__shine;
    uniform float u__wobble;
    uniform vec4 u__tint;
    uniform float u__tint_amount;
    uniform float u_time;
    uniform float u_text_slow_duration;
    uniform float u_text_slow_time;
    uniform float u_text_to_drawable;
    uniform float u_text_main;
    uniform sampler2D tex0;
    uniform vec2 res0;
    attribute float a_text_min_time;
    varying vec2 v_tex_coord;
    varying vec2 v__p;
    varying float v__in;
@vertex_20
    v__p = gl_Position.xy;
    float l__fd = u__fade * u_text_slow_duration;
    v__in = l__fd > 0.0 ? clamp((u_text_slow_time - a_text_min_time) / l__fd, 0.0, 1.0) : (a_text_min_time <= u_text_slow_time ? 1.0 : 0.0);
@fragment_350
    if (u__count > 0.0) {
        float l__s = max(u__size * u_text_to_drawable, 2.0);
        float l__cs = l__s * 2.6;
        vec2 l__p = v__p / l__cs;
        vec2 l__base = floor(l__p);
        float l__t = u_time * u__speed;

        // 칸마다 물방울 하나: 3x3 이웃 칸의 물방울을 모아 하나의 장(메타볼)으로
        float l__field = 0.0;
        vec2 l__grad = vec2(0.0);
        for (int l__j = 0; l__j < 9; l__j++) {
            vec2 l__cell = l__base + vec2(mod(float(l__j), 3.0), floor(float(l__j) / 3.0)) - 1.0;
            float l__h1 = fract(sin(dot(l__cell, vec2(12.9898, 78.233))) * 43758.5453);
            float l__h2 = fract(sin(dot(l__cell, vec2(39.346, 11.135))) * 43758.5453);
            float l__h3 = fract(sin(dot(l__cell, vec2(73.156, 52.235))) * 43758.5453);
            if (l__h3 < u__count) {
                vec2 l__c = l__cell + 0.5 + 0.55 * vec2(sin(l__t * (0.7 + l__h1) + l__h2 * 6.28), cos(l__t * (0.6 + l__h2 * 0.8) + l__h1 * 6.28));
                vec2 l__d = l__p - l__c;
                float l__ang = atan(l__d.y, l__d.x);
                float l__r = (0.22 + 0.16 * l__h1) * (1.0 + u__wobble * 0.35 * sin(l__ang * 3.0 + l__t * 2.0 + l__h2 * 9.0) + u__wobble * 0.2 * sin(l__ang * 5.0 - l__t * 1.3 + l__h1 * 7.0));
                float l__dd = max(dot(l__d, l__d), 0.0004);
                float l__v = l__r * l__r / l__dd;
                l__field += l__v;
                l__grad += -2.0 * l__v / l__dd * l__d;
            }
        }

        // 장이 1을 넘는 곳이 물방울 안. 가장자리로 갈수록 기울기가 커서 많이 휨
        float l__inside = smoothstep(0.92, 1.08, l__field);
        if (l__inside > 0.0) {
            vec2 l__n = l__grad / max(length(l__grad), 0.0001);
            float l__edge = 1.0 - smoothstep(1.0, 2.6, l__field);
            vec2 l__off = -l__n * l__edge * u__refract * u_text_to_drawable;
            vec2 l__lens = -l__n * (1.0 - l__edge) * u__magnify * l__s * 0.6;
            vec2 l__ch = l__n * l__edge * u__chroma * u_text_to_drawable;
            vec2 l__uv = v_tex_coord + (l__off + l__lens) / res0;
            vec4 l__g = texture2D(tex0, l__uv);
            float l__rr = texture2D(tex0, l__uv + l__ch / res0).r;
            float l__bb = texture2D(tex0, l__uv - l__ch / res0).b;
            float l__ra = texture2D(tex0, l__uv + l__ch / res0).a;
            float l__ba = texture2D(tex0, l__uv - l__ch / res0).a;
            vec4 l__w = vec4(l__rr, l__g.g, l__bb, max(l__g.a, max(l__ra, l__ba)));
            // 물방울 색과 빛 맺힘 (글자가 있는 곳에만. 외곽선 겹은 휘기만 함)
            float l__main = u_text_main > 0.5 ? 1.0 : 0.0;
            l__w.rgb = mix(l__w.rgb, u__tint.rgb / max(u__tint.a, 0.001) * l__w.a, u__tint_amount * u__tint.a * l__main);
            float l__spec = pow(max(dot(l__n, normalize(vec2(-0.6, -0.8))), 0.0), 6.0) * l__edge;
            float l__rim = smoothstep(0.75, 1.0, l__edge);
            l__w.rgb *= 1.0 - l__rim * 0.45 * l__main;
            l__w.rgb = min(l__w.rgb + vec3(1.0, 0.92, 0.75) * l__spec * u__shine * l__main * l__w.a, vec3(l__w.a));
            gl_FragColor = mix(gl_FragColor, l__w, l__inside);
        }
    }
    gl_FragColor = gl_FragColor * (v__in > 0.0 ? v__in : 0.0);
