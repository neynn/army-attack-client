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
    this.scale = CameraContext.BASE_SCALE;

    this.events = new EventEmitter();
    this.events.listen(CameraContext.EVENT.RENDER_COMPLETE);
}

CameraContext.BASE_SCALE = 1;

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
    this.position.x = Math.floor(x);
    this.position.y = Math.floor(y);
}

CameraContext.prototype.dragCamera = function(deltaX, deltaY) {
    const dragX = deltaX / this.scale;
    const dragY = deltaY / this.scale;

    this.camera.dragViewport(dragX, dragY);
}

CameraContext.prototype.getWorldPosition = function(screenX, screenY) {
    return {
        "x": (screenX / this.scale) + this.camera.viewportX - (this.position.x / this.scale),
        "y": (screenY / this.scale) + this.camera.viewportY - (this.position.y / this.scale)
    }
}

CameraContext.prototype.getBounds = function() {
    const width = this.camera.viewportWidth * this.scale;
    const height = this.camera.viewportHeight * this.scale;

    return {
        "x": this.position.x,
        "y": this.position.y,
        "w": width,
        "h": height
    }
}

CameraContext.prototype.getCamera = function() {
    return this.camera;
}

CameraContext.prototype.refresh = function(windowWidth, windowHeight) {
    if(this.displayMode === CameraContext.DISPLAY_MODE.RESOLUTION_FIXED) {
        this.reloadScale(windowWidth, windowHeight);
    }

    if(this.positionMode === CameraContext.POSITION_MODE.AUTO_CENTER) {
        if(this.displayMode !== CameraContext.DISPLAY_MODE.RESOLUTION_FIXED) {
            this.camera.alignViewport();
        }

        this.centerCamera(windowWidth, windowHeight);
    }

    this.camera.reloadViewport();
}

CameraContext.prototype.onWindowResize = function(windowWidth, windowHeight) {
    if(this.displayMode !== CameraContext.DISPLAY_MODE.RESOLUTION_FIXED) {
        this.resize(windowWidth, windowHeight);
    }

    this.refresh(windowWidth, windowHeight);
}

CameraContext.prototype.centerCamera = function(windowWidth, windowHeight) {
    const positionX = (windowWidth - this.scale * this.camera.viewportWidth) * 0.5;
    const positionY = (windowHeight - this.scale * this.camera.viewportHeight) * 0.5;

    this.setPosition(positionX, positionY);
}

CameraContext.prototype.reloadScale = function(windowWidth, windowHeight) {
    if(this.context) {
        const scaleX = Math.floor(windowWidth / this.context.width);
        const scaleY = Math.floor(windowHeight / this.context.height);
        const scale = Math.min(scaleX, scaleY);
    
        if(scale >= CameraContext.BASE_SCALE) {
            this.scale = scale;
        } else {
            this.scale = CameraContext.BASE_SCALE;
        }
    }
}

CameraContext.prototype.resize = function(width, height) {
    this.camera.setViewport(width, height);

    if(this.context) {
        this.context.resize(width, height);
        this.reloadScale(width, height);
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
            const { canvas, context, width, height } = this.context;
            const { x, y, w, h } = this.getBounds();

            this.context.clear();
            this.camera.update(gameContext, context);
            this.events.emit(CameraContext.EVENT.RENDER_COMPLETE, context);
            mainContext.drawImage(canvas, 0, 0, width, height, x, y, w, h);
            break;
        }
    }
}
