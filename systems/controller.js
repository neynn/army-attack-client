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

ControllerSystem.resetAttackerSprites = function(gameContext, controller) {
    const { entityManager } = gameContext;
    const controllerComponent = controller.getComponent(ControllerComponent);

    for(const attackerID of controllerComponent.attackers) {
        const attacker = entityManager.getEntity(attackerID);

        if(!attacker) {
            continue;
        }

        MorphSystem.updateSprite(attacker, "idle");
    }
}

ControllerSystem.resetAttackerOverlay = function(gameContext, controller) {
    const { entityManager, mapLoader } = gameContext;
    const settings = gameContext.getConfig("settings");
    const activeMap = mapLoader.getActiveMap();
    const controllerComponent = controller.getComponent(ControllerComponent);

    for(const attackerID of controllerComponent.attackers) {
        const attacker = entityManager.getEntity(attackerID);

        if(!attacker) {
            continue;
        }

        const positionComponent = attacker.getComponent(PositionComponent);

        activeMap.clearTile(settings.overlayLayerID, positionComponent.tileX, positionComponent.tileY);
    }
}

ControllerSystem.hightlightAttackers = function(gameContext, target, attackers) {
    const { entityManager, mapLoader, tileManager } = gameContext;
    const settings = gameContext.getConfig("settings");
    const activeMap = mapLoader.getActiveMap();

    for(const attackerID of attackers) {
        const attacker = entityManager.getEntity(attackerID);

        if(!attacker) {
            continue;
        }

        const positionComponent = attacker.getComponent(PositionComponent);
        const tileID = tileManager.getTileID("overlay", "grid_attack_1x1");

        activeMap.placeTile(tileID, settings.overlayLayerID, positionComponent.tileX, positionComponent.tileY);

        DirectionSystem.lookAt(attacker, target);
        MorphSystem.morphDirectional(attacker, "aim", "aim_ne");
    }
}

ControllerSystem.updateAttackers = function(gameContext, controller) {
    const mouseEntity = gameContext.getMouseEntity();
    const controllerComponent = controller.getComponent(ControllerComponent);

    ControllerSystem.resetAttackerOverlay(gameContext, controller);
    ControllerSystem.resetAttackerSprites(gameContext, controller);
    
    if(!mouseEntity) {
        controllerComponent.attackers = [];
        return;
    }

    const isEnemy = TeamSystem.isEntityEnemy(gameContext, mouseEntity, controller);
    const isTargetable = TargetSystem.isTargetable(mouseEntity);

    if(!isEnemy || !isTargetable) {
        controllerComponent.attackers = [];
        return;
    }

    const attackers = TargetSystem.getAttackers(gameContext, mouseEntity);

    ControllerSystem.hightlightAttackers(gameContext, mouseEntity, attackers);

    controllerComponent.attackers = attackers;
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
    const controllerComponent  = controller.getComponent(ControllerComponent);

    if(controllerComponent.selectedEntity !== null) {
        console.log(`ControllerSystem.selectEntity was called while an entity was already selected!`);

        ControllerSystem.deselectEntity(gameContext, controller, entity);
    }

    const activeMap = mapLoader.getActiveMap();
    const nodeList = PathfinderSystem.generateNodeList(gameContext, entity);
    const settings = gameContext.getConfig("settings");
    const enableTileID = tileManager.getTileID("overlay", "grid_enabled_1x1");
    const attackTileID = tileManager.getTileID("overlay", "grid_attack_1x1");

    for(const node of nodeList) {
        const { positionX, positionY, isValid } = node;

        if(!isValid) {
            activeMap.placeTile(attackTileID, settings.overlayLayerID, positionX, positionY);
            continue;
        } 

        const isEmpty = !activeMap.isTileOccupied(positionX, positionY);

        if(isEmpty) {
            activeMap.placeTile(enableTileID, settings.overlayLayerID, positionX, positionY);
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

    const entitySpriteID = entity.getComponent(SpriteComponent).spriteID;

    spriteManager.createChildSprite(entitySpriteID, "cursor_move_1x1", "MOVE_CURSOR");
    soundPlayer.playRandom(entity.config.sounds.select);

    controllerComponent.nodeList = nodeList;
    controllerComponent.selectedEntity = entity.id;
}

ControllerSystem.deselectEntity = function(gameContext, controller, entity) {
    const { spriteManager, mapLoader } = gameContext;
    const settings = gameContext.getConfig("settings");
    const controllerComponent  = controller.getComponent(ControllerComponent);

    if(controllerComponent.selectedEntity === null) {
        return;
    }

    const activeMap = mapLoader.getActiveMap();

    for(const node of controllerComponent.nodeList) {
        const {positionX, positionY} = node;

        activeMap.clearTile(settings.overlayLayerID, positionX, positionY);
        ConquerSystem.convertTileGraphics(gameContext, positionX, positionY, 1);
    }

    const entitySpriteID = entity.getComponent(SpriteComponent).spriteID;
    spriteManager.removeChildSprite(entitySpriteID, "MOVE_CURSOR");
    controllerComponent.selectedEntity = null;
    controllerComponent.nodeList = [];
}

ControllerSystem.isSelectable = function(entity, controller) {
    const entityID = entity.getID();
    const isControlled = controller.hasEntity(entityID);
    const healthComponent = entity.getComponent(HealthComponent);
    const isSelectable = entity.hasComponent(MoveComponent) && healthComponent.health > 0;

    return isSelectable && isControlled;
}