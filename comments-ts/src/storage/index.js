// ported from https://github.com/bevacqua/local-storage
import * as stub from './stub';
export { on, off } from './tracking';
var ls = window.localStorage || stub;
/*function accessor (key, value) {
  if (arguments.length === 1) {
    return get(key);
  }
  return set(key, value);
}*/
export function get(key) {
    var val = ls.getItem(key);
    return val == null ? null : JSON.parse(val);
}
export function set(key, value) {
    try {
        ls.setItem(key, JSON.stringify(value));
        return true;
    }
    catch (e) {
        return false;
    }
}
export function remove(key) {
    return ls.removeItem(key);
}
export function clear() {
    return ls.clear();
}
//# sourceMappingURL=index.js.map