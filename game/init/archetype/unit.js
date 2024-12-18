import { AttackComponent } from "../../components/attack.js";
import { MoveComponent } from "../../components/move.js";
import { DefaultArchetype } from "./default.js";

export const UnitArchetype = function() {}

UnitArchetype.prototype = Object.create(DefaultArchetype.prototype);
UnitArchetype.prototype.constructor = UnitArchetype;

UnitArchetype.prototype.onInitialize = function(entity, type, setup) {
    const { stats } = type;
    const { mode } = setup;

    const attackComponent = AttackComponent.create(stats[mode]);
    const moveComponent = MoveComponent.create(type, stats[mode]);

    entity.addComponent(attackComponent);
    entity.addComponent(moveComponent);
}

UnitArchetype.prototype.onFinalize = function(gameContext, entity, sprite, type, setup) {
    this.createStatCard(gameContext, entity, sprite);
}
