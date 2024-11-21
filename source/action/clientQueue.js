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

ClientQueue.prototype.processRequests = function(gameContext) {
    const processedRequests = [];

    if(this.isRunning()) {
        return processedRequests;
    }

    for(let i = 0; i < this.requests.length; i++) {
        const { request, messengerID } = this.requests[i];
        const isValid = this.validateRequest(gameContext, request, messengerID, ActionQueue.PRIORITY_NORMAL);

        processedRequests.push(i);

        if(isValid) {
            break;
        }
    }

    for(let i = processedRequests.length - 1; i >= 0; i--) {
        const actionIndex = processedRequests[i];
        this.requests.splice(actionIndex, 1);
    }

    return processedRequests;
}

ClientQueue.prototype.update = function(gameContext) {
    if(this.state === ActionQueue.IDLE) {
        this.processRequests(gameContext);
        const request = this.next();

        if(request) {
            const { type } = request;
            const actionType = this.actionTypes[type];

            this.state = ActionQueue.PROCESSING;
            this.events.emit(ActionQueue.EVENT_ACTION_RUN, request);
            
            actionType.onStart(gameContext, request);
        }
    } else if(this.state === ActionQueue.PROCESSING) {
        const request = this.getCurrentAction();
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
}