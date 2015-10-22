"use strict";

var fs = require("fs");
var ship2d = require("../../spaceship2d");

var displayResolution = 512;

var shipCount = 9;

window.onload = function(){

    window.onerror = function(e) {
        toastr.error(e);
        return false;
    }

    ////////////////////////////////////////////////////////////////////////////////////////////////
    // Controls ////////////////////////////////////////////////////////////////////////////////////
    ////////////////////////////////////////////////////////////////////////////////////////////////
    var ControlsMenu = function() {
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
    var spriteContainer = document.getElementById("sprite-container");

    var canvases = [];
    var saveIcons = [];
    for (var i = 0; i < shipCount; i++) {
        var canvas = document.createElement("canvas");
        canvas.width = canvas.height = 768;
        canvas.style.width = canvas.style.height = "256px";
        canvas.style.paddingRight = "32px";
        spriteContainer.appendChild(canvas);
        canvas.id = i;
        canvas.onclick = function() {
            var id = parseInt(this.id);
            for (var j = 0; j < shipCount; j++) {
                if (j == id) {
                    continue;
                }
                ships[j] = ship2d.mutateShip(ships[id], menu.baseColor, menu.colorVariation, menu.shapeMutation);
            }
            render();
        };
        canvases.push(canvas);
        var img = document.createElement("img");
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
            var diag = vex.open({
                content: fs.readFileSync(__dirname + "/save-dialog.html", "utf8")
            });
            var id = parseInt(this.number);
            function _render() {
                var ship = ships[id];
                saveRenderer.render(ship);
                var container = document.getElementById("save-dialog-render-container");
                container.innerHTML = "";
                saveRenderer.colorSprite.className = "save-dialog-sprite";
                saveRenderer.normalSprite.className = "save-dialog-sprite";
                saveRenderer.depthSprite.className = "save-dialog-sprite";
                saveRenderer.positionSprite.className = "save-dialog-sprite";
                container.appendChild(saveRenderer.colorSprite);
                container.appendChild(saveRenderer.normalSprite);
                container.appendChild(saveRenderer.depthSprite);
                container.appendChild(saveRenderer.positionSprite);
            }
            _render();
            document.getElementById("save-dialog-resolution").onchange = function() {
                saveRenderer = new ship2d.Renderer({
                    resolution: parseInt(this.value)
                });
                _render();
            };
        };
        (function(_img, _canvas) {
            $(_canvas).hover(function() {
                $(_img).fadeIn(0);
            }, function() {
                $(_img).fadeOut(0);
            });
            $(_img).hover(function() {
                $(_img).fadeIn(0);
            }, function() {
                $(_img).fadeOut(0);
            });
        })(img, canvas);
    }

    var ships = [];
    for (var i = 0; i < shipCount; i++) {
        ships.push(ship2d.generateShip());
    }

    var displayRenderer = new ship2d.Renderer({
        resolution: displayResolution
    });

    var saveRenderer = new ship2d.Renderer({
        resolution: menu.resolution
    });

    render();

    function render() {
        for (var i = 0; i < shipCount; i++) {
            var ship = ships[i];
            var canvas = canvases[i];
            displayRenderer.render(ship);
            canvas.width = canvas.height = displayResolution;
            var ctx = canvas.getContext("2d");
            ctx.drawImage(displayRenderer.colorSprite, 0, 0);
        }
    }

    function showHelp() {
        var diag = vex.open({
            content: fs.readFileSync(__dirname + "/help-dialog.html", "utf8")
        });
    }



};
