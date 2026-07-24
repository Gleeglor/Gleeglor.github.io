export function vec(x = 0, y = 0) {
    return { x, y };
}

export function vectorSum(vectors) {
    const sum = vec();
    for (let i = 0; i < vectors.length; i++) {
        sum.x += vectors[i].x;
        sum.y += vectors[i].y;
    }
    return sum;
}

export function vectorAdd(a, b) {
    return vec(a.x + b.x, a.y + b.y);
}

export function vectorSubtract(a, b) {
    return vec(a.x - b.x, a.y - b.y);
}

export function vectorMultiply(v, scalar) {
    return vec(v.x * scalar, v.y * scalar);
}

export function vectorDivide(v, scalar) {
    return vec(v.x / scalar, v.y / scalar);
}

export function vectorNormalize(v) {
    const total = Math.hypot(v.x, v.y);
    if (total === 0) {
        return vec(0, 1);
    }
    return vec(v.x / total, v.y / total);
}

export function vectorDistance(a, b) {
    return Math.hypot(a.x - b.x, a.y - b.y);
}

export function vectorSquareMagnitude(a, b) {
    const dx = a.x - b.x;
    const dy = a.y - b.y;
    return dx * dx + dy * dy;
}

export function vectorMagnitude(v) {
    return Math.hypot(v.x, v.y);
}

export function lerp(from, to, t) {
    return from * (1 - t) + to * t;
}

export function angleLerp(from, to, t) {
    const diff = ((to - from + Math.PI * 3) % (Math.PI * 2)) - Math.PI;
    return from + diff * t;
}

export function hsvToRgb(h, s, v) {
    h = h % 360;
    s = s / 100;
    v = v / 100;

    const c = v * s;
    const x = c * (1 - Math.abs((h / 60) % 2 - 1));
    const m = v - c;

    let r = 0;
    let g = 0;
    let b = 0;
    const hueSector = Math.floor(h / 60);

    switch (hueSector) {
        case 0: r = c; g = x; b = 0; break;
        case 1: r = x; g = c; b = 0; break;
        case 2: r = 0; g = c; b = x; break;
        case 3: r = 0; g = x; b = c; break;
        case 4: r = x; g = 0; b = c; break;
        case 5: r = c; g = 0; b = x; break;
    }

    return {
        r: Math.round((r + m) * 255),
        g: Math.round((g + m) * 255),
        b: Math.round((b + m) * 255),
    };
}
