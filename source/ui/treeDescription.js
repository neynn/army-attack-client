export const TreeDescripton = function(id) {
    this.id = id;
    this.elements = [];
    this.roots = [];
}

TreeDescripton.prototype.addElement = function(elementID) {
    this.elements.push(elementID);
}

TreeDescripton.prototype.addRoot = function(rootID) {
    this.roots.push(rootID);
}

TreeDescripton.prototype.getElements = function() {
    return this.elements;
}

TreeDescripton.prototype.getRoots = function() {
    return this.roots;
}

TreeDescripton.prototype.getID = function() {
    return this.id;
}