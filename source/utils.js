var nativeForEach = Array.prototype.forEach,
    slice = function (array) {
        return Array.prototype.slice.apply(array, Array.prototype.slice.call(arguments, 1));
    },
    keys = Object.keys || function (obj) {
        if (obj !== Object(obj)) throw new TypeError('Invalid object');
        var keys = [];
        for (var key in obj) if (obj.hasOwnProperty(key)) keys.push(key);
        return keys;
    },
    each = function(obj, iterator, context) {
        if (obj === null) return;
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
        each(slice(arguments, 1), function(source) {
            if (source) {
                for (var prop in source) {
                    if (source.hasOwnProperty(prop)) {
                        obj[prop] = source[prop];
                    }
                }
            }
        });
        return obj;
    };