export const SpriteAtlas = function() {
    this.boundsX = 0;
    this.boundsY = 0;
    this.boundsW = 0;
    this.boundsH = 0;
    this.sprites = new Map();
}

SpriteAtlas.ID = {
    INVALID: -1
};

SpriteAtlas.DEFAULT = {
    FRAME_TIME: 1,
    ANIMATION_ID: "default"
};

SpriteAtlas.prototype.loadBounds = function(bounds) {
    if(bounds) {
        const { x, y, w, h } = bounds;

        this.boundsX = x;
        this.boundsY = y;
        this.boundsW = w;
        this.boundsH = h;
    }
}

SpriteAtlas.prototype.setSpriteIndex = function(spriteID, spriteIndex) {
    if(!this.sprites.has(spriteID)) {
        this.sprites.set(spriteID, spriteIndex);
    }
}

SpriteAtlas.prototype.getSpriteIndex = function(spriteID) {
    const spriteIndex = this.sprites.get(spriteID);

    if(spriteIndex === undefined) {
        return SpriteAtlas.ID.INVALID;
    }

    return spriteIndex;
}