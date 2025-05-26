import { StateMachine } from "../../../source/state/stateMachine.js";
import { ArmyContext } from "../../armyContext.js";
import { ArmyEntity } from "../../init/armyEntity.js";
import { ActorSystem } from "../../systems/actor.js";
import { SpawnSystem } from "../../systems/spawn.js";
import { StoryModeIntroState } from "./story/storyModeIntro.js";
import { StoryModePlayState } from "./story/storyModePlay.js";

export const StoryModeState = function() {
    StateMachine.call(this);
    
    this.addState(ArmyContext.STATE.STORY_MODE_INTRO, new StoryModeIntroState());
    this.addState(ArmyContext.STATE.STORY_MODE_PLAY, new StoryModePlayState());
}

StoryModeState.prototype = Object.create(StateMachine.prototype);
StoryModeState.prototype.constructor = StoryModeState;

StoryModeState.prototype.onEnter = function(gameContext, stateMachine) {
    gameContext.setGameMode(ArmyContext.GAME_MODE.STORY);
    
    this.setNextState(gameContext, ArmyContext.STATE.STORY_MODE_PLAY);
}

StoryModeState.prototype.onEvent = function(gameContext, stateMachine, eventID, eventData) {
    switch(eventID) {
        case ArmyContext.EVENT.STORY_SAVE: {
            const snapshot = this.saveSnapshot(gameContext);

            console.log(snapshot);
            break;
        }
    }
}

StoryModeState.prototype.saveSnapshot = function(gameContext) {
    const { world } = gameContext;
    const { turnManager, entityManager, mapManager } = world;

    const entities = [];
    const actors = [];
    const maps = [];

    turnManager.forAllActors((actorID, actor) => {
        const saveData = actor.save();

        if(saveData) {
            actors.push({
                "id": actorID,
                "data": saveData
            });
        }
    });

    entityManager.forAllEntities((entityID, entity) => {
        const positionComponent = entity.getComponent(ArmyEntity.COMPONENT.POSITION);
        const teamComponent = entity.getComponent(ArmyEntity.COMPONENT.TEAM);
        const savedData = entity.save();
        const owners = turnManager.getOwnersOf(entityID);
        
        entities.push({
            "type": entity.config.id,
            "tileX": positionComponent.tileX,
            "tileY": positionComponent.tileY,
            "team": teamComponent.teamID,
            "owners": owners,
            "data": savedData
        });
    });
    
    mapManager.forAllMaps((mapID, map) => {
        const saveData = map.save();

        if(saveData) {
            maps.push({
                "id": mapID,
                "data": saveData
            });
        }
    });

    return {
        "time": Date.now(),
        "actors": actors,
        "entities": entities,
        "maps": maps
    }
}

StoryModeState.prototype.loadSnapshot = function(gameContext, snapshot) {
    const { time, entities, actors } = snapshot;

    for(let i = 0; i < actors.length; i++) {
        const actor = actors[i];

        ActorSystem.createActor(gameContext, "ID", actor);
    }

    for(const entity of entities) {
        SpawnSystem.createEntity(gameContext, entity);
    }
}