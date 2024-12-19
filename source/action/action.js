export const Action = function() {}
Action.prototype.onClear = function() {}
Action.prototype.onStart = function(gameContext, validated) {}
Action.prototype.onEnd = function(gameContext, validated) {}
Action.prototype.onUpdate = function(gameContext, validated) {}
Action.prototype.isFinished = function(gameContext, validated) {}
Action.prototype.getValidated = function(gameContext, template, messengerID) {}
Action.prototype.getTemplate = function(...args) {}