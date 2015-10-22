"use strict";

var fs = require("fs");
var glm = require("gl-matrix");
var webgl = require("./webgl");

exports.Renderer = function(options) {
    options = options || {};
    var resolution = options.resolution || 1024;

    var self = this;

    var renderCanvas, gl, glExt, resolution,
        programShipSSAO,
        programShipDiffuse,
        programShipNormal,
        programShipPosition,
        programFinalColor,
        programTexture,
        programDemo,
        renderableShipSSAO,
        renderableShipDiffuse,
        renderableShipNormal,
        renderableShipPosition,
        renderableFinalColor,
        renderableTexture,
        renderableDemo;

    var meshShip;

    var tSSAO,
        tSSAODepth,
        fbSSAO;

    var tDiffuse,
        tDiffuseDepth,
        fbDiffuse;

    var tNormal,
        tNormalDepth,
        fbNormal;

    var tPosition,
        tPositionDepth,
        fbPosition;

    self.initialize = function() {
        renderCanvas = document.createElement("canvas");
        renderCanvas.width = renderCanvas.height = resolution;

        gl = renderCanvas.getContext("webgl");
        gl.enable(gl.CULL_FACE);
        gl.enable(gl.DEPTH_TEST);
        gl.clearColor(0, 0, 0, 1);
        glExt = webgl.getExtensions(gl, [
            "WEBGL_depth_texture",
            "OES_texture_float",
            "OES_texture_float_linear"
        ]);

        programShipSSAO = loadProgram(gl, fs.readFileSync(__dirname + "/glsl/ship-ssao.glsl", "utf8"));
        programShipDiffuse = loadProgram(gl, fs.readFileSync(__dirname + "/glsl/ship-diffuse.glsl", "utf8"));
        programShipNormal = loadProgram(gl, fs.readFileSync(__dirname + "/glsl/ship-normal.glsl", "utf8"));
        programShipPosition = loadProgram(gl, fs.readFileSync(__dirname + "/glsl/ship-position.glsl", "utf8"));
        programFinalColor = loadProgram(gl, fs.readFileSync(__dirname + "/glsl/render-final-color.glsl", "utf8"));
        programTexture = loadProgram(gl, fs.readFileSync(__dirname + "/glsl/render-texture.glsl", "utf8"));
        programDemo = loadProgram(gl, fs.readFileSync(__dirname + "/glsl/textured-quad.glsl", "utf8"));

        renderableShipSSAO = buildQuad(programShipSSAO);
        renderableFinalColor = buildQuad(programFinalColor);
        renderableTexture = buildQuad(programTexture);
        renderableDemo = buildQuad(programDemo);

        tSSAO = new webgl.Texture(gl, 0, null, resolution, resolution, {
            mag: gl.LINEAR,
            min: gl.LINEAR
        });
        tSSAODepth = new webgl.Texture(gl, 1, null, resolution, resolution, {
            internalFormat: gl.DEPTH_COMPONENT,
            format: gl.DEPTH_COMPONENT,
            type: gl.UNSIGNED_SHORT
        });
        fbSSAO = new webgl.Framebuffer(gl, [tSSAO], tSSAODepth);

        tDiffuse = new webgl.Texture(gl, 2, null, resolution, resolution);
        tDiffuseDepth = new webgl.Texture(gl, 3, null, resolution, resolution, {
            internalFormat: gl.DEPTH_COMPONENT,
            format: gl.DEPTH_COMPONENT,
            type: gl.UNSIGNED_SHORT
        });
        fbDiffuse = new webgl.Framebuffer(gl, [tDiffuse], tDiffuseDepth);

        tNormal = new webgl.Texture(gl, 4, null, resolution, resolution, {
            mag: gl.LINEAR,
            min: gl.LINEAR
        });
        tNormalDepth = new webgl.Texture(gl, 5, null, resolution, resolution, {
            internalFormat: gl.DEPTH_COMPONENT,
            format: gl.DEPTH_COMPONENT,
            type: gl.UNSIGNED_SHORT
        });
        fbNormal = new webgl.Framebuffer(gl, [tNormal], tNormalDepth);

        tPosition = new webgl.Texture(gl, 6, null, resolution, resolution, {
            min: gl.LINEAR,
            mag: gl.LINEAR,
            internalFormat: gl.RGBA,
            format: gl.RGBA,
            type: gl.FLOAT
        });
        tPositionDepth = new webgl.Texture(gl, 7, null, resolution, resolution, {
            internalFormat: gl.DEPTH_COMPONENT,
            format: gl.DEPTH_COMPONENT,
            type: gl.UNSIGNED_SHORT
        });
        fbPosition = new webgl.Framebuffer(gl, [tPosition], tPositionDepth);
    };

    self.render = function(shipCode) {
        buildShip(shipCode);
        renderTextures();
        renderSprites();
    }

    function renderSprites() {
        self.colorSprite = document.createElement("canvas");
        self.colorSprite.width = self.colorSprite.height = resolution;
        var ctx = self.colorSprite.getContext("2d");
        programFinalColor.use();
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.clearColor(0,0,0,0);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        programFinalColor.setUniform("uDiffuseTexture", "1i", tDiffuse.index);
        programFinalColor.setUniform("uAOTexture", "1i", tSSAO.index);
        programFinalColor.setUniform("uRes", "1f", resolution);
        renderableFinalColor.render();
        ctx.drawImage(renderCanvas, 0, 0, resolution, resolution);

        self.normalSprite = document.createElement("canvas");
        self.normalSprite.width = self.normalSprite.height = resolution;
        ctx = self.normalSprite.getContext("2d");
        programTexture.use();
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.clearColor(0,0,0,0);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        programTexture.setUniform("uTexture", "1i", tNormal.index);
        programTexture.setUniform("uRes", "1f", resolution);
        renderableTexture.render();
        ctx.drawImage(renderCanvas, 0, 0, resolution, resolution);

        self.positionSprite = document.createElement("canvas");
        self.positionSprite.width = self.positionSprite.height = resolution;
        ctx = self.positionSprite.getContext("2d");
        programTexture.use();
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.clearColor(0,0,0,0);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        programTexture.setUniform("uTexture", "1i", tPosition.index);
        programTexture.setUniform("uRes", "1f", resolution);
        renderableTexture.render();
        ctx.drawImage(renderCanvas, 0, 0, resolution, resolution);

        self.depthSprite = document.createElement("canvas");
        self.depthSprite.width = self.depthSprite.height = resolution;
        ctx = self.depthSprite.getContext("2d");
        programTexture.use();
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.clearColor(0,0,0,0);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        programTexture.setUniform("uTexture", "1i", tPositionDepth.index);
        programTexture.setUniform("uRes", "1f", resolution);
        renderableTexture.render();
        ctx.drawImage(renderCanvas, 0, 0, resolution, resolution);
    }

    function renderTextures() {
        var uProjection = glm.mat4.create();
        glm.mat4.ortho(uProjection, -1, 1, -1, 1, 0, 1);

        var uView = glm.mat4.create();
        glm.mat4.lookAt(uView, [0, 0, 0.5], [0, 0, 0], [0, 1, 0]);

        var uModel = glm.mat4.create();

        programShipDiffuse.use();
        fbDiffuse.bind();
        gl.clearColor(0,0,0,0);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        programShipDiffuse.setUniform("uProjection", "Matrix4fv", false, uProjection);
        programShipDiffuse.setUniform("uView", "Matrix4fv", false, uView);
        programShipDiffuse.setUniform("uModel", "Matrix4fv", false, uModel);
        renderableShipDiffuse.render();

        programShipNormal.use();
        fbNormal.bind();
        gl.clearColor(0,0,0,0);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        programShipNormal.setUniform("uProjection", "Matrix4fv", false, uProjection);
        programShipNormal.setUniform("uView", "Matrix4fv", false, uView);
        programShipNormal.setUniform("uModel", "Matrix4fv", false, uModel);
        renderableShipNormal.render();

        programShipPosition.use();
        fbPosition.bind();
        gl.clearColor(0,0,0,0);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        programShipPosition.setUniform("uProjection", "Matrix4fv", false, uProjection);
        programShipPosition.setUniform("uView", "Matrix4fv", false, uView);
        programShipPosition.setUniform("uModel", "Matrix4fv", false, uModel);
        renderableShipPosition.render();

        programShipSSAO.use();
        fbSSAO.bind();
        gl.clearColor(0,0,0,0);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        programShipSSAO.setUniform("uPositionTexture", "1i", tPositionDepth.index);
        programShipSSAO.setUniform("uNormalTexture", "1i", tNormal.index);
        programShipSSAO.setUniform("uRes", "1f", resolution);
        renderableShipSSAO.render();
    }

    function buildShip(shipCode) {
        meshShip = genShip(shipCode);
        var count = meshShip.position.length / 9;
        var attribs = webgl.buildAttribs(gl, {
            aPosition: 3,
        });
        attribs.aPosition.buffer.set(new Float32Array(meshShip.position));
        renderableShipPosition = new webgl.Renderable(gl, programShipPosition, attribs, count);

        attribs = webgl.buildAttribs(gl, {
            aPosition: 3,
            aColor: 3
        });
        attribs.aPosition.buffer.set(new Float32Array(meshShip.position));
        attribs.aColor.buffer.set(new Float32Array(meshShip.color));
        renderableShipDiffuse = new webgl.Renderable(gl, programShipDiffuse, attribs, count);

        attribs = webgl.buildAttribs(gl, {
            aPosition: 3,
            aNormal: 3
        });
        attribs.aPosition.buffer.set(new Float32Array(meshShip.position));
        attribs.aNormal.buffer.set(new Float32Array(meshShip.normal));
        renderableShipNormal = new webgl.Renderable(gl, programShipNormal, attribs, count);
    }

    function buildQuad(program) {
        var position = [
            -1, -1, 0,
             1, -1, 0,
             1,  1, 0,
            -1, -1, 0,
             1,  1, 0,
            -1,  1, 0
        ];
        var attribs = webgl.buildAttribs(gl, {aPosition: 3});
        attribs.aPosition.buffer.set(new Float32Array(position));
        var count = position.length / 9;
        return new webgl.Renderable(gl, program, attribs, count);
    }

    self.initialize();
};




