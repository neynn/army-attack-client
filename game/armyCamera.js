import { Renderer } from "../source/renderer.js";
import { OrthogonalCamera } from "../source/camera/types/orthogonalCamera.js";
import { SpriteManager } from "../source/graphics/spriteManager.js";

export const ArmyCamera = function() {
    OrthogonalCamera.call(this);

    this.controllerID = null;
    this.overlays = {
        [ArmyCamera.OVERLAY_TYPE_MOVE]: new Map(),
        [ArmyCamera.OVERLAY_TYPE_ATTACK]: new Map(),
        [ArmyCamera.OVERLAY_TYPE_RANGE]: new Map()
    };
}

ArmyCamera.OVERLAY_TYPE_MOVE = "MOVE";
ArmyCamera.OVERLAY_TYPE_ATTACK = "ATTACK";
ArmyCamera.OVERLAY_TYPE_RANGE = "RANGE";

ArmyCamera.prototype = Object.create(OrthogonalCamera.prototype);
ArmyCamera.prototype.constructor = ArmyCamera;

ArmyCamera.prototype.focusOn = function(controllerID) {
    this.controllerID = controllerID;
}

ArmyCamera.prototype.getFocus = function() {
    return this.controllerID;
}

ArmyCamera.prototype.getOverlayKey = function(positionX, positionY) {
    return `${positionX}-${positionY}`;
}

ArmyCamera.prototype.addOverlay = function(overlayID, positionX, positionY, tileID) {
    const overlayType = this.overlays[overlayID];

    if(!overlayType) {
        return;
    }

    const overlayKey = this.getOverlayKey(positionX, positionY);

    overlayType.set(overlayKey, {
        "x": positionX,
        "y": positionY,
        "id": tileID
    });
}

ArmyCamera.prototype.removeOverlay = function(overlayID, positionX, positionY) {
    const overlayType = this.overlays[overlayID];

    if(!overlayType) {
        return;
    }

    const overlayKey = this.getOverlayKey(positionX, positionY);

    overlayType.delete(overlayKey);
}

ArmyCamera.prototype.clearOverlay = function(overlayID) {
    const overlayType = this.overlays[overlayID];

    if(!overlayType) {
        return;
    }

    overlayType.clear();
}

ArmyCamera.prototype.update = function(gameContext) {
    const { world, renderer } = gameContext;
    const { mapManager } = world;
    const activeMap = mapManager.getActiveMap();

    if(!activeMap) {
        return;
    }

    const { background, foreground, layerConfig } = activeMap.meta;
    const viewportBounds = this.getWorldBounds();

    for(const layerID of background) {
        this.drawTileLayer(gameContext, activeMap, layerConfig[layerID], viewportBounds);
    }
    
    this.drawOverlay(gameContext, ArmyCamera.OVERLAY_TYPE_MOVE);
    this.drawOverlay(gameContext, ArmyCamera.OVERLAY_TYPE_ATTACK);
    this.drawSpriteLayers(gameContext, [SpriteManager.LAYER_BOTTOM, SpriteManager.LAYER_MIDDLE, SpriteManager.LAYER_TOP]);
    this.drawOverlay(gameContext, ArmyCamera.OVERLAY_TYPE_RANGE);

    for(const layerID of foreground) {
        this.drawTileLayer(gameContext, activeMap, layerConfig[layerID], viewportBounds);
    }

    if((Renderer.DEBUG & Renderer.DEBUG_MAP) !== 0) {
        const { x, y } = this.getViewportPosition();
        const context = renderer.getContext();
        const typeLayer = layerConfig["type"];
        const teamLayer = layerConfig["team"];

        context.font = "16px Arial";
        context.textBaseline = "middle";
        context.textAlign = "center";
        context.fillStyle = "#ff0000";

        this.drawWithCallback(activeMap, typeLayer, viewportBounds, (renderX, renderY, tileID) => {
            const drawX = renderX - x + 16;
            const drawY = renderY - y + 16;

            context.fillText(tileID, drawX, drawY);
        });

        this.drawWithCallback(activeMap, teamLayer, viewportBounds, (renderX, renderY, tileID) => {
            const drawX = renderX - x - 16 + this.tileWidth;
            const drawY = renderY - y + 16;

            context.fillText(tileID, drawX, drawY);
        });
        
        this.drawTileOutlines(context);
    }
}

