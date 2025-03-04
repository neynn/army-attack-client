import { Logger } from "../../source/logger.js";

export const AllianceSystem = function() {}

AllianceSystem.getAlliance = function(gameContext, actorTeamID, reactorTeamID) {
    const { world } = gameContext;
    const teamTypes = gameContext.getConfig("TeamType");
    const allianceTypes = gameContext.getConfig("AllianceType"); 
    const actorTeam = teamTypes[actorTeamID];

    if(!actorTeam) {
        Logger.log(Logger.CODE.WARN, "TeamType does not exist", "getAlliance", { actorTeamID });

        return null;
    }

    const allianceID = actorTeam.alliances[reactorTeamID];
    const alliance = allianceTypes[allianceID];

    if(!alliance) {
        Logger.log(Logger.CODE.WARN, "AllianceType does not exist", "getAlliance", { actorTeamID, allianceID });

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