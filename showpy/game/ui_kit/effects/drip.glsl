// drip: 녹아내리기: 글자가 나온 뒤 촛농이나 물감처럼 아래로 줄줄 흘러내림. 기둥마다 흘러내리는 길이가 다름
// 렌파이는 글자를 하나씩 네모로 그려서, 글자 네모를 아래로 u__length배만큼 늘려 그 안에서 흘러내립니다 (아랫줄과 겹칠 수 있음).
// u__fade: 글자가 나타나는 시간(글자 수). u__melt: 다 녹는 데 걸리는 시간(글자 수, 대사가 다 나온 뒤에도 이만큼 더 녹음)
// u__length: 가장 길게 흘러내린 길이 (글자 높이의 몇 배). u__width: 흘러내리는 줄기 굵기 (픽셀). u__keep: 위쪽이 녹지 않고 남는 정도 (0~1)
// u__color: 흘러내린 부분의 색. u__tint: 그 색이 드는 정도 (0이면 글자 색 그대로). u__flow: 0보다 크면 다 녹은 뒤에도 천천히 계속 흐름
// 쓰는 법:  e "녹아내린다." (cps=20, effect="drip")      e "피처럼." (cps=20, effect="drip:u__color=#b00020:u__tint=0.8:u__length=1.5")
@effect drip 녹아내리기
@cps
@slow u__melt
@redraw u__flow
@set u__fade 3.0
@set u__melt 40.0
@set u__length 1.0
@set u__width 8.0
@set u__keep 0.35
@set u__color #c00018
@set u__tint 0.0
@set u__flow 0.0
@param u__fade 0 20 나타나는 시간
@param u__melt 5 200 녹는 시간
@param u__length 0.1 3 흘러내리는 길이
@param u__width 2 30 줄기 굵기
@param u__keep 0 0.9 위쪽 남김
@param u__tint 0 1 색 드는 정도
@param u__flow 0 1 계속 흐름
@variables
    uniform float u__fade;
    uniform float u__melt;
    uniform float u__length;
    uniform float u__width;
    uniform float u__keep;
    uniform vec4 u__color;
    uniform float u__tint;
    uniform float u__flow;
    uniform float u_time;
    uniform float u_text_slow_duration;
    uniform float u_text_slow_time;
    uniform float u_text_to_drawable;
    uniform sampler2D tex0;
    uniform vec2 res0;
    attribute float a_text_min_time;
    attribute vec4 a_text_pos_rect;
    attribute float a_text_pseudo_glyph;
    varying vec2 v_tex_coord;
    varying vec2 v__q;
    varying vec4 v__rect;
    varying float v__in;
    varying float v__melt;
    varying float v__seed;
@vertex_20
    float l__ext = a_text_pseudo_glyph > 0.5 ? 0.0 : a_text_pos_rect.w * max(u__length, 0.0);
    float l__bottom = gl_Position.y > a_text_pos_rect.y + a_text_pos_rect.w * 0.5 ? 1.0 : 0.0;
    gl_Position.y += l__ext * l__bottom;
    v__q = gl_Position.xy - a_text_pos_rect.xy;
    v__rect = a_text_pos_rect;
    v__seed = fract(sin(a_text_pos_rect.x * 0.0137 + a_text_pos_rect.y * 0.0711) * 43758.5453);
    float l__fd = u__fade * u_text_slow_duration;
    v__in = l__fd > 0.0 ? clamp((u_text_slow_time - a_text_min_time) / l__fd, 0.0, 1.0) : (a_text_min_time <= u_text_slow_time ? 1.0 : 0.0);
    float l__md = u__melt * u_text_slow_duration;
    v__melt = l__md > 0.0 ? clamp((u_text_slow_time - a_text_min_time) / l__md, 0.0, 1.0) : (a_text_min_time <= u_text_slow_time ? 1.0 : 0.0);
@vertex_250
    v_tex_coord.y += l__ext * l__bottom / max(res0.y, 1.0);
