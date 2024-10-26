import { EventEmitter } from "../events/eventEmitter.js";
import { clampValue, lerpValue } from "../math/math.js";
import { Canvas } from "./canvas.js";

export const Camera = function(screenWidth, screenHeight) {
    this.id = "CAMERA";
    this.centerOffsetX = 0;
    this.centerOffsetY = 0;
    this.viewportX = 0;
    this.viewportY = 0;
    this.viewportWidth = screenWidth;
    this.viewportHeight = screenHeight;
    this.viewportX_limit = 0;
    this.viewportY_limit = 0;
    this.mapWidth = 0;
    this.mapHeight = 0;
    this.isBound = false;
    this.isFixed = false; 
    this.isFollowing = false;
    this.isDragging = true;
    this.targets = [];

    this.fps = 0;
    this.smoothedFPS = 0;
    this.smoothingFactor = 0.05;

    this.display = new Canvas();
    this.display.create(screenWidth, screenHeight, true);

    this.events = new EventEmitter();
    this.events.listen(Camera.EVENT_SCREEN_RESIZE);
    this.events.listen(Camera.EVENT_VIEWPORT_LOAD);
    this.events.listen(Camera.EVENT_MAP_RENDER_COMPLETE);

    window.addEventListener("resize", () => this.resizeViewport(window.innerWidth, window.innerHeight));
}

Camera.SCALE = 1;
Camera.DEBUG = 0;
Camera.MAP_OUTLINE_COLOR = "#dddddd";
Camera.TILE_WIDTH = 96;
Camera.TILE_HEIGHT = 96;
Camera.EVENT_SCREEN_RESIZE = "Camera.EVENT_SCREEN_RESIZE";
Camera.EVENT_VIEWPORT_LOAD = "Camera.EVENT_VIEWPORT_LOAD";
Camera.EVENT_MAP_RENDER_COMPLETE = "Camera.EVENT_MAP_RENDER_COMPLETE";

Camera.prototype.getViewportPosition = function() {
    return {
        "viewportX": this.viewportX - this.centerOffsetX,
        "viewportY": this.viewportY - this.centerOffsetY
    }
}

Camera.prototype.bindToScreen = function() {
    this.isBound = true;
    this.loadViewport(this.mapWidth, this.mapHeight);
}

Camera.prototype.unbindFromScreen = function() {
    this.isBound = false;
    this.loadViewport(this.mapWidth, this.mapHeight);
}

Camera.prototype.drawTypeLayer = function(gameContext, gameMap, startX, startY, endX, endY) {
    const tileTypes = gameContext.getConfig("tileTypes");
    const opacity = gameMap.layerOpacity["type"];

    if(!opacity || !tileTypes) {
        return;
    }

    const layer = gameMap.layers["type"];
    const { viewportX, viewportY } = this.getViewportPosition();

    this.display.context.globalAlpha = opacity;
    this.display.context.font = "16px Arial";
    this.display.context.textBaseline = "middle";
    this.display.context.textAlign = "center";

    for(let i = startY; i <= endY; i++) {
        const row = i * gameMap.width;
        const renderY = i * Camera.TILE_HEIGHT - viewportY + Camera.TILE_HEIGHT / 2;

        for(let j = startX; j <= endX; j++) {
            const index = row + j;
            const tileID = layer[index];
            const tileType = tileTypes[tileID];

            if(!tileType) {
                continue;
            }

            const { color, name } = tileType;
            const renderX = j * Camera.TILE_WIDTH - viewportX + Camera.TILE_WIDTH / 2;

            this.display.context.fillStyle = color;
            this.display.context.fillText(name, renderX, renderY);
        }
    }
}