exports.generateShip = function() {
    var ship = {
        baseColor: {
            r: Math.random(),
            g: Math.random(),
            b: Math.random()
        },
        code: []
    }
    var count = 0;
    while(count < 128 && (Math.random() < 0.95 || count < 8)) {
        count++;
        var item = generateShipTetrahedron(ship.baseColor);
        ship.code.push(item);
    }
    return ship;
}

var colorMutation = 0.25;
function generateShipTetrahedron(baseColor) {
    return {
        color: {
            r: Math.max(0, Math.min(1, baseColor.r + (Math.random() * 2 - 1) * colorMutation)),
            g: Math.max(0, Math.min(1, baseColor.g + (Math.random() * 2 - 1) * colorMutation)),
            b: Math.max(0, Math.min(1, baseColor.b + (Math.random() * 2 - 1) * colorMutation))
        },
        rotation: {
            x: Math.random() * Math.PI * 2.0,
            y: Math.random() * Math.PI * 2.0,
            z: Math.random() * Math.PI * 2.0
        },
        scale: {
            x: Math.random() * 10.0,
            y: Math.random() * 10.0,
            z: Math.random() * 10.0
        },
        translation: {
            x: Math.random() * 5.0,
            y: 0.0,
            z: 0.0
        }
    };
}

function mutate(value, amount) {
    return value + (Math.random() * 2 - 1) * amount;
}

