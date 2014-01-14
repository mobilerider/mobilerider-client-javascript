module.exports = function (grunt) {
    require('matchdep').filterDev('grunt-*').forEach(grunt.loadNpmTasks);

    grunt.initConfig({
        requirejs: {
            compile: {
                options: {
                    almond: true,
                    baseUrl: 'source/',
                    out: 'dist/mobilerider-client.js',
                    include: ['client'],
                    paths: {
                        'promises': '../node_modules/d.js/lib/D',
                        'requests': '../node_modules/reqwest/src/reqwest',
                        // 'client': 'source/client.js',
                        // 'settings': 'source/settings',
                        // 'settings': 'source/settings',
                    },
                },
            },
        },
        karma: {
            test: {
                options: {
                    // base path, that will be used to resolve files and exclude
                    basePath: '',

                    // frameworks to use
                    frameworks: ['mocha', 'requirejs', 'chai', 'sinon', 'expect'],

                    // list of files / patterns to load in the browser
                    files: [
                        // {pattern: 'lib/**/*.js', included: false},
                        // {pattern: 'source/**/*.js', included: false},
                        {pattern: 'dist/*.js', included: false},
                        {pattern: 'source/*.js', included: false},
                        {pattern: 'node_modules/d.js/**/*.js', included: false},
                        {pattern: 'node_modules/reqwest/**/*.js', included: false},
                        {pattern: 'test/**/*Spec.js', included: false},
                        'test/test-main.js',
                    ],

                    // list of files/patterns to exclude
                    exclude: [],

                    // test results reporter to use
                    // possible values: 'dots', 'progress', 'junit', 'growl', 'coverage'
                    reporters: ['progress', 'coverage'],

                    // We need 'coverage' both in `reporters` and `preprocessors`
                    // The coverage data will be stored into the "coverage/" folder
                    // both in HTML and JSON format
                    preprocessors: {
                        'source/*.js': ['coverage'],
                        'dist/*.js': ['coverage'],
                    },

                    coverageReporter: {
                        reporters:[
                            {type: 'text'}
                        ],
                    },

                    // enable / disable colors in the output (reporters and logs)
                    colors: true,

                    // level of logging
                    // possible values: config.LOG_DISABLE || config.LOG_ERROR || config.LOG_WARN || config.LOG_INFO || config.LOG_DEBUG
                    logLevel: 'INFO',

                    // enable / disable watching file and executing tests whenever any file changes
                    autoWatch: true,

                    // Start these browsers, currently available:
                    // - Chrome
                    // - ChromeCanary
                    // - Firefox
                    // - Opera
                    // - Safari (only Mac)
                    // - PhantomJS
                    // - IE (only Windows)
                    // PhantomJS appears to be used even if not listed here
                    browsers: ['Chrome'],

                    // If browser does not capture in given timeout [ms], kill it
                    captureTimeout: 60000,

                    // Continuous Integration mode
                    // if true, it capture browsers, run tests and exit
                    singleRun: true
                }
            }
        },
    });

    grunt.registerTask('build', [
        'requirejs:compile'
    ]);
    grunt.registerTask('test', [
        'karma:test'
    ]);
    grunt.registerTask('default', [
        'test',
        'build',
    ]);
};
