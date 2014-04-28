module.exports = {
    buildDir: 'build',
    compileDir: 'bin',

    appFiles: {
        assets: ['src/assets/**'],

        js: ['src/**/*.js', '!src/**/*.spec.js', '!src/assets/**/*.js'],
        jsTest: ['src/**/*.spec.js'],

        cs: ['src/**/*.coffee', '!src/**/*.spec.coffee', '!src/assets/**/*.cofeee'],
        csTest: ['src/**/*.spec.coffee'],

        appTpl: ['src/app/**/*.tpl.html'],
        commonTpl: ['src/common/**/*.tpl.html'],

        index: ['src/index.html'],

        less: ['src/**/*.less', '!src/less/variables.less']
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
