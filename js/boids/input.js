export class InputController {
    /**
     * @param {import("./viewport.js").Viewport} viewport
     */
    constructor(viewport) {
        this.viewport = viewport;
        this.position = { x: 0, y: 0 };
        this.click = false;
        this.followMouse = false;
        /** @type {ReturnType<typeof setTimeout>|null} */
        this.tapTimeout = null;
    }

    attach() {
        window.addEventListener("mousemove", (event) => this.#onMouseMove(event));
        window.addEventListener("mousedown", (event) => this.#onMouseClick(event));
        window.addEventListener("mouseup", (event) => this.#onMouseClick(event));
        window.addEventListener("touchend", (event) => this.#onPhoneTap(event));
    }

    #onMouseMove(event) {
        this.position = this.viewport.clientToWorld(event.clientX, event.clientY);
    }

    #onMouseClick(event) {
        this.click = event.buttons !== 0;
        if (!this.tapTimeout) {
            this.followMouse = this.click;
        }
    }

    #onPhoneTap(event) {
        if (!event.changedTouches || event.changedTouches.length === 0) {
            return;
        }

        if (this.tapTimeout != null) {
            clearTimeout(this.tapTimeout);
        }

        this.followMouse = true;
        const touch = event.changedTouches[0];
        this.position = this.viewport.clientToWorld(touch.clientX, touch.clientY);

        this.tapTimeout = setTimeout(() => {
            this.followMouse = false;
            this.tapTimeout = null;
        }, 2500);
    }
}
