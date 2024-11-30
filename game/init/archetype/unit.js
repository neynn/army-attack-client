import { componentSetup } from "../componentSetup.js";
import { DefaultArchetype } from "./default.js";

export const UnitArchetype = function() {
    DefaultArchetype.call(this);
}

UnitArchetype.prototype = Object.create(DefaultArchetype.prototype);
UnitArchetype.prototype.constructor = UnitArchetype;

UnitArchetype.prototype.onInitialize = function(gameContext, entity, sprite, type, setup) {
    const { stats } = type;
    const { mode } = setup;

    const attackComponent = componentSetup.setupAttackComponent(stats[mode]);
    const moveComponent = componentSetup.setupMoveComponent(type, stats[mode]);

    entity.addComponent(attackComponent);
    entity.addComponent(moveComponent);
}

UnitArchetype.prototype.onFinalize = function(gameContext, entity, sprite, type, setup) {
    this.createStatCard(gameContext, entity, sprite);
}
