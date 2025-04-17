import { Renderer } from "../source/renderer.js";
import { OrthogonalCamera } from "../source/camera/types/orthogonalCamera.js";
import { SpriteManager } from "../source/sprite/spriteManager.js";

export const ArmyCamera = function() {
    OrthogonalCamera.call(this);

    this.overlays[ArmyCamera.OVERLAY_TYPE.ATTACK] = [];
    this.overlays[ArmyCamera.OVERLAY_TYPE.MOVE] = [];
    this.overlays[ArmyCamera.OVERLAY_TYPE.RANGE] = [];
    this.postDraw = [];
}

ArmyCamera.OVERLAY_TYPE = {
    ATTACK: 0,
    MOVE: 1,
    RANGE: 2
};

ArmyCamera.prototype = Object.create(OrthogonalCamera.prototype);
ArmyCamera.prototype.constructor = ArmyCamera;

ArmyCamera.prototype.handlePostDraw = function(context) {
    for(let i = 0; i < this.postDraw.length; i++) {
        this.postDraw[i](context);
    }
}

ArmyCamera.prototype.addPostDraw = function(onDraw) {
    if(typeof onDraw !== "function") {
        return;
    }

    this.postDraw.push(onDraw);
}

ArmyCamera.prototype.update = function(gameContext, renderContext) {
    const { world, timer, spriteManager } = gameContext;
    const { mapManager } = world;
    const worldMap = mapManager.getActiveMap();

    if(!worldMap) {
        return;
    }
    
    const deltaTime = timer.getDeltaTime();
    const realTime = timer.getRealTime();
    const background = worldMap.getBackgroundLayers();
    const foreground = worldMap.getForegroundLayers();

    this.updateWorldBounds();

    for(let i = 0; i < background.length; i++) {
        const layer = worldMap.getLayer(background[i]);

        this.drawLayer(gameContext, renderContext, layer);
    }
    
    this.drawOverlay(gameContext, renderContext, ArmyCamera.OVERLAY_TYPE.MOVE);
    this.drawOverlay(gameContext, renderContext, ArmyCamera.OVERLAY_TYPE.ATTACK);
    this.drawSpriteLayer(renderContext, spriteManager.getLayer(SpriteManager.LAYER.BOTTOM), realTime, deltaTime);
    this.drawSpriteLayer(renderContext, spriteManager.getLayer(SpriteManager.LAYER.MIDDLE), realTime, deltaTime);
    this.drawOverlay(gameContext, renderContext, ArmyCamera.OVERLAY_TYPE.RANGE);
    this.drawSpriteLayer(renderContext, spriteManager.getLayer(SpriteManager.LAYER.TOP), realTime, deltaTime);
    this.drawSpriteLayer(renderContext, spriteManager.getLayer(SpriteManager.LAYER.UI), realTime, deltaTime);

    for(let i = 0; i < foreground.length; i++) {
        const layer = worldMap.getLayer(foreground[i]);

        this.drawLayer(gameContext, renderContext, layer);
    }

    if(Renderer.DEBUG.MAP) {
        const scaleX = Math.floor(this.tileWidth / 6);
        const scaleY = Math.floor(this.tileHeight / 6);

        renderContext.font = `${scaleX}px Arial`;
        renderContext.textBaseline = "middle";
        renderContext.textAlign = "center";

        renderContext.fillStyle = "#ff0000";
        this.drawBufferData(renderContext, worldMap.getLayer("type").getBuffer(), scaleX, scaleY);

        renderContext.fillStyle = "#00ff00";
        this.drawBufferData(renderContext, worldMap.getLayer("team").getBuffer(), this.tileWidth - scaleX, scaleY);

        renderContext.fillStyle = "#0000ff";
        this.drawBufferData(renderContext, worldMap.getLayer("border").getBuffer(), scaleX, this.tileHeight - scaleY);

        renderContext.fillStyle = "#ffff00";
        this.drawBufferData(renderContext, worldMap.getLayer("ground").getBuffer(), this.tileWidth - scaleX, this.tileHeight - scaleY);

        this.drawMapOutlines(renderContext);
    }

    this.handlePostDraw(renderContext);
}