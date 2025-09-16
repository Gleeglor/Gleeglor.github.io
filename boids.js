// class Boid {
//     static max_speed = 5;
//     static list = [];
//     static radius = 100;
//     static separation_radius = Boid.radius / 1.3;
//     static create(x, y, speed) {
//         Boid.list.push(new Boid(x, y, speed));
//     }

//     static shape;
//     static bitmap;
//     static setup() {
//         Boid.shape = document.createElement('canvas');
//         Boid.shape.width = 50;
//         Boid.shape.height = 50;
//         const shape_ctx = Boid.shape.getContext('2d');
//         const scale = {w: Boid.shape.width / 2, h: Boid.shape.height / 2};

//         shape_ctx.fillStyle = 'white';
//         shape_ctx.beginPath();
//         shape_ctx.translate(scale.w, scale.h);
//         shape_ctx.moveTo(0, -scale.h);
//         shape_ctx.lineTo(-scale.w / 2, scale.h);
//         shape_ctx.lineTo(0, scale.h / 2);
//         shape_ctx.lineTo(scale.w / 2, scale.h);

//         shape_ctx.fill();
//         shape_ctx.closePath();

//         createImageBitmap(Boid.shape).then((bitmap) => {
//             Boid.bitmap = bitmap;
//         });
//     }

//     static positions = new Float32Array();

//     position;
//     velocity;
//     speed;

//     constructor(x, y, speed) {
//         this.position = {x: x, y: y};
//         this.velocity = {x: 0, y: 0};
//         this.speed = speed;
//     }

//     loop_on_edge() {
//         this.position.x = (Page.canvas.width + this.position.x) % Page.canvas.width;

//         const document_height = document.body.getBoundingClientRect().height * 2;
//         this.position.y = (document_height + this.position.y) % document_height;
//     }

//     noise() {
//         return {x: Math.random() - 0.5, y: Math.random() - 0.5}
//     }

//     limit_velocity = (velocity) => {
//         const magnitude = vector_distance(velocity, {x: 0, y: 0});
        
//         if (magnitude > Boid.max_speed) {
//             return vector_multiply(vector_normalize(velocity), Boid.max_speed);
//         }
        
//         return velocity;
//     }

//     wind() {
//         return {x: 0.1, y: 0};
//     }

//     update() {
//         const nearby_boids = get_boids_in_area(this, Boid.radius);
//         let sum_positions = {x: 0, y: 0};
//         let cohesion_velocity = {x: 0, y: 0};
//         let alignment_velocity = {x: 0, y: 0};
//         let separation_velocity = {x: 0, y: 0};
//         if (nearby_boids.length > 0) {
//             for (let i = 0; i < nearby_boids.length; i++) {
//                 const boid = nearby_boids[i];
//                 const boid_distance = vector_distance(this.position, boid.position);
//                 if (boid_distance == 0) {
//                     continue;
//                 }

//                 // Cohesion
//                 sum_positions = vector_sum([sum_positions, boid.position]);

//                 // Separation
//                 if (boid_distance < Boid.separation_radius) {
//                     const position_difference = vector_subtract(this.position, boid.position);
//                     const normalized_difference = vector_normalize(position_difference);
//                     const weighted_difference = vector_divide(normalized_difference, boid_distance / 3);

//                     separation_velocity = vector_sum([separation_velocity, weighted_difference])
//                 }

//                 // Alignment
//                 const normalized_velocity = vector_normalize(boid.velocity);
//                 const weighted_velocity = vector_divide(normalized_velocity, boid_distance);

//                 alignment_velocity = vector_sum([alignment_velocity, weighted_velocity])
//             }

//             // Cohesion
//             const desired_position = vector_divide(sum_positions, nearby_boids.length);
//             const desired_difference = vector_subtract(desired_position, this.position);

//             cohesion_velocity = vector_multiply(vector_normalize(desired_difference), 0.05);
//         }

//         const mouse_velocity = this.follow_mouse();
//         const noise = vector_multiply(this.noise(), 0.05);

//         this.velocity = vector_sum([this.velocity, separation_velocity, cohesion_velocity, alignment_velocity, noise, mouse_velocity]);
//         this.velocity = this.limit_velocity(this.velocity);
        
//         this.position = vector_sum([this.position, this.velocity]);

//         this.loop_on_edge();
//     }

//     follow_mouse(mouse) {
//         if (!mouse.click) {
//             return {x: 0, y: 0};
//         }

//         let goal = vector_subtract({x: mouse.x * 2 , y: mouse.y * 2}, this.position);
//         const magnitude = Math.abs(goal.x) + Math.abs(goal.y);

//         goal = vector_divide(goal, 200);

//         if (magnitude > 100) {
//             return vector_multiply(vector_divide(goal, magnitude), 100);
//         }
//         return goal;
//     }

//     render(ctx) {
//         const x = this.position.x;
//         const y = this.position.y;
//         if (y - scroll.y * 2 < 0) {
//             return;
//         }

//         ctx.save();
//         ctx.translate(x, y);
//         ctx.rotate(Math.atan2(this.velocity.y, this.velocity.x) + Math.PI / 2);

//         if (Boid.shape != undefined) {
//             ctx.drawImage(Boid.bitmap, -Boid.shape.width / 2, -Boid.shape.height / 2);
//         }

//         ctx.restore();

//     }
// }
