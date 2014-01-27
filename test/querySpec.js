define(['utils', 'channel-resource'], function (Utils, ChannelResource) {

    describe('Resource#filter', function () {

        it('should return a Query object', function () {
            var channel = new ChannelResource({ appId: 'someId', appSecret: 'someSecret' });
            var query = channel.filter([]);
            expect(query).to.be.an('object');
            expect(query).to.have.property('resource');
            expect(query.resource).to.be.an(ChannelResource);
            expect(query).to.have.property('operator');
            expect(query.operator).to.have.property('name', 'AND');
            expect(query.operator).to.have.property('filters');
            expect(query.operator.filters).to.be.an(Array);
            expect(query.operator.filters).to.have.length(0);
        });

        it('should return a Query object with a properly initialized operator', function () {
            var channel = new ChannelResource({ appId: 'someId', appSecret: 'someSecret' });
            var query = channel.filter([['name', 'John'], ['age', 49]]);
            expect(query).to.be.an('object');
            expect(query).to.have.property('resource');
            expect(query.resource).to.be.an(ChannelResource);
            expect(query).to.have.property('operator');
            expect(query.operator).to.have.property('name', 'AND');
            expect(query.operator).to.have.property('filters');
            expect(query.operator.filters).to.be.an(Array);
            expect(query.operator.filters).to.have.length(2);
            expect(query.operator.filters[0]).to.be.an('object');
            expect(query.operator.filters[0]).to.have.property('name', 'John');
            expect(query.operator.filters[1]).to.be.an('object');
            expect(query.operator.filters[1]).to.have.property('age', 49);

            var flattened = query.operator.flatten();
            expect(flattened).to.be.an(Array);
            expect(flattened).to.have.length(3);
            expect(flattened[1]).to.eql('AND');

            expect(Utils.any(flattened, function (elem) {
                return elem.name == 'John';
            })).to.be.ok();

            expect(Utils.any(flattened, function (elem) {
                return elem.age == 49;
            })).to.be.ok();
        });

        it('should construct the proper JSON for the requested query', function () {
            var channel = new ChannelResource({ appId: 'someId', appSecret: 'someSecret' });
            var query = channel.filter([['title__contains', 'test']]);
            query = query.or({title__contains: 123}).or({title: 'something?'}).and({age: 19});
            expect(query.operator).to.be.an('object');
            var flattened = query.operator.flatten();
            expect(flattened).to.be.an(Array);
            expect(flattened).to.have.length(3);
            expect(flattened[1]).to.eql('AND');
            expect(flattened[0]).to.be.an(Array);
            expect(flattened[0]).to.have.length(5);
            expect(flattened[0][1]).to.eql('OR');
            expect(flattened[0][3]).to.eql('OR');

            expect(Utils.any(flattened[0], function (operator) {
                return (operator.title__contains == 'test');
            })).to.be.ok();
            expect(Utils.any(flattened[0], function (operator) {
                return (operator.title__contains == 123);
            })).to.be.ok();
            expect(Utils.any(flattened[0], function (operator) {
                return (operator.title == 'something?');
            })).to.be.ok();

            expect(flattened[2]).to.be.an('object');
            expect(flattened[2]).to.have.property('age', 19);
        });

        it('should construct the proper JSON for the requested query: Using NOT', function () {
            var channel = new ChannelResource({ appId: 'someId', appSecret: 'someSecret' });
            var query = channel.filter([['title__contains', 'test']]).or({title__contains: 'something'}).not({age: 19});
            expect(query.operator).to.be.an('object');
            var flattened = query.operator.flatten();
            expect(flattened).to.be.an(Array);
            expect(flattened).to.have.length(3);
            expect(flattened[1]).to.eql('AND');
            expect(flattened[0]).to.be.an(Array);
            expect(flattened[0][1]).to.eql('OR');

            expect(Utils.any(flattened[0], function (operator) {
                return (operator.title__contains == 'test');
            })).to.be.ok();
            expect(Utils.any(flattened[0], function (operator) {
                return (operator.title__contains == 'something');
            })).to.be.ok();

            expect(flattened[2]).to.be.an('object');
            expect(flattened[2]).to.have.property('NOT');
            expect(flattened[2].NOT).to.be.an('object');
            expect(flattened[2].NOT).to.have.property('age', 19);
        });
    });
});