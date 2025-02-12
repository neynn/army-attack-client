import { Component } from "./component.js";

export const ActiveComponent = function() {}

ActiveComponent.prototype = Object.create(Component.prototype);
ActiveComponent.prototype.constructor = ActiveComponent;

ActiveComponent.prototype.update = function(gameContext, entity) {}