import { EventEmitter } from "../events/eventEmitter.js";
import { RenderContext } from "./renderContext.js";
import { Vec2 } from "../math/vec2.js";

export const CameraContext = function(id, camera) {
    this.id = id;
    this.position = new Vec2(0, 0);
    this.positionMode = CameraContext.POSITION_MODE.AUTO_CENTER;
    this.displayMode = CameraContext.DISPLAY_MODE.RESOLUTION_DEPENDENT;
    this.camera = camera;
    this.context = null;
    this.scale = 1;

    this.events = new EventEmitter();
    this.events.listen(CameraContext.EVENT.RENDER_COMPLETE);
}

CameraContext.EVENT = {
    RENDER_COMPLETE: 0
};

CameraContext.POSITION_MODE = {
    AUTO_CENTER: 0,
    FIXED: 1
};

CameraContext.DISPLAY_MODE = {
    RESOLUTION_DEPENDENT: 0,
    RESOLUTION_FIXED: 1
};

CameraContext.prototype.getPosition = function() {
    return this.position;
}

CameraContext.prototype.setPositionMode = function(modeID) {
    if(!Object.values(CameraContext.POSITION_MODE).includes(modeID)) {
        console.warn(`Position mode is not supported! ${modeID}`);
        return;
    }

    this.positionMode = modeID;
}

CameraContext.prototype.setDisplayMode = function(modeID) {
    if(!Object.values(CameraContext.DISPLAY_MODE).includes(modeID)) {
        console.warn(`Display mode is not supported! ${modeID}`);
        return;
    }

    if(modeID === CameraContext.DISPLAY_MODE.RESOLUTION_FIXED && this.context) {
        this.camera.setViewport(this.context.width, this.context.height);
        this.camera.reloadViewport();
    }

    this.displayMode = modeID;
}

CameraContext.prototype.setPosition = function(x = 0, y = 0) {
    switch(this.positionMode) {
        case CameraContext.POSITION_MODE.AUTO_CENTER: {
            this.position.x = Math.floor(x);
            this.position.y = Math.floor(y);
            break;
        }
        case CameraContext.POSITION_MODE.FIXED: {
            break;
        }
        default: {
            console.warn(`Position mode is not supported! ${this.positionMode}`);
            break;
        }
    }
}

CameraContext.prototype.dragCamera = function(deltaX, deltaY) {
    if(this.scale === 1) {
        this.camera.dragViewport(deltaX, deltaY);
        return;
    }

    const dragX = deltaX * ((this.scale - 1) * 0.5);
    const dragY = deltaY * ((this.scale - 1)* 0.5);

    this.camera.dragViewport(dragX, dragY);
}

//TODO add scale to this mess.
CameraContext.prototype.getViewportPosition = function(pointX, pointY) {
    return {
        "x": this.camera.viewportX - this.position.x + pointX,
        "y": this.camera.viewportY - this.position.y + pointY
    }
}

CameraContext.prototype.getBounds = function() {
    const startX = this.position.x - (this.scale - 1) * this.camera.viewportWidth * 0.5;
    const startY = this.position.y - (this.scale - 1) * this.camera.viewportHeight * 0.5;
    const width = this.camera.viewportWidth * this.scale;
    const height = this.camera.viewportHeight * this.scale;

    return {
        "x": startX,
        "y": startY,
        "w": width,
        "h": height
    }
}

CameraContext.prototype.getCamera = function() {
    return this.camera;
}

CameraContext.prototype.reloadCamera = function(windowWidth, windowHeight) {
    if(this.displayMode === CameraContext.DISPLAY_MODE.RESOLUTION_FIXED) {
        this.adjustContextScale(windowWidth, windowHeight);
    }

    if(this.positionMode === CameraContext.POSITION_MODE.AUTO_CENTER) {
        if(this.displayMode !== CameraContext.DISPLAY_MODE.RESOLUTION_FIXED) {
            this.camera.alignViewport();
        }

        const { x, y } = this.camera.getCenterOffset(windowWidth, windowHeight);
        this.setPosition(x, y);
    }

    this.camera.reloadViewport();
}

CameraContext.prototype.adjustContextScale = function(width, height) {
    if(this.context) {
        const scaleX = Math.floor(width / this.context.width);
        const scaleY = Math.floor(height / this.context.height);
        const scale = Math.min(scaleX, scaleY);
    
        this.scale = scale;
    }
}

CameraContext.prototype.onWindowResize = function(windowWidth, windowHeight) {
    if(this.displayMode !== CameraContext.DISPLAY_MODE.RESOLUTION_FIXED) {
        this.forceResize(windowWidth, windowHeight);
    }

    this.reloadCamera(windowWidth, windowHeight);
}

CameraContext.prototype.forceResize = function(width, height) {
    this.camera.setViewport(width, height);

    if(this.context) {
        this.context.resize(width, height);
        this.adjustContextScale(width, height);
    }
}

CameraContext.prototype.initRenderer = function(width, height) {
    if(!this.context) {
        this.context = new RenderContext();
        this.context.init(width, height, false);
    }
}

CameraContext.prototype.destroyRenderer = function() {
    this.context = null;
    this.setDisplayMode(CameraContext.DISPLAY_MODE.RESOLUTION_DEPENDENT);
}

CameraContext.prototype.update = function(gameContext, mainContext) {
    switch(this.displayMode) { 
        case CameraContext.DISPLAY_MODE.RESOLUTION_DEPENDENT: {
            mainContext.translate(this.position.x, this.position.y);
            this.camera.update(gameContext, mainContext);
            this.events.emit(CameraContext.EVENT.RENDER_COMPLETE, mainContext);
            break;
        }
        case CameraContext.DISPLAY_MODE.RESOLUTION_FIXED: {
            const { canvas, context } = this.context;
            const { x, y, w, h } = this.getBounds();

            this.context.clear();
            this.camera.update(gameContext, context);
            this.events.emit(CameraContext.EVENT.RENDER_COMPLETE, context);
            mainContext.drawImage(canvas, 0, 0, this.camera.viewportWidth, this.camera.viewportHeight, x, y, w, h);
            break;
        }
    }
}
