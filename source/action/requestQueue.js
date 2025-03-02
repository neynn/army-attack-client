import { EventEmitter } from "../events/eventEmitter.js";
import { Logger } from "../logger.js";
import { Queue } from "../queue.js";

export const RequestQueue = function() {
    this.actionHandlers = new Map();
    this.actionTypes = {};
    this.executionQueue = new Queue(100);
    this.requestQueues = new Map([
        [RequestQueue.PRIORITY.HIGH, new Queue(10)],
        [RequestQueue.PRIORITY.LOW, new Queue(10)]
    ]);
    this.current = null;
    this.isSkipping = false;
    this.state = RequestQueue.STATE.INACTIVE;
    this.mode = RequestQueue.MODE.DIRECT;

    this.events = new EventEmitter();
    this.events.listen(RequestQueue.EVENT.EXECUTION_DEFER);
    this.events.listen(RequestQueue.EVENT.EXECUTION_ERROR);
    this.events.listen(RequestQueue.EVENT.EXECUTION_RUNNING);
    this.events.listen(RequestQueue.EVENT.QUEUE_ERROR);
}

RequestQueue.STATE = {
    INACTIVE: 0,
    ACTIVE: 1,
    PROCESSING: 2,
    FLUSH: 3
};

RequestQueue.MODE = {
    DIRECT: 0,
    DEFERRED: 1,
    TELL: 2
};

RequestQueue.PRIORITY = {
    LOW: "LOW",
    HIGH: "HIGH"
};

RequestQueue.EVENT = {
    EXECUTION_DEFER: "EXECUTION_DEFER",
    EXECUTION_ERROR: "EXECUTION_ERROR",
    EXECUTION_RUNNING: "EXECUTION_RUNNING",
    QUEUE_ERROR: "QUEUE_ERROR"
};

RequestQueue.prototype.load = function(actionTypes) {
    if(typeof actionTypes !== "object") {
        Logger.log(false, "ActionTypes cannot be undefined!", "RequestQueue.prototype.load", null);
        return;
    }

    this.actionTypes = actionTypes;
}

RequestQueue.prototype.update = function(gameContext) {
    switch(this.state) {
        case RequestQueue.STATE.ACTIVE: {
            this.current = this.executionQueue.getNext();
            this.startExecution(gameContext);
            break;
        }
        case RequestQueue.STATE.PROCESSING: {
            this.processExecution(gameContext);
            break;
        }
        case RequestQueue.STATE.FLUSH: {
            this.current = this.executionQueue.getNext();
            this.flushExecution(gameContext);
            break;
        }
    }

    this.updateRequestQueue(gameContext);
}

RequestQueue.prototype.flushExecution = function(gameContext) {
    if(!this.current) {
        return;
    }

    const { type, data, messengerID } = this.current;
    const actionType = this.actionHandlers.get(type);

    this.events.emit(RequestQueue.EVENT.EXECUTION_RUNNING, this.current);
    
    actionType.onStart(gameContext, data, messengerID);
    actionType.onEnd(gameContext, data, messengerID);
    actionType.onClear();

    this.clearCurrent();
}

RequestQueue.prototype.startExecution = function(gameContext) {
    if(!this.current) {
        return;
    }

    const { type, data, messengerID } = this.current;
    const actionType = this.actionHandlers.get(type);

    this.setState(RequestQueue.STATE.PROCESSING);
    this.events.emit(RequestQueue.EVENT.EXECUTION_RUNNING, this.current);
        
    actionType.onStart(gameContext, data, messengerID);
}

