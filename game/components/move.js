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

MoveComponent.prototype.getMoveSpeed = function(deltaTime) {
    const { speed } = this.getCurrentStep();
    const moveSpeed = (this.speed / speed) * deltaTime;

    return moveSpeed;
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