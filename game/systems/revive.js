import { ReviveComponent } from "../components/revive.js";
import { SYSTEM_TYPES } from "../enums.js";
import { MorphSystem } from "./morph.js";

export const ReviveSystem = function() {}

ReviveSystem.isReviveable = function(entity) {
    const reviveableComponent = entity.getComponent(ReviveComponent);

    if(!reviveableComponent) {
        return false;
    }
    
    return reviveableComponent.isReviveable;
}

ReviveSystem.downEntity = function(gameContext, entity) {
    const { client, systemManager } = gameContext;
    const { soundPlayer } = client;

    MorphSystem.toDown(entity);
    soundPlayer.playRandom(entity.config.sounds.death);
    systemManager.addEntity(SYSTEM_TYPES.DOWN, entity.id);
}