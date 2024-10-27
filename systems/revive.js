import { ReviveComponent } from "../components/revive.js";
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
    const { client } = gameContext;
    const { soundPlayer } = client;

    MorphSystem.updateSprite(entity, "downed");
    soundPlayer.playRandom(entity.config.sounds.death);
}