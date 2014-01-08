/* jshint esnext: true */

var defaults = {
    loginEndpoint: 'http://api.devmobilerider.com/api/vendor/login/',
    mediaEndpoint: 'http://api.devmobilerider.com/api/media',
    channelEndpoint: 'http://api.devmobilerider.com/api/channel'
};

var Client = function (options) {
    this.options = extend({}, options || {}, defaults);
    if (!(this.options.appId && this.options.appSecret)) {
        throw new Exception('You must provide `appId` and `appSecret` in the options.');
    }
};

Client.prototype._getRequestHeaders = function () {
    return {
        'Authorization': 'Basic ' + btoa(unescape(encodeURIComponent(this.options.appId + ':' + this.options.appSecret)))
    };
};

Client.prototype._getRequestObject = function () {
    if (window.XMLHttpRequest) {
        return new XMLHttpRequest();
    }

    if (window.ActiveXObject) {
        return new ActiveXObject('Microsoft.XMLHTTP');
    }

    throw new Exception('Can not create an XMLHttpRequest instance: No class has been found');
};

Client.prototype.request = function (params) {
    var requiredParams = ['url', 'method'];
    for (var i = requiredParams.length - 1; i >= 0; i--) {
        if (!hasOwnProperty(params, requiredParams[i])) {
            throw new Exception('Missing the `' + requiredParams[i] + '` parameter');
        }
    }

    var request = this._getRequestObject();
    var headers = this._getRequestHeaders();
    var headersKeys = Object.keys(headers);
    for (var i = headersKeys.length - 1; i >= 0; i--) {
        request.setRequestHeader(headersKeys[i], headers[headersKeys[i]]);
    }

    return request;
};

export { Client };
