import { EventEmitter } from "../events/eventEmitter.js";
import { Logger } from "../logger.js";
import { Queue } from "../queue.js";

export const RequestQueue = function() {
    this.actionHandlers = new Map();
    this.actionTypes = {};
    this.executionQueue = new Queue(100);
    this.requestQueues = new Map([
        [RequestQueue.PRIORITY.HIGH, new Queue(10)],
        [RequestQueue.PRIORITY.MEDIUM, new Queue(10)],
        [RequestQueue.PRIORITY.LOW, new Queue(10)]
    ]);
    this.current = null;
    this.isSkipping = false;
    this.state = RequestQueue.STATE_INACTIVE;
    this.mode = RequestQueue.MODE_DIRECT;

    this.events = new EventEmitter();
    this.events.listen(RequestQueue.EVENT_EXECUTION_DEFER);
    this.events.listen(RequestQueue.EVENT_EXECUTION_ERROR);
    this.events.listen(RequestQueue.EVENT_EXECUTION_RUNNING);
    this.events.listen(RequestQueue.EVENT_QUEUE_ERROR);
}

RequestQueue.MODE_DIRECT = 0;
RequestQueue.MODE_DEFERRED = 1;
RequestQueue.MODE_TELL = 2;

RequestQueue.STATE_INACTIVE = 0;
RequestQueue.STATE_ACTIVE = 1;
RequestQueue.STATE_PROCESSING = 2;
RequestQueue.STATE_FLUSH = 3;

RequestQueue.PRIORITY = {
    "HIGH": "HIGH",
    "MEDIUM": "MEDIUM",
    "LOW": "LOW"
};

RequestQueue.EVENT_EXECUTION_DEFER = "EVENT_EXECUTION_DEFER";
RequestQueue.EVENT_EXECUTION_ERROR = "EVENT_EXECUTION_ERROR";
RequestQueue.EVENT_EXECUTION_RUNNING = "EVENT_EXECUTION_RUNNING";
RequestQueue.EVENT_QUEUE_ERROR = "EVENT_QUEUE_ERROR";

RequestQueue.prototype.onUpdate = function(gameContext) {}

RequestQueue.prototype.load = function(actionTypes) {
    if(typeof actionTypes !== "object") {
        Logger.log(false, "ActionTypes cannot be undefined!", "RequestQueue.prototype.load", null);
        return;
    }

    this.actionTypes = actionTypes;
}

RequestQueue.prototype.update = function(gameContext) {
    switch(this.state) {
        case RequestQueue.STATE_ACTIVE: {
            this.startExecution(gameContext);
            break;
        }
        case RequestQueue.STATE_PROCESSING: {
            this.processExecution(gameContext);
            break;
        }
        case RequestQueue.STATE_FLUSH: {
            this.flushExecution(gameContext);
            break;
        }
    }

    const current = this.getCurrent();

    if(!current) {
        this.filterRequestQueue(gameContext);
    }
}

RequestQueue.prototype.flushExecution = function(gameContext) {
    const next = this.next();

    if(!next) {
        return;
    }

    const { type, data } = next;
    const actionType = this.actionHandlers.get(type);

    this.events.emit(RequestQueue.EVENT_EXECUTION_RUNNING, next);
    
    actionType.onStart(gameContext, data);
    actionType.onEnd(gameContext, data);
    actionType.onClear();

    this.isSkipping = false;
    this.clearCurrent();
}

RequestQueue.prototype.startExecution = function(gameContext) {
    const next = this.next();

    if(!next) {
        return;
    }

    const { type, data } = next;
    const actionType = this.actionHandlers.get(type);

    this.setState(RequestQueue.STATE_PROCESSING);
    this.events.emit(RequestQueue.EVENT_EXECUTION_RUNNING, next);
        
    actionType.onStart(gameContext, data);
}

RequestQueue.prototype.processExecution = function(gameContext) {
    const current = this.getCurrent();

    if(!current) {
        return;
    }

    const { type, data } = current;
    const actionType = this.actionHandlers.get(type);

    actionType.onUpdate(gameContext, data);

    const isFinished = actionType.isFinished(gameContext, data);

    if(this.isSkipping || isFinished) {
        actionType.onEnd(gameContext, data);
        actionType.onClear();

        this.isSkipping = false;
        this.clearCurrent();
        this.setState(RequestQueue.STATE_ACTIVE);
    }
}

