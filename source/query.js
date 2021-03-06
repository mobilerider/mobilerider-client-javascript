var Query = (function () {
    'use strict';

    var LOOKUPS_LIST = [
        'exact', 'iexact', 'contains', 'icontains', 'in', 'gt', 'gte', 'lt', 'lte',
        'startswith', 'istartswith', 'endswith', 'iendswith', 'range', 'year',
        'month', 'day', 'week_day', 'hour', 'minute', 'second', 'isnull', 'search',
        'regex', 'iregex'
    ];

    var LOOKUPS_MAP = {};
    Utils.each(LOOKUPS_LIST, function (lookup) {
        LOOKUPS_MAP[lookup] = true;
    });

    var SCALAR_TYPES = ['number', 'string', 'boolean'];

    var cloneObj = function _cloneObj (obj) {
        if (Utils.isArray(obj)) {
            return Utils.map(obj, function (value) {
                return _cloneObj(value);
            });
        }
        if (Utils.isObject(obj)) {
            var cloned;
            if (obj instanceof Operator) {
                cloned = new Operator(obj.name, _cloneObj(obj.filters));
            } else {
                cloned = {};
                Utils.each(obj, function (value, key) {
                    cloned[key] = _cloneObj(value);
                });
            }
            return cloned;
        }
        if (SCALAR_TYPES.indexOf(typeof obj) == -1) {
            return Object.prototype.toString.call(obj);
        }
        return obj;
    };

    var tupleToObj = function (arg1, arg2) {
        var tuple;
        if (arguments.length == 1) {
            tuple = arg1;
        } else
        if (arguments.length == 2) {
            tuple = [arg1, arg2];
        } else {
            throw new TypeError('Wrong argument count');
        }
        var o = {};
        o[tuple[0]] = tuple[1];
        return o;
    };


    var Operator = function (name, filters) {
        name = name.toUpperCase();
        if (name != 'AND' && name != 'OR' && name != 'NOT') {
            throw new TypeError('Operator: Invalid operator name: ' + name);
        }
        var arrayLike = filters && (filters.length == +filters.length);
        if (!Utils.undef(filters) && arrayLike && Utils.isstr(filters)) {
            throw new TypeError('If present the `filters` parameter must be an Array');
        }
        this.name = name;
        this.filters = [];
        this.addFilters(filters || []);
    };

    Operator.prototype.clone = function () {
        return new Operator(this.name, cloneObj(this.filters));
    };

    Operator.prototype.validateField = function (fieldName) {
        // Return true for valid field names/lookups
        // Otherwise, return false / raise Error

        var components = fieldName.split('__');
        var misplacedLookup = Utils.any(Utils.slice(components, 0, -1), function (component, index) {
            return !!LOOKUPS_MAP[component];
        });
        if (misplacedLookup) {
            throw new TypeError('Field lookups can only be at the end if present. Got: ' + fieldName);
        }
        if (components.length == 1 && LOOKUPS_MAP[components[0]]) {
            throw new TypeError('Invalid field name: ' + components[0]);
        }
        return true;
    };

    Operator.prototype.addFilters = function (filters) {
        var self = this;
        var newFilters = [];
        Utils.each(filters, function (value, key) {
            if (Utils.isArray(value)) {
                if (value.length != 2) {
                    throw new TypeError('Filters must be in the form of `["field_name", "filter_value"]`. Got: ' + value.toString());
                }
                self.validateField(value[0]);
                newFilters.push(tupleToObj(value));
            } else if (value instanceof Operator) {
                newFilters.push(value.clone());
            } else if (Utils.isstr(key)) {
                self.validateField(key);
                newFilters.push(tupleToObj(key, value));
            } else if (Utils.isObject(value)) {
                Utils.each(value, function (objValue, objKey) {
                    self.validateField(objKey);
                    newFilters.push(tupleToObj(objKey, objValue));
                });
            } else {
                throw new TypeError('Invalid filter: ' + JSON.stringify(value));
            }
        });
        this.filters = this.filters.concat(newFilters);
    };

    Operator.prototype.flatten = function () {
        var output = [], self = this, filter;
        for (var i = 0; i < this.filters.length; i++) {
            if (i > 0) {
                output.push(this.name);
            }
            filter = this.filters[i];
            if (!!filter.flatten) {
                output.push(filter.flatten());
            } else {
                output.push(filter);
            }
        }
        if (output.length == 1) {
            output = output[0];
        }

        if (this.name == 'NOT') {
            return {
                'NOT': output
            };
        }
        return output;
    };

    var Query = function (resource, operator_or_filters, fields) {
        if (typeof fields == 'string') {
            this.fields = [fields];
        } else {
            this.fields = Utils.slice(fields || []);
        }
        this.resource = resource;
        if (operator_or_filters instanceof Operator) {
            this.operator = operator_or_filters.clone();
        } else {
            this.operator = new Operator('AND', operator_or_filters);
        }

        this._pageIndex = 1;
        this._pageSize = 20;
    };

    Query.prototype.clone = function () {
        var cloned = new Query(this.resource, this.operator.clone(), this.fields);
        cloned._pageSize = this._pageSize;
        cloned._pageIndex = this._pageIndex;
        cloned.ordering = this.ordering;
        return cloned;
    };

    Query.prototype.and = function () {
        var cloned = this.clone();
        if (cloned.operator.filters.length) {
            if (cloned.operator.name != 'AND') {
                cloned.operator = new Operator('AND', [cloned.operator]);
            }
            cloned.operator.addFilters(arguments);
        } else {
            cloned.operator = new Operator('AND', arguments);
        }
        return cloned;
    };

    Query.prototype.filter = Query.prototype.and;

    Query.prototype.or = function () {
        var cloned = this.clone();
        if (cloned.operator.filters.length) {
            if (cloned.operator.name != 'OR') {
                cloned.operator = new Operator('OR', [cloned.operator]);
            }
            cloned.operator.addFilters(arguments);
        } else {
            cloned.operator = new Operator('OR', arguments);
        }
        return cloned;
    };

    Query.prototype.not = function () {
        var cloned = this.clone();
        if (cloned.operator.filters.length) {
            if (cloned.operator.name == 'AND') {
                cloned.operator.addFilters([new Operator('NOT', arguments)]);
            } else
            if (cloned.operator.name == 'NOT') {
                cloned.operator.addFilters(arguments);
            } else {
                cloned.operator = new Operator('AND', [cloned.operator]);
                cloned.operator.addFilters([new Operator('NOT', [new Operator('AND', arguments)])]);
            }
        } else {
            cloned.operator = new Operator('NOT', [new Operator('AND', arguments)]);
        }
        return cloned;
    };

    Query.prototype.exclude = Query.prototype.not;

    Query.prototype.only = function () {
        var cloned = this.clone();
        cloned.fields = Utils.slice(arguments);
        return cloned;
    };

    Query.prototype.setPage = function (_pageIndex, _pageSize) {
        var pageIndex = parseInt(_pageIndex, 10);
        var pageSize = parseInt(_pageSize, 10);
        if (isNaN(pageIndex) || pageIndex < 1) {
            throw new Error('Invalid page number: ' + _pageIndex);
        }
        var cloned = this.clone();
        cloned._pageIndex = pageIndex;
        if (!isNaN(pageSize)) {
            cloned._pageSize = pageSize;
        }
        return cloned;
    };

    Query.prototype.setPageSize = function (_pageSize) {
        var pageSize = parseInt(_pageSize, 10);
        if (isNaN(pageSize) || pageSize < 1) {
            throw new Error('Invalid page size: ' + _pageSize);
        }
        var cloned = this.clone();
        cloned._pageSize = pageSize;
        return cloned;
    };

    Query.prototype.orderBy = function () {
        var cloned = this.clone();
        cloned.ordering = Utils.map(arguments, function (field) {
            return {
                field: field[0] === '-' ? field.slice(1) : field,
                order: field[0] === '-' ? 'desc' : 'asc'
            };
        });
        return cloned;
    };

    Query.prototype.fetch = function (data) {
        var self = this,
            flattened = this.operator.flatten(),
            params;

        data = data ? Utils.extend({}, data) : {};

        if (!Utils.any(flattened, function (component) {
            return (component != 'AND' && (Utils.isArray(component) || !Utils.isObject(component) || !!component.NOT ));
        })) {
            params = [];
            Utils.each(flattened, function (component) {
                if (Utils.isObject(component)) {
                    Utils.each(component, function (v, k) {
                        params.push({ name: k, value: v });
                    });
                }
            });
            params.push({ name: 'page', value: this._pageIndex });
            params.push({ name: 'limit', value: this._pageSize });

            // Right now the API can order using one file only
            if (this.ordering && this.ordering.length) {
                params.push({ name: 'sort', value: this.ordering[0].field });
                params.push({ name: 'order', value: this.ordering[0].order });
            }

            Utils.each(data, function (v, k) {
                params.push({ name: k, value: v });
            });

            return self.resource.all(params);
        }

        var jsonQuery = { filters: flattened };
        if (this.fields.length) {
            jsonQuery.fields = Utils.slice(this.fields);
        }

        params = Utils.extend(data, {
            __queryset__: JSON.stringify(jsonQuery),
            page: this._pageIndex,
            limit: this._pageSize
        });

        // Right now the API can order using one file only
        if (this.ordering && this.ordering.length) {
            params.sort = this.ordering[0].field;
            params.order = this.ordering[0].order;
        }

        return this.resource.all(params);
    };

    return Query;

})();