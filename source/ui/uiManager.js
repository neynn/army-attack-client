import { EffectManager } from "../effects/effectManager.js";
import { Logger } from "../logger.js";
import { Renderer } from "../renderer.js";
import { Button } from "./elements/button.js";
import { ButtonCircle } from "./elements/button/buttonCircle.js";
import { ButtonSquare } from "./elements/button/buttonSquare.js";
import { Container } from "./elements/container.js";
import { Icon } from "./elements/icon.js";
import { TextElement } from "./elements/textElement.js";
import { UIElement } from "./uiElement.js";

export const UIManager = function() {
    this.interfaceTypes = {};
    this.iconTypes = {};
    this.fontTypes = {};
    this.elementTypes = {
        [UIManager.ELEMENT_TYPE_TEXT]: TextElement,
        [UIManager.ELEMENT_TYPE_BUTTON_SQUARE]: ButtonSquare,
        [UIManager.ELEMENT_TYPE_BUTTON_CIRCLE]: ButtonCircle,
        [UIManager.ELEMENT_TYPE_ICON]: Icon,
        [UIManager.ELEMENT_TYPE_CONTAINER]: Container
    };
    this.interfaceStack = [];
    this.elements = new Map();
    this.parentElements = new Set();
    this.previousCollisions = new Set();
    this.effectManager = new EffectManager();
}

UIManager.ELEMENT_TYPE_TEXT = "TEXT";
UIManager.ELEMENT_TYPE_BUTTON = "BUTTON";
UIManager.ELEMENT_TYPE_BUTTON_SQUARE = "BUTTON_SQUARE";
UIManager.ELEMENT_TYPE_BUTTON_CIRCLE = "BUTTON_CIRCLE";
UIManager.ELEMENT_TYPE_CONTAINER = "CONTAINER";
UIManager.ELEMENT_TYPE_ICON = "ICON";

