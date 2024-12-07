import { componentSetup } from "../componentSetup.js";
import { DefaultArchetype } from "./default.js";

export const ConstructionArchetype = function() {
    DefaultArchetype.call(this);
}

ConstructionArchetype.prototype = Object.create(DefaultArchetype.prototype);
ConstructionArchetype.prototype.constructor = ConstructionArchetype;

ConstructionArchetype.prototype.onInitialize = function(gameContext, entity, sprite, type, setup) {
    const constructionComponent = componentSetup.setupConstructionComponent(type);
    
    sprite.freeze();
    sprite.setFrame(0);
    entity.addComponent(constructionComponent);
}

ConstructionArchetype.prototype.onFinalize = function(gameContext, entity, sprite, type, setup) {
    this.createStatCard(gameContext, entity, sprite);
}