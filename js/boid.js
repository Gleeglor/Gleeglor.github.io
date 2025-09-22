
class Boid {
    static max_speed = 6;
    static list = [];
    static radius = 100;
    static separation_radius = Boid.radius / 1.3;
    static mouse = new Mouse();
    static follow_mouse = false;
    static tap_timeout = null;
    static shape = {width: 50, height: 50};
    static acceleration = 600;
    static released = false;
    static create(x, y, initial_angle, speed) {
        Boid.list.push(new Boid(x, y, initial_angle, speed));
    }
    

    static calculate_mouse_position(x, y) {
        const rect = Page.canvas.getBoundingClientRect();
        const scaleX = Page.canvas.width / rect.width;
        const scaleY = Page.canvas.height / rect.height;
        const downscale_factor = Page.get_downscale_factor();

        return {
            x: (x - rect.left) * scaleX,
            y: (y - rect.top) * scaleY + Page.scroll.y * 2 / downscale_factor
        };
    }

    static handle_phone_tap(event) {
        let x = 0;
        let y = 0;
        if (event.changedTouches && event.changedTouches.length > 0) {
            x = event.changedTouches[0].clientX;
            y = event.changedTouches[0].clientY;
        } else {
            return;
        }

        if (Boid.tap_timeout != null) {
            clearTimeout(Boid.tap_timeout);
        }

        Boid.follow_mouse = true;

        const click_position = Boid.calculate_mouse_position(x, y);
        
        Boid.mouse.x = click_position.x;
        Boid.mouse.y = click_position.y;

        Boid.tap_timeout = setTimeout(() => {
            Boid.follow_mouse = false;
        }, 2500);
    }

    static handle_mouse_move(event) {
        const mouse_position = Boid.calculate_mouse_position(event.clientX, event.clientY);

        Boid.mouse.x = mouse_position.x;
        Boid.mouse.y = mouse_position.y;
    }

    static handle_mouse_click(evt) {
        Boid.mouse.click = evt.buttons != 0

        if (!Boid.tap_timeout) {
            Boid.follow_mouse = Boid.mouse.click;
        }
    }

    
    previous_position = {
        x: 0,
        y: 0,
    };
    
    previous_velocity = {
        x: 0,
        y: 0,
    };
    
    position;
    
    total_velocity_sum = {
        x: 0,
        y: 0,
    }
    velocity;
    speed;

    constructor(x, y, angle, speed) {
        this.position = {x: x, y: y};
        this.previous_position = this.position;
        this.velocity = {x: Math.sin(angle), y: Math.cos(angle)};
        this.previous_velocity = {x: 0, y: 0};
    }

    loop_on_edge() {
        if (this.position.x > Page.canvas.width + Boid.shape.width) {
            this.previous_position.x = this.position.x;
        }
        this.position.x = ((this.position.x + Boid.shape.width / 2) % (Page.canvas.width + Boid.shape.width)) - Boid.shape.width / 2;
        if (this.position.x < -Boid.shape.width / 2) {
            this.position.x += Page.canvas.width + Boid.shape.width / 2;
            this.previous_position.x = this.position.x;
        }
        
        const downscale_factor = Page.get_downscale_factor();
        const document_height = document.body.getBoundingClientRect().height * 2 / downscale_factor;

        if (this.position.y > document_height + Boid.shape.height || this.position.y < -Boid.shape.height / 2) {
            this.previous_position.y = this.position.y;
        }
        this.position.y = (document_height + Boid.shape.height + this.position.y) % (document_height + Boid.shape.height);
        if (this.position.y < -Boid.shape.height / 2) {
            this.position.y += Page.canvas.height + Boid.shape.height / 2;
            this.previous_position.y = this.position.y;
        }

        // To prevent glitchy renders (interpolating between the other side of the screen to the current position)
    }

    noise() {
        return {x: Math.random() - 0.5, y: Math.random() - 0.5}
    }

    limit_velocity = (velocity) => {
        const magnitude = vector_distance(velocity, {x: 0, y: 0});
        
        if (magnitude > Boid.max_speed) {
            return vector_multiply(vector_normalize(velocity), Boid.max_speed);
        }
        
        return velocity;
    }

    wind() {
        return {x: 0.1, y: 0};
    }

