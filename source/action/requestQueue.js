import { EventEmitter } from "../events/eventEmitter.js";

export const RequestQueue = function() {
    this.queue = [];
    this.current = null;
    this.isSkipping = false;
    this.maxSize = 0;
    this.state = RequestQueue.STATE_IDLE;
    this.maxRequests = 0;
    this.requestHandlers = {};
    this.requests = {
        [RequestQueue.PRIORITY_NORMAL]: [],
        [RequestQueue.PRIORITY_SUPER]: []
    };

    this.events = new EventEmitter();
    this.events.listen(RequestQueue.EVENT_REQUEST_VALID);
    this.events.listen(RequestQueue.EVENT_REQUEST_INVALID);
    this.events.listen(RequestQueue.EVENT_REQUEST_RUN);
}

RequestQueue.STATE_IDLE = 0;
RequestQueue.STATE_ACTIVE = 1;
RequestQueue.STATE_PROCESSING = 2;
RequestQueue.PRIORITY_NORMAL = 0;
RequestQueue.PRIORITY_SUPER = 1;
RequestQueue.EVENT_REQUEST_VALID = "EVENT_REQUEST_VALID";
RequestQueue.EVENT_REQUEST_INVALID = "EVENT_REQUEST_INVALID";
RequestQueue.EVENT_REQUEST_RUN = "EVENT_REQUEST_RUN";

RequestQueue.prototype.update = function(gameContext) {}

RequestQueue.prototype.createRequest = function(type, ...args) {
    const actionType = this.requestHandlers[type];
    
    if(!actionType) {
        return {};
    }

    const data = actionType.createRequest(...args);
    
    return {
        "data": data,
        "type": type
    };
}

RequestQueue.prototype.addRequest = function(request, messengerID = null) {
    const { type, data } = request;
    const actionType = this.requestHandlers[type];

    if(!actionType || this.requests[RequestQueue.PRIORITY_NORMAL].length >= this.maxRequests) {
        return;
    }

    this.requests[RequestQueue.PRIORITY_NORMAL].push({
        "request": request,
        "messengerID": messengerID,
        "priority": RequestQueue.PRIORITY_NORMAL
    });
}

RequestQueue.prototype.addPriorityRequest = function(request, messengerID = null) {
    const { type, data } = request;
    const actionType = this.requestHandlers[type];

    if(!actionType) {
        return;
    }

    this.requests[RequestQueue.PRIORITY_SUPER].push({
        "request": request,
        "messengerID": messengerID,
        "priority": RequestQueue.PRIORITY_SUPER
    });
}

RequestQueue.prototype.validateRequest = function(gameContext, request, messengerID, priority) {
    const { type, data } = request;
    const actionType = this.requestHandlers[type];

    if(!actionType) {
        return false;
    }

    const isValid = actionType.isValid(gameContext, data, messengerID);

    if(!isValid) {
        this.events.emit(RequestQueue.EVENT_REQUEST_INVALID, request, messengerID, priority);

        return false;
    }

    this.events.emit(RequestQueue.EVENT_REQUEST_VALID, request, messengerID, priority);

    return true;
}

RequestQueue.prototype.registerHandler = function(handlerID, handler) {
    if(this.requestHandlers[handlerID] !== undefined || !handler) {
        return;
    }

    this.requestHandlers[handlerID] = handler;
}

RequestQueue.prototype.clearRequests = function() {
    this.requests[RequestQueue.PRIORITY_NORMAL].length = 0;
    this.requests[RequestQueue.PRIORITY_SUPER].length = 0;
}

RequestQueue.prototype.start = function() {
    this.toActive();
}

RequestQueue.prototype.end = function() {
    this.isSkipping = false;
    this.clearRequests();
    this.clearQueue();
    this.clearCurrent();
    this.toIdle();
}

RequestQueue.prototype.setMaxRequests = function(maxRequests) {
    if(maxRequests === undefined) {
        return;
    }

    this.maxRequests = maxRequests;
}

RequestQueue.prototype.clearQueue = function() {
    this.queue.length = 0;
}

RequestQueue.prototype.clearCurrent = function() {
    this.current = null;
}

RequestQueue.prototype.setMaxSize = function(maxSize) {
    if(maxSize === undefined) {
        return;
    }

    this.maxSize = maxSize;
}

RequestQueue.prototype.getCurrent = function() {
    return this.current;
}

RequestQueue.prototype.next = function() {
    if(this.queue.length === 0) {
        this.current = null;
    } else {
        this.current = this.queue.shift();
    }

    return this.current;
}

RequestQueue.prototype.enqueue = function(request) {
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

RequestQueue.prototype.enqueuePriority = function(request) {
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

RequestQueue.prototype.isEmpty = function() {
    return this.queue.length === 0;
}

RequestQueue.prototype.isRunning = function() {
    return this.queue.length !== 0 || this.current !== null;
}

RequestQueue.prototype.toIdle = function() {
    this.state = RequestQueue.STATE_IDLE;
}

RequestQueue.prototype.toActive = function() {
    this.state = RequestQueue.STATE_ACTIVE;
}

RequestQueue.prototype.toProcessing = function() {
    this.state = RequestQueue.STATE_PROCESSING;
}

RequestQueue.prototype.skip = function() {
    if(this.isRunning()) {
        this.isSkipping = true;
    }
}