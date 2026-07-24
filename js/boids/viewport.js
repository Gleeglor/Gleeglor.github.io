/**
 * Owns canvas sizing and a single world-space mapping for DOM ↔ simulation.
 *
 * World space = canvas backing-store pixels, with page scroll added on Y (and X)
 * so boids stay glued to document content while the canvas is position:fixed.
 */
export class Viewport {
    /**
     * @param {HTMLCanvasElement} canvas
     * @param {HTMLElement} boidsBox
     */
    constructor(canvas, boidsBox) {
        this.canvas = canvas;
        this.boidsBox = boidsBox;
        this.ctx = canvas.getContext("2d");
        this.scroll = { x: 0, y: 0 };
        /** Page scroll expressed in world (canvas buffer) pixels. */
        this.scrollWorld = { x: 0, y: 0 };
        this.cachedBox = {
            left: 0,
            top: 0,
            right: 0,
            bottom: 0,
            centerX: 0,
            centerY: 0,
            width: 0,
            height: 0,
        };
        this.documentHeight = 0;
        this.worldWidth = 0;
        this.worldHeight = 0;
        /** CSS px → world px for the current canvas backing store. */
        this.scaleX = 1;
        this.scaleY = 1;
        /** @type {((scaleX: number, scaleY: number) => void)|null} */
        this.worldScaleListener = null;
        /** Cached canvas client rect (invalidated on resize/scroll). */
        this._canvasRect = null;
    }

    /**
     * Soft resolution downscale for perf on large viewports (legacy behavior).
     * Coordinate math always goes through {@link clientToWorld} / scaleX/Y so
     * zoom and aspect ratio stay consistent regardless of this factor.
     */
    getDownscaleFactor() {
        const width = window.innerWidth;
        if (width > 1000) return 2;
        if (width >= 500) return 1.5;
        return 1;
    }

    handleScroll() {
        this.scroll.x = window.scrollX || window.pageXOffset || 0;
        this.scroll.y = window.scrollY || window.pageYOffset || 0;
        this._canvasRect = null;
        this.#updateScales();
        this.#updateScrollWorld();
        this.refreshCachedBox();
    }

    handleResize() {
        const hadWorld = this.worldWidth > 0;
        const prevScaleX = this.scaleX || 1;
        const prevScaleY = this.scaleY || 1;

        const dpr = window.devicePixelRatio || 1;
        const rect = this.canvas.getBoundingClientRect();
        const downscale = this.getDownscaleFactor();

        // Backing store uses downscaled CSS size * DPR (keeps prior visual density).
        const cssWidth = Math.max(1, rect.width / downscale);
        const cssHeight = Math.max(1, rect.height / downscale);

        this.canvas.width = Math.max(1, Math.floor(cssWidth * dpr));
        this.canvas.height = Math.max(1, Math.floor(cssHeight * dpr));
        this._canvasRect = null;

        // Do not fight Bootstrap w-100/h-100; layout stays full-viewport via CSS.
        // Buffer is simply stretched to the element’s CSS box.

        this.worldWidth = this.canvas.width;
        this.worldHeight = this.canvas.height;

        this.scroll.x = window.scrollX || window.pageXOffset || 0;
        this.scroll.y = window.scrollY || window.pageYOffset || 0;
        this.#updateScales();
        this.#updateScrollWorld();

        // Full document height in world pixels (for toroidal Y wrap).
        const scrollHeight = Math.max(
            document.documentElement.scrollHeight,
            document.body.scrollHeight,
            rect.height
        );
        this.documentHeight = scrollHeight * this.scaleY;

        if (hadWorld && this.worldScaleListener) {
            const sx = this.scaleX / prevScaleX;
            const sy = this.scaleY / prevScaleY;
            if (Math.abs(sx - 1) > 1e-6 || Math.abs(sy - 1) > 1e-6) {
                this.worldScaleListener(sx, sy);
            }
        }

        this.refreshCachedBox();
    }

    #canvasClientRect() {
        if (!this._canvasRect) {
            this._canvasRect = this.canvas.getBoundingClientRect();
        }
        return this._canvasRect;
    }

    #updateScales() {
        const rect = this.#canvasClientRect();
        this.scaleX = this.canvas.width / Math.max(rect.width, 1);
        this.scaleY = this.canvas.height / Math.max(rect.height, 1);
    }

    #updateScrollWorld() {
        this.scrollWorld.x = this.scroll.x * this.scaleX;
        this.scrollWorld.y = this.scroll.y * this.scaleY;
    }

    /**
     * Map a DOM client point onto simulation world coordinates.
     */
    clientToWorld(clientX, clientY) {
        const rect = this.#canvasClientRect();
        return {
            x: (clientX - rect.left) * this.scaleX + this.scrollWorld.x,
            y: (clientY - rect.top) * this.scaleY + this.scrollWorld.y,
        };
    }

    /**
     * Convert world → canvas-local draw coordinates (fixed canvas + scroll).
     */
    worldToCanvas(worldX, worldY) {
        return {
            x: worldX - this.scrollWorld.x,
            y: worldY - this.scrollWorld.y,
        };
    }

    /**
     * Recompute `#boids-box` in world space from its live client rect.
     * This is what containment and spawning must use.
     */
    refreshCachedBox() {
        const ab = this.boidsBox.getBoundingClientRect();
        const tl = this.clientToWorld(ab.left, ab.top);
        const br = this.clientToWorld(ab.right, ab.bottom);

        const left = Math.min(tl.x, br.x);
        const right = Math.max(tl.x, br.x);
        const top = Math.min(tl.y, br.y);
        const bottom = Math.max(tl.y, br.y);

        const box = this.cachedBox;
        box.left = left;
        box.top = top;
        box.right = right;
        box.bottom = bottom;
        box.centerX = (left + right) / 2;
        box.centerY = (top + bottom) / 2;
        box.width = right - left;
        box.height = bottom - top;
    }

    /** Uniform random point inside the containment box (world space). */
    randomPointInBox() {
        this.refreshCachedBox();
        const box = this.cachedBox;
        return {
            x: box.left + Math.random() * box.width,
            y: box.top + Math.random() * box.height,
        };
    }

    setup() {
        this.handleResize();
        this.ctx.filter = "none";
        this.ctx.imageSmoothingEnabled = false;
    }

    attachWindowListeners() {
        window.addEventListener("scroll", () => this.handleScroll(), { passive: true });
        window.addEventListener("resize", () => this.handleResize());

        // Browser zoom / pinch often fires on visualViewport without a window resize.
        if (window.visualViewport) {
            window.visualViewport.addEventListener("resize", () => this.handleResize());
            window.visualViewport.addEventListener("scroll", () => this.handleScroll());
        }
    }
}
