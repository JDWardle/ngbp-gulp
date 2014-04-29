module.exports = {
    buildDir: 'build',
    compileDir: 'bin',

    appFiles: {
        // Grabs all of the assets for the app.
        assets: ['src/assets/**'],

        // Grab all .js files in the src/ directory and subdirectories aside
        // from tests and asset .js files.
        js: ['src/**/*.js', '!src/**/*.spec.js', '!src/assets/**/*.js'],
        jsTest: ['src/**/*.spec.js'],

        // Grab all .coffee files in the src/ directory and subdirectories aside
        // from tests and asset .coffee files.
        //
        // NOTE: If you do use CoffeeScript with JavaScript, make sure you don't
        // have files with the same name in the same directory:
        //   src/
        //     app/
        //       app.js
        //       app.coffee
        cs: ['src/**/*.coffee', '!src/**/*.spec.coffee', '!src/assets/**/*.cofeee'],
        csTest: ['src/**/*.spec.coffee'],

        // Grab all of the html template files.
        appTpl: ['src/app/**/*.tpl.html'],
        commonTpl: ['src/common/**/*.tpl.html'],

        // The main .html file for the SPA app.
        index: ['src/index.html'],

        // Get all of the .less files in src/ and it's subdirectories.
        // Should ignore files that are included by other .less files.
        less: ['src/**/*.less']
    },

    vendorFiles: {
        js: [
            'bower_components/angular/angular.js',
            'bower_components/angular-bootstrap/ui-bootstrap-tpls.min.js',
            'bower_components/placeholders/angular-placeholders-0.0.1-SNAPSHOT.min.js',
            'bower_components/angular-ui-router/release/angular-ui-router.js',
            'bower_components/angular-ui-utils/modules/route/route.js'
        ],

        css: [
        ],

        assets: [
        ]
    }
};
