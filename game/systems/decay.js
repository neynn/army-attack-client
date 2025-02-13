import { ArmyEntity } from "../init/armyEntity.js";
import { MorphSystem } from "./morph.js";

export const DecaySystem = function() {}

DecaySystem.beginDecay = function(gameContext, entity) {
    const { client } = gameContext;
    const { soundPlayer } = client;
    const reviveableComponent = entity.getComponent(ArmyEntity.COMPONENT.REVIVEABLE);

    if(!reviveableComponent) {
        return;
    }

    const avianComponent = entity.getComponent(ArmyEntity.COMPONENT.AVIAN);

    if(avianComponent) {
        avianComponent.toGround();
    }

    reviveableComponent.beginDecay();
    MorphSystem.toDown(gameContext, entity);
    soundPlayer.playRandom(entity.config.sounds.death);
}