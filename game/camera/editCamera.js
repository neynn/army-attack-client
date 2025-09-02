import { EditorButton } from "../../source/map/editor/editorButton.js";
import { Renderer } from "../../source/renderer.js";
import { SpriteManager } from "../../source/sprite/spriteManager.js";
import { ArmyCamera } from "../armyCamera.js";
import { ArmyMap } from "../init/armyMap.js";

export const EditCamera = function(controller) {
    ArmyCamera.call(this);

    this.controller = controller;
}

EditCamera.prototype = Object.create(ArmyCamera.prototype);
EditCamera.prototype.constructor = EditCamera;

EditCamera.prototype.update = function(gameContext, display) {
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
    this.floorRenderCoordinates();
    this.drawLayer(graphics, display, worldMap.getLayer(ArmyMap.LAYER.GROUND));
    this.drawLayer(graphics, display, worldMap.getLayer(ArmyMap.LAYER.DECORATION));
    this.drawDebris(gameContext, context, worldMap);
    this.drawSpriteBatch(display, spriteManager.getLayer(SpriteManager.LAYER.BOTTOM), realTime, deltaTime);
    this.drawSpriteBatch(display, spriteManager.getLayer(SpriteManager.LAYER.MIDDLE), realTime, deltaTime);
    this.drawSpriteBatch(display, spriteManager.getLayer(SpriteManager.LAYER.TOP), realTime, deltaTime);
    this.drawSpriteBatch(display, spriteManager.getLayer(SpriteManager.LAYER.UI), realTime, deltaTime);
    this.drawLayer(graphics, display, worldMap.getLayer(ArmyMap.LAYER.CLOUD));
    this.drawHoverTile(gameContext, context);

    if(Renderer.DEBUG.MAP) {
        this.debugMap(context, worldMap);
    }
}

EditCamera.prototype.debugMap = function(context, worldMap) {
    const scaleX = this.tileWidth / 6;
    const scaleY = this.tileHeight / 6;

    context.globalAlpha = 1;
    context.font = `${scaleX}px Arial`;
    context.textBaseline = "middle";
    context.textAlign = "center";

    context.fillStyle = "#ff0000";
    this.drawBufferData(context, worldMap.getLayer(ArmyMap.LAYER.TYPE).buffer, scaleX, scaleY);

    context.fillStyle = "#00ff00";
    this.drawBufferData(context, worldMap.getLayer(ArmyMap.LAYER.TEAM).buffer, this.tileWidth - scaleX, scaleY);

    context.fillStyle = "#ffff00";
    this.drawBufferData(context, worldMap.getLayer(ArmyMap.LAYER.GROUND).buffer, this.tileWidth - scaleX, this.tileHeight - scaleY);

    this.drawMapOutlines(context);
}

EditCamera.prototype.drawHoverTile = function(gameContext, context) {
    const { tileManager, transform2D } = gameContext;
    const { graphics } = tileManager;
    const button = this.controller.buttonHandler.getActiveButton();

    if(button) {
        const { x, y } = gameContext.getMouseTile();
        const { width, height, halfWidth } = transform2D.getTileDimensions();

        context.globalAlpha = this.controller.overlayAlpha;
        context.fillStyle = this.controller.overlayColor;
        context.textAlign = "center";

        this.controller.editor.brush.paint(x, y, (j, i, id, name) => {
            const renderY = i * height - this.screenY;
            const renderX = j * width - this.screenX;

            this.drawTileSafe(graphics, id, context, renderX, renderY);

            context.fillText(name, renderX + halfWidth, renderY);  
        });
    }
}