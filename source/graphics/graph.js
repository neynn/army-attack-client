import { clampValue } from "../math/math.js";

export const Graph = function(type, DEBUG_NAME = "") {
    this.DEBUG_NAME = DEBUG_NAME;
    this.type = type ?? Graph.TYPE.NONE;
    this.id = Graph.NEXT_ID++;
    this.state = Graph.STATE.VISIBLE;
    this.positionX = 0;
    this.positionY = 0;
    this.opacity = 1;
    this.name = "";
    this.parent = null;
    this.children = [];
}

Graph.NEXT_ID = 69420;

Graph.TYPE = {
    NONE: 0,
    SPRITE: 1,
    UI_ELEMENT: 2,
    OTHER: 3
};

Graph.STATE = {
    HIDDEN: 0,
    VISIBLE: 1
};

Graph.prototype.onUpdate = function(timestamp, deltaTime) {}

Graph.prototype.onDraw = function(context, localX, localY) {}

Graph.prototype.onDebug = function(context, localX, localY) {}

Graph.prototype.update = function(timestamp, deltaTime) {
    const stack = [this];

    while(stack.length !== 0) {
        const graph = stack.pop();
        const { children } = graph;

        for(let i = children.length - 1; i >= 0; i--) {
            stack.push(children[i]);
        }

        graph.onUpdate(timestamp, deltaTime);
    }
}

Graph.prototype.findByID = function(childID) {
    const stack = [this];

    while(stack.length !== 0) {
        const graph = stack.pop();
        const { children, id } = graph;

        if(id === childID) {
            return graph;
        }

        for(let i = children.length - 1; i >= 0; i--) {
            stack.push(children[i]);
        }
    }

    return null;
}

Graph.prototype.drizzle = function(onCall) {
    const stack = [this];

    while(stack.length !== 0) {
        const graph = stack.pop();
        const { children } = graph;

        for(let i = children.length - 1; i >= 0; i--) {
            stack.push(children[i]);
        }

        onCall(graph);
    }
}

Graph.prototype.debug = function(context, viewportX, viewportY) {
    const stack = [this];
    const positions = [this.positionX - viewportX, this.positionY - viewportY];

    while(stack.length !== 0) {
        const positionY = positions.pop();
        const positionX = positions.pop();
        const graph = stack.pop();
        const { children } = graph;

        context.save();
        graph.onDebug(context, positionX, positionY);
        context.restore();

        for(let i = children.length - 1; i >= 0; i--) {
            const child = children[i];

            stack.push(child);
            positions.push(positionX + child.positionX);
            positions.push(positionY + child.positionY);
        }
    }
}

Graph.prototype.draw = function(context, viewportX, viewportY) {
    if(this.state !== Graph.STATE.VISIBLE) {
        return;
    }

    const stack = [this];
    const positions = [this.positionX - viewportX, this.positionY - viewportY];

    while(stack.length !== 0) {
        const positionY = positions.pop();
        const positionX = positions.pop();
        const graph = stack.pop();
        const { children } = graph;

        context.save();
        context.globalAlpha = this.opacity;
        graph.onDraw(context, positionX, positionY);
        context.restore();

        for(let i = children.length - 1; i >= 0; i--) {
            const child = children[i];

            if(child.state === Graph.STATE.VISIBLE) {
                stack.push(child);
                positions.push(positionX + child.positionX);
                positions.push(positionY + child.positionY);
            }
        }
    }
}

Graph.prototype.getGraph = function() {
    const result = [];
    const stack = [this];

    while(stack.length !== 0) {
        const graph = stack.pop();
        const { children } = graph;

        for(let i = children.length - 1; i >= 0; i--) {            
            stack.push(children[i]);
        }

        result.push(graph);
    }

    return result;
}

Graph.prototype.getID = function() {
    return this.id;
}

Graph.prototype.updatePosition = function(deltaX, deltaY) {
    this.positionX += deltaX;
    this.positionY += deltaY;
}

Graph.prototype.setPosition = function(positionX, positionY) {
    this.positionX = positionX;
    this.positionY = positionY;
}

Graph.prototype.hide = function() {
    this.state = Graph.STATE.HIDDEN;
}

Graph.prototype.show = function() {
    this.state = Graph.STATE.VISIBLE;
}

Graph.prototype.setOpacity = function(opacity) {
    if(typeof opacity === "number") {
        const clampedOpacity = clampValue(opacity, 1, 0);

        this.opacity = clampedOpacity;
    }
}

Graph.prototype.getOpacity = function() {
    return this.opacity;
}

Graph.prototype.hasParent = function() {
    return this.parent !== null;
}

Graph.prototype.hasChild = function(name) {
    for(let i = 0; i < this.children.length; i++) {
        const child = this.children[i];

        if(child.name === name) {
            return true;
        }
    }

    return false;
}

Graph.prototype.getChild = function(name) {
    for(let i = 0; i < this.children.length; i++) {
        const child = this.children[i];

        if(child.name === name) {
            return child;
        }
    }

    return null;
}

Graph.prototype.removeChild = function(childID) {
    for(let i = 0; i < this.children.length; i++) {
        const child = this.children[i];

        if(child.id === childID) {
            this.children.splice(i, 1);
            return;
        }
    }
}

Graph.prototype.closeGraph = function() {
    if(this.parent !== null) {
        this.parent.removeChild(this.id);
        this.parent = null;
    }

    for(let i = 0; i < this.children.length; i++) {
        this.children[i].parent = null;
    }

    this.children.length = 0;
}

Graph.prototype.getChildName = function(childID, name) {
    if(typeof name !== "string" || this.hasChild(name)) {
        return childID;
    }

    return name;
}

Graph.prototype.addChild = function(child, name) {
    const childID = child.getID();
    const activeChild = this.findByID(childID);

    if(activeChild) {
        return null;
    }

    const childName = this.getChildName(childID, name);

    child.setName(childName);
    child.setParent(this);

    this.children.push(child);

    return childName;
}

Graph.prototype.setName = function(name) {
    if(name !== undefined) {
        this.name = name;
    }
}

Graph.prototype.setParent = function(parent) {
    if(this.parent !== null) {
        this.parent.removeChild(this.id);
    }

    this.parent = parent;
}