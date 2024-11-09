import { Camera } from "./camera/camera.js";
import { Canvas } from "./camera/canvas.js";
import { FPSCounter } from "./camera/fpsCounter.js";
import { EventEmitter } from "./events/eventEmitter.js";
import { isRectangleRectangleIntersect } from "./math/math.js";

export const Renderer = function() {
    this.id = "RENDERER";
    this.windowWidth = window.innerWidth;
    this.windowHeight = window.innerHeight;

    this.fpsCounter = new FPSCounter();

    this.display = new Canvas();
    this.display.create(this.windowWidth, this.windowHeight, true);

    this.events = new EventEmitter();
    this.events.listen(Renderer.EVENT_SCREEN_RESIZE);
    this.events.listen(Renderer.EVENT_CAMERA_FINISH);

    this.cameras = new Map();

    window.addEventListener("resize", () => {
        this.resizeDisplay(window.innerWidth, window.innerHeight);
    });
}

Renderer.DEBUG = 0;
Renderer.EVENT_SCREEN_RESIZE = "EVENT_SCREEN_RESIZE";
Renderer.EVENT_CAMERA_FINISH = "EVENT_CAMERA_FINISH";

Renderer.prototype.drawCameraOutlines = function() {
    this.display.context.strokeStyle = "#eeeeee";
    this.display.context.lineWidth = 3;

    for(const [cameraID, camera] of this.cameras) {
        this.display.context.strokeRect(camera.position.x, camera.position.y, camera.viewportWidth, camera.viewportHeight);
    }
}

Renderer.prototype.getContext = function() {
    return this.display.context;
}

Renderer.prototype.getWidth = function() {
    return this.windowWidth;
}

Renderer.prototype.getHeight = function() {
    return this.windowHeight;
}

Renderer.prototype.getCamera = function(cameraID) {
    const camera = this.cameras.get(cameraID);

    if(!camera) {
        return null;
    }

    return camera;
}

Renderer.prototype.addCamera = function(cameraID = "DEFAULT", camera) {
    if(!(camera instanceof Camera)) {
        return false;
    }

    if(this.cameras.has(cameraID)) {
        return false;
    }

    this.cameras.set(cameraID, camera);

    return true;
}

Renderer.prototype.removeCamera = function(cameraID) {
    if(!this.cameras.has(cameraID)) {
        return false;
    }

    this.cameras.delete(cameraID);

    return true;
}

Renderer.prototype.drawUI = function(gameContext) {
    const { uiManager, timer } = gameContext;
    const realTime = timer.getRealTime();
    const deltaTime = timer.getDeltaTime();

    for(const elementID of uiManager.drawableElements) {
        const element = uiManager.getElementByID(elementID);
        
        element.update(realTime, deltaTime);
        element.draw(this.display.context, 0, 0, 0, 0);

        if(Renderer.DEBUG) {
            element.debug(this.display.context, 0, 0, 0, 0);
        }
    }
}

Renderer.prototype.update = function(gameContext) {
    const { timer } = gameContext; 
    const context = this.getContext();
    const deltaTime = timer.getDeltaTime();

    this.display.clear();
    this.fpsCounter.update(deltaTime);

    for(const [cameraID, camera] of this.cameras) {
        context.save();
        context.beginPath();
        context.rect(camera.position.x, camera.position.y, camera.viewportWidth, camera.viewportHeight);
        context.clip();
        camera.update(gameContext);
        this.events.emit(Renderer.EVENT_CAMERA_FINISH, this, camera);
        context.restore();
    }

    this.drawCameraOutlines();
    this.drawUI(gameContext);
}

Renderer.prototype.resizeDisplay = function(width, height) {
    this.windowWidth = width;
    this.windowHeight = height;
    this.display.resize(width, height);
    this.cameras.forEach(camera => camera.onWindowResize(width, height));
    this.events.emit(Renderer.EVENT_SCREEN_RESIZE, width, height);
}

Renderer.prototype.getCollidedCamera = function(mouseX, mouseY, mouseRange) {
    for(const [cameraID, camera] of this.cameras) {
        const { x, y, w, h } = camera.getBounds();

        const isColliding = isRectangleRectangleIntersect(
            x, y, w, h,
            mouseX, mouseY, mouseRange, mouseRange
        );

        if(isColliding) {
            return camera;
        }
    }

    return null;
}

Renderer.prototype.centerCamera = function(cameraID) {
    //(viewportWidth - width) / 2 <- offset!
    //width refers to mapWidth * Camera.TILE_WIDTH
    //The camera is centered on the screen!
}