function clamp(value, a, b) {
    return Math.max(a, Math.min(b, value));
}

exports.mutateShip = function(ship, baseColorShift, colorShift, shapeShift) {
    var newShip = {
        baseColor: {
            r: clamp(mutate(ship.baseColor.r, baseColorShift), 0, 1),
            g: clamp(mutate(ship.baseColor.g, baseColorShift), 0, 1),
            b: clamp(mutate(ship.baseColor.b, baseColorShift), 0, 1)
        },
        code: []
    };
    for (var i = 0; i < ship.code.length; i++) {
        var code = ship.code[i];
        var item = {
            color: {
                r: clamp(mutate(code.color.r, colorShift), -1, 1),
                g: clamp(mutate(code.color.g, colorShift), -1, 1),
                b: clamp(mutate(code.color.b, colorShift), -1, 1)
            },
            rotation: {
                x: mutate(code.rotation.x, shapeShift),
                y: mutate(code.rotation.y, shapeShift),
                z: mutate(code.rotation.z, shapeShift)
            },
            scale: {
                x: mutate(code.scale.x, shapeShift),
                y: mutate(code.scale.y, shapeShift),
                z: mutate(code.scale.z, shapeShift)
            },
            translation: {
                x: mutate(code.translation.x, shapeShift),
                y: 0,
                z: 0
            }
        };
        newShip.code.push(item);
    }
    var addCount = Math.floor(Math.random() * 10 * shapeShift);
    var removeCount = Math.floor(Math.random() * 10 * shapeShift);
    for (var i = 0; i < addCount; i++) {
        newShip.code.push(generateShipTetrahedron(newShip.baseColor));
    }
    for (var i = 0; i < removeCount && newShip.code.length > 4; i++) {
        newShip.code.splice(Math.floor(Math.random()*newShip.code.length), 1);
    }

    return newShip;
}

