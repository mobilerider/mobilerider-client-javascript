define([], function () {

    describe('Settings module', function () {

        it('should have the relevant settings keys', function () {
            expect(Settings).to.have.property('root');
            expect(Settings).to.have.property('loginEndpoint');
            expect(Settings).to.have.property('mediaEndpoint');
            expect(Settings).to.have.property('channelEndpoint');
        });

        it('should have the domain endpoints prefixed by the root', function () {
            expect(Settings).to.have.property('root');
            expect(Settings.root).to.match(/^https:\/\/api\./);
            var endpointKeys = ['loginEndpoint', 'mediaEndpoint', 'channelEndpoint'];
            for (var i = 0; i < endpointKeys.length; i++) {
                var endpointUrl = Settings[endpointKeys[i]];
                expect(endpointUrl.indexOf(Settings.root)).to.be(0);
            }
        });
    });
});