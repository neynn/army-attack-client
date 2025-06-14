import { Logger } from "../../source/logger.js";
import { DEFAULT_ALLIANCE } from "../defaultTypes.js";

/**
 * Collection of functions revolving around the alliances.
 */
export const AllianceSystem = function() {}

/**
 * Returns the alliance type between the two teams.
 * 
 * @param {ArmyContext} gameContext 
 * @param {string} actorTeamID 
 * @param {string} reactorTeamID 
 * @returns {AllianceType}
 */
const getAlliance = function(gameContext, actorTeamID, reactorTeamID) {
    const actorTeam = gameContext.teamTypes[actorTeamID];

    if(!actorTeam) {
        Logger.log(Logger.CODE.WARN, "TeamType does not exist", "getAlliance", { actorTeamID });
        return DEFAULT_ALLIANCE;
    }

    const allianceID = actorTeam.alliances[reactorTeamID];
    const alliance = gameContext.allianceTypes[allianceID];

    if(!alliance) {
        Logger.log(Logger.CODE.WARN, "AllianceType does not exist", "getAlliance", { actorTeamID, allianceID });
        return DEFAULT_ALLIANCE;
    }

    return alliance;
}

/**
 * Returns if teamA can bypass teamB.
 * 
 * @param {ArmyContext} gameContext 
 * @param {string} actorTeamID 
 * @param {string} reactorTeamID 
 * @returns {boolean}
 */
AllianceSystem.isPassable = function(gameContext, actorTeamID, reactorTeamID) {
    return getAlliance(gameContext, actorTeamID, reactorTeamID).isPassable;
}

/**
 * Returns if teamA can walk on the tiles of teamB.
 * 
 * @param {ArmyContext} gameContext 
 * @param {string} actorTeamID 
 * @param {string} reactorTeamID 
 * @returns {boolean}
 */
AllianceSystem.isWalkable = function(gameContext, actorTeamID, reactorTeamID) {
    return getAlliance(gameContext, actorTeamID, reactorTeamID).isWalkable;
}

/**
 * Returns if teamA is an enemy of teamB.
 * 
 * @param {ArmyContext} gameContext 
 * @param {string} actorTeamID 
 * @param {string} reactorTeamID 
 * @returns {boolean}
 */
AllianceSystem.isEnemy = function(gameContext, actorTeamID, reactorTeamID) {
    return getAlliance(gameContext, actorTeamID, reactorTeamID).isEnemy;
}

/**
 * Returns if teamA can place on teamB.
 * 
 * @param {ArmyContext} gameContext 
 * @param {string} actorTeamID 
 * @param {string} reactorTeamID 
 * @returns {boolean}
 */
AllianceSystem.isPlaceable = function(gameContext, actorTeamID, reactorTeamID) {
    return getAlliance(gameContext, actorTeamID, reactorTeamID).isPlaceable;
}