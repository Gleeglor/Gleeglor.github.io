export class UiController {
    /**
     * @param {object} deps
     * @param {import("./config.js").SimulationConfig} deps.config
     * @param {import("./flock.js").Flock} deps.flock
     * @param {import("./viewport.js").Viewport} deps.viewport
     * @param {import("./intro.js").IntroSequence} deps.intro
     */
    constructor({ config, flock, viewport, intro }) {
        this.config = config;
        this.flock = flock;
        this.viewport = viewport;
        this.intro = intro;
        this.startedIntro = false;
    }

    bind() {
        this.#bindSlider("slider_updates_per_second", "indicator_updates_per_second", (value) => {
            this.config.updatesPerSecond = value;
        });

        this.#bindSlider("slider_boid_max_speed", "indicator_boid_max_speed", (value) => {
            this.config.maxSpeed = value;
        });

        this.#bindSlider("slider_boid_acceleration", "indicator_boid_acceleration", (value) => {
            this.config.acceleration = value;
        });

        this.#bindSlider("slider_boid_size", "indicator_boid_size", (value) => {
            this.config.size = value;
        });

        document.getElementById("slider_boid_count").addEventListener("input", (evt) => {
            const value = Number(evt.target.value);
            document.getElementById("indicator_boid_count").innerHTML = `(${value})`;

            this.viewport.refreshCachedBox();
            this.flock.resizeActive(value, () => this.viewport.randomPointInBox());
        });

        document.getElementById("rainbow").addEventListener("click", () => {
            this.config.rainbowMode = !this.config.rainbowMode;
        });

        const startButton = document.getElementById("start_simulation");
        startButton.addEventListener("click", () => {
            startButton.style.display = "none";
            this.startedIntro = true;

            setTimeout(() => {
                document.getElementById("boids-settings-panel")
                    .classList.toggle("settings-visible");

                setTimeout(() => {
                    document.getElementById("release-settings-panel")
                        .classList.toggle("settings-visible");
                }, 5000);
            }, 5000);

            this.intro.start();
        });

        const releaseButton = document.getElementById("release-the-boids");
        releaseButton.addEventListener("click", () => {
            this.config.released = !this.config.released;
            releaseButton.innerHTML = this.config.released
                ? "Contain the boids!"
                : "Release them again!";
        });

        const quadTreeButton = document.getElementById("show-quad-tree");
        quadTreeButton.addEventListener("click", () => {
            this.config.renderQuadTree = !this.config.renderQuadTree;
            quadTreeButton.innerHTML = this.config.renderQuadTree
                ? "Hide quadtree"
                : "Show quadtree";
        });
    }

    #bindSlider(sliderId, indicatorId, onChange) {
        document.getElementById(sliderId).addEventListener("input", (evt) => {
            const value = Number(evt.target.value);
            onChange(value);
            document.getElementById(indicatorId).innerHTML = `(${value})`;
        });
    }
}
