import { EventEmitter } from "../events/eventEmitter.js";
import { Logger } from "../logger.js";
import { Queue } from "../queue.js";

export const ActionQueue = function() {
    this.actionHandlers = new Map();
    this.actionTypes = {};
    this.immediateQueue = new Queue(10);
    this.executionQueue = new Queue(100);
    this.current = null;
    this.isSkipping = false;
    this.state = ActionQueue.STATE.INACTIVE;
    this.mode = ActionQueue.MODE.DIRECT;
    this.maxInstantActions = 10;

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
    if(!this.current) {
        this.current = this.executionQueue.getNext();
    }

    let i = 0;

    while(i < this.maxInstantActions && this.current && this.current.isInstant) {
        this.flushExecution(gameContext);
        this.current = this.executionQueue.getNext();
        i++;
    }

    if(i === this.maxInstantActions && this.current && this.current.isInstant) {
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
        "isInstant": isInstant,
        "messengerID": messengerID
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

            this.events.emit(ActionQueue.EVENT.EXECUTION_DEFER, executionItem, request, actionType);
            break;
        }
        case ActionQueue.MODE.TELL: {
            const { type } = request;
            const actionType = this.actionTypes[type];

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
    this.immediateQueue.clear();
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