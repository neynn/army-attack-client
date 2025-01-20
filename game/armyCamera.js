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
    const worldBounds = this.getWorldBounds();

    for(const layerID of background) {
        this.drawLayer(gameContext, activeMap, layerConfig[layerID], worldBounds);
    }
    
    this.drawOverlay(gameContext, ArmyCamera.OVERLAY_TYPE_MOVE);
    this.drawOverlay(gameContext, ArmyCamera.OVERLAY_TYPE_ATTACK);
    this.drawSpriteLayers(gameContext, [SpriteManager.LAYER_BOTTOM, SpriteManager.LAYER_MIDDLE, SpriteManager.LAYER_TOP]);
    this.drawOverlay(gameContext, ArmyCamera.OVERLAY_TYPE_RANGE);

    for(const layerID of foreground) {
        this.drawLayer(gameContext, activeMap, layerConfig[layerID], worldBounds);
    }

    if((Renderer.DEBUG & Renderer.DEBUG_MAP) !== 0) {
        const context = renderer.getContext();
        const typeLayer = layerConfig["type"];
        const teamLayer = layerConfig["team"];

        context.font = "16px Arial";
        context.textBaseline = "middle";
        context.textAlign = "center";
        context.fillStyle = "#ff0000";

        this.drawWithCallback(activeMap, typeLayer, worldBounds, (tileID, renderX, renderY) => {
            const drawX = renderX + 16;
            const drawY = renderY + 16;

            context.fillText(tileID, drawX, drawY);
        });

        this.drawWithCallback(activeMap, teamLayer, worldBounds, (tileID, renderX, renderY) => {
            const drawX = renderX - 16 + this.tileWidth;
            const drawY = renderY + 16;

            context.fillText(tileID, drawX, drawY);
        });
        
        this.drawTileOutlines(context);
    }
}

ArmyCamera.prototype.drawOverlay = function(gameContext, overlayID) {
    const { tileManager, renderer } = gameContext;
    const context = renderer.getContext();
    const { x, y } = this.getViewportPosition();
    const overlay = this.overlays[overlayID];

    if(!overlay) {
        return;
    }

    for(const [overlayKey, overlayData] of overlay) {
        const renderX = this.tileWidth * overlayData.x - x;
        const renderY = this.tileHeight * overlayData.y - y;

        this.drawTileGraphics(tileManager, context, overlayData.id, renderX, renderY);
    }
}

ArmyCamera.prototype.drawWithCallback = function(map2D, layerConfig, worldBounds, onDraw) {
    const { id, opacity } = layerConfig;

    if(!opacity) {
        return;
    }

    const layer = map2D.getLayer(id);
    this.drawCustomLayer(layer, worldBounds, onDraw);
}

ArmyCamera.prototype.drawLayer = function(gameContext, map2D, layerConfig, worldBounds) {
    const { id, opacity } = layerConfig;

    if(!opacity) {
        return;
    }

    const { renderer } = gameContext;
    const context = renderer.getContext();
    const layer = map2D.getLayer(id);

    context.globalAlpha = opacity;
    this.drawTileLayer(gameContext, layer, worldBounds);
    context.globalAlpha = 1;
}