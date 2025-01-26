export const AllianceSystem = function() {}

AllianceSystem.getAlliance = function(gameContext, actorTeamID, reactorTeamID) {
    const { world } = gameContext;
    const teamTypes = world.getConfig("TeamType");
    const allianceTypes = world.getConfig("AllianceType"); 
    const actorTeam = teamTypes[actorTeamID];

    if(!actorTeam) {
        console.warn(`TeamType ${actorTeamID} does not exist!`);
        return null;
    }

    const allianceID = actorTeam.alliances[reactorTeamID];
    const alliance = allianceTypes[allianceID];

    if(!alliance) {
        console.warn(`AllianceType ${allianceID} of team ${actorTeamID} does not exist!`);
        return null;
    }

    return alliance;
}

AllianceSystem.isEnemy = function(gameContext, actorTeamID, reactorTeamID) {
    const alliance = AllianceSystem.getAlliance(gameContext, actorTeamID, reactorTeamID);

    if(alliance === null) {
        return false;
    }

    return alliance.isEnemy;
}