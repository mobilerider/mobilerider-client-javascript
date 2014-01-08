module.exports = function (grunt) {

grunt.loadNpmTasks('grunt-contrib-concat');
grunt.loadNpmTasks('grunt-es6-module-transpiler');

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
            src: ['tmp/**/*.js'],
            dest: 'dist/mobilerider-client.js'
        }
    }
});

grunt.registerTask('build', ['transpile:browser', 'concat:browser']);

};