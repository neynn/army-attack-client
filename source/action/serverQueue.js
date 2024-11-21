import { ActionQueue } from "./actionQueue.js";

/**
 * The ServerQueue updates when a valid request arrives.
 * This removes the need for constant updates.
 */
export const ServerQueue = function() {
    ActionQueue.call(this);
}

ServerQueue.prototype = Object.create(ActionQueue.prototype);
ServerQueue.prototype.constructor = ServerQueue;

ServerQueue.prototype.processRequest = function(gameContext, request, messengerID) {
    const isValid = this.validateRequest(gameContext, request, messengerID, ActionQueue.PRIORITY_NORMAL);

    if(isValid) {
        this.queueAction(request);
        this.update(this);
    }
}

ServerQueue.prototype.update = function(gameContext) {
    if(this.state !== ActionQueue.IDLE || this.isEmpty()) {
        return false;
    }

    this.state = ActionQueue.PROCESSING;

    const request = this.next();

    if(request) {
        const { type } = request;
        const actionType = this.actionTypes[type];

        this.events.emit(ActionQueue.EVENT_ACTION_RUN, request);

        this.currentAction = null;
        
        actionType.onStart(gameContext, request);
        actionType.onEnd(gameContext, request);
        actionType.onClear();
    }

    this.state = ActionQueue.IDLE;

    if(!this.isEmpty()) {
        this.update(gameContext);
    }

    return true;
}