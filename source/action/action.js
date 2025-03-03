export const Action = function() {}

Action.prototype.onStart = function(gameContext, data, messengerID) {}
Action.prototype.onEnd = function(gameContext, data, messengerID) {}
Action.prototype.onUpdate = function(gameContext, data, messengerID) {}
Action.prototype.isFinished = function(gameContext, data, messengerID) {}
Action.prototype.getValidated = function(gameContext, template, messengerID) {}
Action.prototype.getTemplate = function(...args) {}