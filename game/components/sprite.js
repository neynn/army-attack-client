import { Component } from "../../source/component/component.js";

export const SpriteComponent = function() {
    this.spriteID = null;
    this.isFlippable = false;
}

SpriteComponent.FLIP_STATE = {
    UNFLIPPED: 0,
    FLIPPED: 1
};

SpriteComponent.prototype = Object.create(Component.prototype);
SpriteComponent.prototype.constructor = SpriteComponent;

SpriteComponent.prototype.setPosition = function(gameContext, positionX, positionY) {
    const { spriteManager } = gameContext;
    const sprite = spriteManager.getSprite(this.spriteID);

    sprite.setPosition(positionX, positionY);
}

SpriteComponent.prototype.change = function(gameContext, sheetID, animationID) {
    const { spriteManager } = gameContext;
    
    if(sheetID !== undefined) {
        spriteManager.updateSprite(this.spriteID, sheetID, animationID);
    }
}

SpriteComponent.prototype.flip = function(gameContext, state) {
    if(!this.isFlippable) {
        return;
    }

    const { spriteManager } = gameContext;
    const sprite = spriteManager.getSprite(this.spriteID);

    switch(state) {
        case SpriteComponent.FLIP_STATE.UNFLIPPED: {
            sprite.unflip();
            break;
        }
        case SpriteComponent.FLIP_STATE.FLIPPED: {
            sprite.flip();
            break;
        }
        default: {
            console.warn(`Unknown flip state ${state}`);
            break; 
        }
    }
}

SpriteComponent.prototype.allowFlip = function() {
    this.isFlippable = true;
}

SpriteComponent.prototype.denyFlip = function() {
    this.isFlippable = false;
}

SpriteComponent.prototype.init = function(config) {
    const { allowFlip } = config;

    if(allowFlip) {
        this.isFlippable = true;
    }
}