function genShip(ship) {
    var rightSide = meshEmpty();
    for (var i = 0; i < ship.code.length; i++) {
        var code = ship.code[i];
        var tetra = tetrahedron();
        tetra = shapeToMesh(tetra);
        var color = {
            r: ship.baseColor.r + code.color.r,
            g: ship.baseColor.g + code.color.g,
            b: ship.baseColor.b + code.color.b
        }
        meshSetColor(tetra, color);
        meshApplyMatrix(tetra, rotationMatrixXYZ(code.rotation));
        meshScale(tetra, code.scale.x, code.scale.y, code.scale.z);
        meshTranslate(tetra, code.translation.x, code.translation.y, code.translation.z);
        rightSide = meshMerge(rightSide, tetra);
    }
    var leftSide = meshClone(rightSide);
    meshReflectYZ(leftSide);
    var ship = meshMerge(leftSide, rightSide);
    meshNormalizeZ(ship);
    meshScale(ship, 1, 1, 0.25);
    meshCenter(ship);
    meshNormalizeXY(ship);
    meshCalculateNormals(ship);
    meshCalculateRadius(ship);
    return ship;
}


function randomColor() {
    return {
        r: Math.random(),
        g: Math.random(),
        b: Math.random()
    };
}


function shiftColor(c, amount) {
    return {
        r: Math.max(0, Math.min(1, c.r + (Math.random() * 2 - 1) * amount)),
        g: Math.max(0, Math.min(1, c.g + (Math.random() * 2 - 1) * amount)),
        b: Math.max(0, Math.min(1, c.b + (Math.random() * 2 - 1) * amount))
    };
}


function meshEmpty() {
    return {
        position: [],
        color: []
    };
}


function tetrahedron() {
    return {
        vertices: [
            [ 1,  1,  1],
            [ 1, -1, -1],
            [-1,  1, -1],
            [-1, -1,  1]
        ],
        faces: [
            [0, 1, 2],
            [3, 1, 0],
            [3, 2, 1],
            [3, 0, 2]
        ]
    };
}


function shapeToMesh(shape) {
    var position = [];
    for (var i = 0; i < shape.faces.length; i++) {
        var face = shape.faces[i];
        for (var j = 0; j < 3; j++) {
            position.push.apply(position, shape.vertices[face[j]]);
        }
    }
    return {
        position: position
    };
}


function meshAddRandomColors(mesh) {
    var color = [];
    var count = mesh.position.length / 3;
    for (var i = 0; i < count; i++) {
        var r = Math.random();
        var g = Math.random();
        var b = Math.random();
        color.push.apply(color, [r, g, b]);
    }
    mesh.color = color;
}


function meshSetColor(mesh, c) {
    var color = [];
    var count = mesh.position.length / 3;
    for (var i = 0; i < count; i++) {
        color.push.apply(color, [c.r, c.g, c.b]);
    }
    mesh.color = color;
}


function rotationMatrixXYZ(rotation) {
    var rot = glm.mat4.create();
    glm.mat4.rotateX(rot, rot, rotation.x);
    glm.mat4.rotateY(rot, rot, rotation.y);
    glm.mat4.rotateZ(rot, rot, rotation.z);
    return rot;
}

function randomRotation() {
    var rot = glm.mat4.create();
    glm.mat4.rotateX(rot, rot, Math.random() * Math.PI * 2);
    glm.mat4.rotateY(rot, rot, Math.random() * Math.PI * 2);
    glm.mat4.rotateZ(rot, rot, Math.random() * Math.PI * 2);
    return rot;
}


