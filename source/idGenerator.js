export const IDGenerator = function(prefix) {
  this.currentID = 0;
  this.generator = this.startGenerator();
  this.prefix = prefix;
}

IDGenerator.prototype.startGenerator = function*() {
  while(true) {
    this.currentID ++;
    const timestamp = Date.now();
    yield `${this.prefix}-${timestamp}-${this.currentID}`;
  }
}

IDGenerator.prototype.getID = function() {
  return this.generator.next().value;
}

IDGenerator.prototype.reset = function() {
  this.currentID = 0;
}

IDGenerator.prototype.stop = function() {
	this.generator.return();
}