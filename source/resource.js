var Resource = (function () {
    'use strict';

    var Resource = function (options) {
        options = options || {};
        this.client = options.client;

        if (!this.client) {
            if (!options.appId || !options.appSecret) {
                throw new Error('You must pass a `Client` instance or `appId` and `appSecret`.');
            }
            this.client = new Client({
                appId: options.appId,
                appSecret: options.appSecret,
                subVendorAppId: options.subVendorAppId
            });
        } else if (!(this.client instanceof Client)) {
            throw new TypeError('You must pass a valid client instance, got an ' + (typeof this.client));
        }

        this.initialize.apply(this, arguments);
    };

    Resource.prototype.initialize = function () {};

    Resource.prototype.getUrl = function () {
        throw new TypeError('getUrl(): Abstract method, you need to override this method in a subclass');
    };

    Resource.prototype.validateId = function (id) {
        var _id = parseInt(id, 10);
        if (isNaN(_id)) {
            throw new TypeError('Identifier "' + id + '" is not a numeric value');
        }
        return _id;
    };

    Resource.prototype.validateAttributes = function (attributes) {
        // Override this method to perform resource-specific validation
        return true;
    };

    Resource.prototype.get = function (id) {
        // Returns a promise that when resolved it contains a Javascript object representing the object returned by the API

        id = this.validateId(id);
        return this.client.request({ url: this.getUrl(id), method: 'GET' });
    };

    Resource.prototype.create = function (attributes) {
        // Returns a promise that when resolved it contains a Javascript object representing the object returned by the API

        var finalAttributes, i, obj;
        if (Utils.isArray(attributes)) {
            finalAttributes = [];
            for (i = attributes.length - 1; i >= 0; i--) {
                obj = Utils.extend({}, attributes[i]);
                delete obj.id;
                this.validateAttributes(obj);
                finalAttributes.push(obj);
            }
        } else {
            finalAttributes = Utils.extend({}, attributes);
            delete finalAttributes.id;
            this.validateAttributes(finalAttributes);
        }
        return this.client.request({ url: this.getUrl(), method: 'POST', data: JSON.stringify(finalAttributes) });
    };

    Resource.prototype.save = function (attributes, method) {
        // Returns a promise that when resolved it contains a Javascript object representing the object returned by the API
        method = method && method.toUpperCase() || 'PUT';

        var finalAttributes, i, obj, id;

        if (Utils.isArray(attributes)) {
            finalAttributes = [];
            for (i = attributes.length - 1; i >= 0; i--) {
                obj = Utils.extend({}, attributes[i]);
                this.validateId(obj.id);
                this.validateAttributes(obj);
                finalAttributes.push(obj);
            }

        } else {
            finalAttributes = Utils.extend({}, attributes);
            this.validateId(finalAttributes.id);
            id = finalAttributes.id;
            this.validateAttributes(finalAttributes);
        }
        return this.client.request({ url: this.getUrl(id), method: method, data: JSON.stringify(attributes) });
    };

    Resource.prototype.delete = function (id) {
        // Return a promise that when resolved notifies the status of the DELETE operation
        return this.client.request({ url: this.getUrl(id), method: 'DELETE' });
    };

    Resource.prototype.all = function (data) {
        // Return a promise that when resolved returns all the instances of the resource
        return this.client.request({ url: this.getUrl(), method: 'GET', data: data });
    };

    Resource.prototype.fetch = Resource.prototype.all;

    Resource.prototype.filter = function () {
        return new Query(this, arguments);
    };

    Resource.prototype.exclude = function () {
        var query = this.filter();
        return query.not.apply(query, Utils.slice(arguments));
    };

    Resource.prototype.setPage = function () {
        var query = this.filter();
        return query.setPage.apply(query, Utils.slice(arguments));
    };

    Resource.prototype.setPageSize = function () {
        var query = this.filter();
        return query.setPageSize.apply(query, Utils.slice(arguments));
    };

    Resource.prototype.orderBy = function () {
        var query = this.filter();
        return query.orderBy.apply(query, Utils.slice(arguments));
    };

    return Resource;

})();
