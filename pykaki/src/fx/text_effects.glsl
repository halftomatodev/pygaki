// UI Kit — 대사 등장 효과의 셰이더 (showpy와 PyKaki가 같이 씀)
//
// 이 파일 하나에 효과의 셰이더 코드를 적으면, 렌파이(ui_kit/engine/text_effects.rpy가
// init에서 읽어 renpy.register_textshader로 등록)와 PyKaki(효과 미리보기를 WebGL로 그림)가
// 같은 코드를 씁니다. PyKaki 저장소에는 사본(src/fx/text_effects.glsl)이 있고,
// PyKaki에서 npm run sync-shaders를 하면 이 파일을 복사해 갑니다.
//
// 적는 법 (@로 시작하는 줄이 표시, 들여 쓴 줄이 GLSL 코드, 맨 앞에서 시작하는 // 줄은 설명)
//
//   @part 이름              여러 효과가 같이 쓰는 코드 조각. 효과 안에서 @use 이름으로 넣음
//   @effect 이름 한글이름    효과 하나의 시작. 대사 괄호에 effect="이름"으로 씀
//   @cps                    글자가 하나씩 나와야 보이는 효과. PyKaki가 글자/초를 비우면 30으로 내보냄
//   @slow 식                다 나온 뒤 더 기다릴 시간(글자 수). 예: u__duration, u__spread + u__fade
//   @redraw always          계속 다시 그림 (멈춰 있어도 움직이는 효과)
//   @redraw u__hold         u__hold가 0보다 크면 계속 다시 그림
//   @outline 굵기 색 x y     글자 뒤에 깔 외곽선 겹 (echo의 복사본). 대사에 외곽선을 따로 안 적었을 때만
//   @set u__이름 값          값의 기본값. 대사에서 effect="이름:u__이름=값"으로 바꿈
//   @variables              uniform, attribute, varying 줄
//   @vertex_30, @fragment_350 ...   렌파이 셰이더 조각. 숫자가 작은 것부터 이어 붙음
//
// 코드 안의 RAND(1.0)은 글자마다 다른 0~1 값입니다 (글자 번호로 정해져서 볼 때마다 같음).
// u__, l__, v__로 시작하는 이름은 렌파이가 효과마다 다른 이름으로 바꿔 줍니다.
// 쓸 수 있는 렌파이 값: a_text_index, a_text_center(글자 밑줄 자리), a_text_min_time,
// a_text_time, u_text_slow_time, u_text_slow_duration, u_text_to_drawable, u_text_main,
// u_text_depth, u_time, tex0, res0, v_tex_coord, gl_Position, gl_FragCoord, gl_FragColor

@part T
    float l__dur = u__duration * u_text_slow_duration;
    float l__t;
    if (l__dur > 0.0) {
        l__t = clamp((u_text_slow_time - a_text_min_time) / l__dur, 0.0, 1.0);
    } else {
        l__t = a_text_min_time <= u_text_slow_time ? 1.0 : 0.0;
    }

@part ROTATE
    vec2 l__p = (gl_Position.xy - a_text_center) * l__scale;
    float l__c = cos(l__ang);
    float l__s = sin(l__ang);
    gl_Position.xy = a_text_center + vec2(l__p.x * l__c - l__p.y * l__s, l__p.x * l__s + l__p.y * l__c);

@part STREAK
    vec4 l__best = texture2D(tex0, l__uv);
    for (int l__k = 1; l__k <= 10; l__k++) {
        vec4 l__s = texture2D(tex0, l__uv - l__dir * float(l__k) / 10.0);
        l__best = l__s.a > l__best.a ? mix(l__s, l__best, float(l__k) / 14.0) : l__best;
    }
    gl_FragColor = l__best;

// scatter: 흩어졌다 모이기: 여기저기 돌아간 채 흩어져 있다가 제자리로
@effect scatter 흩어졌다 모이기
@cps
@slow u__duration
@set u__duration 12.0
@set u__distance 90.0
@variables
    uniform float u__duration;
    uniform float u__distance;
    uniform float u_text_slow_duration;
    uniform float u_text_slow_time;
    uniform float u_text_to_drawable;
    attribute float a_text_min_time;
    attribute float a_text_index;
    attribute vec2 a_text_center;
    varying float v_tfx_scatter;
@vertex_30
@use T
    float l__e = 1.0 - pow(1.0 - l__t, 3.0);
    float l__ang = (RAND(1.0) * 2.0 - 1.0) * 3.14159 * (1.0 - l__e);
    float l__scale = 1.0;
