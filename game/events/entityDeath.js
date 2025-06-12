import { AnimationSystem } from "../systems/animation.js";
import { SpawnSystem } from "../systems/spawn.js";
import { ArmyEvent } from "./armyEvent.js";

export const EntityDeathEvent = function() {}

EntityDeathEvent.prototype = Object.create(ArmyEvent.prototype);
EntityDeathEvent.prototype.constructor = EntityDeathEvent;

EntityDeathEvent.prototype.onStory = function(gameContext, event) {
    const { entity, reason } = event;

    AnimationSystem.playDeath(gameContext, entity);
    SpawnSystem.destroyEntity(gameContext, entity);
}