import { RequestQueue } from "./requestQueue.js";

export const ClientQueue = function() {
    RequestQueue.call(this);
}

ClientQueue.prototype = Object.create(RequestQueue.prototype);
ClientQueue.prototype.constructor = ClientQueue;

ClientQueue.prototype.onUpdate = function(gameContext) {
    const current = this.getCurrent();

    if(!current || current.priority !== RequestQueue.PRIORITY_SUPER) {
        this.filterRequestQueue(gameContext, RequestQueue.PRIORITY_SUPER);
    }

    if(!current && this.isEmpty()) {
        this.filterRequestQueue(gameContext, RequestQueue.PRIORITY_NORMAL);
    }
}