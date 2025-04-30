export const DualSet = function() {
    this.previous = new Set();
    this.current = new Set();
}

DualSet.prototype.reset = function() {
    [this.previous, this.current] = [this.current, this.previous];
    this.current.clear();
}

DualSet.prototype.getCurrent = function() {
    return this.current;
}
