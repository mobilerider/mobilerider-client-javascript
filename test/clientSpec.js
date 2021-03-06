describe('Client class', function () {

    describe('#constructor', function () {

        it('should complain about missing parameters', function () {
            var createClient = function () { return new Client(); };
            expect(createClient).to.throw();
            createClient = function () { return new Client({ appId: 'someId' }); };
            expect(createClient).to.throw();
            createClient = function () { return new Client({ appSecret: 'someSecret' }); };
            expect(createClient).to.throw();
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
            expect(clientRequest).to.throw(/^Missing/);
            clientRequest = function () { return client.request({ url: 'media' }); };
            expect(clientRequest).to.throw(/^Missing/);
            clientRequest = function () { return client.request({ method: 'GET' }); };
            expect(clientRequest).to.throw(/^Missing/);
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
                url: 'media',
                method: 'GET',
            });

            for (var i = 0; i < promiseMethods.length; i++) {
                expect(promise[promiseMethods[i]]).to.be.a('function');
            }
        });

        it('should set the correct headers', function () {
            var appId = 'someId', appSecret = 'someSecret';

            var client = new Client({
                appId: appId,
                appSecret: appSecret
            });

            var promise = client.request({
                url: 'media',
                method: 'GET',
            });

            var xhr = fakeServer.queue[0];
            expect(xhr).to.have.property('requestHeaders');
            var headers = xhr.requestHeaders;
            expect(headers).to.have.property('Authorization', 'Basic ' + btoa(unescape(encodeURIComponent(appId + ':' + appSecret))));
            expect(headers).to.not.have.property('X-Vendor-App-Id');
        });

        it('should set the correct headers - no `X-Vendor-App-Id` header if passed an empty string', function () {
            var appId = 'someId', appSecret = 'someSecret';

            var client = new Client({
                appId: appId,
                appSecret: appSecret,
                subVendorAppId: ''
            });

            var promise = client.request({
                url: 'media',
                method: 'GET',
            });

            var xhr = fakeServer.queue[0];
            expect(xhr).to.have.property('requestHeaders');
            var headers = xhr.requestHeaders;
            expect(headers).to.have.property('Authorization', 'Basic ' + btoa(unescape(encodeURIComponent(appId + ':' + appSecret))));
            expect(headers).to.not.have.property('X-Vendor-App-Id');
        });

        it('should set the correct headers - has `X-Vendor-App-Id` header', function () {
            var appId = 'someId', appSecret = 'someSecret', vendorAppId = 'someOtherVendorId';

            var client = new Client({
                appId: appId,
                appSecret: appSecret,
                subVendorAppId: vendorAppId
            });

            var promise = client.request({
                url: 'media',
                method: 'GET',
            });

            var xhr = fakeServer.queue[0];
            expect(xhr).to.have.property('requestHeaders');
            var headers = xhr.requestHeaders;
            expect(headers).to.have.property('Authorization', 'Basic ' + btoa(unescape(encodeURIComponent(appId + ':' + appSecret))));
            expect(headers).to.have.property('X-Vendor-App-Id', vendorAppId);
        });

        it('should fail for when the URL is empty or the method is invalid', function () {
            var client = new Client({
                appId: 'someId',
                appSecret: 'someSecret'
            });

            var clientRequest = function () {
                client.request({
                    method: 'GET',
                    url: '',
                });
            };

            expect(clientRequest).to.throw(/^Empty URL/);

            clientRequest = function () {
                client.request({
                    method: 'FORCE',
                    url: 'media',
                });
            };
            expect(clientRequest).to.throw(/^Invalid method/);
        });

        it('should fail for a JSON response with `success == false` and empty status', function (done) {
            fakeServer.respondWith(
                'GET',
                'https://api.mobilerider.com/api/media',
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
                url: 'media',
                method: 'GET',
            });

            fakeServer.respond();

            promise.then(
                function () {
                    done(new Error('This promise should fail'));
                },
                function (response) {
                    expect(response).to.be.an('object');
                    expect(response).to.have.property('success', false);
                    expect(response).to.not.have.property('status');
                    expect(response).to.have.property('meta');
                    expect(response.meta).to.be.an('object');
                    expect(response.meta).to.be.empty;
                    done();
                }
            );
        });

        it('should fail for a JSON response with `success == false` and a status message', function (done) {
            fakeServer.respondWith(
                'GET',
                'https://api.mobilerider.com/api/media',
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
                url: 'media',
                method: 'GET',
            });

            fakeServer.respond();

            promise.then(
                function () {
                    done(new Error('This promise should fail'));
                },
                function (response) {
                    expect(response).to.be.an('object');
                    expect(response).to.have.property('success', false);
                    expect(response).to.have.property('meta');
                    expect(response.meta).to.be.an('object');
                    expect(response.meta).to.have.property('status', 'Something went wrong!');
                    done();
                }
            );
        });

        it('should succeed for a JSON response with `success == true`', function (done) {
            fakeServer.respondWith(
                'GET',
                'https://api.mobilerider.com/api/media',
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
                url: 'media',
                method: 'GET',
            });

            fakeServer.respond();

            promise.then(
                function (response) {
                    var typeofResponse = typeof response;
                    if (typeofResponse != 'object') {
                        done(new Error('Invalid response type: ' + typeofResponse));
                    } else {
                        expect(response).to.have.property('success', true);
                        expect(response.meta).to.be.an('object');
                        done();
                    }
                },
                function (response) {
                    done(new Error('Failed response'));
                }
            );
        });

        it('should succeed for a JSON response with `success == true`', function (done) {
            fakeServer.respondWith(
                'GET',
                'https://api.mobilerider.com/api/media',
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
                url: 'media',
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
                'https://api.mobilerider.com/api/media',
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
                url: 'media',
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
                'https://api.mobilerider.com/api/media',
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
                url: 'media',
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
                'https://api.mobilerider.com/api/media',
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
                url: 'media',
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

        it('should fail for an invalid request method', function () {
            fakeServer.respondWith(
                'GET',
                'https://api.mobilerider.com/api/media',
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

            expect(function() {
                var promise = client.request({
                    url: 'media',
                    method: 'INVALID METHOD',
                });
            }).to.throw('Invalid method: INVALID METHOD');

            fakeServer.respond();
        });

        it('should strip the leading slash from the url', function (done) {
            fakeServer.respondWith(
                'GET',
                'https://api.mobilerider.com/api/media',
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
                url: '/media',
                method: 'GET',
            });

            fakeServer.respond();

            promise.then(
                function (response) {
                    done();
                },
                function (response) {
                    done(new Error('Failed response'));
                }
            );
        });

        it('should a different endpoint if set in the constructor options', function (done) {
            fakeServer.respondWith(
                'GET',
                'https://lol.mobilerider.com/api/media',
                [
                    200,
                    'application/json',
                    '{ "success": true, "object": [] }'
                ]
            );

            var client = new Client({
                appId: 'someId',
                appSecret: 'someSecret',
                endpointPrefix: 'https://lol.mobilerider.com/api/'
            });

            var promise = client.request({
                url: '/media',
                method: 'GET',
            });

            fakeServer.respond();

            promise.then(
                function (response) {
                    done();
                },
                function (response) {
                    done(new Error('Failed response'+response));
                }
            );

        });

        // appendTrailingSlash
        // stripTrailingSlash

        it('should append the trailing slash if the option is `true`', function (done) {
            fakeServer.respondWith(
                'GET',
                'https://lol.mobilerider.com/api/media/',
                [
                    200,
                    'application/json',
                    '{ "success": true, "object": [] }'
                ]
            );

            var client = new Client({
                appId: 'someId',
                appSecret: 'someSecret',
                endpointPrefix: 'https://lol.mobilerider.com/api/',
                trailingSlash: true,
            });

            var promise = client.request({
                url: 'media',
                method: 'GET',
            });

            fakeServer.respond();

            promise.then(
                function (response) {
                    done();
                },
                function (response) {
                    done(new Error('Failed response'+response));
                }
            );
        });

        it('should strip the trailing slash if the option is `false`', function (done) {
            fakeServer.respondWith(
                'GET',
                'https://lol.mobilerider.com/api/media',
                [
                    200,
                    'application/json',
                    '{ "success": true, "object": [] }'
                ]
            );

            var client = new Client({
                appId: 'someId',
                appSecret: 'someSecret',
                endpointPrefix: 'https://lol.mobilerider.com/api/',
                trailingSlash: false,
            });

            var promise = client.request({
                url: 'media/',
                method: 'GET',
            });

            fakeServer.respond();

            promise.then(
                function (response) {
                    done();
                },
                function (response) {
                    done(new Error('Failed response'+response));
                }
            );
        });

        it('should not add trailing slash if the option is not `true`', function (done) {
            fakeServer.respondWith(
                'GET',
                'https://lol.mobilerider.com/api/media',
                [
                    200,
                    'application/json',
                    '{ "success": true, "object": [] }'
                ]
            );

            var client = new Client({
                appId: 'someId',
                appSecret: 'someSecret',
                endpointPrefix: 'https://lol.mobilerider.com/api/',
                trailingSlash: 1,
            });

            var promise = client.request({
                url: 'media',
                method: 'GET',
            });

            fakeServer.respond();

            promise.then(
                function (response) {
                    done();
                },
                function (response) {
                    done(new Error('Failed response'+response));
                }
            );
        });
    });
});
