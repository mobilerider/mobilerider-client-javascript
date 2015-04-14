var Client = (function () {
    'use strict';

    var Client = function (options) {
        var self = this, endpointPrefix;
        options = self.options = Utils.extend({}, options || {});
        endpointPrefix = options.endpointPrefix || Settings.endpointPrefix;
        if (endpointPrefix[endpointPrefix.length - 1] != '/') {
            endpointPrefix += '/';
        }
        options.endpointPrefix = endpointPrefix;

        if (!(options.appId && options.appSecret)) {
            throw new Error('You must provide `appId` and `appSecret` in the options.');
        }
    };

    Client.prototype._getRequestHeaders = function () {
        var self = this,
            options = self.options,
            headers = {
                Authorization: 'Basic ' + btoa(unescape(encodeURIComponent(options.appId + ':' + options.appSecret)))
            };

        if (options.subVendorAppId) {
            headers['X-Vendor-App-Id'] = options.subVendorAppId;
        }

        return headers;
    };

    Client.prototype.resolvePromise = function (promise, response, rootKeys) {
        var self = this,
            copyKeys = (rootKeys && rootKeys.length)
                ? Utils.map(rootKeys)
                : ['success', 'object', 'objects'];

        var responseToResult = function (response) {
            var result = { meta: {} };
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
            return result;
        };

        if (Utils.isArray(response)) {
            promise.resolve(responseToResult({
                success: true,
                objects: response,
            }));
        }
        else
        if (self.options.trustStatusCode) {
            response.success = response.success || true;
            promise.resolve(responseToResult(response));
        }
        else
        if (!Utils.isObject(response)) {
            promise.reject(responseToResult({
                success: false,
                meta: {
                    status: 'Invalid response from the server',
                    response: response + ''
                }
            }));
        }
        else
        if (!response.success) {
            promise.reject(responseToResult(response));
        }
        else {
            promise.resolve(responseToResult(response));
        }
        return promise;
    };

    Client.prototype.rejectPromiseFromXhr = function (promise, xhr) {
        var errorResponse, meta;
        try {
            errorResponse = JSON.parse(xhr.responseText);
        } catch (exception) {
            errorResponse = {};
        }
        meta = errorResponse.meta = errorResponse.meta || {};
        meta.statusCode = xhr.status;
        meta.statusText = xhr.statusText;
        meta.responseText = xhr.responseText;
        promise.reject(errorResponse);
        return promise;
    };

    Client.prototype.request = function (params) {
        var self = this, url, method, trailingSlash = self.options.trailingSlash;
        params = params || {};
        var i, requiredParams = ['url', 'method'];
        for (i = requiredParams.length - 1; i >= 0; i--) {
            if (!params.hasOwnProperty(requiredParams[i])) {
                throw new Error('Missing the `' + requiredParams[i] + '` parameter');
            }
        }

        url = params.url;
        if (!url) {
            throw new Error('Empty URL');
        }
        if (url[0] == '/') {
            url = url.substr(1);
        }

        var lastIndex = url.length - 1;
        if (trailingSlash === true && url[lastIndex] != '/') {
            url += '/';
        }
        if (trailingSlash === false && url[lastIndex] == '/') {
            url = url.substr(0, lastIndex);
        }

        params.url = self.options.endpointPrefix + url;

        method = ('' + params.method).toUpperCase();
        if (['GET', 'POST', 'PUT', 'PATCH', 'DELETE'].indexOf(method) == -1) {
            throw new Error('Invalid method: ' + (method || '<empty>'));
        }
        params.method = method;

        params = Utils.extend(
            {
                type: 'json',
                contentType: 'application/json',
                headers: self._getRequestHeaders()
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
