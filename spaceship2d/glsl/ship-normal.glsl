#version 100
precision highp float;

uniform mat4 uProjection;
uniform mat4 uView;
uniform mat4 uModel;

attribute vec3 aPosition;
attribute vec3 aNormal;

varying vec3 normal;

void main() {
    gl_Position = uProjection * uView * uModel * vec4(aPosition, 1);
    normal = aNormal;
}


__split__


#version 100
precision highp float;

varying vec3 normal;

void main() {
    gl_FragColor = vec4(0.5 * normal + 0.5, 1);
}
