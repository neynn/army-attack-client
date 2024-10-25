import { EventEmitter } from "../events/eventEmitter.js";
import { clampValue } from "../math/math.js";
import { Rectangle } from "../math/rect.js";
import { Vec2 } from "../math/vec2.js";
import { Family } from "./family.js";

export const Drawable = function(DEBUG_NAME) {
    this.DEBUG_NAME = DEBUG_NAME;
    this.id = null;
    this.family = null;
    this.opacity = 1;
    this.isVisible = true;
    this.position = new Vec2(0, 0);
    this.bounds = new Rectangle(0, 0, 0, 0);
    this.events = new EventEmitter();
    this.events.listen(Drawable.EVENT_FAMILY_CLOSED);
}

Drawable.EVENT_FAMILY_CLOSED = "Drawable.EVENT_FAMILY_CLOSED";
Drawable.DEFAULT_FAMILY_NAME = "default";

Drawable.prototype.onUpdate = function(timestamp, deltaTime) {

}

Drawable.prototype.onDraw = function(context, viewportX, viewportY, localX, localY) {

}

Drawable.prototype.onDebug = function(context, viewportX, viewportY, localX, localY) {

}

Drawable.prototype.update = function(timeStamp, deltaTime) {
    const children = this.getAllChildren();

    this.onUpdate(timeStamp, deltaTime);

    for(const child of children) {
        const reference = child.getReference();
        reference.update(timeStamp, deltaTime);
    }
}

Drawable.prototype.debug = function(context, viewportX, viewportY, rootLocalX, rootLocalY) {
    const children = this.getAllChildren();
    const localX = rootLocalX + this.position.x;
    const localY = rootLocalY + this.position.y;

    context.save();
    this.onDebug(context, viewportX, viewportY, localX, localY);
    context.restore();

    for(const child of children) {
        const reference = child.getReference();
        reference.debug(context, viewportX, viewportY, localX, localY);
    }
}

Drawable.prototype.draw = function(context, viewportX, viewportY, rootLocalX, rootLocalY) {
    if(!this.isVisible) {
        return;
    }

    const children = this.getAllChildren();
    const localX = rootLocalX + this.position.x;
    const localY = rootLocalY + this.position.y;

    context.save();
    this.onDraw(context, viewportX, viewportY, localX, localY);
    context.restore();

    for(const child of children) {
        const reference = child.getReference();
        reference.draw(context, viewportX, viewportY, localX, localY);
    }
}

Drawable.prototype.setID = function(id) {
    if(id === undefined) {
        return false;
    }

    this.id = id;

    return true;
}

Drawable.prototype.getBounds = function() {
    const { x, y, w, h } = this.bounds;
    const boundsX = this.position.x + x;
    const boundsY = this.position.y + y;

    return { "x": boundsX, "y": boundsY, "w": w, "h": h };
}

Drawable.prototype.setPosition = function(positionX, positionY) {
    if(positionX === undefined || positionY === undefined) {
        return false;
    }

    this.position.x = positionX;
    this.position.y = positionY;

    return true;
}

Drawable.prototype.getChild = function(name) {
    if(!this.family) {
        return null;
    }

    return this.family.getChildByName(name);
}

Drawable.prototype.getAllChildrenReferences = function() {
    if(!this.family) {
        return [];
    }

    const children = this.family.getAllChildren();
    const references = children.map(child => child.getReference());

    return references;
}

Drawable.prototype.getAllChildren = function() {
    if(!this.family) {
        return [];
    }

    return this.family.getAllChildren();
}

Drawable.prototype.hasFamily = function() {
    return this.family !== null;
}

Drawable.prototype.openFamily = function(name = Drawable.DEFAULT_FAMILY_NAME) {
    if(this.family) {
        return false;
    }

    this.family = new Family(this, this.DEBUG_NAME);
    this.family.setName(name);

    return true;
}

Drawable.prototype.closeFamily = function() {
    if(!this.family) {
        return false;
    }

    this.family.onRemove();
    this.family = null;
    this.events.emit(Drawable.EVENT_FAMILY_CLOSED);

    return true;
}

Drawable.prototype.setVisible = function(isVisible) {
    if(isVisible === undefined) {
        return false;
    }

    this.isVisible = isVisible;

    return true;
}

Drawable.prototype.setOpacity = function(opacity) {
    if(opacity === undefined) {
        return false;
    }

    opacity = clampValue(opacity, 1, 0);

    this.opacity = opacity;

    return true;
}

Drawable.prototype.addChild = function(drawable, childName) {
    if(!this.family) {
        return false;
    }

    if(childName === undefined) {
        return false;
    }

    if(this.family.getChildByName(childName)) {
        return false;
    }

    if(!drawable.hasFamily()) {
        drawable.openFamily(childName);
    }

    this.family.addChild(drawable.family);

    return true;
}

Drawable.prototype.removeChild = function(childName) {
    if(!this.family) {
        return false;
    }

    const child = this.family.getChildByName(childName);

    if(child === null) {
        return false;
    }

    const reference = child.getReference();

    reference.closeFamily();

    return true;
}