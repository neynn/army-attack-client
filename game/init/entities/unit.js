import { AttackComponent } from "../../components/attack.js";
import { MoveComponent } from "../../components/move.js";
import { SpriteComponent } from "../../components/sprite.js";
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
    const moveComponent = MoveComponent.create(this.config.stats[mode], this.config);
    
    attackComponent.toActive();

    this.addComponent(attackComponent);
    this.addComponent(moveComponent);
    this.getComponent(SpriteComponent).allowFlip();
    this.loadDefaultTraits(gameContext, config);
}