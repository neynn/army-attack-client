import { EventEmitter } from "../events/eventEmitter.js";
import { Queue } from "../queue.js";

export const RequestQueue = function() {
    Queue.call(this);

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

RequestQueue.PRIORITY_NORMAL = 0;
RequestQueue.PRIORITY_SUPER = 1;
RequestQueue.EVENT_REQUEST_VALID = "EVENT_REQUEST_VALID";
RequestQueue.EVENT_REQUEST_INVALID = "EVENT_REQUEST_INVALID";
RequestQueue.EVENT_REQUEST_RUN = "EVENT_REQUEST_RUN";

RequestQueue.prototype = Object.create(Queue.prototype);
RequestQueue.prototype.constructor = RequestQueue;

RequestQueue.prototype.createRequest = function(type, ...args) {
    const actionType = this.requestHandlers[type];
    
    if(!actionType) {
        return {};
    }

    const request = actionType.createRequest(...args);

    request.type = type;
    
    return request;
}

RequestQueue.prototype.addRequest = function(request, messengerID = null) {
    const actionType = this.requestHandlers[request.type];

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
    const actionType = this.requestHandlers[request.type];

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
    const { type } = request;
    const actionType = this.requestHandlers[type];

    if(!actionType) {
        return false;
    }

    const isValid = actionType.isValid(gameContext, request, messengerID);

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

RequestQueue.prototype.start = function() {
    this.toActive();
}

RequestQueue.prototype.end = function() {
    this.requests[RequestQueue.PRIORITY_NORMAL].length = 0;
    this.requests[RequestQueue.PRIORITY_SUPER].length = 0;
    this.isSkipping = false;
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