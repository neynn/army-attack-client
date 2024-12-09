export const Archetype = function() {
    this.count = 0;
}

Archetype.prototype.onBuild = function(gameContext, entity, type, setup) {} 

Archetype.prototype.build = function(gameContext, entity, type, setup) {
    this.count++;
    this.onBuild(gameContext, entity, type, setup);
}