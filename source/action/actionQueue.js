import { EventEmitter } from "../events/eventEmitter.js";
import { Logger } from "../logger.js";

export const ActionQueue = function() {
    this.actionTypes = {};
    this.requests = [];
    this.queuedActions = [];
    this.currentAction = null;
    this.isSkipping = false;
    this.maxSize = 0;
    this.maxRequests = 0;
    this.state = null;

    this.events = new EventEmitter();
    this.events.listen(ActionQueue.EVENT_ACTION_VALID);
    this.events.listen(ActionQueue.EVENT_ACTION_INVALID);
    this.events.listen(ActionQueue.EVENT_ACTION_PROCESS);
}

ActionQueue.IDLE = 0;
ActionQueue.PROCESSING = 1;
ActionQueue.EVENT_ACTION_VALID = 0;
ActionQueue.EVENT_ACTION_INVALID = 1;
ActionQueue.EVENT_ACTION_PROCESS = 2;

ActionQueue.prototype.addAction = function(request) {
    const actionType = this.actionTypes[request.type];

    if(!actionType || this.requests.length > this.maxRequests) {
        return false;
    }

    this.requests.push(request);

    return true;
}

ActionQueue.prototype.addPriorityAction = function(gameContext, request) {
    const actionType = this.actionTypes[request.type];

    if(!actionType || this.requests.length > this.maxRequests) {
        return false;
    }

    const isValid = actionType.validate(gameContext, request);

    if(!isValid) {
        this.events.emit(ActionQueue.EVENT_ACTION_INVALID, request);
        return false;
    }

    this.queuePriorityAction(request);
    this.events.emit(ActionQueue.EVENT_ACTION_VALID, request);

    return true;
}

ActionQueue.prototype.registerAction = function(actionID, action) {
    if(this.actionTypes[actionID] !== undefined || !action) {
        Logger.log(false, "ActionType is already registered!", "ActionQueue.prototype.registerAction", {actionID});

        return false;
    }

    this.actionTypes[actionID] = action;

    return true;
}

ActionQueue.prototype.workStart = function() {
    this.state = ActionQueue.IDLE;
}

ActionQueue.prototype.workEnd = function() {
    this.state = null;
    this.queuedActions.length = 0;
    this.currentAction = null;
}

ActionQueue.prototype.processRequests = function(gameContext) {
    if(this.isRunning()) {
        return false;
    }

    const deletableActions = [];

    for(let i = 0; i < this.requests.length; i++) {
        const request = this.requests[i];
        const actionType = this.actionTypes[request.type];

        deletableActions.push(i);

        if(!actionType) {
            continue;
        }

        const isValid = actionType.validate(gameContext, request);

        if(!isValid) {
            this.events.emit(ActionQueue.EVENT_ACTION_INVALID, request);
            continue;
        }

        this.events.emit(ActionQueue.EVENT_ACTION_VALID, request);
        break;
    }

    for(let i = deletableActions.length - 1; i > -1; i--) {
        const actionIndex = deletableActions[i];
        this.requests.splice(actionIndex, 1);
    }

    return true;
}

ActionQueue.prototype.update = function(gameContext) {
    if(this.state === ActionQueue.IDLE) {
        this.processRequests(gameContext);
        const request = this.next();

        if(request) {
            const { type } = request;
            const actionType = this.actionTypes[type];

            this.state = ActionQueue.PROCESSING;
            this.events.emit(ActionQueue.EVENT_ACTION_PROCESS, request);
            
            actionType.onStart(gameContext, request);
        }
    } else if(this.state === ActionQueue.PROCESSING) {
        const request = this.getCurrentAction();
        const { type } = request;
        const actionType = this.actionTypes[type];
        const isFinished = actionType.onUpdate(gameContext, request);
    
        if(this.isSkipping) {
            this.isSkipping = false;
            this.state = ActionQueue.IDLE;
            this.currentAction = null; // <-- Causes processRequests to immediately process a new action!
        } else if(isFinished) {
            actionType.onEnd(gameContext, request);
            actionType.onClear();
            this.state = ActionQueue.IDLE;
            this.currentAction = null; // <-- Causes processRequests to immediately process a new action!
        }
    }
}

ActionQueue.prototype.queueAction = function(request) {
    if(this.queuedActions.length > this.maxSize) {
        return false;
    }

    if(!request) {
        return false;
    }

    this.queuedActions.push(request);

    return true;
}

ActionQueue.prototype.queuePriorityAction = function(request) {
    if(this.queuedActions.length > this.maxSize) {
        return false;
    }

    if(!request) {
        return false;
    }

    this.queuedActions.unshift(request);

    return true;
}

ActionQueue.prototype.getCurrentAction = function() {
    return this.currentAction;
}

ActionQueue.prototype.isEmpty = function() {
    return this.queuedActions.length === 0;
}

ActionQueue.prototype.isRunning = function() {
    return this.queuedActions.length !== 0 || this.currentAction !== null;
}

ActionQueue.prototype.setMaxSize = function(maxSize) {
    if(maxSize === undefined) {
        return false;
    }

    this.maxSize = maxSize;

    return true;
}

ActionQueue.prototype.setMaxRequests = function(maxRequests) {
    if(maxRequests === undefined) {
        return false;
    }

    this.maxRequests = maxRequests;

    return true;
}

ActionQueue.prototype.next = function() {
    if(this.queuedActions.length === 0) {
        this.currentAction = null;
    } else {
        this.currentAction = this.queuedActions.shift();
    }

    return this.currentAction;
}

ActionQueue.prototype.skipAction = function() {
    if(this.isRunning()) {
        this.state = ActionQueue.IDLE;
        this.isSkipping = true;
    }
}