import { Component } from "../../source/component/component.js";

export const SpriteComponent = function() {
    this.spriteID = null;
    this.isFlippable = false;
}

SpriteComponent.prototype = Object.create(Component.prototype);
SpriteComponent.prototype.constructor = SpriteComponent;

SpriteComponent.prototype.allowFlip = function() {
    this.isFlippable = true;
}

SpriteComponent.prototype.denyFlip = function() {
    this.isFlippable = false;
}

SpriteComponent.prototype.getFlippable = function() {
    return this.isFlippable;
}

SpriteComponent.create = function(config = {}) {
    const spriteComponent = new SpriteComponent();
    const {
        id = null
    } = config;

    spriteComponent.spriteID = id;
    
    return spriteComponent;
}