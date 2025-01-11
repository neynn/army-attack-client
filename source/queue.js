export const Queue = function(size = 0) {
    this.size = size;
    this.elements = [];
}

Queue.prototype.getNext = function() {
    if(this.elements.length === 0) {
        return null;
    }

    const element = this.elements.shift();
    const item = element.item;

    return item;
}

Queue.prototype.filterAll = function(onCheck) {
    for(let i = 0; i < this.elements.length; i++) {
        const element = this.elements[i];
        const { item } = element;

        onCheck(item);
    }

    this.clear();
}

Queue.prototype.clearElements = function(indices) {
    for(let i = indices.length - 1; i >= 0; i--) {
        const index = indices[i];
        this.elements.splice(index, 1);
    }
}

Queue.prototype.filterUntilFirstHit = function(onCheck) {
    const processedIndices = [];

    for(let i = 0; i < this.elements.length; i++) {
        const element = this.elements[i];
        const { item } = element;
        const isValid = onCheck(item);

        processedIndices.push(i);

        if(isValid) {
            this.clearElements(processedIndices);
            return true;
        }
    }

    this.clearElements(processedIndices);
    return false;
}

Queue.prototype.setSize = function(size = 0) {
    this.size = size;

    if(this.elements.length > size) {
        this.elements.length = size;
    }
}

Queue.prototype.enqueueLast = function(element) {
    if(this.elements.length < this.size) {
        this.elements.push({
            "time": Date.now(),
            "item": element 
        });
    }
}

Queue.prototype.enqueueFirst = function(element) {
    if(this.elements.length < this.size) {
        this.elements.unshift({
            "time": Date.now(),
            "item": element 
        });
    }
}

Queue.prototype.clear = function() {
    this.elements = [];
}

Queue.prototype.getSize = function() {
    return this.elements.length;
}

Queue.prototype.isFull = function() {
    return this.elements.length >= this.size;
}