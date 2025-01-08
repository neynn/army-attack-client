import { ArmyEntity } from "../armyEntity.js";

export const Deco = function(id, DEBUG_NAME) {
    ArmyEntity.call(this, id, DEBUG_NAME);
}

Deco.prototype = Object.create(ArmyEntity.prototype);
Deco.prototype.constructor = Deco;

Deco.prototype.onCreate = function(gameContext, config) {
    this.createDefaultEntity(config);
    this.createDefaultSprite(gameContext, config);
    this.loadDefaultTraits(gameContext, config);
}