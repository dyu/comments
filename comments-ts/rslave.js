    function appendEl(tag, key, val) {
        var el = document.createElement(tag)
        el[key] = val
        document.body.appendChild(el)
        return el
    }
    var protocol = window.location.protocol,
        http = 0 === protocol.indexOf('http'),
        hostname = http ? window.location.hostname : '127.0.0.1',
        master_ip_port = window.master_ip_port,
        master_prefix = '//' + (master_ip_port || (hostname + ':5020')),
        slave_prefix = '//' + hostname + ':5020',
        rpc_config_d,
        uri_w_map
    
    window.rpc_host = http ? protocol : 'http:'
    window.rpc_config = {
        get$$: function(uri, opts) {
            if (!rpc_config_d) rpc_config_d = window['rpc_config_d']
            
            var prefix = uri_w_map[uri] ? master_prefix : slave_prefix
            return rpc_config_d.get$$(prefix + uri, opts)
        },
        post$$: function(uri, data) {
            if (!rpc_config_d) rpc_config_d = window['rpc_config_d']
            
            var prefix = uri_w_map[uri] ? master_prefix : slave_prefix
            return rpc_config_d.post$$(prefix + uri, data)
        }
    }
    window.comments_config = {
        //limit_depth: 10,
        //collapse_depth: 7,
        //content_limit: 2048,
        ui_flags: 5,
        //auth_host: 'https://api.dyuproject.com',
        //auth_flags: 0x77,
        ws_enabled: true,
        ws_reconnect_secs: 5,
        ws_host: 'ws:' + slave_prefix,
        post_id: 1
    }