    fixed_update(delta_time) {
        const nearby_boids = get_boids_in_area(this, Boid.radius);
        let sum_positions = {x: 0, y: 0};
        let cohesion_velocity = {x: 0, y: 0};
        let alignment_velocity = {x: 0, y: 0};
        let separation_velocity = {x: 0, y: 0};
        if (nearby_boids.length > 0) {
            for (let i = 0; i < nearby_boids.length; i++) {
                const boid = nearby_boids[i];
                const boid_distance = vector_distance(this.position, boid.position);
                if (boid_distance == 0) {
                    continue;
                }

                // Cohesion
                sum_positions = vector_sum([sum_positions, boid.position]);

                // Separation
                if (boid_distance < Boid.separation_radius) {
                    const position_difference = vector_subtract(this.position, boid.position);
                    const normalized_difference = vector_normalize(position_difference);
                    const weighted_difference = vector_divide(normalized_difference, boid_distance / 3);

                    separation_velocity = vector_sum([separation_velocity, weighted_difference])
                }

                // Alignment
                const normalized_velocity = vector_normalize(boid.velocity);
                const weighted_velocity = vector_divide(normalized_velocity, boid_distance);

                alignment_velocity = vector_sum([alignment_velocity, weighted_velocity])
            }

            // Cohesion
            const desired_position = vector_divide(sum_positions, nearby_boids.length);
            const desired_difference = vector_subtract(desired_position, this.position);

            cohesion_velocity = vector_multiply(vector_normalize(desired_difference), 0.05);
        }

        const contain_velocity = this.contain(1, 2);
        const super_containment_velocity = this.contain(10, 1.2);
        const mouse_velocity = this.follow_mouse();
        const noise = vector_multiply(this.noise(), 0.05);

        this.previous_position = {...this.position};
        this.previous_velocity = {...this.velocity};

        this.total_velocity_sum = vector_sum([this.total_velocity_sum, separation_velocity, cohesion_velocity, alignment_velocity, noise, mouse_velocity, contain_velocity, super_containment_velocity]);
        this.total_velocity_sum = vector_multiply(this.total_velocity_sum, Boid.acceleration / updates_per_second);

        this.velocity = vector_sum([this.velocity, this.total_velocity_sum]);
        this.total_velocity_sum = {
            x: 0,
            y: 0,
        }

        this.velocity = this.limit_velocity(this.velocity);
        this.position = vector_sum([this.position, this.velocity]);

        this.loop_on_edge();

    }

    update() {
    }

    contain(force, size) {
        if (Boid.released) {
            return {
                x: 0,
                y: 0,
            };
        }
        let ab = Page.boids_box.getBoundingClientRect();

        const box_area = {
            x: ab.x + ab.width / 2,
            y: ab.y + ab.height / 2 + Page.scroll.y,
            width: ab.width / size,
            height: ab.height / size,
        };

        let x = Math.max(Math.min(0, box_area.x - this.position.x + box_area.width / 2), box_area.x - this.position.x - box_area.width / 2);
        let y = Math.max(Math.min(0, box_area.y - this.position.y + box_area.height / 2), box_area.y - this.position.y - box_area.height / 2);

        const difference = vector_divide({
            x: x,
            y: y,
        }, 400 / force);

        return difference;
    }

    follow_mouse() {
        if (Boid.mouse == null) {
            return {x: 0, y: 0};
        }

        if (!Boid.follow_mouse) {
            return {x: 0, y: 0};
        }

        let goal = vector_subtract({x: Boid.mouse.x, y: Boid.mouse.y}, this.position);
        const magnitude = Math.abs(goal.x) + Math.abs(goal.y);

        goal = vector_divide(goal, 200);

        if (magnitude > 100) {
            return vector_multiply(vector_divide(goal, magnitude), 100);
        }
        return goal;
    }

    render(ctx, scroll, time_difference) {
        const x = Math.round(lerp(this.previous_position.x, this.position.x, -time_difference * updates_per_second));
        const y = Math.round(lerp(this.previous_position.y, this.position.y, -time_difference * updates_per_second));

        const downscale_factor = Page.get_downscale_factor();

        if (y - scroll.y * 2 / downscale_factor < 0) {
            return;
        }

        const scale = {w: Boid.shape.width / 2, h: Boid.shape.height / 2};
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        
        ctx.translate(x - Page.scroll.x * 2 / downscale_factor, y - Page.scroll.y * 2 / downscale_factor);

        const angle_from = Math.atan2(this.previous_velocity.y, this.previous_velocity.x);
        const angle_to = Math.atan2(this.velocity.y, this.velocity.x);
        
        ctx.rotate(angle_lerp(angle_to, angle_from, time_difference * updates_per_second ) + Math.PI / 2);

        ctx.moveTo(0, -scale.h);
        ctx.lineTo(-scale.w / 2, scale.h);
        ctx.lineTo(0, scale.h / 2);
        ctx.lineTo(scale.w / 2, scale.h);
    }
}

function get_boids_in_area(current_boid, radius) {
    const list = [];
    const boids = [];
    if (!World.quad_tree) {
        return list;
    }
    World.quad_tree.query_range(boids, new AABB(
        current_boid.position,
        radius,
        10
    ));
    
    
    for (let i = 0; i < boids.length; i++) {
        const boid = boids[i];
        if (current_boid === boid) {
            continue;
        }

        const boid_distance = vector_square_magnitude(current_boid.position, boid.position);
        if (boid_distance < radius * radius) {
            list.push(boid);
        }
    };
    
    return list;
}
