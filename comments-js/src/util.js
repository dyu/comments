import showdown from 'showdown'

const MINUTE = 60
const HOUR = 60 * MINUTE
const DAY = 24 * HOUR

const converter = new showdown.Converter()
converter.setFlavor('github')

export const POST_ID = window['post_id']

export const context = {
    raw_items: [],
    items: []
}

function plural(num, unit) {
    num = ~~num;
    if (num !== 1) unit += 's';
    return `${num} ${unit}`;
}

export function toHTML(md) {
    return converter.makeHtml(md)
}

export function timebetween(a, b) {
    const elapsed = b - a;

    if (elapsed < MINUTE) {
        return plural(elapsed, 'second');
    } else if (elapsed < HOUR) {
        return plural(elapsed / MINUTE, 'minute');
    } else if (elapsed < DAY) {
        return plural(elapsed / HOUR, 'hour');
    } else {
        return plural(elapsed / DAY, 'day');
    }
}

export function append() {
    return Array.prototype.slice.call(arguments).join(' ').trim()
}

export function timeago(ts) {
    return timebetween(ts/1000, Date.now()/1000) + ' ago'
}

export function extractMsg(data) {
    //return Array.isArray(data) && data[1]['1'] || String(data)
    return Array.isArray(data) ? data[1]['1'] : String(data);
}

// ==================================================

export function toPayload(name, content, reply) {
    let items = !reply ? context.items : reply.children
    // lastSeenKey
    let prefix = !items.length ? '' : `"1":"${items[items.length - 1]['1']}",`
    // parentKey
    let suffix = !reply ? '' : `,"8":"${reply['1']}"`
    return `{${prefix}"4":"${name}","5":"${content}","6":${POST_ID}${suffix}}`
}

export function toTree(raw_items, items) {
    let last_item = !items.length ? null : items[items.length - 1],
        last_depth = !last_item ? 0 : last_item.depth,
        item,
        depth
    
    for (var i = 0, len = raw_items.length; i < len; i++) {
        item = raw_items[i]
        item.parent = null
        item.children = []
        if (!(depth = item['7'])) {
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

        while (depth !== last_item.parent.depth) {
            last_item = last_item.parent
        }

        (item.parent = last_item.parent).children.push(item)
        last_item = item
        last_depth = depth
    }

    return items
}