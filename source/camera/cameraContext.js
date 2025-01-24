import { RenderContext } from "./renderContext.js";

export const CameraContext = function(camera) {
    this.camera = camera;
    this.context = null;
    this.type = CameraContext.DISPLAY_MODE.DEFAULT;
}

CameraContext.DISPLAY_MODE = {
    RESOLUTION_DEPENDENT: 0,
    RESOLUTION_FIXED: 1
};

CameraContext.prototype.resize = function(width, height) {
    this.camera.onWindowResize(width, height);

    if(this.context) {
        this.context.resize(width, height);
    }
}

CameraContext.prototype.initRenderer = function(width, height) {
    if(!this.context) {
        this.context = new RenderContext();
        this.context.init(width, height, false);
    }
}

CameraContext.prototype.getContext = function() {
    if(!this.context) {
        return null;
    }

    return this.context.context;
}

CameraContext.prototype.destroyRenderer = function() {
    this.context = null;
    this.useDefault();
}

CameraContext.prototype.useCustom = function() {
    if(this.context) {
        this.type = CameraContext.DISPLAY_MODE.RESOLUTION_FIXED;
    }
}

CameraContext.prototype.useDefault = function() {
    this.type = CameraContext.DISPLAY_MODE.RESOLUTION_DEPENDENT;
}

CameraContext.prototype.update = function(gameContext, context) {
    switch(this.type) { 
        case CameraContext.DISPLAY_MODE.RESOLUTION_DEPENDENT: {
            this.camera.update(gameContext, context);
            break;
        }
        case CameraContext.DISPLAY_MODE.RESOLUTION_FIXED: {
            this.camera.update(gameContext, this.context);
            break;
        }
    }
}
