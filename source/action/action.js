export const Action = function() {
    this.priority = Action.PRIORITY.LOW;
    this.isInstant = false;
    this.allowSend = false;
    this.allowReceive = false;
}

Action.PRIORITY = {
    NONE: 0,
    LOW: 1,
    HIGH: 2
};

Action.prototype.isSendable = function() {
    return this.allowSend;
}

Action.prototype.isReceiveable = function() {
    return this.allowReceive;
}

Action.prototype.onStart = function(gameContext, data) {}
Action.prototype.onEnd = function(gameContext, data) {}
Action.prototype.onUpdate = function(gameContext, data) {}
Action.prototype.isFinished = function(gameContext, executionRequest) {}
Action.prototype.getValidated = function(gameContext, actionRequest) {}