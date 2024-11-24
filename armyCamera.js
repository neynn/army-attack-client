import { Camera } from "./source/camera/camera.js";
import { Renderer } from "./source/renderer.js";
import { Camera2D } from "./source/camera/types/camera2D.js";

export const ArmyCamera = function(positionX, positionY, width, height) {
    Camera2D.call(this, positionX, positionY, width, height);
}

ArmyCamera.MAP_OUTLINE_COLOR = "#dddddd";

ArmyCamera.prototype = Object.create(Camera2D.prototype);
ArmyCamera.prototype.constructor = ArmyCamera;

ArmyCamera.prototype.update = function(gameContext) {
    this.drawMap(gameContext);
}

ArmyCamera.prototype.drawMap = function(gameContext) {
    const { mapLoader, spriteManager, renderer } = gameContext;
    const activeMap = mapLoader.getActiveMap();

    if(!activeMap) {
        return;
    }

    const context = renderer.getContext();
    const viewportBounds = this.getViewportBounds();
    const { startX, startY, endX, endY } = this.clampViewportBounds(viewportBounds);

    context.scale(this.scale, this.scale);

    for(const layerConfig of activeMap.backgroundLayers) {
        this.drawTileLayer(gameContext, activeMap, layerConfig, startX, startY, endX, endY);
    }
    
    for(const layerID of spriteManager.layerStack) {
        const layer = spriteManager.layers[layerID];
        this.drawSpriteLayer(gameContext, layer);
    }

    for(const layerConfig of activeMap.foregroundLayers) {
        this.drawTileLayer(gameContext, activeMap, layerConfig, startX, startY, endX, endY);
    }

    if((Renderer.DEBUG & Renderer.DEBUG_MAP) !== 0) {
        for(const layerConfig of activeMap.metaLayers) {
            this.drawMetaLayer(gameContext, activeMap, layerConfig, startX, startY, endX, endY);
        }

        this.drawMapOutlines(gameContext, activeMap.width, activeMap.height);
    }
}

ArmyCamera.prototype.drawMetaLayer = function(gameContext, map2D, layerConfig, startX, startY, endX, endY) {
    const { id, opacity } = layerConfig;

    if(!opacity) {
        return;
    }

    const { renderer } = gameContext;
    const { x, y } = this.getViewportPosition();
    const context = renderer.getContext();
    const layer = map2D.layers[id];

    context.globalAlpha = opacity;
    context.font = "16px Arial";
    context.textBaseline = "middle";
    context.textAlign = "center";

    for(let i = startY; i <= endY; i++) {
        const renderY = i * Camera.TILE_HEIGHT - y + Camera.TILE_HEIGHT_HALF;
        const row = i * map2D.width;

        for(let j = startX; j <= endX; j++) {
            const renderX = j * Camera.TILE_WIDTH - x + Camera.TILE_WIDTH_HALF;
            const index = row + j;
            const tileID = layer[index];

            context.fillStyle = "#ff0000";
            context.fillText(tileID, renderX, renderY);
        }
    }

    context.globalAlpha = 1;
}

ArmyCamera.prototype.drawSpriteLayer = function(gameContext, spriteLayer) {
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

ArmyCamera.prototype.drawTileLayer = function(gameContext, map2D, layerConfig, startX, startY, endX, endY) {
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

ArmyCamera.prototype.drawMapOutlines = function(gameContext, mapWidth, mapHeight) {
    const { renderer } = gameContext;
    const context = renderer.getContext();
    const { x, y } = this.getViewportPosition();
    const viewportWidth = this.getViewportWidth();
    const viewportHeight = this.getViewportHeight();
    const lineSize = 1 / this.scale;

    context.fillStyle = ArmyCamera.MAP_OUTLINE_COLOR;

    for(let i = 0; i <= mapHeight; i++) {
        const renderY = i * Camera.TILE_HEIGHT - y;
        context.fillRect(0, renderY, viewportWidth + Camera.TILE_HEIGHT, lineSize);
    }

    for (let j = 0; j <= mapWidth; j++) {
        const renderX = j * Camera.TILE_WIDTH - x;
        context.fillRect(renderX, 0, lineSize, viewportHeight + Camera.TILE_HEIGHT);
    }
}