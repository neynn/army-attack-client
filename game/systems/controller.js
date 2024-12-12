import { PositionComponent } from "../components/position.js";
import { DirectionSystem } from "./direction.js";
import { ConquerSystem } from "./conquer.js";
import { PathfinderSystem } from "./pathfinder.js";
import { MorphSystem } from "./morph.js";
import { TargetSystem } from "./target.js";
import { TeamSystem } from "./team.js";
import { HealthComponent } from "../components/health.js";
import { MoveComponent } from "../components/move.js";
import { AnimationSystem } from "./animation.js";
import { CAMERA_TYPES } from "../enums.js";
import { ArmyCamera } from "../armyCamera.js";

export const ControllerSystem = function() {}

ControllerSystem.resetAttackers = function(gameContext, controller) {
    const { renderer } = gameContext;
    const camera = renderer.getCamera(CAMERA_TYPES.ARMY_CAMERA);

    camera.clearOverlay(ArmyCamera.OVERLAY_TYPE_ATTACK);
    controller.clearAttackers();
}

ControllerSystem.resetAttacker = function(gameContext, attackerID) {
    const { world, renderer } = gameContext;
    const { entityManager } = world;
    const attacker = entityManager.getEntity(attackerID);

    if(!attacker) {
        return;
    }

    const camera = renderer.getCamera(CAMERA_TYPES.ARMY_CAMERA);
    const positionComponent = attacker.getComponent(PositionComponent);

    camera.removeOverlay(ArmyCamera.OVERLAY_TYPE_ATTACK, positionComponent.tileX, positionComponent.tileY);
    MorphSystem.toIdle(attacker);
}

ControllerSystem.hightlightAttacker = function(gameContext, target, attackerID) {
    const { world, tileManager, renderer } = gameContext;
    const { entityManager } = world;
    const attacker = entityManager.getEntity(attackerID);

    if(!attacker) {
        return;
    }

    const camera = renderer.getCamera(CAMERA_TYPES.ARMY_CAMERA);
    const positionComponent = attacker.getComponent(PositionComponent);
    const tileID = tileManager.getTileID("overlay", "grid_attack_1x1");

    camera.addOverlay(ArmyCamera.OVERLAY_TYPE_ATTACK, positionComponent.tileX, positionComponent.tileY, tileID);
    DirectionSystem.lookAt(attacker, target);
    MorphSystem.toAim(attacker);
}

ControllerSystem.updateAttackers = function(gameContext, controller) {
    const mouseEntity = gameContext.getMouseEntity();
    const oldAttackers = controller.getAttackers();

    if(!mouseEntity) {
        AnimationSystem.revertToIdle(gameContext, oldAttackers);
        ControllerSystem.resetAttackers(gameContext, controller);
        return;
    }

    const isEnemy = TeamSystem.isEntityEnemy(gameContext, mouseEntity, controller);
    const isTargetable = TargetSystem.isTargetable(mouseEntity);

    if(!isEnemy || !isTargetable) {
        AnimationSystem.revertToIdle(gameContext, oldAttackers);
        ControllerSystem.resetAttackers(gameContext, controller);
        return;
    }

    const newAttackers = new Set(TargetSystem.getAttackers(gameContext, mouseEntity));

    for(const attackerID of newAttackers) {
        ControllerSystem.hightlightAttacker(gameContext, mouseEntity, attackerID);
    }

    for(const attackerID of oldAttackers) {
        if(!newAttackers.has(attackerID)) {
            ControllerSystem.resetAttacker(gameContext, attackerID);
        }
    }

    controller.setAttackers(newAttackers);
}

ControllerSystem.selectEntity = function(gameContext, controller, entity) {
    const { tileManager, world, renderer } = gameContext;
    const { mapManager, entityManager } = world;
    const camera = renderer.getCamera(CAMERA_TYPES.ARMY_CAMERA);
    const activeMap = mapManager.getActiveMap();
    const nodeList = PathfinderSystem.generateNodeList(gameContext, entity);
    const enableTileID = tileManager.getTileID("overlay", "grid_enabled_1x1");
    const attackTileID = tileManager.getTileID("overlay", "grid_attack_1x1");
    const entityID = entity.getID();
    const controllerNodeList = new Map();

    for(const node of nodeList) {
        const { positionX, positionY, isValid } = node;
        const nodeKey = `${positionX}-${positionY}`;

        if(!isValid) {
            camera.addOverlay(ArmyCamera.OVERLAY_TYPE_MOVE, positionX, positionY, attackTileID);
            continue;
        } 

        const isEmpty = !activeMap.isTileOccupied(positionX, positionY);

        if(isEmpty) {
            camera.addOverlay(ArmyCamera.OVERLAY_TYPE_MOVE, positionX, positionY, enableTileID);
            controllerNodeList.set(nodeKey, node);
            continue;
        }

        const tileEntityID = activeMap.getTopEntity(positionX, positionY);
        const tileEntity = entityManager.getEntity(tileEntityID);
        const isFriendly = TeamSystem.isEntityFriendly(gameContext, entity, tileEntity);

        if(isFriendly) {
            //TODO: Show stop sign based on entities size!
            ConquerSystem.convertTileGraphics(gameContext, positionX, positionY, 0);
        }
    }

    controller.selectSingle(entityID);
    controller.setNodeList(controllerNodeList);
    AnimationSystem.playSelect(gameContext, entity);
}

ControllerSystem.deselectEntity = function(gameContext, controller, entity) {
    const { renderer } = gameContext;
    const controllerNodeList = controller.getNodeList();
    const camera = renderer.getCamera(CAMERA_TYPES.ARMY_CAMERA);

    camera.clearOverlay(ArmyCamera.OVERLAY_TYPE_MOVE);

    for(const [nodeKey, node] of controllerNodeList) {
        const { positionX, positionY } = node;
        ConquerSystem.convertTileGraphics(gameContext, positionX, positionY, 1);
    }

    controller.deselectAll();
    controller.clearNodeList();
    AnimationSystem.stopSelect(gameContext, entity)
}

ControllerSystem.isMoveable = function(entity, controller) {
    const healthComponent = entity.getComponent(HealthComponent);
    const isSelectable = entity.hasComponent(MoveComponent) && healthComponent.health > 0;
    const selectedEntityID = controller.getFirstSelected();

    return isSelectable && selectedEntityID === null;
}