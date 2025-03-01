import { CameraContext } from "../../source/camera/cameraContext.js";
import { Cursor } from "../../source/client/cursor.js";
import { Factory } from "../../source/factory/factory.js";
import { SpriteManager } from "../../source/graphics/spriteManager.js";
import { World } from "../../source/world.js";
import { Player } from "../player/player.js";

export const ArmyControllerFactory = function() {
    Factory.call(this, "ARMY_CONTROLLER_FACOTRY");
}

ArmyControllerFactory.TYPE = {
    PLAYER: "Player"
};

ArmyControllerFactory.prototype = Object.create(Factory.prototype);
ArmyControllerFactory.prototype.constructor = ArmyControllerFactory;

ArmyControllerFactory.prototype.addDragEvent = function(gameContext) {
    const { client } = gameContext;
    const { cursor } = client;

    cursor.events.subscribe(Cursor.EVENT.LEFT_MOUSE_DRAG, this.id, (deltaX, deltaY) => {
        const context = gameContext.getContextAtMouse();

        if(context) {
            context.dragCamera(deltaX, deltaY);
        }
    });
}

ArmyControllerFactory.prototype.initPlayerCamera = function(gameContext, camera) {
    const { world, renderer, tileManager, client } = gameContext;
    const settings = world.getConfig("Settings");
    const context = renderer.createContext(Player.CAMERA_ID, camera);

    tileManager.loadTileDimensions(settings.tileWidth, settings.tileHeight);
    camera.loadTileDimensions(settings.tileWidth, settings.tileHeight);

    //context.initRenderer(640/2, 360/2);
    //context.setDisplayMode(CameraContext.DISPLAY_MODE.RESOLUTION_FIXED);

    world.events.subscribe(World.EVENT.MAP_CREATE, Player.CAMERA_ID, (worldMap) => {
        const { width, height, music } = worldMap;
    
        camera.loadWorld(width, height);
    
        if(music) {
            client.musicPlayer.swapTrack(music);
        }

        renderer.refreshContext(Player.CAMERA_ID);
    });

    context.events.subscribe(CameraContext.EVENT.REMOVE, Player.CAMERA_ID, () => {
        world.events.unsubscribe(World.EVENT.MAP_CREATE, Player.CAMERA_ID);
    });

    /*
    let x = false;

    this.client.cursor.events.subscribe(Cursor.LEFT_MOUSE_CLICK, "TEST", () => {
        x = !x;
        let mode = x ? CameraContext.DISPLAY_MODE.RESOLUTION_DEPENDENT : CameraContext.DISPLAY_MODE.RESOLUTION_FIXED;
        this.renderer.getContext(cameraID).setDisplayMode(mode);
    });
    */

    return context;
}

ArmyControllerFactory.prototype.onCreate = function(gameContext, config) {
    const { spriteManager, client } = gameContext;
    const { router } = client;
    const { type, id, team } = config;
    const controllerType = this.getType(type);

    switch(type) {
        case ArmyControllerFactory.TYPE.PLAYER: {
            const controller = new Player(id);
            const controllerSprite = spriteManager.createSprite("cursor_attack_1x1", SpriteManager.LAYER.UI);
            const spriteID = controllerSprite.getID();

            controller.inventory.init(gameContext);
            controller.spriteID = spriteID;
            controller.teamID = team ?? null;
            controller.setConfig(controllerType);
            controller.enterState(gameContext, Player.STATE.IDLE);
            
            this.initPlayerCamera(gameContext, controller.getCamera());
            this.addDragEvent(gameContext);

            router.load(gameContext, controllerType.binds);
            router.on(Player.COMMAND.TOGGLE_RANGE, () => controller.toggleRangeShow(gameContext));
            router.on(Player.COMMAND.CLICK, () => controller.onClick(gameContext));

            return controller;
        }
        default: {
            console.warn(`Type ${type} is not defined!`);
            break;
        }
    }
}