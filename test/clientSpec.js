define(['client'], function (Client) {
    // sinonLog = sinon.log;
    // before(function () { sinon.log = function () { console.log.apply(console, arguments); }; });
    // after(function () { sinon.log = sinonLog; });

    describe('Client class', function () {

        describe('#constructor', function () {

            it('should complain about missing parameters', function () {
                var createClient = function () { return new Client(); };
                expect(createClient).to.throwException();
                createClient = function () { return new Client({ appId: 'someId' }); };
                expect(createClient).to.throwException();
                createClient = function () { return new Client({ appSecret: 'someSecret' }); };
                expect(createClient).to.throwException();
            });
        });

        describe('#request', function () {
            var fakeServer;

            beforeEach(function () {
                fakeServer = sinon.fakeServer.create();
            });

            afterEach(function () {
                fakeServer.restore();
            });

            it('should complain about missing parameters', function () {
                var client = new Client({appId: 'someId', appSecret: 'someSecret'});

                var clientRequest = function () { return client.request(); };
                expect(clientRequest).to.throwException(/^Missing/);
                clientRequest = function () { return client.request({ url: 'https://api.devmobilerider.com/api/media' }); };
                expect(clientRequest).to.throwException(/^Missing/);
                clientRequest = function () { return client.request({ method: 'GET' }); };
                expect(clientRequest).to.throwException(/^Missing/);
            });

            it('should return a promise', function () {
                var promiseMethods = [
                    'then', 'isPending', 'getStatus', 'success', 'error',
                    'otherwise', 'apply', 'spread', 'ensure', 'nodify',
                    'rethrow', 'rethrow'];

                var client = new Client({
                    appId: 'someId',
                    appSecret: 'someSecret'
                });

                var promise = client.request({
                    url: 'https://api.devmobilerider.com/api/media',
                    method: 'GET',
                });

                for (var i = 0; i < promiseMethods.length; i++) {
                    expect(promise[promiseMethods[i]]).to.be.a('function');
                }
            });

            it('should set the correct headers', function () {
                var promiseMethods = [
                    'then', 'isPending', 'getStatus', 'success', 'error',
                    'otherwise', 'apply', 'spread', 'ensure', 'nodify',
                    'rethrow', 'rethrow'];

                var appId = 'someId', appSecret = 'someSecret';

                var client = new Client({
                    appId: appId,
                    appSecret: appSecret
                });

                var promise = client.request({
                    url: 'https://api.devmobilerider.com/api/media',
                    method: 'GET',
                });

                var xhr = fakeServer.queue[0];
                expect(xhr).to.have.property('requestHeaders');
                var headers = xhr.requestHeaders;
                expect(headers).to.have.property('Authorization', 'Basic ' + btoa(unescape(encodeURIComponent(appId + ':' + appSecret))));
            });

            it('should fail for an invalid domain', function () {
                var fakeServer = sinon.fakeServer.create();

                var client = new Client({
                    appId: 'someId',
                    appSecret: 'someSecret'
                });

                var clientRequest = function () {
                    client.request({
                        url: 'http://some-domain.com',
                        method: 'GET',
                    });
                };
                expect(clientRequest).to.throwException(/^Invalid URL/);

                clientRequest = function () {
                    client.request({
                        url: 'https://api.devmobilerider.com/api/media',
                        method: 'FORCE',
                    });
                };
                expect(clientRequest).to.throwException(/^Invalid method/);
            });

            it('should fail for a JSON response with `success == false`', function (done) {
                fakeServer.respondWith(
                    'GET',
                    'https://api.devmobilerider.com/api/media',
                    [
                        200,
                        'application/json',
                        '{ "success": false }'
                    ]
                );

                var client = new Client({
                    appId: 'someId',
                    appSecret: 'someSecret'
                });

                var promise = client.request({
                    url: 'https://api.devmobilerider.com/api/media',
                    method: 'GET',
                });

                fakeServer.respond();

                promise.then(
                    function () {
                        expect().fail();
                        done();
                    },
                    function (status) {
                        expect(status).to.be('Unsuccessful request (response status empty)');
                        done();
                    }
                );
            });

            it('should fail for a JSON response with `success == false`', function (done) {
                fakeServer.respondWith(
                    'GET',
                    'https://api.devmobilerider.com/api/media',
                    [
                        200,
                        'application/json',
                        '{ "success": false, "status": "Something went wrong!" }'
                    ]
                );

                var client = new Client({
                    appId: 'someId',
                    appSecret: 'someSecret'
                });

                var promise = client.request({
                    url: 'https://api.devmobilerider.com/api/media',
                    method: 'GET',
                });

                fakeServer.respond();

                promise.then(
                    function () {
                        done(new Error('This promise should fail'));
                    },
                    function (status) {
                        expect(status).to.be('Something went wrong!');
                        done();
                    }
                );
            });

            it('should succeed for a JSON response with `success == true`', function (done) {
                fakeServer.respondWith(
                    'GET',
                    'https://api.devmobilerider.com/api/media',
                    [
                        200,
                        'application/json',
                        '{ "success": true }'
                    ]
                );

                var client = new Client({
                    appId: 'someId',
                    appSecret: 'someSecret'
                });

                var promise = client.request({
                    url: 'https://api.devmobilerider.com/api/media',
                    method: 'GET',
                });

                fakeServer.respond();

                promise.then(
                    function (response) {
                        var typeofResponse = typeof response;
                        if (typeofResponse != 'undefined') {
                            done(new Error('Invalid response type: ' + typeofResponse));
                        }
                        done();
                    },
                    function (response) {
                        done(new Error('Failed response'));
                    }
                );
            });

            it('should succeed for a JSON response with `success == true`', function (done) {
                fakeServer.respondWith(
                    'GET',
                    'https://api.devmobilerider.com/api/media',
                    [
                        200,
                        'application/json',
                        '{ "success": true, "object": {} }'
                    ]
                );

                var client = new Client({
                    appId: 'someId',
                    appSecret: 'someSecret'
                });

                var promise = client.request({
                    url: 'https://api.devmobilerider.com/api/media',
                    method: 'GET',
                });

                fakeServer.respond();

                promise.then(
                    function (response) {
                        var typeofResponse = typeof response;
                        if (typeofResponse != 'object') {
                            done(new Error('Invalid response type: ' + typeofResponse));
                        }
                        done();
                    },
                    function (response) {
                        done(new Error('Failed response'));
                    }
                );
            });

            it('should succeed for a JSON response with `success == true`', function (done) {
                fakeServer.respondWith(
                    'GET',
                    'https://api.devmobilerider.com/api/media',
                    [
                        200,
                        'application/json',
                        '{ "success": true, "object": [] }'
                    ]
                );

                var client = new Client({
                    appId: 'someId',
                    appSecret: 'someSecret'
                });

                var promise = client.request({
                    url: 'https://api.devmobilerider.com/api/media',
                    method: 'GET',
                });

                fakeServer.respond();

                promise.then(
                    function (response) {
                        var typeofResponse = typeof response;
                        if (typeofResponse != 'object') {
                            done(new Error('Invalid response type: ' + typeofResponse));
                        }
                        done();
                    },
                    function (response) {
                        done(new Error('Failed response'));
                    }
                );
            });

            it('should fail for a 404 status', function (done) {
                fakeServer.respondWith(
                    'GET',
                    'https://api.devmobilerider.com/api/media',
                    [
                        404,
                        'application/json',
                        '{ "success": false }'
                    ]
                );

                var client = new Client({
                    appId: 'someId',
                    appSecret: 'someSecret'
                });

                var promise = client.request({
                    url: 'https://api.devmobilerider.com/api/media',
                    method: 'GET',
                });

                fakeServer.respond();

                promise.then(
                    function (response) {
                        done(new Error('This promise should fail'));
                    },
                    function (response) {
                        done();
                    }
                );
            });

            it('should fail for a non JSON response', function (done) {
                fakeServer.respondWith(
                    'GET',
                    'https://api.devmobilerider.com/api/media',
                    [
                        200,
                        'application/json',
                        '<!DOCTYPE html> <html> <head> <meta charset="utf-8"> <meta http-equiv="X-UA-Compatible" content="IE=edge"> <title></title> <link rel="stylesheet" href=""> </head> <body> </body> </html>'
                    ]
                );

                var client = new Client({
                    appId: 'someId',
                    appSecret: 'someSecret'
                });

                var promise = client.request({
                    url: 'https://api.devmobilerider.com/api/media',
                    method: 'GET',
                });

                fakeServer.respond();

                promise.then(
                    function (response) {
                        done(new Error('This promise should fail'));
                    },
                    function (response) {
                        done();
                    }
                );
            });
        });
    });
});