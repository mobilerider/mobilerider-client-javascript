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
            src: ['tmp/**/*.js'],
            dest: 'dist/mobilerider-client.js'
        }
    }
});

grunt.registerTask('build', ['transpile:browser', 'concat:browser']);

};