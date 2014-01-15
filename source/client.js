define(['promises', 'requests', 'settings', 'utils'], function (Promises, Requests, Settings, Utils) {

var Client = function (options) {
    this.options = Utils.extend({}, options || {});
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
    var i, requiredParams = ['url', 'method'];
    for (i = requiredParams.length - 1; i >= 0; i--) {
        if (!params.hasOwnProperty(requiredParams[i])) {
            throw new Error('Missing the `' + requiredParams[i] + '` parameter');
        }
    }

    if (params.url.indexOf(Settings.root) !== 0) {
        throw new Error('Invalid URL: ' + params.url);
    }

    if (['get', 'post', 'put', 'delete'].indexOf(params.method.toLowerCase()) == -1) {
        throw new Error('Invalid method: ' + params.method);
    }

    params.type = 'json';
    params.headers = this._getRequestHeaders();
    var deferred = Promises.defer();

    Requests(params).then(
        function (response) {
            if (typeof response !== 'object') {
                deferred.reject('Invalid response from the server');
            } else if (!response.success) {
                if (!response.status) {
                    deferred.reject('Unsuccessful request (response status empty)');
                } else {
                    deferred.reject(response.status);
                }
            } else {
                deferred.resolve(response.object || response.objects);
            }
        },
        function (xhr) {
            deferred.reject(xhr.statusText + ': ' + xhr.responseText);
        }
    );
    return deferred.promise;
};

return Client;

});
