/*
 * TODO: Karma test runner, live reload, compile index.html, compile vendor,
 * TODO: common templates, tests for the build process?
 *       Should we combine vendor .js and .css into our main.css and app.js
 *       files? Since some of the vendor files have their own unique way of
 *       including assets we may not be able in order to support everything.
 */

var gulp = require('gulp');
var globs = require('globs');

// Include gulp plugins.
var clean = require('gulp-clean');  // Clean directories.
var jshint = require('gulp-jshint'); // Lint .js files.
var coffee = require('gulp-coffee'); // Lint .coffee files.
var coffeelint = require('gulp-coffeelint'); // Compile .coffee files.
var concat = require('gulp-concat');
var uglify = require('gulp-uglify');
var rename = require('gulp-rename');
var less = require('gulp-less');
var minifyCSS = require('gulp-minify-css');
var html2js = require('gulp-html2js');
var template = require('gulp-template');
var runSequence = require('run-sequence');

// Include the config file.
var config = require('./config.js');

// Clean build and compile directories.
gulp.task('clean', function () {
    /**
     * Clean the build and compile directories without reading the files which
     * saves time.
     */
    return gulp.src([config.buildDir, config.compileDir], {read: false})
        .pipe(clean());
});

gulp.task('lint', function () {
    /**
     * Lint all .js files in the src/ directory.
     *
     * Available jshint reporters:
     *   https://github.com/jshint/jshint/tree/master/src/reporters
     */
    return gulp.src(config.appFiles.js)
        .pipe(jshint())
        .pipe(jshint.reporter('jshint-stylish'))
        .pipe(jshint.reporter('fail'));
});

gulp.task('cs-lint', function () {
    /**
     * Lint all .coffee files in the src/ directory.
     */
    return gulp.src(config.appFiles.cs)
        .pipe(coffeelint())
        .pipe(coffeelint.reporter('default'))
        .pipe(coffeelint.reporter('fail'));
});

gulp.task('coffee', ['cs-lint'], function () {
    /**
     * Compile .coffee files and move them into the build directory.
     *
     * Runs once the CoffeeScript has been linted.
     */
    return gulp.src(config.appFiles.cs)
        .pipe(coffee({bare: true}).on('error', function (err) {
            // Throw an error here just in case something was able to sneak past
            // the linter.
            throw err;
        }))
        .pipe(gulp.dest(config.buildDir));
});

gulp.task('copyJs', ['lint'], function () {
    /**
     * Copy all of the app .js files into the build directory.
     */
    return gulp.src(config.appFiles.js)
        .pipe(gulp.dest(config.buildDir));
});

gulp.task('concat', ['copyJs', 'html2js'], function () {
    /**
     * Concatenate all of the .js files into one file.
     *
     * Runs once the JavaScript has been linted and the CoffeeScript has been
     * compiled.
     */
    return gulp.src(config.buildDir + '/**/*.js')
        .pipe(concat('app.js'))
        .pipe(gulp.dest(config.compileDir));
});

gulp.task('uglify', ['concat'], function () {
    /**
     * Minify the app.js file into the app.min.js file.
     */
    return gulp.src(config.compileDir + '/app.js')
        .pipe(rename('app.min.js'))
        .pipe(uglify())
        .pipe(gulp.dest(config.compileDir));
});

gulp.task('less', function () {
    /**
     * Compiles the main.less file and moves it into the build directory.
     */
    return gulp.src(config.appFiles.less)
        .pipe(less())
        .pipe(gulp.dest(config.buildDir));
});

gulp.task('uglifyCSS', ['less'], function () {
    /**
     * Copy the main.css file into the compile directory and minify it into the
     * main.min.css file.
     */
    return gulp.src(config.buildDir + '/main.css')
        .pipe(gulp.dest(config.compileDir))
        .pipe(rename('main.min.css'))
//        .pipe(minifyCSS()) // TODO: Uncomment this once the gulp-minify-css package is fixed.
        .pipe(gulp.dest(config.compileDir));
});

gulp.task('html2js', function () {
    /**
     * Grab all of the .tpl.html files and concatenate them into the template.js
     * module.
     */
    return gulp.src(config.appFiles.appTpl)
        .pipe(html2js({
            base: 'src',
            outputModuleName: 'templates-app',
            indentString: '    ',
            useStrict: true
        }))
        .pipe(concat('templates-app.js'))
        .pipe(gulp.dest(config.buildDir));
});

gulp.task('watch', function () {
    /**
     * Watch the app files for any changes and perform the necessary actions
     * when a change does occur.
     */
    gulp.watch(config.appFiles.js, ['lint', 'copyJs']);
    gulp.watch(config.appFiles.cs, ['cs-lint', 'coffee']);
    gulp.watch(config.appFiles.appTpl, ['html2js']);
    gulp.watch(config.appFiles.less, ['less']);
    gulp.watch(config.appFiles.index, ['index']);
});

gulp.task('index', function () {
    /**
     * Build the index.html template.
     */
    var scripts = [];
    var styles = [];

    // Grab all of the vendor .js files.
    var vendorJs = globs.sync(config.vendorFiles.js, {
        nosort: true
    });

    // Grab all of the app .js files.
    var appJs = globs.sync(['app/**/*.js'], {
        cwd: config.buildDir,
        nosort: true
    });

    // Grab all of the common .js files.
    var commonJs = globs.sync(['common/**/*.js'], {
        cwd: config.buildDir,
        nosort: true
    });

    scripts = scripts.concat(vendorJs);
    scripts.push('templates-app.js');
    scripts = scripts.concat(appJs);
    scripts = scripts.concat(commonJs);

    // Grab all of the vendor .css files.
    var vendorCSS = globs.sync(config.vendorFiles.css, {
        nosort: true
    });

    styles = styles.concat(vendorCSS);

    // Add main.css to the end of the list.
    styles.push('main.css');

    return gulp.src(config.appFiles.index)
        .pipe(template({
            scripts: scripts,
            styles: styles
        }))
        .pipe(gulp.dest(config.buildDir));
});

gulp.task('vendorJs', function () {
    /**
     * Copy all of the vendor .js files defined in the config into the build
     * directory.
     */
    return gulp.src(config.vendorFiles.js, {base: './'})
        .pipe(gulp.dest(config.buildDir));
});

gulp.task('vendorCSS', function () {
    /**
     * Copy all of the vendor .css files defined in the config into the build
     * directory.
     */
    return gulp.src(config.vendorFiles.css, {base: './'})
        .pipe(gulp.dest(config.buildDir));
});

gulp.task('vendorAssets', function () {
    /**
     * Copy all of the vendor asset files defined in the config into the build
     * directory.
     */
    return gulp.src(config.vendorFiles.assets, {base: './'})
        .pipe(gulp.dest(config.buildDir));
});

gulp.task('build', function (callback) {
    runSequence('clean',
        [
            'lint', 'cs-lint', 'coffee', 'copyJs', 'html2js', 'less', 'vendorJs',
            'vendorCSS', 'vendorAssets', 'watch'
        ],
        'index',
        callback
    );
});

gulp.task('compile', function (callback) {
    runSequence(
        ['concat', 'uglify', 'uglifyCSS'],
        'compile-index',
        callback
    );
});

gulp.task('default', ['build', 'compile']);