function meshApplyMatrix(mesh, matrix) {
    var newPosition = [];
    for (var i = 0; i < mesh.position.length/3; i++) {
        var x = mesh.position[i * 3 + 0];
        var y = mesh.position[i * 3 + 1];
        var z = mesh.position[i * 3 + 2];
        var p = glm.vec4.fromValues(x, y, z, 0);
        glm.vec4.transformMat4(p, p, matrix);
        newPosition.push(p[0]);
        newPosition.push(p[1]);
        newPosition.push(p[2]);
    }
    mesh.position = newPosition;
}

function meshRotateRandom(mesh) {
    var newPosition = [];
    var rot = glm.mat4.create();
    glm.mat4.rotateX(rot, rot, Math.random() * Math.PI * 2);
    glm.mat4.rotateY(rot, rot, Math.random() * Math.PI * 2);
    glm.mat4.rotateZ(rot, rot, Math.random() * Math.PI * 2);
    for (var i = 0; i < mesh.position.length/3; i++) {
        var x = mesh.position[i * 3 + 0];
        var y = mesh.position[i * 3 + 1];
        var z = mesh.position[i * 3 + 2];
        var p = glm.vec4.fromValues(x, y, z, 0);
        glm.vec4.transformMat4(p, p, rot);
        newPosition.push(p[0]);
        newPosition.push(p[1]);
        newPosition.push(p[2]);
    }
    mesh.position = newPosition;
}


function meshRotateX(mesh, theta) {
    var newPosition = [];
    var rot = glm.mat4.create();
    glm.mat4.rotateX(rot, rot, theta);
    for (var i = 0; i < mesh.position.length/3; i++) {
        var x = mesh.position[i * 3 + 0];
        var y = mesh.position[i * 3 + 1];
        var z = mesh.position[i * 3 + 2];
        var p = glm.vec4.fromValues(x, y, z, 0);
        glm.vec4.transformMat4(p, p, rot);
        newPosition.push(p[0]);
        newPosition.push(p[1]);
        newPosition.push(p[2]);
    }
    mesh.position = newPosition;
}


function meshRotateY(mesh, theta) {
    var newPosition = [];
    var rot = glm.mat4.create();
    glm.mat4.rotateY(rot, rot, theta);
    for (var i = 0; i < mesh.position.length/3; i++) {
        var x = mesh.position[i * 3 + 0];
        var y = mesh.position[i * 3 + 1];
        var z = mesh.position[i * 3 + 2];
        var p = glm.vec4.fromValues(x, y, z, 0);
        glm.vec4.transformMat4(p, p, rot);
        newPosition.push(p[0]);
        newPosition.push(p[1]);
        newPosition.push(p[2]);
    }
    mesh.position = newPosition;
}


function meshScale(mesh, sx, sy, sz) {
    for (var i = 0; i < mesh.position.length/3; i++) {
        mesh.position[i * 3 + 0] *= sx;
        mesh.position[i * 3 + 1] *= sy;
        mesh.position[i * 3 + 2] *= sz;
    }
}


function randomScale(max) {
    return {
        x: Math.random() * max,
        y: Math.random() * max,
        z: Math.random() * max
    };
}


function meshRandomScale(mesh, max) {
    var sx = Math.random() * max;
    var sy = Math.random() * max;
    var sz = Math.random() * max;
    meshScale(mesh, sx, sy, sz);
}


function meshReverseWinding(mesh) {
    for (var i = 0; i < mesh.position.length/9; i++) {
        var a = i * 9;
        var tx = mesh.position[a + 0];
        var ty = mesh.position[a + 1];
        var tz = mesh.position[a + 2];
        mesh.position[a + 0] = mesh.position[a + 3];
        mesh.position[a + 1] = mesh.position[a + 4];
        mesh.position[a + 2] = mesh.position[a + 5];
        mesh.position[a + 3] = tx;
        mesh.position[a + 4] = ty;
        mesh.position[a + 5] = tz;
    }
}


function meshReflectYZ(mesh) {
    for (var i = 0; i < mesh.position.length/3; i++) {
        mesh.position[i * 3 + 0] *= -1;
    }
    meshReverseWinding(mesh);
}


function meshTranslate(mesh, tx, ty, tz) {
    for (var i = 0; i < mesh.position.length/3; i++) {
        mesh.position[i * 3 + 0] += tx;
        mesh.position[i * 3 + 1] += ty;
        mesh.position[i * 3 + 2] += tz;
    }
}


