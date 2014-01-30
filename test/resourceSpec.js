describe('Resource ("abstract") class', function () {

    it('should be able to be instantiated', function () {
        var initializeSpy = sinon.spy(Resource.prototype, 'initialize');

        var contructorArgs = { appId: 'someId', appSecret: 'someSecret' };
        var resource = new Resource(contructorArgs);
        expect(resource).to.have.property('client');
        expect(resource.client).to.be.an('object');
        expect(resource.client).to.have.property('request');
        expect(resource.client.request).to.be.a('function');

        expect(initializeSpy.calledOnce).to.be.ok;
        expect(initializeSpy.getCall(0).args).to.have.length(1);
        expect(initializeSpy.getCall(0).args[0]).to.be.deep.equal(contructorArgs);

        initializeSpy.restore();
    });

    it('should throw an exception when trying to ask for it\'s URL', function () {
        var resource = new Resource({ appId: 'someId', appSecret: 'someSecret' });
        var url = '';
        expect(function () { url = resource.getUrl() }).to.throw('Abstract method');
    });
});