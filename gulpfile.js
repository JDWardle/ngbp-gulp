var gulp = require('gulp');
var glob = require('glob');

// Include gulp plugins.
var jshint = require('gulp-jshint');
var less = require('gulp-less');
var concat = require('gulp-concat');
var uglify = require('gulp-uglify');
var templateCache = require('gulp-angular-templatecache');
var template = require('gulp-template');
var karma = require('gulp-karma');
var clean = require('gulp-clean');
var minifyCSS = require('gulp-minify-css');
var runSequence = require('run-sequence');

// Include the config file.
var config = require('./config.js');

// Clean build and compile directories.
gulp.task('clean', function () {
    return gulp.src([config.buildDir, config.compileDir], {read: false})
        .pipe(clean());
});

// Clean the build directory.
gulp.task('clean-build', function () {
    return gulp.src(config.buildDir, {read: false})
        .pipe(clean());
});

// Clean the compile directory.
gulp.task('clean-compile', function () {
    return gulp.src(config.compileDir, {read: false})
        .pipe(clean());
});

// Copy all .js files maintaining relative path.
gulp.task('build-js', function () {
    return gulp.src(config.appFiles.js, {base: './'})
        .pipe(gulp.dest(config.buildDir));
});

// Copy all .less files and compile them while maintaining relative path.
gulp.task('build-less', function () {
    return gulp.src(config.appFiles.less, {base: './'})
        .pipe(less())
        .pipe(gulp.dest(config.buildDir));
});

// Concatenate AngularJS templates into $templateCache.
gulp.task('build-html2js', function () {
    return gulp.src(config.appFiles.appTpl)
        .pipe(templateCache())
        .pipe(gulp.dest(config.buildDir));
});

gulp.task('build-index', ['build-js', 'build-less', 'build-html2js'], function () {
    return gulp.src('src/index.html')
        .pipe(template({
            scripts: glob.sync('**/*.js', {
                cwd: config.buildDir,
                nosort: true
            }),
            styles: glob.sync('**/*.css', {
                cwd: config.buildDir,
                nosort: true
            })
        }))
        .pipe(gulp.dest(config.buildDir));
});

// Lint .js files.
gulp.task('lint', function () {
    return gulp.src(config.appFiles.js)
        .pipe(jshint())
        .pipe(jshint.reporter('default'));
});

// Concat and compile styles.
gulp.task('compile-less', function () {
    return gulp.src(config.appFiles.less)
        .pipe(concat('main.min.less'))
        .pipe(less())
        .pipe(minifyCSS())
        .pipe(gulp.dest(config.compileDir));
});

// Concatenate AngularJS templates into $templateCache.
gulp.task('compile-html2js', function () {
    return gulp.src(config.appFiles.appTpl)
        .pipe(templateCache())
        .pipe(gulp.dest(config.buildDir));
});

// Concatenate & minify js.
gulp.task('compile-js', function () {
    return gulp.src(config.appFiles.js)
        .pipe(concat('app.js'))
        .pipe(gulp.dest(config.buildDir));
});

gulp.task('compile-uglify', ['compile-html2js', 'compile-js'], function () {
    return gulp.src(config.buildDir + '/*.js')
        .pipe(concat('app.min.js'))
        .pipe(uglify())
        .pipe(gulp.dest(config.compileDir));
});

// Compile the index.
gulp.task('compile-index', ['compile-uglify', 'compile-less'], function () {
    return gulp.src('src/index.html')
        .pipe(template({
            scripts: ['app.min.js'],
            styles: ['main.min.css']
        }))
        .pipe(gulp.dest(config.compileDir));
});

// Watch files for changes.
gulp.task('watch', function () {
    gulp.watch(config.appFiles.js, ['lint', 'build-html2js', 'build-js']);
    gulp.watch(config.appFiles.less, ['build-less']);
});

// Development build task.
gulp.task('build', function (callback) {
    runSequence('clean', [
        'lint', 'build-html2js', 'build-js', 'build-less', 'build-index',
        'watch'],
        callback
    );
});

// Compile the files for production.
gulp.task('compile', function (callback) {
    runSequence('clean', [
        'compile-less', 'compile-js', 'compile-html2js', 'compile-uglify',
        'compile-index'],
        'clean-build',
        callback
    );
});