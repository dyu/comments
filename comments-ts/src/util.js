import showdown from 'showdown'
import dompurify from 'dompurify'
import hash from 'string-hash'
import ColorHash from 'color-hash'
import { escape } from './escape'

const COLOR_HASH = new ColorHash()

const MINUTE = 60
const HOUR = 60 * MINUTE
const DAY = 24 * HOUR

const converter = new showdown.Converter()
converter.setFlavor('github')

export function range(val, min, max, def) {
    return typeof val !== 'number' ? def : Math.max(min, Math.min(val, max))
}

function resolvePostId(id) {
    if (typeof id !== 'number' || id < 1)
        id = hash(window.location.hostname + window.location.pathname)
    
    return id
}

function resolveWsHost(rpc_host) {
    return !rpc_host ? ('ws' + window.location.protocol.substring(4) + '//' + window.location.host) :
            ('ws' + rpc_host.substring(4))
}

function createCompatConfig(target, src) {
    var rpc_host = src['rpc_host'],
        auth_host = src['auth_host'],
        limit_depth = src['comments_max_depth'],
        collapse_depth = src['comments_collapse_depth']
    
    if (rpc_host) target.rpc_host = rpc_host
    if (auth_host) target.auth_host = auth_host
    if (limit_depth) target.limit_depth = limit_depth
    if (collapse_depth) target.collapse_depth = collapse_depth
    
    return target
}

export const CONFIG = window['comments_config'] || createCompatConfig({}, window),
    POST_ID = resolvePostId(CONFIG['post_id']),
    UI_FLAGS = range(CONFIG['ui_flags'], 0, 15, 0),
    WITH_WS = !!CONFIG['ws_enabled'],
    WS_HOST = !WITH_WS ? '' : (CONFIG['ws_host'] || resolveWsHost(CONFIG['rpc_host'])),
    WS_RECONNECT_SECS = !WITH_WS ? 0 : range(CONFIG['ws_reconnect_secs'], 1, 60*60, 10),
    AUTH_HOST = CONFIG['auth_host'],
    WITH_AUTH = !!AUTH_HOST,
    AUTH_PROXY = !WITH_AUTH ? '' : (CONFIG['auth_proxy'] || (AUTH_HOST + '/iframe/')),
    AUTH_GOOGLE = 1,
    AUTH_GITHUB = 2,
    AUTH_GITLAB = 4,
    AUTH_FLAGS = range(CONFIG['auth_flags'], 1, 0xFF, 0x07),
    AUTH_OPEN_WINDOW = 0 !== (AUTH_FLAGS & 0x80),
    LIMIT_DEPTH = range(CONFIG['limit_depth'], 0, 127, 7),
    COLLAPSE_DEPTH = range(CONFIG['collapse_depth'], -1, 127, -1),
    CONTENT_LIMIT = range(CONFIG['content_limit'], 0, 8192, 0),
    CONTENT_ERRMSG = 'The content is too long',
    NAME_ERRMSG = 'Name cannot be more than 64 characters'

export const context = {
    raw_items: [],
    items: [],
    root$: null,
    reply$: null,
    refresh$: null
}

function plural(num, unit, suffix) {
    num = ~~num
    var buf = ''
    buf += num
    buf += ' '
    buf += unit
    if (num !== 1)
        buf += 's'
    if (suffix)
        buf += suffix
    
    return buf
}

export function pluralize(num, str, suffix, with_num) {
    var buf = ''
    if (with_num)
        buf += num
    buf += str
    if (num > 1)
        buf += (suffix || 's')
    return buf
}

export function delayEventHandler(obj, key, timeout) {
    return function (e) {
        window.setTimeout(function () { obj[key](e) }, timeout)
    }
}

export function sanitize(str) {
    return dompurify.sanitize(str)
}

export function toHexColor(str) {
    return COLOR_HASH.hex(str)
}

export function toHTML(md) {
    return sanitize(converter.makeHtml(md))
}

export function timebetween(a, b, suffix) {
    const elapsed = b - a;

    if (elapsed === 0) {
        return 'just moments' + suffix
    } else if (elapsed < MINUTE) {
        return plural(elapsed, 'second', suffix);
    } else if (elapsed < HOUR) {
        return plural(elapsed / MINUTE, 'minute', suffix);
    } else if (elapsed < DAY) {
        return plural(elapsed / HOUR, 'hour', suffix);
    } else {
        return plural(elapsed / DAY, 'day', suffix);
    }
}

export function append() {
    return Array.prototype.slice.call(arguments).join(' ').trim()
}

export function timeago(ts) {
    return timebetween(Math.floor(ts/1000), Math.floor(Date.now()/1000), ' ago')
}

export function plus_minus(collapsed, count) {
    if (!collapsed)
        return '-'
    else if (!count)
        return '+'
    else
        return '+' + count
}

