import { State } from "../../../source/state/state.js";
import { UICollider } from "../../../source/ui/uiCollider.js";
import { ArmyContext } from "../../armyContext.js";

export const MainMenuState = function() {}

MainMenuState.prototype = Object.create(State.prototype);
MainMenuState.prototype.constructor = MainMenuState;

MainMenuState.prototype.onEnter = function(gameContext, stateMachine) {
    const { uiManager, spriteManager } = gameContext;
    const mainMenuInterface = uiManager.parseUI("MAIN_MENU", gameContext);

    mainMenuInterface.addClick("BUTTON_PLAY", () => gameContext.setGameMode(ArmyContext.GAME_MODE.STORY));
    mainMenuInterface.addClick("BUTTON_EDIT", () => gameContext.setGameMode(ArmyContext.GAME_MODE.EDIT));
    mainMenuInterface.addClick("BUTTON_VERSUS", () => gameContext.setGameMode(ArmyContext.GAME_MODE.VERSUS));

    const buttonPlay = mainMenuInterface.getElement("BUTTON_PLAY");
    const buttonVersus = mainMenuInterface.getElement("BUTTON_VERSUS");
    const buttonEdit = mainMenuInterface.getElement("BUTTON_EDIT");

    const spritePlay = spriteManager.createSprite("blue_battletank_idle");
    const spriteVersus = spriteManager.createSprite("red_battletank_idle");
    const spriteEdit = spriteManager.createSprite("blue_elite_battery_idle");
    
    buttonPlay.addChild(spritePlay);
    buttonVersus.addChild(spriteVersus);
    buttonEdit.addChild(spriteEdit)

    buttonPlay.collider.events.on(UICollider.EVENT.FIRST_COLLISION, () => spriteManager.updateSprite(spritePlay.getIndex(), "blue_battletank_aim"));
    buttonPlay.collider.events.on(UICollider.EVENT.LAST_COLLISION, () => spriteManager.updateSprite(spritePlay.getIndex(), "blue_battletank_idle"));

    buttonVersus.collider.events.on(UICollider.EVENT.FIRST_COLLISION, () => spriteManager.updateSprite(spriteVersus.getIndex(), "red_battletank_aim"));
    buttonVersus.collider.events.on(UICollider.EVENT.LAST_COLLISION, () => spriteManager.updateSprite(spriteVersus.getIndex(), "red_battletank_idle"));

    buttonEdit.collider.events.on(UICollider.EVENT.FIRST_COLLISION, () => spriteManager.updateSprite(spriteEdit.getIndex(), "blue_elite_battery_aim"));
    buttonEdit.collider.events.on(UICollider.EVENT.LAST_COLLISION, () => spriteManager.updateSprite(spriteEdit.getIndex(), "blue_elite_battery_idle"));
}

MainMenuState.prototype.onExit = function(gameContext, stateMachine) {
    const { uiManager, spriteManager } = gameContext;

    uiManager.unparseUI("MAIN_MENU");
    spriteManager.exit();
    gameContext.addDebug();
}