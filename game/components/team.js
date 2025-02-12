import { Component } from "../../source/component/component.js";

export const TeamComponent = function() {
    this.teamID = null;
}

TeamComponent.prototype = Object.create(Component.prototype);
TeamComponent.prototype.constructor = TeamComponent;

TeamComponent.create = function(config = {}) {
    const teamComponent = new TeamComponent();
    const {
        team = null
    } = config;
    
    teamComponent.teamID = team;

    return teamComponent;
}