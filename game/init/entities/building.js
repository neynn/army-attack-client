import { ArmyEntity } from "../armyEntity.js";

export const Building = function(id, DEBUG_NAME) {
    ArmyEntity.call(this, id, DEBUG_NAME);

    this.tick = 0;
}

Building.prototype = Object.create(ArmyEntity.prototype);
Building.prototype.constructor = Building;

Building.prototype.onCreate = function(gameContext, config) {
    this.createDefaultEntity(config);
    this.createDefaultSprite(gameContext, config);
    this.loadDefaultTraits(gameContext, config);
}