import { clampValue } from "../math/math.js";
import { Vec2 } from "../math/vec2.js";
import { Family } from "./family.js";

export const Drawable = function(id = null, DEBUG_NAME = "Drawable") {
    this.DEBUG_NAME = DEBUG_NAME;
    this.id = id;
    this.family = null;
    this.opacity = 1;
    this.state = Drawable.STATE.VISIBLE;
    this.position = new Vec2(0, 0);

    if(id === null) {
        console.warn(`Drawable (${DEBUG_NAME}) has no id!`);
    }
}

Drawable.STATE = {
    HIDDEN: 0,
    VISIBLE: 1
};

Drawable.DEFAULT_FAMILY_NAME = "DEFAULT_FAMILY_NAME";

Drawable.prototype.onUpdate = function(timestamp, deltaTime) {}

Drawable.prototype.onDraw = function(context, viewportX, viewportY, localX, localY) {}

Drawable.prototype.onDebug = function(context, viewportX, viewportY, localX, localY) {}

Drawable.prototype.update = function(timestamp, deltaTime) {
    const referenceStack = [this];

    while(referenceStack.length !== 0) {
        const drawable = referenceStack.pop();
        const children = drawable.getChildren();

        for(let i = 0; i < children.length; i++) {
            const child = children[i];
            const reference = child.getReference();

            referenceStack.push(reference);
        }

        drawable.onUpdate(timestamp, deltaTime);
    }
}

Drawable.prototype.debug = function(context, viewportX, viewportY) {
    const referenceStack = [this];
    const positionStack = [this.position.x, this.position.y];

    while(referenceStack.length !== 0) {
        const positionY = positionStack.pop();
        const positionX = positionStack.pop();
        const reference = referenceStack.pop();
        const children = reference.getChildren();

        context.save();
        reference.onDebug(context, viewportX, viewportY, positionX, positionY);
        context.restore();

        for(let i = children.length - 1; i >= 0; i--) {
            const child = children[i];
            const reference = child.getReference();

            referenceStack.push(reference);
            positionStack.push(positionX + reference.position.x);
            positionStack.push(positionY + reference.position.y);
        }
    }
}

Drawable.prototype.draw = function(context, viewportX, viewportY) {
    if(this.state !== Drawable.STATE.VISIBLE) {
        return;
    }

    const referenceStack = [this];
    const positionStack = [this.position.x, this.position.y];

    while(referenceStack.length !== 0) {
        const positionY = positionStack.pop();
        const positionX = positionStack.pop();
        const reference = referenceStack.pop();
        const children = reference.getChildren();

        context.save();
        reference.onDraw(context, viewportX, viewportY, positionX, positionY);
        context.restore();

        for(let i = children.length - 1; i >= 0; i--) {
            const child = children[i];
            const reference = child.getReference();

            if(reference.state === Drawable.STATE.VISIBLE) {
                referenceStack.push(reference);
                positionStack.push(positionX + reference.position.x);
                positionStack.push(positionY + reference.position.y);
            }
        }
    }
}

Drawable.prototype.getReferenceStack = function() {
    const referenceStack = [this];
    const referenceIDStack = [];

    while(referenceStack.length !== 0) {
        const drawable = referenceStack.pop();
        const drawableID = drawable.getID();
        const children = drawable.getChildren();

        for(let i = children.length - 1; i >= 0; i--) {
            const child = children[i];
            const reference = child.getReference();
            
            referenceStack.push(reference);
        }

        referenceIDStack.push(drawableID);
    }

    return referenceIDStack;
}

Drawable.prototype.getID = function() {
    return this.id;
}

Drawable.prototype.updatePosition = function(deltaX, deltaY) {
    this.position.x += deltaX;
    this.position.y += deltaY;
}

Drawable.prototype.setPosition = function(positionX, positionY) {
    this.position.x = positionX;
    this.position.y = positionY;
}

Drawable.prototype.hide = function() {
    this.state = Drawable.STATE.HIDDEN;
}

Drawable.prototype.show = function() {
    this.state = Drawable.STATE.VISIBLE;
}

Drawable.prototype.setOpacity = function(opacity) {
    if(opacity === undefined) {
        return;
    }

    opacity = clampValue(opacity, 1, 0);

    this.opacity = opacity;
}

Drawable.prototype.getOpacity = function() {
    return this.opacity;
}

Drawable.prototype.hasParent = function() {
    if(!this.family) {
        return false;
    }

    return this.family.parent !== null;
}

Drawable.prototype.hasChild = function(name) {
    if(!this.family) {
        return false;
    }

    return this.family.hasChild(name);
}

Drawable.prototype.getChild = function(name) {
    if(!this.family) {
        return null;
    }

    return this.family.getChildByName(name);
}

Drawable.prototype.getChildren = function() {
    if(!this.family) {
        return [];
    }

    return this.family.getChildren();
}

Drawable.prototype.getChildID = function(name) {
    if(!this.family) {
        return null;
    }

    const child = this.family.getChildByName(name);
    
    if(!child) {
        return null;
    }

    const childID = child.getID();

    return childID;
}

Drawable.prototype.hasFamily = function() {
    return this.family !== null;
}

Drawable.prototype.openFamily = function(name = Drawable.DEFAULT_FAMILY_NAME) {
    if(this.family || this.id === null) {
        return;
    }

    this.family = new Family(this.id, this, name);
}

Drawable.prototype.closeFamily = function() {
    if(!this.family) {
        return;
    }

    this.family.onRemove();
    this.family = null;
}

Drawable.prototype.addChild = function(drawable, name) {
    if(drawable.getID() === null || name === undefined) {
        return;
    }
    
    if(!this.family) {
        this.openFamily();
    }

    if(this.family.hasChild(name)) {
        return;
    }

    if(drawable.hasFamily()) {
        drawable.family.setName(name);
    } else {
        drawable.openFamily(name);
    }

    this.family.addChild(drawable.family);
    drawable.family.setParent(this.family);
}

Drawable.prototype.removeChild = function(name) {
    if(!this.family) {
        return;
    }

    const child = this.family.getChildByName(name);

    if(child === null) {
        return;
    }

    const reference = child.getReference();

    reference.closeFamily();
}