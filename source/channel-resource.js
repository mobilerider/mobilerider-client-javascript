var ChannelResource = (function () {
    'use strict';

    var ChannelResource = function () {
        Resource.apply(this, arguments);
    };

    Utils.extend(ChannelResource.prototype, Resource.prototype, ChannelResource.prototype);

    ChannelResource.prototype.constructor = ChannelResource;

    ChannelResource.prototype.getUrl = function (id) {
        id = (!Utils.undef(id)) ? this.validateId(id) : id;
        var url = 'channel';
        if (id) {
            url += ('/' + id);
        }
        return url;
    };

    return ChannelResource;

})();