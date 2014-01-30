describe('ChannelResource#filter', function () {

    it('should return a Query object', function () {
        var channel = new ChannelResource({ appId: 'someId', appSecret: 'someSecret' });
        var query = channel.filter();
        expect(query).to.be.an('object');
        expect(query).to.have.property('resource');
        expect(query).to.have.property('operator');
        expect(query.operator).to.have.property('name', 'AND');
        expect(query.operator).to.have.property('filters');
        expect(query.operator.filters).to.be.an.instanceof(Array);
        expect(query.operator.filters).to.have.length(0);
    });

    it('should return a Query object with a properly initialized operator', function () {
        var channel = new ChannelResource({ appId: 'someId', appSecret: 'someSecret' });
        var query = channel.filter(['name', 'John'], ['age', 49]);
        expect(query).to.be.an('object');
        expect(query).to.have.property('resource');
        expect(query).to.have.property('operator');
        expect(query.operator).to.have.property('name', 'AND');
        expect(query.operator).to.have.property('filters');
        expect(query.operator.filters).to.be.an.instanceof(Array);
        expect(query.operator.filters).to.have.length(2);
        expect(query.operator.filters[0]).to.be.an('object');
        expect(query.operator.filters[0]).to.have.property('name', 'John');
        expect(query.operator.filters[1]).to.be.an('object');
        expect(query.operator.filters[1]).to.have.property('age', 49);

        var flattened = query.operator.flatten();
        expect(flattened).to.be.an.instanceof(Array);
        expect(flattened).to.have.length(3);
        expect(flattened[1]).to.eql('AND');

        expect(Utils.any(flattened, function (elem) {
            return elem.name == 'John';
        })).to.be.ok;

        expect(Utils.any(flattened, function (elem) {
            return elem.age == 49;
        })).to.be.ok;
    });

    it('should construct the proper JSON for the requested query', function () {
        var channel = new ChannelResource({ appId: 'someId', appSecret: 'someSecret' });
        var query = channel.filter(['title__contains', 'test']);
        query = query.or({title__contains: 123}).or({title: 'something?'}).and({age: 19});
        expect(query.operator).to.be.an('object');
        var flattened = query.operator.flatten();
        expect(flattened).to.be.an.instanceof(Array);
        expect(flattened).to.have.length(3);
        expect(flattened[1]).to.eql('AND');
        expect(flattened[0]).to.be.an.instanceof(Array);
        expect(flattened[0]).to.have.length(5);
        expect(flattened[0][1]).to.eql('OR');
        expect(flattened[0][3]).to.eql('OR');

        expect(Utils.any(flattened[0], function (operator) {
            return (operator.title__contains == 'test');
        })).to.be.ok;
        expect(Utils.any(flattened[0], function (operator) {
            return (operator.title__contains == 123);
        })).to.be.ok;
        expect(Utils.any(flattened[0], function (operator) {
            return (operator.title == 'something?');
        })).to.be.ok;

        expect(flattened[2]).to.be.an('object');
        expect(flattened[2]).to.have.property('age', 19);
    });

    it('should construct the proper JSON for the requested query: Using NOT', function () {
        var channel = new ChannelResource({ appId: 'someId', appSecret: 'someSecret' });
        var query = channel.filter(['title__contains', 'test']).or({title__contains: 'something'}).not({age: 19});
        expect(query.operator).to.be.an('object');
        var flattened = query.operator.flatten();
        expect(flattened).to.be.an.instanceof(Array);
        expect(flattened).to.have.length(3);
        expect(flattened[1]).to.eql('AND');
        expect(flattened[0]).to.be.an.instanceof(Array);
        expect(flattened[0][1]).to.eql('OR');

        expect(Utils.any(flattened[0], function (operator) {
            return (operator.title__contains == 'test');
        })).to.be.ok;
        expect(Utils.any(flattened[0], function (operator) {
            return (operator.title__contains == 'something');
        })).to.be.ok;

        expect(flattened[2]).to.be.an('object');
        expect(flattened[2]).to.have.property('NOT');
        expect(flattened[2].NOT).to.be.an('object');
        expect(flattened[2].NOT).to.have.property('age', 19);

        query = query.not({age: 40});
        expect(query.operator).to.be.an('object');
        flattened = query.operator.flatten();
        expect(flattened).to.be.an.instanceof(Array);
        expect(flattened).to.have.length(5);
        expect(flattened[1]).to.eql('AND');
        expect(flattened[0]).to.be.an.instanceof(Array);
        expect(flattened[0][1]).to.eql('OR');

        expect(Utils.any(flattened[0], function (operator) {
            return (operator.title__contains == 'test');
        })).to.be.ok;
        expect(Utils.any(flattened[0], function (operator) {
            return (operator.title__contains == 'something');
        })).to.be.ok;

        expect(flattened[2]).to.be.an('object');
        expect(flattened[2]).to.have.property('NOT');
        expect(flattened[2].NOT).to.be.an('object');
        expect(flattened[2].NOT).to.have.property('age', 19);
    });

    var returnFakePromise = function () {
        return { then: function (onSuccess) { setTimeout(onSuccess, 1); } };
    };

    it('should not use the JSON __queryset__ parameter for single-level `AND` queries', function (done) {
        var channel = new ChannelResource({ appId: 'someId', appSecret: 'someSecret' });
        var channelAllStub = sinon.stub(channel, 'all', returnFakePromise);

        channel.filter({ name__contains: 'test', description__contains: 'test' }).fetch().then(
            function () {
                done();
            }
        );

        expect(channelAllStub.calledOnce).to.be.ok;
        var channelAllStubCallArgs = channelAllStub.getCall(0).args;
        expect(channelAllStubCallArgs[0]).to.be.an.instanceof(Array);
        Utils.each(channelAllStubCallArgs[0], function (param) {
            expect(param).to.be.an('object');
            expect(param).not.to.be.an.instanceof(Array);
        });
        expect(Utils.any(channelAllStubCallArgs[0], function (param) {

            return param.name == 'name__contains' && param.value == 'test';
        })).to.be.ok;
        expect(Utils.any(channelAllStubCallArgs[0], function (param) {
            return param.name = 'description__contains' && param.value == 'test';
        })).to.be.ok;
        channelAllStub.restore();
    });

    it('should construct the proper JSON for the requested query: Using only a subset of fields', function () {
        var channel = new ChannelResource({ appId: 'someId', appSecret: 'someSecret' });
        var channelAllStub = sinon.stub(channel, 'all', returnFakePromise);

        var query = channel.filter(['title__contains', 'test']).or({title__contains: 'something'}).not({age: 19}).only('id', 'name');
        expect(query.operator).to.be.an('object');
        var flattened = query.operator.flatten();
        expect(flattened).to.be.an.instanceof(Array);
        expect(flattened).to.have.length(3);
        expect(flattened[1]).to.eql('AND');
        expect(flattened[0]).to.be.an.instanceof(Array);
        expect(flattened[0][1]).to.eql('OR');

        expect(Utils.any(flattened[0], function (operator) {
            return (operator.title__contains == 'test');
        })).to.be.ok;
        expect(Utils.any(flattened[0], function (operator) {
            return (operator.title__contains == 'something');
        })).to.be.ok;

        expect(flattened[2]).to.be.an('object');
        expect(flattened[2]).to.have.property('NOT');
        expect(flattened[2].NOT).to.be.an('object');
        expect(flattened[2].NOT).to.have.property('age', 19);

        var promise = query.fetch();
        expect(promise.then).to.be.a('function');
        expect(channelAllStub.calledOnce).to.be.ok;
        var channelAllStubCallArgs = channelAllStub.getCall(0).args;
        expect(channelAllStubCallArgs[0]).to.be.an('object');
        expect(channelAllStubCallArgs[0]).to.have.property('__queryset__');

        var jsonQuery = Utils.JSON.parse(channelAllStubCallArgs[0].__queryset__);
        expect(jsonQuery).to.have.property('fields');
        expect(jsonQuery.fields).to.be.an.instanceof(Array);
        expect(jsonQuery.fields).to.eql(['id', 'name']);

        channelAllStub.restore();
    });
});
