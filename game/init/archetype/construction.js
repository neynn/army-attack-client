import { ConstructionComponent } from "../../components/construction.js";;
import { DefaultArchetype } from "./default.js";

export const ConstructionArchetype = function() {}

ConstructionArchetype.prototype = Object.create(DefaultArchetype.prototype);
ConstructionArchetype.prototype.constructor = ConstructionArchetype;

ConstructionArchetype.prototype.onInitialize = function(entity, type, setup) {
    const constructionComponent = ConstructionComponent.create(type);
    
    entity.addComponent(constructionComponent);
}

ConstructionArchetype.prototype.onFinalize = function(gameContext, entity, sprite, type, setup) {
    this.createStatCard(gameContext, entity, sprite);

    sprite.freeze();
    sprite.setFrame(0);
}