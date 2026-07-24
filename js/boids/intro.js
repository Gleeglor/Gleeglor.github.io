export class IntroSequence {
    /**
     * @param {object} deps
     * @param {import("./config.js").SimulationConfig} deps.config
     * @param {import("./viewport.js").Viewport} deps.viewport
     * @param {import("./flock.js").Flock} deps.flock
     * @param {import("./simulation.js").Simulation} deps.simulation
     * @param {HTMLElement[]} deps.textElements
     */
    constructor({ config, viewport, flock, simulation, textElements }) {
        this.config = config;
        this.viewport = viewport;
        this.flock = flock;
        this.simulation = simulation;
        this.textElements = textElements;

        this.boidCount = 0;
        this.introTimer = 0;
        this.speedup = 1;
        this.onComplete = null;
    }

    /**
     * @param {() => void} [onComplete]
     */
    start(onComplete) {
        this.onComplete = onComplete ?? null;
        this.boidCount = 0;
        this.introTimer = 0;
        this.flock.setActiveCount(0);
        requestAnimationFrame(() => this.#frame());
    }

    #frame() {
        const setupCount = this.config.setupCount;
        const textAmount = this.textElements.length;

        while (this.introTimer > 0) {
            if (this.boidCount >= setupCount) {
                break;
            }

            const point = this.viewport.randomPointInBox();
            const angle = Math.random() * Math.PI * 2;

            this.flock.create(point.x, point.y, angle);
            this.flock.activeCount = this.flock.boids.length;

            for (let i = 0; i < textAmount; i++) {
                if (this.boidCount === Math.floor(setupCount / 3) * i) {
                    this.textElements[i].style.display = "block";
                    const idx = i - 1;
                    if (idx >= 0) {
                        this.textElements[idx].style.display = "none";
                    }
                }
            }

            this.introTimer -= 1;
            this.boidCount += 1;
        }

        this.introTimer += 1 + this.speedup;
        this.simulation.renderFrame(1);

        if (this.boidCount < setupCount) {
            requestAnimationFrame(() => this.#frame());
        } else {
            setTimeout(() => {
                for (let i = 0; i < textAmount; i++) {
                    this.textElements[i].style.display = "none";
                }
            }, 2000);

            if (this.onComplete) {
                this.onComplete();
            }
            this.simulation.start();
        }
    }
}