@fragment_350
    float l__h = max(v__rect.w, 1.0);
    float l__w = max(u__width * u_text_to_drawable, 1.0);
    float l__x = v__q.x / l__w + v__seed * 37.0;
    float l__i = floor(l__x);
    float l__cx = (l__i + 0.5 - v__seed * 37.0) * l__w;
    // 줄기마다 다른 길이: 몇 줄기만 길게
    float l__ha = fract(sin(l__i * 12.9898 + 4.1) * 43758.5453);
    float l__n = pow(smoothstep(0.25, 1.0, l__ha), 1.5);
    float l__go = v__melt;
    l__go = l__go * l__go * (3.0 - 2.0 * l__go);
    float l__ooze = u__flow > 0.0 ? 0.25 * u__flow * (0.5 + 0.5 * sin(u_time * 0.8 + l__i * 1.7)) : 0.0;
    float l__d = (l__go + l__ooze) * l__n * l__h * max(u__length, 0.0);
    float l__inx = step(0.0, v__q.x) * step(v__q.x, v__rect.z);

    // 1) 몸통은 살짝 처짐: 위쪽 keep만큼은 그대로, 그 아래는 조금 늘어남
    float l__k = clamp(u__keep, 0.0, 0.95) * l__h;
    float l__y = v__q.y;
    float l__sag = l__go * l__h * max(u__length, 0.0) * 0.12 * (0.5 + l__n);
    float l__src = l__y <= l__k ? l__y : l__k + (l__y - l__k) * (l__h - l__k) / (l__h - l__k + l__sag);
    vec4 l__c = vec4(0.0);
    if (l__src >= 0.0 && l__src <= l__h) {
        l__c = texture2D(tex0, (v__rect.xy + vec2(v__q.x, l__src)) / res0) * l__inx;
    }

    // 2) 줄기: 이 기둥 가운데의 맨 아래 획 끝(처진 자리)을 찾아, 거기서 아래로 이어진 줄기와 끝의 방울
    vec4 l__drop = vec4(0.0);
    float l__wet = 0.0;
    if (l__d > 0.5 && l__cx >= 0.0 && l__cx <= v__rect.z) {
        float l__yb = -1.0;
        vec4 l__ink = vec4(0.0);
        for (int l__j = 0; l__j < 20; l__j++) {
            float l__yy = l__h * (1.0 - (float(l__j) + 0.5) / 20.0);
            vec4 l__a = texture2D(tex0, (v__rect.xy + vec2(l__cx, l__yy)) / res0);
            if (l__yb < 0.0 && l__a.a > 0.4 && l__yy > l__k) {
                l__yb = l__yy;
                l__ink = l__a;
            }
        }
        if (l__yb > 0.0) {
            float l__top = l__k + (l__yb - l__k) * (l__h - l__k + l__sag) / (l__h - l__k);
            float l__s = (l__y - l__top) / l__d;
            float l__hw = l__w * 0.5 * mix(0.75, 0.3, clamp(l__s, 0.0, 1.0));
            float l__m = (l__s >= -0.05 && l__s <= 1.0) ? 1.0 - smoothstep(l__hw - 1.0, l__hw, abs(v__q.x - l__cx)) : 0.0;
            float l__br = l__w * 0.42;
            float l__bulb = 1.0 - smoothstep(l__br - 1.0, l__br, length(vec2(v__q.x - l__cx, (l__y - l__top - l__d) * 0.85)));
            l__m = max(l__m, l__bulb);
            l__drop = l__ink * l__m;
            l__wet = l__m;
        }
    }
    l__c = l__c + l__drop * (1.0 - l__c.a);

    // 흘러내린 부분에 색 들이기
    float l__body = clamp((l__y - l__k) / max(l__h - l__k, 1.0), 0.0, 1.0) * step(0.001, l__go);
    float l__tt = clamp(u__tint, 0.0, 1.0) * max(smoothstep(0.3, 1.0, l__body) * 0.7, l__wet) * u__color.a;
    l__c.rgb = mix(l__c.rgb, u__color.rgb / max(u__color.a, 0.001) * l__c.a, l__tt);
    gl_FragColor = l__c * (v__in > 0.0 ? v__in : 0.0);
