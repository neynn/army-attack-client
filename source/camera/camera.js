import { Vec2 } from "../math/vec2.js";

export const Camera = function() {
    this.position = new Vec2(0, 0);
    this.viewportWidth = 0;
    this.viewportHeight = 0;
    this.positionMode = Camera.POSITION_MODE.AUTO_CENTER;
    this.displayMode = Camera.DISPLAY_MODE.RESOLUTION_DEPENDENT;
    this.scale = 1;
}

/**
 * POSITION_MODE.AUTO_CENTER
 *  - Camera spans entire window.
 *  - Camera automatically centers on world screen.
 * 
 * POSITION_MODE.FIXED
 *  - Camera spans entire window.
 *  - Camera is fixed on 0, 0.
 */
Camera.POSITION_MODE = {
    AUTO_CENTER: 0,
    FIXED: 1
};

Camera.DISPLAY_MODE = {
    RESOLUTION_DEPENDENT: 0,
    RESOLUTION_FIXED: 1
};

Camera.prototype.setPositionMode = function(modeID) {
    this.positionMode = modeID;
}

Camera.prototype.setViewport = function(width, height) {
    this.viewportWidth = width;
    this.viewportHeight = height;
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
    switch(this.positionMode) {
        case Camera.POSITION_MODE.AUTO_CENTER: {
            this.position.x = Math.floor(x);
            this.position.y = Math.floor(y);
            break;
        }
        case Camera.POSITION_MODE.FIXED: {
            this.position.x = 0;
            this.position.y = 0;
            break;
        }
        default: {
            console.warn(`Viewport mode is not supported! ${this.positionMode}`);
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
    if(this.displayMode === Camera.DISPLAY_MODE.RESOLUTION_DEPENDENT) {
        this.setViewport(width, height);
    }

    if(this.positionMode === Camera.POSITION_MODE.AUTO_CENTER) {
        this.cutViewport(width, height);
        this.centerInWindow(width, height);
    }

    this.reloadViewport();
}

/**
 * @override
 */
Camera.prototype.reloadViewport = function() {} 

/**
 * @override
 */
Camera.prototype.cutViewport = function(windowWidth, windowHeight) {}

/**
 * @override
 */
Camera.prototype.update = function(gameContext, context) {}