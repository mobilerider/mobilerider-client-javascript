define(['promises', 'requests', 'settings', 'utils'], function (Promises, Requests, Settings, Utils) {

var Client = function (options) {
    this.options = Utils.extend({}, options || {}, Settings);
    if (!(this.options.appId && this.options.appSecret)) {
        throw new Error('You must provide `appId` and `appSecret` in the options.');
    }
};

Client.prototype._getRequestHeaders = function () {
    return {
        'Authorization': 'Basic ' + btoa(unescape(encodeURIComponent(this.options.appId + ':' + this.options.appSecret)))
    };
};

Client.prototype.request = function (params) {
    params = params || {};
    if (!params.hasOwnProperty('crossOrigin')) {
        params.crossOrigin = true;
    }

    params.context = params.context || this;
    var i, requiredParams = ['url', 'method'];
    for (i = requiredParams.length - 1; i >= 0; i--) {
        if (!params.hasOwnProperty(requiredParams[i])) {
            throw new Exception('Missing the `' + requiredParams[i] + '` parameter');
        }
    }

    var headers = this._getRequestHeaders();
    var deferred = Promises.defer();

    Requests(params).then(
        function (response) {
            if (!response || !response.status || !response.success) {
                deferred.reject('Status: ' + response['status']);
            } else {
                deferred.resolve(response);
            }
        },
        function (xhr) {
            deferred.reject(xhr);
        }
    );
    return deferred.promise;
};

return Client;

});