@use ROTATE
    vec2 l__off = vec2(RAND(2.0), RAND(3.0)) * 2.0 - 1.0;
    gl_Position.xy += l__off * u__distance * u_text_to_drawable * (1.0 - l__e);
    v_tfx_scatter = l__t;
@fragment_350
    gl_FragColor = gl_FragColor * clamp(v_tfx_scatter * 3.0, 0.0, 1.0);

// drop: 떨어지기: 위에서 떨어져 살짝 튕김
@effect drop 떨어지기
@cps
@slow u__duration
@set u__duration 8.0
@set u__height 40.0
@variables
    uniform float u__duration;
    uniform float u__height;
    uniform float u_text_slow_duration;
    uniform float u_text_slow_time;
    uniform float u_text_to_drawable;
    attribute float a_text_min_time;
    varying float v_tfx_drop;
@vertex_30
@use T
    float l__k = l__t - 1.0;
    float l__e = 1.0 + 2.70158 * l__k * l__k * l__k + 1.70158 * l__k * l__k;
    gl_Position.y -= u__height * u_text_to_drawable * (1.0 - l__e);
    v_tfx_drop = l__t;
@fragment_350
    gl_FragColor = gl_FragColor * clamp(v_tfx_drop * 4.0, 0.0, 1.0);

// spin: 회전하며 들어오기: 돌면서 커지며 제자리로
@effect spin 회전하며
@cps
@slow u__duration
@set u__duration 8.0
@set u__angle -90.0
@variables
    uniform float u__duration;
    uniform float u__angle;
    uniform float u_text_slow_duration;
    uniform float u_text_slow_time;
    attribute float a_text_min_time;
    attribute vec2 a_text_center;
    varying float v_tfx_spin;
@vertex_30
@use T
    float l__e = 1.0 - pow(1.0 - l__t, 3.0);
    float l__ang = radians(u__angle) * (1.0 - l__e);
    float l__scale = mix(0.3, 1.0, l__e);
@use ROTATE
    v_tfx_spin = l__t;
@fragment_350
    gl_FragColor = gl_FragColor * clamp(v_tfx_spin * 3.0, 0.0, 1.0);

// shuffle: 무작위 순서: 순서 없이 하나씩 켜짐
@effect shuffle 무작위 순서
@cps
@slow u__spread + u__fade
@set u__spread 10.0
@set u__fade 3.0
@variables
    uniform float u__spread;
    uniform float u__fade;
    uniform float u_text_slow_duration;
    uniform float u_text_slow_time;
    attribute float a_text_min_time;
    attribute float a_text_index;
    varying float v_tfx_shuffle;
@vertex_30
    float l__start = a_text_min_time + RAND(4.0) * u__spread * u_text_slow_duration;
    float l__dur = u__fade * u_text_slow_duration;
    if (l__dur > 0.0) {
        v_tfx_shuffle = clamp((u_text_slow_time - l__start) / l__dur, 0.0, 1.0);
    } else {
        v_tfx_shuffle = a_text_min_time <= u_text_slow_time ? 1.0 : 0.0;
    }
@fragment_350
    gl_FragColor = gl_FragColor * v_tfx_shuffle;

// flash: 색 번쩍: 노란색으로 켜졌다가 원래 색으로
@effect flash 색 번쩍
@cps
@slow u__duration
@set u__duration 12.0
@set u__color #ffc400
@variables
    uniform float u__duration;
    uniform vec4 u__color;
    uniform float u_text_slow_duration;
    uniform float u_text_slow_time;
    attribute float a_text_min_time;
    varying float v_tfx_flash;
    varying float v_tfx_flash_on;
@vertex_30
@use T
    v_tfx_flash = l__t;
    v_tfx_flash_on = a_text_min_time <= u_text_slow_time ? 1.0 : 0.0;
@fragment_350
    float l__e = 1.0 - pow(1.0 - v_tfx_flash, 2.0);
    gl_FragColor.rgb = mix(u__color.rgb * gl_FragColor.a, gl_FragColor.rgb, l__e);
    gl_FragColor = gl_FragColor * v_tfx_flash_on;

// slam: 크게 찍히기: 크게 나타나 줄어들며 쾅, 잠깐 흔들림
@effect slam 크게 찍히기
@cps
@slow u__duration
@set u__duration 10.0
@set u__zoom 3.0
@set u__shake 6.0
@variables
    uniform float u__duration;
    uniform float u__zoom;
    uniform float u__shake;
    uniform float u_text_slow_duration;
    uniform float u_text_slow_time;
    uniform float u_text_to_drawable;
    attribute float a_text_min_time;
    attribute float a_text_index;
    attribute vec2 a_text_center;
    varying float v_tfx_slam;
