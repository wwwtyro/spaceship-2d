#version 100
precision highp float;

attribute vec3 aPosition;

void main() {
    gl_Position = vec4(aPosition, 1);
}


// __split__


#version 100
precision highp float;

uniform float uCount;
uniform sampler2D uAOTexture;
uniform sampler2D uDiffuseTexture;
uniform sampler2D uNormalTexture;
uniform sampler2D uPositionTexture;
uniform float uTick;
uniform float uRes;

void main() {
    vec4 diffuse = texture2D(uDiffuseTexture, gl_FragCoord.xy/uRes);
    vec4 normal = 2.0 * texture2D(uNormalTexture, gl_FragCoord.xy/uRes) - 1.0;
    vec4 position = 2.0 * texture2D(uPositionTexture, gl_FragCoord.xy/uRes) - 1.0;
    float ambient = texture2D(uAOTexture, gl_FragCoord.xy/uRes).r;
    vec3 lightPos = vec3(1, 1, 2);
    vec3 lightVec = lightPos - position.xyz;
    vec3 lightDir = normalize(lightVec);
    float lightMag = clamp(dot(normalize(normal.xyz), lightDir), 0.0, 1.0);
    float attenuation = 1.0/(0.25 * pow(length(lightVec), 1.0));
    lightMag = attenuation * lightMag;

    vec3 gamma = vec3(1.0/2.2);
    vec3 linearColor = lightMag * ambient * diffuse.rgb;
    vec3 finalColor = pow(linearColor, gamma);

    gl_FragColor = vec4(linearColor, diffuse.a);
}
