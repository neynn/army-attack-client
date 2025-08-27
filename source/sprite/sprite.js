import { Graph } from "../graphics/graph.js";
import { isRectangleRectangleIntersect } from "../math/math.js";

export const Sprite = function(manager, index, DEBUG_NAME) {
    Graph.call(this, DEBUG_NAME);
    
    this.manager = manager;
    this.index = index;
    this.typeID = -1;
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

Sprite.DEBUG = {
    COLOR: "#ff00ff",
    LINE_SIZE: 2,
    DOT_SIZE: 8,
    DOT_SIZE_HALF: 4
};

Sprite.FLAG = {
    NONE: 0b00000000,
    FLIP: 1 << 0,
    STATIC: 1 << 1,
    EXPIRE: 1 << 2
};

Sprite.prototype = Object.create(Graph.prototype);
Sprite.prototype.constructor = Sprite;

Sprite.prototype.onDraw = function(display, localX, localY) {
    const container = this.manager.graphics.getContainer(this.typeID);

    if(!container) {
        return;
    }

    const { texture, frames, frameCount } = container;
    const { bitmap } = texture;

    if(frameCount === 0 || !bitmap) {
        return;
    }

    const currentFrame = frames[this.currentFrame];
    const isFlipped = (this.flags & Sprite.FLAG.FLIP) !== 0;

    let renderX = localX;
    let renderY = localY;

    if(isFlipped) {
        renderX = (localX - this.boundsX) * -1;
        renderY = localY + this.boundsY;
        display.flip();
    } else {
        renderX = localX + this.boundsX;
        renderY = localY + this.boundsY;
        display.unflip();
    }

    const { x, y, w, h } = currentFrame;
    const { context } = display;

    context.drawImage(bitmap, x, y, w, h, renderX, renderY, w, h);
}

Sprite.prototype.onUpdate = function(timestamp, deltaTime) {
    const passedTime = timestamp - this.lastCallTime;
    const passedFrames = passedTime / this.frameTime;

    this.lastCallTime = timestamp;
    this.updateFrame(passedFrames);
}

Sprite.prototype.onDebug = function(display, localX, localY) {
    const { context } = display;
    const isFlipped = (this.flags & Sprite.FLAG.FLIP) !== 0;

    context.strokeStyle = Sprite.DEBUG.COLOR;
    context.fillStyle = Sprite.DEBUG.COLOR;
    context.lineWidth = Sprite.DEBUG.LINE_SIZE;

    if(isFlipped) {
        const drawX = localX - this.boundsX;
        const drawY = localY + this.boundsY;

        display.flip();

        context.strokeRect(-drawX, drawY, this.boundsW, this.boundsH);
        context.fillRect(-drawX - Sprite.DEBUG.DOT_SIZE_HALF, drawY - Sprite.DEBUG.DOT_SIZE_HALF, Sprite.DEBUG.DOT_SIZE, Sprite.DEBUG.DOT_SIZE);
    } else {
        const drawX = localX + this.boundsX;
        const drawY = localY + this.boundsY;

        display.unflip();

        context.strokeRect(drawX, drawY, this.boundsW, this.boundsH);
        context.fillRect(drawX - Sprite.DEBUG.DOT_SIZE_HALF, drawY - Sprite.DEBUG.DOT_SIZE_HALF, Sprite.DEBUG.DOT_SIZE, Sprite.DEBUG.DOT_SIZE);
    }
}

Sprite.prototype.getIndex = function() {
    return this.index;
}

Sprite.prototype.reset = function() {
    this.typeID = -1;
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

Sprite.prototype.isEqual = function(typeID) {
    return typeID === this.typeID;
}

Sprite.prototype.swapTexture = function(sprite) {
    const typeID = sprite.typeID;
    const frameCount = sprite.frameCount;
    const frameTime = sprite.frameTime;
    const lastCallTime = sprite.lastCallTime;
    const bX = sprite.boundsX;
    const bY = sprite.boundsY;
    const bW = sprite.boundsW;
    const bH = sprite.boundsH;

    sprite.init(sprite.DEBUG_NAME, this.typeID, this.frameCount, this.frameTime, this.lastCallTime);
    sprite.setBounds(this.boundsX, this.boundsY, this.boundsW, this.boundsH);

    this.init(this.DEBUG_NAME, typeID, frameCount, frameTime, lastCallTime);
    this.setBounds(bX, bY, bW, bH);
}

Sprite.prototype.init = function(DEBUG_NAME, typeID, frameCount, frameTime, lastCallTime) {
    this.DEBUG_NAME = DEBUG_NAME;
    this.typeID = typeID;
    this.frameCount = frameCount;
    this.frameTime = frameTime;
    this.lastCallTime = lastCallTime;
    this.currentFrame = 0;
    this.floatFrame = 0;
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

Sprite.prototype.isVisible = function(viewportRight, viewportLeft, viewportBottom, viewportTop) {
    const isFlipped = (this.flags & Sprite.FLAG.FLIP) !== 0;
    const adjustedX = isFlipped ? -this.boundsX - this.boundsW : this.boundsX;
    const leftEdge = this.positionX + adjustedX;
    const topEdge = this.positionY + this.boundsY;
    const rightEdge = leftEdge + this.boundsW;
    const bottomEdge = topEdge + this.boundsH;
    const isVisible = leftEdge < viewportRight && rightEdge > viewportLeft && topEdge < viewportBottom && bottomEdge > viewportTop;

    return isVisible;
}

Sprite.prototype.isColliding = function(x, y, w, h) {
    const isFlipped = (this.flags & Sprite.FLAG.FLIP) !== 0;
    const adjustedX = isFlipped ? -this.boundsX - this.boundsW : this.boundsX;
    const isColliding = isRectangleRectangleIntersect(
        this.positionX + adjustedX, this.positionY + this.boundsY, this.boundsW, this.boundsH,
        x, y, w, h
    );

    return isColliding;
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
    this.manager.destroySprite(this.index);
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