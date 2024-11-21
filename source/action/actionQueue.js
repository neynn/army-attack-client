import { EventEmitter } from "../events/eventEmitter.js";
import { Logger } from "../logger.js";

export const ActionQueue = function() {
    this.actionTypes = {};
    this.requests = [];
    this.queuedActions = [];
    this.isSkipping = false;
    this.currentAction = null;
    this.state = null;
    this.maxSize = 0;
    this.maxRequests = 0;

    this.events = new EventEmitter();
    this.events.listen(ActionQueue.EVENT_ACTION_VALID);
    this.events.listen(ActionQueue.EVENT_ACTION_INVALID);
    this.events.listen(ActionQueue.EVENT_ACTION_RUN);
}

ActionQueue.IDLE = 0;
ActionQueue.PROCESSING = 1;
ActionQueue.EVENT_ACTION_VALID = 0;
ActionQueue.EVENT_ACTION_INVALID = 1;
ActionQueue.EVENT_ACTION_RUN = 2;
ActionQueue.PRIORITY_NORMAL = 0;
ActionQueue.PRIORITY_SUPER = 1;

ActionQueue.prototype.update = function(gameContext) {}

ActionQueue.prototype.addRequest = function(request, messengerID = null) {
    const actionType = this.actionTypes[request.type];

    if(!actionType || this.requests.length >= this.maxRequests) {
        return false;
    }

    this.requests.push({
        "request": request,
        "messengerID": messengerID
    });
    return true;
}

ActionQueue.prototype.addPriorityRequest = function(gameContext, request, messengerID) {
    const actionType = this.actionTypes[request.type];

    if(!actionType || this.requests.length >= this.maxRequests) {
        return false;
    }

    this.validateRequest(gameContext, request, messengerID, ActionQueue.PRIORITY_SUPER);
    return true;
}

ActionQueue.prototype.validateRequest = function(gameContext, request, messengerID, priority) {
    const { type } = request;
    const actionType = this.actionTypes[type];

    if(!actionType) {
        return false;
    }

    const isValid = actionType.isValid(gameContext, request, messengerID);

    if(!isValid) {
        this.events.emit(ActionQueue.EVENT_ACTION_INVALID, request, messengerID, priority);
        return false;
    }

    this.events.emit(ActionQueue.EVENT_ACTION_VALID, request, messengerID, priority);
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

ActionQueue.prototype.start = function() {
    this.state = ActionQueue.IDLE;
}

ActionQueue.prototype.end = function() {
    this.requests.length = 0;
    this.queuedActions.length = 0;
    this.isSkipping = false;
    this.currentAction = null;
    this.state = null;
}

ActionQueue.prototype.queueAction = function(request) {
    if(this.queuedActions.length >= this.maxSize) {
        return false;
    }

    if(!request) {
        return false;
    }

    this.queuedActions.push(request);

    return true;
}

ActionQueue.prototype.queuePriorityAction = function(request) {
    if(this.queuedActions.length >= this.maxSize) {
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
        this.isSkipping = true;
    }
}