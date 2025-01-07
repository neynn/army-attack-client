export const AllianceSystem = function() {}

AllianceSystem.getAlliance = function(gameContext, actorTeamID, reactorTeamID) {
    const { world } = gameContext;
    const teamTypes = world.getConfig("TeamTypes");
    const allianceTypes = world.getConfig("AllianceTypes"); 
    const actorTeam = teamTypes[actorTeamID];

    if(!actorTeam) {
        console.warn(`TeamType ${actorTeamID} does not exist!`);
        return null;
    }

    const allianceID = actorTeam.alliances[reactorTeamID];
    const alliance = allianceTypes[allianceID];

    if(!alliance) {
        console.warn(`AllianceType ${allianceID} of team ${teamID} does not exist!`);
        return null;
    }

    return alliance;
}