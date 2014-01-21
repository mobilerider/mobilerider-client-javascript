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

    params = Utils.extend(
        {
            type: 'json',
            contentType: 'application/json',
            headers: this._getRequestHeaders()
        },
        params
    );

    var deferred = Promises.defer();

    Requests(params).then(
        function (response) {
            var copyKeys, result;
            if (typeof response !== 'object') {
                deferred.reject({
                    success: false,
                    status: 'Invalid response from the server',
                    response: response + ''
                });
            } else if (!response.success) {
                copyKeys = ['success', 'objects'];
                result = { meta: {} };
                Utils.each(response, function (value, key) {
                    if (key != 'meta') {
                        if (copyKeys.indexOf(key) != -1) {
                            result[key] = value;
                        } else {
                            result.meta[key] = value;
                        }
                    } else {
                        Utils.each(response.meta, function (value, key) {
                            result.meta[key] = value;
                        });
                    }
                });
                deferred.reject(result);
            } else {
                copyKeys = ['success', 'object', 'objects'];
                result = { meta: {} };
                Utils.each(response, function (value, key) {
                    if (key != 'meta') {
                        if (copyKeys.indexOf(key) != -1) {
                            result[key] = value;
                        } else {
                            result.meta[key] = value;
                        }
                    } else {
                        Utils.each(response.meta, function (value, key) {
                            result.meta[key] = value;
                        });
                    }
                });
                deferred.resolve(result);
            }
        },
        function (xhr) {
            deferred.reject('(' + xhr.status + ') ' + xhr.statusText + ': ' + xhr.responseText);
        }
    );
    return deferred.promise;
};

return Client;

});
