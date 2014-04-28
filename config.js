module.exports = {
    buildDir: 'build',
    compileDir: 'bin',

    appFiles: {
        js: ['src/**/*.js', '!src/**/*.spec.js', '!src/assets/**/*.js'],
        jsTest: ['src/**/*.spec.js'],

        appTpl: ['src/app/**/*.tpl.html'],
        commonTpl: ['src/common/**/*.tpl.html'],

        index: ['src/index.html'],

        less: ['src/**/*.less']
    }
};
