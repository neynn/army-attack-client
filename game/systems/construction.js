import { PositionComponent } from "../components/position.js";
import { TeamComponent } from "../components/team.js";

export const ConstructionSystem = function() {}

ConstructionSystem.getConstructionResult = function(controller, entity) {
    const controllerID = controller.getID();
    const entityID = entity.getID();
    const entityConfig = entity.getConfig();
    const positionComponent = entity.getComponent(PositionComponent);
    const teamComponent = entity.getComponent(TeamComponent);

    return {
        "id": entityID,
        "team": teamComponent.teamID,
        "owner": controllerID,
        "type": entityConfig.constructionResult,
        "tileX": positionComponent.tileX,
        "tileY": positionComponent.tileY,
        "mode": "story" //TODO gets determined by the client/server
    }
}
