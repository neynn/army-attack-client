export const SpriteComponent = function() {
    this.spriteIndex = -1;
    this.isFlippable = false;
}

SpriteComponent.SPRITE_ID = {
    MOVE: "MOVE",
    CARD: "CARD"
};

SpriteComponent.FLIP_STATE = {
    UNFLIPPED: 0,
    FLIPPED: 1
};

SpriteComponent.prototype.setIndex = function(index) {
    this.spriteIndex = index;
}

SpriteComponent.prototype.destroy = function(gameContext) {
    const { spriteManager } = gameContext;

    spriteManager.destroySprite(this.spriteIndex);
}

SpriteComponent.prototype.swapLayer = function(gameContext, layerID) {
    const { spriteManager } = gameContext;
    
    spriteManager.swapLayer(this.spriteIndex, layerID);
}

SpriteComponent.prototype.setPosition = function(gameContext, positionX, positionY) {
    const { spriteManager } = gameContext;
    const sprite = spriteManager.getSprite(this.spriteIndex);

    sprite.setPosition(positionX, positionY);
}

SpriteComponent.prototype.getSprite = function(gameContext) {
    const { spriteManager } = gameContext;
    const sprite = spriteManager.getSprite(this.spriteIndex);

    return sprite;
}

SpriteComponent.prototype.change = function(gameContext, sheetID, animationID) {
    const { spriteManager } = gameContext;

    if(sheetID !== undefined) {
        spriteManager.updateSprite(this.spriteIndex, sheetID, animationID);
    }
}

SpriteComponent.prototype.flip = function(gameContext, state) {
    if(!this.isFlippable) {
        return;
    }

    const { spriteManager } = gameContext;
    const sprite = spriteManager.getSprite(this.spriteIndex);

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

SpriteComponent.prototype.init = function(config) {
    const { allowFlip } = config;

    if(allowFlip) {
        this.isFlippable = true;
    }
}