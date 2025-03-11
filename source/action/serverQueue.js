import { ActionQueue } from "./actionQueue.js";

export const ServerQueue = function() {
    ActionQueue.call(this);

    this.mode = ActionQueue.MODE.DIRECT;
    this.state = ActionQueue.STATE.FLUSH;
}

ServerQueue.prototype = Object.create(ActionQueue.prototype);
ServerQueue.prototype.constructor = ServerQueue;

ServerQueue.prototype.processUserRequest = function(gameContext, request, messengerID) {
    const executionItem = this.getExecutionItem(gameContext, request, messengerID);

    if(!executionItem) {
        return;
    }

    this.enqueueExecutionItem(executionItem, request);

    const processNext = () => {
        if(!this.isEmpty()) {
            this.update(gameContext);
            setTimeout(processNext, 0);
        }
    };

    processNext();
}