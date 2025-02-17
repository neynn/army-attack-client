export const Selector = function() {
    this.availableEntities = new Set();
    this.selectedEntities = new Set();
}

Selector.prototype.selectSingle = function(entityID) {
    if(this.availableEntities.has(entityID)) {
        this.selectedEntities.clear();
        this.selectedEntities.add(entityID);
    }
}

Selector.prototype.getFirstSelected = function() {
    if(this.selectedEntities.size === 0) {
        return null;
    }

    const iterator = this.selectedEntities.values();
    const firstSelected = iterator.next().value;

    return firstSelected;
}

Selector.prototype.selectEntity = function(entityID) {
    if(this.availableEntities.has(entityID)) {
        this.selectedEntities.add(entityID);
    }
}

Selector.prototype.deselectEntity = function(entityID) {
    if(this.selectedEntities.has(entityID)) {
        this.selectedEntities.delete(entityID);
    }
}

Selector.prototype.selectAll = function() {
    for(const entityID of this.availableEntities) {
        this.selectedEntities.add(entityID);
    }
}

Selector.prototype.deselectAll = function() {
    this.selectedEntities.clear();
}

Selector.prototype.removeEntity = function(entityID) {
    if(this.availableEntities.has(entityID)) {
        this.deselectEntity(entityID);
        this.availableEntities.delete(entityID);
    }
}

Selector.prototype.addEntity = function(entityID) {
    if(!this.availableEntities.has(entityID)) {
        this.availableEntities.add(entityID);
    }
}

Selector.prototype.hasSelected = function(entityID) {
    return this.selectedEntities.has(entityID);
}

Selector.prototype.hasEntity = function(entityID) {
    return this.availableEntities.has(entityID);
}