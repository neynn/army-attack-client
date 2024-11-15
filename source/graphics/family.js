export const Family = function(reference, name, DEBUG_NAME = "AUTO") {
    this.id = Symbol(DEBUG_NAME);
    this.reference = reference;
    this.name = name;
    this.parent = null;
    this.children = [];
}

Family.prototype.setParent = function(parent) {
    if(parent.id === this.id) {
        return false;
    }

    if(this.parent !== null) {
        this.parent.removeChild(this);
    }

    this.parent = parent;

    return true;
}

Family.prototype.addChild = function(child) {
    if(child.id === this.id) {
        return false;
    }

    if(this.hasChild(child.id, child.name)) {
        return false;
    }

    this.children.push(child);
    child.setParent(this);
    
    return true;
}

Family.prototype.removeChild = function(child) {
    for(let i = 0; i < this.children.length; i++) {
        if(this.children[i].id === child.id) {
            this.children.splice(i, 1);
            child.parent = null;

            return true;
        }
    }

    return false;
}

Family.prototype.onRemove = function() {
    if(this.parent !== null) {
        this.parent.removeChild(this);
    }

    for(const child of this.children) {
        child.parent = null;
    }

    this.children = [];
    this.parent = null;
}

Family.prototype.hasChild = function(id, name) {
    for(const child of this.children) {
        if(child.id === id || child.name !== null && child.name === name) {
            return true;
        }
    }

    return false;
}

Family.prototype.getChildByName = function(name) {
    for(const child of this.children) {
        if(child.name !== null && child.name === name) {
            return child;
        }
    }

    return null;
}

Family.prototype.getParent = function() {
    return this.parent;
}

Family.prototype.getChildren = function() {
    return this.children;
}

Family.prototype.getReference = function() {
    return this.reference;
}
