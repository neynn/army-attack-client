import { ActionQueue } from "./actionQueue.js";

/**
 * The ClientQueue updates every frame.
 * This is to ensure a smooth gameplay experience.
 */
export const ClientQueue = function() {
    ActionQueue.call(this);
}

ClientQueue.prototype = Object.create(ActionQueue.prototype);
ClientQueue.prototype.constructor = ClientQueue;

ClientQueue.prototype.updateRequests = function(gameContext, priority) {
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
    const current = this.getCurrentAction();

    if(!current || current.priority !== ActionQueue.PRIORITY_SUPER) {
        this.updateRequests(gameContext, ActionQueue.PRIORITY_SUPER);
    }

    if(!current && this.isEmpty()) {
        this.updateRequests(gameContext, ActionQueue.PRIORITY_NORMAL);
    }
}

ClientQueue.prototype.update = function(gameContext) {
    if(this.state === ActionQueue.IDLE) {
        const next = this.next();

        if(next) {
            const { request, priority } = next;
            const { type } = request;
            const actionType = this.actionTypes[type];

            this.state = ActionQueue.PROCESSING;
            this.events.emit(ActionQueue.EVENT_ACTION_RUN, request, priority);
            
            actionType.onStart(gameContext, request);
        }
    } else if(this.state === ActionQueue.PROCESSING) {
        const current = this.getCurrentAction();
        const { request, priority } = current;
        const { type } = request;
        const actionType = this.actionTypes[type];

        actionType.onUpdate(gameContext, request);

        const isFinished = actionType.isFinished(gameContext, request);

        if(this.isSkipping) {
            actionType.onClear();
            this.isSkipping = false;
            this.state = ActionQueue.IDLE;
            this.currentAction = null;
        } else if(isFinished) {
            actionType.onEnd(gameContext, request);
            actionType.onClear();
            this.state = ActionQueue.IDLE;
            this.currentAction = null;
        }
    }

    this.processRequests(gameContext);
}