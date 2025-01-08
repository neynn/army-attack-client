import { AttackComponent } from "../../components/attack.js";
import { MoveComponent } from "../../components/move.js";
import { ArmyEntity } from "../armyEntity.js";

export const Unit = function(id, DEBUG_NAME) {
    ArmyEntity.call(this, id, DEBUG_NAME);
}

Unit.prototype = Object.create(ArmyEntity.prototype);
Unit.prototype.constructor = Unit;

Unit.prototype.onCreate = function(gameContext, config) {
    const { mode } = config;

    this.createDefaultEntity(config);
    this.createDefaultSprite(gameContext, config);
    
    const attackComponent = AttackComponent.create(this.config.stats[mode]);
    const moveComponent = MoveComponent.create(this.config, this.config.stats[mode]);
    
    attackComponent.type = AttackComponent.ATTACK_TYPE_ACTIVE;
        
    this.addComponent(attackComponent);
    this.addComponent(moveComponent);
    this.loadDefaultTraits(gameContext, config);
}