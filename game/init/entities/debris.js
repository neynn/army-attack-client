import { ArmyEntity } from "../armyEntity.js";

export const Debris = function(id, DEBUG_NAME) {
    ArmyEntity.call(this, id, DEBUG_NAME);
}

Debris.prototype = Object.create(ArmyEntity.prototype);
Debris.prototype.constructor = Debris;

Debris.prototype.onCreate = function(gameContext, config) {
    this.createDefaultEntity(config);
    this.createDefaultSprite(gameContext, config);
    this.loadDefaultTraits(gameContext, config);
}