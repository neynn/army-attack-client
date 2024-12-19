import { RequestQueue } from "./requestQueue.js";

/**
 * The ServerQueue updates when a valid request arrives.
 * This removes the need for constant updates.
 */
export const ServerQueue = function() {
    RequestQueue.call(this);

    this.setMode(RequestQueue.MODE_DIRECT);
}

ServerQueue.prototype = Object.create(RequestQueue.prototype);
ServerQueue.prototype.constructor = ServerQueue;

ServerQueue.prototype.processRequest = function(gameContext, clientRequest, messengerID) {
    const element = {
        "request": clientRequest,
        "priority": RequestQueue.PRIORITY_NORMAL,
        "messengerID": messengerID
    };
    const isValid = this.validateExecution(gameContext, element);

    if(isValid) {
        this.update(this);
    }
}

ServerQueue.prototype.update = function(gameContext) {
    if(this.state !== RequestQueue.STATE_ACTIVE || this.isEmpty()) {
        return;
    }

    this.setState(RequestQueue.STATE_PROCESSING);

    const next = this.next();

    if(next) {
        const { request } = next;
        const { type, data } = request;
        const actionType = this.requestHandlers[type];

        this.events.emit(RequestQueue.EVENT_REQUEST_RUNNING, next);
        this.clearCurrent();
        
        actionType.onStart(gameContext, data);
        actionType.onEnd(gameContext, data);
        actionType.onClear();
    }

    this.setState(RequestQueue.STATE_ACTIVE);

    if(!this.isEmpty()) {
        this.update(gameContext);
    }
}