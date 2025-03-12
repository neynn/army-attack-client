import { Logger } from "../../source/logger.js";

export const AllianceSystem = function() {}

const getAlliance = function(gameContext, actorTeamID, reactorTeamID) {
    const actorTeam = gameContext.teamTypes[actorTeamID];

    if(!actorTeam) {
        Logger.log(Logger.CODE.WARN, "TeamType does not exist", "getAlliance", { actorTeamID });
        return null;
    }

    const allianceID = actorTeam.alliances[reactorTeamID];
    const alliance = gameContext.allianceTypes[allianceID];

    if(!alliance) {
        Logger.log(Logger.CODE.WARN, "AllianceType does not exist", "getAlliance", { actorTeamID, allianceID });
        return null;
    }

    return alliance;
}

AllianceSystem.isBypassable = function(gameContext, actorTeamID, reactorTeamID) {
    const alliance = getAlliance(gameContext, actorTeamID, reactorTeamID);

    if(!alliance) {
        return false;
    }

    return alliance.isEntityPassingAllowed;
}

AllianceSystem.isWalkable = function(gameContext, actorTeamID, reactorTeamID) {
    const alliance = getAlliance(gameContext, actorTeamID, reactorTeamID);

    if(!alliance) {
        return false;
    }

    return alliance.isWalkable;
}

AllianceSystem.isEnemy = function(gameContext, actorTeamID, reactorTeamID) {
    const alliance = getAlliance(gameContext, actorTeamID, reactorTeamID);

    if(!alliance) {
        return false;
    }

    return alliance.isEnemy;
}