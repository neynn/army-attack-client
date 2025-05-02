import { Cursor } from "../../source/client/cursor.js";
import { Factory } from "../../source/factory/factory.js";
import { Player } from "../actors/player/player.js";
import { createStoryModeUI } from "../storyUI.js";
import { OtherPlayer } from "../actors/otherPlayer.js";
import { EnemyActor } from "../actors/enemyActor.js";
import { CameraContext } from "../../source/camera/cameraContext.js";

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
    const { turnManager } = world;
    const { router } = client;
    const { type, team } = config;
    const actorType = turnManager.getActorType(type);

    switch(type) {
        case ACTOR_TYPE.PLAYER: {
            const actor = new Player();
            const camera = actor.getCamera();
            const context = renderer.createContext(Player.CAMERA_ID, camera);

            actor.inventory.init(gameContext);
            actor.hover.createSprite(gameContext);
            actor.teamID = team ?? null;
            actor.setConfig(actorType);
    
            context.setPositionMode(CameraContext.POSITION_MODE.AUTO_CENTER);
            camera.setTileSize(gameContext.settings.tileWidth, gameContext.settings.tileHeight);

            addDragEvent(gameContext);

            router.load(gameContext, gameContext.keybinds.player);
            router.on(Player.COMMAND.TOGGLE_RANGE, () => actor.attackRangeOverlay.toggle(gameContext, camera));
            router.on(Player.COMMAND.CLICK, () => actor.onClick(gameContext));

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