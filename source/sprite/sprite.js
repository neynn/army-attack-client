import { Drawable } from "../graphics/drawable.js";

export const Sprite = function(DEBUG_NAME) {
    Drawable.call(this, DEBUG_NAME);
    
    this.typeID = null;
    this.animationID = null;
    this.lastCallTime = 0;
    this.frameCount = 0;
    this.frameTime = 0;
    this.floatFrame = 0;
    this.currentFrame = 0;
    this.loopCount = 0;
    this.loopLimit = 0;
    this.boundsX = 0;
    this.boundsY = 0;
    this.boundsW = 0;
    this.boundsH = 0;
    this.isRepeating = true;
    this.isStatic = false;
    this.isFlipped = false;
}

Sprite.prototype = Object.create(Drawable.prototype);
Sprite.prototype.constructor = Sprite;

Sprite.prototype.onTerminate = function(spriteID) {
    console.warn(`Method onTerminate has not been implemented by sprite ${spriteID}`);
}

Sprite.prototype.init = function(typeID, animationID, frameCount, frameTime) {
    this.typeID = typeID;
    this.animationID = animationID;
    this.frameCount = frameCount;
    this.frameTime = frameTime;
    this.floatFrame = 0;
    this.currentFrame = 0;
    this.loopCount = 0;
    this.loopLimit = 0;
    this.isRepeating = true;
    this.isStatic = false;
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
    const adjustedX = this.isFlipped ? -(this.boundsX + this.boundsW) : this.boundsX;
    const x = this.position.x + adjustedX;
    const y = this.position.y + this.boundsY;
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
    if(this.isFlipped) {
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
    this.onTerminate(this.id);
}

Sprite.prototype.repeat = function() {
    this.isRepeating = true;
}

Sprite.prototype.expire = function(loops = 0) {
    this.loopLimit = this.loopCount + loops;
    this.isRepeating = false;
}

Sprite.prototype.freeze = function() {
    this.isStatic = true;
}

Sprite.prototype.thaw = function() {
    this.isStatic = false;
}

Sprite.prototype.unflip = function() {
    this.isFlipped = false;
}

Sprite.prototype.flip = function() {
    this.isFlipped = true;
}

Sprite.prototype.updateFrame = function(floatFrames = 0) {
    if(this.isStatic) {
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

    if(this.loopCount > this.loopLimit && !this.isRepeating) {
        this.terminate();
    }
}