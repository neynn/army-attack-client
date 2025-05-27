import { MoveSystem } from "../systems/move.js";

export const MoveComponent = function() {
    this.range = 0;
    this.speed = 0;
    this.path = [];
    this.pathIndex = -1;
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

MoveComponent.FLAG_MAP = {
    "Stealth": MoveComponent.FLAGS.STEALTH,
    "Cloak": MoveComponent.FLAGS.CLOAK,
    "Coward": MoveComponent.FLAGS.COWARD
};

MoveComponent.createStep = function(deltaX, deltaY) {
    return {
        "deltaX": deltaX,
        "deltaY": deltaY,
        "speed": Math.sqrt(deltaX * deltaX + deltaY * deltaY)
    }
}

MoveComponent.prototype.canPathAdvance = function(distance) {
    return this.distance >= distance && !this.isPathDone();
}

MoveComponent.prototype.advancePath = function(distance) {
    this.distance -= distance;
    this.pathIndex--;
}

MoveComponent.prototype.clearPath = function() {
    this.path = [];
    this.pathIndex = -1;
    this.distance = 0;
}

MoveComponent.prototype.setPath = function(path) {
    this.path = path;
    this.pathIndex = this.path.length - 1;
}

MoveComponent.prototype.isPathDone = function() {
    return this.pathIndex < 0 || this.pathIndex >= this.path.length;
}

MoveComponent.prototype.getCurrentStep = function() {
    if(this.pathIndex < 0 || this.pathIndex >= this.path.length) {
        return null;
    } 

    return this.path[this.pathIndex];
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
    if(!this.isPathDone()) {
        MoveSystem.updatePath(gameContext, entity);
    } 
}

MoveComponent.prototype.updateDistance = function(deltaTime) {
    const { speed } = this.getCurrentStep();
    const deltaDistance = (this.speed / speed) * deltaTime;

    this.distance += deltaDistance;

    return deltaDistance;
}

MoveComponent.prototype.hasPassability = function(type) {
    return this.passability.has(type);
}

MoveComponent.prototype.init = function(config) {
    const { flags } = config;

    if(flags) {
        for(let i = 0; i < flags.length; i++) {
            const flagID = flags[i];
            const flag = MoveComponent.FLAG_MAP[flagID];

            if(flag !== undefined) {
                this.flags |= flag;
            }
        }
    }
}