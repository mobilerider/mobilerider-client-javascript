define(['resource', 'utils', 'settings'], function (Resource, Utils, Settings) {

var MediaResource = function () {
    Resource.apply(this, arguments);
};

MediaResource.prototype = Resource.prototype;
MediaResource.prototype.constructor = MediaResource;

MediaResource.prototype.getUrl = function (id) {
    id = typeof id != 'undefined' ? this.validateId(id) : id;
    var url = Settings.mediaEndpoint;
    if (url[url.length - 1] != '/' && !!id) {
        url += ('/' + id);
    }
    return url;
};

Utils.extend(MediaResource.prototype, Resource.prototype, MediaResource.prototype);

return MediaResource;

});