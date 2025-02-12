import { Component } from "../../source/component/component.js";

export const TeamComponent = function() {
    this.teamID = null;
}

TeamComponent.prototype = Object.create(Component.prototype);
TeamComponent.prototype.constructor = TeamComponent;