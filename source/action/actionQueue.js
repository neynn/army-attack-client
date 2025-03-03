import { EventEmitter } from "../events/eventEmitter.js";
import { Logger } from "../logger.js";
import { Queue } from "../queue.js";

export const ActionQueue = function() {
    this.actionHandlers = new Map();
    this.actionTypes = {};
    this.executionQueue = new Queue(100);
    this.requestQueues = new Map([
        [ActionQueue.PRIORITY.HIGH, new Queue(10)],
        [ActionQueue.PRIORITY.LOW, new Queue(10)]
    ]);
    this.current = null;
    this.isSkipping = false;
    this.state = ActionQueue.STATE.INACTIVE;
    this.mode = ActionQueue.MODE.DIRECT;

    this.events = new EventEmitter();
    this.events.listen(ActionQueue.EVENT.EXECUTION_DEFER);
    this.events.listen(ActionQueue.EVENT.EXECUTION_ERROR);
    this.events.listen(ActionQueue.EVENT.EXECUTION_RUNNING);
    this.events.listen(ActionQueue.EVENT.QUEUE_ERROR);
}

ActionQueue.STATE = {
    INACTIVE: 0,
    ACTIVE: 1,
    PROCESSING: 2,
    FLUSH: 3
};

ActionQueue.MODE = {
    DIRECT: 0,
    DEFERRED: 1,
    TELL: 2
};

ActionQueue.PRIORITY = {
    LOW: "LOW",
    HIGH: "HIGH"
};

ActionQueue.EVENT = {
    EXECUTION_DEFER: "EXECUTION_DEFER",
    EXECUTION_ERROR: "EXECUTION_ERROR",
    EXECUTION_RUNNING: "EXECUTION_RUNNING",
    QUEUE_ERROR: "QUEUE_ERROR"
};

ActionQueue.prototype.load = function(actionTypes) {
    if(typeof actionTypes !== "object") {
        Logger.log(false, "ActionTypes cannot be undefined!", "ActionQueue.prototype.load", null);
        return;
    }

    this.actionTypes = actionTypes;
}

ActionQueue.prototype.update = function(gameContext) {
    switch(this.state) {
        case ActionQueue.STATE.ACTIVE: {
            this.current = this.executionQueue.getNext();
            this.startExecution(gameContext);
            break;
        }
        case ActionQueue.STATE.PROCESSING: {
            this.processExecution(gameContext);
            break;
        }
        case ActionQueue.STATE.FLUSH: {
            this.current = this.executionQueue.getNext();
            this.flushExecution(gameContext);
            break;
        }
    }

    this.updateRequestQueue(gameContext);
}

ActionQueue.prototype.flushExecution = function(gameContext) {
    if(!this.current) {
        return;
    }

    const { type, data, messengerID } = this.current;
    const actionType = this.actionHandlers.get(type);

    this.events.emit(ActionQueue.EVENT.EXECUTION_RUNNING, this.current);
    
    actionType.onStart(gameContext, data, messengerID);
    actionType.onEnd(gameContext, data, messengerID);;

    this.clearCurrent();
}

ActionQueue.prototype.startExecution = function(gameContext) {
    if(!this.current) {
        return;
    }

    const { type, data, messengerID } = this.current;
    const actionType = this.actionHandlers.get(type);

    this.setState(ActionQueue.STATE.PROCESSING);
    this.events.emit(ActionQueue.EVENT.EXECUTION_RUNNING, this.current);
        
    actionType.onStart(gameContext, data, messengerID);
}

ActionQueue.prototype.processExecution = function(gameContext) {
    if(!this.current) {
        return;
    }

    const { type, data, messengerID } = this.current;
    const actionType = this.actionHandlers.get(type);

    actionType.onUpdate(gameContext, data, messengerID);

    const isFinished = actionType.isFinished(gameContext, data, messengerID);

    if(this.isSkipping || isFinished) {
        actionType.onEnd(gameContext, data, messengerID);

        this.clearCurrent();
        this.setState(ActionQueue.STATE.ACTIVE);
    }
}

ActionQueue.prototype.createElement = function(request, priority, messengerID = null) {
    return {
        "request": request,
        "priority": priority,
        "messengerID": messengerID
    };
}

