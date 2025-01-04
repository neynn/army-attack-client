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
    MorphSystem.toIdle(gameContext, attacker);
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
    MorphSystem.toAim(gameContext, attacker);
}

ControllerSystem.updateAttackers = function(gameContext, controller) {
    const mouseEntity = gameContext.getMouseEntity();
    const oldAttackers = controller.getAttackers();

    if(!mouseEntity) {
        AnimationSystem.revertToIdle(gameContext, oldAttackers);
        ControllerSystem.resetAttackers(gameContext, controller);
        return;
    }

    const isAttackable = TeamSystem.isEntityAttackable(gameContext, controller, mouseEntity);
    const isTargetable = TargetSystem.isTargetable(mouseEntity);

    if(!isAttackable || !isTargetable) {
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

    const nodeList = new Map();
    const entityID = entity.getID();
    const camera = renderer.getCamera(CAMERA_TYPES.ARMY_CAMERA);
    const nodes = PathfinderSystem.generateNodeList(gameContext, entity);
    const enableTileID = tileManager.getTileID("overlay", "grid_enabled_1x1");
    const attackTileID = tileManager.getTileID("overlay", "grid_attack_1x1");

    for(const node of nodes) {
        const { positionX, positionY, isValid } = node;
        const nodeKey = `${positionX}-${positionY}`;

        if(!isValid) {
            camera.addOverlay(ArmyCamera.OVERLAY_TYPE_MOVE, positionX, positionY, attackTileID);
            continue;
        } 

        const tileEntity = world.getTileEntity(positionX, positionY);

        if(!tileEntity) {
            camera.addOverlay(ArmyCamera.OVERLAY_TYPE_MOVE, positionX, positionY, enableTileID);
            nodeList.set(nodeKey, node);
            continue;
        }

        const isAttackable = TeamSystem.isEntityAttackable(gameContext, entity, tileEntity);

        if(!isAttackable) {
            //TODO: Show stop sign based on entities size!
            ConquerSystem.convertTileGraphics(gameContext, positionX, positionY, 0);
        }
    }

    controller.selectSingle(entityID);
    controller.setNodeList(nodeList);

    AnimationSystem.playSelect(gameContext, entity);
}

ControllerSystem.deselectEntity = function(gameContext, controller, entity) {
    const { renderer } = gameContext;
    const nodeList = controller.getNodeList();
    const camera = renderer.getCamera(CAMERA_TYPES.ARMY_CAMERA);

    camera.clearOverlay(ArmyCamera.OVERLAY_TYPE_MOVE);

    nodeList.forEach(node => {
        const { positionX, positionY } = node;
        
        ConquerSystem.convertTileGraphics(gameContext, positionX, positionY, 1);
    });

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