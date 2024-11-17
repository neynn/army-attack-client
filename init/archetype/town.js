import { DefaultArchetype } from "../defaultArchetype.js";

export const TownArchetype = function() {
    DefaultArchetype.call(this);
}

TownArchetype.prototype = Object.create(DefaultArchetype.prototype);
TownArchetype.prototype.constructor = TownArchetype;

TownArchetype.prototype.onConstruct = function(gameContext, entity, sprite, type) {

}
