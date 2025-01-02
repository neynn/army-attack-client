import { AttackComponent } from "../../components/attack.js";
import { DefaultArchetype } from "./default.js";

export const DefenseArchetype = function() {}

DefenseArchetype.prototype = Object.create(DefaultArchetype.prototype);
DefenseArchetype.prototype.constructor = DefenseArchetype;

DefenseArchetype.prototype.onInitialize = function(entity, type, setup) {
    const { stats } = type;
    const { mode } = setup;

    const attackComponent = AttackComponent.create(stats[mode]);

    entity.addComponent(attackComponent);
}