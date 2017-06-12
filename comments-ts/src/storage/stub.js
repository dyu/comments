var map = {};
export function getItem(key) {
    return map[key];
}
export function setItem(key, value) {
    map[key] = value;
    return true;
}
export function removeItem(key) {
    var found = key in map;
    return found && delete map[key];
}
export function clear() {
    map = {};
    return true;
}
//# sourceMappingURL=stub.js.map