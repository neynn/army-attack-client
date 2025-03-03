import { Camera } from "./camera/camera.js";
import { RenderContext } from "./camera/renderContext.js";
import { FPSCounter } from "./camera/fpsCounter.js";
import { EffectManager } from "./effects/effectManager.js";
import { EventEmitter } from "./events/eventEmitter.js";
import { isRectangleRectangleIntersect } from "./math/math.js";
import { CameraContext } from "./camera/cameraContext.js";

export const Renderer = function() {
    this.contexts = [];
    this.windowWidth = window.innerWidth;
    this.windowHeight = window.innerHeight;

    this.effects = new EffectManager();
    this.fpsCounter = new FPSCounter();
    this.display = new RenderContext();
    this.display.init(this.windowWidth, this.windowHeight, RenderContext.TYPE.DISPLAY);

    this.events = new EventEmitter();
    this.events.listen(Renderer.EVENT.SCREEN_RESIZE);

    window.addEventListener("resize", () => this.resizeDisplay(window.innerWidth, window.innerHeight));
}

Renderer.EVENT = {
    SCREEN_RESIZE: 0
};

Renderer.DEBUG = {
    CONTEXT: true,
    INTERFACE: false,
    SPRITES: false,
    MAP: false
};

Renderer.prototype.getContext = function(contextID) {
    for(let i = 0; i < this.contexts.length; i++) {
        const context = this.contexts[i];
        const id = context.getID();

        if(id === contextID) {
            return context;
        }
    }

    return null;
}

Renderer.prototype.hasContext = function(contextID) {
    for(let i = 0; i < this.contexts.length; i++) {
        const context = this.contexts[i];
        const id = context.getID();

        if(id === contextID) {
            return true;
        }
    }

    return false;
}

Renderer.prototype.createContext = function(contextID, camera) {
    if(this.hasContext(contextID) || !(camera instanceof Camera)) {
        return null;
    }

    const context = new CameraContext(contextID, camera);

    camera.setViewport(this.windowWidth, this.windowHeight);

    context.setWindow(this.windowWidth, this.windowHeight);

    this.contexts.push(context);

    return context;
}

Renderer.prototype.destroyContext = function(contextID) {
    for(let i = 0; i < this.contexts.length; i++) {
        const context = this.contexts[i];
        const id = context.getID();

        if(id === contextID) {
            this.contexts.splice(i, 1);
            context.events.emit(CameraContext.EVENT.REMOVE);
            return;
        }
    }
}

Renderer.prototype.drawContextDebug = function() {
    this.display.context.strokeStyle = "#eeeeee";
    this.display.context.lineWidth = 3;

    for(let i = 0; i < this.contexts.length; i++) {
        const context = this.contexts[i];
        const { x, y, w, h } = context.getBounds();

        this.display.context.strokeRect(x, y, w, h);
    }
}

Renderer.prototype.update = function(gameContext) {
    const { timer, uiManager } = gameContext; 
    const drawContext = this.display.context;
    const deltaTime = timer.getDeltaTime();

    this.display.clear();
    this.fpsCounter.update(deltaTime);

    for(let i = 0; i < this.contexts.length; i++) {
        const context = this.contexts[i];

        drawContext.save();
        context.update(gameContext, drawContext);
        drawContext.restore();
    }

    this.effects.update(drawContext, deltaTime);

    if(Renderer.DEBUG.CONTEXT) {
        this.drawContextDebug();
    }

    uiManager.draw(gameContext, drawContext);

    if(Renderer.DEBUG.INTERFACE) {
        uiManager.debug(drawContext);
    }
}

Renderer.prototype.resizeDisplay = function(width, height) {
    for(let i = 0; i < this.contexts.length; i++) {
        const context = this.contexts[i];

        context.onWindowResize(width, height);
    }
    
    this.windowWidth = width;
    this.windowHeight = height;
    this.display.resize(width, height);
    this.events.emit(Renderer.EVENT.SCREEN_RESIZE, width, height);
}

Renderer.prototype.getWindow = function() {
    return {
        "w": this.windowWidth,
        "h": this.windowHeight
    }
}

Renderer.prototype.getCollidedContext = function(mouseX, mouseY, mouseRange) {
    for(let i = this.contexts.length - 1; i >= 0; i--) {
        const context = this.contexts[i];
        const { x, y, w, h } = context.getBounds();
        const isColliding = isRectangleRectangleIntersect(
            x, y, w, h,
            mouseX, mouseY, mouseRange, mouseRange
        );

        if(isColliding) {
            return context;
        }
    }

    return null;
}