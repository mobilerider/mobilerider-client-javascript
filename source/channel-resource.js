var ChannelResource = (function () {

var ChannelResource = function () {
    Resource.apply(this, arguments);
};

Utils.extend(ChannelResource.prototype, Resource.prototype, ChannelResource.prototype);

ChannelResource.prototype.constructor = ChannelResource;

ChannelResource.prototype.getUrl = function (id) {
    id = typeof id != 'undefined' ? this.validateId(id) : id;
    var url = Settings.endpointPrefix + '/channel';
    if (url[url.length - 1] != '/' && !!id) {
        url += ('/' + id);
    }
    return url;
};

return ChannelResource;

})();