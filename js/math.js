
function angle_lerp(from, to, t) {
    const diff = ((to - from + Math.PI * 3) % (Math.PI * 2)) - Math.PI;
    return from + diff * t;
}

function lerp(from, to, translation_unit) {
    return from * (1 - translation_unit) + to * translation_unit;
}

function distance(x, y, x2, y2) {
    return Math.sqrt(Math.pow(x - x2, 2) + Math.pow(y - y2, 2));
}