@vertex_30
@use T
    float l__z = clamp(l__t / 0.35, 0.0, 1.0);
    float l__e = 1.0 - pow(1.0 - l__z, 3.0);
    float l__ang = 0.0;
    float l__scale = mix(u__zoom, 1.0, l__e);
@use ROTATE
    float l__amp = l__t > 0.35 && l__t < 1.0 ? (1.0 - l__t) * u__shake : 0.0;
    float l__tick = floor(u_text_slow_time * 30.0);
    vec2 l__j = vec2(fract(sin(a_text_index * 7.31 + l__tick * 12.9898) * 43758.5453),
                     fract(sin(a_text_index * 3.17 + l__tick * 78.233) * 43758.5453)) * 2.0 - 1.0;
    gl_Position.xy += l__j * l__amp * u_text_to_drawable;
    v_tfx_slam = l__z;
@fragment_350
    gl_FragColor = gl_FragColor * clamp(v_tfx_slam * 2.0, 0.0, 1.0);

// typecursor: 커서 타자기: 하나씩 나오고 다음 글자 자리에 밑줄
@effect typecursor 커서 타자기
@cps
@set u__color #ffffff
@set u__offset 4.0
@set u__thick 3.0
@variables
    uniform vec4 u__color;
    uniform float u__offset;
    uniform float u__thick;
    uniform float u_text_slow_duration;
    uniform float u_text_slow_time;
    uniform float u_text_to_drawable;
    uniform float u_text_main;
    attribute float a_text_min_time;
    attribute vec2 a_text_center;
    varying float v_tfx_cur_min;
    varying float v_tfx_cur_y;
@vertex_10
    v_tfx_cur_min = a_text_min_time;
    v_tfx_cur_y = (gl_Position.y - a_text_center.y) / u_text_to_drawable;
@fragment_350
    float l__wait = v_tfx_cur_min - u_text_slow_time;
    float l__next = (l__wait > 0.0 && l__wait <= u_text_slow_duration && u_text_main > 0.5) ? 1.0 : 0.0;
    float l__bar = (v_tfx_cur_y >= u__offset && v_tfx_cur_y <= u__offset + u__thick) ? 1.0 : 0.0;
    if (v_tfx_cur_min <= u_text_slow_time) {
        gl_FragColor = gl_FragColor;
    } else if (l__next * l__bar > 0.5) {
        gl_FragColor = vec4(u__color.rgb * u__color.a, u__color.a);
    } else {
        gl_FragColor = vec4(0.0);
    }

// echo: 색 잔상: 파랑, 노랑 복사본이 한 박자 늦게 따라와 겹침
@effect echo 색 잔상
@cps
@slow u__duration + u__lag * 2
@outline 0 #2a4cff 0 0
@outline 0 #ffc400 0 0
@set u__duration 10.0
@set u__lag 2.0
@set u__rise 30.0
@variables
    uniform float u__duration;
    uniform float u__lag;
    uniform float u__rise;
    uniform float u_text_slow_duration;
    uniform float u_text_slow_time;
    uniform float u_text_to_drawable;
    uniform float u_text_depth;
    uniform float u_text_main;
    attribute float a_text_min_time;
    varying float v_tfx_echo;
@vertex_30
    float l__lag = u_text_main > 0.5 ? 0.0 : u_text_depth * u__lag;
    float l__dur = u__duration * u_text_slow_duration;
    float l__t;
    if (l__dur > 0.0) {
        l__t = clamp((u_text_slow_time - a_text_min_time - l__lag * u_text_slow_duration) / l__dur, 0.0, 1.0);
    } else {
        l__t = a_text_min_time <= u_text_slow_time ? 1.0 : 0.0;
    }
    float l__e = 1.0 - pow(1.0 - l__t, 3.0);
    gl_Position.y -= u__rise * u_text_to_drawable * (1.0 - l__e);
    if (u_text_main > 0.5) {
        v_tfx_echo = clamp(l__t * 3.0, 0.0, 1.0);
    } else {
        v_tfx_echo = clamp(l__t * 4.0, 0.0, 1.0) * (1.0 - l__t);
    }
@fragment_350
    gl_FragColor = gl_FragColor * v_tfx_echo;

