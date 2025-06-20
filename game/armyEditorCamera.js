import { Renderer } from "../source/renderer.js";
import { Camera2D } from "../source/camera/types/camera2D.js";
import { SpriteManager } from "../source/sprite/spriteManager.js";
import { ArmyMap } from "./init/armyMap.js";
import { EditorButton } from "../source/map/editor/editorButton.js";

export const ArmyEditorCamera = function(controller) {
    Camera2D.call(this);

    this.controller = controller;
}

ArmyEditorCamera.OVERLAY_TYPE = {
    ATTACK: "ATTACK",
    MOVE: "MOVE",
    RANGE: "RANGE",
    FIRE_MISSION: "FIRE_MISSION"
};

ArmyEditorCamera.prototype = Object.create(Camera2D.prototype);
ArmyEditorCamera.prototype.constructor = ArmyEditorCamera;

ArmyEditorCamera.prototype.drawDebris = function(tileManager, context, worldMap) {
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

ArmyEditorCamera.prototype.update = function(gameContext, display) {
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
    this.drawLayer(graphics, context, worldMap.getLayer(ArmyMap.LAYER.DECORATION));
    this.drawDebris(tileManager, context, worldMap);
    this.drawSpriteLayer(display, spriteManager.getLayer(SpriteManager.LAYER.BOTTOM), realTime, deltaTime);
    this.drawSpriteLayer(display, spriteManager.getLayer(SpriteManager.LAYER.MIDDLE), realTime, deltaTime);
    display.unflip();
    this.drawSpriteLayer(display, spriteManager.getLayer(SpriteManager.LAYER.TOP), realTime, deltaTime);
    this.drawSpriteLayer(display, spriteManager.getLayer(SpriteManager.LAYER.UI), realTime, deltaTime);
    display.unflip();
    this.drawLayer(graphics, context, worldMap.getLayer(ArmyMap.LAYER.CLOUD));
    this.postDraw(gameContext, context);

    if(Renderer.DEBUG.MAP) {
        this.debugMap(context, worldMap);
    }
}

ArmyEditorCamera.prototype.debugMap = function(context, worldMap) {
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

    context.fillStyle = "#ffff00";
    this.drawBufferData(context, worldMap.getLayer("ground").getBuffer(), this.tileWidth - scaleX, this.tileHeight - scaleY);

    this.drawMapOutlines(context);
}

ArmyEditorCamera.prototype.postDraw = function(gameContext, context) {
    const { tileManager, transform2D } = gameContext;
    const { graphics } = tileManager;
    const button = this.controller.buttonHandler.getActiveButton();

    if(button && button.type !== EditorButton.TYPE.GRAPHICS) {
        return;
    }
    
    const { x, y } = gameContext.getMouseTile();
    const { width, height, halfWidth } = transform2D.getTileDimensions();

    context.globalAlpha = this.controller.overlayAlpha;
    context.fillStyle = this.controller.overlayColor;
    context.textAlign = "center";

    this.controller.editor.brush.paint(x, y, (j, i, id, name) => {
        const renderY = i * height - this.viewportY;
        const renderX = j * width - this.viewportX;

        this.drawTileEasy(graphics, id, context, renderX, renderY);

        context.fillText(name, renderX + halfWidth, renderY);  
    });
}