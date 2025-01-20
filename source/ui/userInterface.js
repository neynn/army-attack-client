export const UserInterface = function(id) {
    this.id = id;
    this.elements = [];
    this.roots = [];
}

UserInterface.prototype.addElement = function(elementID) {
    this.elements.push(elementID);
}

UserInterface.prototype.addRoot = function(rootID) {
    this.roots.push(rootID);
}

UserInterface.prototype.getElements = function() {
    return this.elements;
}

UserInterface.prototype.getRoots = function() {
    return this.roots;
}

UserInterface.prototype.getID = function() {
    return this.id;
}