export const Queue = function() {
    this.queue = [];
    this.current = null;
    this.isSkipping = false;
    this.maxSize = 0;
    this.state = Queue.STATE_IDLE;
}

Queue.STATE_IDLE = 0;
Queue.STATE_ACTIVE = 1;
Queue.STATE_PROCESSING = 2;

Queue.prototype.update = function(gameContext) {

}

Queue.prototype.clearQueue = function() {
    this.queue.length = 0;
}

Queue.prototype.clearCurrent = function() {
    this.current = null;
}

Queue.prototype.setMaxSize = function(maxSize) {
    if(maxSize === undefined) {
        return;
    }

    this.maxSize = maxSize;
}

Queue.prototype.getCurrent = function() {
    return this.current;
}

Queue.prototype.next = function() {
    if(this.queue.length === 0) {
        this.current = null;
    } else {
        this.current = this.queue.shift();
    }

    return this.current;
}

Queue.prototype.enqueue = function(item) {
    if(this.queue.length >= this.maxSize) {
        return;
    }

    if(!item) {
        return;
    }

    this.queue.push({
        "time": Date.now(),
        "item": item
    });
}

Queue.prototype.enqueuePriority = function(item) {
    if(this.queue.length >= this.maxSize) {
        return;
    }

    if(!item) {
        return;
    }

    this.queue.unshift({
        "time": Date.now(),
        "item": item
    });
}

Queue.prototype.isEmpty = function() {
    return this.queue.length === 0;
}

Queue.prototype.isRunning = function() {
    return this.queue.length !== 0 || this.current !== null;
}

Queue.prototype.toIdle = function() {
    this.state = Queue.STATE_IDLE;
}

Queue.prototype.toActive = function() {
    this.state = Queue.STATE_ACTIVE;
}

Queue.prototype.toProcessing = function() {
    this.state = Queue.STATE_PROCESSING;
}

Queue.prototype.skip = function() {
    if(this.isRunning()) {
        this.isSkipping = true;
    }
}