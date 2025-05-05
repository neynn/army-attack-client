import { Renderer } from "../source/renderer.js";
import { Camera2D } from "../source/camera/types/camera2D.js";
import { SpriteManager } from "../source/sprite/spriteManager.js";
import { PathfinderSystem } from "./systems/pathfinder.js";
import { Layer } from "../source/map/layer.js";
import { ArmyMap } from "./init/armyMap.js";

export const ArmyCamera = function() {
    Camera2D.call(this);

    this.createOverlay(ArmyCamera.OVERLAY_TYPE.ATTACK);
    this.createOverlay(ArmyCamera.OVERLAY_TYPE.MOVE);
    this.createOverlay(ArmyCamera.OVERLAY_TYPE.RANGE);
    this.postDraw = [];
    this.border = null;
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

ArmyCamera.prototype.resizeBorder = function(newWidth, newHeight) {
    if(this.border) {
        this.border.resize(newWidth, newHeight, 0);
    }
}

ArmyCamera.prototype.drawDebris = function(tileManager, context, worldMap) {
    const { graphics } = tileManager;
    const { debris } = worldMap;
    const debrisID = tileManager.getTileID("debris", "Debris_01");

    context.globalAlpha = 1;
    
    debris.forEach((item) => {
        const { type, x, y } = item;

        if(x >= this.startX && x <= this.endX && y >= this.startY && y <= this.endY) {
            const renderX = x * this.tileWidth - this.viewportX;
            const renderY = y * this.tileHeight - this.viewportY;

            graphics.drawTile(context, debrisID, renderX, renderY, 1, 1, this.tileWidth, this.tileHeight);
        }
    });
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

    this.updateWorldBounds();
    this.drawLayer(graphics, context, worldMap.getLayer(ArmyMap.LAYER.GROUND));
    this.drawLayer(graphics, context, this.border);
    this.drawLayer(graphics, context, worldMap.getLayer(ArmyMap.LAYER.DECORATION));
    this.drawDebris(tileManager, context, worldMap);
    this.drawOverlay(graphics, context, ArmyCamera.OVERLAY_TYPE.MOVE);
    this.drawOverlay(graphics, context, ArmyCamera.OVERLAY_TYPE.ATTACK);
    this.drawSpriteLayer(display, spriteManager.getLayer(SpriteManager.LAYER.BOTTOM), realTime, deltaTime);
    this.drawSpriteLayer(display, spriteManager.getLayer(SpriteManager.LAYER.MIDDLE), realTime, deltaTime);
    display.unflip();
    this.drawOverlay(graphics, context, ArmyCamera.OVERLAY_TYPE.RANGE);
    this.drawSpriteLayer(display, spriteManager.getLayer(SpriteManager.LAYER.TOP), realTime, deltaTime);
    this.drawSpriteLayer(display, spriteManager.getLayer(SpriteManager.LAYER.UI), realTime, deltaTime);
    display.unflip();
    this.drawLayer(graphics, context, worldMap.getLayer(ArmyMap.LAYER.CLOUD));

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
    this.drawBufferData(context, this.border.getBuffer(), scaleX, this.tileHeight - scaleY);

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

ArmyCamera.prototype.initBorder = function(gameContext) {
    const { tileManager } = gameContext;
    const { graphics } = tileManager;
    const bufferSize = this.mapWidth * this.mapHeight;
    const BufferType = graphics.getBufferType(bufferSize);
    const buffer = new BufferType(bufferSize);
    const layer = new Layer(buffer, this.mapWidth, this.mapHeight);

    this.border = layer;
}

ArmyCamera.prototype.updateBorder = function(borderID, tileX, tileY) {
    const index = tileY * this.mapWidth + tileX;

    this.border.setItem(borderID, index);
}