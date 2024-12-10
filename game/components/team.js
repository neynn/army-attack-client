export const TeamComponent = function() {
    this.teamID = null;
}

TeamComponent.create = function(setup = {}) {
    const teamComponent = new TeamComponent();
    const { team } = setup;
    
    teamComponent.teamID = team ?? null;

    return teamComponent;
}