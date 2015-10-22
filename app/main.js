"use strict";

let path = require("path");
let fs = require("fs");

let sprintf = require("sprintf").sprintf;

let ship2d = require("../spaceship2d");
let savePNG = require("./save-png");

let displayResolution = 512;

let shipCount = 9;

let __dirname = process.cwd();

function main() {

    window.onerror = function(e) {
        toastr.error(e);
        console.error(e);
        return false;
    }

    ////////////////////////////////////////////////////////////////////////////////////////////////
    // Controls ////////////////////////////////////////////////////////////////////////////////////
    ////////////////////////////////////////////////////////////////////////////////////////////////
    let ControlsMenu = function() {
        this.startOver = function() {
            for (var i = 0; i < shipCount; i++) {
                ships[i] = ship2d.generateShip();
            }
            render();
        }
        this.baseColor = 0.1;
        this.colorVariation = 0.1;
        this.shapeMutation = 0.25;
        this.resetMutation = function() {
            this.baseColor = 0.1;
            this.colorVariation = 0.1;
            this.shapeMutation = 0.25;
        };
        this.help = function() {
            showHelp();
        }
    };

    var menu = new ControlsMenu();
    var gui = new dat.GUI({
        autoPlace: false,
        width: 308
    });
    gui.add(menu, 'startOver').name("Start Over");
    gui.add(menu, 'resetMutation').name("Reset Mutation Rates");
    gui.add(menu, 'baseColor', 0, 1).name("Base Color Mutation").listen();
    gui.add(menu, 'colorVariation', 0, 1).name("Detail Color Mutation").listen();
    gui.add(menu, 'shapeMutation', 0, 1).name("Shape Mutation").listen();
    gui.add(menu, 'help').name("Help");
    document.getElementById("controls-container").appendChild(gui.domElement);

    ////////////////////////////////////////////////////////////////////////////////////////////////
    // Rendering ///////////////////////////////////////////////////////////////////////////////////
    ////////////////////////////////////////////////////////////////////////////////////////////////
    let spriteContainer = document.getElementById("sprite-container");

    let canvases = [];
    let saveIcons = [];
    for (let i = 0; i < shipCount; i++) {
        let canvas = document.createElement("canvas");
        canvas.width = canvas.height = 768;
        canvas.style.width = canvas.style.height = "256px";
        canvas.style.paddingRight = "32px";
        spriteContainer.appendChild(canvas);
        canvas.id = i;
        canvas.onclick = function() {
            let id = parseInt(canvas.id);
            for (let j = 0; j < shipCount; j++) {
                if (j == id) {
                    continue;
                }
                ships[j] = ship2d.mutateShip(ships[id], menu.baseColor, menu.colorVariation, menu.shapeMutation);
            }
            render();
        };
        let img = document.createElement("img");
        img.number = i;
        saveIcons.push(img);
        img.src = "static/img/save-icon.png";
        img.style.position = "relative";
        img.style.left = "-32px";
        img.style.marginRight = "-32px";
        img.style.top = "-32px";
        img.style.marginBottom = "-32px";
        spriteContainer.appendChild(img);
        $(img).fadeOut(0);
        img.onclick = function() {
            let id = parseInt(img.number);
            let diag = vex.open({
                content: fs.readFileSync(__dirname + "/save-dialog.html", "utf8")
            });
            let saveRenderer = new ship2d.Renderer({
                resolution: parseInt(document.getElementById("save-dialog-resolution").value)
            });
            document.getElementById("save-dialog-resolution").onchange = function() {
                saveRenderer = new ship2d.Renderer({
                    resolution: parseInt(this.value)
                });
            };
            document.getElementById("save-dialog-save").onclick = function() {
                let el = document.getElementById("save-dialog-filename")
                el.onchange = function() {
                    _renderLoop(0, this.value);
                }
                el.click();
            };
            function _renderLoop(index, prefix) {
                let mut;
                if (index == 0) {
                    mut = ships[id];
                } else {
                    mut = ship2d.mutateShip(ships[id], menu.baseColor, menu.colorVariation, menu.shapeMutation);
                }
                saveRenderer.render(mut);
                let container = document.getElementById("save-dialog-container");
                container.innerHTML = "";
                saveRenderer.colorSprite.style.width = "100%";
                container.appendChild(saveRenderer.colorSprite);
                let colorFilePath = sprintf("%s-color-%04d.png", prefix, index);
                let normalFilePath = sprintf("%s-normal-%04d.png", prefix, index);
                let depthFilePath = sprintf("%s-depth-%04d.png", prefix, index);
                let positionFilePath = sprintf("%s-position-%04d.png", prefix, index);
                savePNG(saveRenderer.colorSprite, colorFilePath);
                savePNG(saveRenderer.normalSprite, normalFilePath);
                savePNG(saveRenderer.depthSprite, depthFilePath);
                savePNG(saveRenderer.positionSprite, positionFilePath);
                let count = parseInt(document.getElementById("save-dialog-count").value);
                document.getElementById("save-dialog-progress").style.width = (100 * index/count) + "%";
                if (index + 1 < count) {
                    window.setTimeout(_renderLoop, 16, index + 1, prefix);
                } else {
                    vex.close(diag.data().vex.id);
                    toastr.success(sprintf("Saved %s", prefix));
                }
            }
        }
        $(canvas).hover(function() {
            $(img).fadeIn(0);
        }, function() {
            $(img).fadeOut(0);
        });
        $(img).hover(function() {
            $(img).fadeIn(0);
        }, function() {
            $(img).fadeOut(0);
        });
        canvases.push(canvas);
    }

    let ships = [];
    for (let i = 0; i < shipCount; i++) {
        ships.push(ship2d.generateShip());
    }

    let displayRenderer = new ship2d.Renderer({
        resolution: displayResolution
    });

    render();

    function render() {
        for (let i = 0; i < shipCount; i++) {
            let ship = ships[i];
            let canvas = canvases[i];
            displayRenderer.render(ship);
            canvas.width = canvas.height = displayResolution;
            let ctx = canvas.getContext("2d");
            ctx.drawImage(displayRenderer.colorSprite, 0, 0);
        }
    }

    function showHelp() {
        let diag = vex.open({
            content: fs.readFileSync(__dirname + "/help-dialog.html", "utf8")
        });
    }

};

function choosePath(name, element) {
    var chooser = document.querySelector(name);
    chooser.addEventListener("change", function(evt) {
        element.setValue(this.value);
    }, false);
    chooser.click();
}
