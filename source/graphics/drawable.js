import { EventEmitter } from "../events/eventEmitter.js";
import { clampValue } from "../math/math.js";
import { Rectangle } from "../math/rect.js";
import { Vec2 } from "../math/vec2.js";
import { Family } from "./family.js";

export const Drawable = function(id = null, DEBUG_NAME = "") {
    this.DEBUG_NAME = DEBUG_NAME;
    this.id = id;
    this.family = null;
    this.opacity = 1;
    this.isVisible = true;
    this.position = new Vec2(0, 0);
    this.bounds = new Rectangle(0, 0, 0, 0);
    this.events = new EventEmitter();

    if(id === null) {
        console.warn(`Drawable (${DEBUG_NAME}) has no id!`);
    }
}

Drawable.DEFAULT_FAMILY_NAME = "DEFAULT_FAMILY_NAME";

Drawable.prototype.onUpdate = function(timestamp, deltaTime) {}

Drawable.prototype.onDraw = function(context, viewportX, viewportY, localX, localY) {}

Drawable.prototype.onDebug = function(context, viewportX, viewportY, localX, localY) {}

Drawable.prototype.update = function(timestamp, deltaTime) {
    const updateStack = [this];

    while(updateStack.length > 0) {
        const drawable = updateStack.pop();
        const children = drawable.getChildren();

        for(const child of children) {
            const reference = child.getReference();

            updateStack.push(reference);
        }

        drawable.onUpdate(timestamp, deltaTime);
    }
}

Drawable.prototype.debug = function(context, viewportX, viewportY) {
    const debugStack = [{
        "drawable": this,
        "localX": this.position.x,
        "localY": this.position.y
    }];

    while(debugStack.length > 0) {
        const { drawable, localX, localY } = debugStack.pop();
        const children = drawable.getChildren();

        context.save();
        drawable.onDebug(context, viewportX, viewportY, localX, localY);
        context.restore();

        for(let i = children.length - 1; i >= 0; i--) {
            const child = children[i];
            const reference = child.getReference();

            debugStack.push({
                "drawable": reference,
                "localX": localX + reference.position.x,
                "localY": localY + reference.position.y
            });
        }
    }
}

Drawable.prototype.draw = function(context, viewportX, viewportY) {
    if(!this.isVisible) {
        return;
    }

    const drawStack = [{
        "drawable": this,
        "localX": this.position.x,
        "localY": this.position.y
    }];

    while(drawStack.length > 0) {
        const { drawable, localX, localY } = drawStack.pop();
        const children = drawable.getChildren();

        context.save();
        drawable.onDraw(context, viewportX, viewportY, localX, localY);
        context.restore();

        for(let i = children.length - 1; i >= 0; i--) {
            const child = children[i];
            const reference = child.getReference();

            if(reference.isVisible) {
                drawStack.push({
                    "drawable": reference,
                    "localX": localX + reference.position.x,
                    "localY": localY + reference.position.y
                });
            }
        }
    }
}

Drawable.prototype.getFamilyStack = function() {
    const familyStack = [];
    const stack = [this];

    while(stack.length > 0) {
        const drawable = stack.pop();
        const drawableID = drawable.getID();
        const children = drawable.getChildren();

        for(let i = children.length - 1; i >= 0; i--) {
            const child = children[i];
            const reference = child.getReference();
            
            stack.push(reference);
        }

        familyStack.push(drawableID);
    }

    return familyStack;
}

Drawable.prototype.getID = function() {
    return this.id;
}

Drawable.prototype.getBounds = function() {
    const { x, y, w, h } = this.bounds;
    const boundsX = this.position.x + x;
    const boundsY = this.position.y + y;

    return { "x": boundsX, "y": boundsY, "w": w, "h": h };
}

Drawable.prototype.setPosition = function(positionX, positionY) {
    if(positionX !== undefined) {
        this.position.x = positionX;
    }

    if(positionY !== undefined) {
        this.position.y = positionY;
    }
}

Drawable.prototype.hide = function() {
    this.isVisible = false;
}

Drawable.prototype.show = function() {
    this.isVisible = true;
}

Drawable.prototype.setOpacity = function(opacity) {
    if(opacity === undefined) {
        return false;
    }

    opacity = clampValue(opacity, 1, 0);

    this.opacity = opacity;

    return true;
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
        return false;
    }

    this.family = new Family(this.id, this, name);

    return true;
}

Drawable.prototype.closeFamily = function() {
    if(!this.family) {
        return false;
    }

    this.family.onRemove();
    this.family = null;

    return true;
}

Drawable.prototype.addChild = function(drawable, name) {
    if(drawable.getID() === null || name === undefined) {
        return false;
    }
    
    if(!this.family) {
        this.openFamily();
    }

    if(this.family.hasChild(name)) {
        return false;
    }

    if(drawable.hasFamily()) {
        drawable.family.overwriteName(name);
    } else {
        drawable.openFamily(name);
    }

    this.family.addChild(drawable.family);

    return true;
}

Drawable.prototype.removeChild = function(name) {
    if(!this.family) {
        return false;
    }

    const child = this.family.getChildByName(name);

    if(child === null) {
        return false;
    }

    const reference = child.getReference();

    reference.closeFamily();

    return true;
}