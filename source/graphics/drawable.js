import { clampValue } from "../math/math.js";
import { Vec2 } from "../math/vec2.js";
import { Graph } from "./graph.js";

export const Drawable = function(id = null, DEBUG_NAME = "Drawable") {
    this.DEBUG_NAME = DEBUG_NAME;
    this.id = id;
    this.graph = null;
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
        context.globalAlpha = this.opacity;
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
    if(opacity !== undefined) {
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

Drawable.prototype.openFamily = function(name = Graph.DEFAULT_NAME) {
    if(this.graph || this.id === null) {
        return;
    }

    this.graph = new Graph(this);
    this.graph.setName(name);
}

Drawable.prototype.closeFamily = function() {
    if(!this.graph) {
        return;
    }

    this.graph.destroy();
    this.graph = null;
}

Drawable.prototype.addChild = function(drawable, name) {
    if(drawable.getID() === null || name === undefined) {
        return;
    }
    
    if(!this.graph) {
        this.openFamily();
    }

    if(this.graph.hasChild(name)) {
        return;
    }

    if(drawable.hasFamily()) {
        drawable.graph.setName(name);
    } else {
        drawable.openFamily(name);
    }

    this.graph.link(drawable.graph);
}

Drawable.prototype.removeChild = function(name) {
    if(!this.graph) {
        return;
    }

    const child = this.graph.getChild(name);

    if(child !== null) {
        const reference = child.getReference();

        reference.closeFamily();
    }
}