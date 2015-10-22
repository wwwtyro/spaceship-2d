"use strict";

var fs = require('fs');
var sys = require('sys');

module.exports = function(canvas, filename) {
    var img = canvas.toDataURL();
    var data = img.replace(/^data:image\/\w+;base64,/, "");
    var buf = new Buffer(data, 'base64');
    fs.writeFileSync(filename, buf);
}