UIManager.prototype.load = function(interfaceTypes, iconTypes, fontTypes) {
    if(typeof interfaceTypes === "object") {
        this.interfaceTypes = interfaceTypes;
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

UIManager.prototype.getUniqueID = function(interfaceID, elementID) {
    return interfaceID + "-" + elementID;
}

UIManager.prototype.getCurrentInterface = function() {
    if(this.interfaceStack.length === 0) {
        return null;
    }

    return this.interfaceStack[this.interfaceStack.length - 1];
}

UIManager.prototype.getElement = function(interfaceID, elementID) {
    const uniqueID = this.getUniqueID(interfaceID, elementID);
    const element = this.elements.get(uniqueID);

    if(!element) {
        return null;
    }

    return element;
}

UIManager.prototype.getElementByID = function(uniqueID) {
    const element = this.elements.get(uniqueID);

    if(!element) {
        return null;
    }

    return element;
}

UIManager.prototype.getButton = function(interfaceID, buttonID) {
    if(this.interfaceTypes[interfaceID] === undefined) {
        return null;
    }

    const button = this.getElement(interfaceID, buttonID);

    if(!button || !(button instanceof Button)) {
        return null;
    }

    return button;
}

UIManager.prototype.getText = function(interfaceID, textID) {
    if(this.interfaceTypes[interfaceID] === undefined) {
        return null;
    }

    const text = this.getElement(interfaceID, textID);

    if(!text || !(text instanceof TextElement)) {
        return null;
    }

    return text;
}

UIManager.prototype.createElement = function(uniqueID, typeID) {
    const Type = this.elementTypes[typeID];

    if(!Type) {
        return null;
    }

    const element = new Type(uniqueID);

    this.elements.set(uniqueID, element);

    return element;
}

UIManager.prototype.destroyElement = function(uniqueID) {
    const element = this.elements.get(uniqueID);

    if(!element) {
        Logger.log(false, "Element does not exist!", "UIManager.prototype.destroyElement", {uniqueID});

        return false;
    }

    element.closeFamily();
    this.elements.delete(uniqueID);

    return true;
}

UIManager.prototype.pushInterface = function(userInterfaceID) {
    const userInterface = this.interfaceTypes[userInterfaceID];

    if(!userInterface) {
        Logger.log(false, "Interface does not exist!", "UIManager.prototype.pushInterface", {userInterfaceID});

        return false;
    }

    const uniqueElementIDs = new Set();

    for(const key in userInterface) {
        const element = userInterface[key];
        const uniqueID = this.getUniqueID(userInterfaceID, element.id);

        uniqueElementIDs.add(uniqueID);
    }

    this.interfaceStack.push({
        "id": userInterfaceID,
        "elementUIDs": uniqueElementIDs
    });

    return true;
}

UIManager.prototype.popInterface = function(userInterfaceID) {
    for(let i = 0; i < this.interfaceStack.length; i++) {
        const { id } = this.interfaceStack[i];

        if(id === userInterfaceID) {
            if(i === this.interfaceStack.length - 1) {
                this.previousCollisions.clear();
            }

            this.interfaceStack.splice(i, 1);
            
            return true;
        }
    }

    return false;
}

UIManager.prototype.update = function(gameContext) {
    const { timer, client } = gameContext;
    const { cursor } = client;
    const deltaTime = timer.getDeltaTime();
    const activeEffects = this.effectManager.getActiveEffects();

    for(const [effectID, { drawableID, onCall }] of activeEffects) {
        const element = this.elements.get(drawableID);

        if(!element) {
            this.effectManager.markEffectForDeletion(effectID);
            continue;
        }

        onCall(element, deltaTime);
    }

    this.effectManager.deleteCompletedEffects();
    this.updateElementCollisions(cursor.position.x, cursor.position.y, cursor.radius);
}

UIManager.prototype.end = function() {
    this.elements.clear();
    this.parentElements.clear();
    this.interfaceStack = [];
}

UIManager.prototype.updateElementCollisions = function(mouseX, mouseY, mouseRange) {
    const currentCollisions = new Set();
    const collidedElements = this.getCollidedElements(mouseX, mouseY, mouseRange);

    for(const element of collidedElements) {
        const elementID = element.getID();

        if(!this.previousCollisions.has(elementID)) {
            element.events.emit(UIElement.EVENT_FIRST_COLLISION, mouseX, mouseY, mouseRange);
        } else {
            element.events.emit(UIElement.EVENT_COLLISION, mouseX, mouseY, mouseRange);
        }

        currentCollisions.add(elementID);
    }
    
    for(const elementID of this.previousCollisions) {
        if(!currentCollisions.has(elementID)) {
            const element = this.getElementByID(elementID);

            element.events.emit(UIElement.EVENT_FINAL_COLLISION, mouseX, mouseY, mouseRange);
        }
    }

    this.previousCollisions = currentCollisions;
}

UIManager.prototype.getParentElements = function() {
    return this.parentElements;
}

UIManager.prototype.getCollidedElements = function(mouseX, mouseY, mouseRange) {
    const currentInterface = this.getCurrentInterface();

    if(!currentInterface) {
        return [];
    }

    for(const elementUID of this.parentElements) {
        if(!currentInterface.elementUIDs.has(elementUID)) {
            continue;
        }

        const element = this.elements.get(elementUID);
        const collisions = element.getCollisionStack(mouseX, mouseY, mouseRange);

        if(collisions.length > 0) {
            return collisions;
        }
    }

    return [];
}

UIManager.prototype.addClick = function(interfaceID, buttonID, callback) {
    const button = this.getButton(interfaceID, buttonID);

    if(!button) {
        Logger.log(false, "Button does not exist!", "UIManager.prototype.addClick", { interfaceID, buttonID });

        return false;
    }

    button.events.subscribe(UIElement.EVENT_CLICKED, "UI_MANAGER", callback);

    return true;
}

UIManager.prototype.setText = function(interfaceID, textID, message) {
    const text = this.getText(interfaceID, textID);

    if(!text) {
        Logger.log(false, "Text does not exist!", "UIManager.prototype.setText", { interfaceID, textID });

        return false;
    }

    text.setText(message);

    return true;
}

UIManager.prototype.addTextRequest = function(interfaceID, textID, callback) {
    const text = this.getText(interfaceID, textID);

    if(!text) {
        Logger.log(false, "Text does not exist!", "UIManager.prototype.addTextRequest", { interfaceID, textID });

        return false;
    }

    this.removeTextRequest(interfaceID, textID);

    text.setDynamic(true);
    text.events.subscribe(TextElement.EVENT_REQUEST_TEXT, "UI_MANAGER", (answer) => answer(callback()));

    return true;
}

UIManager.prototype.removeTextRequest = function(interfaceID, textID) {
    const text = this.getText(interfaceID, textID);

    if(!text) {
        Logger.log(false, "Text does not exist!", "UIManager.prototype.removeTextRequest", { interfaceID, textID });

        return false;
    }

    text.setDynamic(false);
    text.events.mute(TextElement.EVENT_REQUEST_TEXT);

    return true;
}

UIManager.prototype.createInterface = function(userInterfaceID) {
    const userInterface = this.interfaceTypes[userInterfaceID];
    const elements = new Map();

    if(!userInterface) {
        Logger.log(false, "Interface does not exist!", "UIManager.prototype.createInterface", { userInterfaceID });

        return elements;
    }

    for(const configID in userInterface) {
        const config = userInterface[configID];
        const uniqueID = this.getUniqueID(userInterfaceID, configID);
        const element = this.createElement(uniqueID, config.type);

        if(!element) {
            Logger.log(false, "Element could not be created!", "UIManager.prototype.createInterface", { userInterfaceID, configID });

            continue;
        }

        element.loadFromConfig(config);
        elements.set(configID, element);
    }
    
    for(const configID in userInterface) {
        const config = userInterface[configID];
        const element = elements.get(configID);

        if(!element || !Array.isArray(config.children)) {
            continue;
        }

        for(const childID of config.children) {
            const child = elements.get(childID);

            if(!child) {
                Logger.log(false, "Child is not part of the interface!", "UIManager.prototype.createInterface", { configID, childID, userInterfaceID });

                continue;
            }

            const uniqueID = child.getID();

            element.addChild(child, uniqueID);
        }
    }

    return elements;
}

UIManager.prototype.parseUI = function(userInterfaceID, gameContext) {
    const { renderer } = gameContext;
    const userInterface = this.interfaceTypes[userInterfaceID];

    if(!userInterface) {
        Logger.log(false, "Interface does not exist!", "UIManager.prototype.parseUI", { userInterfaceID });

        return false;
    }

    const elements = this.createInterface(userInterfaceID);

    for(const [configID, element] of elements) {
        const config = userInterface[configID];
        const elementID = element.getID();

        this.effectManager.addEffect(element, config.effects);

        if(element.hasParent()) {
            continue;
        }

        if(config.anchor) {
            const { x, y } = renderer.getAnchor(config.anchor, config.position.x, config.position.y, element.bounds.w, element.bounds.h);
            
            element.setPosition(x, y);

            renderer.events.subscribe(Renderer.EVENT_SCREEN_RESIZE, elementID, (width, height) => {
                const { x, y } = renderer.getAnchor(config.anchor, config.position.x, config.position.y, element.bounds.w, element.bounds.h);
                
                element.setPosition(x, y);
            });    
        }

        this.parentElements.add(elementID);
    }

    this.pushInterface(userInterfaceID);

    return true;
}

UIManager.prototype.unparseUI = function(userInterfaceID, gameContext) {
    const { renderer } = gameContext;
    const userInterface = this.interfaceTypes[userInterfaceID];

    if(!userInterface) {
        Logger.log(false, "Interface does not exist!", "UIManager.prototype.unparseUI", { userInterfaceID });

        return false;
    }

    for(const elementID in userInterface) {
        const uniqueID = this.getUniqueID(userInterfaceID, elementID);

        this.destroyElement(uniqueID);

        if(this.parentElements.has(uniqueID)) {
            this.parentElements.delete(uniqueID);

            renderer.events.unsubscribe(Renderer.EVENT_SCREEN_RESIZE, uniqueID);
        }
    }

    this.popInterface(userInterfaceID);

    return true;
}