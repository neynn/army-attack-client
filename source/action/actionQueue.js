import { EventEmitter } from "../events/eventEmitter.js";
import { Queue } from "../queue.js";

export const ActionQueue = function() {
    this.actionHandlers = new Map();
    this.actionTypes = {};
    this.maxInstantActions = 100;
    this.immediateQueue = new Queue(100);
    this.executionQueue = new Queue(100);
    this.current = null;
    this.isSkipping = false;
    this.state = ActionQueue.STATE.ACTIVE;
    this.mode = ActionQueue.MODE.DIRECT;

    this.events = new EventEmitter();
    this.events.listen(ActionQueue.EVENT.EXECUTION_DEFER);
    this.events.listen(ActionQueue.EVENT.EXECUTION_ERROR);
    this.events.listen(ActionQueue.EVENT.EXECUTION_RUNNING);
    this.events.listen(ActionQueue.EVENT.QUEUE_ERROR);
}

ActionQueue.STATE = {
    NONE: 0,
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
        console.error("ActionType cannot be undefined!");
        return;
    }

    this.actionTypes = actionTypes;
}

ActionQueue.prototype.updateInstant = function(gameContext) {
    let instantActionsExecuted = 0;

    while(instantActionsExecuted < this.maxInstantActions && this.current && this.current.isInstant) {
        this.flushExecution(gameContext);
        this.current = this.executionQueue.getNext();

        if(!this.current && !this.immediateQueue.isEmpty()) {
            this.updateImmediateQueue(gameContext);
            this.current = this.executionQueue.getNext();
        }

        instantActionsExecuted++;
    }

    const limitReached = instantActionsExecuted === this.maxInstantActions && this.current && this.current.isInstant;

    return limitReached;
}

ActionQueue.prototype.update = function(gameContext) {
    if(!this.current) {
        this.current = this.executionQueue.getNext();
    }

    const limitReached = this.updateInstant(gameContext);

    if(limitReached) {
        return;
    }

    switch(this.state) {
        case ActionQueue.STATE.ACTIVE: {
            this.startExecution(gameContext);
            break;
        }
        case ActionQueue.STATE.PROCESSING: {
            this.processExecution(gameContext);
            break;
        }
        case ActionQueue.STATE.FLUSH: {
            this.flushExecution(gameContext);
            break;
        }
    }

    this.updateImmediateQueue(gameContext);
}

ActionQueue.prototype.flushExecution = function(gameContext) {
    if(!this.current) {
        return;
    }

    const { type, data } = this.current;
    const actionType = this.actionHandlers.get(type);

    this.events.emit(ActionQueue.EVENT.EXECUTION_RUNNING, this.current);
    
    actionType.onStart(gameContext, data);
    actionType.onEnd(gameContext, data);

    this.clearCurrent();
}

ActionQueue.prototype.startExecution = function(gameContext) {
    if(!this.current) {
        return;
    }

    const { type, data } = this.current;
    const actionType = this.actionHandlers.get(type);

    this.state = ActionQueue.STATE.PROCESSING;
    this.events.emit(ActionQueue.EVENT.EXECUTION_RUNNING, this.current);
        
    actionType.onStart(gameContext, data);
}

ActionQueue.prototype.processExecution = function(gameContext) {
    if(!this.current) {
        return;
    }

    const { type, data } = this.current;
    const actionType = this.actionHandlers.get(type);

    actionType.onUpdate(gameContext, data);

    const isFinished = actionType.isFinished(gameContext, data);

    if(this.isSkipping || isFinished) {
        actionType.onEnd(gameContext, data);

        this.state = ActionQueue.STATE.ACTIVE;
        this.clearCurrent();
    }
}

ActionQueue.prototype.createRequest = function(type, ...args) {
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

ActionQueue.prototype.addImmediateRequest = function(type, messengerID, ...args) {
    const actionHandler = this.actionHandlers.get(type);

    if(!actionHandler) {
        return;
    }

    if(this.immediateQueue.isFull()) {
        return;
    }

    const template = actionHandler.getTemplate(...args);
    const immediateItem = {
        "request": {
            "type": type,
            "data": template
        },
        "messengerID": messengerID
    };

    this.immediateQueue.enqueueLast(immediateItem);
}

ActionQueue.prototype.updateImmediateQueue = function(gameContext) {
    if(this.current) {
        return;
    }

    this.immediateQueue.filterUntilFirstHit(element => {
        const { request, messengerID } = element;
        const executionItem = this.getExecutionItem(gameContext, request, messengerID);

        if(executionItem) {
            this.enqueueExecutionItem(executionItem, request);
        }

        return executionItem !== null;
    });
}

ActionQueue.prototype.getExecutionItem = function(gameContext, request, messengerID) {
    const { type, data } = request;
    const actionHandler = this.actionHandlers.get(type);
    const actionType = this.actionTypes[type];

    if(!actionHandler) {
        return null;
    }

    const { priority, isInstant } = actionType;
    const validatedData = actionHandler.getValidated(gameContext, data, messengerID);

    if(!validatedData) {
        this.events.emit(ActionQueue.EVENT.EXECUTION_ERROR, request, actionType);
        return null;
    }

    const executionItem = {
        "type": type,
        "data": validatedData,
        "priority": priority,
        "isInstant": isInstant
    };

    return executionItem;
}

ActionQueue.prototype.enqueueExecutionItem = function(executionItem, request) {
    switch(this.mode) {
        case ActionQueue.MODE.DIRECT: {
            this.enqueue(executionItem);
            break;
        }
        case ActionQueue.MODE.DEFERRED: {
            const { type } = request;
            const actionType = this.actionTypes[type];
            const { message } = actionType;

            if(message.send) {
                this.events.emit(ActionQueue.EVENT.EXECUTION_DEFER, executionItem, request);
            }

            break;
        }
        case ActionQueue.MODE.TELL: {
            const { type } = request;
            const actionType = this.actionTypes[type];
            const { message } = actionType;

            this.enqueue(executionItem);

            if(message.send) {
                this.events.emit(ActionQueue.EVENT.EXECUTION_DEFER, executionItem, request);
            }

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
        console.warn(`Action ${typeID} is already registered!`);
        return;
    }

    if(this.actionTypes[typeID] === undefined) {
        console.warn(`ActionType ${typeID} does not exist!`);
        return;
    }

    this.actionHandlers.set(typeID, handler);
}

ActionQueue.prototype.exit = function() {
    this.immediateQueue.clear();
    this.executionQueue.clear();
    this.mode = ActionQueue.MODE.DIRECT;
    this.state = ActionQueue.STATE.ACTIVE;
    this.clearCurrent();
}

ActionQueue.prototype.clearCurrent = function() {
    this.isSkipping = false;
    this.current = null;
}

ActionQueue.prototype.enqueue = function(executionItem) {
    if(this.executionQueue.isFull()) {
        this.events.emit(ActionQueue.EVENT.QUEUE_ERROR, {
            "error": "The execution queue is full. Item has been discarded!",
            "item": executionItem
        });

        return;
    }

    const { priority } = executionItem;
    
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

ActionQueue.prototype.toFlush = function() {
    this.state = ActionQueue.STATE.FLUSH;
}

ActionQueue.prototype.toDeferred = function() {
    this.mode = ActionQueue.MODE.DEFERRED;
}

ActionQueue.prototype.toDirect = function() {
    this.mode = ActionQueue.MODE.DIRECT;
}

ActionQueue.prototype.skip = function() {
    if(this.isRunning()) {
        this.isSkipping = true;
    }
}