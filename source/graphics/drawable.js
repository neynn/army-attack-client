import { EventEmitter } from "../events/eventEmitter.js";
import { clampValue } from "../math/math.js";
import { Vec2 } from "../math/vec2.js";
import { Family } from "./family.js";

export const Drawable = function(DEBUG_NAME) {
    this.id = Symbol("DRAWABLE");
    this.DEBUG_NAME = DEBUG_NAME;
    this.family = null;
    this.isVisible = true;
    this.opacity = 1;
    this.position = new Vec2(0, 0);
    this.events = new EventEmitter();
}

Drawable.DEFAULT_FAMILY_NAME = "default";

Drawable.prototype.update = function(timeStamp, timeStep) {

}

Drawable.prototype.onDraw = function(context, viewportX, viewportY, localX, localY) {

}

Drawable.prototype.onDebug = function(context, viewportX, viewportY, localX, localY) {

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

Drawable.prototype.openFamily = function(name) {
    if(this.family) {
        return false;
    }

    if(name === undefined) {
        name = Drawable.DEFAULT_FAMILY_NAME;
    }

    this.family = new Family(Symbol(this.DEBUG_NAME), this);
    this.family.setName(name);

    return false;
}

Drawable.prototype.closeFamily = function() {
    if(!this.family) {
        return false;
    }

    this.family.onRemove();
    this.family = null;

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

Drawable.prototype.addChild = function(drawable, customChildID) {
    if(!this.family) {
        return false;
    }

    if(customChildID === undefined) {
        return false;
    }

    if(this.family.getChildByName(customChildID)) {
        return false;
    }

    drawable.openFamily(customChildID);
    this.family.addChild(drawable.family);

    return true;
}

Drawable.prototype.removeChild = function(customChildID) {
    if(!this.family) {
        return false;
    }

    const child = this.family.getChildByName(customChildID);

    if(child === null) {
        return false;
    }

    child.onRemove();

    return true;
}

Drawable.prototype.setID = function(id) {
    if(id === undefined) {
        return false;
    }

    this.id = id;

    return true;
}