ActionQueue.prototype.addRequest = function(type, ...args) {
    const actionHandler = this.actionHandlers.get(type);

    if(!actionHandler) {
        return;
    }

    const actionType = this.actionTypes[type];
    const { priority } = actionType;
    const priorityQueue = this.requestQueues.get(priority);

    if(!priorityQueue || priorityQueue.isFull()) {
        return;
    }

    const template = actionHandler.getTemplate(...args);
    const element = this.createElement({
        "type": type,
        "data": template
    }, priority);

    priorityQueue.enqueueLast(element);
}

ActionQueue.prototype.updateRequestQueue = function(gameContext) {
    if(this.current) {
        return;
    }

    const queueOrder = [ActionQueue.PRIORITY.HIGH, ActionQueue.PRIORITY.LOW];

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

ActionQueue.prototype.getExecutionItem = function(gameContext, element) {
    const { request, priority, messengerID } = element;
    const { type, data } = request;
    const actionHandler = this.actionHandlers.get(type);
    const actionType = this.actionTypes[type];

    if(!actionHandler) {
        return null;
    }

    const validatedData = actionHandler.getValidated(gameContext, data, messengerID);

    if(!validatedData) {
        this.events.emit(ActionQueue.EVENT.EXECUTION_ERROR, request, actionType);

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

ActionQueue.prototype.enqueueExecutionItem = function(executionItem, element) {
    const { request } = element;
    const { type } = request;
    const actionType = this.actionTypes[type];

    switch(this.mode) {
        case ActionQueue.MODE.DIRECT: {
            this.enqueue(executionItem);
            break;
        }
        case ActionQueue.MODE.DEFERRED: {
            this.events.emit(ActionQueue.EVENT.EXECUTION_DEFER, executionItem, request, actionType);
            break;
        }
        case ActionQueue.MODE.TELL: {
            this.enqueue(executionItem);
            this.events.emit(ActionQueue.EVENT.EXECUTION_DEFER, executionItem, request, actionType);
            break;
        }
        default: {
            console.warn(`Unknown mode! ${this.mode}`);
            break;
        }
    }
}

ActionQueue.prototype.registerAction = function(typeID, handler) {
    if(this.actionHandlers.has(typeID)) {
        Logger.log(false, "Handler already exist!", "ActionQueue.prototype.registerAction", { typeID });
        return;
    }

    if(this.actionTypes[typeID] === undefined) {
        Logger.log(false, "ActionType does not exist!", "ActionQueue.prototype.registerAction", { typeID });
        return;
    }

    this.actionHandlers.set(typeID, handler);
}

ActionQueue.prototype.start = function() {
    this.setState(ActionQueue.STATE.ACTIVE);
}

ActionQueue.prototype.reset = function() {
    this.requestQueues.forEach(queue => queue.clear());
    this.executionQueue.clear();
    this.clearCurrent();
    this.setMode(ActionQueue.MODE.DIRECT);
    this.setState(ActionQueue.STATE.INACTIVE);
}

ActionQueue.prototype.clearCurrent = function() {
    this.isSkipping = false;
    this.current = null;
}

ActionQueue.prototype.enqueue = function(executionItem) {
    const { priority } = executionItem;

    if(this.executionQueue.isFull()) {
        this.events.emit(ActionQueue.EVENT.QUEUE_ERROR, {
            "error": "The execution queue is full. Item has been discarded!",
            "item": executionItem
        });

        return;
    }

    switch(priority) {
        case ActionQueue.PRIORITY.HIGH: {
            this.executionQueue.enqueueFirst(executionItem);
            break;
        }
        case ActionQueue.PRIORITY.LOW: {
            this.executionQueue.enqueueLast(executionItem);
            break;
        }
        default: {
            console.warn(`Unknown priority! ${priority}`);
            break;
        }
    }
}

ActionQueue.prototype.isEmpty = function() {
    return this.executionQueue.getSize() === 0;
}

ActionQueue.prototype.isRunning = function() {
    return this.executionQueue.getSize() !== 0 || this.current !== null;
}

ActionQueue.prototype.setMode = function(mode = ActionQueue.MODE.DIRECT) {
    this.mode = mode;
}

ActionQueue.prototype.setState = function(state = ActionQueue.STATE.INACTIVE) {
    this.state = state;
}

ActionQueue.prototype.skip = function() {
    if(this.isRunning()) {
        this.isSkipping = true;
    }
}