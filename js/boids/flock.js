import { Boid } from "./boid.js";
import { AABB, QuadTree } from "./spatial.js";
import { vectorSquareMagnitude } from "./math.js";

export class Flock {
    /**
     * @param {import("./config.js").SimulationConfig} config
     */
    constructor(config) {
        this.config = config;
        /** @type {Boid[]} */
        this.boids = [];
        this.activeCount = 0;
        /** @type {QuadTree|null} */
        this.quadTree = null;
        /** @type {WeakMap<Boid, Boid[]>|null} */
        this._neighborCache = null;
        this._neighborRadius = 0;
    }

    /** Clear per-step neighbor memoization (call once before applying forces). */
    beginStep() {
        this._neighborCache = new WeakMap();
        this._neighborRadius = 0;
    }

    create(x, y, angle) {
        const boid = new Boid(x, y, angle);
        this.boids.push(boid);
        return boid;
    }

    /**
     * Keep positions/velocities aligned when canvas world scale changes (zoom/DPR).
     * @param {number} scaleX
     * @param {number} scaleY
     */
    rescaleWorld(scaleX, scaleY) {
        for (let i = 0; i < this.boids.length; i++) {
            const boid = this.boids[i];
            boid.position.x *= scaleX;
            boid.position.y *= scaleY;
            boid.previousPosition.x *= scaleX;
            boid.previousPosition.y *= scaleY;
            boid.velocity.x *= scaleX;
            boid.velocity.y *= scaleY;
            boid.previousVelocity.x *= scaleX;
            boid.previousVelocity.y *= scaleY;
        }
    }

    get activeBoids() {
        return this.boids.slice(0, this.activeCount);
    }

    forEachActive(callback) {
        const count = Math.min(this.activeCount, this.boids.length);
        for (let i = 0; i < count; i++) {
            callback(this.boids[i], i);
        }
    }

    setActiveCount(count) {
        const target = Math.max(0, Math.min(Math.floor(count), this.config.maxBoids));
        this.activeCount = target;
    }

    /**
     * Grow or shrink the active pool. New boids spawn at random world points in the box.
     * @param {number} targetCount
     * @param {() => { x: number, y: number }} randomPoint
     */
    resizeActive(targetCount, randomPoint) {
        const target = Math.max(0, Math.min(Math.floor(targetCount), this.config.maxBoids));

        while (this.activeCount < target) {
            const point = randomPoint();
            const angle = Math.random() * Math.PI * 2;

            if (this.boids.length <= this.activeCount) {
                this.create(point.x, point.y, angle);
            } else {
                const current = this.boids[this.activeCount];
                current.position = { x: point.x, y: point.y };
                current.previousPosition = { x: point.x, y: point.y };
                current.velocity = {
                    x: Math.sin(angle),
                    y: Math.cos(angle),
                };
                current.previousVelocity = { ...current.velocity };
            }
            this.activeCount += 1;
        }

        if (this.activeCount > target) {
            this.activeCount = target;
        }
    }

    /**
     * Rebuild spatial index for current active positions.
     * @param {{ width: number, height: number }} worldBounds
     */
    rebuildSpatialIndex(worldBounds) {
        const half = Math.max(worldBounds.width, worldBounds.height);
        this.quadTree = new QuadTree(new AABB(
            { x: worldBounds.width, y: worldBounds.height },
            half
        ));

        const count = Math.min(this.activeCount, this.boids.length);
        for (let i = 0; i < count; i++) {
            this.quadTree.insert(this.boids[i]);
        }
    }

    /**
     * @param {Boid} current
     * @param {number} radius
     * @returns {Boid[]}
     */
    neighbors(current, radius) {
        if (this._neighborCache && this._neighborRadius === radius && this._neighborCache.has(current)) {
            return this._neighborCache.get(current);
        }

        const list = [];
        if (!this.quadTree) {
            return list;
        }

        const candidates = [];
        this.quadTree.queryRange(candidates, new AABB(current.position, radius));

        const radiusSq = radius * radius;
        for (let i = 0; i < candidates.length; i++) {
            const boid = candidates[i];
            if (current === boid) continue;
            if (vectorSquareMagnitude(current.position, boid.position) < radiusSq) {
                list.push(boid);
            }
        }

        if (this._neighborCache) {
            this._neighborRadius = radius;
            this._neighborCache.set(current, list);
        }
        return list;
    }
}
