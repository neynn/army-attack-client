import { componentSetup } from "../componentSetup.js";
import { DefaultArchetype } from "../defaultArchetype.js";

const MODE_STAT_TYPE_ID = "story";

export const UnitArchetype = function() {
    DefaultArchetype.call(this);
}

UnitArchetype.prototype = Object.create(DefaultArchetype.prototype);
UnitArchetype.prototype.constructor = UnitArchetype;

UnitArchetype.prototype.onConstruct = function(gameContext, entity, sprite, type) {
    const attackComponent = componentSetup.setupAttackComponent(type, type.stats[MODE_STAT_TYPE_ID]);
    const moveComponent = componentSetup.setupMoveComponent(type, type.stats[MODE_STAT_TYPE_ID]);

    entity.addComponent(attackComponent);
    entity.addComponent(moveComponent);
    
    this.createStatCard(gameContext, entity, sprite);
}