// glitch: 글리치: 가로로 잘려 어긋나고 색이 갈라졌다가 섬
@effect glitch 글리치
@cps
@slow u__duration
@set u__duration 10.0
@set u__shift 14.0
@set u__split 3.0
@set u__band 5.0
@variables
    uniform float u__duration;
    uniform float u__shift;
    uniform float u__split;
    uniform float u__band;
    uniform float u_text_slow_duration;
    uniform float u_text_slow_time;
    uniform float u_text_to_drawable;
    uniform float u_text_main;
    uniform sampler2D tex0;
    uniform vec2 res0;
    attribute float a_text_min_time;
    varying vec2 v_tex_coord;
    varying float v_tfx_glitch;
@vertex_30
@use T
    v_tfx_glitch = l__t;
@fragment_340
    float l__amt = 1.0 - v_tfx_glitch;
    if (v_tfx_glitch > 0.0 && l__amt > 0.0 && u_text_main > 0.5) {
        float l__band = floor(gl_FragCoord.y / (u__band * u_text_to_drawable));
        float l__tick = floor(u_text_slow_time * 24.0);
        float l__r = fract(sin(l__band * 12.9898 + l__tick * 78.233) * 43758.5453);
        float l__dx = (l__r > 0.55 ? (l__r - 0.775) * 2.0 * u__shift : 0.0) * l__amt * u_text_to_drawable;
        vec2 l__o = vec2(l__dx, 0.0) / res0;
        vec2 l__s = vec2(u__split * l__amt * u_text_to_drawable, 0.0) / res0;
        vec4 l__c = texture2D(tex0, v_tex_coord + l__o);
        float l__ar = texture2D(tex0, v_tex_coord + l__o + l__s).a;
        float l__ab = texture2D(tex0, v_tex_coord + l__o - l__s).a;
        gl_FragColor = vec4(max(l__c.r, l__ar), l__c.g, max(l__c.b, l__ab), max(l__c.a, max(l__ar, l__ab)));
    }
@fragment_350
    gl_FragColor = gl_FragColor * (v_tfx_glitch > 0.0 ? 1.0 : 0.0);

// glow: 빛 번짐: 글자 주변이 흐리게 빛남 (한 번에 나와도 보임)
@effect glow 빛 번짐
@slow u__duration
@set u__duration 10.0
@set u__radius 8.0
@set u__strength 1.6
@set u__color #ffffff
@variables
    uniform float u__duration;
    uniform float u__radius;
    uniform float u__strength;
    uniform vec4 u__color;
    uniform float u_text_slow_duration;
    uniform float u_text_slow_time;
    uniform float u_text_to_drawable;
    uniform float u_text_main;
    uniform sampler2D tex0;
    uniform vec2 res0;
    attribute float a_text_min_time;
    varying vec2 v_tex_coord;
    varying float v_tfx_glow;
@vertex_30
@use T
    v_tfx_glow = l__t;
@fragment_340
    if (u_text_main > 0.5) {
        float l__h = 0.0;
        for (int l__i = 0; l__i < 12; l__i++) {
            float l__ang = float(l__i) * 0.5236;
            vec2 l__d = vec2(cos(l__ang), sin(l__ang)) * u__radius * u_text_to_drawable / res0;
            l__h += texture2D(tex0, v_tex_coord + l__d).a + texture2D(tex0, v_tex_coord + l__d * 0.5).a;
        }
        l__h = clamp(l__h / 24.0 * u__strength, 0.0, 1.0);
        vec4 l__g = vec4(u__color.rgb, 1.0) * u__color.a * l__h;
        gl_FragColor = gl_FragColor + l__g * (1.0 - gl_FragColor.a);
    }
@fragment_350
    gl_FragColor = gl_FragColor * clamp(v_tfx_glow * 2.0, 0.0, 1.0);

// blurin: 흐렸다 또렷해지기
@effect blurin 흐렸다 또렷해지기
@cps
@slow u__duration
@set u__duration 12.0
@set u__radius 8.0
@variables
    uniform float u__duration;
    uniform float u__radius;
    uniform float u_text_slow_duration;
    uniform float u_text_slow_time;
    uniform float u_text_to_drawable;
    uniform float u_text_main;
    uniform sampler2D tex0;
    uniform vec2 res0;
    attribute float a_text_min_time;
    varying vec2 v_tex_coord;
    varying float v_tfx_blur;
@vertex_30
@use T
    v_tfx_blur = l__t;
