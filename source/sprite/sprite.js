import { Drawable } from "../graphics/drawable.js";

export const Sprite = function(DEBUG_NAME, index) {
    Drawable.call(this, Drawable.TYPE.SPRITE, DEBUG_NAME);
    
    this.index = index;
    this.typeID = null;
    this.animationID = null;
    this.lastCallTime = 0;
    this.frameCount = 0;
    this.frameTime = 1;
    this.floatFrame = 0;
    this.currentFrame = 0;
    this.loopCount = 0;
    this.loopLimit = 0;
    this.boundsX = 0;
    this.boundsY = 0;
    this.boundsW = 0;
    this.boundsH = 0;
    this.flags = Sprite.FLAG.NONE;
}

Sprite.FLAG = {
    NONE: 0b00000000,
    FLIP: 1 << 0,
    STATIC: 1 << 1,
    EXPIRE: 1 << 2
};

Sprite.prototype = Object.create(Drawable.prototype);
Sprite.prototype.constructor = Sprite;

Sprite.prototype.onTerminate = function(spriteID) {
    console.warn(`Method onTerminate has not been implemented by sprite ${spriteID}`);
}

Sprite.prototype.getIndex = function() {
    return this.index;
}

Sprite.prototype.reset = function() {
    this.typeID = null;
    this.animationID = null;
    this.lastCallTime = 0;
    this.frameCount = 0;
    this.frameTime = 1;
    this.floatFrame = 0;
    this.currentFrame = 0;
    this.loopCount = 0;
    this.loopLimit = 0;
    this.boundsX = 0;
    this.boundsY = 0;
    this.boundsW = 0;
    this.boundsH = 0;
    this.flags = Sprite.FLAG.NONE;
    this.setPosition(0, 0);
    this.show();
}

Sprite.prototype.init = function(typeID, animationID, frameCount, frameTime, lastCallTime) {
    this.DEBUG_NAME = typeID;
    this.typeID = typeID;
    this.animationID = animationID;
    this.frameCount = frameCount;
    this.frameTime = frameTime;
    this.lastCallTime = lastCallTime;
}

Sprite.prototype.setLastCallTime = function(lastCallTime) {
    this.lastCallTime = lastCallTime;
}

Sprite.prototype.setBounds = function(x, y, w, h) {
    this.boundsX = x;
    this.boundsY = y;
    this.boundsW = w;
    this.boundsH = h;
}

Sprite.prototype.isEqual = function(typeID, animationID) {
    return this.typeID === typeID && this.animationID === animationID;
}

Sprite.prototype.isVisible = function(viewportRight, viewportLeft, viewportBottom, viewportTop) {
    const isFlipped = (this.flags & Sprite.FLAG.FLIP) !== 0;
    const adjustedX = isFlipped ? -this.boundsX - this.boundsW : this.boundsX;
    const x = this.positionX + adjustedX;
    const y = this.positionY + this.boundsY;
    const w = this.boundsW;
    const h = this.boundsH;
    const isVisible = x < viewportRight && x + w > viewportLeft && y < viewportBottom && y + h > viewportTop;

    return isVisible;
}

Sprite.prototype.onUpdate = function(timestamp, deltaTime) {
    const passedTime = timestamp - this.lastCallTime;
    const passedFrames = passedTime / this.frameTime;

    this.lastCallTime = timestamp;
    this.updateFrame(passedFrames);
}

Sprite.prototype.onDebug = function(context, localX, localY) {
    const isFlipped = (this.flags & Sprite.FLAG.FLIP) !== 0;

    if(isFlipped) {
        const drawX = localX - this.boundsX;
        const drawY = localY + this.boundsY;

        context.translate(drawX, 0);
        context.scale(-1, 1);
        context.strokeStyle = "black";
        context.lineWidth = 3;
        context.strokeRect(0, drawY, this.boundsW, this.boundsH);
    } else {
        const drawX = localX + this.boundsX;
        const drawY = localY + this.boundsY;

        context.strokeStyle = "black";
        context.lineWidth = 3;
        context.strokeRect(drawX, drawY, this.boundsW, this.boundsH);
    }
}

Sprite.prototype.setFrame = function(frameIndex = this.currentFrame) {
    if(frameIndex < this.frameCount && frameIndex >= 0) {
        this.floatFrame = frameIndex;
        this.currentFrame = frameIndex;
    }
}

Sprite.prototype.terminate = function() {
    this.hide();
    this.freeze();
    this.onTerminate();
}

Sprite.prototype.expire = function(loops = 0) {
    this.loopLimit = this.loopCount + loops;
    this.flags |= Sprite.FLAG.EXPIRE;
}

Sprite.prototype.repeat = function() {
    this.flags &= ~Sprite.FLAG.EXPIRE;
}

Sprite.prototype.freeze = function() {
    this.flags |= Sprite.FLAG.STATIC;
}

Sprite.prototype.thaw = function() {
    this.flags &= ~Sprite.FLAG.STATIC;
}

Sprite.prototype.flip = function() {
    this.flags |= Sprite.FLAG.FLIP;
}

Sprite.prototype.unflip = function() {
    this.flags &= ~Sprite.FLAG.FLIP;
}

Sprite.prototype.updateFrame = function(floatFrames) {
    const isStatic = (this.flags & Sprite.FLAG.STATIC) !== 0;

    if(isStatic) {
        return;
    }

    this.floatFrame += floatFrames;
    this.currentFrame = Math.floor(this.floatFrame % this.frameCount);

    if(floatFrames === 0) {
        return;
    }

    if(this.floatFrame >= this.frameCount) {
        const skippedLoops = Math.floor(this.floatFrame / this.frameCount);

        this.floatFrame -= this.frameCount * skippedLoops;
        this.loopCount += skippedLoops;
    }

    const isExpiring = (this.flags & Sprite.FLAG.EXPIRE) !== 0;

    if(isExpiring && this.loopCount > this.loopLimit) {
        this.terminate();
    }
}