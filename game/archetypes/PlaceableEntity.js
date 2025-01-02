import { Entity } from "../../source/entity/entity.js";

export const PlaceableEntity = function(id, DEBUG_NAME) {
    Entity.call(this, id, DEBUG_NAME);

    this.health = 0;
    this.maxHealth = 0;
    this.state = PlaceableEntity.STATE_IDLE;
}

PlaceableEntity.STATE_IDLE = 0;
PlaceableEntity.STATE_DOWN = 1;