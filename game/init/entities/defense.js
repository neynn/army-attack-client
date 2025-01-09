import { AttackComponent } from "../../components/attack.js";
import { ArmyEntity } from "../armyEntity.js";

export const Defense = function(id, DEBUG_NAME) {
    ArmyEntity.call(this, id, DEBUG_NAME);
}

Defense.prototype = Object.create(ArmyEntity.prototype);
Defense.prototype.constructor = Defense;

Defense.prototype.onCreate = function(gameContext, config) {
    const { mode } = config;

    this.createDefaultEntity(config);
    this.createDefaultSprite(gameContext, config);
    
    const attackComponent = AttackComponent.create(this.config.stats[mode]);
    
    attackComponent.toPassive();
        
    this.addComponent(attackComponent);
    this.loadDefaultTraits(gameContext, config);
}