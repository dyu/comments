import 'whatwg-fetch';
export function checkStatus(res) {
    var status = res.status;
    if (status < 200 || status > 299)
        throw status;
    return res.text();
}
export function handler(raw) {
    var first = raw.charAt(0), len = raw.length, end = raw.charAt(len - 1) === '\n' ? len - 2 : len, data;
    if (first === '+') {
        data = JSON.parse(raw.substring(1, end));
        if (data[0])
            throw data;
        return data.length === 2 ? data[1] : data;
    }
    if (first !== '-')
        throw new Error('Malformed response.');
    if (raw.charAt(1) !== '[')
        throw new Error(raw.substring(1, end));
    throw JSON.parse(raw.substring(1, end));
}
var P = (function () {
    function P(url, opts, ih, ah) {
        this.url = url;
        this.opts = opts;
        this.ih = ih;
        this.ah = ah;
        this.handlers = [];
        this.cbFail = null;
        this.authOk = null;
    }
    P.prototype.then = function (resolve, reject) {
        if (this.cbFail) {
            console.warn('Cannot add a resolve/reject handler once a reject handler is provided.');
        }
        else if (resolve) {
            this.handlers.push(resolve);
        }
        else {
            this.handlers.push(reject);
            this.run();
        }
        return this;
    };
    P.prototype.catch = function (reject) {
        if (this.cbFail) {
            console.warn('Only one reject handler is allowed.');
        }
        else {
            this.handlers.push(reject);
            this.run();
        }
        return this;
    };
    P.prototype.run = function (token) {
        var url = this.url;
        if (token)
            url = url.substring(0, url.lastIndexOf('=') + 1) + token;
        var f = fetch(url, this.opts).then(this.ih).then(handler), array = this.handlers, last = array.length - 1, i = 0;
        while (i < last)
            f.then(array[i++]);
        f.then(undefined, this.cbFail || (this.cbFail = this.fail.bind(this)));
    };
    P.prototype.fail = function (err) {
        // check unauthorized
        if (!this.ah || (err !== 401 && (!Array.isArray(err) || err[0] !== 3)))
            this.handlers[this.handlers.length - 1](err);
        else
            this.ah(this.authOk || (this.authOk = this.run.bind(this)));
    };
    return P;
}());
export { P };
var config_default = {
    auth$$: undefined,
    get$$: get$$,
    post$$: post$$
};
window['rpc_config_d'] = config_default;
var config = window['rpc_config'] || config_default;
var prefix = window['rpc_host'] || '';
export function setPrefix(host) {
    prefix = host
}
export function setAuthHandler(handler) {
    config.auth$$ = handler;
}
export function $post(location, data, delegate, initialHandler) {
    var authHandler = config.auth$$, opts = {
        method: 'POST',
        body: data
    };
    return delegate || authHandler ?
        new P(location, opts, initialHandler || checkStatus, authHandler) :
        fetch(location, opts).then(initialHandler || checkStatus).then(handler);
}
function post$$(location, data, delegate, initialHandler) {
    return $post(!prefix ? location : prefix + location, data)
}
export function post(location, data) {
    return config.post$$(location, data);
}
export function $get(location, opts, delegate, initialHandler) {
    var authHandler = config.auth$$;
    return delegate || authHandler ?
        new P(location, opts, initialHandler || checkStatus, authHandler) :
        fetch(location, opts).then(initialHandler || checkStatus).then(handler);
}
function get$$(location, opts) {
    return $get(!prefix ? location : prefix + location, opts) 
}
export function get(location, opts) {
    return config.get$$(location, opts);
}
