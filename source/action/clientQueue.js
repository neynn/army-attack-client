import { RequestQueue } from "./requestQueue.js";

export const ClientQueue = function() {
    RequestQueue.call(this);
}

ClientQueue.prototype = Object.create(RequestQueue.prototype);
ClientQueue.prototype.constructor = ClientQueue;

ClientQueue.prototype.autoProcessRequests = function(gameContext) {
    const current = this.getCurrent();

    if(!current || current.priority !== RequestQueue.PRIORITY_SUPER) {
        this.filterRequestQueue(gameContext, RequestQueue.PRIORITY_SUPER);
    }

    if(!current && this.isEmpty()) {
        this.filterRequestQueue(gameContext, RequestQueue.PRIORITY_NORMAL);
    }
}

ClientQueue.prototype.update = function(gameContext) {
    switch(this.state) {
        case RequestQueue.STATE_ACTIVE: {
            this.startExecution(gameContext);
            break;
        }
        case RequestQueue.STATE_PROCESSING: {
            this.processExecution(gameContext);
            break;
        }
        case RequestQueue.STATE_FLUSH: {
            this.flushExecution(gameContext);
            break;
        }
    }

    this.autoProcessRequests(gameContext);
}