var Utils = (function () {
    'use strict';

    var nativeForEach = Array.prototype.forEach,
        nativeIsArray = Array.isArray,
        nativeSome = Array.prototype.some,
        toString = Object.prototype.toString,
        nativeMap = Array.prototype.map,
        nativeSlice = Array.prototype.slice,
        isArray = nativeIsArray || function (array) {
            return toString.call(obj) == '[object Array]';
        },
        breaker = {},
        isObject = function (obj) {
            return obj === Object(obj);
        },
        slice = function (array) {
            return nativeSlice.apply(array, nativeSlice.call(arguments, 1));
        },
        undef = function (x) {
            return typeof x == 'undefined';
        },
        isstr = function (x) {
            return typeof x == 'string';
        },
        keys = Object.keys || function (obj) {
            if (obj !== Object(obj)) throw new TypeError('Invalid object');
            var keys = [];
            for (var key in obj) if (obj.hasOwnProperty(key)) keys.push(key);
            return keys;
        },
        each = function (obj, iterator, context) {
            if (obj === null || undef(obj)) return;
            var i, length;
            if (nativeForEach && obj.forEach === nativeForEach) {
                obj.forEach(iterator, context);
            } else if (obj.length === +obj.length) {
                for (i = 0, length = obj.length; i < length; i++) {
                    if (iterator.call(context, obj[i], i, obj) === breaker) return;
                }
            } else {
                var objKeys = keys(obj);
                for (i = 0, length = objKeys.length; i < length; i++) {
                    iterator.call(context, obj[objKeys[i]], objKeys[i], obj);
                }
            }
        },
        extend = function (obj) {
            each(slice(arguments, 1), function (source) {
                if (source) {
                    for (var prop in source) {
                        if (source.hasOwnProperty(prop)) {
                            obj[prop] = source[prop];
                        }
                    }
                }
            });
            return obj;
        },
        identity = function (value) { return value; },
        any = function (obj, iterator, context) {
            iterator = iterator || identity;
            var result = false;
            if (obj === null || obj === void 0 || obj === false) {
                return result;
            }
            if (nativeSome && obj.some === nativeSome) {
                return obj.some(iterator, context);
            }
            each(obj, function (value, index, list) {
                if (result || (result = iterator.call(context, value, index, list))) {
                    return breaker;
                }
            });
            return !!result;
        },
        map = function (obj, iterator, context) {
            iterator = iterator || identity;
            var results = [];
            if (obj === null || obj === void 0 || obj === false) {
                return results;
            }
            if (nativeMap && obj.map === nativeMap) {
                return obj.map(iterator, context);
            }
            each(obj, function (value, index, list) {
                results.push(iterator.call(context, value, index, list));
            });
            return results;
        };

    return {
        slice: slice,
        extend: extend,
        each: each,
        keys: keys,
        isArray: isArray,
        isObject: isObject,
        any: any,
        some: any,
        map: map,
        undef: undef,
        isstr: isstr
    };
})();