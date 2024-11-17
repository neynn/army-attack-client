import { Camera } from "../camera.js";
import { clampValue, lerpValue } from "../../math/math.js";
import { Renderer } from "../../renderer.js";

export const Camera2D = function(positionX, positionY, width, height) {
    Camera.call(this, positionX, positionY, width, height);

    this.viewportX_limit = 0;
    this.viewportY_limit = 0;

    this.mapWidth = 0;
    this.mapHeight = 0;

    this.isBound = false;
    this.isFixed = false;
    this.isFollowing = false;
    this.isDragging = true;

    this.targets = [];

    this.events.subscribe(Camera.EVENT_VIEWPORT_RESIZE, "CAMERA2D", (width, height) => this.loadViewport(this.mapWidth, this.mapHeight));
}

Camera2D.MAP_OUTLINE_COLOR = "#dddddd";

Camera2D.prototype = Object.create(Camera.prototype);
Camera2D.prototype.constructor = Camera2D;

Camera2D.prototype.update = function(gameContext) {
    this.drawMap(gameContext);
}

Camera2D.prototype.getViewportBounds = function() {
    const offsetX = 0;
    const offsetY = 1;
    const startX = Math.floor(this.viewportX / Camera.TILE_WIDTH);
    const startY = Math.floor(this.viewportY / Camera.TILE_HEIGHT);
    const endX = Math.floor((this.viewportX + this.getViewportWidth()) / Camera.TILE_WIDTH) + offsetX;
    const endY = Math.floor((this.viewportY + this.getViewportHeight()) / Camera.TILE_HEIGHT) + offsetY;

    return {
        startX,
        startY,
        endX,
        endY
    }
}

Camera2D.prototype.clampViewportBounds = function(viewportBounds, mapWidth, mapHeight) {
    const { startX, startY, endX, endY } = viewportBounds;

    const clampedStartX = clampValue(startX, mapWidth - 1, 0);
    const clampedStartY = clampValue(startY, mapHeight - 1, 0);
    const clampedEndX = clampValue(endX, mapWidth - 1, 0);
    const clampedEndY = clampValue(endY, mapHeight - 1, 0);

    return {
        "startX": clampedStartX,
        "startY": clampedStartY,
        "endX": clampedEndX,
        "endY": clampedEndY
    }
}

Camera2D.prototype.drawMap = function(gameContext) {
    const { mapLoader, spriteManager, renderer } = gameContext;
    const activeMap = mapLoader.getActiveMap();
    const context = renderer.getContext();

    if(!activeMap) {
        return;
    }

    const viewportBounds = this.getViewportBounds();
    const { startX, startY, endX, endY } = this.clampViewportBounds(viewportBounds, activeMap.width, activeMap.height);

    context.scale(this.scale, this.scale);

    for(const layerConfig of activeMap.backgroundLayers) {
        this.drawTileLayer(gameContext, activeMap, layerConfig, startX, startY, endX, endY);
    }
    
    for(const layerID of spriteManager.drawOrder) {
        const layer = spriteManager.layers[layerID];
        this.drawSpriteLayer(gameContext, layer);
    }

    for(const layerConfig of activeMap.foregroundLayers) {
        this.drawTileLayer(gameContext, activeMap, layerConfig, startX, startY, endX, endY);
    }

    if((Renderer.DEBUG & Renderer.DEBUG_MAP) !== 0) {
        this.drawTypeLayer(gameContext, activeMap, startX, startY, endX, endY);
        this.drawMapOutlines(gameContext, activeMap.width, activeMap.height);
    }
}

Camera2D.prototype.drawTypeLayer = function(gameContext, gameMap, startX, startY, endX, endY) {
    const { renderer } = gameContext;
    const tileTypes = gameContext.getConfig("tileTypes");
    const opacity = gameMap.metaLayers[1].opacity; //HäCK aus der Hölle.

    if(!opacity) {
        return;
    }

    const context = renderer.getContext();
    const layer = gameMap.layers["type"];
    const { x, y } = this.getViewportPosition();

    context.globalAlpha = opacity;
    context.font = "16px Arial";
    context.textBaseline = "middle";
    context.textAlign = "center";

    for(let i = startY; i <= endY; i++) {
        const row = i * gameMap.width;
        const renderY = i * Camera.TILE_HEIGHT - y + Camera.TILE_HEIGHT / 2;

        for(let j = startX; j <= endX; j++) {
            const index = row + j;
            const tileID = layer[index];
            const tileType = tileTypes[tileID];

            if(!tileType) {
                continue;
            }

            const { color, name } = tileType;
            const renderX = j * Camera.TILE_WIDTH - x + Camera.TILE_WIDTH / 2;

            context.fillStyle = color;
            context.fillText(name, renderX, renderY);
        }
    }
}

