
class AABB {
    center = {x: 0, y: 0};
    half_dimension;

    constructor(center, half_dimension) {
        this.center = center;
        this.half_dimension = half_dimension;
    }

    contains_point(point) {
        const x_inside = 
            point.x < this.center.x + this.half_dimension &&
            point.x > this.center.x - this.half_dimension;
        const y_inside = 
            point.y < this.center.y + this.half_dimension &&
            point.y > this.center.y - this.half_dimension;

        return x_inside && y_inside;
    }

    intersects_aabb(aabb) {
        const x_inside = Math.abs(aabb.center.x - this.center.x) < aabb.half_dimension + this.half_dimension;
        const y_inside = Math.abs(aabb.center.y - this.center.y) < aabb.half_dimension + this.half_dimension;

        return x_inside &&  y_inside;
    }
}

class QuadTree {
    static NODE_CAPACITY = 4;
    static MAX_DEPTH = 8;
    depth = 0;
    boundary;
    points = [];

    north_west;
    north_east;
    south_west;
    south_east;

    constructor(boundary, depth) {
        this.boundary = boundary;
        this.depth = depth;
    }

    insert(element) {
        if (!this.boundary.contains_point(element.position)) {
            return false;
        }

        if (this.points.length < QuadTree.NODE_CAPACITY && this.north_west == null) 
        {
            this.points.push(element);
            return true;
        }

        if (this.north_west == null) {
            this.subdivide();
        }
    
        if (this.north_west.insert(element)) return true;
        if (this.north_east.insert(element)) return true;
        if (this.south_west.insert(element)) return true;
        if (this.south_east.insert(element)) return true;

        return false;
    }

    subdivide() {
        if (this.depth >= QuadTree.MAX_DEPTH) {
            return;
        }

        const half_dimension = this.boundary.half_dimension / 2;
        const north_west_aabb = new AABB({
            x: this.boundary.center.x - half_dimension,
            y: this.boundary.center.y - half_dimension
        }, half_dimension);
        this.north_west = new QuadTree(north_west_aabb, this.depth + 1);
        
        const north_east_aabb = new AABB({
            x: this.boundary.center.x + half_dimension,
            y: this.boundary.center.y - half_dimension
        }, half_dimension);
        this.north_east = new QuadTree(north_east_aabb, this.depth + 1);

        
        const south_west_aabb = new AABB({
            x: this.boundary.center.x - half_dimension,
            y: this.boundary.center.y + half_dimension
        }, half_dimension);
        this.south_west = new QuadTree(south_west_aabb, this.depth + 1);
        
        const south_east_aabb = new AABB({
            x: this.boundary.center.x + half_dimension,
            y: this.boundary.center.y + half_dimension
        }, half_dimension);
        this.south_east = new QuadTree(south_east_aabb, this.depth + 1);
    }

    query_range(result, aabb, limit) {
        if (!this.boundary.intersects_aabb(aabb)) {
            return;
        }

        for (let i = 0; i < this.points.length; i++) {
            const point = this.points[i];
            if (aabb.contains_point(point.position)) {
                result.push(point);
                if (result.length > limit) {
                    return;
                }
            }
        }
        
        if (this.north_west == null) {
            return;
        }

        this.north_west.query_range(result, aabb, limit);
        this.north_east.query_range(result, aabb, limit);
        this.south_west.query_range(result, aabb, limit);
        this.south_east.query_range(result, aabb, limit);

        return;
    }

    render(ctx) {
        ctx.strokeRect(
            Math.round(this.boundary.center.x - this.boundary.half_dimension), 
            Math.round(this.boundary.center.y - this.boundary.half_dimension),
            this.boundary.half_dimension * 2,
            this.boundary.half_dimension * 2
        );

        if (this.north_west != null) {
            this.north_west.render(ctx);
            this.north_east.render(ctx);
            this.south_west.render(ctx);
            this.south_east.render(ctx);
        }
    }
}
