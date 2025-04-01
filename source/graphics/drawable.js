import { clampValue } from "../math/math.js";
import { Graph } from "./graph.js";

export const Drawable = function(type, DEBUG_NAME = "") {
    this.DEBUG_NAME = DEBUG_NAME;
    this.type = type ?? Drawable.TYPE.NONE;
    this.id = Drawable.NEXT_ID++;
    this.state = Drawable.STATE.VISIBLE;
    this.positionX = 0;
    this.positionY = 0;
    this.opacity = 1;
    this.graph = null;
    this.name = "";
    this.parent = null;
    this.children = [];
}

Drawable.NEXT_ID = 69420;

Drawable.TYPE = {
    NONE: 0,
    SPRITE: 1,
    UI_ELEMENT: 2,
    OTHER: 3
};

Drawable.STATE = {
    HIDDEN: 0,
    VISIBLE: 1
};

Drawable.prototype.getID = function() {
    return this.id;
}

Drawable.prototype.onUpdate = function(timestamp, deltaTime) {}

Drawable.prototype.onDraw = function(context, localX, localY) {}

Drawable.prototype.onDebug = function(context, localX, localY) {}

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

Drawable.prototype.drizzle = function(onCall) {
    const referenceStack = [this];

    while(referenceStack.length !== 0) {
        const drawable = referenceStack.pop();
        const children = drawable.getChildren();

        for(let i = 0; i < children.length; i++) {
            const child = children[i];
            const reference = child.getReference();

            referenceStack.push(reference);
        }

        onCall(drawable);
    }
}

Drawable.prototype.debug = function(context, viewportX, viewportY) {
    const referenceStack = [this];
    const positionStack = [this.positionX - viewportX, this.positionY - viewportY];

    while(referenceStack.length !== 0) {
        const positionY = positionStack.pop();
        const positionX = positionStack.pop();
        const reference = referenceStack.pop();
        const children = reference.getChildren();

        context.save();
        reference.onDebug(context, positionX, positionY);
        context.restore();

        for(let i = children.length - 1; i >= 0; i--) {
            const child = children[i];
            const reference = child.getReference();

            referenceStack.push(reference);
            positionStack.push(positionX + reference.positionX);
            positionStack.push(positionY + reference.positionY);
        }
    }
}

Drawable.prototype.draw = function(context, viewportX, viewportY) {
    if(this.state !== Drawable.STATE.VISIBLE) {
        return;
    }

    const referenceStack = [this];
    const positionStack = [this.positionX - viewportX, this.positionY - viewportY];

    while(referenceStack.length !== 0) {
        const positionY = positionStack.pop();
        const positionX = positionStack.pop();
        const reference = referenceStack.pop();
        const children = reference.getChildren();

        context.save();
        context.globalAlpha = this.opacity;
        reference.onDraw(context, positionX, positionY);
        context.restore();

        for(let i = children.length - 1; i >= 0; i--) {
            const child = children[i];
            const reference = child.getReference();

            if(reference.state === Drawable.STATE.VISIBLE) {
                referenceStack.push(reference);
                positionStack.push(positionX + reference.positionX);
                positionStack.push(positionY + reference.positionY);
            }
        }
    }
}

Drawable.prototype.getReferenceStack = function() {
    const referenceStack = [this];
    const result = [];

    while(referenceStack.length !== 0) {
        const drawable = referenceStack.pop();
        const children = drawable.getChildren();

        for(let i = children.length - 1; i >= 0; i--) {
            const child = children[i];
            const reference = child.getReference();
            
            referenceStack.push(reference);
        }

        result.push(drawable);
    }

    return result;
}

Drawable.prototype.updatePosition = function(deltaX, deltaY) {
    this.positionX += deltaX;
    this.positionY += deltaY;
}

Drawable.prototype.setPosition = function(positionX, positionY) {
    this.positionX = positionX;
    this.positionY = positionY;
}

Drawable.prototype.hide = function() {
    this.state = Drawable.STATE.HIDDEN;
}

Drawable.prototype.show = function() {
    this.state = Drawable.STATE.VISIBLE;
}

Drawable.prototype.setOpacity = function(opacity) {
    if(typeof opacity === "number") {
        const clampedOpacity = clampValue(opacity, 1, 0);

        this.opacity = clampedOpacity;
    }
}

Drawable.prototype.getOpacity = function() {
    return this.opacity;
}

Drawable.prototype.hasParent = function() {
    if(!this.graph) {
        return false;
    }

    return this.graph.parent !== null;
}

Drawable.prototype.hasChild = function(name) {
    if(!this.graph) {
        return false;
    }

    return this.graph.hasChild(name);
}

Drawable.prototype.getChildren = function() {
    if(!this.graph) {
        return [];
    }

    return this.graph.getChildren();
}

Drawable.prototype.getChild = function(name) {
    if(!this.graph) {
        return null;
    }

    const child = this.graph.getChild(name);
    
    if(!child) {
        return null;
    }

    return child.getReference();
}

Drawable.prototype.hasFamily = function() {
    return this.graph !== null;
}

Drawable.prototype.openFamily = function(name) {
    if(!this.graph) {
        this.graph = new Graph(this.id, this);
        this.graph.setName(name);
    }
}

Drawable.prototype.closeFamily = function() {
    if(this.graph) {
        this.graph.destroy();
        this.graph = null;
    }
}

Drawable.prototype.filterChildName = function(child, name) {
    if(typeof name !== "string" || (this.graph && this.graph.hasChild(name))) {
        const childID = child.getID();

        return childID;
    }

    return name;
}

Drawable.prototype.addChild = function(child, name) {
    const childID = this.filterChildName(child, name);
    
    if(!this.graph) {
        this.openFamily();
    }

    if(child.hasFamily()) {
        child.graph.setName(childID);
    } else {
        child.openFamily(childID);
    }

    this.graph.link(child.graph);

    return childID;
}

Drawable.prototype.removeChild = function(name) {
    if(this.graph) {
        const child = this.graph.getChild(name);

        if(child !== null) {
            const reference = child.getReference();
    
            reference.closeFamily();
        }
    }
}