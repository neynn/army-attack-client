import { ActiveComponent } from "../../source/component/activeComponent.js";
import { MoveSystem } from "../systems/move.js";

export const MoveComponent = function() {
    this.range = 0;
    this.speed = 0;
    this.path = [];
    this.distance = 0;
    this.passability = new Set();
    this.flags = MoveComponent.FLAGS.NONE;
}

MoveComponent.FLAGS = {
    NONE: 0,
    STEALTH: 1 << 0,
    CLOAK: 1 << 1,
    COWARD: 1 << 2
};

MoveComponent.prototype = Object.create(ActiveComponent.prototype);
MoveComponent.prototype.constructor = MoveComponent;

MoveComponent.prototype.setPath = function(path) {
    this.path = path;
}

MoveComponent.prototype.isCoward = function() {
    return (this.flags & MoveComponent.FLAGS.COWARD) !== 0;
}

MoveComponent.prototype.isStealth = function() {
    return (this.flags & MoveComponent.FLAGS.STEALTH) !== 0;
}

MoveComponent.prototype.isCloaked = function() {
    return (this.flags & MoveComponent.FLAGS.CLOAK) !== 0;
}

MoveComponent.prototype.update = function(gameContext, entity) {
    if(this.path.length !== 0) {
        MoveSystem.updatePath(gameContext, entity);
    }
}

MoveComponent.prototype.clear = function() {
    this.distance = 0;
    this.path = [];
}

MoveComponent.prototype.getCurrentStep = function() {
    if(this.path.length === 0) {
        return null;
    }

    return this.path[this.path.length - 1];
}

MoveComponent.prototype.hasPassability = function(type) {
    return this.passability.has(type);
}

MoveComponent.prototype.isPathEmpty = function() {
    return this.path.length === 0;
}

MoveComponent.prototype.init = function(config) {
    const { coward, stealth, cloak } = config;

    if(coward) {
        this.flags |= MoveComponent.FLAGS.COWARD;
    }

    if(stealth) {
        this.flags |= MoveComponent.FLAGS.STEALTH;
    }

    if(cloak) {
        this.flags |= MoveComponent.FLAGS.CLOAK;
    }
}