import { DecayComponent } from "../components/decay.js";
import { MorphSystem } from "./morph.js";

export const ReviveSystem = function() {}

ReviveSystem.isReviveable = function(entity) {
    const reviveableComponent = entity.getComponent(DecayComponent);

    if(!reviveableComponent) {
        return false;
    }
    
    return reviveableComponent.isReviveable;
}

ReviveSystem.downEntity = function(gameContext, entity) {
    const { client } = gameContext;
    const { soundPlayer } = client;

    MorphSystem.toDown(gameContext, entity);
    soundPlayer.playRandom(entity.config.sounds.death);
}