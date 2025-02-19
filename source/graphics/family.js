export const Family = function(id, reference, name) {
    this.id = id;
    this.reference = reference;
    this.name = name;
    this.parent = null;
    this.children = [];
}

Family.prototype.getID = function() {
    return this.id;
}

Family.prototype.setName = function(name) {
    this.name = name;
}

Family.prototype.setParent = function(parent) {
    if(parent.id === this.id) {
        return;
    }

    if(this.parent !== null) {
        this.parent.removeChild(this);
        this.parent = null;
    }

    this.parent = parent;
}

Family.prototype.addChild = function(child) {
    if(child.id === this.id) {
        return;
    }

    for(let i = 0; i < this.children.length; i++) {
        const element = this.children[i];

        if(element.id === child.id || element.name === child.name) {
            return;
        }
    }

    this.children.push(child);
}

Family.prototype.removeChild = function(element) {
    for(let i = 0; i < this.children.length; i++) {
        const child = this.children[i];

        if(child.id === element.id) {
            this.children.splice(i, 1);
            return;
        }
    }
}

Family.prototype.onRemove = function() {
    if(this.parent !== null) {
        this.parent.removeChild(this);
        this.parent = null;
    }

    for(const child of this.children) {
        child.parent = null;
    }

    this.children = [];
    this.parent = null;
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

Family.prototype.hasChild = function(name) {
    for(let i = 0; i < this.children.length; i++) {
        const child = this.children[i];

        if(child.name === name) {
            return true;
        }
    }

    return false;
}

Family.prototype.getChildByName = function(name) {
    for(let i = 0; i < this.children.length; i++) {
        const child = this.children[i];

        if(child.name === name) {
            return child;
        }
    }

    return null;
}
