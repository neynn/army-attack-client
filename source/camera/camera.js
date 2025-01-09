import { Vec2 } from "../math/vec2.js";

export const Camera = function() {
    this.position = new Vec2(0, 0);
    this.viewportWidth = 0;
    this.viewportHeight = 0;
    this.viewportMode = Camera.VIEWPORT_MODE.FILL_WINDOW_AUTO;
    this.scale = 1;
}

/**
 * VIEWPORT_MODE.FILL_WINDOW_AUTO
 *  - Camera spans entire window.
 *  - Camera automatically centers on world screen.
 * 
 * VIEWPORT_MODE.FILL_WINDOW_FIXED
 *  - Camera spans entire window.
 *  - Camera is fixed on 0, 0.
 */
Camera.VIEWPORT_MODE = {
    FILL_WINDOW_AUTO: 0,
    FILL_WINDOW_FIXED: 1
};

Camera.prototype.setMode = function(modeID = Camera.VIEWPORT_MODE.FILL_WINDOW_AUTO) {
    this.viewportMode = modeID;
}

Camera.prototype.getMode = function() {
    return this.viewportMode;
}

Camera.prototype.setViewport = function(viewportWidth = 0, viewportHeight = 0) {
    this.viewportWidth = viewportWidth;
    this.viewportHeight = viewportHeight;
}

Camera.prototype.getBounds = function() {
    return {
        "x": this.position.x,
        "y": this.position.y,
        "w": this.viewportWidth,
        "h": this.viewportHeight
    }
}

Camera.prototype.centerInWindow = function(windowWidth, windowHeight) {
    const offsetX = (windowWidth - this.viewportWidth) / 2;
    const offsetY = (windowHeight - this.viewportHeight) / 2;

    this.setPosition(offsetX, offsetY);
}

Camera.prototype.setPosition = function(x = 0, y = 0) {
    switch(this.viewportMode) {
        case Camera.VIEWPORT_MODE.FILL_WINDOW_FIXED: {
            this.position.x = 0;
            this.position.y = 0;
            break;
        }
        default: {
            this.position.x = Math.floor(x);
            this.position.y = Math.floor(y);
            break;
        }
    }
}

Camera.prototype.getPosition = function() {
    return this.position;
}

Camera.prototype.getViewportWidth = function() {
    return this.viewportWidth / this.scale;
}

Camera.prototype.getViewportHeight = function() {
    return this.viewportHeight / this.scale;
}

Camera.prototype.onWindowResize = function(width, height) {
    switch(this.viewportMode) {
        case Camera.VIEWPORT_MODE.FILL_WINDOW_AUTO: {
            this.setViewport(width, height);
            this.cutViewport(width, height);
            this.centerInWindow(width, height);
            break;
        }
        case Camera.VIEWPORT_MODE.FILL_WINDOW_FIXED: {
            this.setViewport(width, height);
            break;
        }
        default: {
            //TODO
            break;
        }
    }

    this.reloadViewport();
}

Camera.prototype.reloadViewport = function() {} 

Camera.prototype.cutViewport = function(windowWidth, windowHeight) {}

Camera.prototype.update = function(gameContext) {}