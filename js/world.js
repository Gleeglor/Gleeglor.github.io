
// Game logic
class World {
    static quad_tree;
    static BOID_SETUP_COUNT = 125;
    static render_quad_tree = false;

    static fixed_update() {
        for (let i = 0; i < Boid.list.length; i++) {
            if (i >= Boid.active_boid_count) {
                break;
            }
            
            const boid = Boid.list[i];
            boid.fixed_update();
        };
    }

    static update() {
        for (let i = 0; i < Boid.list.length; i++) {
            if (i >= Boid.active_boid_count) {
                break;
            }

            const boid = Boid.list[i];
            boid.update();
        };

        const rect = document.body.getBoundingClientRect();

        World.quad_tree = new QuadTree(new AABB(
            {x: rect.width, y: rect.height},
            Math.max(rect.width, rect.height)
        ))

        for (let i = 0; i < Boid.list.length; i++) {
            if (i >= Boid.active_boid_count) {
                break;
            }

            const boid = Boid.list[i];
            World.quad_tree.insert(boid);
        };
    }

    static clear(ctx) {
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.clearRect(0, 0, Page.canvas.width, Page.canvas.height);
    }

    static render(ctx, time_difference) {
        ctx.beginPath();
        
        for (let i = 0; i < Boid.list.length; i++) {
            if (i >= Boid.active_boid_count) {
                break;
            }
            
            const boid = Boid.list[i];
            boid.render(ctx, Page.scroll, time_difference);
        };
        ctx.fillStyle = 'white';
        ctx.fill();

        const downscale_factor = Page.get_downscale_factor();

        if (World.render_quad_tree && World.quad_tree) {
            ctx.lineWidth = "6";
            ctx.strokeStyle = "red";
            ctx.setTransform(1, 0, 0, 1, 0, 0);

            ctx.translate(-Page.scroll.x * 2 / downscale_factor, -Page.scroll.y * 2 / downscale_factor);
            // const ghost = {
            //     x: Boid.mouse.x,
            //     y: Boid.mouse.y,
            //     width: 25,
            //     height: 25,
            // };
            // ctx.fillRect(ghost.x - ghost.width / 2, ghost.y - ghost.height / 2, ghost.width, ghost.height);
            World.quad_tree.render(ctx);
        }
        ctx.setTransform(1, 0, 0, 1, 0, 0);
    }

    static setup() {
        // for(let i = 0; i < World.BOID_SETUP_COUNT; i++) {
        // }
    }

    static handle_scroll() {
        // World.render(Page.ctx);
    }
}
