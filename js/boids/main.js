import { SimulationConfig } from "./config.js";
import { Viewport } from "./viewport.js";
import { InputController } from "./input.js";
import { Flock } from "./flock.js";
import {
    ReynoldsForce,
    NoiseForce,
    MouseAttractForce,
    ContainmentForce,
} from "./forces.js";
import { Renderer } from "./renderer.js";
import { Simulation } from "./simulation.js";
import { IntroSequence } from "./intro.js";
import { UiController } from "./ui.js";

function boot() {
    const canvas = document.getElementById("boids-canvas");
    const boidsBox = document.getElementById("boids-box");
    if (!canvas || !boidsBox) {
        console.error("Boids: missing #boids-canvas or #boids-box");
        return;
    }

    const config = new SimulationConfig({
        maxSpeed: 6,
        acceleration: 600,
        size: 1,
        updatesPerSecond: 20,
        setupCount: 125,
    });

    const viewport = new Viewport(canvas, boidsBox);
    viewport.setup();

    const input = new InputController(viewport);
    input.attach();

    const flock = new Flock(config);
    viewport.worldScaleListener = (sx, sy) => flock.rescaleWorld(sx, sy);
    viewport.attachWindowListeners();

    // ReynoldsForce = one neighbor pass (Separation/Alignment/Cohesion still exist for extension)
    const forces = [
        new ReynoldsForce(config),
        new NoiseForce(),
        new MouseAttractForce(config, input),
        new ContainmentForce(config, viewport),
    ];

    const renderer = new Renderer(config, viewport);
    const simulation = new Simulation({
        config,
        viewport,
        flock,
        forces,
        renderer,
        input,
    });

    const intro = new IntroSequence({
        config,
        viewport,
        flock,
        simulation,
        textElements: [
            document.getElementById("boids-text-1"),
            document.getElementById("boids-text-2"),
            document.getElementById("boids-text-3"),
            document.getElementById("boids-text-4"),
        ],
    });

    const ui = new UiController({ config, flock, viewport, intro });
    ui.bind();
}

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
} else {
    boot();
}
