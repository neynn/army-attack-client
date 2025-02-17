import { ArmyEntity } from "../init/armyEntity.js";

export const DecaySystem = function() {}

DecaySystem.beginDecay = function(gameContext, entity) {
    const reviveableComponent = entity.getComponent(ArmyEntity.COMPONENT.REVIVEABLE);

    if(!reviveableComponent) {
        return;
    }

    const avianComponent = entity.getComponent(ArmyEntity.COMPONENT.AVIAN);

    if(avianComponent) {
        avianComponent.toGround();
    }

    reviveableComponent.beginDecay();
    entity.updateSprite(gameContext, ArmyEntity.SPRITE_TYPE.DOWN);
    entity.playSound(gameContext, ArmyEntity.SOUND_TYPE.DEATH);
}