export const IDGenerator = function(prefix) {
  this.currentID = 0;
  this.prefix = prefix;
}

IDGenerator.prototype.generateID = function() {
  const timestamp = Date.now();
  const id = `${this.prefix}-${timestamp}-${this.currentID}`;
  return id;
}

IDGenerator.prototype.getID = function() {
  const id = this.generateID();
  this.currentID ++;
  return id;
}

IDGenerator.prototype.reset = function() {
  this.currentID = 0;
}