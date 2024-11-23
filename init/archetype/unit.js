import { componentSetup } from "../componentSetup.js";
import { DefaultArchetype } from "./default.js";

const MODE_STAT_TYPE_ID = "story";

export const UnitArchetype = function() {
    DefaultArchetype.call(this);
}

UnitArchetype.prototype = Object.create(DefaultArchetype.prototype);
UnitArchetype.prototype.constructor = UnitArchetype;

UnitArchetype.prototype.onInitialize = function(gameContext, entity, sprite, type) {
    const attackComponent = componentSetup.setupAttackComponent(type, type.stats[MODE_STAT_TYPE_ID]);
    const moveComponent = componentSetup.setupMoveComponent(type, type.stats[MODE_STAT_TYPE_ID]);

    entity.addComponent(attackComponent);
    entity.addComponent(moveComponent);
}

UnitArchetype.prototype.onFinalize = function(gameContext, entity, sprite, type) {
    this.createStatCard(gameContext, entity, sprite);
}
