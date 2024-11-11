import { Drawable } from "./drawable.js";

export const Sprite = function(id, DEBUG_NAME) {
    Drawable.call(this, id, DEBUG_NAME);
    
    this.typeID = null;
    this.layerID = null;
    this.animationID = null;
    this.lastCallTime = 0;
    this.frameCount = 0;
    this.frameTime = 0;
    this.floatFrame = 0;
    this.currentFrame = 0;
    this.loopCount = 0;
    this.loopLimit = 0;
    this.isLooping = true;
    this.isStatic = false;
    this.isFlipped = false;

    this.events.listen(Sprite.FINISHED);
    this.events.listen(Sprite.LOOP_COMPLETE);
    this.events.listen(Sprite.REQUEST_FRAME);
}

Sprite.FINISHED = "Sprite.FINISHED";
Sprite.LOOP_COMPLETE = "Sprite.LOOP_COMPLETE";
Sprite.REQUEST_FRAME = "Sprite.REQUEST_FRAME";

Sprite.prototype = Object.create(Drawable.prototype);
Sprite.prototype.constructor = Sprite;

Sprite.prototype.initialize = function(typeID, animationID, animationFrameCount, animationFrameTime) {
    this.typeID = typeID;
    this.animationID = animationID;
    this.frameCount = animationFrameCount;
    this.frameTime = animationFrameTime;
    this.floatFrame = 0;
    this.currentFrame = 0;
    this.loopCount = 0;
    this.loopLimit = 0;
    this.isStatic = false;
    this.bounds.clear();
}

Sprite.prototype.initializeBounds = function() {
    if(!this.bounds.isZero()) {
        return false;
    }

    this.events.emit(Sprite.REQUEST_FRAME, this, (response) => {
        const { frame, offset } = response;
        const { w, h } = frame;
    
        this.bounds.set(offset.x, offset.y, w, h);
    });

    return true;
}

Sprite.prototype.setLastCallTime = function(lastCallTime) {
    this.lastCallTime = lastCallTime;
}

Sprite.prototype.getLastCallTime = function() {
    return this.lastCallTime;
}

Sprite.prototype.getTypeID = function() {
    return this.typeID;
}

Sprite.prototype.getAnimationID = function() {
    return this.animationID;
}

Sprite.prototype.getBounds = function() {
    const { x, y, w, h } = this.bounds;
    const adjustedX = this.isFlipped ? -(x + w) : x;
    const boundsX = this.position.x + adjustedX;
    const boundsY = this.position.y + y;

    return { "x": boundsX, "y": boundsY, "w": w,  "h": h }
}

Sprite.prototype.onUpdate = function(timeStamp, deltaTime) {
    const passedTime = timeStamp - this.lastCallTime;
    const passedFrames = passedTime / this.frameTime;

    this.lastCallTime = timeStamp;
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

Sprite.prototype.onDraw = function(context, viewportX, viewportY, localX, localY) {
    this.events.emit(Sprite.REQUEST_FRAME, this, (response) => {
        const { frame, offset, image } = response;
        const { x, y, w, h } = frame;
        const renderX = localX - viewportX;
        const renderY = localY - viewportY;

        this.bounds.set(offset.x, offset.y, w, h);

        if(this.isFlipped) {
            const drawX = renderX - (offset.x + w);
            const drawY = renderY + offset.y;

            context.translate(drawX + w, 0);
            context.scale(-1, 1);
            context.drawImage(image, x, y, w, h, 0, drawY, w, h);
        } else {
            const drawX = renderX + offset.x;
            const drawY = renderY + offset.y;

            context.drawImage(image, x, y, w, h, drawX, drawY, w, h);
        }
    });
}

Sprite.prototype.setLooping = function(isLooping = false) {
    this.isLooping = isLooping;
}

Sprite.prototype.setLoopLimit = function(loopLimit = 0) {
    this.loopLimit = loopLimit;
}

Sprite.prototype.setStatic = function(isStatic = false) {
    this.isStatic = isStatic;
}

Sprite.prototype.setLayerID = function(layerID) {
    this.layerID = layerID;
}

Sprite.prototype.setFrame = function(frameIndex) {
    if(frameIndex === undefined) {
        frameIndex = this.currentFrame;
    }

    if(frameIndex >= this.frameCount || frameIndex < 0) {
        return;
    }

    this.floatFrame = frameIndex;
    this.currentFrame = frameIndex;
}

Sprite.prototype.flip = function(isFlipped) {
    if(isFlipped === undefined) {
        isFlipped = !this.isFlipped;
    }

    this.isFlipped = isFlipped;
}

Sprite.prototype.updateFrame = function(passedFloatFrames = 0) {
    if(this.isStatic) {
        return;
    }

    this.floatFrame += passedFloatFrames;
    this.currentFrame = Math.floor(this.floatFrame % this.frameCount);

    if(passedFloatFrames === 0) {
        return;
    }

    if(this.floatFrame >= this.frameCount) {
        const skippedLoops = Math.floor(this.floatFrame / this.frameCount);
        this.floatFrame -= this.frameCount * skippedLoops;
        this.loopCount += skippedLoops;
        this.events.emit(Sprite.LOOP_COMPLETE, this, skippedLoops);
    }

    if(this.loopCount > this.loopLimit && !this.isLooping) {
        this.setVisible(false);
        this.setStatic(true);
        this.events.emit(Sprite.FINISHED, this);
    }
}