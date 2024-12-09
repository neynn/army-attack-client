import { Queue } from "../queue.js";
import { RequestQueue } from "./requestQueue.js";

/**
 * The ServerQueue updates when a valid request arrives.
 * This removes the need for constant updates.
 */
export const ServerQueue = function() {
    RequestQueue.call(this);
}

ServerQueue.prototype = Object.create(RequestQueue.prototype);
ServerQueue.prototype.constructor = ServerQueue;

ServerQueue.prototype.processRequest = function(gameContext, request, messengerID) {
    const isValid = this.validateRequest(gameContext, request, messengerID, RequestQueue.PRIORITY_NORMAL);

    if(isValid) {
        this.enqueue(request);
        this.update(this);
    }
}

ServerQueue.prototype.update = function(gameContext) {
    if(this.state !== Queue.STATE_ACTIVE || this.isEmpty()) {
        return;
    }

    this.toProcessing();

    const next = this.next();

    if(next) {
        const { item, priority } = next;
        const { type } = item;
        const actionType = this.requestHandlers[type];

        this.events.emit(RequestQueue.EVENT_REQUEST_RUN, item, priority);
        this.clearCurrent();
        
        actionType.onStart(gameContext, item);
        actionType.onEnd(gameContext, item);
        actionType.onClear();
    }

    this.toActive();

    if(!this.isEmpty()) {
        this.update(gameContext);
    }
}