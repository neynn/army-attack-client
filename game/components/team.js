export const TeamComponent = function() {
    this.teamID = null;
}

TeamComponent.create = function(config = {}) {
    const teamComponent = new TeamComponent();
    const {
        team = null
    } = config;
    
    teamComponent.teamID = team;

    return teamComponent;
}