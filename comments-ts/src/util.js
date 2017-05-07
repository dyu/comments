import showdown from 'showdown'
import dompurify from 'dompurify'
import { escape } from './escape'

const MINUTE = 60
const HOUR = 60 * MINUTE
const DAY = 24 * HOUR

const converter = new showdown.Converter()
converter.setFlavor('github')

export function range(val, min, max, def) {
    return typeof val !== 'number' ? def : Math.max(min, Math.min(val, max))
}

export const POST_ID = window['comments_post_id'],
    MAX_DEPTH = range(window['comments_max_depth'], 0, 127, 7)

export const context = {
    raw_items: [],
    items: [],
    root$: null,
    reply$: null
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

export function sanitize(str) {
    return dompurify.sanitize(str)
}

export function toHTML(md) {
    return sanitize(converter.makeHtml(md))
}

export function timebetween(a, b, suffix) {
    const elapsed = b - a;

    if (elapsed === 0) {
        return 'just now'
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

export function plus_minus(collapsed, items) {
    return !collapsed ? '-' : ('+' + items.length)
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

export function toTree(raw_items, items, parent) {
    let start_depth = !parent ? 0 : 1 + parent['7'],
        last_item = !items.length ? null : items[items.length - 1],
        last_depth = !last_item ? start_depth : last_item['7'],
        item,
        depth
    
    for (var i = 0, len = raw_items.length; i < len; i++) {
        item = raw_items[i]
        item.collapsed = false
        item.parent = parent
        item.children = []
        if (start_depth === (depth = item['7'])) {
            items.push(item)
            last_item = item
            last_depth = depth
            continue
        }
        
        if (depth === last_depth) {
            (item.parent = last_item.parent).children.push(item)
            last_item = item
            continue
        }
        if (depth > last_depth) {
            (item.parent = last_item).children.push(item)
            last_item = item
            last_depth = depth
            continue
        }

        do {
            last_item = last_item.parent
        } while (depth < last_item['7'])

        (item.parent = last_item.parent).children.push(item)
        last_item = item
        last_depth = depth
    }

    return items
}
