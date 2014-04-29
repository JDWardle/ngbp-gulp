var gulp = require('gulp');
// var glob = require('glob');

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
// var templateCache = require('gulp-angular-templatecache');
// var template = require('gulp-template');
// var karma = require('gulp-karma');
// var runSequence = require('run-sequence');

var using = require('gulp-using');

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

gulp.task('copyJs', ['lint', 'coffee'], function () {
    /**
     * Copy all of the app .js files into the build directory.
     */
    return gulp.src(config.appFiles.js)
        .pipe(gulp.dest(config.buildDir));
});

gulp.task('concat', ['copyJs'], function () {
    /**
     * Concatenate all of the .js files into one file.
     *
     * Runs once the JavaScript has been linted and the CoffeeScript has been
     * compiled.
     */
    return gulp.src(config.buildDir + '/app/**/*.js')
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

gulp.task('less', ['copyJs'], function () {
    /**
     * Concatenates .less files into main.less, compiles it and moves it into
     * the build directory.
     */
    return gulp.src(config.appFiles.less)
        .pipe(concat('less/main.less'))
        .pipe(less())
        .pipe(rename(function (path) {
            path.dirname = '';
        }))
        .pipe(gulp.dest(config.buildDir));
});

gulp.task('uglifyCSS', ['less'], function () {
    /**
     * Copy the main.css file into the compile directory and minify it into the
     * main.min.css file.
     */
    return gulp.src(config.buildDir + '/main.css')
        .pipe(gulp.dest(config.compileDir))
        .pipe(using())
        .pipe(rename('main.min.css'))
        // .pipe(minifyCSS()) TODO: Uncomment this once gulp-minify-css is fixed.
        .pipe(gulp.dest(config.compileDir));
});

gulp.task('default', ['clean', 'lint', 'cs-lint', 'coffee', 'copyJs', 'concat', 'uglify', 'less', 'uglifyCSS']);

// // Copy all .js files maintaining relative path.
// gulp.task('build-js', ['build-less'], function () {
//     return gulp.src(config.appFiles.js, {base: './'})
//         .pipe(using())
//         .pipe(gulp.dest(config.buildDir));
// });

// // Copy all .less files and compile them while maintaining relative path.
// gulp.task('build-less', function () {
//     return gulp.src(config.appFiles.less, {base: './'})
//         .pipe(less())
//         .pipe(gulp.dest(config.buildDir));
// });

// gulp.task('build-vendor-js', function () {
//     return gulp.src(config.vendorFiles.js, {base: './bower_components'})
//         .pipe(using())
//         .pipe(gulp.dest(config.buildDir + '/vendor'));
// });

// // Concatenate app templates into $templateCache.
// gulp.task('html2js-app', function () {
//     return gulp.src(config.appFiles.appTpl)
//         .pipe(templateCache('templates-app.js', {
//             module: 'templates-app'
//         }))
//         .pipe(gulp.dest(config.buildDir));
// });

// // Concatenate common templates into $templateCache.
// gulp.task('html2js-common', function () {
//     return gulp.src(config.appFiles.commonTpl)
//         .pipe(templateCache('templates-common.js', {
//             module: 'templates-common'
//         }))
//         .pipe(gulp.dest(config.buildDir));
// });

// gulp.task('build-index', ['build-js', 'build-less', 'build-vendor-js', 'html2js-app', 'html2js-common'], function () {
//     var scripts = [];

//     var vendorJs = glob.sync('vendor/**/*.js', {
//         cwd: config.buildDir,
//         nosort: true
//     });

//     var commonJs = glob.sync('src/common/**/*.js', {
//         cwd: config.buildDir,
//         nosort: true
//     });

//     var appJs = glob.sync('src/app/**/*.js', {
//         cwd: config.buildDir,
//         nosort: true
//     });

//     var rootJs = glob.sync('*.js', {
//         cwd: config.buildDir,
//         nosort: true
//     });

//     // Add vendor .js files to the scripts.
//     scripts = scripts.concat(vendorJs);

//     // Add the app .js files to the scripts.
//     scripts = scripts.concat(appJs);

//     // Add common .js files to the scripts.
//     scripts = scripts.concat(commonJs);

//     // Add the root .js files to the scripts.
//     scripts = scripts.concat(rootJs);

//     console.log(scripts);

//     return gulp.src('src/index.html')
//         .pipe(template({
//             scripts: scripts,
//             styles: glob.sync('**/*.css', {
//                 cwd: config.buildDir,
//                 nosort: true
//             }),
//             version: 'wat'
//         }))
//         .pipe(gulp.dest(config.buildDir));
// });

// // Lint .js files.
// gulp.task('lint', function () {
//     return gulp.src(config.appFiles.js)
//         .pipe(jshint())
//         .pipe(jshint.reporter('default'));
// });

// // Concat and compile styles.
// gulp.task('compile-less', function () {
//     return gulp.src(config.buildDir + '/**/*.less')
//         .pipe(concat('main.min.less'))
//         .pipe(less())
//         .pipe(minifyCSS())
//         .pipe(gulp.dest(config.compileDir));
// });

// // Concatenate & minify js.
// gulp.task('compile-js', function () {
//     return gulp.src(config.buildDir + '/**/*.js')
//         .pipe(concat('app.min.js'))
//         .pipe(uglify())
//         .pipe(gulp.dest(config.buildDir));
// });

// // Compile the index.
// gulp.task('compile-index', ['compile-uglify', 'compile-less'], function () {
//     return gulp.src('src/index.html')
//         .pipe(template({
//             scripts: ['app.min.js'],
//             styles: ['main.min.css']
//         }))
//         .pipe(gulp.dest(config.compileDir));
// });

// // Run tests with Karma.
// gulp.task('karma', function () {
//     return gulp.src(config.appFiles.jsTest)
//         .pipe(karma({
//             configFile: 'karma.config.js',
//             action: 'run'
//         }))
//         .on('error', function (err) {
//             throw err;
//         });
// });

// // Watch files for changes.
// gulp.task('watch', function () {
//     gulp.watch(config.appFiles.js, ['lint', 'html2js-app', 'build-js']);
//     gulp.watch(config.appFiles.less, ['build-less']);
// });

// gulp.task('build', function (callback) {
//     runSequence('clean', [
//         'lint', 'html2js-app', 'html2js-common', 'build-less', 'build-js',
//         'build-vendor-js', 'build-index', 'watch']
//     );
// });

// gulp.task('compile', ['compile-less', 'compile-js', 'compile-index']);

// gulp.task('default', ['build', 'compile']);
