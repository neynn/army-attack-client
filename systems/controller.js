import { ControllerComponent } from "../components/controller.js";
import { PositionComponent } from "../components/position.js";
import { DirectionSystem } from "./direction.js";
import { SpriteComponent } from "../components/sprite.js";
import { ConquerSystem } from "./conquer.js";
import { PathfinderSystem } from "./pathfinder.js";
import { MorphSystem } from "./morph.js";
import { TargetSystem } from "./target.js";
import { TeamSystem } from "./team.js";
import { HealthComponent } from "../components/health.js";
import { MoveComponent } from "../components/move.js";

export const ControllerSystem = function() {}

ControllerSystem.MOVE_CURSOR_ID = "MOVE_CURSOR";

ControllerSystem.resetAttackerSprites = function(gameContext, attackers) {
    const { entityManager } = gameContext;

    for(const attackerID of attackers) {
        const attacker = entityManager.getEntity(attackerID);

        if(!attacker) {
            continue;
        }

        MorphSystem.toIdle(attacker);
    }
}

ControllerSystem.resetAttackerOverlays = function(gameContext, attackers) {
    const { entityManager, mapLoader } = gameContext;
    const layerTypes = gameContext.getConfig("layerTypes");
    const activeMap = mapLoader.getActiveMap();

    for(const attackerID of attackers) {
        const attacker = entityManager.getEntity(attackerID);

        if(!attacker) {
            continue;
        }

        const positionComponent = attacker.getComponent(PositionComponent);

        activeMap.clearTile(layerTypes.overlay.layerID, positionComponent.tileX, positionComponent.tileY);
    }
}

ControllerSystem.resetAttacker = function(gameContext, attackerID) {
    const { entityManager, mapLoader } = gameContext;
    const attacker = entityManager.getEntity(attackerID);

    if(!attacker) {
        return;
    }

    const layerTypes = gameContext.getConfig("layerTypes");
    const activeMap = mapLoader.getActiveMap();
    const positionComponent = attacker.getComponent(PositionComponent);

    activeMap.clearTile(layerTypes.overlay.layerID, positionComponent.tileX, positionComponent.tileY);
    MorphSystem.toIdle(attacker);
}

ControllerSystem.hightlightAttacker = function(gameContext, target, attackerID) {
    const { entityManager, mapLoader, tileManager } = gameContext;
    const attacker = entityManager.getEntity(attackerID);

    if(!attacker) {
        return;
    }

    const layerTypes = gameContext.getConfig("layerTypes");
    const activeMap = mapLoader.getActiveMap();
    const positionComponent = attacker.getComponent(PositionComponent);
    const tileID = tileManager.getTileID("overlay", "grid_attack_1x1");

    activeMap.placeTile(tileID, layerTypes.overlay.layerID, positionComponent.tileX, positionComponent.tileY);

    DirectionSystem.lookAt(attacker, target);
    MorphSystem.toAim(attacker);
}

ControllerSystem.updateAttackers = function(gameContext, controller) {
    const mouseEntity = gameContext.getMouseEntity();
    const controllerComponent = controller.getComponent(ControllerComponent);
    const oldAttackers = controllerComponent.attackers;

    if(!mouseEntity) {
        ControllerSystem.resetAttackerOverlays(gameContext, oldAttackers);
        ControllerSystem.resetAttackerSprites(gameContext, oldAttackers);
        controllerComponent.attackers.clear();
        return;
    }

    const isEnemy = TeamSystem.isEntityEnemy(gameContext, mouseEntity, controller);
    const isTargetable = TargetSystem.isTargetable(mouseEntity);

    if(!isEnemy || !isTargetable) {
        ControllerSystem.resetAttackerOverlays(gameContext, oldAttackers);
        ControllerSystem.resetAttackerSprites(gameContext, oldAttackers);
        controllerComponent.attackers.clear();
        return;
    }

    const updatedList = new Set();
    const newAttackers = TargetSystem.getAttackers(gameContext, mouseEntity);

    for(const attackerID of newAttackers) {
        ControllerSystem.hightlightAttacker(gameContext, mouseEntity, attackerID);
        updatedList.add(attackerID);
    }

    for(const attackerID of oldAttackers) {
        if(!updatedList.has(attackerID)) {
            ControllerSystem.resetAttacker(gameContext, attackerID);
        }
    }

    controllerComponent.attackers.clear();
    controllerComponent.attackers = updatedList;
}

