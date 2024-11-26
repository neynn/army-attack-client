import { Camera } from "../camera.js";
import { lerpValue } from "../../math/math.js";

export const MoveableCamera = function(positionX, positionY, viewportWidth, viewportHeight) {
    Camera.call(this, positionX, positionY, viewportWidth, viewportHeight);
    
    this.viewportX = 0;
    this.viewportY = 0;
    this.viewportX_limit = 0;
    this.viewportY_limit = 0;
    
    this.worldWidth = 0;
    this.worldHeight = 0;

    this.isBound = false;
    this.isFixed = false;
    this.isFollowing = false;
    this.isDragging = true;
}

MoveableCamera.prototype = Object.create(Camera.prototype);
MoveableCamera.prototype.constructor = MoveableCamera;

MoveableCamera.prototype.loadWorld = function(worldWidth, worldHeight) {
    this.worldWidth = worldWidth;
    this.worldHeight = worldHeight;
}

MoveableCamera.prototype.onViewportLoad = function() {
    this.reloadViewportLimit();
}

MoveableCamera.prototype.centerWorld = function() {
    const positionX = this.worldWidth / 2;
    const positionY = this.worldHeight / 2;

    this.centerViewport(positionX, positionY);
}

MoveableCamera.prototype.reloadViewportLimit = function() {
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

MoveableCamera.prototype.limitViewport = function() {
    if(!this.isBound) {
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

MoveableCamera.prototype.moveViewport = function(viewportX, viewportY) {
    if(this.isFixed) {
        return;
    }

    this.viewportX = Math.trunc(viewportX);
    this.viewportY = Math.trunc(viewportY);

    this.limitViewport();
}

MoveableCamera.prototype.dragViewport = function(param_dragX, param_dragY) {
    if(!this.isDragging) {
        return;
    }

    const viewportX = this.viewportX + param_dragX / this.scale;
    const viewportY = this.viewportY + param_dragY / this.scale;
    
    this.moveViewport(viewportX, viewportY);
}

MoveableCamera.prototype.centerViewport = function(positionX, positionY) {
    const viewportX = positionX - this.getViewportWidth() / 2;
    const viewportY = positionY - this.getViewportHeight() / 2;

    this.moveViewport(viewportX, viewportY);
}

MoveableCamera.prototype.bindViewport = function() {
    this.isBound = true;
    this.reloadViewportLimit();
}

MoveableCamera.prototype.unbindViewport = function() {
    this.isBound = false;
    this.reloadViewportLimit();
}

MoveableCamera.prototype.screenToWorld = function(screenX, screenY) {
    const { x, y } = this.getViewportPosition();
    const worldX = Math.floor(screenX / this.scale + x);
    const worldY = Math.floor(screenY / this.scale + y);

    return {
        "x": worldX,
        "y": worldY
    }
}

MoveableCamera.prototype.getViewportPosition = function() {
    return {
        "x": this.viewportX - this.position.x,
        "y": this.viewportY - this.position.y
    }
}

MoveableCamera.prototype.addTarget = function(targetX = 0, targetY = 0, factor = 0) {
    if(!this.isFollowing) {
        return;
    }

    this.isDragging = false;
    this.targets.push([targetX, targetY, factor]);
}

MoveableCamera.prototype.followTargets = function(deltaTime) {
    if(!this.isFollowing || this.targets.length === 0) {
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
            this.isDragging = true;
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
