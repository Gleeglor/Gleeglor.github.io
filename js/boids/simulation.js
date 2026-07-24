export class Simulation {
    /**
     * @param {object} deps
     * @param {import("./config.js").SimulationConfig} deps.config
     * @param {import("./viewport.js").Viewport} deps.viewport
     * @param {import("./flock.js").Flock} deps.flock
     * @param {{ apply(boid: import("./boid.js").Boid, ctx: object): {x:number,y:number} }[]} deps.forces
     * @param {import("./renderer.js").Renderer} deps.renderer
     * @param {import("./input.js").InputController} deps.input
     */
    constructor({ config, viewport, flock, forces, renderer, input }) {
        this.config = config;
        this.viewport = viewport;
        this.flock = flock;
        this.forces = forces;
        this.renderer = renderer;
        this.input = input;

        this.accumulator = 0;
        this.lastUpdate = 0;
        this.running = false;
        this._raf = null;

        this._forceCtx = {
            flock,
            config,
            input,
            viewport,
        };
    }

    start() {
        if (this.running) return;
        this.running = true;
        this.lastUpdate = performance.now();
        this.accumulator = 0;
        this._raf = requestAnimationFrame((t) => this.#loop(t));
    }

    stop() {
        this.running = false;
        if (this._raf != null) {
            cancelAnimationFrame(this._raf);
            this._raf = null;
        }
    }

    /** Single physics step: spatial index → forces → integrate → wrap */
    step() {
        // Box is refreshed on scroll/resize only; world-space bounds stay valid while scrolling.
        this.#rebuildSpatialIndex();
        this.flock.beginStep();

        const forces = this.forces;
        const forceCount = forces.length;
        const ctx = this._forceCtx;
        const config = this.config;
        const viewport = this.viewport;
        const boids = this.flock.boids;
        const count = Math.min(this.flock.activeCount, boids.length);

        for (let i = 0; i < count; i++) {
            const boid = boids[i];
            boid.clearForce();
            for (let f = 0; f < forceCount; f++) {
                boid.addForce(forces[f].apply(boid, ctx));
            }
            boid.integrate(config);
            boid.wrap(viewport, config);
        }
    }

    /**
     * @param {number} [alpha=1]
     */
    renderFrame(alpha = 1) {
        this.renderer.clear();
        this.renderer.render(this.flock, alpha);
    }

    #rebuildSpatialIndex() {
        // Use cached world extents — avoid getBoundingClientRect in the hot path.
        const w = Math.max(this.viewport.worldWidth, this.viewport.documentHeight, 1);
        this.flock.rebuildSpatialIndex({
            width: w,
            height: w,
        });
    }

    #loop(now) {
        if (!this.running) return;

        let frameDt = (now - this.lastUpdate) / 1000;
        this.lastUpdate = now;

        if (frameDt > 0.25) {
            frameDt = 0.25;
        }

        this.accumulator += frameDt;

        const stepDt = this.config.stepDt;
        let steps = 0;

        while (this.accumulator >= stepDt && steps < this.config.maxCatchUpSteps) {
            this.accumulator -= stepDt;
            this.step();
            steps += 1;
        }

        if (this.accumulator >= stepDt) {
            this.accumulator %= stepDt;
        }

        const alpha = stepDt > 0 ? this.accumulator / stepDt : 0;

        if (this.config.renderQuadTree) {
            this.#rebuildSpatialIndex();
        }

        this.renderer.clear();
        this.renderer.advanceRainbow(frameDt);
        this.renderer.render(this.flock, alpha);

        this._raf = requestAnimationFrame((t) => this.#loop(t));
    }
}
