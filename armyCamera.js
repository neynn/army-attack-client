import { Camera } from "./source/camera/camera.js";
import { Renderer } from "./source/renderer.js";
import { Camera2D } from "./source/camera/types/camera2D.js";

export const ArmyCamera = function(positionX, positionY, width, height) {
    Camera2D.call(this, positionX, positionY, width, height);

    this.overlays = {
        [ArmyCamera.OVERLAY_TYPE_MOVE]: new Map(),
        [ArmyCamera.OVERLAY_TYPE_ATTACK]: new Map(),
        [ArmyCamera.OVERLAY_TYPE_RANGE]: new Map()
    };
}

ArmyCamera.OVERLAY_TYPE_MOVE = "MOVE";
ArmyCamera.OVERLAY_TYPE_ATTACK = "ATTACK";
ArmyCamera.OVERLAY_TYPE_RANGE = "RANGE";
ArmyCamera.MAP_OUTLINE_COLOR = "#dddddd";

ArmyCamera.prototype = Object.create(Camera2D.prototype);
ArmyCamera.prototype.constructor = ArmyCamera;

ArmyCamera.prototype.getOverlayKey = function(positionX, positionY) {
    return `${positionX}-${positionY}`;
}

ArmyCamera.prototype.addOverlay = function(overlayID, positionX, positionY, tileID) {
    const overlayType = this.overlays[overlayID];

    if(!overlayType) {
        return false;
    }

    const overlayKey = this.getOverlayKey(positionX, positionY);

    overlayType.set(overlayKey, {
        "x": positionX,
        "y": positionY,
        "id": tileID
    });

    return true;
}

ArmyCamera.prototype.removeOverlay = function(overlayID, positionX, positionY) {
    const overlayType = this.overlays[overlayID];

    if(!overlayType) {
        return false;
    }

    const overlayKey = this.getOverlayKey(positionX, positionY);

    overlayType.delete(overlayKey);

    return true;
}

ArmyCamera.prototype.clearOverlay = function(overlayID) {
    const overlayType = this.overlays[overlayID];

    if(!overlayType) {
        return false;
    }

    overlayType.clear();

    return true;
}

ArmyCamera.prototype.update = function(gameContext) {
    const { mapLoader, spriteManager, renderer } = gameContext;
    const activeMap = mapLoader.getActiveMap();

    if(!activeMap) {
        return;
    }

    const viewportBounds = this.getViewportBounds();
    const { startX, startY, endX, endY } = this.clampViewportBounds(viewportBounds);

    for(const layerConfig of activeMap.backgroundLayers) {
        this.drawTileLayer(gameContext, activeMap, layerConfig, startX, startY, endX, endY);
    }
    
    this.drawOverlay(gameContext);

    for(const layerID of spriteManager.layerStack) {
        const layer = spriteManager.layers[layerID];
        this.drawSpriteLayer(gameContext, layer);
    }

    /**
     * Draw range here. 
     */

    for(const layerConfig of activeMap.foregroundLayers) {
        this.drawTileLayer(gameContext, activeMap, layerConfig, startX, startY, endX, endY);
    }

    if((Renderer.DEBUG & Renderer.DEBUG_MAP) !== 0) {
        const { x, y } = this.getViewportPosition();
        const context = renderer.getContext();
        const typeLayer = activeMap.metaLayers[0];
        const teamLayer = activeMap.metaLayers[1];

        context.font = "16px Arial";
        context.textBaseline = "middle";
        context.textAlign = "center";
        context.fillStyle = "#ff0000";

        this.drawWithCallback(activeMap, typeLayer, startX, startY, endX, endY, (renderX, renderY, tileID) => {
            const drawX = renderX - x + 16;
            const drawY = renderY - y + 16;

            context.fillText(tileID, drawX, drawY);
        });

        this.drawWithCallback(activeMap, teamLayer, startX, startY, endX, endY, (renderX, renderY, tileID) => {
            const drawX = renderX - x - 16 + Camera.TILE_WIDTH;
            const drawY = renderY - y + 16;

            context.fillText(tileID, drawX, drawY);
        });

        this.drawMapOutlines(gameContext, activeMap.width, activeMap.height);
    }
}

ArmyCamera.prototype.drawOverlay = function(gameContext) {
    const { renderer, tileManager } = gameContext;
    const context = renderer.getContext();
    const { x: vX, y: vY} = this.getViewportPosition();

    for(const overlayKey in this.overlays) {
        const overlay = this.overlays[overlayKey];

        for(const [positionKey, overlayData] of overlay) {
            const { x, y, id } = overlayData;
            const renderX = Camera.TILE_WIDTH * x - vX;
            const renderY = Camera.TILE_HEIGHT * y - vY;
    
            tileManager.drawTileGraphics(id, context, renderX, renderY);
        }
    }
}

ArmyCamera.prototype.drawWithCallback = function(map2D, layerConfig, startX, startY, endX, endY, onDraw) {
    const { id, opacity } = layerConfig;

    if(!opacity) {
        return;
    }

    const width = map2D.width;
    const layer = map2D.layers[id];

    for(let i = startY; i <= endY; i++) {
        const renderY = i * Camera.TILE_HEIGHT;
        const row = i * width;

        for(let j = startX; j <= endX; j++) {
            const renderX = j * Camera.TILE_WIDTH;
            const index = row + j;
            const tileID = layer[index];

            onDraw(renderX, renderY, tileID);
        }
    }
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
        for(const sprite of visibleSprites) {
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
            const index = row + j;
            const tileID = layer[index];

            if(tileID === 0) {
                continue;
            }
            
            const renderX = j * Camera.TILE_WIDTH - x;

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