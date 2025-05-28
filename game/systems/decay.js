import { ArmyEntity } from "../init/armyEntity.js";

/**
 * Collection of functions revolving around the decay of entities.
 */
export const DecaySystem = function() {}

/**
 * Begins the decaying process for an entity.
 * 
 * @param {*} entity 
 * @returns 
 */
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

/**
 * Ends the decaying process of an entity.
 * 
 * @param {*} entity 
 * @returns 
 */
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