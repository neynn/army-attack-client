import { RequestQueue } from "./requestQueue.js";

export const ServerQueue = function() {
    RequestQueue.call(this);

    this.setMode(RequestQueue.MODE.DIRECT);
    this.setState(RequestQueue.STATE.FLUSH);
}

ServerQueue.prototype = Object.create(RequestQueue.prototype);
ServerQueue.prototype.constructor = ServerQueue;

ServerQueue.prototype.processUserRequest = function(gameContext, request, messengerID) {
    const element = this.createElement(request, RequestQueue.PRIORITY.LOW, messengerID);
    this.processElement(gameContext, element);
}

ServerQueue.prototype.processElement = function(gameContext, element) {
    const isValid = this.validateExecution(gameContext, element);

    if(isValid) {
        const processNext = () => {
            if(!this.isEmpty()) {
                this.update(gameContext);
                setTimeout(processNext, 0);
            }
        };

        processNext();
    }
}