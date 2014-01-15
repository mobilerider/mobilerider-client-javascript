
    if (typeof define === 'function' && define.amd) {
        define('client', [], function() {
            return Client;
        });
    } else {
        exports.Client = Client;
    }

})(this);