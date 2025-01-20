import { createFadeInEffect } from "../effects/example/fadeIn.js";
import { createFadeOutEffect } from "../effects/example/fadeOut.js";
import { Logger } from "../logger.js";
import { Renderer } from "../renderer.js";
import { ImageManager } from "../resources/imageManager.js";
import { Button } from "./elements/button.js";
import { Container } from "./elements/container.js";
import { DynamicTextElement } from "./elements/dynamicTextElement.js";
import { Icon } from "./elements/icon.js";
import { TextElement } from "./elements/textElement.js";
import { UIElement } from "./uiElement.js";
import { UserInterface } from "./userInterface.js";

export const UIManager = function() {
    this.resources = new ImageManager();
    this.interfaceStack = [];
    this.interfaceTypes = {};
    this.iconTypes = {};
    this.fontTypes = {};
    this.elementTypes = {
        [UIManager.ELEMENT_TYPE_TEXT]: TextElement,
        [UIManager.ELEMENT_TYPE_DYNAMIC_TEXT]: DynamicTextElement,
        [UIManager.ELEMENT_TYPE_BUTTON]: Button,
        [UIManager.ELEMENT_TYPE_ICON]: Icon,
        [UIManager.ELEMENT_TYPE_CONTAINER]: Container
    };
    this.effectTypes = {
        [UIManager.EFFECT_TYPE_FADE_IN]: createFadeInEffect,
        [UIManager.EFFECT_TYPE_FADE_OUT]: createFadeOutEffect
    }
    this.elements = new Map();
    this.previousCollisions = new Set();
}

UIManager.EFFECT_TYPE_FADE_IN = "FADE_IN";
UIManager.EFFECT_TYPE_FADE_OUT = "FADE_OUT";

UIManager.ELEMENT_TYPE_TEXT = "TEXT";
UIManager.ELEMENT_TYPE_DYNAMIC_TEXT = "DYNAMIC_TEXT";
UIManager.ELEMENT_TYPE_BUTTON = "BUTTON";
UIManager.ELEMENT_TYPE_CONTAINER = "CONTAINER";
UIManager.ELEMENT_TYPE_ICON = "ICON";

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

UIManager.prototype.getInterfaceStack = function() {
    return this.interfaceStack;
}

