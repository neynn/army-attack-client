import { ArmyEntity } from "../armyEntity.js";

export const HFE = function(id, DEBUG_NAME) {
    ArmyEntity.call(this, id, DEBUG_NAME);
}

HFE.prototype = Object.create(ArmyEntity.prototype);
HFE.prototype.constructor = HFE;

HFE.prototype.onCreate = function(gameContext, config) {
    this.createDefaultEntity(config);
    this.createDefaultSprite(gameContext, config);
    this.loadDefaultTraits(gameContext, config);
}