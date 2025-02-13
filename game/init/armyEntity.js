import { Entity } from "../../source/entity/entity.js";
import { EventEmitter } from "../../source/events/eventEmitter.js";

export const ArmyEntity = function(config, DEBUG_NAME) {
    Entity.call(this, DEBUG_NAME);

    this.events = new EventEmitter();
    this.setConfig(config);
}

ArmyEntity.EVENT = {
    "HEALTH_UPDATE": 0,
    "DAMAGE_UPDATE": 1
};

ArmyEntity.COMPONENT = {
    "HEALTH": "Health",
    "CONSTRUCTION": "Construction",
    "REVIVEABLE": "Reviveable",
    "ATTACK": "Attack",
    "MOVE": "Move",
    "UNIT_SIZE": "UnitSize",
    "ARMOR": "Armor",
    "AVIAN": "Avian",
    "BULLDOZE": "Bulldoze",
    "COUNTER": "Counter",
    "RESOURCE": "Resource",
    "POSITION": "Position",
    "SPRITE": "Sprite",
    "DIRECTION": "Direction",
    "TEAM": "Team",
    "PRODUCTION": "Production"
};

ArmyEntity.prototype = Object.create(Entity.prototype);
ArmyEntity.prototype.constructor = ArmyEntity;