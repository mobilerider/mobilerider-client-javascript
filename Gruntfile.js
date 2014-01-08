module.exports = function (grunt) {
    require('matchdep').filterDev('grunt-*').forEach(grunt.loadNpmTasks);

    grunt.initConfig({
        transpile: {
            browser: {
                type: 'amd',
                files: [{
                    expand: true,
                    cwd: 'source/',
                    src: ['**/*.js'],
                    dest: 'tmp/'
                }]
            }
        },
        concat: {
            browser: {
                src: [
                    'node_modules/es6-promise/dist/promise-*.amd.js',
                    'tmp/**/*.js'
                ],
                dest: 'dist/mobilerider-client.js'
            }
        }
    });

    grunt.registerTask('build', ['transpile:browser', 'concat:browser']);

};