@fragment_340
    float l__e = 1.0 - pow(1.0 - v_tfx_blur, 2.0);
    float l__r = u__radius * (1.0 - l__e) * u_text_to_drawable;
    if (l__r > 0.01) {
        vec4 l__sum = vec4(0.0);
        for (int l__x = -2; l__x <= 2; l__x++) {
            for (int l__y = -2; l__y <= 2; l__y++) {
                l__sum += texture2D(tex0, v_tex_coord + vec2(float(l__x), float(l__y)) * l__r * 0.5 / res0);
            }
        }
        gl_FragColor = l__sum / 25.0;
    }
@fragment_350
    gl_FragColor = gl_FragColor * clamp(v_tfx_blur * 2.0, 0.0, 1.0);

// wipe: 위에서 아래로 그려지기 (글자가 크면 effect="wipe:u__span=80")
@effect wipe 위에서 그려지기
@cps
@slow u__duration
@set u__duration 8.0
@set u__span 40.0
@variables
    uniform float u__duration;
    uniform float u__span;
    uniform float u_text_slow_duration;
    uniform float u_text_slow_time;
    uniform float u_text_to_drawable;
    attribute float a_text_min_time;
    attribute vec2 a_text_center;
    varying float v_tfx_wipe;
    varying float v_tfx_wipe_y;
@vertex_10
    v_tfx_wipe_y = (gl_Position.y - a_text_center.y) / u_text_to_drawable;
@vertex_30
@use T
    v_tfx_wipe = l__t;
@fragment_350
    float l__edge = mix(-u__span, u__span * 0.35, v_tfx_wipe);
    float l__show = v_tfx_wipe >= 1.0 ? 1.0 : clamp((l__edge - v_tfx_wipe_y) / 3.0, 0.0, 1.0);
    gl_FragColor = gl_FragColor * l__show * (v_tfx_wipe > 0.0 ? 1.0 : 0.0);

// blockglitch: 블록 글리치: 네모 칸마다 밀리거나 늘어나거나 색이 바뀌었다가 섬
@effect blockglitch 블록 글리치
@cps
@slow u__duration
@redraw u__hold
@set u__duration 12.0
@set u__block 12.0
@set u__shift 10.0
@set u__rate 14.0
@set u__hold 0.0
@variables
    uniform float u__duration;
    uniform float u__block;
    uniform float u__shift;
    uniform float u__rate;
    uniform float u__hold;
    uniform float u_text_slow_duration;
    uniform float u_text_slow_time;
    uniform float u_text_to_drawable;
    uniform float u_text_main;
    uniform float u_time;
    uniform sampler2D tex0;
    uniform vec2 res0;
    attribute float a_text_min_time;
    varying vec2 v_tex_coord;
    varying float v_tfx_block;
@vertex_30
@use T
    v_tfx_block = l__t;
@fragment_340
    float l__amt = max(1.0 - v_tfx_block, u__hold);
    if (v_tfx_block > 0.0 && l__amt > 0.0 && u_text_main > 0.5) {
        float l__size = u__block * u_text_to_drawable;
        vec2 l__cell = floor(gl_FragCoord.xy / l__size);
        float l__tick = floor(u_time * u__rate);
        float l__r1 = fract(sin(dot(l__cell + l__tick, vec2(12.9898, 78.233))) * 43758.5453);
        float l__r2 = fract(sin(dot(l__cell + l__tick, vec2(39.346, 11.135))) * 43758.5453);
        float l__r3 = fract(sin(dot(l__cell + l__tick, vec2(73.156, 52.235))) * 43758.5453);
        vec2 l__uv = v_tex_coord;
        float l__hit = l__r1 > 1.0 - 0.5 * l__amt ? 1.0 : 0.0;
        if (l__hit > 0.5) {
            if (l__r2 < 0.5) {
                // 칸째로 밀기
                vec2 l__d = vec2((l__r3 - 0.5) * 2.0, (l__r2 - 0.25) * 2.0) * u__shift * u_text_to_drawable;
                l__uv += l__d / res0;
            } else {
                // 칸의 왼쪽 한 줄을 옆으로 늘이기
                float l__x0 = l__cell.x * l__size;
                l__uv.x -= (gl_FragCoord.x - l__x0) / res0.x;
            }
        }
        vec4 l__c = texture2D(tex0, l__uv);
        if (l__hit > 0.5 && l__r3 > 0.55) {
            // 컬러 바처럼 칸의 색을 바꾼다
            vec3 l__hue = clamp(abs(fract(l__r2 + vec3(0.0, 2.0 / 3.0, 1.0 / 3.0)) * 6.0 - 3.0) - 1.0, 0.0, 1.0);
            l__c.rgb = mix(l__c.rgb, l__hue * l__c.a, 0.85);
        }
        gl_FragColor = l__c;
    }
