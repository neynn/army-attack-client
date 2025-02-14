import { Logger } from "../logger.js";
import { ImageManager } from "../resources/imageManager.js";
import { UserInterface } from "./userInterface.js";

export const UIManager = function() {
    this.resources = new ImageManager();
    this.interfaceStack = [];
    this.interfaceTypes = {};
    this.iconTypes = {};
    this.fontTypes = {};
}

UIManager.prototype.load = function(interfaceTypes, iconTypes, fontTypes) {
    if(typeof interfaceTypes === "object") {
        this.interfaceTypes = interfaceTypes;
        //this.resources.loadImages(iconTypes, (imageID, image) => console.log(imageID), (imageID, error) => console.error(imageID));
    } else {
        Logger.log(false, "InterfaceTypes cannot be undefined!", "UIManager.prototype.load", null);
    }

    if(typeof iconTypes === "object") {
        this.iconTypes = iconTypes;
    } else {
        Logger.log(false, "IconTypes cannot be undefined!", "UIManager.prototype.load", null);
    }

    if(typeof fontTypes === "object") {
        this.fontTypes = fontTypes;
    } else {
        Logger.log(false, "FontTypes cannot be undefined!", "UIManager.prototype.load", null);
    }
}

UIManager.prototype.isIDAvailable = function(interfaceID) {
    if(this.interfaceTypes[interfaceID]) {
        return false;
    }

    const interfaceIndex = this.getInterfaceIndex(interfaceID);

    return interfaceIndex === -1;
}

UIManager.prototype.getInterfaceStack = function() {
    return this.interfaceStack;
}

UIManager.prototype.getInterfaceIndex = function(interfaceID) {
    for(let i = 0; i < this.interfaceStack.length; i++) {
        const userInterface = this.interfaceStack[i];
        const currentID = userInterface.getID();

        if(currentID === interfaceID) {
            return i;
        }
    }

    return -1;
}

UIManager.prototype.update = function(gameContext) {
    for(let i = 0; i < this.interfaceStack.length; i++) {
        const userInterface = this.interfaceStack[i];

        userInterface.update(gameContext);
    }
}

UIManager.prototype.exit = function() {
    this.interfaceStack = [];
}

UIManager.prototype.getCollidedElements = function(mouseX, mouseY, mouseRange) {
    for(let i = this.interfaceStack.length - 1; i >= 0; i--) {
        const userInterface = this.interfaceStack[i];
        const collisions = userInterface.getCollidedElements(mouseX, mouseY, mouseRange);

        if(collisions.length > 0) {
            return collisions;
        }
    }

    return [];
}

UIManager.prototype.getInterface = function(interfaceID) {
    const interfaceIndex = this.getInterfaceIndex(interfaceID);

    if(interfaceIndex === -1) {
        return null;
    }

    return this.interfaceStack[interfaceIndex];
}

UIManager.prototype.parseUI = function(interfaceID, gameContext) {
    const config = this.interfaceTypes[interfaceID];

    if(!config) {
        Logger.log(false, "Interface does not exist!", "UIManager.prototype.parseUI", { interfaceID });
        return;
    }

    const userInterface = new UserInterface(interfaceID);

    userInterface.fromConfig(gameContext, config);

    this.interfaceStack.push(userInterface);

    return userInterface;
}

UIManager.prototype.unparseUI = function(interfaceID, gameContext) {
    const interfaceIndex = this.getInterfaceIndex(interfaceID);

    if(interfaceIndex === -1) {
        Logger.log(false, "Interface does not exist!", "UIManager.prototype.unparseUI", { interfaceID });
        return;
    }

    const userInterface = this.interfaceStack[interfaceIndex];

    userInterface.clear(gameContext);
   
    this.interfaceStack.splice(interfaceIndex, 1);
}

UIManager.prototype.removeUI = function(interfaceID) {
    const interfaceIndex = this.getInterfaceIndex(interfaceID);

    if(interfaceIndex === -1) {
        Logger.log(false, "Interface does not exist!", "UIManager.prototype.removeUI", { interfaceID });
        return;
    }

    this.interfaceStack.splice(interfaceIndex, 1);
}

UIManager.prototype.addUI = function(userInterface) {
    if(!(userInterface instanceof UserInterface)) {
        return false;
    }

    const interfaceID = userInterface.getID();

    if(this.interfaceTypes[interfaceID]) {
        return false;
    }

    if(this.getInterfaceIndex(interfaceID) !== -1) {
        return false;
    }


    this.interfaceStack.push(userInterface);

    return true;
}