import { ArmyEntity } from "../armyEntity.js";

export const Town = function(id, DEBUG_NAME) {
    ArmyEntity.call(this, id, DEBUG_NAME);
}

Town.prototype = Object.create(ArmyEntity.prototype);
Town.prototype.constructor = Town;

Town.prototype.onCreate = function(gameContext, config) {
    this.createDefaultEntity(config);
    this.createDefaultSprite(gameContext, config);
    this.loadDefaultTraits(gameContext, config);
}