describe('MediaResource', function () {
    it('should complain about missing client/appId/appSecret parameters', function () {
        var mediaRsrc = function () { return new MediaResource(); };
        expect(mediaRsrc).to.throw('You must pass a `Client` instance or `appId` and `appSecret`');
        mediaRsrc = function () { return new MediaResource({ client: 'I tell you I\'m a client!' }); };
        expect(mediaRsrc).to.throw('You must pass a valid client instance, got an');
        mediaRsrc = function () { return new MediaResource({ appId: 'someId' }); };
        expect(mediaRsrc).to.throw('You must pass a `Client` instance or `appId` and `appSecret`');
        mediaRsrc = function () { return new MediaResource({ appSecret: 'someSecret' }); };
        expect(mediaRsrc).to.throw('You must pass a `Client` instance or `appId` and `appSecret`');
    });

    it('should have a valid Client instance', function () {
        var mediaRsrc = new MediaResource({ appId: 'someId', appSecret: 'someSecret' });
        expect(mediaRsrc.client).to.be.an.instanceof(Client);
    });

    it('should have a valid URL', function () {
        var mediaRsrc = new MediaResource({ appId: 'someId', appSecret: 'someSecret' });
        var url = mediaRsrc.getUrl();

        if (url[url.length - 1] != '/') {
            url += '/';
        }

        expect(url).to.match(/\/media\/$/);
        url += '4';
        expect(mediaRsrc.getUrl(4)).to.eql(url);
        expect(url).to.match(/\/media\/4$/);
    });
});
