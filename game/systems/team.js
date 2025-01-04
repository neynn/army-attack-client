import { TeamComponent } from "../components/team.js";

export const TeamSystem = function() {}

TeamSystem.isTileAllied = function(gameContext, teamID, tileID) {
    const { world } = gameContext;
    const teamTypes = world.getConfig("TeamTypes");
    const teamMapping = world.getConfig("TeamTypesMapping");
    const tileTeam = teamTypes[teamMapping[tileID]];
    const mainTeam = teamTypes[teamID];

    if(!tileTeam || !mainTeam) {
        return false;
    }

    const isAllied = !tileTeam.alliances[teamID].isAttackable && !mainTeam.alliances[teamMapping[tileID]].isAttackable;

    return isAllied;
}

TeamSystem.isEntityAttackable = function(gameContext, attacker, target) {
    const { world } = gameContext;
    const teamTypes = world.getConfig("TeamTypes");
    const attackerTeamComponent = attacker.getComponent(TeamComponent);
    const targetTeamComponent = target.getComponent(TeamComponent);
    const attackerTeam = teamTypes[attackerTeamComponent.teamID];

    if(!attackerTeam) {
        return false;
    }
    
    const isAttackable = attackerTeam.alliances[targetTeamComponent.teamID].isAttackable;

    return isAttackable;
}