ArmyCamera.prototype.drawOverlay = function(gameContext, overlayID) {
    const { x: vX, y: vY} = this.getViewportPosition();
    const overlay = this.overlays[overlayID];

    if(!overlay) {
        return;
    }

    for(const [overlayKey, overlayData] of overlay) {
        const { x, y, id } = overlayData;
        const renderX = this.tileWidth * x - vX;
        const renderY = this.tileHeight * y - vY;

        this.drawTileGraphics(gameContext, id, renderX, renderY);
    }
}

ArmyCamera.prototype.drawWithCallback = function(map2D, layerConfig, onDraw, viewportBounds) {
    const { startX, startY, endX, endY } = viewportBounds;
    const { id, opacity } = layerConfig;

    if(!opacity) {
        return;
    }

    const width = map2D.width;
    const layer = map2D.getLayer(id);

    for(let i = startY; i <= endY; i++) {
        const renderY = i * this.tileHeight;
        const row = i * width;

        for(let j = startX; j <= endX; j++) {
            const renderX = j * this.tileWidth;
            const index = row + j;
            const tileID = layer[index];

            onDraw(renderX, renderY, tileID);
        }
    }
}

ArmyCamera.prototype.drawSpriteLayers = function(gameContext, layerList) {
    const { timer, renderer, spriteManager } = gameContext;
    const { x, y } = this.getViewportPosition(); 
    const context = renderer.getContext();
    const realTime = timer.getRealTime();
    const deltaTime = timer.getDeltaTime();
    const viewportLeftEdge = this.viewportX;
    const viewportTopEdge = this.viewportY;
    const viewportRightEdge = viewportLeftEdge + this.getViewportWidth();
    const viewportBottomEdge = viewportTopEdge + this.getViewportHeight();

    for(let i = 0; i < layerList.length; i++) {
        const visibleSprites = [];
        const spriteLayer = spriteManager.getLayer(layerList[i]);

        if(!spriteLayer) {
            continue;
        }

        for(let j = 0; j < spriteLayer.length; j++) {
            const sprite = spriteLayer[j];
            const { x, y, w, h } = sprite.getBounds();
            const inBounds = x < viewportRightEdge && x + w > viewportLeftEdge && y < viewportBottomEdge && y + h > viewportTopEdge;
    
            if(inBounds) {
                visibleSprites.push(sprite);
            }
        }
    
        visibleSprites.sort((current, next) => current.position.y - next.position.y);
    
        for(let j = 0; j < visibleSprites.length; j++) {
            const sprite = visibleSprites[j];
    
            sprite.update(realTime, deltaTime);
            sprite.draw(context, x, y);
        }
    
        if((Renderer.DEBUG & Renderer.DEBUG_SPRITES) !== 0) {
            for(let j = 0; j < visibleSprites.length; j++) {
                const sprite = visibleSprites[j];
        
                sprite.debug(context, x, y);
            }
        }
    }
}

ArmyCamera.prototype.drawTileLayer = function(gameContext, map2D, layerConfig, viewportBounds) {
    const { startX, startY, endX, endY } = viewportBounds;
    const { id, opacity } = layerConfig;

    if(!opacity) {
        return;
    }

    const { renderer } = gameContext;
    const { x, y } = this.getViewportPosition();
    const context = renderer.getContext();
    const width = map2D.width;
    const layer = map2D.getLayer(id);

    context.globalAlpha = opacity;

    for(let i = startY; i <= endY; i++) {
        const renderY = i * this.tileHeight - y;
        const row = i * width;

        for(let j = startX; j <= endX; j++) {
            const index = row + j;
            const tileID = layer[index];

            if(tileID === 0) {
                continue;
            }
            
            const renderX = j * this.tileWidth - x;

            this.drawTileGraphics(gameContext, tileID, renderX, renderY);
        }
    }

    context.globalAlpha = 1;
}