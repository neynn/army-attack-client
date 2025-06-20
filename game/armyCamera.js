import { Renderer } from "../source/renderer.js";
import { Camera2D } from "../source/camera/types/camera2D.js";
import { SpriteManager } from "../source/sprite/spriteManager.js";
import { PathfinderSystem } from "./systems/pathfinder.js";
import { Layer } from "../source/map/layer.js";
import { ArmyMap } from "./init/armyMap.js";

export const ArmyCamera = function() {
    Camera2D.call(this);

    this.overlay.createOverlay(ArmyCamera.OVERLAY_TYPE.ATTACK);
    this.overlay.createOverlay(ArmyCamera.OVERLAY_TYPE.MOVE);
    this.overlay.createOverlay(ArmyCamera.OVERLAY_TYPE.RANGE);
    this.overlay.createOverlay(ArmyCamera.OVERLAY_TYPE.FIRE_MISSION);

    this.border = new Layer(0, 0);
    this.place = new Layer(0, 0);
}

ArmyCamera.OVERLAY_TYPE = {
    ATTACK: "ATTACK",
    MOVE: "MOVE",
    RANGE: "RANGE",
    FIRE_MISSION: "FIRE_MISSION"
};

ArmyCamera.prototype = Object.create(Camera2D.prototype);
ArmyCamera.prototype.constructor = ArmyCamera;

ArmyCamera.prototype.resizeBorder = function(newWidth, newHeight) {
    this.border.resize(newWidth, newHeight);
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

            this.drawTileEasy(graphics, debrisID, context, renderX, renderY);
        }
    });
}

ArmyCamera.prototype.drawDrops = function(display, worldMap, realTime, deltaTime) {
    const { drops } = worldMap;
    const dropElements = drops.drops;

    for(let i = 0; i < dropElements.length; i++) {
        const { sprite } = dropElements[i];

        if(sprite) {
            this.drawSprite(display, sprite, realTime, deltaTime);
        }
    }
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
    this.clampWorldBounds();
    this.drawLayer(graphics, context, worldMap.getLayer(ArmyMap.LAYER.GROUND));

    if(gameContext.settings.drawBorder) {
        this.drawLayer(graphics, context, this.border);
    }

    this.drawLayer(graphics, context, worldMap.getLayer(ArmyMap.LAYER.DECORATION));
    this.drawDebris(tileManager, context, worldMap);
    this.drawOverlay(graphics, context, ArmyCamera.OVERLAY_TYPE.MOVE);
    this.drawOverlay(graphics, context, ArmyCamera.OVERLAY_TYPE.ATTACK);
    this.drawSpriteLayer(display, spriteManager.getLayer(SpriteManager.LAYER.BOTTOM), realTime, deltaTime);
    this.drawSpriteLayer(display, spriteManager.getLayer(SpriteManager.LAYER.MIDDLE), realTime, deltaTime);
    display.unflip();
    this.drawLayer(graphics, context, this.place);
    this.drawOverlay(graphics, context, ArmyCamera.OVERLAY_TYPE.FIRE_MISSION);
    this.drawOverlay(graphics, context, ArmyCamera.OVERLAY_TYPE.RANGE);
    this.drawSpriteLayer(display, spriteManager.getLayer(SpriteManager.LAYER.TOP), realTime, deltaTime);
    this.drawSpriteLayer(display, spriteManager.getLayer(SpriteManager.LAYER.UI), realTime, deltaTime);
    this.drawDrops(display, worldMap, realTime, deltaTime);
    display.unflip();
    this.drawLayer(graphics, context, worldMap.getLayer(ArmyMap.LAYER.CLOUD));

    if(Renderer.DEBUG.MAP) {
        this.debugMap(context, worldMap);
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

ArmyCamera.prototype.initCustomLayers = function(gameContext) {
    const { tileManager } = gameContext;
    const { graphics } = tileManager;
    const containerCount = graphics.getContainerCount();

    this.border.initBuffer(containerCount);
    this.place.initBuffer(containerCount);
    this.onMapSizeSet();
}

ArmyCamera.prototype.onMapSizeSet = function() {
    this.border.resize(this.mapWidth, this.mapHeight);
    this.place.resize(this.mapWidth, this.mapHeight);
}

ArmyCamera.prototype.updateBorder = function(borderID, tileX, tileY) {
    const index = tileY * this.mapWidth + tileX;

    this.border.setItem(borderID, index);
}

ArmyCamera.prototype.clearPlace = function() {
    this.place.clear();
}