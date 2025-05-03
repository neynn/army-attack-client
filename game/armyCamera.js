import { Renderer } from "../source/renderer.js";
import { Camera2D } from "../source/camera/types/camera2D.js";
import { SpriteManager } from "../source/sprite/spriteManager.js";
import { PathfinderSystem } from "./systems/pathfinder.js";

export const ArmyCamera = function() {
    Camera2D.call(this);

    this.createOverlay(ArmyCamera.OVERLAY_TYPE.ATTACK);
    this.createOverlay(ArmyCamera.OVERLAY_TYPE.MOVE);
    this.createOverlay(ArmyCamera.OVERLAY_TYPE.RANGE);
    this.postDraw = [];
}

ArmyCamera.OVERLAY_TYPE = {
    ATTACK: "ATTACK",
    MOVE: "MOVE",
    RANGE: "RANGE"
};

ArmyCamera.prototype = Object.create(Camera2D.prototype);
ArmyCamera.prototype.constructor = ArmyCamera;

ArmyCamera.prototype.addPostDraw = function(onDraw) {
    if(typeof onDraw !== "function") {
        return;
    }

    this.postDraw.push(onDraw);
}

ArmyCamera.prototype.update = function(gameContext, display) {
    const { world, timer, spriteManager, tileManager } = gameContext;
    const { graphics } = tileManager;
    const { mapManager } = world;
    const worldMap = mapManager.getActiveMap();

    if(!worldMap) {
        return;
    }
    
    const { context } = display;
    const deltaTime = timer.getDeltaTime();
    const realTime = timer.getRealTime();
    const background = worldMap.getBackgroundLayers();
    const foreground = worldMap.getForegroundLayers();

    this.updateWorldBounds();

    for(let i = 0; i < background.length; i++) {
        const layer = worldMap.getLayer(background[i]);

        this.drawLayer(graphics, context, layer);
    }
    
    this.drawOverlay(graphics, context, ArmyCamera.OVERLAY_TYPE.MOVE);
    this.drawOverlay(graphics, context, ArmyCamera.OVERLAY_TYPE.ATTACK);
    this.drawSpriteLayer(display, spriteManager.getLayer(SpriteManager.LAYER.BOTTOM), realTime, deltaTime);
    this.drawSpriteLayer(display, spriteManager.getLayer(SpriteManager.LAYER.MIDDLE), realTime, deltaTime);
    display.unflip();
    this.drawOverlay(graphics, context, ArmyCamera.OVERLAY_TYPE.RANGE);
    this.drawSpriteLayer(display, spriteManager.getLayer(SpriteManager.LAYER.TOP), realTime, deltaTime);
    this.drawSpriteLayer(display, spriteManager.getLayer(SpriteManager.LAYER.UI), realTime, deltaTime);
    display.unflip();

    for(let i = 0; i < foreground.length; i++) {
        const layer = worldMap.getLayer(foreground[i]);

        this.drawLayer(graphics, context, layer);
    }

    if(Renderer.DEBUG.MAP) {
        this.debugMap(context, worldMap);
    }

    for(let i = 0; i < this.postDraw.length; i++) {
        this.postDraw[i](context);
    }
}

ArmyCamera.prototype.debugMap = function(context, worldMap) {
    const scaleX = Math.floor(this.tileWidth / 6);
    const scaleY = Math.floor(this.tileHeight / 6);

    context.globalAlpha = 1;
    context.font = `${scaleX}px Arial`;
    context.textBaseline = "middle";
    context.textAlign = "center";

    context.fillStyle = "#ff0000";
    this.drawBufferData(context, worldMap.getLayer("type").getBuffer(), scaleX, scaleY);

    context.fillStyle = "#00ff00";
    this.drawBufferData(context, worldMap.getLayer("team").getBuffer(), this.tileWidth - scaleX, scaleY);

    context.fillStyle = "#0000ff";
    this.drawBufferData(context, worldMap.getLayer("border").getBuffer(), scaleX, this.tileHeight - scaleY);

    context.fillStyle = "#ffff00";
    this.drawBufferData(context, worldMap.getLayer("ground").getBuffer(), this.tileWidth - scaleX, this.tileHeight - scaleY);

    this.drawMapOutlines(context);
}

ArmyCamera.prototype.updateMoveOverlay = function(gameContext, nodeList, enableTileID, attackTileID, ) {
    const { world } = gameContext;
    const showInvalidTiles = gameContext.settings.debug.showInvalidMoveTiles;

    this.clearOverlay(ArmyCamera.OVERLAY_TYPE.MOVE);

    for(let i = 0; i < nodeList.length; i++) {
        const { node, state } = nodeList[i];
        const { positionX, positionY } = node;

        if(state !== PathfinderSystem.NODE_STATE.VALID) {
            if(showInvalidTiles) {
                this.pushOverlay(ArmyCamera.OVERLAY_TYPE.MOVE, attackTileID, positionX, positionY);
            }

        } else {
            const tileEntity = world.getTileEntity(positionX, positionY);

            if(!tileEntity) {
                this.pushOverlay(ArmyCamera.OVERLAY_TYPE.MOVE, enableTileID, positionX, positionY);
            }
        } 
    }
}