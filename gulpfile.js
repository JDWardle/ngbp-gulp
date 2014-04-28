var gulp = require('gulp');
var glob = require('glob');

// Include gulp plugins.
var jshint = require('gulp-jshint');
var less = require('gulp-less');
var concat = require('gulp-concat');
var uglify = require('gulp-uglify');
var rename = require('gulp-rename');
var templateCache = require('gulp-angular-templatecache');
var template = require('gulp-template');
var karma = require('gulp-karma');
var clean = require('gulp-clean');
var using = require('gulp-using');
var minifyCSS = require('gulp-minify-css');
var help = require('gulp-task-listing');
var streamqueue = require('streamqueue');

// Add a task for the gulp-task-listing.
gulp.task('help', help);

// Include the config file.
var config = require('./config.js');

// Clean build and compile directories.
gulp.task('clean', function () {
    return gulp.src([config.buildDir, config.compileDir], {read: false})
        .pipe(clean());
});

// Copy all .js files maintaining relative path.
gulp.task('build-js', function () {
    return gulp.src(config.appFiles.js, {base: './'})
        .pipe(gulp.dest(config.buildDir));
});

// Copy all .less files and compile them while maintaining relative path.
gulp.task('build-css', function () {
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

gulp.task('build-index', ['build-js', 'build-css', 'build-html2js'], function () {
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
gulp.task('compile-css', function () {
    return gulp.src(config.appFiles.less)
        .pipe(concat('main.min.less'))
        .pipe(less())
        .pipe(minifyCSS())
        .pipe(gulp.dest(config.compileDir));
});

// Concatenate & minify js.
gulp.task('compile-js', ['compile-html2js'], function () {
    return gulp.src('bin/**/*.js')
        .pipe(concat('app.min.js'))
        .pipe(uglify())
        .pipe(gulp.dest(config.compileDir));
});

// Compile the index.
gulp.task('compile-index', ['compile-js', 'compile-css'], function () {
    return gulp.src('src/index.html')
        .pipe(template({
            scripts: [config.compileDir + '/' + 'app.min.js'],
            styles: [config.compileDir + '/' + 'main.css']
        }))
        .pipe(gulp.dest(config.compileDir));
});

// Concatenate AngularJS templates into $templateCache.
gulp.task('compile-html2js', function () {
    return gulp.src(config.appFiles.appTpl)
        .pipe(templateCache())
        .pipe(uglify())
        .pipe(gulp.dest(config.compileDir));
});

// Watch files for changes.
gulp.task('watch', function () {
    gulp.watch(config.appFiles.js, ['lint', 'build-html2js', 'build-scripts']);
    gulp.watch(config.appFiles.less, ['build-css']);
});

// Development build task.
gulp.task('build', [
    'clean', 'lint', 'build-html2js', 'build-js', 'build-css', 'build-index',
    'watch'
]);

// Compile the files for production.
gulp.task('compile', ['clean', 'compile-html2js', 'compile-js', 'compile-css']);