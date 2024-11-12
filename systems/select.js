import { ControllerComponent } from "../components/controller.js";
import { HealthComponent } from "../components/health.js";
import { MoveComponent } from "../components/move.js";
import { SpriteComponent } from "../components/sprite.js";
import { ConquerSystem } from "./conquer.js";
import { PathfinderSystem } from "./pathfinder.js";

export const SelectSystem = function() {}

SelectSystem.isSelectable = function(entity) {
    const healthComponent = entity.getComponent(HealthComponent);
    return entity.hasComponent(MoveComponent) && healthComponent.health > 0;
}

SelectSystem.selectEntity = function(gameContext, controller, entity) {
    const { client, spriteManager, tileManager } = gameContext;
    const { soundPlayer } = client;
    const controllerComponent  = controller.getComponent(ControllerComponent);
    const nodeList = PathfinderSystem.generateNodeList(gameContext, entity);

    if(controllerComponent.selectedEntity !== null) {
        console.warn(`SelectSystem.selectEntity was called while an entity was already selected!`);
        SelectSystem.deselectEntity(gameContext, controller, entity);
    }

    const activeMap = gameContext.mapLoader.getActiveMap();
    const enableTileID = tileManager.getTileID("overlay", "grid_enabled_1x1");
    const attackTileID = tileManager.getTileID("overlay", "grid_attack_1x1");

    for(const node of nodeList) {
        const {positionX, positionY} = node;
        //TODO
        //if the node is valid and empty then put a walkable overlay.
        //if the node is valid and not empty then check the team types. 
            //if team is friendly, then put the stop sign.
            //if team is not friendly, then ignore.
        //if the node is not valid, ignore all -> not now for debugging.

        //flagging would be good.
        if(node.isValid) {
            if(PathfinderSystem.isEmpty(gameContext, positionX, positionY)) {
                activeMap.placeTile(enableTileID, "overlay", positionX, positionY);
            }
        } else {
            activeMap.placeTile(attackTileID, "overlay", positionX, positionY);
        }

        ConquerSystem.convertTileGraphics(gameContext, positionX, positionY, 0);
    }

    const entitySpriteID = entity.getComponent(SpriteComponent).spriteID;
    spriteManager.createChildSprite(entitySpriteID, "cursor_move_1x1", "MOVE_CURSOR");
    controllerComponent.nodeList = nodeList;
    controllerComponent.selectedEntity = entity.id;
    soundPlayer.playRandom(entity.config.sounds.select);
}

SelectSystem.deselectEntity = function(gameContext, controller, entity) {
    const { spriteManager } = gameContext;
    const controllerComponent  = controller.getComponent(ControllerComponent);

    if(controllerComponent.selectedEntity === null) {
        return;
    }

    const activeMap = gameContext.mapLoader.getActiveMap();

    for(const node of controllerComponent.nodeList) {
        const {positionX, positionY} = node;
        activeMap.clearTile("overlay", positionX, positionY);
        ConquerSystem.convertTileGraphics(gameContext, positionX, positionY, 1);
    }

    const entitySpriteID = entity.getComponent(SpriteComponent).spriteID;
    spriteManager.removeChildSprite(entitySpriteID, "MOVE_CURSOR");
    controllerComponent.selectedEntity = null;
    controllerComponent.nodeList = [];
}