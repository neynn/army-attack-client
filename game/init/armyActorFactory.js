import { Cursor } from "../../source/client/cursor.js";
import { Factory } from "../../source/factory/factory.js";
import { Player } from "../actors/player/player.js";
import { createStoryModeUI } from "../storyUI.js";
import { OtherPlayer } from "../actors/otherPlayer.js";
import { EnemyActor } from "../actors/enemyActor.js";
import { CameraContext } from "../../source/camera/cameraContext.js";
import { ArmyContext } from "../armyContext.js";
import { MapManager } from "../../source/map/mapManager.js";

export const ArmyActorFactory = function() {
    Factory.call(this, "ARMY_ACTOR_FACOTRY");
}

ArmyActorFactory.prototype = Object.create(Factory.prototype);
ArmyActorFactory.prototype.constructor = ArmyActorFactory;

const ACTOR_TYPE = {
    PLAYER: "Player",
    ENEMY: "Enemy",
    OTHER_PLAYER: "OtherPlayer"
};

const addDragEvent = function(gameContext) {
    const { client } = gameContext;
    const { cursor } = client;

    cursor.events.on(Cursor.EVENT.BUTTON_DRAG, (buttonID, deltaX, deltaY) => {
        if(buttonID !== Cursor.BUTTON.LEFT) {
            return;
        }

        const context = gameContext.getContextAtMouse();

        if(context) {
            context.dragCamera(deltaX, deltaY);
        }
    });
}

ArmyActorFactory.prototype.onCreate = function(gameContext, config) {
    const { client, renderer, world } = gameContext;
    const { turnManager, mapManager } = world;
    const { router } = client;
    const { type, team } = config;
    const actorType = turnManager.getActorType(type);

    switch(type) {
        case ACTOR_TYPE.PLAYER: {
            const actor = new Player();
            const camera = actor.getCamera();
            const context = renderer.createContext("PLAYER_CAMERA", camera);

            actor.inventory.init(gameContext);
            actor.hover.createSprite(gameContext);
            actor.teamID = team ?? null;
            actor.setConfig(actorType);
    
            mapManager.events.on(MapManager.EVENT.MAP_CREATE, (id, data, map) => {
                if(data.missions) {
                    actor.missions.init(data.missions);
                }
            });

            //context.createBuffer(600, 600);
            //context.setDisplayMode(CameraContext.DISPLAY_MODE.RESOLUTION_FIXED);
            //context.setScaleMode(CameraContext.SCALE_MODE.WHOLE);
            context.setPositionMode(CameraContext.POSITION_MODE.AUTO_CENTER);

            camera.setTileSize(gameContext.settings.tileWidth, gameContext.settings.tileHeight);

            addDragEvent(gameContext);

            router.load(gameContext, gameContext.keybinds.player);
            router.on(Player.COMMAND.TOGGLE_RANGE, () => actor.rangeVisualizer.toggle(gameContext));
            router.on(Player.COMMAND.CLICK, () => actor.onClick(gameContext));
            router.on("ESCAPE", () => gameContext.states.setNextState(gameContext, ArmyContext.STATE.MAIN_MENU));
            router.on("DEBUG_IDLE", () => actor.states.setNextState(gameContext, Player.STATE.IDLE));
            router.on("DEBUG_HEAL", () => actor.states.setNextState(gameContext, Player.STATE.HEAL));
            router.on("DEBUG_FIREMISSION", () => actor.states.setNextState(gameContext, Player.STATE.FIRE_MISSION, { "missionID": "OrbitalLaser" }));

            createStoryModeUI(gameContext);
            
            return actor;
        }
        case ACTOR_TYPE.ENEMY: {
            const actor = new EnemyActor();

            return actor;
        }
        case ACTOR_TYPE.OTHER_PLAYER: {
            const actor = new OtherPlayer();

            return actor;
        }
        default: {
            console.warn(`Type ${type} is not defined!`);
            break;
        }
    }
}