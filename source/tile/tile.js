export const Tile = function() {
    this.entityPointers = new Set();
}

Tile.prototype.hasEntity = function(entityId) {
    return this.entityPointers.has(entityId);
}

Tile.prototype.addEntity = function(entityId) {
    this.entityPointers.add(entityId);
}

Tile.prototype.removeEntity = function(entityId) {
    this.entityPointers.delete(entityId);
}

Tile.prototype.clear = function() {
    this.entityPointers.clear();
}

Tile.prototype.getFirstEntity = function() {
    const iterator = this.entityPointers.values();
    const firstEntity = iterator.next().value;
    
    return firstEntity;
}

Tile.prototype.isOccupied = function() {
    return this.entityPointers.size !== 0;
}