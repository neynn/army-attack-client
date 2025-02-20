export const Graph = function(reference) {
    this.id = Graph.LATEST_ID++;
    this.name = Graph.DEFAULT_NAME;
    this.reference = reference;
    this.parent = null;
    this.children = [];
}

Graph.LATEST_ID = 0;

Graph.DEFAULT_NAME = "DEFAULT";

Graph.prototype.link = function(child) {
    this.addChild(child);
    child.setParent(this);
}

Graph.prototype.extract = function() {
    for(let i = 0; i < this.children.length; i++) {
        this.children[i].parent = null;
    }

    if(this.parent !== null) {
        this.parent.removeChild(this);

        for(let i = 0; i < this.children.length; i++) {
            this.parent.link(this.children[i]);
        }

        this.parent = null;
    }

    this.children.length = 0;
}

Graph.prototype.destroy = function() {
    if(this.parent !== null) {
        this.parent.removeChild(this);
        this.parent = null;
    }

    for(let i = 0; i < this.children.length; i++) {
        this.children[i].parent = null;
    }

    this.children.length = 0;
}

Graph.prototype.setName = function(name) {
    if(name !== undefined) {
        this.name = name;
    }
}

Graph.prototype.setParent = function(parent) {
    if(parent.id === this.id) {
        return;
    }

    if(this.parent !== null) {
        this.parent.removeChild(this);
    }

    this.parent = parent;
}

Graph.prototype.addChild = function(child) {
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

Graph.prototype.removeChild = function(element) {
    for(let i = 0; i < this.children.length; i++) {
        const child = this.children[i];

        if(child.id === element.id) {
            this.children.splice(i, 1);
            return;
        }
    }
}

Graph.prototype.getParent = function() {
    return this.parent;
}

Graph.prototype.getChildren = function() {
    return this.children;
}

Graph.prototype.getReference = function() {
    return this.reference;
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