@fragment_350
    gl_FragColor = gl_FragColor * (v_tfx_block > 0.0 ? 1.0 : 0.0);

// melt: 녹아내림: 흘러내린 색이 모여 글자가 됨 (u__hold로 계속 녹기)
@effect melt 녹아내림
@cps
@slow u__duration
@redraw u__hold
@set u__duration 14.0
@set u__length 28.0
@set u__width 3.0
@set u__hold 0.0
@variables
    uniform float u__duration;
    uniform float u__length;
    uniform float u__width;
    uniform float u__hold;
    uniform float u_text_slow_duration;
    uniform float u_text_slow_time;
    uniform float u_text_to_drawable;
    uniform float u_text_main;
    uniform float u_time;
    uniform sampler2D tex0;
    uniform vec2 res0;
    attribute float a_text_min_time;
    varying vec2 v_tex_coord;
    varying float v_tfx_melt;
@vertex_30
@use T
    v_tfx_melt = l__t;
@fragment_340
    if (v_tfx_melt > 0.0 && u_text_main > 0.5) {
        float l__e = 1.0 - pow(1.0 - v_tfx_melt, 2.0);
        float l__x = gl_FragCoord.x / (u__width * u_text_to_drawable);
        float l__i = floor(l__x);
        float l__a = fract(sin(l__i * 12.9898) * 43758.5453);
        float l__b = fract(sin((l__i + 1.0) * 12.9898) * 43758.5453);
        float l__n = mix(l__a, l__b, smoothstep(0.0, 1.0, fract(l__x)));
        float l__wave = 0.5 + 0.5 * sin(u_time * 1.7 + l__i * 2.3);
        float l__amt = max(1.0 - l__e, u__hold * l__wave);
        float l__drip = u__length * u_text_to_drawable * l__n * l__n * l__amt;
        vec2 l__uv = v_tex_coord;
        vec2 l__dir = vec2(0.0, l__drip) / res0;
@use STREAK
    }
@fragment_350
    gl_FragColor = gl_FragColor * (v_tfx_melt > 0.0 ? 1.0 : 0.0);

// mosh: 데이터모싱 흉내: 네모 칸이 한쪽으로 끌리며 번졌다가 돌아옴 (u__hold로 계속)
@effect mosh 데이터모싱
@cps
@slow u__duration
@redraw u__hold
@set u__duration 14.0
@set u__block 16.0
@set u__length 24.0
@set u__rate 5.0
@set u__hold 0.0
@variables
    uniform float u__duration;
    uniform float u__block;
    uniform float u__length;
    uniform float u__rate;
    uniform float u__hold;
    uniform float u_text_slow_duration;
    uniform float u_text_slow_time;
    uniform float u_text_to_drawable;
    uniform float u_text_main;
    uniform float u_time;
    uniform sampler2D tex0;
    uniform vec2 res0;
    attribute float a_text_min_time;
    varying vec2 v_tex_coord;
    varying float v_tfx_mosh;
@vertex_30
@use T
    v_tfx_mosh = l__t;
@fragment_340
    float l__amt = max(1.0 - v_tfx_mosh, u__hold);
    if (v_tfx_mosh > 0.0 && l__amt > 0.0 && u_text_main > 0.5) {
        vec2 l__cell = floor(gl_FragCoord.xy / (u__block * u_text_to_drawable));
        float l__tick = floor(u_time * u__rate);
        float l__r1 = fract(sin(dot(l__cell + l__tick, vec2(12.9898, 78.233))) * 43758.5453);
        float l__r2 = fract(sin(dot(l__cell + l__tick, vec2(39.346, 11.135))) * 43758.5453);
        float l__r3 = fract(sin(dot(l__cell + l__tick, vec2(73.156, 52.235))) * 43758.5453);
        vec2 l__uv = v_tex_coord;
        vec2 l__dir = vec2(0.0);
        if (l__r1 > 1.0 - 0.6 * l__amt) {
            // 칸마다 흐르는 방향. 아래쪽으로 조금 더 흐르게
            vec2 l__v = normalize(vec2(l__r2 - 0.5, l__r3 - 0.2) + 0.001);
            l__dir = l__v * u__length * u_text_to_drawable * l__amt / res0;
            l__uv -= l__dir * 0.5;
        }
@use STREAK
    }
