import { TeamComponent } from "../components/team.js";

export const TeamSystem = function() {}

TeamSystem.isAllied = function(gameContext, teamIDA, teamIDB) {
    const teamTypes = gameContext.getConfig("teamTypes");
    const teamA = teamTypes[teamIDA];
    const teamB = teamTypes[teamIDB];

    if(!teamA || !teamB) {
        console.warn(`TeamType A or TeamType B do not exist! Returning false...`);
        return false;
    }

    if(teamA.allies[teamB.id] || teamB.allies[teamA.id]) {
        return true;
    }

    return false;
}

TeamSystem.isEnemy = function(gameContext, teamIDA, teamIDB) {
    const teamTypes = gameContext.getConfig("teamTypes");
    const teamA = teamTypes[teamIDA];
    const teamB = teamTypes[teamIDB];

    if(!teamA || !teamB) {
        console.warn(`TeamType A or TeamType B do not exist! Returning false...`);
        return false;
    }

    if(teamA.enemies[teamB.id] || teamB.enemies[teamA.id]) {
        return true;
    }

    return false;
}

TeamSystem.isTileFriendly = function(gameContext, entity, tileTeamID) {
    const teamComponent = entity.getComponent(TeamComponent);

    if(!teamComponent) {
        console.warn(`TeamComponent does not exist! Returning false...`);
        return false;
    }

    return TeamSystem.isAllied(gameContext, teamComponent.teamID, tileTeamID);
}

TeamSystem.isEntityEnemy = function(gameContext, entityA, entityB) {
    const teamComponentA = entityA.getComponent(TeamComponent);
    const teamComponentB = entityB.getComponent(TeamComponent);

    if(!teamComponentA || !teamComponentB) {
        console.warn(`TeamComponent does not exist on entity A or B! Returning false...`);
        return false;
    }

    return TeamSystem.isEnemy(gameContext, teamComponentA.teamID, teamComponentB.teamID);
}

TeamSystem.isEntityFriendly = function(gameContext, entityA, entityB) {
    const teamComponentA = entityA.getComponent(TeamComponent);
    const teamComponentB = entityB.getComponent(TeamComponent);

    if(!teamComponentA || !teamComponentB) {
        console.warn(`TeamComponent does not exist on entity A or B! Returning false...`);
        return false;
    }

    return TeamSystem.isAllied(gameContext, teamComponentA.teamID, teamComponentB.teamID);
}