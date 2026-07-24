(function () {
    function ensureOverlay() {
        let overlay = document.getElementById("lightbox");
        if (overlay) {
            return overlay;
        }

        overlay = document.createElement("div");
        overlay.id = "lightbox";
        overlay.className = "lightbox-overlay";
        overlay.setAttribute("role", "dialog");
        overlay.setAttribute("aria-modal", "true");
        overlay.setAttribute("aria-label", "Enlarged image");
        overlay.hidden = true;

        const img = document.createElement("img");
        img.alt = "";
        overlay.appendChild(img);
        document.body.appendChild(overlay);

        overlay.addEventListener("click", closeLightbox);
        document.addEventListener("keydown", function (e) {
            if (e.key === "Escape" && overlay.classList.contains("is-open")) {
                closeLightbox();
            }
        });

        return overlay;
    }

    function sizeToViewport(img, sourceEl) {
        const nw = img.naturalWidth || 1;
        const nh = img.naturalHeight || 1;
        const maxW = window.innerWidth * 0.96;
        const maxH = window.innerHeight * 0.94;

        // Fit as large as possible in the viewport (allows upscaling past file size).
        let scale = Math.min(maxW / nw, maxH / nh);

        // Never show smaller than the on-page image.
        if (sourceEl) {
            const rect = sourceEl.getBoundingClientRect();
            if (rect.width > 0 && rect.height > 0) {
                const minScale = Math.max(rect.width / nw, rect.height / nh);
                scale = Math.max(scale, minScale);
                // If that overflows the viewport, clamp back to fit.
                scale = Math.min(scale, maxW / nw, maxH / nh);
            }
        }

        img.style.width = Math.round(nw * scale) + "px";
        img.style.height = Math.round(nh * scale) + "px";
        img.style.maxWidth = "none";
        img.style.maxHeight = "none";
    }

    function openLightbox(src, alt, sourceEl) {
        const overlay = ensureOverlay();
        const img = overlay.querySelector("img");

        function applySize() {
            sizeToViewport(img, sourceEl);
        }

        img.style.width = "";
        img.style.height = "";
        img.alt = alt || "";
        img.onload = applySize;

        if (sourceEl && sourceEl.classList.contains("small-image")) {
            img.style.imageRendering = "pixelated";
        } else {
            img.style.imageRendering = "";
        }

        if (img.getAttribute("src") !== src) {
            img.src = src;
        }
        if (img.complete && img.naturalWidth) {
            applySize();
        }

        overlay.hidden = false;
        overlay.classList.add("is-open");
        document.body.style.overflow = "hidden";
    }

    function closeLightbox() {
        const overlay = document.getElementById("lightbox");
        if (!overlay) {
            return;
        }
        overlay.classList.remove("is-open");
        overlay.hidden = true;
        document.body.style.overflow = "";
    }

    function isLightboxable(img) {
        if (!img || img.tagName !== "IMG") {
            return false;
        }
        if (img.closest(".lightbox-overlay")) {
            return false;
        }
        if (img.classList.contains("no-lightbox")) {
            return false;
        }
        const src = img.getAttribute("src") || "";
        if (!src || src.indexOf("data:") === 0) {
            return false;
        }
        return true;
    }

    function enable(img) {
        if (!isLightboxable(img) || img.dataset.lightboxBound === "1") {
            return;
        }
        img.dataset.lightboxBound = "1";
        img.classList.add("lightbox-trigger");
        if (!img.getAttribute("title")) {
            img.setAttribute("title", "Click to enlarge");
        }
        img.addEventListener("click", function () {
            openLightbox(img.currentSrc || img.src, img.alt, img);
        });
    }

    function bindAll() {
        document.querySelectorAll("img").forEach(enable);
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", bindAll);
    } else {
        bindAll();
    }
})();
