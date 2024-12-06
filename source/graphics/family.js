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

Family.prototype.overwriteName = function(name) {
    this.name = name;
}

Family.prototype.setParent = function(parent) {
    if(parent.id === this.id) {
        return;
    }

    if(this.parent !== null) {
        this.parent.removeChild(this);
    }

    this.parent = parent;
}

Family.prototype.addChild = function(child) {
    if(child.id === this.id) {
        return;
    }

    for(const element of this.children) {
        if(element.id === child.id || element.name === child.name) {
            return;
        }
    }

    this.children.push(child);
    child.setParent(this);
}

Family.prototype.removeChild = function(child) {
    for(let i = 0; i < this.children.length; i++) {
        if(this.children[i].id === child.id) {
            this.children.splice(i, 1);

            child.parent = null;

            return;
        }
    }
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
    for(const child of this.children) {
        if(child.name === name) {
            return true;
        }
    }

    return false;
}

Family.prototype.getChildByName = function(name) {
    for(const child of this.children) {
        if(child.name === name) {
            return child;
        }
    }

    return null;
}
