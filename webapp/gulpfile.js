"use strict";

var gulp = require("gulp");
var rename = require("gulp-rename");
var browserify = require("gulp-browserify");
var connect = require('gulp-connect');


gulp.task('connect', function() {

    connect.server({
        port: 8080,
        root: ['build'],
    });

});


gulp.task("build", function() {

    gulp.src("src/main.js", {read: false})
        .pipe(browserify({
            transform: ["brfs"]
        }))
        .pipe(rename("bundle.js"))
        .pipe(gulp.dest("build"));

    gulp.src("src/{*.html,*.css}")
        .pipe(gulp.dest("build"));

    gulp.src(['static/**/*'])
        .pipe(gulp.dest('build/static'));

})


gulp.task("watch", ["connect", "build"], function() {

    gulp.watch("src/**/*", ["build"])

});
