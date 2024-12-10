import { AttackComponent } from "../../components/attack.js";
import { DefaultArchetype } from "./default.js";

export const DefenseArchetype = function() {
    DefaultArchetype.call(this);
}

DefenseArchetype.prototype = Object.create(DefaultArchetype.prototype);
DefenseArchetype.prototype.constructor = DefenseArchetype;

DefenseArchetype.prototype.onInitialize = function(gameContext, entity, sprite, type, setup) {
    const { stats } = type;
    const { mode } = setup;

    const attackComponent = AttackComponent.create(stats[mode]);

    entity.addComponent(attackComponent);
}

DefenseArchetype.prototype.onFinalize = function(gameContext, entity, sprite, type, setup) {
    this.createStatCard(gameContext, entity, sprite);
}