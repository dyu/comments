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

export const POST_ID = resolvePostId(window['comments_post_id']),
    MAX_DEPTH = range(window['comments_max_depth'], 0, 127, 7),
    COLLAPSE_DEPTH = range(window['comments_collapse_depth'], -1, 127, -1),
    CONTENT_LIMIT = range(window['comments_content_limit'], 0, 8192, 0),
    CONTENT_ERRMSG = 'The content is too long'

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

function addTo(parent, item) {
    item.parent = parent
    parent.children.push(item)
    inc(parent)
}

export function toTree(raw_items, items, parent, fromSubmit) {
    let start_depth = !parent ? 0 : 1 + parent['7'],
        last_item = !items.length ? null : items[items.length - 1],
        last_depth = !last_item ? start_depth : last_item['7'],
        item,
        depth
    
    for (var i = 0, len = raw_items.length; i < len; i++) {
        item = raw_items[i]
        depth = item['7']
        item.collapsed = !fromSubmit && COLLAPSE_DEPTH >= 0 && depth >= COLLAPSE_DEPTH
        item.parent = parent
        item.total_child_count = 0
        item.children = []
        if (start_depth === depth) {
            items.push(item)
            parent && inc(parent)
            last_item = item
            last_depth = depth
            continue
        }
        
        if (depth === last_depth) {
            addTo(last_item.parent, item)
            last_item = item
            continue
        }
        if (depth > last_depth) {
            addTo(last_item, item)
            last_item = item
            last_depth = depth
            continue
        }

        do {
            last_item = last_item.parent
        } while (depth < last_item['7'])

        addTo(last_item.parent, item)
        last_item = item
        last_depth = depth
    }

    return items
}
