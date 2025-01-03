import { Drawable } from "../drawable.js";

export const Sprite = function(id, DEBUG_NAME) {
    Drawable.call(this, id, DEBUG_NAME);
    
    this.typeID = null;
    this.animationID = null;
    this.lastCallTime = 0;
    this.frameCount = 0;
    this.frameTime = 0;
    this.floatFrame = 0;
    this.currentFrame = 0;
    this.loopCount = 0;
    this.loopLimit = 0;
    this.isRepeating = true;
    this.isStatic = false;
    this.isFlipped = false;

    this.events.listen(Sprite.EVENT_TERMINATE);
    this.events.listen(Sprite.EVENT_LOOP_COMPLETE);
}

Sprite.EVENT_TERMINATE = "EVENT_TERMINATE";
Sprite.EVENT_LOOP_COMPLETE = "EVENT_LOOP_COMPLETE";

Sprite.prototype = Object.create(Drawable.prototype);
Sprite.prototype.constructor = Sprite;

Sprite.prototype.initialize = function(typeID, animationID, frameCount, frameTime) {
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
    this.bounds.clear();
}

Sprite.prototype.setLastCallTime = function(lastCallTime) {
    this.lastCallTime = lastCallTime;
}

Sprite.prototype.setBounds = function(x, y, w, h) {
    this.bounds.set(x, y, w, h);
}

Sprite.prototype.getDrawData = function() {
    return {
        "typeID": this.typeID,
        "animationID": this.animationID,
        "frame": this.currentFrame,
        "isFlipped": this.isFlipped
    }
}

Sprite.prototype.getBounds = function() {
    const { x, y, w, h } = this.bounds;
    const adjustedX = this.isFlipped ? -(x + w) : x;
    const boundsX = this.position.x + adjustedX;
    const boundsY = this.position.y + y;

    return {
        "x": boundsX,
        "y": boundsY,
        "w": w,
        "h": h
    }
}

Sprite.prototype.onUpdate = function(timestamp, deltaTime) {
    const passedTime = timestamp - this.lastCallTime;
    const passedFrames = passedTime / this.frameTime;

    this.lastCallTime = timestamp;
    this.updateFrame(passedFrames);
}

Sprite.prototype.onDebug = function(context, viewportX, viewportY, localX, localY) {
    const { x, y, w, h } = this.bounds;
    const renderX = localX - viewportX;
    const renderY = localY - viewportY;

    if(this.isFlipped) {
        const drawX = renderX - (x + w);
        const drawY = renderY + y;

        context.translate(drawX + w, 0);
        context.scale(-1, 1);
        context.strokeStyle = "black";
        context.lineWidth = 3;
        context.strokeRect(0, drawY, w, h);
    } else {
        const drawX = renderX + x;
        const drawY = renderY + y;

        context.strokeStyle = "black";
        context.lineWidth = 3;
        context.strokeRect(drawX, drawY, w, h);
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
    this.events.emit(Sprite.EVENT_TERMINATE, this);
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
        this.events.emit(Sprite.EVENT_LOOP_COMPLETE, this, skippedLoops);
    }

    if(this.loopCount > this.loopLimit && !this.isRepeating) {
        this.terminate();
    }
}