import { ConstructionComponent } from "../../components/construction.js";
import { ArmyEntity } from "../armyEntity.js";

export const Construction = function(id, DEBUG_NAME) {
    ArmyEntity.call(this, id, DEBUG_NAME);
}

Construction.prototype = Object.create(ArmyEntity.prototype);
Construction.prototype.constructor = Construction;

Construction.prototype.onCreate = function(gameContext, config) {
    this.createDefaultEntity(config);
    const sprite = this.createDefaultSprite(gameContext, config);

    const constructionComponent = ConstructionComponent.create(this.config);

    this.addComponent(constructionComponent);

    sprite.freeze();
    sprite.setFrame(0);

    this.loadDefaultTraits(gameContext, config);
}