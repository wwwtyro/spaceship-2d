#version 100
precision highp float;

uniform mat4 uProjection;
uniform mat4 uView;
uniform mat4 uModel;

attribute vec3 aPosition;

varying vec3 position;

void main() {
    gl_Position = uProjection * uView * uModel * vec4(aPosition, 1);
    position = vec3(uModel * vec4(aPosition, 1));
}


__split__


#version 100
precision highp float;

varying vec3 position;

void main() {
    gl_FragColor = vec4(position, 1);
}
