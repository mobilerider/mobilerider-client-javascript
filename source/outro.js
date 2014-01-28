
if (typeof define === 'function' && define.amd) {
    define('mobilerider-client', [], function () {
        return {
            Client: Client,
            Resource: Resource,
            Media: MediaResource,
            Channel: ChannelResource
        };
    });
} else {
    if (!exports.mobilerider) {
        exports.mobilerider = {};
    }
    exports.mobilerider.Client = Client;
    exports.mobilerider.Resource = Resource;
    exports.mobilerider.Media = MediaResource;
    exports.mobilerider.Channel = ChannelResource;
}

})(this);