Camera.prototype.drawSpriteLayer = function(gameContext, spriteLayer) {
    const { timer } = gameContext;
    const { viewportX, viewportY } = this.getViewportPosition(); 
    const realTime = timer.getRealTime();
    const deltaTime = timer.getDeltaTime();
    const visibleSprites = [];
    const viewportLeftEdge = this.viewportX;
    const viewportTopEdge = this.viewportY;
    const viewportRightEdge = viewportLeftEdge + this.getViewportWidth();
    const viewportBottomEdge = viewportTopEdge + this.getViewportHeight();

    for(let i = 0; i < spriteLayer.length; i++) {
        const sprite = spriteLayer[i];
        const {x, y, w, h} = sprite.getBounds();
        const inBounds = x < viewportRightEdge && x + w > viewportLeftEdge && y < viewportBottomEdge && y + h > viewportTopEdge;

        if(inBounds) {
            visibleSprites.push(sprite);
        }
    }

    visibleSprites.sort((spriteA, spriteB) => (spriteA.position.y) - (spriteB.position.y));

    for(let i = 0; i < visibleSprites.length; i++) {
        const sprite = visibleSprites[i];
        sprite.update(realTime, deltaTime);
        sprite.draw(this.display.context, viewportX, viewportY, 0, 0);
    }

    if(Camera.DEBUG) {
        for(let i = 0; i < visibleSprites.length; i++) {
            const sprite = visibleSprites[i];
            sprite.debug(this.display.context, viewportX, viewportY, 0, 0);
        }
    }
}

Camera.prototype.drawTileLayer = function(gameContext, map2D, layerID, startX, startY, endX, endY) {
    const opacity = map2D.layerOpacity[layerID];
    
    if(!opacity) {
        return;
    }

    const { spriteManager } = gameContext;
    const { viewportX, viewportY } = this.getViewportPosition();
    const layer = map2D.layers[layerID];

    this.display.context.globalAlpha = opacity;

    for(let i = startY; i <= endY; i++) {
        const renderY = i * Camera.TILE_HEIGHT - viewportY;
        const row = i * map2D.width;

        for(let j = startX; j <= endX; j++) {
            const renderX = j * Camera.TILE_WIDTH - viewportX;
            const index = row + j;
            const graphics = layer[index];

            if(!graphics) {
                continue;
            }
            
            spriteManager.drawTileGraphics(graphics, this.display.context, renderX, renderY);
        }
    }

    this.display.context.globalAlpha = 1;
}

Camera.prototype.draw2DMapOutlines = function(mapWidth, mapHeight) {
    const { viewportX, viewportY } = this.getViewportPosition();
    const viewportWidth = this.getViewportWidth();
    const viewportHeight = this.getViewportHeight();
    const lineSize = 1 / Camera.SCALE;

    this.display.context.fillStyle = Camera.MAP_OUTLINE_COLOR;

    for(let i = 0; i <= mapHeight; i++) {
        const renderY = i * Camera.TILE_HEIGHT - viewportY;
        this.display.context.fillRect(0, renderY, viewportWidth, lineSize);
    }

    for (let j = 0; j <= mapWidth; j++) {
        const renderX = j * Camera.TILE_WIDTH - viewportX;
        this.display.context.fillRect(renderX, 0, lineSize, viewportHeight);
    }
}

