import { RequestQueue } from "./requestQueue.js";

export const ServerQueue = function() {
    RequestQueue.call(this);

    this.setMode(RequestQueue.MODE_DIRECT);
    this.setState(RequestQueue.STATE_FLUSH);
}

ServerQueue.prototype = Object.create(RequestQueue.prototype);
ServerQueue.prototype.constructor = ServerQueue;

ServerQueue.prototype.processUserRequest = function(gameContext, message, messengerID) {
    const element = {
        "request": message,
        "priority": RequestQueue.PRIORITY_NORMAL,
        "messengerID": messengerID
    };
    
    this.processElement(gameContext, element);
}

ServerQueue.prototype.processElement = function(gameContext, element) {
    const isValid = this.validateExecution(gameContext, element);

    if(isValid) {
        this.process(gameContext);
    }
}

ServerQueue.prototype.onUpdate = function(gameContext) {
    if(!this.isEmpty()) {
        this.update(gameContext);
    }
}