RequestQueue.prototype.createRequest = function(type, ...args) {
    const actionHandler = this.actionHandlers.get(type);

    if(!actionHandler) {
        return null;
    }

    const template = actionHandler.getTemplate(...args);
    const request = {
        "type": type,
        "data": template
    };

    return request;
}

RequestQueue.prototype.createElement = function(request, priority, messengerID = null) {
    return {
        "request": request,
        "priority": priority,
        "messengerID": messengerID
    };
}

RequestQueue.prototype.addRequest = function(request = {}, messengerID = null) {
    const { type } = request;
    const actionType = this.actionTypes[type];

    if(!actionType) {
        return;
    }

    const { priority } = actionType;
    const priorityQueue = this.requestQueues.get(priority);

    if(!priorityQueue || priorityQueue.isFull()) {
        return;
    }

    const element = this.createElement(request, priority, messengerID);

    priorityQueue.enqueueLast(element);
}

RequestQueue.prototype.filterRequestQueue = function(gameContext) {
    for(const [queueID, queue] of this.requestQueues) {
        const isHit = queue.filterUntilFirstHit(element => this.validateExecution(gameContext, element));

        if(isHit) {
            console.log(queueID);
            break;
        }
    }
}

RequestQueue.prototype.validateExecution = function(gameContext, element) {
    const { request, priority, messengerID } = element;
    const { type, data } = request;
    const actionType = this.actionHandlers.get(type);

    if(!actionType) {
        return false;
    }

    const validatedData = actionType.getValidated(gameContext, data, messengerID);

    if(!validatedData) {
        const errorItem = {
            "type": type,
            "data": data,
            "priority": priority
        };

        this.events.emit(RequestQueue.EVENT_EXECUTION_ERROR, errorItem);

        return false;
    }

    const executionItem = {
        "type": type,
        "data": validatedData,
        "priority": priority
    };

    switch(this.mode) {
        case RequestQueue.MODE_DIRECT: {
            this.enqueue(executionItem);
            break;
        }
        case RequestQueue.MODE_DEFERRED: {
            this.events.emit(RequestQueue.EVENT_EXECUTION_DEFER, executionItem, request);
            break;
        }
        case RequestQueue.MODE_TELL: {
            this.enqueue(executionItem);
            this.events.emit(RequestQueue.EVENT_EXECUTION_DEFER, executionItem, request);
            break;
        }
        default: {
            console.warn(`Unknown mode! ${this.mode}`);
            break;
        }
    }

    return true;
}

RequestQueue.prototype.registerActionHandler = function(typeID, handler) {
    if(this.actionHandlers.has(typeID)) {
        Logger.log(false, "Handler already exist!", "RequestQueue.prototype.registerActionHandler", { typeID });
        return;
    }

    if(this.actionTypes[typeID] === undefined) {
        Logger.log(false, "ActionType does not exist!", "RequestQueue.prototype.registerActionHandler", { typeID });
        return;
    }

    this.actionHandlers.set(typeID, handler);
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
    this.setState(RequestQueue.STATE_INACTIVE);
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

RequestQueue.prototype.enqueue = function(executionItem) {
    const { priority } = executionItem;

    if(this.executionQueue.isFull()) {
        this.events.emit(RequestQueue.EVENT_QUEUE_ERROR, {
            "error": "The execution queue is full. Item has been discarded!",
            "item": executionItem
        });

        return;
    }

    switch(priority) {
        case RequestQueue.PRIORITY.HIGH: {
            this.executionQueue.enqueueLast(executionItem);
            break;
        }
        case RequestQueue.PRIORITY.MEDIUM: {
            this.executionQueue.enqueueFirst(executionItem);
            break;
        }
        case RequestQueue.PRIORITY.LOW: {
            this.executionQueue.enqueueFirst(executionItem);
            break;
        }
        default: {
            console.warn(`Unknown priority! ${priority}`);
            break;
        }
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

RequestQueue.prototype.setState = function(state = RequestQueue.STATE_INACTIVE) {
    this.state = state;
}

RequestQueue.prototype.skip = function() {
    if(this.isRunning()) {
        this.isSkipping = true;
    }
}