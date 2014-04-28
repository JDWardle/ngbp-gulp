module.exports = function (karma) {
    karma.set({
        basePath: './',

        frameworks: ['jasmine'],

        files: [
            'bower_components/angular/angular.js',
            'bower_components/angular-mocks/angular-mocks.js',
            'src/**/*.js'
        ],

        reporters: 'dots',

        port: 9018,
        runnerPort: 9100,
        urlRoot: '/',

        autoWatch: false,
        
        plugins: ['karma-jasmine']
    });
};