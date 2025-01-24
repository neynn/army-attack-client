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

ArmyCamera.prototype.update = function(gameContext, renderContext) {
    const { world } = gameContext;
    const { mapManager } = world;
    const worldMap = mapManager.getActiveMap();

    if(!worldMap) {
        return;
    }

    const { background, foreground, layerConfig } = worldMap.meta;
    const worldBounds = this.getWorldBounds();

    for(const layerID of background) {
        this.drawLayer(gameContext, renderContext, worldMap, layerConfig[layerID], worldBounds);
    }
    
    this.drawOverlay(gameContext, renderContext, ArmyCamera.OVERLAY_TYPE_MOVE);
    this.drawOverlay(gameContext, renderContext, ArmyCamera.OVERLAY_TYPE_ATTACK);
    this.drawSpriteLayers(gameContext, renderContext, [SpriteManager.LAYER.BOTTOM, SpriteManager.LAYER.MIDDLE, SpriteManager.LAYER.TOP]);
    this.drawOverlay(gameContext, renderContext, ArmyCamera.OVERLAY_TYPE_RANGE);

    for(const layerID of foreground) {
        this.drawLayer(gameContext, renderContext, worldMap, layerConfig[layerID], worldBounds);
    }

    if((Renderer.DEBUG.VALUE & Renderer.DEBUG.MAP) !== 0) {
        renderContext.font = "16px Arial";
        renderContext.textBaseline = "middle";
        renderContext.textAlign = "center";

        renderContext.fillStyle = "#ff0000";
        this.drawLayerData(renderContext, worldBounds, worldMap, "type", 16, 16);

        renderContext.fillStyle = "#00ff00";
        this.drawLayerData(renderContext, worldBounds, worldMap, "team", this.tileWidth - 16, 16);

        renderContext.fillStyle = "#0000ff";
        this.drawLayerData(renderContext, worldBounds, worldMap, "border", 16, this.tileHeight - 16);

        renderContext.fillStyle = "#ffff00";
        this.drawLayerData(renderContext, worldBounds, worldMap, "ground", this.tileWidth - 16, this.tileHeight - 16);

        this.drawTileOutlines(renderContext, worldBounds);
    }
}

ArmyCamera.prototype.drawLayerData = function(context, worldBounds, worldMap, layerID, offsetX, offsetY) {
    const layerConfig = worldMap.meta.layerConfig[layerID];
    const { id, opacity } = layerConfig;

    if(!opacity) {
        return;
    }

    const layer = worldMap.getLayer(id);

    this.drawCustom(worldBounds, (index, renderX, renderY) => {
        const tileID = layer[index];
        const drawX = renderX + offsetX;
        const drawY = renderY + offsetY;

        context.fillText(tileID, drawX, drawY);
    });
}

ArmyCamera.prototype.drawOverlay = function(gameContext, renderContext, overlayID) {
    const { tileManager } = gameContext;
    const overlay = this.overlays[overlayID];

    if(!overlay) {
        return;
    }

    for(const [overlayKey, overlayData] of overlay) {
        const renderX = this.tileWidth * overlayData.x - this.viewportX;
        const renderY = this.tileHeight * overlayData.y - this.viewportY;

        this.drawTileGraphics(tileManager, renderContext, overlayData.id, renderX, renderY);
    }
}

ArmyCamera.prototype.drawLayer = function(gameContext, renderContext, map2D, layerConfig, worldBounds) {
    const { id, opacity } = layerConfig;

    if(!opacity) {
        return;
    }

    const layer = map2D.getLayer(id);

    renderContext.globalAlpha = opacity;
    this.drawTileLayer(gameContext, renderContext, layer, worldBounds);
    renderContext.globalAlpha = 1;
}