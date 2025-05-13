import { ArmyEntity } from "../init/armyEntity.js";

export const DecaySystem = function() {}

DecaySystem.beginDecay = function(entity) {
    const reviveableComponent = entity.getComponent(ArmyEntity.COMPONENT.REVIVEABLE);

    if(!reviveableComponent) {
        return;
    }

    const avianComponent = entity.getComponent(ArmyEntity.COMPONENT.AVIAN);

    if(avianComponent) {
        avianComponent.toGround();
    }

    reviveableComponent.beginDecay();
}

DecaySystem.endDecay = function(entity) {
    const reviveableComponent = entity.getComponent(ArmyEntity.COMPONENT.REVIVEABLE);

    if(!reviveableComponent) {
        return;
    }

    const avianComponent = entity.getComponent(ArmyEntity.COMPONENT.AVIAN);

    if(avianComponent) {
        avianComponent.toAir();
    }

    reviveableComponent.endDecay();
}