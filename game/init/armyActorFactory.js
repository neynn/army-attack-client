import { Cursor } from "../../source/client/cursor.js";
import { Factory } from "../../source/factory/factory.js";
import { Player } from "../init/actors/player/player.js";
import { createStoryModeUI } from "../storyUI.js";
import { OtherPlayer } from "./actors/otherPlayer.js";
import { EnemyActor } from "./actors/enemyActor.js";
import { MapManager } from "../../source/map/mapManager.js";
import { Renderer } from "../../source/renderer.js";

export const ArmyActorFactory = function() {
    Factory.call(this, "ARMY_ACTOR_FACOTRY");
}

ArmyActorFactory.TYPE = {
    PLAYER: "Player",
    ENEMY: "Enemy",
    OTHER_PLAYER: "OtherPlayer"
};

ArmyActorFactory.prototype = Object.create(Factory.prototype);
ArmyActorFactory.prototype.constructor = ArmyActorFactory;

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

const initPlayerCamera = function(gameContext, camera) {
    const { world, renderer, client } = gameContext;
    const { mapManager } = world;
    const context = renderer.createContext(Player.CAMERA_ID, camera);

    camera.loadTileDimensions(gameContext.settings.tileWidth, gameContext.settings.tileHeight);

    //context.initRenderer(640/2, 360/2);
    //context.setDisplayMode(CameraContext.DISPLAY_MODE.RESOLUTION_FIXED);

    mapManager.events.on(MapManager.EVENT.MAP_CREATE, (mapID, worldMap) => {
        const { width, height, music } = worldMap;
    
        camera.loadWorld(width, height);
    
        if(music) {
            client.musicPlayer.playTrack(music);
        }

        context.refreshCamera();
    }, { id: Player.CAMERA_ID });

    renderer.events.on(Renderer.EVENT.CONTEXT_DESTROY, (id) => {
        mapManager.events.unsubscribe(MapManager.EVENT.MAP_CREATE, id);
    }, { once: true });

    /*
    let x = false;

    this.client.cursor.events.on(Cursor.CLICK, () => {
        x = !x;
        let mode = x ? CameraContext.DISPLAY_MODE.RESOLUTION_DEPENDENT : CameraContext.DISPLAY_MODE.RESOLUTION_FIXED;
        this.renderer.getContext(cameraID).setDisplayMode(mode);
    });
    */

    return context;
}

ArmyActorFactory.prototype.onCreate = function(gameContext, config) {
    const { spriteManager, client } = gameContext;
    const { router } = client;
    const { type, team } = config;
    const actorType = this.getType(type);

    switch(type) {
        case ArmyActorFactory.TYPE.PLAYER: {
            const actor = new Player();

            actor.inventory.init(gameContext);
            actor.hover.createSprite(gameContext);
            actor.teamID = team ?? null;
            actor.setConfig(actorType);
            
            initPlayerCamera(gameContext, actor.getCamera());
            addDragEvent(gameContext);

            router.load(gameContext, actorType.binds);
            router.on(Player.COMMAND.TOGGLE_RANGE, () => actor.toggleRangeShow(gameContext));
            router.on(Player.COMMAND.CLICK, () => actor.onClick(gameContext));

            createStoryModeUI(gameContext);
            
            return actor;
        }
        case ArmyActorFactory.TYPE.ENEMY: {
            const actor = new EnemyActor();

            return actor;
        }
        case ArmyActorFactory.TYPE.OTHER_PLAYER: {
            const actor = new OtherPlayer();

            return actor;
        }
        default: {
            console.warn(`Type ${type} is not defined!`);
            break;
        }
    }
}