import { ControllerComponent } from "../components/controller.js";
import { PositionComponent } from "../components/position.js";
import { DirectionSystem } from "./direction.js";
import { MorphSystem } from "./morph.js";
import { TargetSystem } from "./target.js";
import { TeamSystem } from "./team.js";

export const ControllerSystem = function() {}

ControllerSystem.clearAttackers = function(gameContext, controller) {
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

        MorphSystem.updateSprite(attacker, "idle");
    }
}

ControllerSystem.hightlightAttackers = function(gameContext, controller, target, attackers) {
    const { entityManager, mapLoader, tileManager } = gameContext;
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
        const tileID = tileManager.getTileID("overlay", "grid_attack_1x1");

        activeMap.placeTile(tileID, settings.overlayLayerID, positionComponent.tileX, positionComponent.tileY);

        DirectionSystem.lookAt(attacker, target);
        MorphSystem.morphDirectional(attacker, "aim", "aim_ne");
    }
}

ControllerSystem.updateAttackers = function(gameContext, controller) {
    const mouseEntity = gameContext.getMouseEntity();

    if(!mouseEntity) {
        return;
    }

    const isEnemy = TeamSystem.isEntityEnemy(gameContext, mouseEntity, controller);
    const isTargetable = TargetSystem.isTargetable(mouseEntity);

    if(!isEnemy || !isTargetable) {
        return;
    }

    const attackers = TargetSystem.getAttackers(gameContext, mouseEntity);
    
    ControllerSystem.hightlightAttackers(gameContext, controller, mouseEntity, attackers);
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