import { EventEmitter } from "../events/eventEmitter.js";
import { Queue } from "../queue.js";

export const RequestQueue = function() {
    this.requestHandlers = {};
    this.executionQueue = new Queue(100);
    this.requestQueues = new Map([
        [RequestQueue.PRIORITY_NORMAL, new Queue(10)],
        [RequestQueue.PRIORITY_SUPER, new Queue(10)]
    ]);
    this.current = null;
    this.isSkipping = false;
    this.state = RequestQueue.STATE_IDLE;
    this.mode = RequestQueue.MODE_DIRECT;

    this.events = new EventEmitter();
    this.events.listen(RequestQueue.EVENT_REQUEST_DEFER);
    this.events.listen(RequestQueue.EVENT_REQUEST_ERROR);
    this.events.listen(RequestQueue.EVENT_REQUEST_RUNNING);
    this.events.listen(RequestQueue.EVENT_QUEUE_ERROR);
}

RequestQueue.MODE_DIRECT = 0;
RequestQueue.MODE_DEFERRED = 1;

RequestQueue.STATE_IDLE = 0;
RequestQueue.STATE_ACTIVE = 1;
RequestQueue.STATE_PROCESSING = 2;

RequestQueue.PRIORITY_NORMAL = "PRIORITY_NORMAL";
RequestQueue.PRIORITY_SUPER = "PRIORITY_SUPER";

RequestQueue.EVENT_REQUEST_DEFER = "EVENT_REQUEST_DEFER";
RequestQueue.EVENT_REQUEST_ERROR = "EVENT_REQUEST_ERROR";
RequestQueue.EVENT_REQUEST_RUNNING = "EVENT_REQUEST_RUNNING";
RequestQueue.EVENT_QUEUE_ERROR = "EVENT_QUEUE_ERROR";

RequestQueue.prototype.update = function(gameContext) {}

RequestQueue.prototype.createRequest = function(type, ...args) {
    const actionType = this.requestHandlers[type];
    
    if(!actionType) {
        return null;
    }

    const template = actionType.getTemplate(...args);
    const request = {
        "type": type,
        "data": template
    };

    return request;
}

RequestQueue.prototype.addRequest = function(request, priority = RequestQueue.PRIORITY_NORMAL, messengerID = null) {
    if(!request) {
        return;
    }

    const { type } = request;
    const actionType = this.requestHandlers[type];
    const priorityQueue = this.requestQueues.get(priority);

    if(!actionType || !priorityQueue || priorityQueue.isFull()) {
        return;
    }

    const element = {
        "request": request,
        "priority": priority,
        "messengerID": messengerID
    };

    priorityQueue.enqueueLast(element);
}

RequestQueue.prototype.filterRequests = function(gameContext, priority) {
    const priorityQueue = this.requestQueues.get(priority);

    if(!priorityQueue) {
        return;
    }

    priorityQueue.filterUntilFirstHit(element => this.validateExecution(gameContext, element));
}

RequestQueue.prototype.validateExecution = function(gameContext, element) {
    const { request, priority, messengerID } = element;
    const { type, data } = request;
    const actionType = this.requestHandlers[type];

    if(!actionType) {
        return false;
    }

    const validatedData = actionType.getValidated(gameContext, data, messengerID);

    if(!validatedData) {
        const executionItem = {
            "type": type,
            "data": data,
            "priority": priority,
            "valid": false
        };

        this.events.emit(RequestQueue.EVENT_REQUEST_ERROR, executionItem);

        return false;
    }

    const executionItem = {
        "type": type,
        "data": validatedData,
        "priority": priority,
        "valid": true
    };

    if(this.mode === RequestQueue.MODE_DIRECT) {
        this.enqueue(executionItem);
    } else if(this.mode === RequestQueue.MODE_DEFERRED) {
        this.events.emit(RequestQueue.EVENT_REQUEST_DEFER, executionItem);
    }

    return true;
}

RequestQueue.prototype.registerHandler = function(handlerID, handler) {
    if(this.requestHandlers[handlerID] !== undefined || !handler) {
        return;
    }

    this.requestHandlers[handlerID] = handler;
}

RequestQueue.prototype.start = function() {
    this.setState(RequestQueue.STATE_ACTIVE);
}

RequestQueue.prototype.reset = function() {
    this.isSkipping = false;
    this.requestQueues.forEach(queue => queue.clear());
    this.executionQueue.clear();
    this.clearCurrent();
    this.setMode(RequestQueue.MODE_DIRECT);
    this.setState(RequestQueue.STATE_IDLE);
}

RequestQueue.prototype.clearCurrent = function() {
    this.current = null;
}

RequestQueue.prototype.getCurrent = function() {
    return this.current;
}

RequestQueue.prototype.next = function() {
    this.current = this.executionQueue.getNext();

    return this.current;
}

RequestQueue.prototype.enqueue = function(item) {
    const { priority } = item;

    if(priority === RequestQueue.PRIORITY_NORMAL) {
        this.executionQueue.enqueueLast(item);
    } else if(priority === RequestQueue.PRIORITY_SUPER) {
        this.executionQueue.enqueueFirst(item);
    }
}

RequestQueue.prototype.isEmpty = function() {
    return this.executionQueue.getSize() === 0;
}

RequestQueue.prototype.isRunning = function() {
    return this.executionQueue.getSize() !== 0 || this.current !== null;
}

RequestQueue.prototype.setMode = function(mode = RequestQueue.MODE_DIRECT) {
    this.mode = mode;
}

RequestQueue.prototype.setState = function(state = RequestQueue.STATE_IDLE) {
    this.state = state;
}

RequestQueue.prototype.skip = function() {
    if(this.isRunning()) {
        this.isSkipping = true;
    }
}