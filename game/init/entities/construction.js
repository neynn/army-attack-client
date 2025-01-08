import { ConstructionComponent } from "../../components/construction.js";
import { ACTION_TYPES } from "../../enums.js";
import { ConstructionSystem } from "../../systems/construction.js";
import { DeathSystem } from "../../systems/death.js";
import { SpawnSystem } from "../../systems/spawn.js";
import { ArmyEntity } from "../armyEntity.js";

export const Construction = function(id, DEBUG_NAME) {
    ArmyEntity.call(this, id, DEBUG_NAME);
}

Construction.prototype = Object.create(ArmyEntity.prototype);
Construction.prototype.constructor = Construction;

Construction.prototype.onInteract = function(gameContext, controller) {
    const { world } = gameContext;
    const { actionQueue } = world;
    const isComplete = ConstructionSystem.isComplete(this);
    
    if(!isComplete) {
        actionQueue.addRequest(actionQueue.createRequest(ACTION_TYPES.CONSTRUCTION, this.id));
        return;
    }

    if(!actionQueue.isRunning()) {
        const result = ConstructionSystem.getConstructionResult(controller, this);
    
        //TODO: Open GUI and check if the controller has enough materials/resources.
        DeathSystem.destroyEntity(gameContext, this.id);
        SpawnSystem.createEntity(gameContext, result);
    }
}

Construction.prototype.onCreate = function(gameContext, config) {
    this.createDefaultEntity(config);
    const sprite = this.createDefaultSprite(gameContext, config);

    const constructionComponent = ConstructionComponent.create(this.config);

    this.addComponent(constructionComponent);

    sprite.freeze();
    sprite.setFrame(0);

    this.loadDefaultTraits(gameContext, config);
}