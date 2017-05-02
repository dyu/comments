const MINUTE = 60;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

export const POST_ID = window['post_id']

export const context = {
    raw_items: []
}

function plural(num, unit) {
    num = ~~num;
    if (num !== 1) unit += 's';
    return `${num} ${unit}`;
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

export function append(a, b) {
    return a + b
}

export function timeago(ts) {
    return timebetween(ts/1000, Date.now()/1000) + ' ago'
}

export function extractMsg(data) {
    //return Array.isArray(data) && data[1]['1'] || String(data)
    return Array.isArray(data) ? data[1]['1'] : String(data);
}