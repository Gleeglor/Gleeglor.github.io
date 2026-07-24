export class AABB {
    constructor(center, halfDimension) {
        this.center = center;
        this.halfDimension = halfDimension;
    }

    containsPoint(point) {
        return (
            point.x < this.center.x + this.halfDimension &&
            point.x > this.center.x - this.halfDimension &&
            point.y < this.center.y + this.halfDimension &&
            point.y > this.center.y - this.halfDimension
        );
    }

    intersectsAABB(aabb) {
        return (
            Math.abs(aabb.center.x - this.center.x) < aabb.halfDimension + this.halfDimension &&
            Math.abs(aabb.center.y - this.center.y) < aabb.halfDimension + this.halfDimension
        );
    }
}

export class QuadTree {
    static NODE_CAPACITY = 4;
    static MAX_DEPTH = 8;

    constructor(boundary, depth = 0) {
        this.boundary = boundary;
        this.depth = depth;
        this.points = [];
        this.northWest = null;
        this.northEast = null;
        this.southWest = null;
        this.southEast = null;
    }

    insert(element) {
        if (!this.boundary.containsPoint(element.position)) {
            return false;
        }

        if (this.points.length < QuadTree.NODE_CAPACITY && this.northWest == null) {
            this.points.push(element);
            return true;
        }

        if (this.northWest == null) {
            this.subdivide();
        }

        if (this.northWest && this.northWest.insert(element)) return true;
        if (this.northEast && this.northEast.insert(element)) return true;
        if (this.southWest && this.southWest.insert(element)) return true;
        if (this.southEast && this.southEast.insert(element)) return true;

        // At max depth, keep overflowing into this leaf
        if (this.northWest == null) {
            this.points.push(element);
            return true;
        }

        return false;
    }

    subdivide() {
        if (this.depth >= QuadTree.MAX_DEPTH) {
            return;
        }

        const half = this.boundary.halfDimension / 2;
        const { x, y } = this.boundary.center;

        this.northWest = new QuadTree(new AABB({ x: x - half, y: y - half }, half), this.depth + 1);
        this.northEast = new QuadTree(new AABB({ x: x + half, y: y - half }, half), this.depth + 1);
        this.southWest = new QuadTree(new AABB({ x: x - half, y: y + half }, half), this.depth + 1);
        this.southEast = new QuadTree(new AABB({ x: x + half, y: y + half }, half), this.depth + 1);
    }

    queryRange(result, aabb, limit = Infinity) {
        if (!this.boundary.intersectsAABB(aabb)) {
            return;
        }

        for (let i = 0; i < this.points.length; i++) {
            const point = this.points[i];
            if (aabb.containsPoint(point.position)) {
                result.push(point);
                if (result.length > limit) {
                    return;
                }
            }
        }

        if (this.northWest == null) {
            return;
        }

        this.northWest.queryRange(result, aabb, limit);
        if (result.length > limit) return;
        this.northEast.queryRange(result, aabb, limit);
        if (result.length > limit) return;
        this.southWest.queryRange(result, aabb, limit);
        if (result.length > limit) return;
        this.southEast.queryRange(result, aabb, limit);
    }

    render(ctx) {
        ctx.strokeRect(
            Math.round(this.boundary.center.x - this.boundary.halfDimension),
            Math.round(this.boundary.center.y - this.boundary.halfDimension),
            this.boundary.halfDimension * 2,
            this.boundary.halfDimension * 2
        );

        if (this.northWest != null) {
            this.northWest.render(ctx);
            this.northEast.render(ctx);
            this.southWest.render(ctx);
            this.southEast.render(ctx);
        }
    }
}
