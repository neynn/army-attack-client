import { EventEmitter } from "../events/eventEmitter.js";
import { Canvas } from "./canvas.js";
import { FPSCounter } from "./fpsCounter.js";

export const Camera = function(screenWidth, screenHeight) {
    this.id = "CAMERA";
    
    this.viewportX = 0;
    this.viewportY = 0;
    this.viewportWidth = screenWidth;
    this.viewportHeight = screenHeight;

    this.fpsCounter = new FPSCounter();

    this.display = new Canvas();
    this.display.create(screenWidth, screenHeight, true);

    this.events = new EventEmitter();
    this.events.listen(Camera.EVENT_SCREEN_RESIZE);
    this.events.listen(Camera.EVENT_VIEWPORT_LOAD);
    this.events.listen(Camera.EVENT_MAP_RENDER_COMPLETE);

    window.addEventListener("resize", () => {
        this.resizeViewport(window.innerWidth, window.innerHeight)
    });
}

Camera.SCALE = 1;
Camera.DEBUG = 0;
Camera.TILE_WIDTH = 96;
Camera.TILE_HEIGHT = 96;
Camera.EVENT_SCREEN_RESIZE = "Camera.EVENT_SCREEN_RESIZE";
Camera.EVENT_VIEWPORT_LOAD = "Camera.EVENT_VIEWPORT_LOAD";
Camera.EVENT_MAP_RENDER_COMPLETE = "Camera.EVENT_MAP_RENDER_COMPLETE";

Camera.prototype.update = function(gameContext) {
    const { timer } = gameContext; 
    const deltaTime = timer.getDeltaTime();

    this.display.clear();
    this.fpsCounter.update(deltaTime);
    this.drawUI(gameContext);
}

Camera.prototype.drawUI = function(gameContext) {
    const { uiManager, timer } = gameContext;
    const realTime = timer.getRealTime();
    const deltaTime = timer.getDeltaTime();

    for(const elementID of uiManager.drawableElements) {
        const element = uiManager.getElementUnique(elementID);
        
        element.update(realTime, deltaTime);
        element.draw(this.display.context, 0, 0, 0, 0);

        if(Camera.DEBUG) {
            element.debug(this.display.context, 0, 0, 0, 0);
        }
    }
}

Camera.prototype.resizeViewport = function(width, height) {
    this.viewportWidth = width;
    this.viewportHeight = height;
    this.display.resize(width, height);
    this.events.emit(Camera.EVENT_SCREEN_RESIZE, width, height);
}

Camera.prototype.getViewportPosition = function() {
    return {
        "viewportX": this.viewportX,
        "viewportY": this.viewportY
    }
}

Camera.prototype.getViewportWidth = function() {
    return this.viewportWidth / Camera.SCALE;
}

Camera.prototype.getViewportHeight = function() {
    return this.viewportHeight / Camera.SCALE;
}
