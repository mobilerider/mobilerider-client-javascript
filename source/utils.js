define([], function () {

    var nativeForEach = Array.prototype.forEach,
        slice = Array.prototype.slice,
        each = function(obj, iterator, context) {
            if (obj === null) return;
            var i;
            if (nativeForEach && obj.forEach === nativeForEach) {
                obj.forEach(iterator, context);
            } else if (obj.length === +obj.length) {
                for (i = 0, length = obj.length; i < length; i++) {
                    if (iterator.call(context, obj[i], i, obj) === breaker) return;
                }
            } else {
                var keys = _.keys(obj);
                for (i = 0, length = keys.length; i < length; i++) {
                    if (iterator.call(context, obj[keys[i]], keys[i], obj) === breaker) return;
                }
            }
        },
        extend = function (obj) {
            each(slice.call(arguments, 1), function(source) {
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

    return {
        slice: slice,
        extend: extend,
        each: each
    };
});