function meshClone(mesh) {
    return JSON.parse(JSON.stringify(mesh));
}


function meshMerge(mesh0, mesh1) {
    var clone = meshClone(mesh0);
    if (mesh1.position) {
        if (clone.position) {
            clone.position.push.apply(clone.position, mesh1.position);
        }
    }
    if (mesh1.color) {
        if (clone.color) {
            clone.color.push.apply(clone.color, mesh1.color);
        }
    }
    return clone;
}


function calcTriNormal(p0, p1, p2) {
    var p0p1 = glm.vec3.create();
    var p0p2 = glm.vec3.create();
    var norm = glm.vec3.create();
    glm.vec3.sub(p0p1, p1, p0);
    glm.vec3.sub(p0p2, p2, p0);
    glm.vec3.cross(norm, p0p1, p0p2);
    glm.vec3.normalize(norm, norm);
    return norm;
}


function meshCalculateNormals(mesh) {
    var normal = [];
    for (var i = 0; i < mesh.position.length/9; i++) {
        var p0 = [
            mesh.position[i * 9 + 0],
            mesh.position[i * 9 + 1],
            mesh.position[i * 9 + 2],
        ];
        var p1 = [
            mesh.position[i * 9 + 3],
            mesh.position[i * 9 + 4],
            mesh.position[i * 9 + 5],
        ];
        var p2 = [
            mesh.position[i * 9 + 6],
            mesh.position[i * 9 + 7],
            mesh.position[i * 9 + 8],
        ];
        var norm = calcTriNormal(p0, p1, p2);
        normal.push.apply(normal, norm);
        normal.push.apply(normal, norm);
        normal.push.apply(normal, norm);
    }
    mesh.normal = normal;
}


function meshCalculateBounds(mesh) {
    var bounds = {
        min: {
            x: Infinity,
            y: Infinity,
            z: Infinity
        },
        max: {
            x: -Infinity,
            y: -Infinity,
            z: -Infinity
        }
    };
    for (var i = 0; i < mesh.position.length/3; i++) {
        bounds.min.x = Math.min(bounds.min.x, mesh.position[i * 3 + 0]);
        bounds.min.y = Math.min(bounds.min.y, mesh.position[i * 3 + 1]);
        bounds.min.z = Math.min(bounds.min.z, mesh.position[i * 3 + 2]);
        bounds.max.x = Math.max(bounds.max.x, mesh.position[i * 3 + 0]);
        bounds.max.y = Math.max(bounds.max.y, mesh.position[i * 3 + 1]);
        bounds.max.z = Math.max(bounds.max.z, mesh.position[i * 3 + 2]);
    }
    mesh.bounds = bounds;
}


function meshCenter(mesh) {
    if (!mesh.bounds) {
        meshCalculateBounds(mesh);
    }
    var b = mesh.bounds;
    var cx = b.min.x + 0.5 * (b.max.x - b.min.x);
    var cy = b.min.y + 0.5 * (b.max.y - b.min.y);
    var cz = b.min.z + 0.5 * (b.max.z - b.min.z);
    meshTranslate(mesh, -cx, -cy, -cz);
    meshCalculateBounds(mesh);
}


function meshNormalizeXY(mesh) {
    if (!mesh.bounds) {
        meshCalculateBounds(mesh);
    }
    var b = mesh.bounds;
    var scale = 1.0/Math.max(b.max.x, b.max.y);
    meshScale(mesh, scale, scale, scale);
    meshCalculateBounds(mesh);
}


function meshNormalizeZ(mesh) {
    if (!mesh.bounds) {
        meshCalculateBounds(mesh);
    }
    var b = mesh.bounds;
    var scale = 1.0/b.max.z;
    meshScale(mesh, scale, scale, scale);
    meshCalculateBounds(mesh);
}


function meshCalculateRadius(mesh) {
    var radius = 0;
    for (var i = 0; i < mesh.position.length/3; i++) {
        var dx = mesh.position[i * 3 + 0];
        var dy = mesh.position[i * 3 + 1];
        var dz = mesh.position[i * 3 + 2];
        var d = Math.sqrt(dx * dx + dy * dy + dz * dz);
        radius = Math.max(radius, d);
    }
    mesh.radius = radius;
}


function loadProgram(gl, src) {
    src = src.split("__split__");
    return new webgl.Program(gl, src[0], src[1]);
}
