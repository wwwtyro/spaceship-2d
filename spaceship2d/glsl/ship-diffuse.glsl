#version 100
precision highp float;

uniform mat4 uProjection;
uniform mat4 uView;
uniform mat4 uModel;

attribute vec3 aPosition;
attribute vec3 aColor;

varying vec3 color;
varying vec3 position;

void main() {
    gl_Position = uProjection * uView * uModel * vec4(aPosition, 1);
    color = aColor;
    position = (uModel * vec4(aPosition,1)).xyz;
}


__split__


#version 100
precision highp float;

varying vec3 color;
varying vec3 position;

void main() {
    gl_FragColor = vec4(color, 1);
}
