import { EventEmitter } from "../events/eventEmitter.js";

export const ActionQueue = function() {
    this.queue = [];
    this.handlers = {};
    this.current = null;
    this.isSkipping = false;
    this.maxSize = 0;
    this.state = ActionQueue.STATE_IDLE;

    this.events = new EventEmitter();
    this.events.listen(ActionQueue.EVENT_RUN);
}

ActionQueue.STATE_IDLE = 0;
ActionQueue.STATE_ACTIVE = 1;
ActionQueue.STATE_PROCESSING = 2;
ActionQueue.EVENT_RUN = 0;

ActionQueue.prototype.update = function(gameContext) {
    
}

ActionQueue.prototype.start = function() {
    this.toActive();
}

ActionQueue.prototype.end = function() {
    this.isSkipping = false;
    this.clearQueue();
    this.clearCurrent();
    this.toIdle();
}

ActionQueue.prototype.registerHandler = function(handlerID, handler) {
    if(this.handlers[handlerID]) {
        return;
    }

    if(!handler) {
        return;
    }

    this.handlers[handlerID] = handler;
}

ActionQueue.prototype.clearQueue = function() {
    this.queue.length = 0;
}

ActionQueue.prototype.clearCurrent = function() {
    this.current = null;
}

ActionQueue.prototype.setMaxSize = function(maxSize) {
    if(!maxSize) {
        return;
    }

    this.maxSize = maxSize;
}

ActionQueue.prototype.getCurrent = function() {
    return this.current;
}

ActionQueue.prototype.next = function() {
    if(this.queue.length === 0) {
        this.current = null;
    } else {
        this.current = this.queue.shift();
    }

    return this.current;
}

ActionQueue.prototype.enqueue = function(request) {
    if(this.queue.length >= this.maxSize) {
        return;
    }

    if(!request) {
        return;
    }

    this.queue.push({
        "time": Date.now(),
        "request": request
    });
}

ActionQueue.prototype.enqueuePriority = function(request) {
    if(this.queue.length >= this.maxSize) {
        return;
    }

    if(!request) {
        return;
    }

    this.queue.unshift({
        "time": Date.now(),
        "request": request
    });
}

ActionQueue.prototype.isEmpty = function() {
    return this.queue.length === 0;
}

ActionQueue.prototype.isRunning = function() {
    return this.queue.length !== 0 || this.current !== null;
}

ActionQueue.prototype.toIdle = function() {
    this.state = ActionQueue.STATE_IDLE;
}

ActionQueue.prototype.toActive = function() {
    this.state = ActionQueue.STATE_ACTIVE;
}

ActionQueue.prototype.toProcessing = function() {
    this.state = ActionQueue.STATE_PROCESSING;
}

ActionQueue.prototype.skip = function() {
    if(this.isRunning()) {
        this.isSkipping = true;
    }
}