Camera2D.prototype.drawSpriteLayer = function(gameContext, spriteLayer) {
    const visibleSprites = [];
    const viewportLeftEdge = this.viewportX;
    const viewportTopEdge = this.viewportY;
    const viewportRightEdge = viewportLeftEdge + this.getViewportWidth();
    const viewportBottomEdge = viewportTopEdge + this.getViewportHeight();

    for(let i = 0; i < spriteLayer.length; i++) {
        const sprite = spriteLayer[i];
        const { x, y, w, h } = sprite.getBounds();
        const inBounds = x < viewportRightEdge && x + w > viewportLeftEdge && y < viewportBottomEdge && y + h > viewportTopEdge;

        if(inBounds) {
            visibleSprites.push(sprite);
        }
    }

    visibleSprites.sort((spriteA, spriteB) => (spriteA.position.y) - (spriteB.position.y));

    const { timer, renderer } = gameContext;
    const context = renderer.getContext();
    const { x, y } = this.getViewportPosition(); 
    const realTime = timer.getRealTime();
    const deltaTime = timer.getDeltaTime();

    for(let i = 0; i < visibleSprites.length; i++) {
        const sprite = visibleSprites[i];
        sprite.update(realTime, deltaTime);
        sprite.draw(context, x, y);
    }

    if((Renderer.DEBUG & Renderer.DEBUG_SPRITES) !== 0) {
        for(let i = 0; i < visibleSprites.length; i++) {
            const sprite = visibleSprites[i];
            sprite.debug(context, x, y);
        }
    }
}

Camera2D.prototype.drawTileLayer = function(gameContext, map2D, layerConfig, startX, startY, endX, endY) {
    const { id, opacity } = layerConfig;

    if(!opacity) {
        return;
    }

    const { tileManager, renderer } = gameContext;
    const { x, y } = this.getViewportPosition();
    const context = renderer.getContext();
    const width = map2D.width;
    const layer = map2D.layers[id];

    context.globalAlpha = opacity;

    for(let i = startY; i <= endY; i++) {
        const renderY = i * Camera.TILE_HEIGHT - y;
        const row = i * width;

        for(let j = startX; j <= endX; j++) {
            const renderX = j * Camera.TILE_WIDTH - x;
            const index = row + j;
            const tileID = layer[index];

            if(tileID === 0) {
                continue;
            }
            
            tileManager.drawTileGraphics(tileID, context, renderX, renderY);
        }
    }

    context.globalAlpha = 1;
}

Camera2D.prototype.drawMapOutlines = function(gameContext, mapWidth, mapHeight) {
    const { renderer } = gameContext;
    const context = renderer.getContext();
    const { x, y } = this.getViewportPosition();
    const viewportWidth = this.getViewportWidth();
    const viewportHeight = this.getViewportHeight();
    const lineSize = 1 / this.scale;

    context.fillStyle = Camera2D.MAP_OUTLINE_COLOR;

    for(let i = 0; i <= mapHeight; i++) {
        const renderY = i * Camera.TILE_HEIGHT - y;
        context.fillRect(0, renderY, viewportWidth + Camera.TILE_HEIGHT, lineSize);
    }

    for (let j = 0; j <= mapWidth; j++) {
        const renderX = j * Camera.TILE_WIDTH - x;
        context.fillRect(renderX, 0, lineSize, viewportHeight + Camera.TILE_HEIGHT);
    }
}

Camera2D.prototype.centerOnMap = function() {
    const width = this.mapWidth * Camera.TILE_WIDTH;
    const height = this.mapHeight * Camera.TILE_HEIGHT;

    this.centerViewport(width / 2, height / 2);
}

Camera2D.prototype.loadViewport = function(mapWidth, mapHeight) {
    const viewportWidth = this.getViewportWidth();
    const viewportHeight = this.getViewportHeight();
    const width = mapWidth * Camera.TILE_WIDTH;
    const height = mapHeight * Camera.TILE_HEIGHT;

    this.mapWidth = mapWidth;
    this.mapHeight = mapHeight;

    if(width <= viewportWidth) {
        this.viewportX_limit = 0;
    } else {
        this.viewportX_limit = width - viewportWidth;
    }

    if(height <= viewportHeight) {
        this.viewportY_limit = 0;
    } else {
        this.viewportY_limit = height - viewportHeight;
    }

    this.limitViewport();
}

Camera2D.prototype.limitViewport = function() {
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

Camera2D.prototype.moveViewport = function(viewportX, viewportY) {
    if(this.isFixed) {
        return;
    }

    this.viewportX = Math.trunc(viewportX);
    this.viewportY = Math.trunc(viewportY);

    this.limitViewport();
}

Camera2D.prototype.dragViewport = function(param_dragX, param_dragY) {
    if(!this.isDragging) {
        return;
    }

    const viewportX = this.viewportX + param_dragX / this.scale;
    const viewportY = this.viewportY + param_dragY / this.scale;
    
    this.moveViewport(viewportX, viewportY);
}

Camera2D.prototype.centerViewport = function(positionX, positionY) {
    const viewportX = positionX - this.getViewportWidth() / 2;
    const viewportY = positionY - this.getViewportHeight() / 2;

    this.moveViewport(viewportX, viewportY);
}

Camera2D.prototype.bindViewport = function() {
    this.isBound = true;
    this.loadViewport(this.mapWidth, this.mapHeight);
}

Camera2D.prototype.unbindViewport = function() {
    this.isBound = false;
    this.loadViewport(this.mapWidth, this.mapHeight);
}

Camera2D.prototype.addTarget = function(targetX = 0, targetY = 0, factor = 0) {
    if(!this.isFollowing) {
        return;
    }

    this.targets.push([targetX, targetY, factor]);
    this.isDragging = false;
}

Camera2D.prototype.followTargets = function(deltaTime) {
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
