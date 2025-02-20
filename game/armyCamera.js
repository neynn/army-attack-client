import { Renderer } from "../source/renderer.js";
import { OrthogonalCamera } from "../source/camera/types/orthogonalCamera.js";
import { SpriteManager } from "../source/graphics/spriteManager.js";

export const ArmyCamera = function() {
    OrthogonalCamera.call(this);

    this.overlays[ArmyCamera.OVERLAY_TYPE.ATTACK] = [];
    this.overlays[ArmyCamera.OVERLAY_TYPE.MOVE] = [];
    this.overlays[ArmyCamera.OVERLAY_TYPE.RANGE] = [];
}

ArmyCamera.OVERLAY_TYPE = {
    ATTACK: 0,
    MOVE: 1,
    RANGE: 2
};

ArmyCamera.prototype = Object.create(OrthogonalCamera.prototype);
ArmyCamera.prototype.constructor = ArmyCamera;

ArmyCamera.prototype.update = function(gameContext, renderContext) {
    const { world } = gameContext;
    const { mapManager } = world;
    const worldMap = mapManager.getActiveMap();

    if(!worldMap) {
        return;
    }

    const { background, foreground, layers } = worldMap.getGraphicsSettings();
    const worldBounds = this.getWorldBounds();

    for(const layerID of background) {
        this.drawLayer(gameContext, renderContext, worldMap, layers[layerID], worldBounds);
    }
    
    this.drawOverlay(gameContext, renderContext, worldBounds, ArmyCamera.OVERLAY_TYPE.MOVE);
    this.drawOverlay(gameContext, renderContext, worldBounds, ArmyCamera.OVERLAY_TYPE.ATTACK);
    this.drawSpriteLayer(gameContext, renderContext, SpriteManager.LAYER.BOTTOM);
    this.drawSpriteLayer(gameContext, renderContext, SpriteManager.LAYER.MIDDLE);
    this.drawOverlay(gameContext, renderContext, worldBounds, ArmyCamera.OVERLAY_TYPE.RANGE);
    this.drawSpriteLayer(gameContext, renderContext, SpriteManager.LAYER.TOP);
    this.drawSpriteLayer(gameContext, renderContext, SpriteManager.LAYER.UI);

    for(const layerID of foreground) {
        this.drawLayer(gameContext, renderContext, worldMap, layers[layerID], worldBounds);
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
    const { layers } = worldMap.getGraphicsSettings();
    const { id, opacity } = layers[layerID];

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

ArmyCamera.prototype.drawLayer = function(gameContext, renderContext, map2D, layerSettings, worldBounds) {
    const { id, opacity } = layerSettings;

    if(!opacity) {
        return;
    }

    const layer = map2D.getLayer(id);

    renderContext.globalAlpha = opacity;
    this.drawTileLayer(gameContext, renderContext, layer, worldBounds);
    renderContext.globalAlpha = 1;
}