export const Graph = function(type = Graph.TYPE.NONE, DEBUG_NAME = "") {
    this.DEBUG_NAME = DEBUG_NAME;
    this.type = type;
    this.id = Graph.NEXT_ID++;
    this.state = Graph.STATE.VISIBLE;
    this.positionX = 0;
    this.positionY = 0;
    this.opacity = 1;
    this.name = "";
    this.parent = null;
    this.children = [];
    this.drawHooks = [];
    this.updateHooks = [];
    this.debugHooks = [];
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

Graph.HOOK = {
    DRAW: 0,
    UPDATE: 1,
    DEBUG: 2
};

Graph.prototype.isType = function(typeID) {
    return this.type === typeID;
}

Graph.prototype.isState = function(stateID) {
    return this.state === stateID;
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

Graph.prototype.update = function(timestamp, deltaTime) {
    const stack = [this];

    while(stack.length !== 0) {
        const graph = stack.pop();
        const { children, updateHooks } = graph;
        const length = updateHooks.length;

        for(let i = children.length - 1; i >= 0; i--) {
            stack.push(children[i]);
        }

        for(let i = 0; i < length; ++i) {
            updateHooks[i](timestamp, deltaTime);
        }
    }
}

Graph.prototype.debug = function(context, viewportX, viewportY) {
    const stack = [this];
    const positions = [this.positionX - viewportX, this.positionY - viewportY];

    while(stack.length !== 0) {
        const positionY = positions.pop();
        const positionX = positions.pop();
        const graph = stack.pop();
        const { children, debugHooks } = graph;
        const length = debugHooks.length;

        context.save();

        for(let i = 0; i < length; ++i) {
            debugHooks[i](context, positionX, positionY);
        }

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
    if(!this.isState(Graph.STATE.VISIBLE)) {
        return;
    }

    const stack = [this];
    const positions = [this.positionX - viewportX, this.positionY - viewportY];

    while(stack.length !== 0) {
        const positionY = positions.pop();
        const positionX = positions.pop();
        const graph = stack.pop();
        const { children, drawHooks } = graph;
        const length = drawHooks.length;

        context.save();
        context.globalAlpha = this.opacity;

        for(let i = 0; i < length; ++i) {
            drawHooks[i](context, positionX, positionY);
        }

        context.restore();

        for(let i = children.length - 1; i >= 0; i--) {
            const child = children[i];

            if(child.isState(Graph.STATE.VISIBLE)) {
                stack.push(child);
                positions.push(positionX + child.positionX);
                positions.push(positionY + child.positionY);
            }
        }
    }
}

Graph.prototype.clearHooks = function(type) {
    switch(type) {
        case Graph.HOOK.DRAW: {
            this.drawHooks.length = 0;
            break;
        }
        case Graph.HOOK.UPDATE: {
            this.updateHooks.length = 0;
            break;
        }
        case Graph.HOOK.DEBUG: {
            this.debugHooks.length = 0;
            break;
        }
        default: {
            console.warn(`HookType ${type} does not exist!`);
            break;
        }
    }
}

Graph.prototype.addHook = function(type, onCall) {
    if(typeof onCall !== "function") {
        return;
    }

    switch(type) {
        case Graph.HOOK.DRAW: {
            this.drawHooks.push(onCall);
            break;
        }
        case Graph.HOOK.UPDATE: {
            this.updateHooks.push(onCall);
            break;
        }
        case Graph.HOOK.DEBUG: {
            this.debugHooks.push(onCall);
            break;
        }
        default: {
            console.warn(`HookType ${type} does not exist!`);
            break;
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
        if(opacity > 1) {
            this.opacity = 1;
        } else if(opacity < 0) {
            this.opacity = 0;
        } else {
            this.opacity = opacity;
        }
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

Graph.prototype.getChildByID = function(id) {
    for(let i = 0; i < this.children.length; i++) {
        const child = this.children[i];

        if(child.id === id) {
            return child;
        }
    }

    return null;
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