export function extractMsg(data) {
    //return Array.isArray(data) && data[1]['1'] || String(data)
    return Array.isArray(data) ? data[1]['1'] : String(data);
}

// ==================================================

export function toFetchPayload(items, parent) {
    let suffix = !items || !items.length ? '' : `,"2":"${items[items.length - 1]['1']}"`
    if (!parent)
        return `{"1":${POST_ID}${suffix}}`

    return `{"1":${POST_ID}${suffix},"3":"${parent['1']}"}`
}

export function toPayload(name, content, reply) {
    let items = !reply ? context.items : reply.children
    // lastSeenKey
    let prefix = !items.length ? '' : `"1":"${items[items.length - 1]['1']}",`
    // parentKey
    let suffix = !reply ? '' : `,"8":"${reply['1']}"`
    return `{${prefix}"4":"${escape(name)}","5":"${escape(content)}","6":${POST_ID}${suffix}}`
}

function inc(parent) {
    do {
        parent.total_child_count++
        parent = parent.parent
    } while (parent)
}

function fillItem(item, parent, fromSubmit) {
    item.collapsed = !fromSubmit && COLLAPSE_DEPTH >= 0 && item['7'] >= COLLAPSE_DEPTH
    item.parent = parent
    item.total_child_count = 0
    item.children = []
    item.map = {}
}

function addTo(parent, item, fromSubmit) {
    var key = item['1'],
        existing = parent.map[key]
    if (existing)
        return existing

    fillItem(item, parent, fromSubmit)
    item.parent = parent
    parent.children.push(item)
    parent.map[key] = item
    inc(parent)
    
    return existing
}

export function toTree(raw_items, items, m, parent, fromSubmit) {
    let map = !parent ? m.root_map : parent.map,
        start_depth = !parent ? 0 : 1 + parent['7'],
        last_item = !items.length ? null : items[items.length - 1],
        last_depth = !last_item ? start_depth : last_item['7'],
        count = 0,
        item,
        depth,
        key
    
    for (var i = 0, len = raw_items.length; i < len; i++) {
        item = raw_items[i]
        depth = item['7']
        if (start_depth === depth) {
            key = item['1']
            last_depth = depth
            if ((last_item = map[key])) continue
            last_item = item
            count++
            fillItem(item, parent, fromSubmit)
            items.push(item)
            map[key] = item
            parent && inc(parent)
            continue
        }
        
        if (depth === last_depth) {
            if (!(last_item = addTo(last_item.parent, item, fromSubmit))) {
                last_item = item
                count++
            }
            continue
        }
        if (depth > last_depth) {
            last_depth = depth
            if (!(last_item = addTo(last_item, item, fromSubmit))) {
                last_item = item
                count++
            }
            continue
        }

        do {
            last_item = last_item.parent
        } while (depth < last_item['7'])

        last_depth = depth
        if (!(last_item = addTo(last_item.parent, item, fromSubmit))) {
            last_item = item
            count++
        }
    }

    m.total_count += count

    return items
}

const href = window.location.href,
    fnEvent = window.addEventListener || window.attachEvent,
    keyEvent = !window.addEventListener ? 'onmessage' : 'message',
    alphanumeric = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'

export function randomText(len) {
    var text = ''
    for(var i = 0; i < len; i++)
        text += alphanumeric.charAt(Math.floor(Math.random() * alphanumeric.length))

    return text
}

function openWindow(path) {
    var w = window.open(path, 'Login', 'width=450,height=500,location=1,status=1,resizable=yes')
    w && w.moveTo(window.innerWidth/2 - (450/2), window.innerHeight/2 - (500/2))
}

var pmpage, pmid, iframe
export function popAuth(type) {
    pmid = randomText(10)
    if (AUTH_OPEN_WINDOW) {
        openWindow(AUTH_PROXY + '#' + pmid + '~' + type + '~' + AUTH_HOST + '~' + href)
        return
    }

    if (!iframe) {
        iframe = document.createElement('iframe')
        iframe.style.width = '100%'
        iframe.style.border = 'none'
        document.body.appendChild(iframe)
    }
    // always load
    pmpage = pmpage ? '' : type + '.html'

    iframe.src = AUTH_PROXY + pmpage + '#' + pmid + '~' + type + '~' + href
}

function onAuth(e) {
    var msg = e.data,
        array = typeof msg === 'string' ? JSON.parse(msg) : msg
    if (!Array.isArray(array) || array.length !== 3 || array[2] !== pmid) return
    
    var type = array[0], data = array[1]
    if (!type || !data || !data.es_token) {
        context.root$.auth$$F(data || 'Auth failed.')
    } else {
        context.root$.auth$$S(data)
    }
}

fnEvent(keyEvent, onAuth, false)
