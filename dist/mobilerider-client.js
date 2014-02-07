(function (exports, undefined) {
    'use strict';
;
var Requests = (function (undefined) {

  var win = window
    , doc = document
    , twoHundo = /^(20\d|1223)$/
    , byTag = 'getElementsByTagName'
    , readyState = 'readyState'
    , contentType = 'Content-Type'
    , requestedWith = 'X-Requested-With'
    , head = doc[byTag]('head')[0]
    , uniqid = 0
    , callbackPrefix = 'reqwest_' + (+new Date())
    , lastValue // data stored by the most recent JSONP callback
    , xmlHttpRequest = 'XMLHttpRequest'
    , xDomainRequest = 'XDomainRequest'
    , noop = function () {}

    , isArray = typeof Array.isArray == 'function'
        ? Array.isArray
        : function (a) {
            return a instanceof Array
          }

    , defaultHeaders = {
          'contentType': 'application/x-www-form-urlencoded'
        , 'requestedWith': xmlHttpRequest
        , 'accept': {
              '*':  'text/javascript, text/html, application/xml, text/xml, */*'
            , 'xml':  'application/xml, text/xml'
            , 'html': 'text/html'
            , 'text': 'text/plain'
            , 'json': 'application/json, text/javascript'
            , 'js':   'application/javascript, text/javascript'
          }
      }

    , xhr = function(o) {
        // is it x-domain
        if (o['crossOrigin'] === true) {
          var xhr = win[xmlHttpRequest] ? new XMLHttpRequest() : null
          if (xhr && 'withCredentials' in xhr) {
            return xhr
          } else if (win[xDomainRequest]) {
            return new XDomainRequest()
          } else {
            throw new Error('Browser does not support cross-origin requests')
          }
        } else if (win[xmlHttpRequest]) {
          return new XMLHttpRequest()
        } else {
          return new ActiveXObject('Microsoft.XMLHTTP')
        }
      }
    , globalSetupOptions = {
        dataFilter: function (data) {
          return data
        }
      }

  function handleReadyState(r, success, error) {
    return function () {
      // use _aborted to mitigate against IE err c00c023f
      // (can't read props on aborted request objects)
      if (r._aborted) return error(r.request)
      if (r.request && r.request[readyState] == 4) {
        r.request.onreadystatechange = noop
        if (twoHundo.test(r.request.status))
          success(r.request)
        else
          error(r.request)
      }
    }
  }

  function setHeaders(http, o) {
    var headers = o['headers'] || {}
      , h

    headers['Accept'] = headers['Accept']
      || defaultHeaders['accept'][o['type']]
      || defaultHeaders['accept']['*']

    // breaks cross-origin requests with legacy browsers
    if (!o['crossOrigin'] && !headers[requestedWith]) headers[requestedWith] = defaultHeaders['requestedWith']
    if (!headers[contentType]) headers[contentType] = o['contentType'] || defaultHeaders['contentType']
    for (h in headers)
      headers.hasOwnProperty(h) && 'setRequestHeader' in http && http.setRequestHeader(h, headers[h])
  }

  function setCredentials(http, o) {
    if (typeof o['withCredentials'] !== 'undefined' && typeof http.withCredentials !== 'undefined') {
      http.withCredentials = !!o['withCredentials']
    }
  }

  function generalCallback(data) {
    lastValue = data
  }

  function urlappend (url, s) {
    return url + (/\?/.test(url) ? '&' : '?') + s
  }

  function handleJsonp(o, fn, err, url) {
    var reqId = uniqid++
      , cbkey = o['jsonpCallback'] || 'callback' // the 'callback' key
      , cbval = o['jsonpCallbackName'] || reqwest.getcallbackPrefix(reqId)
      , cbreg = new RegExp('((^|\\?|&)' + cbkey + ')=([^&]+)')
      , match = url.match(cbreg)
      , script = doc.createElement('script')
      , loaded = 0
      , isIE10 = navigator.userAgent.indexOf('MSIE 10.0') !== -1

    if (match) {
      if (match[3] === '?') {
        url = url.replace(cbreg, '$1=' + cbval) // wildcard callback func name
      } else {
        cbval = match[3] // provided callback func name
      }
    } else {
      url = urlappend(url, cbkey + '=' + cbval) // no callback details, add 'em
    }

    win[cbval] = generalCallback

    script.type = 'text/javascript'
    script.src = url
    script.async = true
    if (typeof script.onreadystatechange !== 'undefined' && !isIE10) {
      // need this for IE due to out-of-order onreadystatechange(), binding script
      // execution to an event listener gives us control over when the script
      // is executed. See http://jaubourg.net/2010/07/loading-script-as-onclick-handler-of.html
      //
      // if this hack is used in IE10 jsonp callback are never called
      script.event = 'onclick'
      script.htmlFor = script.id = '_reqwest_' + reqId
    }

    script.onload = script.onreadystatechange = function () {
      if ((script[readyState] && script[readyState] !== 'complete' && script[readyState] !== 'loaded') || loaded) {
        return false
      }
      script.onload = script.onreadystatechange = null
      script.onclick && script.onclick()
      // Call the user callback with the last value stored and clean up values and scripts.
      fn(lastValue)
      lastValue = undefined
      head.removeChild(script)
      loaded = 1
    }

    // Add the script to the DOM head
    head.appendChild(script)

    // Enable JSONP timeout
    return {
      abort: function () {
        script.onload = script.onreadystatechange = null
        err({}, 'Request is aborted: timeout', {})
        lastValue = undefined
        head.removeChild(script)
        loaded = 1
      }
    }
  }

  function getRequest(fn, err) {
    var o = this.o
      , method = (o['method'] || 'GET').toUpperCase()
      , url = typeof o === 'string' ? o : o['url']
      // convert non-string objects to query-string form unless o['processData'] is false
      , data = (o['processData'] !== false && o['data'] && typeof o['data'] !== 'string')
        ? reqwest.toQueryString(o['data'])
        : (o['data'] || null)
      , http
      , sendWait = false

    // if we're working on a GET request and we have data then we should append
    // query string to end of URL and not post data
    if ((o['type'] == 'jsonp' || method == 'GET') && data) {
      url = urlappend(url, data)
      data = null
    }

    if (o['type'] == 'jsonp') return handleJsonp(o, fn, err, url)

    // get the xhr from the factory if passed
    // if the factory returns null, fall-back to ours
    http = (o.xhr && o.xhr(o)) || xhr(o)

    http.open(method, url, o['async'] === false ? false : true)
    setHeaders(http, o)
    setCredentials(http, o)
    if (win[xDomainRequest] && http instanceof win[xDomainRequest]) {
        http.onload = fn
        http.onerror = err
        // NOTE: see
        // http://social.msdn.microsoft.com/Forums/en-US/iewebdevelopment/thread/30ef3add-767c-4436-b8a9-f1ca19b4812e
        http.onprogress = function() {}
        sendWait = true
    } else {
      http.onreadystatechange = handleReadyState(this, fn, err)
    }
    o['before'] && o['before'](http)
    if (sendWait) {
      setTimeout(function () {
        http.send(data)
      }, 200)
    } else {
      http.send(data)
    }
    return http
  }

  function Reqwest(o, fn) {
    this.o = o
    this.fn = fn

    init.apply(this, arguments)
  }

  function setType(url) {
    var m = url.match(/\.(json|jsonp|html|xml)(\?|$)/)
    return m ? m[1] : 'js'
  }

  function init(o, fn) {

    this.url = typeof o == 'string' ? o : o['url']
    this.timeout = null

    // whether request has been fulfilled for purpose
    // of tracking the Promises
    this._fulfilled = false
    // success handlers
    this._successHandler = function(){}
    this._fulfillmentHandlers = []
    // error handlers
    this._errorHandlers = []
    // complete (both success and fail) handlers
    this._completeHandlers = []
    this._erred = false
    this._responseArgs = {}

    var self = this
      , type = o['type'] || setType(this.url)

    fn = fn || function () {}

    if (o['timeout']) {
      this.timeout = setTimeout(function () {
        self.abort()
      }, o['timeout'])
    }

    if (o['success']) {
      this._successHandler = function () {
        o['success'].apply(o, arguments)
      }
    }

    if (o['error']) {
      this._errorHandlers.push(function () {
        o['error'].apply(o, arguments)
      })
    }

    if (o['complete']) {
      this._completeHandlers.push(function () {
        o['complete'].apply(o, arguments)
      })
    }

    function complete (resp) {
      o['timeout'] && clearTimeout(self.timeout)
      self.timeout = null
      while (self._completeHandlers.length > 0) {
        self._completeHandlers.shift()(resp)
      }
    }

    function success (resp) {
      resp = (type !== 'jsonp') ? self.request : resp
      // use global data filter on response text
      var filteredResponse = globalSetupOptions.dataFilter(resp.responseText, type)
        , r = filteredResponse
      try {
        resp.responseText = r
      } catch (e) {
        // can't assign this in IE<=8, just ignore
      }
      if (r) {
        switch (type) {
        case 'json':
          try {
            resp = win.JSON ? win.JSON.parse(r) : eval('(' + r + ')')
          } catch (err) {
            return error(resp, 'Could not parse JSON in response', err)
          }
          break
        case 'js':
          resp = eval(r)
          break
        case 'html':
          resp = r
          break
        case 'xml':
          resp = resp.responseXML
              && resp.responseXML.parseError // IE trololo
              && resp.responseXML.parseError.errorCode
              && resp.responseXML.parseError.reason
            ? null
            : resp.responseXML
          break
        }
      }

      self._responseArgs.resp = resp
      self._fulfilled = true
      fn(resp)
      self._successHandler(resp)
      while (self._fulfillmentHandlers.length > 0) {
        resp = self._fulfillmentHandlers.shift()(resp)
      }

      complete(resp)
    }

    function error(resp, msg, t) {
      resp = self.request
      self._responseArgs.resp = resp
      self._responseArgs.msg = msg
      self._responseArgs.t = t
      self._erred = true
      while (self._errorHandlers.length > 0) {
        self._errorHandlers.shift()(resp, msg, t)
      }
      complete(resp)
    }

    this.request = getRequest.call(this, success, error)
  }

  Reqwest.prototype = {
    abort: function () {
      this._aborted = true
      this.request.abort()
    }

  , retry: function () {
      init.call(this, this.o, this.fn)
    }

    /**
     * Small deviation from the Promises A CommonJs specification
     * http://wiki.commonjs.org/wiki/Promises/A
     */

    /**
     * `then` will execute upon successful requests
     */
  , then: function (success, fail) {
      success = success || function () {}
      fail = fail || function () {}
      if (this._fulfilled) {
        this._responseArgs.resp = success(this._responseArgs.resp)
      } else if (this._erred) {
        fail(this._responseArgs.resp, this._responseArgs.msg, this._responseArgs.t)
      } else {
        this._fulfillmentHandlers.push(success)
        this._errorHandlers.push(fail)
      }
      return this
    }

    /**
     * `always` will execute whether the request succeeds or fails
     */
  , always: function (fn) {
      if (this._fulfilled || this._erred) {
        fn(this._responseArgs.resp)
      } else {
        this._completeHandlers.push(fn)
      }
      return this
    }

    /**
     * `fail` will execute when the request fails
     */
  , fail: function (fn) {
      if (this._erred) {
        fn(this._responseArgs.resp, this._responseArgs.msg, this._responseArgs.t)
      } else {
        this._errorHandlers.push(fn)
      }
      return this
    }
  }

  function reqwest(o, fn) {
    return new Reqwest(o, fn)
  }

  // normalize newline variants according to spec -> CRLF
  function normalize(s) {
    return s ? s.replace(/\r?\n/g, '\r\n') : ''
  }

  function serial(el, cb) {
    var n = el.name
      , t = el.tagName.toLowerCase()
      , optCb = function (o) {
          // IE gives value="" even where there is no value attribute
          // 'specified' ref: http://www.w3.org/TR/DOM-Level-3-Core/core.html#ID-862529273
          if (o && !o['disabled'])
            cb(n, normalize(o['attributes']['value'] && o['attributes']['value']['specified'] ? o['value'] : o['text']))
        }
      , ch, ra, val, i

    // don't serialize elements that are disabled or without a name
    if (el.disabled || !n) return

    switch (t) {
    case 'input':
      if (!/reset|button|image|file/i.test(el.type)) {
        ch = /checkbox/i.test(el.type)
        ra = /radio/i.test(el.type)
        val = el.value
        // WebKit gives us "" instead of "on" if a checkbox has no value, so correct it here
        ;(!(ch || ra) || el.checked) && cb(n, normalize(ch && val === '' ? 'on' : val))
      }
      break
    case 'textarea':
      cb(n, normalize(el.value))
      break
    case 'select':
      if (el.type.toLowerCase() === 'select-one') {
        optCb(el.selectedIndex >= 0 ? el.options[el.selectedIndex] : null)
      } else {
        for (i = 0; el.length && i < el.length; i++) {
          el.options[i].selected && optCb(el.options[i])
        }
      }
      break
    }
  }

  // collect up all form elements found from the passed argument elements all
  // the way down to child elements; pass a '<form>' or form fields.
  // called with 'this'=callback to use for serial() on each element
  function eachFormElement() {
    var cb = this
      , e, i
      , serializeSubtags = function (e, tags) {
          var i, j, fa
          for (i = 0; i < tags.length; i++) {
            fa = e[byTag](tags[i])
            for (j = 0; j < fa.length; j++) serial(fa[j], cb)
          }
        }

    for (i = 0; i < arguments.length; i++) {
      e = arguments[i]
      if (/input|select|textarea/i.test(e.tagName)) serial(e, cb)
      serializeSubtags(e, [ 'input', 'select', 'textarea' ])
    }
  }

  // standard query string style serialization
  function serializeQueryString() {
    return reqwest.toQueryString(reqwest.serializeArray.apply(null, arguments))
  }

  // { 'name': 'value', ... } style serialization
  function serializeHash() {
    var hash = {}
    eachFormElement.apply(function (name, value) {
      if (name in hash) {
        hash[name] && !isArray(hash[name]) && (hash[name] = [hash[name]])
        hash[name].push(value)
      } else hash[name] = value
    }, arguments)
    return hash
  }

  // [ { name: 'name', value: 'value' }, ... ] style serialization
  reqwest.serializeArray = function () {
    var arr = []
    eachFormElement.apply(function (name, value) {
      arr.push({name: name, value: value})
    }, arguments)
    return arr
  }

  reqwest.serialize = function () {
    if (arguments.length === 0) return ''
    var opt, fn
      , args = Array.prototype.slice.call(arguments, 0)

    opt = args.pop()
    opt && opt.nodeType && args.push(opt) && (opt = null)
    opt && (opt = opt.type)

    if (opt == 'map') fn = serializeHash
    else if (opt == 'array') fn = reqwest.serializeArray
    else fn = serializeQueryString

    return fn.apply(null, args)
  }

  reqwest.toQueryString = function (o, trad) {
    var prefix, i
      , traditional = trad || false
      , s = []
      , enc = encodeURIComponent
      , add = function (key, value) {
          // If value is a function, invoke it and return its value
          value = ('function' === typeof value) ? value() : (value == null ? '' : value)
          s[s.length] = enc(key) + '=' + enc(value)
        }
    // If an array was passed in, assume that it is an array of form elements.
    if (isArray(o)) {
      for (i = 0; o && i < o.length; i++) add(o[i]['name'], o[i]['value'])
    } else {
      // If traditional, encode the "old" way (the way 1.3.2 or older
      // did it), otherwise encode params recursively.
      for (prefix in o) {
        if (o.hasOwnProperty(prefix)) buildParams(prefix, o[prefix], traditional, add)
      }
    }

    // spaces should be + according to spec
    return s.join('&').replace(/%20/g, '+')
  }

  function buildParams(prefix, obj, traditional, add) {
    var name, i, v
      , rbracket = /\[\]$/

    if (isArray(obj)) {
      // Serialize array item.
      for (i = 0; obj && i < obj.length; i++) {
        v = obj[i]
        if (traditional || rbracket.test(prefix)) {
          // Treat each array item as a scalar.
          add(prefix, v)
        } else {
          buildParams(prefix + '[' + (typeof v === 'object' ? i : '') + ']', v, traditional, add)
        }
      }
    } else if (obj && obj.toString() === '[object Object]') {
      // Serialize object item.
      for (name in obj) {
        buildParams(prefix + '[' + name + ']', obj[name], traditional, add)
      }

    } else {
      // Serialize scalar item.
      add(prefix, obj)
    }
  }

  reqwest.getcallbackPrefix = function () {
    return callbackPrefix
  }

  // jQuery and Zepto compatibility, differences can be remapped here so you can call
  // .ajax.compat(options, callback)
  reqwest.compat = function (o, fn) {
    if (o) {
      o['type'] && (o['method'] = o['type']) && delete o['type']
      o['dataType'] && (o['type'] = o['dataType'])
      o['jsonpCallback'] && (o['jsonpCallbackName'] = o['jsonpCallback']) && delete o['jsonpCallback']
      o['jsonp'] && (o['jsonpCallback'] = o['jsonp'])
    }
    return new Reqwest(o, fn)
  }

  reqwest.ajaxSetup = function (options) {
    options = options || {}
    for (var k in options) {
      globalSetupOptions[k] = options[k]
    }
  }

  return reqwest
})();/**
* attempt of a simple defer/promise library for mobile development
* @author Jonathan Gotti < jgotti at jgotti dot net>
* @since 2012-10
* @version 0.6.0
* @changelog
*           - 2013-12-07 - last promise 1.1 specs test passings (thx to wizardwerdna)
 *                       - reduce promises footprint by unscoping methods that could be
*           - 2013-10-23 - make it workig across node-webkit contexts
*           - 2013-07-03 - bug correction in promixify method (thx to adrien gibrat )
*           - 2013-06-22 - bug correction in nodeCapsule method
*           - 2013-06-17 - remove unnecessary Array.indexOf method dependency
*           - 2013-04-18 - add try/catch block around nodeCapsuled methods
*           - 2013-04-13 - check promises/A+ conformity
*                        - make some minication optimisations
*           - 2013-03-26 - add resolved, fulfilled and rejected methods
*           - 2013-03-21 - browser/node compatible
*                        - new method nodeCapsule
*                        - simpler promixify with full api support
*           - 2013-01-25 - add rethrow method
*                        - nextTick optimisation -> add support for process.nextTick + MessageChannel where available
*           - 2012-12-28 - add apply method to promise
*           - 2012-12-20 - add alwaysAsync parameters and property for default setting
*/
;
var Promises = (function (undef) {
	"use strict";

	var nextTick
		, isFunc = function(f){ return ( typeof f === 'function' ); }
		, isArray = function(a){ return Array.isArray ? Array.isArray(a) : (a instanceof Array); }
		, isObjOrFunc = function(o){ return !!(o && (typeof o).match(/function|object/)); }
		, isNotVal = function(v){ return (v === false || v === undef || v === null); }
		, slice = function(a, offset){ return [].slice.call(a, offset); }
		, undefStr = 'undefined'
		, tErr = typeof TypeError === undefStr ? Error : TypeError
	;
	if ( (typeof process !== undefStr) && process.nextTick ) {
		nextTick = process.nextTick;
	} else if ( typeof MessageChannel !== undefStr ) {
		var ntickChannel = new MessageChannel(), queue = [];
		ntickChannel.port1.onmessage = function(){ queue.length && (queue.shift())(); };
		nextTick = function(cb){
			queue.push(cb);
			ntickChannel.port2.postMessage(0);
		};
	} else {
		nextTick = function(cb){ setTimeout(cb, 0); };
	}
	function rethrow(e){ nextTick(function(){ throw e;}); }

	/**
	 * @typedef deferred
	 * @property {promise} promise
	 * @method resolve
	 * @method fulfill
	 * @method reject
	 */

	/**
	 * @typedef {function} fulfilled
	 * @param {*} value promise resolved value
	 * @returns {*} next promise resolution value
	 */

	/**
	 * @typedef {function} failed
	 * @param {*} reason promise rejection reason
	 * @returns {*} next promise resolution value or rethrow the reason
	 */

	//-- defining unenclosed promise methods --//
	/**
	 * same as then without failed callback
	 * @param {fulfilled} fulfilled callback
	 * @returns {promise} a new promise
	 */
	function promise_success(fulfilled){ return this.then(fulfilled, undef); }

	/**
	 * same as then with only a failed callback
	 * @param {failed} failed callback
	 * @returns {promise} a new promise
	 */
	function promise_error(failed){ return this.then(undef, failed); }


	/**
	 * same as then but fulfilled callback will receive multiple parameters when promise is fulfilled with an Array
	 * @param {fulfilled} fulfilled callback
	 * @param {failed} failed callback
	 * @returns {promise} a new promise
	 */
	function promise_apply(fulfilled, failed){
		return this.then(
			function(a){
				return isFunc(fulfilled) ? fulfilled.apply(null, isArray(a) ? a : [a]) : (defer.onlyFuncs ? a : fulfilled);
			}
			, failed || undef
		);
	}

	/**
	 * cleanup method which will be always executed regardless fulfillment or rejection
	 * @param {function} cb a callback called regardless of the fulfillment or rejection of the promise which will be called
	 *                      when the promise is not pending anymore
	 * @returns {promise} the same promise untouched
	 */
	function promise_ensure(cb){
		function _cb(){ cb(); }
		this.then(_cb, _cb);
		return this;
	}

	/**
	 * take a single callback which wait for an error as first parameter. other resolution values are passed as with the apply/spread method
	 * @param {function} cb a callback called regardless of the fulfillment or rejection of the promise which will be called
	 *                      when the promise is not pending anymore with error as first parameter if any as in node style
	 *                      callback. Rest of parameters will be applied as with the apply method.
	 * @returns {promise} a new promise
	 */
	function promise_nodify(cb){
		return this.then(
			function(a){
				return isFunc(cb) ? cb.apply(null, isArray(a) ? a.splice(0,0,undefined) && a : [undefined,a]) : (defer.onlyFuncs ? a : cb);
			}
			, function(e){
				return cb(e);
			}
		);
	}

	/**
	 *
	 * @param {function} [failed] without parameter will only rethrow promise rejection reason outside of the promise library on next tick
	 *                            if passed a failed method then will call failed on rejection and throw the error again if failed didn't
	 * @returns {promise} a new promise
	 */
	function promise_rethrow(failed){
		return this.then(
			undef
			, failed ? function(e){ failed(e); throw e; } : rethrow
		);
	}

	/**
	* @param {boolean} [alwaysAsync] if set force the async resolution for this promise independantly of the D.alwaysAsync option
	* @returns {deferred} defered object with property 'promise' and methods reject,fulfill,resolve (fulfill being an alias for resolve)
	*/
	var defer = function (alwaysAsync){
		var alwaysAsyncFn = (undef !== alwaysAsync ? alwaysAsync : defer.alwaysAsync) ? nextTick : function(fn){fn();}
			, status = 0 // -1 failed | 1 fulfilled
			, pendings = []
			, value
			/**
			 * @typedef promise
			 */
			, _promise  = {
				/**
				 * @param {fulfilled|function} fulfilled callback
				 * @param {failed|function} failed callback
				 * @returns {promise} a new promise
				 */
				then: function(fulfilled, failed){
					var d = defer();
					pendings.push([
						function(value){
							try{
								if( isNotVal(fulfilled)){
									d.resolve(value);
								} else {
									d.resolve(isFunc(fulfilled) ? fulfilled(value) : (defer.onlyFuncs ? value : fulfilled));
								}
							}catch(e){
								d.reject(e);
							}
						}
						, function(err){
							if ( isNotVal(failed) || ((!isFunc(failed)) && defer.onlyFuncs) ) {
								d.reject(err);
							}
							if ( failed ) {
								try{ d.resolve(isFunc(failed) ? failed(err) : failed); }catch(e){ d.reject(e);}
							}
						}
					]);
					status !== 0 && alwaysAsyncFn(execCallbacks);
					return d.promise;
				}

				, success: promise_success

				, error: promise_error
				, otherwise: promise_error

				, apply: promise_apply
				, spread: promise_apply

				, ensure: promise_ensure

				, nodify: promise_nodify

				, rethrow: promise_rethrow

				, isPending: function(){ return !!(status === 0); }

				, getStatus: function(){ return status; }

				// jQuery.Deferred compatible methods (more to come if needed)
				, done: promise_success
				, fail: promise_error
				, always: promise_ensure
			}
		;
		_promise.toSource = _promise.toString = _promise.valueOf = function(){return value === undef ? this : value; };


		function execCallbacks(){
			if ( status === 0 ) {
				return;
			}
			var cbs = pendings, i = 0, l = cbs.length, cbIndex = ~status ? 0 : 1, cb;
			pendings = [];
			for( ; i < l; i++ ){
				(cb = cbs[i][cbIndex]) && cb(value);
			}
		}

		/**
		 * fulfill deferred with given value
		 * @param {*} val
		 * @returns {deferred} this for method chaining
		 */
		function _resolve(val){
			var done = false;
			function once(f){
				return function(x){
					if (done) {
						return undefined;
					} else {
						done = true;
						return f(x);
					}
				};
			}
			if ( status ) {
				return this;
			}
			try {
				var then = isObjOrFunc(val) && val.then;
				if ( isFunc(then) ) { // managing a promise
					if( val === _promise ){
						throw new tErr("Promise can't resolve itself");
					}
					then.call(val, once(_resolve), once(_reject));
					return this;
				}
			} catch (e) {
				once(_reject)(e);
				return this;
			}
			alwaysAsyncFn(function(){
				value = val;
				status = 1;
				execCallbacks();
			});
			return this;
		}

		/**
		 * reject deferred with given reason
		 * @param {*} Err
		 * @returns {deferred} this for method chaining
		 */
		function _reject(Err){
			status || alwaysAsyncFn(function(){
				try{ throw(Err); }catch(e){ value = e; }
				status = -1;
				execCallbacks();
			});
			return this;
		}
		return /**@type deferred */ {
			promise:_promise
			,resolve:_resolve
			,fulfill:_resolve // alias
			,reject:_reject
		};
	};

	defer.deferred = defer.defer = defer;
	defer.nextTick = nextTick;
	defer.alwaysAsync = true; // setting this will change default behaviour. use it only if necessary as asynchronicity will force some delay between your promise resolutions and is not always what you want.
	/**
	* setting onlyFuncs to false will break promises/A+ conformity by allowing you to pass non undefined/null values instead of callbacks
	* instead of just ignoring any non function parameters to then,success,error... it will accept non null|undefined values.
	* this will allow you shortcuts like promise.then('val','handled error'')
	* to be equivalent of promise.then(function(){ return 'val';},function(){ return 'handled error'})
	*/
	defer.onlyFuncs = true;

	/**
	 * return a fulfilled promise of given value (always async resolution)
	 * @param {*} value
	 * @returns {promise}
	 */
	defer.resolved = defer.fulfilled = function(value){ return defer(true).resolve(value).promise; };

	/**
	 * return a rejected promise with given reason of rejection (always async rejection)
	 * @param {*} reason
	 * @returns {promise}
	 */
	defer.rejected = function(reason){ return defer(true).reject(reason).promise; };

	/**
	 * return a promise with no resolution value which will be resolved in time ms (using setTimeout)
	 * @param {int} [time] in ms default to 0
	 * @returns {promise}
	 */
	defer.wait = function(time){
		var d = defer();
		setTimeout(d.resolve, time || 0);
		return d.promise;
	};

	/**
	 * return a promise for the return value of function call which will be fulfilled in delay ms or rejected if given fn throw an error
	 * @param {function} fn
	 * @param {int} [delay] in ms default to 0
	 * @returns {promise}
	 */
	defer.delay = function(fn, delay){
		var d = defer();
		setTimeout(function(){ try{ d.resolve(fn.apply(null)); }catch(e){ d.reject(e); } }, delay || 0);
		return d.promise;
	};

	/**
	 * if given value is not a promise return a fulfilled promise resolved to given value
	 * @param {*} promise a value or a promise
	 * @returns {promise}
	 */
	defer.promisify = function(promise){
		if ( promise && isFunc(promise.then) ) { return promise;}
		return defer.resolved(promise);
	};

	function multiPromiseResolver(callerArguments, returnPromises){
		var promises = slice(callerArguments);
		if ( promises.length === 1 && isArray(promises[0]) ) {
			if(! promises[0].length ){
				return defer.fulfilled([]);
			}
			promises = promises[0];
		}
		var args = []
			, d = defer()
			, c = promises.length
		;
		if ( !c ) {
			d.resolve(args);
		} else {
			var resolver = function(i){
				promises[i] = defer.promisify(promises[i]);
				promises[i].then(
					function(v){
						if (! (i in args) ) { //@todo check this is still required as promises can't be resolve more than once
							args[i] = returnPromises ? promises[i] : v;
							(--c) || d.resolve(args);
						}
					}
					, function(e){
						if(! (i in args) ){
							if( ! returnPromises ){
								d.reject(e);
							} else {
								args[i] = promises[i];
								(--c) || d.resolve(args);
							}
						}
					}
				);
			};
			for( var i = 0, l = c; i < l; i++ ){
				resolver(i);
			}
		}
		return d.promise;
	}

	/**
	 * return a promise for all given promises / values.
	 * the returned promises will be fulfilled with a list of resolved value.
	 * if any given promise is rejected then on the first rejection the returned promised will be rejected with the same reason
	 * @param {array|...*} [promise] can be a single array of promise/values as first parameter or a list of direct parameters promise/value
	 * @returns {promise} of a list of given promise resolution value
	 */
	defer.all = function(){ return multiPromiseResolver(arguments,false); };

	/**
	 * return an always fulfilled promise of array<promise> list of promises/values regardless they resolve fulfilled or rejected
	 * @param {array|...*} [promise] can be a single array of promise/values as first parameter or a list of direct parameters promise/value
	 *                     (non promise values will be promisified)
	 * @returns {promise} of the list of given promises
	 */
	defer.resolveAll = function(){ return multiPromiseResolver(arguments,true); };

	/**
	 * transform a typical nodejs async method awaiting a callback as last parameter, receiving error as first parameter to a function that
	 * will return a promise instead. the returned promise will resolve with normal callback value minus the first error parameter on
	 * fulfill and will be rejected with that error as reason in case of error.
	 * @param {object} [subject] optional subject of the method to encapsulate
	 * @param {function} fn the function to encapsulate if the normal callback should receive more than a single parameter (minus the error)
	 *                      the promise will resolve with the list or parameters as fulfillment value. If only one parameter is sent to the
	 *                      callback then it will be used as the resolution value.
	 * @returns {Function}
	 */
	defer.nodeCapsule = function(subject, fn){
		if ( !fn ) {
			fn = subject;
			subject = void(0);
		}
		return function(){
			var d = defer(), args = slice(arguments);
			args.push(function(err, res){
				err ? d.reject(err) : d.resolve(arguments.length > 2 ? slice(arguments, 1) : res);
			});
			try{
				fn.apply(subject, args);
			}catch(e){
				d.reject(e);
			}
			return d.promise;
		};
	};

	return { defer: defer };
})();
var Settings = (function () {
    'use strict';

    return {
        endpointPrefix: 'http://api.devmobilerider.com/api'
    };
})();
var Utils = (function () {
    'use strict';

    var nativeForEach = Array.prototype.forEach,
        nativeIsArray = Array.isArray,
        nativeSome = Array.prototype.some,
        toString = Object.prototype.toString,
        nativeMap = Array.prototype.map,
        isArray = nativeIsArray || function (array) {
            return toString.call(obj) == '[object Array]';
        },
        breaker = {},
        isObject = function (obj) {
            return obj === Object(obj);
        },
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
            if (obj === null || typeof obj == 'undefined') return;
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
        },
        identity = function(value) { return value; },
        any = function(obj, iterator, context) {
            iterator = iterator || identity;
            var result = false;
            if (obj === null) {
                return result;
            }
            if (nativeSome && obj.some === nativeSome) {
                return obj.some(iterator, context);
            }
            each(obj, function(value, index, list) {
                if (result || (result = iterator.call(context, value, index, list))) {
                    return breaker;
                }
            });
            return !!result;
        },
        map = function(obj, iterator, context) {
            var results = [];
            if (obj === null) {
                return results;
            }
            if (nativeMap && obj.map === nativeMap) {
                return obj.map(iterator, context);
            }
            each(obj, function(value, index, list) {
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
        map: map
    };
})();var Client = (function () {
    'use strict';

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

        if (params.url.indexOf(Settings.endpointPrefix) !== 0) {
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
                deferred.reject(errorResponse);
            }
        );
        return deferred.promise;
    };

    return Client;

})();var Query = (function () {
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
        if (typeof filters != 'undefined' && arrayLike && typeof filters == 'string') {
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
            } else if (typeof key == 'string') {
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

    Query.prototype.fetch = function () {
        var self = this,
            flattened = this.operator.flatten(),
            params;
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

            return self.resource.all(params);
        }

        var jsonQuery = { filters: flattened };
        if (this.fields.length) {
            jsonQuery.fields = Utils.slice(this.fields);
        }

        params = {
            __queryset__: JSON.stringify(jsonQuery),
            page: this._pageIndex,
            limit: this._pageSize
        };

        // Right now the API can order using one file only
        if (this.ordering && this.ordering.length) {
            params.sort = this.ordering[0].field;
            params.order = this.ordering[0].order;
        }

        return this.resource.all(params);
    };

    return Query;

})();var Resource = (function () {
    'use strict';

    var Resource = function (options) {
        options = options || {};
        this.client = options.client;

        if (!this.client) {
            if (!options.appId || !options.appSecret) {
                throw new Error('You must pass a `Client` instance or `appId` and `appSecret`.');
            }
            this.client = new Client({appId: options.appId, appSecret: options.appSecret});
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

    Resource.prototype.save = function (attributes) {
        // Returns a promise that when resolved it contains a Javascript object representing the object returned by the API

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
        return this.client.request({ url: this.getUrl(id), method: 'PUT', data: JSON.stringify(attributes) });
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

})();var ChannelResource = (function () {
    'use strict';

    var ChannelResource = function () {
        Resource.apply(this, arguments);
    };

    Utils.extend(ChannelResource.prototype, Resource.prototype, ChannelResource.prototype);

    ChannelResource.prototype.constructor = ChannelResource;

    ChannelResource.prototype.getUrl = function (id) {
        id = typeof id != 'undefined' ? this.validateId(id) : id;
        var url = Settings.endpointPrefix + '/channel';
        if (url[url.length - 1] != '/' && !!id) {
            url += ('/' + id);
        }
        return url;
    };

    return ChannelResource;

})();var MediaResource = (function () {
    'use strict';

    var MediaResource = function () {
        Resource.apply(this, arguments);
    };

    Utils.extend(MediaResource.prototype, Resource.prototype, MediaResource.prototype);

    MediaResource.prototype.constructor = MediaResource;

    MediaResource.prototype.getUrl = function (id) {
        id = typeof id != 'undefined' ? this.validateId(id) : id;
        var url = Settings.endpointPrefix + '/media';
        if (url[url.length - 1] != '/' && !!id) {
            url += ('/' + id);
        }
        return url;
    };

    return MediaResource;

})();
if (typeof define === 'function' && define.amd) {
    define('mobilerider-client', [], function () {
        return {
            Client: Client,
            Resource: Resource,
            Media: MediaResource,
            Channel: ChannelResource
        };
    });
} else {
    if (!exports.mobilerider) {
        exports.mobilerider = {};
    }
    exports.mobilerider.Client = Client;
    exports.mobilerider.Resource = Resource;
    exports.mobilerider.Media = MediaResource;
    exports.mobilerider.Channel = ChannelResource;
}

})(this);