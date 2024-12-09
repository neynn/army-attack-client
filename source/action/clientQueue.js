import { Queue } from "../queue.js";
import { RequestQueue } from "./requestQueue.js";

/**
 * The ClientQueue updates every frame.
 * This is to ensure a smooth gameplay experience.
 */
export const ClientQueue = function() {
    RequestQueue.call(this);
}

ClientQueue.prototype = Object.create(RequestQueue.prototype);
ClientQueue.prototype.constructor = ClientQueue;

ClientQueue.prototype.filterRequests = function(gameContext, priority) {
    const requests = this.requests[priority];
    const processedRequests = [];

    for(let i = 0; i < requests.length; i++) {
        const { request, messengerID, priority } = requests[i];
        const isValid = this.validateRequest(gameContext, request, messengerID, priority);

        processedRequests.push(i);

        if(isValid) {
            break;
        }
    }

    for(let i = processedRequests.length - 1; i >= 0; i--) {
        const requestIndex = processedRequests[i];

        requests.splice(requestIndex, 1);
    }
}

ClientQueue.prototype.processRequests = function(gameContext) {
    const current = this.getCurrent();

    if(!current || current.priority !== RequestQueue.PRIORITY_SUPER) {
        this.filterRequests(gameContext, RequestQueue.PRIORITY_SUPER);
    }

    if(!current && this.isEmpty()) {
        this.filterRequests(gameContext, RequestQueue.PRIORITY_NORMAL);
    }
}

ClientQueue.prototype.update = function(gameContext) {
    if(this.state === Queue.STATE_ACTIVE) {
        const next = this.next();

        if(next) {
            const { item } = next;
            const { type } = item;
            const actionType = this.requestHandlers[type];

            this.toProcessing();
            this.events.emit(RequestQueue.EVENT_REQUEST_RUN, next);
            
            actionType.onStart(gameContext, item);
        }
    } else if(this.state === Queue.STATE_PROCESSING) {
        const current = this.getCurrent();
        const { item } = current;
        const { type } = item;
        const actionType = this.requestHandlers[type];

        actionType.onUpdate(gameContext, item);

        const isFinished = actionType.isFinished(gameContext, item);

        if(this.isSkipping) {
            actionType.onClear();
            this.isSkipping = false;
            this.toActive();
            this.clearCurrent();
        } else if(isFinished) {
            actionType.onEnd(gameContext, item);
            actionType.onClear();
            this.toActive();
            this.clearCurrent();
        }
    }

    this.processRequests(gameContext);
}