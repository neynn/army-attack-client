import { TeamComponent } from "../components/team.js";

export const AllianceSystem = function() {}

AllianceSystem.isEntityAttackable = function(gameContext, attacker, target) {
    const { world } = gameContext;
    const teamTypes = world.getConfig("TeamTypes");
    const allianceTypes = world.getConfig("AllianceTypes"); 
    const attackerTeamComponent = attacker.getComponent(TeamComponent);
    const targetTeamComponent = target.getComponent(TeamComponent);
    const attackerTeam = teamTypes[attackerTeamComponent.teamID];

    if(!attackerTeam) {
        return false;
    }
    
    const allianceID = attackerTeam.alliances[targetTeamComponent.teamID];
    const alliance = allianceTypes[allianceID];

    if(!alliance) {
        return false;
    }

    return alliance.isEnemy;
}

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