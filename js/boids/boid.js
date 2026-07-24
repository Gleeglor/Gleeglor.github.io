import {
    vec,
    vectorAdd,
    vectorMagnitude,
    vectorMultiply,
    vectorNormalize,
} from "./math.js";

export class Boid {
    constructor(x, y, angle) {
        this.position = vec(x, y);
        this.previousPosition = vec(x, y);
        this.velocity = vec(Math.sin(angle), Math.cos(angle));
        this.previousVelocity = vec(0, 0);
        this.force = vec(0, 0);
    }

    clearForce() {
        this.force.x = 0;
        this.force.y = 0;
    }

    addForce(force) {
        this.force.x += force.x;
        this.force.y += force.y;
    }

    integrate(config) {
        const dt = config.stepDt;
        this.previousVelocity = { ...this.velocity };

        // Acceleration is wall-clock independent: Δv per second ≈ force * acceleration
        const scaled = vectorMultiply(this.force, config.acceleration * dt);
        this.velocity = vectorAdd(this.velocity, scaled);
        this.velocity = limitVelocity(this.velocity, config.maxSpeed);

        this.previousPosition = { ...this.position };
        // Velocity is calibrated as displacement-per-tick at referenceUpdatesPerSecond.
        // Scale by referenceUps * dt so 20 UPS and 60 UPS cover the same distance/sec.
        const stepScale = config.referenceUpdatesPerSecond * dt;
        this.position = vectorAdd(this.position, vectorMultiply(this.velocity, stepScale));
    }

    wrap(viewport, config) {
        const halfW = config.shape.width * config.size / 2;
        const shapeW = config.shape.width * config.size;
        const shapeH = config.shape.height * config.size;
        const canvasWidth = viewport.worldWidth;
        const documentHeight = viewport.documentHeight;

        const beforeX = this.position.x;
        const beforeY = this.position.y;

        this.position.x = ((this.position.x + halfW) % (canvasWidth + shapeW)) - halfW;
        if (this.position.x < -halfW) {
            this.position.x += canvasWidth + halfW;
        }

        this.position.y = (documentHeight + shapeH + this.position.y) % (documentHeight + shapeH);

        // Teleport = large jump; ignore tiny float noise from modulo.
        // Only then snap previous so we don't lerp across the seam.
        const dx = this.position.x - beforeX;
        const dy = this.position.y - beforeY;
        if (dx * dx + dy * dy > 1) {
            this.previousPosition = { ...this.position };
            this.previousVelocity = { ...this.velocity };
        }
    }
}

function limitVelocity(velocity, maxSpeed) {
    const magnitude = vectorMagnitude(velocity);
    if (magnitude > maxSpeed) {
        return vectorMultiply(vectorNormalize(velocity), maxSpeed);
    }
    return velocity;
}