Camera.prototype.draw2DMap = function(gameContext) {
    const { mapLoader, spriteManager } = gameContext;
    const activeMap = mapLoader.getActiveMap();

    if(!activeMap) {
        return;
    }

    const offsetX = 0;
    const offsetY = 1;
    const startX = Math.floor(this.viewportX / Camera.TILE_WIDTH);
    const startY = Math.floor(this.viewportY / Camera.TILE_HEIGHT);
    const endX = Math.floor((this.viewportX + this.getViewportWidth()) / Camera.TILE_WIDTH) + offsetX;
    const endY = Math.floor((this.viewportY + this.getViewportHeight()) / Camera.TILE_HEIGHT) + offsetY;
    const clampedStartX = clampValue(startX, activeMap.width - 1, 0);
    const clampedStartY = clampValue(startY, activeMap.height - 1, 0);
    const clampedEndX = clampValue(endX, activeMap.width - 1, 0);
    const clampedEndY = clampValue(endY, activeMap.height - 1, 0);

    this.display.context.save();
    this.display.context.scale(Camera.SCALE, Camera.SCALE);

    for(const layerID of activeMap.backgroundLayers) {
        this.drawTileLayer(gameContext, activeMap, layerID, clampedStartX, clampedStartY, clampedEndX, clampedEndY);
    }
    
    for(const layerID of spriteManager.drawOrder) {
        const layer = spriteManager.layers[layerID];
        this.drawSpriteLayer(gameContext, layer);
    }

    for(const layerID of activeMap.foregroundLayers) {
        this.drawTileLayer(gameContext, activeMap, layerID, clampedStartX, clampedStartY, clampedEndX, clampedEndY);
    }

    if(Camera.DEBUG) {
        this.drawTypeLayer(gameContext, activeMap, clampedStartX, clampedStartY, clampedEndX, clampedEndY);
        this.draw2DMapOutlines(activeMap.width, activeMap.height);
    }

    this.display.context.restore();
    this.events.emit(Camera.EVENT_MAP_RENDER_COMPLETE, this);
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

Camera.prototype.updateFPS = function(deltaTime) {
    const fps = 1 / deltaTime;
    const smoothedFPS = (fps - this.smoothedFPS) * (this.smoothingFactor);

    this.fps = fps;
    this.smoothedFPS += smoothedFPS;
}

Camera.prototype.update = function(gameContext) {
    const { timer } = gameContext; 
    const deltaTime = timer.getDeltaTime();

    this.display.clear();
    this.followViewport(deltaTime);
    this.updateFPS(deltaTime);
    this.draw2DMap(gameContext);
    this.drawUI(gameContext);
}

Camera.prototype.addTarget = function(targetX = 0, targetY = 0, factor = 0) {
    if(!this.isFollowing) {
        return false;
    }

    this.targets.push([targetX, targetY, factor]);
    this.isDragging = false;

    return true;
}

Camera.prototype.limitViewport = function() {
    if(!this.isBound) {
        return false;
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

    return true;
}

Camera.prototype.moveViewport = function(viewportX, viewportY) {
    if(this.isFixed) {
        return false;
    }

    this.viewportX = Math.trunc(viewportX);
    this.viewportY = Math.trunc(viewportY);

    this.limitViewport();

    return true;
}

Camera.prototype.dragViewport = function(param_dragX, param_dragY) {
    if(!this.isDragging) {
        return false;
    }

    const viewportX = this.viewportX + param_dragX / Camera.SCALE;
    const viewportY = this.viewportY + param_dragY / Camera.SCALE;
    
    this.moveViewport(viewportX, viewportY);
}

Camera.prototype.centerViewport = function(positionX, positionY) {
    const viewportX = positionX - this.getViewportWidth() / 2;
    const viewportY = positionY - this.getViewportHeight() / 2;

    this.moveViewport(viewportX, viewportY);
}

Camera.prototype.followViewport = function(deltaTime) {
    if(!this.isFollowing || this.targets.length === 0) {
        return false;
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

        return true;
    }

    if(smoothingFactor !== 0) {
        const viewportX = lerpValue(this.viewportX, targetX, smoothingFactor);
        const viewportY = lerpValue(this.viewportY, targetY, smoothingFactor);
        this.moveViewport(viewportX, viewportY);
    } else {
        this.moveViewport(targetX, targetY);
    }

    return false;
}

Camera.prototype.loadViewport = function(mapWidth, mapHeight) {
    const viewportWidth = this.getViewportWidth();
    const viewportHeight = this.getViewportHeight();
    const width = mapWidth * Camera.TILE_WIDTH;
    const height = mapHeight * Camera.TILE_HEIGHT;

    this.mapWidth = mapWidth;
    this.mapHeight = mapHeight;

    if(width <= viewportWidth) {
        this.viewportX_limit = 0;

        if(this.isBound) {
            this.centerOffsetX = (viewportWidth - width) / 2;
        } else {
            this.centerOffsetX = 0;
        }
    } else {
        this.viewportX_limit = width - viewportWidth;
        this.centerOffsetX = 0;
    }

    if(height <= viewportHeight) {
        this.viewportY_limit = 0;
        
        if(this.isBound) {
            this.centerOffsetY = (viewportHeight - height) / 2;
        } else {
            this.centerOffsetY = 0;
        }
    } else {
        this.viewportY_limit = height - viewportHeight;
        this.centerOffsetY = 0;  
    }

    this.limitViewport();
    this.events.emit(Camera.EVENT_VIEWPORT_LOAD, width, height);
}

Camera.prototype.resizeViewport = function(width, height) {
    this.viewportWidth = width;
    this.viewportHeight = height;

    this.loadViewport(this.mapWidth, this.mapHeight);
    this.display.resize(width, height);
    this.events.emit(Camera.EVENT_SCREEN_RESIZE, width, height);
}

Camera.prototype.getViewportWidth = function() {
    return this.viewportWidth / Camera.SCALE;
}

Camera.prototype.getViewportHeight = function() {
    return this.viewportHeight / Camera.SCALE;
}