@fragment_350
    gl_FragColor = gl_FragColor * (v_tfx_mosh > 0.0 ? 1.0 : 0.0);

// liquid: 일렁임: 물에 비친 것처럼 계속 출렁임 (한 번에 나와도 보임)
@effect liquid 일렁임
@redraw always
@set u__amplitude 2.0
@set u__wavelength 24.0
@set u__speed 2.5
@variables
    uniform float u__amplitude;
    uniform float u__wavelength;
    uniform float u__speed;
    uniform float u_text_to_drawable;
    uniform float u_text_main;
    uniform float u_time;
    uniform float u_text_slow_time;
    uniform sampler2D tex0;
    uniform vec2 res0;
    attribute float a_text_min_time;
    varying vec2 v_tex_coord;
    varying float v_tfx_liquid_min;
@vertex_30
    v_tfx_liquid_min = a_text_min_time;
@fragment_340
    if (u_text_main > 0.5) {
        vec2 l__p = gl_FragCoord.xy / (u__wavelength * u_text_to_drawable);
        vec2 l__o = vec2(sin(l__p.y * 6.2832 + u_time * u__speed), cos(l__p.x * 6.2832 + u_time * u__speed * 1.3));
        gl_FragColor = texture2D(tex0, v_tex_coord + l__o * u__amplitude * u_text_to_drawable / res0);
    }
@fragment_350
    gl_FragColor = gl_FragColor * (v_tfx_liquid_min <= u_text_slow_time ? 1.0 : 0.0);

// vhs: 지직거리는 VHS: 주사선, 띠 찢김, 색 어긋남, 색조 바뀜, 노이즈가 계속 (한 번에 나와도 보임)
@effect vhs VHS 지직거림
@redraw always
@set u__band 6.0
@set u__tear 0.3
@set u__shift 8.0
@set u__split 2.0
@set u__scan 0.45
@set u__tint 0.35
@set u__noise 0.35
@set u__rate 12.0
@variables
    uniform float u__band;
    uniform float u__tear;
    uniform float u__shift;
    uniform float u__split;
    uniform float u__scan;
    uniform float u__tint;
    uniform float u__noise;
    uniform float u__rate;
    uniform float u_text_slow_time;
    uniform float u_text_to_drawable;
    uniform float u_text_main;
    uniform float u_time;
    uniform sampler2D tex0;
    uniform vec2 res0;
    attribute float a_text_min_time;
    varying vec2 v_tex_coord;
    varying float v_tfx_vhs_min;
@vertex_30
    v_tfx_vhs_min = a_text_min_time;
@fragment_340
    if (u_text_main > 0.5) {
        float l__td = u_text_to_drawable;
        float l__tick = floor(u_time * u__rate);

        // 가로 띠 찢김: 띠마다 가끔 옆으로 크게 밀린다
        float l__band = floor(gl_FragCoord.y / (u__band * l__td));
        float l__rb = fract(sin(l__band * 12.9898 + l__tick * 78.233) * 43758.5453);
        float l__dx = l__rb > 1.0 - u__tear ? (fract(l__rb * 91.7) - 0.5) * 2.0 * u__shift : 0.0;
        // 화면 전체가 살짝 흔들림
        l__dx += (fract(sin(l__tick * 3.71) * 43758.5453) - 0.5) * 1.5;
        vec2 l__uv = v_tex_coord + vec2(l__dx * l__td, 0.0) / res0;

        // 빨강, 파랑 어긋남 (박자마다 세기가 바뀜)
        float l__sp = u__split * (0.5 + fract(sin(l__tick * 7.13) * 43758.5453)) * l__td;
        vec4 l__c = texture2D(tex0, l__uv);
        float l__ar = texture2D(tex0, l__uv + vec2(l__sp, 0.0) / res0).a;
        float l__ab = texture2D(tex0, l__uv - vec2(l__sp, 0.0) / res0).a;
        float l__a = max(l__c.a, max(l__ar, l__ab));
        vec3 l__rgb = vec3(max(l__c.r, l__ar * 0.95), l__c.g, max(l__c.b, l__ab * 0.95));

        // 순간적인 색조 바뀜
        float l__rt = fract(sin(l__tick * 5.17) * 43758.5453);
        if (l__rt < u__tint) {
            float l__pick = floor(fract(l__rt * 37.3) * 5.0);
            vec3 l__tone = l__pick < 1.0 ? vec3(1.0, 0.85, 0.35) : l__pick < 2.0 ? vec3(1.0, 0.4, 0.4) : l__pick < 3.0 ? vec3(0.45, 0.6, 1.0) : l__pick < 4.0 ? vec3(0.55, 1.0, 0.45) : vec3(0.75);
            float l__g = dot(l__rgb, vec3(0.3, 0.59, 0.11));
            l__rgb = l__pick < 4.0 ? mix(l__rgb, l__g * l__tone * 1.3, 0.7) : vec3(l__g);
        }

        // 주사선: 가로 두 줄마다 한 줄을 어둡게
        float l__line = mod(floor(gl_FragCoord.y / l__td), 2.0);
        l__rgb *= 1.0 - u__scan * l__line;

        // 지글거리는 노이즈와 밝기 떨림
        float l__n = fract(sin(dot(floor(gl_FragCoord.xy / l__td) + l__tick, vec2(12.9898, 78.233))) * 43758.5453);
        l__rgb += (l__n - 0.5) * u__noise * l__a;
        l__rgb *= 0.9 + 0.2 * fract(sin(l__tick * 9.31) * 43758.5453);

        gl_FragColor = vec4(clamp(l__rgb, 0.0, 1.0) * l__a, l__a);
    }
