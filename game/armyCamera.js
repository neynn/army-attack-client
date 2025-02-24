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
    
    const background = worldMap.getBackgroundLayers();
    const foreground = worldMap.getForegroundLayers();
    const worldBounds = this.getWorldBounds();

    for(let i = 0; i < background.length; i++) {
        const layer = worldMap.getLayer(background[i]);

        this.drawLayer(gameContext, renderContext, layer, worldBounds);
    }
    
    this.drawOverlay(gameContext, renderContext, worldBounds, ArmyCamera.OVERLAY_TYPE.MOVE);
    this.drawOverlay(gameContext, renderContext, worldBounds, ArmyCamera.OVERLAY_TYPE.ATTACK);
    this.drawSpriteLayer(gameContext, renderContext, SpriteManager.LAYER.BOTTOM);
    this.drawSpriteLayer(gameContext, renderContext, SpriteManager.LAYER.MIDDLE);
    this.drawOverlay(gameContext, renderContext, worldBounds, ArmyCamera.OVERLAY_TYPE.RANGE);
    this.drawSpriteLayer(gameContext, renderContext, SpriteManager.LAYER.TOP);
    this.drawSpriteLayer(gameContext, renderContext, SpriteManager.LAYER.UI);

    for(let i = 0; i < foreground.length; i++) {
        const layer = worldMap.getLayer(foreground[i]);

        this.drawLayer(gameContext, renderContext, layer, worldBounds);
    }

    if(Renderer.DEBUG.MAP) {
        renderContext.font = "16px Arial";
        renderContext.textBaseline = "middle";
        renderContext.textAlign = "center";

        renderContext.fillStyle = "#ff0000";
        this.drawLayerData(renderContext, worldBounds, worldMap.getLayer("type"), 16, 16);

        renderContext.fillStyle = "#00ff00";
        this.drawLayerData(renderContext, worldBounds, worldMap.getLayer("team"), this.tileWidth - 16, 16);

        renderContext.fillStyle = "#0000ff";
        this.drawLayerData(renderContext, worldBounds, worldMap.getLayer("border"), 16, this.tileHeight - 16);

        renderContext.fillStyle = "#ffff00";
        this.drawLayerData(renderContext, worldBounds, worldMap.getLayer("ground"), this.tileWidth - 16, this.tileHeight - 16);

        this.drawTileOutlines(renderContext, worldBounds);
    }
}

ArmyCamera.prototype.drawLayerData = function(context, worldBounds, layer, offsetX, offsetY) {
    const { startX, startY, endX, endY } = worldBounds;
    const drawX = offsetX - this.viewportX;
    const drawY = offsetY - this.viewportY;
    const buffer = layer.getBuffer();

    for(let i = startY; i <= endY; i++) {
        const renderY = i * this.tileHeight + drawY;
        const tileRow = i * this.mapWidth;

        for(let j = startX; j <= endX; j++) {
            const renderX = j * this.tileWidth + drawX;
            const index = tileRow + j;
            const tileID = buffer[index];

            context.fillText(tileID, renderX, renderY);
        }
    }
}