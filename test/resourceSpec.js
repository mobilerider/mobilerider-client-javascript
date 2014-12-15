describe('Resource ("abstract") class', function () {

    it('should be properly instantiated', function () {
        var initializeSpy = sinon.spy(Resource.prototype, 'initialize');

        var contructorArgs = { appId: 'someId', appSecret: 'someSecret' };
        var resource = new Resource(contructorArgs);
        expect(resource).to.have.property('client');
        expect(resource.client).to.be.an('object');
        expect(resource.client).to.have.property('request');
        expect(resource.client.request).to.be.a('function');
        expect(resource.client.options).to.not.have.property('subVendorAppId');

        expect(initializeSpy.calledOnce).to.be.ok;
        expect(initializeSpy.getCall(0).args).to.have.length(1);
        expect(initializeSpy.getCall(0).args[0]).to.be.deep.equal(contructorArgs);

        initializeSpy.restore();
    });

    it('should be properly instantiated - with the `subVendorAppId` option', function () {
        var initializeSpy = sinon.spy(Resource.prototype, 'initialize');

        var contructorArgs = { appId: 'someId', appSecret: 'someSecret', subVendorAppId: 'someOtherVendorAppId' };
        var resource = new Resource(contructorArgs);
        expect(resource).to.have.property('client');
        expect(resource.client).to.be.an('object');
        expect(resource.client).to.have.property('request');
        expect(resource.client.request).to.be.a('function');
        expect(resource.client.options).to.have.property('subVendorAppId', 'someOtherVendorAppId');

        expect(initializeSpy.calledOnce).to.be.ok;
        expect(initializeSpy.getCall(0).args).to.have.length(1);
        expect(initializeSpy.getCall(0).args[0]).to.be.deep.equal(contructorArgs);

        initializeSpy.restore();
    });

    it('should throw an exception when trying to ask for it\'s URL', function () {
        var resource = new Resource({ appId: 'someId', appSecret: 'someSecret' });
        var url = '';
        expect(function () { url = resource.getUrl(); }).to.throw('Abstract method');
    });

    it('should set PUT as default param method', function () {
        var client = new Client({appId: 'someId', appSecret: 'someSecret'}),
            requestStub = sinon.stub(client, 'request'),
            resource = new Resource({ client: client }),
            getUrlStub = sinon.stub(resource, 'getUrl', function() { return 'http://test.com'; });

        resource.save({ id: 1, name: 'any' });

        expect(requestStub.calledOnce);
        expect(requestStub.getCall(0).args[0]).to.have.deep.property('method', 'PUT');

        requestStub.restore();
        getUrlStub.restore();
    });

    it('should accept request method as argument in save method and pass it to the client request method', function () {
        var client = new Client({appId: 'someId', appSecret: 'someSecret'}),
            requestStub = sinon.stub(client, 'request'),
            resource = new Resource({ client: client }),
            getUrlStub = sinon.stub(resource, 'getUrl', function() { return 'http://test.com'; });

        resource.save({ id: 1, name: 'any' }, 'patch');

        expect(requestStub.calledOnce);
        expect(requestStub.getCall(0).args[0]).to.have.deep.property('method', 'PATCH');

        requestStub.restore();
        getUrlStub.restore();
    });
});
