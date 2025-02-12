import { ActiveComponent } from "../../source/component/activeComponent.js";
import { MoveSystem } from "../systems/move.js";

export const MoveComponent = function() {
    this.range = 0;
    this.speed = 0;
    this.path = [];
    this.distance = 0;
    this.passability = {};
    this.isCoward = false;
    this.isStealth = false;
    this.isCloaked = false;
}

MoveComponent.prototype = Object.create(ActiveComponent.prototype);
MoveComponent.prototype.constructor = MoveComponent;

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
    return this.passability[type];
}

MoveComponent.prototype.isPathEmpty = function() {
    return this.path.length === 0;
}

MoveComponent.prototype.init = function(config) {
    const { coward, stealth, cloak } = config;

    if(coward) {
        this.isCoward = coward;
    }

    if(stealth) {
        this.isStealth = stealth;
    }

    if(cloak) {
        this.isCloaked = cloak;
    }
}

MoveComponent.prototype.custom = function(config, type) {
    const {
        passability = []
    } = type;

    const {
        moveRange = 0,
        moveSpeed = 480
    } = config;

    for(const passabilityID of passability) {
        this.passability[passabilityID] = true;
    }

    this.range = moveRange;
    this.speed = moveSpeed;
}