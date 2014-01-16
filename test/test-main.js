var Karma = window.__karma__ || window.karma;

var testModules = [];
for (var file in Karma.files) {
    if (Karma.files.hasOwnProperty(file)) {
        if (/Spec\.js$/.test(file)) {
            testModules.push(file);
        }
    }
}

requirejs.config({
    // Karma serves files from '/base'
    baseUrl: '/base',
    paths: {
        'promises': 'node_modules/d.js/lib/D',
        'json3': 'node_modules/json3/lib/json3',
        'requests': 'node_modules/reqwest/src/reqwest',
        'client': 'source/client',
        'settings': 'source/settings',
        'utils': 'source/utils',
        'query': 'source/query',
        'resource': 'source/resource'
    },

    // ask Require.js to load these files (all our tests)
    deps: testModules,

    // start test run, once Require.js is done
    callback: function () {
        Karma.start();
    }
});
