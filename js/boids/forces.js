import {
    vec,
    vectorDivide,
    vectorMultiply,
    vectorNormalize,
    vectorSubtract,
    vectorDistance,
    vectorSum,
} from "./math.js";

/**
 * @typedef {object} ForceContext
 * @property {import("./flock.js").Flock} flock
 * @property {import("./config.js").SimulationConfig} config
 * @property {import("./input.js").InputController} [input]
 * @property {import("./viewport.js").Viewport} [viewport]
 */

/** @typedef {{ apply(boid: import("./boid.js").Boid, ctx: ForceContext): {x: number, y: number} }} ForceStrategy */

export class SeparationForce {
    /**
     * @param {import("./config.js").SimulationConfig} config
     */
    constructor(config) {
        this.config = config;
    }

    apply(boid, ctx) {
        const nearby = ctx.flock.neighbors(boid, this.config.radius * this.config.size);
        let separation = vec();

        for (let i = 0; i < nearby.length; i++) {
            const other = nearby[i];
            const dist = vectorDistance(boid.position, other.position);
            if (dist === 0) continue;

            if (dist < this.config.separationRadius * this.config.size) {
                const diff = vectorSubtract(boid.position, other.position);
                const weighted = vectorDivide(vectorNormalize(diff), dist / 3);
                separation = vectorSum([separation, weighted]);
            }
        }

        return separation;
    }
}

export class AlignmentForce {
    /**
     * @param {import("./config.js").SimulationConfig} config
     */
    constructor(config) {
        this.config = config;
    }

    apply(boid, ctx) {
        const nearby = ctx.flock.neighbors(boid, this.config.radius * this.config.size);
        let alignment = vec();

        for (let i = 0; i < nearby.length; i++) {
            const other = nearby[i];
            const dist = vectorDistance(boid.position, other.position);
            if (dist === 0) continue;

            const weighted = vectorDivide(vectorNormalize(other.velocity), dist);
            alignment = vectorSum([alignment, weighted]);
        }

        return alignment;
    }
}

export class CohesionForce {
    /**
     * @param {import("./config.js").SimulationConfig} config
     */
    constructor(config) {
        this.config = config;
    }

    apply(boid, ctx) {
        const nearby = ctx.flock.neighbors(boid, this.config.radius * this.config.size);
        if (nearby.length === 0) {
            return vec();
        }

        let sumPositions = vec();
        for (let i = 0; i < nearby.length; i++) {
            const other = nearby[i];
            const dist = vectorDistance(boid.position, other.position);
            if (dist === 0) continue;
            sumPositions = vectorSum([sumPositions, other.position]);
        }

        const desired = vectorDivide(sumPositions, nearby.length);
        const desiredDiff = vectorSubtract(desired, boid.position);
        return vectorMultiply(vectorNormalize(desiredDiff), 0.05);
    }
}

export class NoiseForce {
    apply() {
        return vectorMultiply(vec(Math.random() - 0.5, Math.random() - 0.5), 0.05);
    }
}

export class MouseAttractForce {
    /**
     * @param {import("./config.js").SimulationConfig} config
     * @param {import("./input.js").InputController} input
     */
    constructor(config, input) {
        this.config = config;
        this.input = input;
    }

    apply(boid) {
        if (!this.input.followMouse) {
            return vec();
        }

        let goal = vectorSubtract(this.input.position, boid.position);
        const magnitude = Math.abs(goal.x) + Math.abs(goal.y);
        goal = vectorDivide(goal, 200);

        if (magnitude > 100) {
            return vectorMultiply(vectorDivide(goal, magnitude), 100);
        }
        return goal;
    }
}

export class ContainmentForce {
    /**
     * Soft box constraint applied twice at different strengths (matches original).
     * @param {import("./config.js").SimulationConfig} config
     * @param {import("./viewport.js").Viewport} viewport
     */
    constructor(config, viewport) {
        this.config = config;
        this.viewport = viewport;
    }

    apply(boid) {
        if (this.config.released) {
            return vec();
        }

        const a = this.#contain(boid, 1, 2);
        const b = this.#contain(boid, 10, 1.2);
        return vec(a.x + b.x, a.y + b.y);
    }

    #contain(boid, force, size) {
        const box = this.viewport.cachedBox;
        const halfW = box.width / (2 * size);
        const halfH = box.height / (2 * size);
        const cx = box.centerX;
        const cy = box.centerY;
        const px = boid.position.x;
        const py = boid.position.y;

        const x = Math.max(Math.min(0, cx - px + halfW), cx - px - halfW);
        const y = Math.max(Math.min(0, cy - py + halfH), cy - py - halfH);
        const inv = force / 400;
        return vec(x * inv, y * inv);
    }
}

/**
 * Separation + alignment + cohesion in one neighbor pass (same math as the
 * individual force classes; used on the hot path for performance).
 */
export class ReynoldsForce {
    /**
     * @param {import("./config.js").SimulationConfig} config
     */
    constructor(config) {
        this.config = config;
    }

    apply(boid, ctx) {
        const nearby = ctx.flock.neighbors(boid, this.config.radius * this.config.size);
        let sumX = 0;
        let sumY = 0;
        let sepX = 0;
        let sepY = 0;
        let aliX = 0;
        let aliY = 0;
        let counted = 0;

        const sepRadius = this.config.separationRadius * this.config.size;

        for (let i = 0; i < nearby.length; i++) {
            const other = nearby[i];
            const dx = boid.position.x - other.position.x;
            const dy = boid.position.y - other.position.y;
            const dist = Math.hypot(dx, dy);
            if (dist === 0) continue;

            counted += 1;
            sumX += other.position.x;
            sumY += other.position.y;

            if (dist < sepRadius) {
                const inv = 3 / (dist * dist);
                sepX += dx * inv;
                sepY += dy * inv;
                // equivalent to normalize(diff) / (dist/3) = diff/dist / (dist/3) = 3*diff/dist^2
            }

            const speed = Math.hypot(other.velocity.x, other.velocity.y) || 1;
            aliX += other.velocity.x / (speed * dist);
            aliY += other.velocity.y / (speed * dist);
        }

        let cohX = 0;
        let cohY = 0;
        if (counted > 0) {
            const desiredX = sumX / nearby.length - boid.position.x;
            const desiredY = sumY / nearby.length - boid.position.y;
            const desiredLen = Math.hypot(desiredX, desiredY) || 1;
            cohX = desiredX / desiredLen * 0.05;
            cohY = desiredY / desiredLen * 0.05;
        }

        return vec(sepX + cohX + aliX, sepY + cohY + aliY);
    }
}
