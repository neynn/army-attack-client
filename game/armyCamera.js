import { Renderer } from "../source/renderer.js";
import { OrthogonalCamera } from "../source/camera/types/orthogonalCamera.js";
import { SpriteManager } from "../source/sprite/spriteManager.js";

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
        const scaleX = Math.floor(this.tileWidth / 6);
        const scaleY = Math.floor(this.tileHeight / 6);

        renderContext.font = `${scaleX}px Arial`;
        renderContext.textBaseline = "middle";
        renderContext.textAlign = "center";

        renderContext.fillStyle = "#ff0000";
        this.drawBufferData(renderContext, worldBounds, worldMap.getLayer("type").getBuffer(), scaleX, scaleY);

        renderContext.fillStyle = "#00ff00";
        this.drawBufferData(renderContext, worldBounds, worldMap.getLayer("team").getBuffer(), this.tileWidth - scaleX, scaleY);

        renderContext.fillStyle = "#0000ff";
        this.drawBufferData(renderContext, worldBounds, worldMap.getLayer("border").getBuffer(), scaleX, this.tileHeight - scaleY);

        renderContext.fillStyle = "#ffff00";
        this.drawBufferData(renderContext, worldBounds, worldMap.getLayer("ground").getBuffer(), this.tileWidth - scaleX, this.tileHeight - scaleY);

        this.drawMapOutlines(renderContext, worldBounds);
    }
}