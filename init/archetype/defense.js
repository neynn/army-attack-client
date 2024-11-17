import { componentSetup } from "../componentSetup.js";
import { DefaultArchetype } from "../defaultArchetype.js";

const MODE_STAT_TYPE_ID = "story";

export const DefenseArchetype = function() {
    DefaultArchetype.call(this);
}

DefenseArchetype.prototype = Object.create(DefaultArchetype.prototype);
DefenseArchetype.prototype.constructor = DefenseArchetype;

DefenseArchetype.prototype.onConstruct = function(gameContext, entity, sprite, type) {
    const attackComponent = componentSetup.setupAttackComponent(type, type.stats[MODE_STAT_TYPE_ID]);
    entity.addComponent(attackComponent);

    this.createStatCard(gameContext, entity, sprite);
}