export const Family = function(id, reference) {
    this.id = id;
    this.reference = reference;
    this.name = null;
    this.parent = null;
    this.children = [];
}

Family.prototype.setName = function(name) {
    if(name === undefined) {
        return false;
    }

    this.name = name;

    return true;
}

Family.prototype.setParent = function(member) {
    if(member.id === this.id) {
        return false;
    }

    if(this.parent !== null) {
        this.parent.removeChild(this);
    }

    this.parent = member;

    return true;
}

Family.prototype.addChild = function(member) {
    if(member.id === this.id) {
        return false;
    }

    if(this.hasChild(member)) {
        return false;
    }

    this.children.push(member);
    member.setParent(this);
    
    return true;
}

Family.prototype.removeChild = function(member) {
    for(let i = 0; i < this.children.length; i++) {
        const child = this.children[i];

        if(child.id === member.id) {
            this.children.splice(i, 1);
            member.parent = null;

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

    return true;
}

Family.prototype.hasChild = function(member) {
    for(const child of this.children) {
        if(child.id === member.id || child.name !== null && child.name === member.name) {
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

Family.prototype.getChildByID = function(id) {
    for(const child of this.children) {
        if(child.id === id) {
            return child;
        }
    }

    return null;
}

Family.prototype.getParent = function() {
    return this.parent;
}

Family.prototype.getAllChildren = function() {
    return this.children;
}

Family.prototype.getReference = function() {
    return this.reference;
}