ControllerSystem.updateSelectedEntity = function(gameContext, controller) {
    const { entityManager } = gameContext;
    const controllerComponent = controller.getComponent(ControllerComponent);
    const selectedEntity = entityManager.getEntity(controllerComponent.selectedEntity);

    if(!selectedEntity) {
        return;
    }

    const { x, y } = gameContext.getMouseTile();
    const positionComponent = selectedEntity.getComponent(PositionComponent);
    
    if(x !== positionComponent.tileX) {
        DirectionSystem.lookHorizontal(selectedEntity, x < positionComponent.tileX);
        MorphSystem.morphHorizontal(selectedEntity);
    }
}

ControllerSystem.selectEntity = function(gameContext, controller, entity) {
    const { client, spriteManager, tileManager, mapLoader, entityManager } = gameContext;
    const { soundPlayer } = client;
    const activeMap = mapLoader.getActiveMap();
    const nodeList = PathfinderSystem.generateNodeList(gameContext, entity);
    const layerTypes = gameContext.getConfig("layerTypes");
    const enableTileID = tileManager.getTileID("overlay", "grid_enabled_1x1");
    const attackTileID = tileManager.getTileID("overlay", "grid_attack_1x1");

    for(const node of nodeList) {
        const { positionX, positionY, isValid } = node;

        if(!isValid) {
            activeMap.placeTile(attackTileID, layerTypes.overlay.layerID, positionX, positionY);
            continue;
        } 

        const isEmpty = !activeMap.isTileOccupied(positionX, positionY);

        if(isEmpty) {
            activeMap.placeTile(enableTileID, layerTypes.overlay.layerID, positionX, positionY);
            continue;
        }

        const tileEntityID = activeMap.getFirstEntity(positionX, positionY);
        const tileEntity = entityManager.getEntity(tileEntityID);
        const isFriendly = TeamSystem.isEntityFriendly(gameContext, entity, tileEntity);

        if(isFriendly) {
            //TODO: Show stop sign based on entities size!
            ConquerSystem.convertTileGraphics(gameContext, positionX, positionY, 0);
        }
    }

    const controllerComponent = controller.getComponent(ControllerComponent);
    const spriteComponent = entity.getComponent(SpriteComponent);

    spriteManager.createChildSprite(spriteComponent.spriteID, "cursor_move_1x1", ControllerSystem.MOVE_CURSOR_ID);
    soundPlayer.playRandom(entity.config.sounds.select);

    controllerComponent.nodeList = nodeList;
    controllerComponent.selectedEntity = entity.id;
}

ControllerSystem.deselectEntity = function(gameContext, controller, entity) {
    const { spriteManager, mapLoader } = gameContext;
    const controllerComponent  = controller.getComponent(ControllerComponent);
    const layerTypes = gameContext.getConfig("layerTypes");
    const activeMap = mapLoader.getActiveMap();

    for(const node of controllerComponent.nodeList) {
        const {positionX, positionY} = node;

        activeMap.clearTile(layerTypes.overlay.layerID, positionX, positionY);
        ConquerSystem.convertTileGraphics(gameContext, positionX, positionY, 1);
    }

    const spriteComponent = entity.getComponent(SpriteComponent);

    spriteManager.destroyChildSprite(spriteComponent.spriteID, ControllerSystem.MOVE_CURSOR_ID);

    controllerComponent.selectedEntity = null;
    controllerComponent.nodeList = [];
}

ControllerSystem.isSelectable = function(entity, controller) {
    const entityID = entity.getID();
    const isControlled = controller.hasEntity(entityID);
    const healthComponent = entity.getComponent(HealthComponent);
    const isSelectable = entity.hasComponent(MoveComponent) && healthComponent.health > 0;
    const controllerComponent = controller.getComponent(ControllerComponent);

    return isSelectable && isControlled && controllerComponent.selectedEntity === null;
}