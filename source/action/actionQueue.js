import { EventEmitter } from "../events/eventEmitter.js";
import { Queue } from "../queue.js";
import { Action } from "./action.js";
import { ActionRequest } from "./actionRequest.js";

export const ActionQueue = function() {
    this.actionHandlers = new Map();
    this.maxInstantActions = 100;
    this.immediateQueue = new Queue(100);
    this.executionQueue = new Queue(100);
    this.current = null;
    this.isSkipping = false;
    this.state = ActionQueue.STATE.ACTIVE;

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

ActionQueue.EVENT = {
    EXECUTION_DEFER: "EXECUTION_DEFER",
    EXECUTION_ERROR: "EXECUTION_ERROR",
    EXECUTION_RUNNING: "EXECUTION_RUNNING",
    QUEUE_ERROR: "QUEUE_ERROR"
};

ActionQueue.prototype.isSendable = function(typeID) {
    const actionType = this.actionHandlers.get(typeID);

    if(!actionType) {
        return false;
    }

    const isSendable = actionType.isSendable();

    return isSendable;
}

ActionQueue.prototype.updateInstant = function(gameContext) {
    let instantActionsExecuted = 0;

    while(instantActionsExecuted < this.maxInstantActions && this.current) {
        const { type } = this.current;
        const isInstant = this.getInstant(type);

        if(!isInstant) {
            break;
        }

        this.flushExecution(gameContext);
        this.current = this.executionQueue.getNext();

        if(!this.current && !this.immediateQueue.isEmpty()) {
            this.updateImmediateQueue(gameContext);
            this.current = this.executionQueue.getNext();
        }

        instantActionsExecuted++;
    }

    const limitReached = instantActionsExecuted === this.maxInstantActions && this.current && this.getInstant(this.current.type);

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
    const request = new ActionRequest(type, template);

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
        "messengerID": messengerID,
        "request": new ActionRequest(type, template)
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
            this.enqueue(executionItem);

            return true;
        }

        return false;
    });
}

ActionQueue.prototype.getInstant = function(typeID) {
    const actionType = this.actionHandlers.get(typeID);

    if(!actionType) {
        return false;
    }

    const { isInstant } = actionType;

    return isInstant;
}

ActionQueue.prototype.getPriority = function(typeID) {
    const actionType = this.actionHandlers.get(typeID);

    if(!actionType) {
        return Action.PRIORITY.NONE;
    }

    const { priority } = actionType;

    return priority;
}

ActionQueue.prototype.getExecutionItem = function(gameContext, request, messengerID) {
    const { type, data } = request;
    const actionHandler = this.actionHandlers.get(type);

    if(!actionHandler) {
        return null;
    }

    const validatedData = actionHandler.getValidated(gameContext, data, messengerID);

    if(!validatedData) {
        this.events.emit(ActionQueue.EVENT.EXECUTION_ERROR, request);

        return null;
    }

    const executionItem = new ActionRequest(type, validatedData);

    return executionItem;
}

ActionQueue.prototype.registerAction = function(typeID, handler) {
    if(this.actionHandlers.has(typeID)) {
        console.warn(`Action ${typeID} is already registered!`);
        return;
    }

    this.actionHandlers.set(typeID, handler);
}

ActionQueue.prototype.exit = function() {
    this.events.muteAll();
    this.immediateQueue.clear();
    this.executionQueue.clear();
    this.state = ActionQueue.STATE.ACTIVE;
    this.isSkipping = false;
    this.current = null;
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

    const { type } = executionItem;
    const priority = this.getPriority(type);

    switch(priority) {
        case Action.PRIORITY.HIGH: {
            this.executionQueue.enqueueFirst(executionItem);
            break;
        }
        case Action.PRIORITY.LOW: {
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

ActionQueue.prototype.skip = function() {
    if(this.isRunning()) {
        this.isSkipping = true;
    }
}