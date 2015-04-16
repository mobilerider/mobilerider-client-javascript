var MediaResource = (function () {
    'use strict';

    var MediaResource = function () {
        Resource.apply(this, arguments);
    };

    Utils.extend(MediaResource.prototype, Resource.prototype, MediaResource.prototype);

    MediaResource.prototype.constructor = MediaResource;

    MediaResource.prototype.getUrl = function (id) {
        id = (!Utils.undef(id)) ? this.validateId(id) : id;
        var url = 'media';
        if (id) {
            url += ('/' + id);
        }
        return url;
    };

    return MediaResource;

})();