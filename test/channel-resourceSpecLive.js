// By default these tests are not executed, uncomment the line referring to this
// file in `Gruntfile.js` to activate this test suite

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
        var url = channel.getUrl();

        if (url[url.length - 1] != '/') {
            url += '/';
        }
        var id = 4;
        url += id;
        expect(channel.getUrl(id)).to.eql(url);
    });

    describe('CRUD tests', function () {
        var idsToDelete = [];

        it('should retrieve a single object', function (done) {

            var channel = new ChannelResource({ appId: '7af9ca9a0eba0662d5a494a36c0af12a', appSecret: 'f4b6833ac8ce175bd4f5e9a81214a5c20f3aef7680ba64720e514d94102abe39' });
            channel.get(4846).then(
                function (channelResponse) {
                    expect(channelResponse).to.be.an('object');
                    expect(channelResponse).not.to.be.an(Array);
                    expect(channelResponse).to.have.property('success', true);
                    expect(channelResponse).to.have.property('meta');
                    expect(channelResponse.meta).to.be.an('object');
                    expect(channelResponse).to.have.property('object');
                    expect(channelResponse.object).to.have.property('id', 4846);
                    expect(channelResponse.object).to.have.property('name', 'Test 9/10');
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
        });

        it('should retrieve several objects', function (done) {

            var channel = new ChannelResource({ appId: '7af9ca9a0eba0662d5a494a36c0af12a', appSecret: 'f4b6833ac8ce175bd4f5e9a81214a5c20f3aef7680ba64720e514d94102abe39' });
            channel.all().then(
                function (channelResponse) {
                    expect(channelResponse).to.be.an('object');
                    expect(channelResponse).not.to.be.an(Array);
                    expect(channelResponse).to.have.property('success', true);
                    expect(channelResponse).to.have.property('meta');
                    expect(channelResponse.meta).to.be.an('object');
                    expect(channelResponse).to.have.property('objects');
                    expect(channelResponse.objects).to.be.an(Array);
                    expect(channelResponse.objects).to.have.length(7);

                    for (var i = 0; i < channelResponse.objects.length; i++) {
                        expect(channelResponse.objects[i]).to.be.an('object');
                        expect(channelResponse.objects[i]).to.have.property('id');
                        expect(channelResponse.objects[i]).to.have.property('name');
                    }
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
        });

        it('should complain about non-numeric IDs', function () {
            var makeBadRequest = function () {
                var channel = new ChannelResource({ appId: '7af9ca9a0eba0662d5a494a36c0af12a', appSecret: 'f4b6833ac8ce175bd4f5e9a81214a5c20f3aef7680ba64720e514d94102abe39' });
                return channel.get('bad id value');
            };
            expect(makeBadRequest).to.throwError(function (e) {
                expect(e.message).to.contain('Identifier "bad id value" is not a numeric value');
            });
        });

        it('should fail the promise for non-existing objects', function (done) {
            var channel = new ChannelResource({ appId: '7af9ca9a0eba0662d5a494a36c0af12a', appSecret: 'f4b6833ac8ce175bd4f5e9a81214a5c20f3aef7680ba64720e514d94102abe39' });
            channel.get(10101010101).then(
                function () {
                    done(new Error('The promise succeeded; It should have failed because this object doesn\'t exist'));
                },
                function () {
                    done();
                }
            );
        });

        it('should create a single object, and retrieve it afterwards', function (done) {
            var objectToCreate = { name: 'My first channel\'s title'};

            var channel = new ChannelResource({ appId: '7af9ca9a0eba0662d5a494a36c0af12a', appSecret: 'f4b6833ac8ce175bd4f5e9a81214a5c20f3aef7680ba64720e514d94102abe39' });
            channel.create(objectToCreate).then(
                function (channelResponse) {
                    expect(channelResponse).to.be.an('object');
                    expect(channelResponse).not.to.be.an(Array);
                    expect(channelResponse).to.have.property('success', true);
                    expect(channelResponse).to.have.property('meta');
                    expect(channelResponse.meta).to.be.an('object');
                    expect(channelResponse).to.have.property('objects');
                    expect(channelResponse.objects).to.be.an(Array);
                    expect(channelResponse.objects).to.have.length(1);
                    expect(channelResponse.objects[0]).to.have.property('id');
                    expect(channelResponse.objects[0]).to.have.property('name', objectToCreate.name);
                    var returnedId = channelResponse.objects[0].id;

                    channel.get(returnedId).then(
                        function (channelResponse) {
                            expect(channelResponse).to.be.an('object');
                            expect(channelResponse).not.to.be.an(Array);
                            expect(channelResponse).to.have.property('success', true);
                            expect(channelResponse).to.have.property('meta');
                            expect(channelResponse.meta).to.be.an('object');
                            expect(channelResponse).to.have.property('object');
                            expect(channelResponse.object).to.have.property('id', returnedId);
                            expect(channelResponse.object).to.have.property('name', objectToCreate.name);
                            idsToDelete.push(returnedId);
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
                },
                function () {
                    var s = [], i;
                    for (i = 0; i < arguments.length; i++) {
                        s.push(arguments[i].toString());
                    }
                    done(new Error(s.join(' ')));
                }
            );
        });

        it('should create several objects', function (done) {
            var objectsToCreate = [
                {name: 'My first channel\'s title'},
                {name: 'My second channel\'s title'}
            ];

            var channel = new ChannelResource({ appId: '7af9ca9a0eba0662d5a494a36c0af12a', appSecret: 'f4b6833ac8ce175bd4f5e9a81214a5c20f3aef7680ba64720e514d94102abe39' });
            channel.create(objectsToCreate).then(
                function (channelsResponse) {
                    expect(channelsResponse).to.be.an('object');
                    expect(channelsResponse).not.to.be.an(Array);
                    expect(channelsResponse).to.have.property('success', true);
                    expect(channelsResponse).to.have.property('meta');
                    expect(channelsResponse.meta).to.be.an('object');
                    expect(channelsResponse).to.have.property('objects');
                    expect(channelsResponse.objects).to.be.an(Array);
                    var channelsArray = channelsResponse.objects;
                    expect(channelsArray).to.have.length(2);

                    expect(channelsArray[0]).to.have.property('id');
                    expect(channelsArray[0]).to.have.property('name');
                    expect(channelsArray[1]).to.have.property('id');
                    expect(channelsArray[1]).to.have.property('name');

                    var i,
                        found = false,
                        objectName = objectsToCreate[0].name;

                    for (i = 0; i < channelsArray.length; i++) {
                        if (channelsArray[i].name == objectName) {
                            found = true;
                            break;
                        }
                    }
                    expect(found).to.be.ok;

                    found = false;
                    objectName = objectsToCreate[1].name;

                    for (i = 0; i < channelsArray.length; i++) {
                        if (channelsArray[i].name == objectName) {
                            found = true;
                            break;
                        }
                    }
                    expect(found).to.be.ok;

                    for (i = 0; i < channelsArray.length; i++) {
                        idsToDelete.push(channelsArray[i].id);
                    }

                    done();
                },
                function () {
                    console.log(arguments);
                    var s = [], i;
                    for (i = 0; i < arguments.length; i++) {
                        s.push(arguments[i].toString());
                    }
                    done(new Error(s.join(' ')));
                }
            );
        });

        it('should save a single object', function (done) {
            var objectToSave = { id: 4846, name: 'My new channel title'};

            var channel = new ChannelResource({ appId: '7af9ca9a0eba0662d5a494a36c0af12a', appSecret: 'f4b6833ac8ce175bd4f5e9a81214a5c20f3aef7680ba64720e514d94102abe39' });
            channel.save(objectToSave).then(
                function (channelResponse) {
                    expect(channelResponse).to.be.an('object');
                    expect(channelResponse).not.to.be.an(Array);
                    expect(channelResponse).to.have.property('success', true);
                    expect(channelResponse).to.have.property('meta');
                    expect(channelResponse.meta).to.be.an('object');

                    channel.get(objectToSave.id).then(
                        function (channelResponse) {
                            expect(channelResponse).to.be.an('object');
                            expect(channelResponse).not.to.be.an(Array);
                            expect(channelResponse).to.have.property('success', true);
                            expect(channelResponse).to.have.property('meta');
                            expect(channelResponse.meta).to.be.an('object');
                            expect(channelResponse).to.have.property('object');
                            expect(channelResponse.object).to.have.property('id', objectToSave.id);
                            expect(channelResponse.object).to.have.property('name', objectToSave.name);

                            objectToSave.name = 'Test 9/10';
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
                        },
                        function () {
                            var s = [], i;
                            for (i = 0; i < arguments.length; i++) {
                                s.push(arguments[i].toString());
                            }
                            done(new Error(s.join(' ')));
                        }
                    );

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
        });

        it('should save several objects', function (done) {
            var objectsToSave = [
                { id: 3471, name: 'SDK Channel 1 (updated)'},
                { id: 3472, name: 'SDK Channel 2 (updated)'}
            ];
            var objectsToSaveOriginal = [
                { id: 3471, name: 'SDK Channel 1'},
                { id: 3472, name: 'SDK Channel 2'}
            ];

            var channel = new ChannelResource({ appId: '7af9ca9a0eba0662d5a494a36c0af12a', appSecret: 'f4b6833ac8ce175bd4f5e9a81214a5c20f3aef7680ba64720e514d94102abe39' });
            channel.save(objectsToSave).then(
                function (channelsResponse) {
                    expect(channelsResponse).to.be.an('object');
                    expect(channelsResponse).not.to.be.an(Array);
                    expect(channelsResponse).to.have.property('success', true);
                    expect(channelsResponse).to.have.property('meta');
                    expect(channelsResponse.meta).to.be.an('object');

                    channel.all().then(
                        function (channelsResponse) {
                            var found = {
                                3471: { found: false, name: 'SDK Channel 1 (updated)' },
                                3472: { found: false, name: 'SDK Channel 2 (updated)' }
                            };

                            Utils.each(channelsResponse.objects, function (obj) {
                                if (found.hasOwnProperty(obj.id)) {
                                    expect(obj).to.have.property('name', found[obj.id].name);
                                    found[obj.id].found = true;
                                }
                            });

                            Utils.each(found, function (obj) {
                                expect(obj.found).to.be.ok;
                            });

                            channel.save(objectsToSaveOriginal).then(
                                function (response) {
                                    expect(channelsResponse).to.be.an('object');
                                    expect(channelsResponse).not.to.be.an(Array);
                                    expect(channelsResponse).to.have.property('success', true);
                                    expect(channelsResponse).to.have.property('meta');
                                    expect(channelsResponse.meta).to.be.an('object');

                                    channel.all().then(
                                        function (channelsResponse) {
                                            var found = {
                                                3471: { found: false, name: 'SDK Channel 1' },
                                                3472: { found: false, name: 'SDK Channel 2' }
                                            };

                                            Utils.each(channelsResponse.objects, function (obj) {
                                                if (found.hasOwnProperty(obj.id)) {
                                                    expect(obj).to.have.property('name', found[obj.id].name);
                                                    found[obj.id].found = true;
                                                }
                                            });

                                            Utils.each(found, function (obj) {
                                                expect(obj.found).to.be.ok;
                                            });
                                        },
                                        function () {
                                            var s = [], i;
                                            for (i = 0; i < arguments.length; i++) {
                                                s.push(arguments[i].toString());
                                            }
                                            done(new Error(s.join(' ')));
                                        }
                                    );
                                },
                                function () {
                                    var s = [], i;
                                    for (i = 0; i < arguments.length; i++) {
                                        s.push(arguments[i].toString());
                                    }
                                    done(new Error(s.join(' ')));
                                }
                            );
                        },
                        function () {
                            var s = [], i;
                            for (i = 0; i < arguments.length; i++) {
                                s.push(arguments[i].toString());
                            }
                            done(new Error(s.join(' ')));
                        }
                    );

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
        });

        it('should delete the objects created in previous tests', function (done) {
            var channel = new ChannelResource({ appId: '7af9ca9a0eba0662d5a494a36c0af12a', appSecret: 'f4b6833ac8ce175bd4f5e9a81214a5c20f3aef7680ba64720e514d94102abe39' });
            var deleted = {};

            var checkIfDone = function () {
                if (Utils.keys(deleted).length == idsToDelete.length) {
                    var errors = [];
                    Utils.each(deleted, function (result) {
                        if (result !== true) {
                            errors.push(result);
                        }
                    });
                    if (errors.length) {
                        done(new Error(errors.join(' ')));
                    } else {
                        done();
                    }
                }
            };

            for (var i = 0; i < idsToDelete.length; i++) {
                (function () {
                    var objectId = idsToDelete[i];
                    channel.delete(objectId).then(
                        function (response) {
                            expect(response).to.be.an('object');
                            expect(response).not.to.be.an(Array);
                            expect(response).to.have.property('success', true);
                            expect(response).to.have.property('meta');

                            deleted[objectId] = true;

                            checkIfDone();
                        },
                        function () {
                            var s = [], i;
                            for (i = 0; i < arguments.length; i++) {
                                s.push(arguments[i].toString());
                            }
                            deleted[objectId] = s.join(' ');
                            checkIfDone();
                        }
                    );
                })();
            }
        });
    });
});
