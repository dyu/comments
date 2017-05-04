import showdown from 'showdown'

const UA = window.navigator.userAgent.toLowerCase(), // browser sniffing from vuejs
    isIE9 = UA && UA.indexOf('msie 9.0') > 0,
    hasClassList = 'classList' in document.documentElement, 
    createEvent = document['createEvent'], 
    createEventObject = document['createEventObject']

const MINUTE = 60
const HOUR = 60 * MINUTE
const DAY = 24 * HOUR

const converter = new showdown.Converter()
converter.setFlavor('github')

export const POST_ID = window['post_id']

export const context = {
    raw_items: [],
    items: [],
    root: null,
    reply_target: null
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

export function toHTML(md) {
    return converter.makeHtml(md)
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

export function toTree(raw_items, items, parent) {
    let start_depth = !parent ? 0 : 1 + parent['7'],
        last_item = !items.length ? null : items[items.length - 1],
        last_depth = !last_item ? start_depth : last_item['7'],
        item,
        depth
    
    for (var i = 0, len = raw_items.length; i < len; i++) {
        item = raw_items[i]
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

        while (depth !== last_item.parent['7']) {
            last_item = last_item.parent
        }

        (item.parent = last_item.parent).children.push(item)
        last_item = item
        last_depth = depth
    }

    return items
}

// ==================================================
// popup

export function hasClass(el, cls) {
    if (hasClassList)
        return el.classList.contains(cls);
    var str = ' ' + el.className + ' ';
    return str.indexOf(' ' + cls + ' ') !== -1;
}

export function addClass(el, cls) {
    if (el.classList) {
        el.classList.add(cls);
    }
    else {
        var cur = ' ' + getClass(el) + ' ';
        if (cur.indexOf(' ' + cls + ' ') < 0) {
            setClass(el, (cur + cls).trim());
        }
    }
}

export function removeClass(el, cls) {
    var removed;
    if (hasClassList) {
        var classList = el.classList, len = classList.length;
        classList.remove(cls);
        removed = len > classList.length;
        if (removed && len === 1)
            el.removeAttribute('class');
    }
    else {
        var cur = ' ' + el.className + ' ', tar = ' ' + cls + ' ';
        removed = false;
        while (cur.indexOf(tar) >= 0) {
            cur = cur.replace(tar, ' ');
            removed = true;
        }
        if (removed)
            setClass(el, cur.trim());
    }
    return removed;
}

export function getAbsoluteLeft(el) {
    var left = 0, curr = el;
    // This intentionally excludes body which has a null offsetParent.    
    while (curr.offsetParent) {
        left -= curr.scrollLeft;
        curr = curr.parentNode;
    }
    while (el) {
        left += el.offsetLeft;
        el = el.offsetParent;
    }
    return left;
}

export function getAbsoluteTop(el) {
    var top = 0, curr = el;
    // This intentionally excludes body which has a null offsetParent.    
    while (curr.offsetParent) {
        top -= curr.scrollTop;
        curr = curr.parentNode;
    }
    while (el) {
        top += el.offsetTop;
        el = el.offsetParent;
    }
    return top;
}

var popup_;
export function getPopup() {
    return popup_ || (popup_ = document.getElementById('comments-popup'));
}
/**
 * Returns true if the popup is visible.
 */
export function visiblePopup(popup) {
    return hasClass(popup, 'active');
}
export function hidePopup(popup) {
    return removeClass(popup, 'active');
}
export function showPopup(popup, contentEl, positionEl) {
    var style = popup.style;
    style.visibility = 'hidden';
    popup.replaceChild(contentEl, popup.firstChild);
    addClass(popup, 'active');
    positionTo(positionEl, popup);
    style.visibility = 'visible';
}

export function positionTo(relativeTarget, popup) {
    // Calculate left position for the popup. The computation for
    // the left position is bidi-sensitive.
    var offsetWidth = popup.offsetWidth || 0, offsetHeight = popup.offsetHeight || 0, textBoxOffsetWidth = relativeTarget.offsetWidth || 0, 
    // Compute the difference between the popup's width and the
    // textbox's width
    offsetWidthDiff = offsetWidth - textBoxOffsetWidth, left = getAbsoluteLeft(relativeTarget);
    /*if (LocaleInfo.getCurrentLocale().isRTL()) { // RTL case

        var textBoxAbsoluteLeft = relativeTarget.getAbsoluteLeft();

        // Right-align the popup. Note that this computation is
        // valid in the case where offsetWidthDiff is negative.
        left = textBoxAbsoluteLeft - offsetWidthDiff;

        // If the suggestion popup is not as wide as the text box, always
        // align to the right edge of the text box. Otherwise, figure out whether
        // to right-align or left-align the popup.
        if (offsetWidthDiff > 0) {

        // Make sure scrolling is taken into account, since
        // box.getAbsoluteLeft() takes scrolling into account.
        var windowRight = Window.getClientWidth() + Window.getScrollLeft();
        var windowLeft = Window.getScrollLeft();

        // Compute the left value for the right edge of the textbox
        var textBoxLeftValForRightEdge = textBoxAbsoluteLeft
            + textBoxOffsetWidth;

        // Distance from the right edge of the text box to the right edge
        // of the window
        var distanceToWindowRight = windowRight - textBoxLeftValForRightEdge;

        // Distance from the right edge of the text box to the left edge of the
        // window
        var distanceFromWindowLeft = textBoxLeftValForRightEdge - windowLeft;

        // If there is not enough space for the overflow of the popup's
        // width to the right of the text box and there IS enough space for the
        // overflow to the right of the text box, then left-align the popup.
        // However, if there is not enough space on either side, stick with
        // right-alignment.
        if (distanceFromWindowLeft < offsetWidth
            && distanceToWindowRight >= offsetWidthDiff) {
            // Align with the left edge of the text box.
            left = textBoxAbsoluteLeft;
        }
        }
    } else { // LTR case*/
    // Left-align the popup.
    // TODO this was moved to variable initialization
    //left = relativeTarget.getAbsoluteLeft();
    // If the suggestion popup is not as wide as the text box, always align to
    // the left edge of the text box. Otherwise, figure out whether to
    // left-align or right-align the popup.
    if (offsetWidthDiff > 0) {
        // Make sure scrolling is taken into account, since
        // box.getAbsoluteLeft() takes scrolling into account.
        var windowLeft = document['scrollLeft'] || 0, windowRight = windowLeft + (document['clientWidth'] || 0), 
        // Distance from the left edge of the text box to the right edge
        // of the window
        distanceToWindowRight = windowRight - left, 
        // Distance from the left edge of the text box to the left edge of the
        // window
        distanceFromWindowLeft = left - windowLeft;
        // If there is not enough space for the overflow of the popup's
        // width to the right of hte text box, and there IS enough space for the
        // overflow to the left of the text box, then right-align the popup.
        // However, if there is not enough space on either side, then stick with
        // left-alignment.
        if (distanceToWindowRight < offsetWidth && distanceFromWindowLeft >= offsetWidthDiff) {
            // Align with the right edge of the text box.
            left -= offsetWidthDiff;
        }
    }
    //}
    // Calculate top position for the popup
    var top = getAbsoluteTop(relativeTarget), 
    // Make sure scrolling is taken into account, since
    // box.getAbsoluteTop() takes scrolling into account.
    windowTop = document.documentElement.scrollTop || 0, windowBottom = windowTop + document.documentElement.clientHeight, 
    // Distance from the top edge of the window to the top edge of the
    // text box
    distanceFromWindowTop = top - windowTop, 
    // Distance from the bottom edge of the window to the bottom edge of
    // the text box
    rtOffsetHeight = relativeTarget.offsetHeight || 0, distanceToWindowBottom = windowBottom - (top + rtOffsetHeight);
    // If there is not enough space for the popup's height below the text
    // box and there IS enough space for the popup's height above the text
    // box, then then position the popup above the text box. However, if there
    // is not enough space on either side, then stick with displaying the
    // popup below the text box.
    if (distanceToWindowBottom < offsetHeight && distanceFromWindowTop >= offsetHeight) {
        top -= offsetHeight;
    }
    else {
        // Position above the text box
        top += rtOffsetHeight;
    }
    popup.style.left = left + 'px';
    popup.style.top = top + 'px';
}
export function popTo(relativeTarget, popup) {
    popup.style.visibility = 'hidden';
    positionTo(relativeTarget, popup);
    popup.style.visibility = 'visible';
}

