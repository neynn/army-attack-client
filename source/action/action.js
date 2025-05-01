export const Action = function() {}

Action.prototype.onStart = function(gameContext, data) {}
Action.prototype.onEnd = function(gameContext, data) {}
Action.prototype.onUpdate = function(gameContext, data) {}
Action.prototype.isFinished = function(gameContext, data) {}
Action.prototype.getValidated = function(gameContext, template, messengerID) {}
Action.prototype.getTemplate = function(...args) {}