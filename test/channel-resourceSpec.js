define(['settings', 'client', 'resource', 'channel-resource'], function (Settings, Client, Resource, ChannelResource) {
    // sinonLog = sinon.log;
    // before(function () { sinon.log = function () { console.warn.apply(console, arguments); }; });
    // after(function () { sinon.log = sinonLog; });

    describe('ChannelResource', function () {
        it('should complain about missing client/appId/appSecret parameters', function () {
            var createChannel = function () { return new ChannelResource(); };
            expect(createChannel).to.throwError( function (e) {
                expect(e.message).to.contain('You must pass a `Client` instance or `appId` and `appSecret`');
            });
            createChannel = function () { return new ChannelResource({ client: 'I tell you I\'m a client!' }); };
            expect(createChannel).to.throwError(function (e) {
                expect(e.message).to.contain('You must pass a valid client instance, got an');
            });
            createChannel = function () { return new ChannelResource({ appId: 'someId' }); };
            expect(createChannel).to.throwError( function (e) {
                expect(e.message).to.contain('You must pass a `Client` instance or `appId` and `appSecret`');
            });
            createChannel = function () { return new ChannelResource({ appSecret: 'someSecret' }); };
            expect(createChannel).to.throwError( function (e) {
                expect(e.message).to.contain('You must pass a `Client` instance or `appId` and `appSecret`');
            });
        });

        it('should be a Resource instance', function () {
            var channel = new ChannelResource({ appId: 'someId', appSecret: 'someSecret' });
            expect(channel).to.be.a(Resource);
            expect(channel).to.be.a(ChannelResource);
        });

        it('should have a valid Client instance', function () {
            var channel = new ChannelResource({ appId: 'someId', appSecret: 'someSecret' });
            expect(channel.client).to.be.a(Client);
        });

        it('should have a valid URL', function () {
            var channel = new ChannelResource({ appId: 'someId', appSecret: 'someSecret' });
            var url = Settings.channelEndpoint;
            expect(channel.getUrl()).to.eql(url);

            if (url[url.length - 1] != '/') {
                url += '/';
            }
            var id = 4;
            url += id;
            expect(channel.getUrl(id)).to.eql(url);
        });

        describe('CRUD tests', function () {
            var fakeServer;

            beforeEach(function () {
                fakeServer = sinon.fakeServer.create();
            });

            afterEach(function () {
                fakeServer.restore();
            });

            it('should retrieve a single object', function (done) {

                fakeServer.respondWith(
                    'GET',
                    'https://api.devmobilerider.com/api/channel/1',
                    [
                        200,
                        'application/json',
                        '{ "success": true, "object": { "id": 1, "name": "My channel\'s title" } }'
                    ]
                );

                var channel = new ChannelResource({ appId: 'someId', appSecret: 'someSecret' });
                channel.get(1).then(
                    function (channelResponse) {
                        expect(channelResponse).to.be.an('object');
                        expect(channelResponse).not.to.be.an(Array);
                        expect(channelResponse).to.have.property('success', true);
                        expect(channelResponse).to.have.property('meta');
                        expect(channelResponse.meta).to.be.an('object');
                        expect(channelResponse).to.have.property('object');
                        expect(channelResponse.object).to.have.property('id', 1);
                        expect(channelResponse.object).to.have.property('name', 'My channel\'s title');
                        done();
                    },
                    function () {
                        var s = [], i;
                        for (i = 0; i < arguments.length; i++) {
                            s.push(arguments[i].toString());
                        }
                        done(new Error(s.join(' ')));
                    }
                );

                fakeServer.respond();
            });

            it('should retrieve several objects', function (done) {

                fakeServer.respondWith(
                    'GET',
                    'https://api.devmobilerider.com/api/channel',
                    [
                        200,
                        'application/json',
                        '{"success": true, "total": 2, "page": 1, "pages": 1, "limit": 20, "objects": [{"id": 1, "name": "My first channel\'s title"}, {"id": 2, "name": "My second channel\'s title"} ] }'
                    ]
                );

                var channel = new ChannelResource({ appId: 'someId', appSecret: 'someSecret' });
                channel.all().then(
                    function (channelResponse) {
                        expect(channelResponse).to.be.an('object');
                        expect(channelResponse).not.to.be.an(Array);
                        expect(channelResponse).to.have.property('success', true);
                        expect(channelResponse).to.have.property('meta');
                        expect(channelResponse.meta).to.be.an('object');
                        expect(channelResponse).to.have.property('objects');
                        expect(channelResponse.objects).to.be.an(Array);
                        expect(channelResponse.objects).to.have.length(2);
                        expect(channelResponse.objects[0]).to.have.property('id', 1);
                        expect(channelResponse.objects[0]).to.have.property('name', 'My first channel\'s title');
                        expect(channelResponse.objects[1]).to.have.property('id', 2);
                        expect(channelResponse.objects[1]).to.have.property('name', 'My second channel\'s title');
                        done();
                    },
                    function () {
                        var s = [], i;
                        for (i = 0; i < arguments.length; i++) {
                            s.push(arguments[i].toString());
                        }
                        done(new Error(s.join(' ')));
                    }
                );

                fakeServer.respond();
            });

            it('should complain about non-numeric IDs', function () {
                var makeBadRequest = function () {
                    var channel = new ChannelResource({ appId: 'someId', appSecret: 'someSecret' });
                    return channel.get('bad id value');
                };
                expect(makeBadRequest).to.throwError(function (e) {
                    expect(e.message).to.contain('Identifier "bad id value" is not a numeric value');
                });
            });

            it('should fail the promise for non-existing objects', function (done) {
                var channel = new ChannelResource({ appId: 'someId', appSecret: 'someSecret' });
                channel.get(10101010101).then(
                    function () {
                        done(new Error('The promise succeeded; It should have failed because this object doesn\'t exist'));
                    },
                    function () {
                        done();
                    }
                );
                fakeServer.respond();
            });

            it('should create a single object', function (done) {

                fakeServer.respondWith(
                    'POST',
                    'https://api.devmobilerider.com/api/channel',
                    [
                        200,
                        'application/json',
                        '{"success": true, "object": {"id": 1, "name": "My channel\'s title"}}'
                    ]
                );

                var objectToCreate = { name: 'My first channels title'};

                var channel = new ChannelResource({ appId: 'someId', appSecret: 'someSecret' });
                channel.create(objectToCreate).then(
                    function (channelResponse) {
                        expect(channelResponse).to.be.an('object');
                        expect(channelResponse).not.to.be.an(Array);
                        expect(channelResponse).to.have.property('success', true);
                        expect(channelResponse).to.have.property('meta');
                        expect(channelResponse.meta).to.be.an('object');
                        expect(channelResponse).to.have.property('objects');
                        expect(channelResponse.objects).to.be.an('Array');
                        expect(channelResponse.objects).to.have.length(1);
                        expect(channelResponse.objects[0]).to.have.property('id', 1);
                        expect(channelResponse.objects[0]).to.have.property('name', 'My channel\'s title');
                        done();
                    },
                    function () {
                        var s = [], i;
                        for (i = 0; i < arguments.length; i++) {
                            s.push(arguments[i].toString());
                        }
                        done(new Error(s.join(' ')));
                    }
                );

                fakeServer.respond();
            });

            it('should create several objects', function (done) {

                fakeServer.respondWith(
                    'POST',
                    'https://api.devmobilerider.com/api/channel',
                    [
                        200,
                        'application/json',
                        '{"success": true, "objects": [{"id": 1, "name": "My first channel\'s title"}, {"id": 2, "name": "My second channel\'s title"}]}'
                    ]
                );

                var objectsToCreate = [
                    {name: 'My first channels title'},
                    {name: 'My second channels title'}
                ];

                var channel = new ChannelResource({ appId: 'someId', appSecret: 'someSecret' });
                channel.create(objectsToCreate).then(
                    function (channelsResponse) {
                        expect(channelsResponse).to.be.an('object');
                        expect(channelsResponse).not.to.be.an(Array);
                        expect(channelsResponse).to.have.property('success', true);
                        expect(channelsResponse).to.have.property('meta');
                        expect(channelsResponse.meta).to.be.an('object');
                        expect(channelsResponse).to.have.property('objects');
                        var channelsArray = channelsResponse.objects;
                        expect(channelsArray).to.be.an(Array);
                        expect(channelsArray).to.have.length(2);
                        expect(channelsArray[0]).to.have.property('id', 1);
                        expect(channelsArray[0]).to.have.property('name', 'My first channel\'s title');
                        expect(channelsArray[1]).to.have.property('id', 2);
                        expect(channelsArray[1]).to.have.property('name', 'My second channel\'s title');
                        done();
                    },
                    function () {
                        var s = [], i;
                        for (i = 0; i < arguments.length; i++) {
                            s.push(arguments[i].toString());
                        }
                        done(new Error(s.join(' ')));
                    }
                );

                fakeServer.respond();
            });

            it('should save a single object', function (done) {

                fakeServer.respondWith(
                    'PUT',
                    'https://api.devmobilerider.com/api/channel/1',
                    [
                        200,
                        'application/json',
                        '{"success": true, "object": {"id": 1, "name": "My channel\'s title"}}'
                    ]
                );

                var objectToSave = { id: 1, name: 'My first channels title'};

                var channel = new ChannelResource({ appId: 'someId', appSecret: 'someSecret' });
                channel.save(objectToSave).then(
                    function (channelResponse) {
                        expect(channelResponse).to.be.an('object');
                        expect(channelResponse).not.to.be.an(Array);
                        expect(channelResponse).to.have.property('success', true);
                        expect(channelResponse).to.have.property('meta');
                        expect(channelResponse.meta).to.be.an('object');
                        done();
                    },
                    function () {
                        var s = [], i;
                        for (i = 0; i < arguments.length; i++) {
                            s.push(arguments[i].toString());
                        }
                        done(new Error(s.join(' ')));
                    }
                );

                fakeServer.respond();
            });

            it('should save several objects', function (done) {

                fakeServer.respondWith(
                    'PUT',
                    'https://api.devmobilerider.com/api/channel',
                    [
                        200,
                        'application/json',
                        '{"success": true, "objects": [{"id": 1, "name": "My first channel\'s title"}, {"id": 2, "name": "My second channel\'s title"}]}'
                    ]
                );

                var objectsToSave = [
                    { id: 1, name: 'My first channels title'},
                    { id: 2, name: 'My second channels title'}
                ];

                var channel = new ChannelResource({ appId: 'someId', appSecret: 'someSecret' });
                channel.save(objectsToSave).then(
                    function (channelsResponse) {
                        expect(channelsResponse).to.be.an('object');
                        expect(channelsResponse).not.to.be.an(Array);
                        expect(channelsResponse).to.have.property('success', true);
                        expect(channelsResponse).to.have.property('meta');
                        expect(channelsResponse.meta).to.be.an('object');
                        done();
                    },
                    function () {
                        var s = [], i;
                        for (i = 0; i < arguments.length; i++) {
                            s.push(arguments[i].toString());
                        }
                        done(new Error(s.join(' ')));
                    }
                );

                fakeServer.respond();
            });

            it('should delete a single object', function (done) {

                fakeServer.respondWith(
                    'DELETE',
                    'https://api.devmobilerider.com/api/channel/1',
                    [
                        200,
                        'application/json',
                        '{"success": true }'
                    ]
                );

                var channel = new ChannelResource({ appId: 'someId', appSecret: 'someSecret' });
                channel.delete(1).then(
                    function (response) {
                        expect(response).to.be.an('object');
                        expect(response).not.to.be.an(Array);
                        expect(response).to.have.property('success', true);
                        expect(response).to.have.property('meta');
                        expect(response.meta).to.be.an('object');
                        done();
                    },
                    function () {
                        var s = [], i;
                        for (i = 0; i < arguments.length; i++) {
                            s.push(arguments[i].toString());
                        }
                        done(new Error(s.join(' ')));
                    }
                );

                fakeServer.respond();
            });
        });
    });

});