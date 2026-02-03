
const world = new World();

document.addEventListener("DOMContentLoaded", () => {
    const scrollListener = (event) => {
        if (Page.isBoidAreaVisible(event)) {
            world.start();
            window.removeEventListener("scroll", scrollListener);
        }
    }
    window.addEventListener("scroll", Page.scroll);


    const mouseMoveListener = (event) => {
        const location = Page.getMouseTarget(event);
        world.setBoidTargetLocation(location);
    }
    window.addEventListener("mousemove", mouseMoveListener);


    const mouseClickListener = (event) => {
        const click = event.buttons != 0

        world.setBoidFollowMouse(click);
    }
    window.addEventListener("mousedown", mouseClickListener);
    window.addEventListener("mouseup", mouseClickListener);


    const mouseTouchListener = () => {
        world.setBoidFollowTouchTimer(true, 2500);
    }
    window.addEventListener("touchend", mouseTouchListener);


    const resizeWindowListener = (event) => {
        Page.handle_resize(event);
    }
    window.addEventListener("resize", resizeWindowListener);


    const handleUpdatesPerSecondSlider = (event) => {
        const value = event.target.value;
        const indicatorElement = document.getElementById("indicator_updates_per_second");
        indicatorElement.innerHTML = `(${value})`;

        world.updatesPerSecond = value;
    }
    const updatesPerSecondSlider = document.getElementById("slider_updates_per_second");
    updatesPerSecondSlider.addEventListener("input", handleUpdatesPerSecondSlider);


    const handleBoidMaxSpeedSlider = (event) => {
        const value = event.target.value;
        const indicatorElement = document.getElementById("indicator_boid_max_speed");
        indicatorElement.innerHTML = `(${value})`;

        world.boidMaxSpeed = value;
    }
    const boidMaxSpeedSlider = document.getElementById("slider_boid_max_speed");
    boidMaxSpeedSlider.addEventListener("input", handleBoidMaxSpeedSlider);
    

    const handleBoidAccelerationSlider = (event) => {
        const value = event.target.value;
        const indicatorElement = document.getElementById("indicator_boid_acceleration");
        indicatorElement.innerHTML = `(${value})`;

        Boid.acceleration = value;
    }
    const boidAccelerationSlider = document.getElementById("slider_boid_acceleration");
    boidAccelerationSlider.addEventListener("input", handleBoidAccelerationSlider);


    const handleBoidCountSlider = (event) => {
        const value = event.target.value;
        const indicatorElement = document.getElementById("indicator_boid_count");
        indicatorElement.innerHTML = `(${value})`;


        while (world.activeBoidCount < value) {
            let boidBoxRect = Page.boids_box.getBoundingClientRect();

            const x = boidBoxRect.x + boidBoxRect.width / 2;
            const y = boidBoxRect.y + boidBoxRect.height / 2;

            if (Boid.list.length <= world.activeBoidCount) {
                Boid.create(
                    x + Page.scroll.x, 
                    y + Page.scroll.y, 
                    0,
                );
            } else {
                const currentBoid = Boid.list[world.activeBoidCount];
                const angle = Math.atan2(currentBoid.velocity.y, currentBoid.velocity.x) + Math.PI / 2;
                currentBoid.position = {
                    x: x + Math.sin(angle) * 10 + Page.scroll.x,
                    y: y + Math.cos(angle) * 10 + Page.scroll.y,
                };
            }

            world.activeBoidCount = world.activeBoidCount + 1;
        }

        if (world.activeBoidCount > value) {
            world.activeBoidCount = Math.floor(value);
        }
    }
    const boidCountSlider = document.getElementById("slider_boid_count");
    boidCountSlider.addEventListener("input", handleBoidCountSlider);

    const startButton = document.getElementById("start_simulation");
    startButton.addEventListener("click", () => {
        startButton.style.display = "none";
        Page.startedIntro = true;

        setTimeout(() => {
            const panel = document.getElementById("boids-settings-panel");
            panel.classList.toggle("settings-visible");

            setTimeout(() => {
                const release_panel = document.getElementById("release-settings-panel");
                release_panel.classList.toggle("settings-visible");
            }, 5000);
        }, 5000);

        requestAnimationFrame(intro);
    });

    const releaseButton = document.getElementById("release-the-boids");
    releaseButton.addEventListener("click", () => {
        Boid.released = !Boid.released;
        if (Boid.released) {
            releaseButton.innerHTML = "Contain the boids!";
        } else {
            releaseButton.innerHTML = "Release them again!";
        }
    })

    const showQuadtreeButton = document.getElementById("show-quad-tree");
    showQuadtreeButton.addEventListener("click", () => {
        World.render_quad_tree = !World.render_quad_tree;
        if (World.render_quad_tree) {
            showQuadtreeButton.innerHTML = "Hide quadtree";
        } else {
            showQuadtreeButton.innerHTML = "Show quadtree";
        }
    })


    let last_update = Date.now();
    let total_time_difference = 0;
    let updates_per_second = 20;
    function loop() {
        let now = Date.now();
        let time_difference = (now - last_update) / 1000;
        last_update = now;
        
        total_time_difference += time_difference;
        if (total_time_difference > 5) {
            total_time_difference = 1 / updates_per_second;
        }

        World.clear(Page.ctx);
        while (total_time_difference > 0) {
            total_time_difference -= 1 / updates_per_second;
            World.fixed_update();
        }
        
        World.update();
        World.render(Page.ctx, Math.abs(total_time_difference));
        
        requestAnimationFrame(loop);
    }

    let boid_count = 0;
    let intro_timer = 0;
    let speedup = 1;

    const boids_text_elements = [
        document.getElementById("boids-text-1"),
        document.getElementById("boids-text-2"),
        document.getElementById("boids-text-3"),
        document.getElementById("boids-text-4")
    ];
    
    function intro() {
        let boids_text_amount = boids_text_elements.length;
        Boid.active_boid_count = World.BOID_SETUP_COUNT;

        while (intro_timer > 0) {
            if (boid_count >= World.BOID_SETUP_COUNT) {
                break;
            }

            const angle = boid_count / World.BOID_SETUP_COUNT * Math.PI * 2 * 2;
            const offset = (boid_count / (World.BOID_SETUP_COUNT / 2) < 1 ? 55 : 150);
            let ab = Page.boids_box.getBoundingClientRect();

            Boid.create(
                ab.x + ab.width / 2 + Math.sin(angle) * offset, 
                ab.y + ab.height / 2 + Page.scroll.y + Math.cos(angle) * offset, 
                angle + Math.PI/2,
            );
            
            for (let i = 0; i < boids_text_amount; i++) {
                if (boid_count == Math.floor(World.BOID_SETUP_COUNT / 3) * i) {
                    boids_text_elements[i].style.display = "block";
                }
                if (boid_count == Math.floor(World.BOID_SETUP_COUNT / 3) * i) {
                    let idx = i - 1;
                    if (idx >= 0) { 
                        boids_text_elements[idx].style.display = "none";
                    }
                }
            }
            intro_timer -= 1;
            boid_count++;
        }
        
        intro_timer+= 1 + speedup;
        World.render(Page.ctx, 0);
        if (boid_count < World.BOID_SETUP_COUNT) {
            requestAnimationFrame(intro);
        } else {
            last_update = Date.now();
            setTimeout(() => {
                for (let i = 0; i < boids_text_amount; i++) {
                    boids_text_elements[i].style.display = "none";
                }
            }, 2000);
            requestAnimationFrame(loop);
        }
    }
});
