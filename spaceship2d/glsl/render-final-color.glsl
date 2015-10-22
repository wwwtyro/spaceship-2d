#version 100
precision highp float;

attribute vec3 aPosition;

void main() {
    gl_Position = vec4(aPosition, 1);
}

// __split__

#version 100
precision highp float;

uniform sampler2D uDiffuseTexture;
uniform sampler2D uAOTexture;
uniform float uRes;

void main() {
    vec4 diffuse = texture2D(uDiffuseTexture, gl_FragCoord.xy/uRes);
    float ambient = texture2D(uAOTexture, (gl_FragCoord.xy + vec2( 0,  0))/uRes).r;
    gl_FragColor = vec4(ambient * diffuse.rgb, diffuse.a);
}
