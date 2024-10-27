import { ControllerComponent } from "../components/controller.js";
import { PositionComponent } from "../components/position.js";
import { DirectionSystem } from "./direction.js";
import { MorphSystem } from "./morph.js";
import { TargetSystem } from "./target.js";
import { TeamSystem } from "./team.js";

export const ControllerSystem = function() {}

ControllerSystem.clearAttackers = function(gameContext) {
    const { controller, entityManager, mapLoader } = gameContext;
    const settings = gameContext.getConfig("settings");
    const activeMap = mapLoader.getActiveMap();
    const controllerComponent = controller.getComponent(ControllerComponent);

    for(const attackerID of controllerComponent.attackers) {
        const attacker = entityManager.getEntity(attackerID);

        if(!attacker) {
            continue;
        }

        const positionComponent = attacker.getComponent(PositionComponent);
        activeMap.placeTile(null, settings.overlayLayerID, positionComponent.tileX, positionComponent.tileY);

        MorphSystem.updateSprite(attacker, "idle");
    }
}

ControllerSystem.hightlightAttackers = function(gameContext, target, attackers) {
    const { controller, entityManager, mapLoader } = gameContext;
    const settings = gameContext.getConfig("settings");
    const activeMap = mapLoader.getActiveMap();
    const controllerComponent = controller.getComponent(ControllerComponent);

    controllerComponent.attackers = attackers;

    for(const attackerID of attackers) {
        const attacker = entityManager.getEntity(attackerID);

        if(!attacker) {
            continue;
        }

        const positionComponent = attacker.getComponent(PositionComponent);
        activeMap.placeTile(["overlay", "grid_attack_1x1"], settings.overlayLayerID, positionComponent.tileX, positionComponent.tileY);

        DirectionSystem.lookAt(attacker, target);
        MorphSystem.morphDirectional(attacker, "aim", "aim_ne");
    }
}

ControllerSystem.updateAttackers = function(gameContext) {
    const { controller } = gameContext;
    const { x, y } = gameContext.getViewportTilePosition();
    const tileEntity = gameContext.getTileEntity(x, y);

    ControllerSystem.clearAttackers(gameContext);

    if(!tileEntity) {
        return;
    }

    const isEnemy = TeamSystem.isEntityEnemy(gameContext, tileEntity, controller);
    const isTargetable = TargetSystem.isTargetable(tileEntity);

    if(!isEnemy || !isTargetable) {
        return;
    }

    const attackers = TargetSystem.getAttackers(gameContext, tileEntity);
    
    ControllerSystem.hightlightAttackers(gameContext, tileEntity, attackers);
}

ControllerSystem.updateSelectedEntity = function(gameContext) {
    const { entityManager, controller } = gameContext;
    const controllerComponent = controller.getComponent(ControllerComponent);
    const selectedEntity = entityManager.getEntity(controllerComponent.selectedEntity);

    if(!selectedEntity) {
        return;
    }

    const positionComponent = selectedEntity.getComponent(PositionComponent);
    const { x, y } = gameContext.getViewportTilePosition();

    if(x !== positionComponent.tileX) {
        DirectionSystem.lookHorizontal(selectedEntity, x < positionComponent.tileX);
        MorphSystem.morphHorizontal(selectedEntity);
    }
}