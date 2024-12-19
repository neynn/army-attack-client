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

ClientQueue.prototype.processRequests = function(gameContext) {
    const current = this.getCurrent();

    if(!current || current.priority !== RequestQueue.PRIORITY_SUPER) {
        this.filterRequestQueue(gameContext, RequestQueue.PRIORITY_SUPER);
    }

    if(!current && this.isEmpty()) {
        this.filterRequestQueue(gameContext, RequestQueue.PRIORITY_NORMAL);
    }
}

ClientQueue.prototype.update = function(gameContext) {
    if(this.state === RequestQueue.STATE_ACTIVE) {
        const next = this.next();

        if(next) {
            const { type, data, priority } = next;
            const actionType = this.requestHandlers[type];

            this.setState(RequestQueue.STATE_PROCESSING);
            this.events.emit(RequestQueue.EVENT_REQUEST_RUNNING, next);
            
            actionType.onStart(gameContext, data);
        }
    } else if(this.state === RequestQueue.STATE_PROCESSING) {
        const current = this.getCurrent();
        const { type, data, priority } = current;
        const actionType = this.requestHandlers[type];

        actionType.onUpdate(gameContext, data);

        const isFinished = actionType.isFinished(gameContext, data);

        if(this.isSkipping) {
            actionType.onClear();
            this.isSkipping = false;
            this.setState(RequestQueue.STATE_ACTIVE);
            this.clearCurrent();
        } else if(isFinished) {
            actionType.onEnd(gameContext, data);
            actionType.onClear();
            this.setState(RequestQueue.STATE_ACTIVE);
            this.clearCurrent();
        }
    }

    this.processRequests(gameContext);
}