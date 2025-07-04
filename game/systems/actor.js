import { Cursor } from "../../source/client/cursor.js";
import { Player } from "../actors/player/player.js";
import { OtherPlayer } from "../actors/otherPlayer.js";
import { EnemyActor } from "../actors/enemyActor.js";
import { CameraContext } from "../../source/camera/cameraContext.js";
import { ArmyContext } from "../armyContext.js";
import { ArmyCamera } from "../armyCamera.js";
import { DefaultTypes } from "../defaultTypes.js";

const ACTOR_TYPE = {
    PLAYER: "Player",
    ENEMY: "Enemy",
    OTHER_PLAYER: "OtherPlayer"
};

/**
 * Creates the player's camera.
 * 
 * @param {*} gameContext 
 * @returns 
 */
const createPlayerCamera = function(gameContext) {
    const { renderer } = gameContext;

    const camera = new ArmyCamera();
    const context = renderer.createContext("PLAYER_CAMERA", camera);

    //context.createBuffer(600, 600);
    //context.setDisplayMode(CameraContext.DISPLAY_MODE.RESOLUTION_FIXED);
    //context.setScaleMode(CameraContext.SCALE_MODE.NONE);
    context.setPositionMode(CameraContext.POSITION_MODE.AUTO_CENTER);

    camera.bindViewport();
    camera.setTileSize(gameContext.settings.tileWidth, gameContext.settings.tileHeight);

    return camera;
}

/**
 * Creates an actor.
 * 
 * @param {*} gameContext 
 * @param {string} actorID 
 * @param {string} team 
 * @param {string} type 
 * @returns 
 */
const createActor = function(gameContext, actorID, team, type) {
    const { client, world } = gameContext;
    const { turnManager, entityManager } = world;
    const { router, cursor } = client;
    const actorType = turnManager.getActorType(type);

    switch(type) {
        case ACTOR_TYPE.PLAYER: {
            const camera = createPlayerCamera(gameContext);
            const actor = new Player(actorID, camera);

            camera.initCustomLayers(gameContext);

            actor.teamID = team ?? null;
            actor.inventory.init(gameContext);
            actor.hover.createSprite(gameContext);
            actor.setConfig(actorType);
            actor.initMapEvents(gameContext);

            cursor.events.on(Cursor.EVENT.BUTTON_DRAG, (buttonID, deltaX, deltaY) => {
                if(buttonID !== Cursor.BUTTON.LEFT) {
                    return;
                }

                const context = gameContext.getContextAtMouse();

                if(context) {
                    context.dragCamera(deltaX, deltaY);
                }
            });

            router.load(gameContext, gameContext.keybinds.player);
            router.on(Player.COMMAND.TOGGLE_RANGE, () => actor.rangeVisualizer.toggle(gameContext));
            router.on(Player.COMMAND.CLICK, () => actor.onClick(gameContext));
            router.on("ESCAPE", () => gameContext.states.setNextState(gameContext, ArmyContext.STATE.MAIN_MENU));
            router.on("DEBUG_IDLE", () => actor.states.setNextState(gameContext, Player.STATE.IDLE));
            router.on("DEBUG_HEAL", () => actor.states.setNextState(gameContext, Player.STATE.HEAL));
            router.on("DEBUG_FIREMISSION", () => actor.states.setNextState(gameContext, Player.STATE.FIRE_MISSION, { "missionID": "OrbitalLaser" }));
            router.on("DEBUG_SELL", () => actor.states.setNextState(gameContext, Player.STATE.SELL));
            router.on("DEBUG_PLACE", () => actor.states.setNextState(gameContext, Player.STATE.PLACE, {
                "entityType": entityManager.getEntityType("blue_hq"),
                "transaction": DefaultTypes.createItemTransaction("Resource", "Gold", 500)
            }));
            router.on("DEBUG_DEBUG", () => actor.states.setNextState(gameContext, Player.STATE.DEBUG));

            return actor;
        }
        case ACTOR_TYPE.ENEMY: {
            const actor = new EnemyActor(actorID);

            return actor;
        }
        case ACTOR_TYPE.OTHER_PLAYER: {
            const actor = new OtherPlayer(actorID);

            return actor;
        }
        default: {
            console.warn(`Type ${type} is not defined!`);
            break;
        }
    }

    return null;
}

/**
 * Collection of functions revolving around the actors.
 */
export const ActorSystem = function() {}

ActorSystem.STORY_ID = {
    PLAYER: "Player",
    ENEMY: "Enemy"
};

/**
 * Creates and actor based on the config.
 *  
 * @param {*} gameContext 
 * @param {string} actorID 
 * @param {*} config 
 * @returns 
 */
ActorSystem.createActor = function(gameContext, actorID, config) {
    const { world } = gameContext;
    const { turnManager } = world;
    const { team, type } = config;
    const actor = createActor(gameContext, actorID, team, type);

    if(actor) {
        turnManager.addActor(actorID, actor);
    }

    return actor;
}

/**
 * Creates the stories player actor.
 * 
 * @param {*} gameContext 
 * @param {string} team 
 * @returns 
 */
ActorSystem.createStoryPlayer = function(gameContext, teamID) {
    const { world } = gameContext;
    const { turnManager } = world;
    const actor = createActor(gameContext, ActorSystem.STORY_ID.PLAYER, teamID, ACTOR_TYPE.PLAYER);

    if(actor) {
        turnManager.addActor(ActorSystem.STORY_ID.PLAYER, actor);
    }

    return actor;
}

/**
 * Creates the stories enemy actor.
 * 
 * @param {*} gameContext 
 * @param {string} teamID 
 * @returns 
 */
ActorSystem.createStoryEnemy = function(gameContext, teamID) {
    const { world } = gameContext;
    const { turnManager } = world;
    const actor = createActor(gameContext, ActorSystem.STORY_ID.ENEMY, teamID, ACTOR_TYPE.ENEMY);

    if(actor) {
        turnManager.addActor(ActorSystem.STORY_ID.ENEMY, actor);
    }

    return actor;
}