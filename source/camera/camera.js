export const Camera = function() {    
    this.viewportX = 0;
    this.viewportY = 0;
    this.viewportX_limit = 0;
    this.viewportY_limit = 0;
    this.viewportWidth = 0;
    this.viewportHeight = 0;

    this.worldWidth = 0;
    this.worldHeight = 0;

    this.viewportMode = Camera.VIEWPORT_MODE.DRAG;
    this.viewportType = Camera.VIEWPORT_TYPE.BOUND;
}

Camera.VIEWPORT_TYPE = {
    FREE: 0,
    BOUND: 1
};

Camera.VIEWPORT_MODE = {
    FIXED: 0,
    FOLLOW: 1,
    DRAG: 2
};

Camera.prototype.update = function(gameContext, renderContext) {}

Camera.prototype.setWorldSize = function(worldWidth, worldHeight) {
    this.worldWidth = worldWidth;
    this.worldHeight = worldHeight;

    this.reloadViewport();
}

Camera.prototype.setViewportSize = function(width, height) {
    this.viewportWidth = width;
    this.viewportHeight = height;
}

Camera.prototype.centerWorld = function() {
    const positionX = this.worldWidth / 2;
    const positionY = this.worldHeight / 2;

    this.centerViewport(positionX, positionY);
}

Camera.prototype.reloadViewport = function() {
    if(this.worldWidth <= this.viewportWidth) {
        this.viewportX_limit = 0;
    } else {
        this.viewportX_limit = this.worldWidth - this.viewportWidth;
    }

    if(this.worldHeight <= this.viewportHeight) {
        this.viewportY_limit = 0;
    } else {
        this.viewportY_limit = this.worldHeight - this.viewportHeight;
    }

    this.limitViewport();
}

Camera.prototype.alignViewport = function() {
    if(this.worldWidth < this.viewportWidth) {
        this.viewportWidth = this.worldWidth;
    }

    if(this.worldHeight < this.viewportHeight) {
        this.viewportHeight = this.worldHeight;
    }
}

Camera.prototype.limitViewport = function() {
    if(this.viewportType !== Camera.VIEWPORT_TYPE.BOUND) {
        return;
    }

    if(this.viewportX < 0) {
        this.viewportX = 0;
    } else if(this.viewportX >= this.viewportX_limit) {
        this.viewportX = this.viewportX_limit;
    }
  
    if(this.viewportY < 0) {
        this.viewportY = 0;
    } else if(this.viewportY >= this.viewportY_limit) {
        this.viewportY = this.viewportY_limit;
    }
}

Camera.prototype.moveViewport = function(viewportX, viewportY) {
    if(this.viewportMode === Camera.VIEWPORT_MODE.FIXED) {
        return;
    }

    this.viewportX = Math.trunc(viewportX);
    this.viewportY = Math.trunc(viewportY);

    this.limitViewport();
}

Camera.prototype.dragViewport = function(dragX, dragY) {
    if(this.viewportMode !== Camera.VIEWPORT_MODE.DRAG) {
        return;
    }

    const positionX = this.viewportX + dragX;
    const positionY = this.viewportY + dragY;
    
    this.moveViewport(positionX, positionY);
}

Camera.prototype.centerViewport = function(positionX, positionY) {
    const viewportX = positionX - this.viewportWidth / 2;
    const viewportY = positionY - this.viewportHeight / 2;

    this.moveViewport(viewportX, viewportY);
}

Camera.prototype.bindViewport = function() {
    this.viewportType = Camera.VIEWPORT_TYPE.BOUND;
    this.limitViewport();
}

Camera.prototype.freeViewport = function() {
    this.viewportType = Camera.VIEWPORT_TYPE.FREE;
    this.limitViewport();
}

Camera.prototype.getViewport = function() {
    return {
        "x": this.viewportX,
        "y": this.viewportY,
        "w": this.viewportWidth,
        "h": this.viewportHeight
    }
}