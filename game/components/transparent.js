import { Component } from "../../source/component/component.js";

export const TransparentComponent = function() {}

TransparentComponent.prototype = Object.create(Component.prototype);
TransparentComponent.prototype.constructor = TransparentComponent;