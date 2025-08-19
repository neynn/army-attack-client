export const Action = function() {
    this.priority = Action.PRIORITY.LOW;
    this.isInstant = false;
    this.isSendable = false;
    this.isReceiveable = false;
}

Action.PRIORITY = {
    NONE: 0,
    LOW: 1,
    HIGH: 2
};

Action.prototype.onStart = function(gameContext, data) {}
Action.prototype.onEnd = function(gameContext, data) {}
Action.prototype.onUpdate = function(gameContext, data) {}
Action.prototype.isFinished = function(gameContext, executionRequest) {}
Action.prototype.getValidated = function(gameContext, actionRequest) {}