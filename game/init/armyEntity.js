import { Entity } from "../../source/entity/entity.js";
import { EventEmitter } from "../../source/events/eventEmitter.js";

import { ReviveableComponent } from "../components/reviveable.js";
import { ProductionComponent } from "../components/production.js";

export const ArmyEntity = function(config, DEBUG_NAME) {
    Entity.call(this, DEBUG_NAME);

    this.events = new EventEmitter();
    this.setConfig(config);
}

ArmyEntity.EVENT = {
    "HEALTH_UPDATE": 0,
    "DAMAGE_UPDATE": 1
};

ArmyEntity.prototype = Object.create(Entity.prototype);
ArmyEntity.prototype.constructor = ArmyEntity;

ArmyEntity.prototype.update = function(gameContext) {
    if(this.hasComponent(ReviveableComponent)) {
        const reviveable = this.getComponent(ReviveableComponent);

        reviveable.update(gameContext);

        if(reviveable.isDead()) {
            //REMOVE from game.
        }
    }

    if(this.hasComponent(ProductionComponent)) {
        const production = this.getComponent(ProductionComponent);

        production.update(gameContext, this.config.collectableTimeSeconds);

        if(production.isFinished()) {
            console.error("TODO FINISH PRODUCTION");
        }
    }
}