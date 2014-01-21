define(['resource', 'utils', 'settings'], function (Resource, Utils, Settings) {

var ChannelResource = function () {
    Resource.apply(this, arguments);
};

ChannelResource.prototype = Resource.prototype;
ChannelResource.prototype.constructor = ChannelResource;

ChannelResource.prototype.getUrl = function (id) {
    id = typeof id != 'undefined' ? this.validateId(id) : id;
    var url = Settings.channelEndpoint;
    if (url[url.length - 1] != '/' && !!id) {
        url += ('/' + id);
    }
    return url;
};

Utils.extend(ChannelResource.prototype, Resource.prototype, ChannelResource.prototype);

return ChannelResource;

});