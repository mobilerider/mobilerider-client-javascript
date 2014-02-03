var MediaResource = (function () {
    'use strict';

    var MediaResource = function () {
        Resource.apply(this, arguments);
    };

    Utils.extend(MediaResource.prototype, Resource.prototype, MediaResource.prototype);

    MediaResource.prototype.constructor = MediaResource;

    MediaResource.prototype.getUrl = function (id) {
        id = typeof id != 'undefined' ? this.validateId(id) : id;
        var url = Settings.endpointPrefix + '/media';
        if (url[url.length - 1] != '/' && !!id) {
            url += ('/' + id);
        }
        return url;
    };

    return MediaResource;

})();