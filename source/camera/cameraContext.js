import { RenderContext } from "./renderContext.js";

export const CameraContext = function(camera) {
    this.camera = camera;
    this.context = null;
    this.type = CameraContext.RENDER_TYPE.DEFAULT;
}

CameraContext.RENDER_TYPE = {
    "DEFAULT": 0,
    "CUSTOM": 1
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
        this.type = CameraContext.RENDER_TYPE.CUSTOM;
    }
}

CameraContext.prototype.useDefault = function() {
    this.type = CameraContext.RENDER_TYPE.DEFAULT;
}

CameraContext.prototype.update = function(gameContext, context) {
    switch(this.type) { 
        case CameraContext.RENDER_TYPE.DEFAULT: {
            this.camera.update(gameContext, context);
            break;
        }
        case CameraContext.RENDER_TYPE.CUSTOM: {
            this.camera.update(gameContext, this.context);
            break;
        }
        default: {
            break;
        }
    }
}
