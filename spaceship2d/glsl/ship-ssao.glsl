#version 100
precision highp float;

attribute vec3 aPosition;

void main() {
    gl_Position = vec4(aPosition, 1);
}


__split__


#version 100
precision highp float;

uniform sampler2D uPositionTexture;
uniform sampler2D uNormalTexture;
uniform float uRes;

vec3 rand_state;

float _rand(vec2 co){
    return fract(sin(dot(co.xy ,vec2(12.9898,78.233))) * 43758.5453);
}

float rand() {
    rand_state = vec3(_rand(rand_state.xy) * float(uRes) + rand_state.z,
                      _rand(rand_state.yx) * float(uRes) - rand_state.z,
                      rand_state.z + _rand(rand_state.zz) - 0.5);
    return _rand(rand_state.xy);
}

vec2 randVec2() {
    float x = rand() * 2.0 - 1.0;
    float y = rand() * 2.0 - 1.0;
    return vec2(x, y);
}

void main() {
    rand_state = vec3(gl_FragCoord.xy, 0);
    vec3 p0 = texture2D(uPositionTexture, gl_FragCoord.xy/uRes).xyz;
    vec3 n = normalize(texture2D(uNormalTexture, gl_FragCoord.xy/uRes).xyz);
    float occluded = 0.0;
    for (int i = 0; i < 256; i++) {
        vec2 xy = gl_FragCoord.xy/uRes + randVec2()*0.05;
        vec3 p1 = texture2D(uPositionTexture, xy).xyz;
        vec3 v = normalize(p1 - p0);
        float d = length(p1 - p0);
        occluded += max(0.0, dot(n, v)) * (1.0 / (1.0 + d));
    }
    float c = occluded / 256.0;
    c = pow(2.0 * c, 0.5);
    gl_FragColor = vec4(c,c,c, 1);
}
