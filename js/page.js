
class Page {
    static canvas = document.getElementById("boids-canvas");
    static boids_box = document.getElementById("boids-box");
    static ctx = Page.canvas.getContext("2d");
    static scroll = {x: 0, y: 0};
    static DEBUG = false;
    static started_intro = false;

    

    static get_downscale_factor() {
        const width = window.innerWidth;

        if (width > 1000) {
            return 2;
        } else if (width >= 500 && width <= 1000) {
            return 1.5;
        } else {
            return 1;
        }
    }

    // Handlers
    static handle_scroll(evt) {
        Page.scroll.x = window.scrollX || window.pageXOffset;
        Page.scroll.y = window.scrollY || window.pageYOffset;

        // if (Page.started_intro == false) {
        //     if (Page.boids_box.getBoundingClientRect().y < 300) {
        //     }
        // }

        Page.handle_resize();
    }

    static handle_resize() {
        const dpr = window.devicePixelRatio || 1;
        const rect = Page.canvas.getBoundingClientRect();
        const downscale = Page.get_downscale_factor();

        rect.width /= downscale;
        rect.height /= downscale;

        Page.canvas.width = rect.width * dpr;
        Page.canvas.height = rect.height * dpr;

        Page.ctx.scale(dpr, dpr);

        Page.canvas.style.width = `${rect.width}px`;
        Page.canvas.style.height = `${rect.height}px`;
    }

    static setup() {
        Page.handle_resize();
        Page.ctx.filter = 'none';
        Page.ctx.imageSmoothingEnabled = false;
    }
}