UIManager.prototype.getUniqueID = function(interfaceID, elementID) {
    return interfaceID + "-" + elementID;
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

UIManager.prototype.createElement = function(uniqueID, typeID, config) {
    const Type = this.elementTypes[typeID];

    if(!Type) {
        return null;
    }

    const element = new Type(uniqueID);

    element.loadFromConfig(config);

    this.elements.set(uniqueID, element);

    return element;
}

UIManager.prototype.destroyElement = function(uniqueID) {
    const element = this.elements.get(uniqueID);

    if(!element) {
        Logger.log(false, "Element does not exist!", "UIManager.prototype.destroyElement", {uniqueID});
        return;
    }

    element.closeFamily();

    this.elements.delete(uniqueID);
}

UIManager.prototype.getInterfaceIndex = function(userInterfaceID) {
    for(let i = 0; i < this.interfaceStack.length; i++) {
        const tree = this.interfaceStack[i];
        const id = tree.getID();

        if(id === userInterfaceID) {
            return i;
        }
    }

    return -1;
}

UIManager.prototype.update = function(gameContext) {
    const { client } = gameContext;
    const { cursor } = client;

    this.updateElementCollisions(cursor.position.x, cursor.position.y, cursor.radius);
}

UIManager.prototype.end = function() {
    this.elements.clear();
    this.interfaceStack = [];
}

UIManager.prototype.updateElementCollisions = function(mouseX, mouseY, mouseRange) {
    const currentCollisions = new Set();
    const collidedElements = this.getCollidedElements(mouseX, mouseY, mouseRange);

    for(const element of collidedElements) {
        const elementUID = element.getID();
        const isPreviousCollision = this.previousCollisions.has(elementUID);

        if(isPreviousCollision) {
            element.events.emit(UIElement.EVENT_COLLISION, mouseX, mouseY, mouseRange);
        } else {
            element.events.emit(UIElement.EVENT_FIRST_COLLISION, mouseX, mouseY, mouseRange);
        }

        currentCollisions.add(elementUID);
    }
    
    for(const elementUID of this.previousCollisions) {
        const isCurrentCollision = currentCollisions.has(elementUID);

        if(!isCurrentCollision) {
            const element = this.getElementByID(elementUID);

            element.events.emit(UIElement.EVENT_FINAL_COLLISION, mouseX, mouseY, mouseRange);
        }
    }

    this.previousCollisions = currentCollisions;
}

UIManager.prototype.getCollidedElements = function(mouseX, mouseY, mouseRange) {
    for(let i = this.interfaceStack.length - 1; i >= 0; i--) {
        const tree = this.interfaceStack[i];
        const roots = tree.getRoots();

        for(const elementUID of roots) {
            const element = this.elements.get(elementUID);
            const collisions = element.getCollisions(mouseX, mouseY, mouseRange);
    
            if(collisions.length > 0) {
                return collisions;
            }
        }
    }

    return [];
}

UIManager.prototype.addClick = function(interfaceID, buttonID, callback) {
    const button = this.getElement(interfaceID, buttonID);

    if(!(button instanceof Button)) {
        Logger.log(false, "Button does not exist!", "UIManager.prototype.addClick", { interfaceID, buttonID });
        return;
    }

    button.events.subscribe(Button.EVENT_CLICKED, "UI_MANAGER", callback);
}

UIManager.prototype.removeClick = function(interfaceID, buttonID) {
    const button = this.getElement(interfaceID, buttonID);

    if(!(button instanceof Button)) {
        Logger.log(false, "Button does not exist!", "UIManager.prototype.addClick", { interfaceID, buttonID });
        return;
    }

    button.events.mute(Button.EVENT_CLICKED);
}

UIManager.prototype.setText = function(interfaceID, textID, message) {
    const text = this.getElement(interfaceID, textID);

    if(!(text instanceof TextElement)) {
        Logger.log(false, "Text does not exist!", "UIManager.prototype.setText", { interfaceID, textID });
        return;
    }

    text.setText(message);
}

UIManager.prototype.addDynamicText = function(interfaceID, textID, onEvent) {
    const text = this.getElement(interfaceID, textID);

    if(!(text instanceof DynamicTextElement)) {
        Logger.log(false, "Text does not exist!", "UIManager.prototype.addTextRequest", { interfaceID, textID });
        return;
    }

    text.events.subscribe(DynamicTextElement.EVENT_REQUEST_TEXT, "UI_MANAGER", (element) => onEvent(element));
}

UIManager.prototype.removeDynamicText = function(interfaceID, textID) {
    const text = this.getElement(interfaceID, textID);

    if(!(text instanceof DynamicTextElement)) {
        Logger.log(false, "Text does not exist!", "UIManager.prototype.removeTextRequest", { interfaceID, textID });
        return;
    }

    text.events.mute(DynamicTextElement.EVENT_REQUEST_TEXT);
}

UIManager.prototype.createInterfaceElements = function(userInterfaceID) {
    const userInterface = this.interfaceTypes[userInterfaceID];
    const elements = new Map();

    if(!userInterface) {
        Logger.log(false, "Interface does not exist!", "UIManager.prototype.createInterfaceElements", { userInterfaceID });
        return elements;
    }

    for(const elementID in userInterface) {
        const config = userInterface[elementID];
        const uniqueID = this.getUniqueID(userInterfaceID, elementID);
        const element = this.createElement(uniqueID, config.type, config);

        if(!element) {
            Logger.log(false, "Element could not be created!", "UIManager.prototype.createInterfaceElements", { userInterfaceID, elementID });
            continue;
        }

        elements.set(elementID, element);
    }
    
    for(const elementID in userInterface) {
        const { children } = userInterface[elementID];
        const element = elements.get(elementID);

        if(!element || !Array.isArray(children)) {
            continue;
        }

        for(const childID of children) {
            const child = elements.get(childID);

            if(!child) {
                Logger.log(false, "Child is not part of the interface!", "UIManager.prototype.createInterfaceElements", { elementID, childID, userInterfaceID });
                continue;
            }

            const uniqueID = child.getID();

            element.addChild(child, uniqueID);
        }
    }

    return elements;
}

UIManager.prototype.addEffects = function(gameContext, element, effects = []) {
    const { renderer } = gameContext;

    for(const effectConfig of effects) {
        const { type, value, threshold } = effectConfig;
        const effectBuilder = this.effectTypes[type];

        if(!effectBuilder) {
            continue;
        }

        const effect = effectBuilder(element, value, threshold);

        renderer.effects.addEffect(effect);
    }
}

UIManager.prototype.addElementAnchor = function(gameContext, element, originalPosition, anchorType = Renderer.ANCHOR_TYPE.TOP_LEFT) {
    const { renderer } = gameContext;
    const { bounds } = element;
    const { w, h } = bounds;
    const { x, y } = originalPosition;

    const elementUID = element.getID();
    const anchor = renderer.getAnchor(anchorType, x, y, w, h);
            
    element.setPosition(anchor.x, anchor.y);

    renderer.events.subscribe(Renderer.EVENT.SCREEN_RESIZE, elementUID, (width, height) => {
        const anchor = renderer.getAnchor(anchorType, x, y, w, h);
        
        element.setPosition(anchor.x, anchor.y);
    });    
}

UIManager.prototype.parseUI = function(userInterfaceID, gameContext) {
    const userInterface = this.interfaceTypes[userInterfaceID];

    if(!userInterface) {
        Logger.log(false, "Interface does not exist!", "UIManager.prototype.parseUI", { userInterfaceID });
        return;
    }

    const elements = this.createInterfaceElements(userInterfaceID);
    const ui = new UserInterface(userInterfaceID);

    for(const [configID, element] of elements) {
        const { anchor, effects, position } = userInterface[configID];
        const uniqueID = element.getID();

        this.addEffects(gameContext, element, effects);
        ui.addElement(uniqueID);

        if(!element.hasParent()) {
            this.addElementAnchor(gameContext, element, position, anchor);
            ui.addRoot(uniqueID);
        }
    }

    this.interfaceStack.push(ui);
}

UIManager.prototype.unparseUI = function(userInterfaceID, gameContext) {
    const { renderer } = gameContext;
    const interfaceIndex = this.getInterfaceIndex(userInterfaceID);

    if(interfaceIndex === -1) {
        Logger.log(false, "Interface does not exist!", "UIManager.prototype.unparseUI", { userInterfaceID });
        return;
    }

    const userInterface = this.interfaceStack[interfaceIndex];
    const elements = userInterface.getElements();
    const roots = userInterface.getRoots();

    for(const elementUID of roots) {
        renderer.events.unsubscribe(Renderer.EVENT.SCREEN_RESIZE, elementUID);
    }
    
    for(const elementUID of elements) {
        this.destroyElement(elementUID);
    }

    if(interfaceIndex === this.interfaceStack.length - 1) {
        this.previousCollisions.clear();
    }

    this.interfaceStack.splice(interfaceIndex, 1);
}