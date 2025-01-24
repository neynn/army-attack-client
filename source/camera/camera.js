import { lerpValue } from "../math/math.js";

export const Camera = function() {    
    this.viewportX = 0;
    this.viewportY = 0;
    this.viewportX_limit = 0;
    this.viewportY_limit = 0;
    this.viewportWidth = 0;
    this.viewportHeight = 0;

    this.scale = 1;
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

Camera.prototype.getViewportWidth = function() {
    return this.viewportWidth / this.scale;
}

Camera.prototype.getViewportHeight = function() {
    return this.viewportHeight / this.scale;
}

Camera.prototype.getCenterOffset = function(windowWidth, windowHeight) {
    const offsetX = (windowWidth - this.viewportWidth) / 2;
    const offsetY = (windowHeight - this.viewportHeight) / 2;

    return {
        "x": offsetX,
        "y": offsetY
    }
}

Camera.prototype.loadWorld = function(worldWidth, worldHeight) {
    this.worldWidth = worldWidth;
    this.worldHeight = worldHeight;
}

Camera.prototype.centerWorld = function() {
    const positionX = this.worldWidth / 2;
    const positionY = this.worldHeight / 2;

    this.centerViewport(positionX, positionY);
}

Camera.prototype.reloadViewport = function() {
    const viewportWidth = this.getViewportWidth();
    const viewportHeight = this.getViewportHeight();

    if(this.worldWidth <= viewportWidth) {
        this.viewportX_limit = 0;
    } else {
        this.viewportX_limit = this.worldWidth - viewportWidth;
    }

    if(this.worldHeight <= viewportHeight) {
        this.viewportY_limit = 0;
    } else {
        this.viewportY_limit = this.worldHeight - viewportHeight;
    }

    this.limitViewport();
}

Camera.prototype.cutViewport = function(windowWidth, windowHeight) {
    if(this.worldWidth < windowWidth) {
        this.viewportWidth = this.worldWidth;
    }

    if(this.worldHeight < windowHeight) {
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

Camera.prototype.setViewport = function(width, height) {
    this.viewportWidth = width;
    this.viewportHeight = height;
}

Camera.prototype.dragViewport = function(param_dragX, param_dragY) {
    if(this.viewportMode !== Camera.VIEWPORT_MODE.DRAG) {
        return;
    }

    const viewportX = this.viewportX + param_dragX / this.scale;
    const viewportY = this.viewportY + param_dragY / this.scale;
    
    this.moveViewport(viewportX, viewportY);
}

Camera.prototype.centerViewport = function(positionX, positionY) {
    const viewportX = positionX - this.getViewportWidth() / 2;
    const viewportY = positionY - this.getViewportHeight() / 2;

    this.moveViewport(viewportX, viewportY);
}

Camera.prototype.bindViewport = function() {
    this.viewportType = Camera.VIEWPORT_TYPE.BOUND;
    this.limitViewport();
}

Camera.prototype.unbindViewport = function() {
    this.viewportType = Camera.VIEWPORT_TYPE.FREE;
    this.limitViewport();
}

Camera.prototype.screenToWorld = function(viewportX, viewportY, screenX, screenY) {
    const worldX = Math.floor(screenX / this.scale + viewportX);
    const worldY = Math.floor(screenY / this.scale + viewportY);

    return {
        "x": worldX,
        "y": worldY
    }
}

Camera.prototype.getViewportPosition = function() {
    return {
        "x": this.viewportX,
        "y": this.viewportY
    }
}

Camera.prototype.addTarget = function(targetX = 0, targetY = 0, factor = 0) {
    if(this.viewportMode !== Camera.VIEWPORT_MODE.FOLLOW) {
        return;
    }

    this.targets.push([targetX, targetY, factor]);
}

Camera.prototype.followTargets = function(deltaTime) {
    if(this.viewportMode !== Camera.VIEWPORT_MODE.FOLLOW || this.targets.length === 0) {
        return;
    }

    const threshold = 10;
    const [positionX, positionY, factor] = this.targets[0];
    const smoothingFactor = factor * deltaTime;

    const targetX = positionX - this.getViewportWidth() / 2;
    const targetY = positionY - this.getViewportHeight() / 2;

    const distanceX = targetX - this.viewportX;
    const distanceY = targetY - this.viewportY;

    if(Math.abs(distanceX) < threshold && Math.abs(distanceY) < threshold) {
        this.moveViewport(targetX, targetY);
        this.targets.shift();
        
        if(this.targets.length === 0) {
            //TODO: When all targets are reached: emit an "ALL_TARGETS_REACHED" event
            //THEN: Allow draggin again?
        }

        return;
    }

    if(smoothingFactor !== 0) {
        const viewportX = lerpValue(this.viewportX, targetX, smoothingFactor);
        const viewportY = lerpValue(this.viewportY, targetY, smoothingFactor);
        this.moveViewport(viewportX, viewportY);
    } else {
        this.moveViewport(targetX, targetY);
    }
}
