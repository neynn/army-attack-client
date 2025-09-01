import { Logger } from "../logger.js";
import { TextureLoader } from "../resources/textureLoader.js";
import { UIParser } from "./parser.js";
import { UserInterface } from "./userInterface.js";

export const UIManager = function() {
    this.resources = new TextureLoader();
    this.parser = new UIParser();
    this.interfaceStack = [];
}

UIManager.prototype.load = function(interfaceTypes, iconTypes) {
    if(!interfaceTypes || !iconTypes) {
        Logger.log(Logger.CODE.ENGINE_ERROR, "InterfaceTypes/IconTypes cannot be undefined!", "UIManager.prototype.load", null);
    }

    this.parser.load(interfaceTypes);
    this.resources.createTextures(iconTypes);
}

UIManager.prototype.debug = function(display) {
    for(let i = this.interfaceStack.length - 1; i >= 0; i--) {
        this.interfaceStack[i].debug(display);
    }
}

UIManager.prototype.draw = function(gameContext, display) {
    const { timer } = gameContext;
    const realTime = timer.getRealTime();
    const deltaTime = timer.getDeltaTime();

    for(let i = this.interfaceStack.length - 1; i >= 0; i--) {
        this.interfaceStack[i].draw(display, realTime, deltaTime);
    }
}

UIManager.prototype.getInterfaceIndex = function(interfaceID) {
    for(let i = 0; i < this.interfaceStack.length; i++) {
        const currentID = this.interfaceStack[i].getID();

        if(currentID === interfaceID) {
            return i;
        }
    }

    return -1;
}

UIManager.prototype.update = function(gameContext) {
    for(let i = 0; i < this.interfaceStack.length; i++) {
        this.interfaceStack[i].update(gameContext);
    }
}

UIManager.prototype.exit = function() {
    this.interfaceStack.length = 0;
}

UIManager.prototype.getInterface = function(interfaceID) {
    const interfaceIndex = this.getInterfaceIndex(interfaceID);

    if(interfaceIndex === -1) {
        return null;
    }

    return this.interfaceStack[interfaceIndex];
}

UIManager.prototype.onClick = function(mouseX, mouseY, mouseRange) {
    for(let i = this.interfaceStack.length - 1; i >= 0; i--) {
        const userInterface = this.interfaceStack[i];
        const isAnyColliding = userInterface.isAnyColliding();

        if(isAnyColliding) {
            userInterface.handleClick(mouseX, mouseY, mouseRange);
            break;
        }
    }
}

UIManager.prototype.onWindowResize = function(windowWidth, windowHeight) {
    for(let i = 0; i < this.interfaceStack.length; i++) {
        this.interfaceStack[i].updateRootAnchors(windowWidth, windowHeight);
    }
}

UIManager.prototype.destroyUI = function(interfaceID) {
    const interfaceIndex = this.getInterfaceIndex(interfaceID);

    if(interfaceIndex === -1) {
        Logger.log(Logger.CODE.ENGINE_ERROR, "Interface does not exist!", "UIManager.prototype.destroyUI", { "interfaceID": interfaceID });
        return;
    }

    const userInterface = this.interfaceStack[interfaceIndex];

    userInterface.clear();

    this.interfaceStack.splice(interfaceIndex, 1);
}

UIManager.prototype.createUI = function(interfaceID) {
    if(this.getInterfaceIndex(interfaceID) !== -1) {
        return null;
    }

    const userInterface = new UserInterface(interfaceID);

    this.interfaceStack.push(userInterface);

    return userInterface;
}

UIManager.prototype.createUIByID = function(id, gameContext) {
    const gui = this.createUI(id);

    if(gui) {
        this.parser.initGUI(gameContext, id, gui);

        gui.refreshRootElements(gameContext);
    }

    return gui;
}