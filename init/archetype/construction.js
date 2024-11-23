import { componentSetup } from "../componentSetup.js";
import { DefaultArchetype } from "../defaultArchetype.js";

export const ConstructionArchetype = function() {
    DefaultArchetype.call(this);
}

ConstructionArchetype.prototype = Object.create(DefaultArchetype.prototype);
ConstructionArchetype.prototype.constructor = ConstructionArchetype;

ConstructionArchetype.prototype.onInitialize = function(gameContext, entity, sprite, type) {
    const constructionComponent = componentSetup.setupConstructionComponent(type);
    
    sprite.freeze();
    sprite.setFrame(2);
    entity.addComponent(constructionComponent);
}

ConstructionArchetype.prototype.onFinalize = function(gameContext, entity, sprite, type) {

}