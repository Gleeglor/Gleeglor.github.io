import { angleLerp, hsvToRgb, lerp } from "./math.js";

export class Renderer {
    /**
     * @param {import("./config.js").SimulationConfig} config
     * @param {import("./viewport.js").Viewport} viewport
     */
    constructor(config, viewport) {
        this.config = config;
        this.viewport = viewport;
        this.rainbowState = 0;

        /** @type {Path2D|null} */
        this._shape = null;
        this._shapeSize = NaN;
        this._halfW = 0;
        this._halfH = 0;
    }

    clear() {
        const { ctx, canvas } = this.viewport;
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    }

    /**
     * Build the boid triangle once at its real size; rebuild only when size changes.
     * @param {import("./config.js").SimulationConfig} config
     */
    #ensureShape(config) {
        if (this._shape != null && this._shapeSize === config.size) {
            return;
        }

        const halfW = config.shape.width * config.size / 2;
        const halfH = config.shape.height * config.size / 2;
        const path = new Path2D();
        path.moveTo(0, -halfH);
        path.lineTo(-halfW / 2, halfH);
        path.lineTo(0, halfH / 2);
        path.lineTo(halfW / 2, halfH);
        path.closePath();

        this._shape = path;
        this._shapeSize = config.size;
        this._halfW = halfW;
        this._halfH = halfH;
    }

    /**
     * @param {import("./flock.js").Flock} flock
     * @param {number} alpha interpolation 0..1 from previous toward current
     */
    render(flock, alpha) {
        const { ctx, canvas, scrollWorld } = this.viewport;
        const config = this.config;
        this.#ensureShape(config);

        const shape = this._shape;
        const halfW = this._halfW;
        const halfH = this._halfH;
        const scrollX = scrollWorld.x;
        const scrollY = scrollWorld.y;
        const canvasH = canvas.height;
        const canvasW = canvas.width;

        if (config.rainbowMode) {
            const { r, g, b } = hsvToRgb(this.rainbowState, 100, 100);
            ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
        } else {
            ctx.fillStyle = "#ffffff";
        }

        const boids = flock.boids;
        const count = Math.min(flock.activeCount, boids.length);

        for (let i = 0; i < count; i++) {
            const boid = boids[i];
            const x = lerp(boid.previousPosition.x, boid.position.x, alpha) - scrollX;
            const y = lerp(boid.previousPosition.y, boid.position.y, alpha) - scrollY;

            if (y < -halfH || y > canvasH + halfH || x < -halfW || x > canvasW + halfW) {
                continue;
            }

            const angleFrom = Math.atan2(boid.previousVelocity.y, boid.previousVelocity.x) + Math.PI / 2;
            const angleTo = Math.atan2(boid.velocity.y, boid.velocity.x) + Math.PI / 2;
            const angle = angleLerp(angleFrom, angleTo, alpha);
            const c = Math.cos(angle);
            const s = Math.sin(angle);

            ctx.setTransform(c, s, -s, c, x, y);
            ctx.fill(shape);
        }

        ctx.setTransform(1, 0, 0, 1, 0, 0);

        if (config.renderQuadTree && flock.quadTree) {
            ctx.lineWidth = 6;
            ctx.strokeStyle = "#ff0000";
            ctx.translate(-scrollX, -scrollY);
            flock.quadTree.render(ctx);
            ctx.setTransform(1, 0, 0, 1, 0, 0);
        }
    }

    /**
     * @param {number} seconds frame or leftover delta for hue cycling
     */
    advanceRainbow(seconds) {
        if (this.config.rainbowMode) {
            this.rainbowState = (this.rainbowState + seconds * 100) % 360;
        }
    }
}
