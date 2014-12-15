var Client = (function () {
    'use strict';

    var Client = function (options) {
        this.options = Utils.extend({}, options || {});
        if (!(this.options.appId && this.options.appSecret)) {
            throw new Error('You must provide `appId` and `appSecret` in the options.');
        }
    };

    Client.prototype._getRequestHeaders = function () {
        var headers = {
            Authorization: 'Basic ' + btoa(unescape(encodeURIComponent(this.options.appId + ':' + this.options.appSecret)))
        };

        if (this.options.subVendorAppId) {
            headers['X-Vendor-App-Id'] = this.options.subVendorAppId;
        }

        return headers;
    };

    Client.prototype.resolvePromise = function (promise, response, rootKeys) {
        var copyKeys = (rootKeys && rootKeys.length) ? Utils.map(rootKeys) : ['success', 'object', 'objects'],
            result;
        if (typeof response !== 'object') {
            promise.reject({
                success: false,
                meta: {
                    status: 'Invalid response from the server',
                    response: response + ''
                }
            });
        } else if (!response.success) {
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
            promise.reject(result);
        } else {
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
            promise.resolve(result);
        }
        return promise;
    };

    Client.prototype.rejectPromiseFromXhr = function (promise, xhr) {
        var errorResponse;
        try {
            errorResponse = JSON.parse(xhr.responseText);
        } catch (exception) {
            errorResponse = {};
        }
        errorResponse.meta = errorResponse.meta || {};
        errorResponse.meta.statusCode = xhr.status;
        errorResponse.meta.statusText = xhr.statusText;
        errorResponse.meta.responseText = xhr.responseText;
        promise.reject(errorResponse);
        return promise;
    };

    Client.prototype.request = function (params) {
        var self = this;
        params = params || {};
        var i, requiredParams = ['url', 'method'];
        for (i = requiredParams.length - 1; i >= 0; i--) {
            if (!params.hasOwnProperty(requiredParams[i])) {
                throw new Error('Missing the `' + requiredParams[i] + '` parameter');
            }
        }

        if (params.url.indexOf(Settings.endpointPrefix) !== 0) {
            throw new Error('Invalid URL: ' + params.url);
        }

        if (['get', 'post', 'put', 'patch', 'delete'].indexOf(params.method.toLowerCase()) == -1) {
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
                self.resolvePromise(deferred, response);
            },
            function (xhr) {
                self.rejectPromiseFromXhr(deferred, xhr);
            }
        );
        return deferred.promise;
    };

    return Client;

})();
