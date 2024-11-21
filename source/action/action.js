export const Action = function() {}
Action.prototype.onClear = function() {}
Action.prototype.onStart = function(gameContext, request) {}
Action.prototype.onEnd = function(gameContext, request) {}
Action.prototype.onUpdate = function(gameContext, request) {}
Action.prototype.isFinished = function(gameContext, request) {}
Action.prototype.isValid = function(gameContext, request, messengerID) {}