@fragment_350
    gl_FragColor = gl_FragColor * (v_tfx_vhs_min <= u_text_slow_time ? 1.0 : 0.0);

// rise: 떠오르기: 글자마다 다른 깊이에서 떠올라 제자리로
@effect rise 떠오르기
@cps
@slow u__duration
@set u__duration 10.0
@set u__depth 40.0
@variables
    uniform float u__duration;
    uniform float u__depth;
    uniform float u_text_slow_duration;
    uniform float u_text_slow_time;
    uniform float u_text_to_drawable;
    attribute float a_text_min_time;
    attribute float a_text_index;
    varying float v_tfx_rise;
@vertex_30
@use T
    float l__e = 1.0 - pow(1.0 - l__t, 3.0);
    float l__d = 0.4 + 0.8 * RAND(5.0);
    gl_Position.y += u__depth * l__d * u_text_to_drawable * (1.0 - l__e);
    v_tfx_rise = l__t;
@fragment_350
    gl_FragColor = gl_FragColor * clamp(v_tfx_rise * 2.0, 0.0, 1.0);

// lean: 기울며 들어오기: 크게 기운 채 옆에서 들어와 바로 섬
@effect lean 기울며 들어오기
@cps
@slow u__duration
@set u__duration 8.0
@set u__angle 35.0
@set u__slide 20.0
@variables
    uniform float u__duration;
    uniform float u__angle;
    uniform float u__slide;
    uniform float u_text_slow_duration;
    uniform float u_text_slow_time;
    uniform float u_text_to_drawable;
    attribute float a_text_min_time;
    attribute vec2 a_text_center;
    varying float v_tfx_lean;
@vertex_30
@use T
    float l__e = 1.0 - pow(1.0 - l__t, 3.0);
    float l__k = tan(radians(u__angle)) * (1.0 - l__e);
    gl_Position.x += (a_text_center.y - gl_Position.y) * l__k - u__slide * u_text_to_drawable * (1.0 - l__e);
    v_tfx_lean = l__t;
@fragment_350
    gl_FragColor = gl_FragColor * clamp(v_tfx_lean * 3.0, 0.0, 1.0);

// stretch: 늘어나며 들어오기: 세로로 늘어났다가 원래 비율로 (u__x, u__y로 방향)
@effect stretch 늘어나며 들어오기
@cps
@slow u__duration
@set u__duration 8.0
@set u__x 0.6
@set u__y 2.6
@variables
    uniform float u__duration;
    uniform float u__x;
    uniform float u__y;
    uniform float u_text_slow_duration;
    uniform float u_text_slow_time;
    attribute float a_text_min_time;
    attribute vec2 a_text_center;
    varying float v_tfx_stretch;
@vertex_30
@use T
    float l__e = 1.0 - pow(1.0 - l__t, 3.0);
    vec2 l__s = mix(vec2(u__x, u__y), vec2(1.0), l__e);
    gl_Position.xy = a_text_center + (gl_Position.xy - a_text_center) * l__s;
    v_tfx_stretch = l__t;
@fragment_350
    gl_FragColor = gl_FragColor * clamp(v_tfx_stretch * 3.0, 0.0, 1.0);

