export class SimulationConfig {
    constructor(defaults = {}) {
        this.maxSpeed = defaults.maxSpeed ?? 6;
        this.acceleration = defaults.acceleration ?? 600;
        this.size = defaults.size ?? 1;
        this.radius = defaults.radius ?? 100;
        this.separationRadius = defaults.separationRadius ?? this.radius / 1.3;
        this.updatesPerSecond = defaults.updatesPerSecond ?? 20;
        // Velocity is in legacy per-tick units calibrated at this rate so
        // changing updatesPerSecond only changes fidelity, not wall-clock speed.
        this.referenceUpdatesPerSecond = defaults.referenceUpdatesPerSecond ?? 20;
        this.setupCount = defaults.setupCount ?? 125;
        this.maxBoids = defaults.maxBoids ?? 1200;
        this.shape = defaults.shape ?? { width: 50, height: 50 };
        this.released = defaults.released ?? false;
        this.rainbowMode = defaults.rainbowMode ?? false;
        this.renderQuadTree = defaults.renderQuadTree ?? false;
        this.maxCatchUpSteps = defaults.maxCatchUpSteps ?? 5;
    }

    get stepDt() {
        return 1 / this.updatesPerSecond;
    }
}
