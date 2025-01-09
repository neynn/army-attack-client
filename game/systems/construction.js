import { ConstructionComponent } from "../components/construction.js";
import { PositionComponent } from "../components/position.js";
import { TeamComponent } from "../components/team.js";
import { DeathSystem } from "./death.js";
import { SpawnSystem } from "./spawn.js";

export const ConstructionSystem = function() {}

ConstructionSystem.finishConstruction = function(gameContext, entity, controller) {        
    const constructionComponent = entity.getComponent(ConstructionComponent);

    if(!constructionComponent) {
        return;
    }

    const positionComponent = entity.getComponent(PositionComponent);
    const teamComponent = entity.getComponent(TeamComponent);
    const resultType = constructionComponent.getResult();
    const entityID = entity.getID();
    const result = {
        "id": entityID,
        "team": teamComponent.teamID,
        "owner": controller.getID(),
        "type": resultType,
        "tileX": positionComponent.tileX,
        "tileY": positionComponent.tileY,
        "mode": "story" //TODO gets determined by the client/server
    }

    //TODO: Open GUI and check if the controller has enough materials/resources.
    DeathSystem.destroyEntity(gameContext, entityID);
    SpawnSystem.createEntity(gameContext, result);
}