RequestQueue.prototype.processExecution = function(gameContext) {
    if(!this.current) {
        return;
    }

    const { type, data, messengerID } = this.current;
    const actionType = this.actionHandlers.get(type);

    actionType.onUpdate(gameContext, data, messengerID);

    const isFinished = actionType.isFinished(gameContext, data, messengerID);

    if(this.isSkipping || isFinished) {
        actionType.onEnd(gameContext, data, messengerID);
        actionType.onClear();

        this.clearCurrent();
        this.setState(RequestQueue.STATE.ACTIVE);
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

RequestQueue.prototype.addRequest = function(request, messengerID = null) {
    if(!request) {
        return;
    }

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

RequestQueue.prototype.updateRequestQueue = function(gameContext) {
    if(this.current) {
        return;
    }

    const queueOrder = [RequestQueue.PRIORITY.HIGH, RequestQueue.PRIORITY.LOW];

    for(let i = 0; i < queueOrder.length; i++) {
        const queueID = queueOrder[i];
        const queue = this.requestQueues.get(queueID);
        const response = queue.filterUntilFirstHit(element => {
            const executionItem = this.getExecutionItem(gameContext, element);

            if(executionItem) {
                this.enqueueExecutionItem(executionItem, element);
            }

            return executionItem !== null;
        });

        if(response === Queue.FILTER.SUCCESS) {
            return;
        }
    }
}

RequestQueue.prototype.getExecutionItem = function(gameContext, element) {
    const { request, priority, messengerID } = element;
    const { type, data } = request;
    const actionHandler = this.actionHandlers.get(type);
    const actionType = this.actionTypes[type];

    if(!actionHandler) {
        return null;
    }

    const validatedData = actionHandler.getValidated(gameContext, data, messengerID);

    if(!validatedData) {
        this.events.emit(RequestQueue.EVENT.EXECUTION_ERROR, request, actionType);

        return null;
    }

    const executionItem = {
        "type": type,
        "data": validatedData,
        "priority": priority,
        "messengerID": messengerID
    };

    return executionItem;
}

RequestQueue.prototype.enqueueExecutionItem = function(executionItem, element) {
    const { request } = element;
    const { type } = request;
    const actionType = this.actionTypes[type];

    switch(this.mode) {
        case RequestQueue.MODE.DIRECT: {
            this.enqueue(executionItem);
            break;
        }
        case RequestQueue.MODE.DEFERRED: {
            this.events.emit(RequestQueue.EVENT.EXECUTION_DEFER, executionItem, request, actionType);
            break;
        }
        case RequestQueue.MODE.TELL: {
            this.enqueue(executionItem);
            this.events.emit(RequestQueue.EVENT.EXECUTION_DEFER, executionItem, request, actionType);
            break;
        }
        default: {
            console.warn(`Unknown mode! ${this.mode}`);
            break;
        }
    }
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
    this.setState(RequestQueue.STATE.ACTIVE);
}

RequestQueue.prototype.reset = function() {
    this.requestQueues.forEach(queue => queue.clear());
    this.executionQueue.clear();
    this.clearCurrent();
    this.setMode(RequestQueue.MODE.DIRECT);
    this.setState(RequestQueue.STATE.INACTIVE);
}

RequestQueue.prototype.clearCurrent = function() {
    this.isSkipping = false;
    this.current = null;
}

RequestQueue.prototype.enqueue = function(executionItem) {
    const { priority } = executionItem;

    if(this.executionQueue.isFull()) {
        this.events.emit(RequestQueue.EVENT.QUEUE_ERROR, {
            "error": "The execution queue is full. Item has been discarded!",
            "item": executionItem
        });

        return;
    }

    switch(priority) {
        case RequestQueue.PRIORITY.HIGH: {
            this.executionQueue.enqueueFirst(executionItem);
            break;
        }
        case RequestQueue.PRIORITY.LOW: {
            this.executionQueue.enqueueLast(executionItem);
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

RequestQueue.prototype.setMode = function(mode = RequestQueue.MODE.DIRECT) {
    this.mode = mode;
}

RequestQueue.prototype.setState = function(state = RequestQueue.STATE.INACTIVE) {
    this.state = state;
}

RequestQueue.prototype.skip = function() {
    if(this.isRunning()) {
        this.isSkipping = true;
    }
}