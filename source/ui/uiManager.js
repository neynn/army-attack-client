import { createFadeInEffect } from "../effects/example/fadeIn.js";
import { createFadeOutEffect } from "../effects/example/fadeOut.js";
import { Logger } from "../logger.js";
import { Renderer } from "../renderer.js";
import { ImageManager } from "../resources/imageManager.js";
import { Button } from "./elements/button.js";
import { ButtonCircle } from "./elements/button/buttonCircle.js";
import { ButtonSquare } from "./elements/button/buttonSquare.js";
import { Container } from "./elements/container.js";
import { DynamicTextElement } from "./elements/dynamicTextElement.js";
import { Icon } from "./elements/icon.js";
import { TextElement } from "./elements/textElement.js";
import { UIElement } from "./uiElement.js";

export const UIManager = function() {
    this.resources = new ImageManager();
    this.interfaceTypes = {};
    this.iconTypes = {};
    this.fontTypes = {};
    this.elementTypes = {
        [UIManager.ELEMENT_TYPE_TEXT]: TextElement,
        [UIManager.ELEMENT_TYPE_DYNAMIC_TEXT]: DynamicTextElement,
        [UIManager.ELEMENT_TYPE_BUTTON_SQUARE]: ButtonSquare,
        [UIManager.ELEMENT_TYPE_BUTTON_CIRCLE]: ButtonCircle,
        [UIManager.ELEMENT_TYPE_ICON]: Icon,
        [UIManager.ELEMENT_TYPE_CONTAINER]: Container
    };
    this.effectTypes = {
        [UIManager.EFFECT_TYPE_FADE_IN]: createFadeInEffect,
        [UIManager.EFFECT_TYPE_FADE_OUT]: createFadeOutEffect
    }
    this.interfaceStack = [];
    this.elements = new Map();
    this.origins = new Set();
    this.previousCollisions = new Set();
}

UIManager.EFFECT_TYPE_FADE_IN = "FADE_IN";
UIManager.EFFECT_TYPE_FADE_OUT = "FADE_OUT";

UIManager.ELEMENT_TYPE_TEXT = "TEXT";
UIManager.ELEMENT_TYPE_DYNAMIC_TEXT = "DYNAMIC_TEXT";
UIManager.ELEMENT_TYPE_BUTTON = "BUTTON";
UIManager.ELEMENT_TYPE_BUTTON_SQUARE = "BUTTON_SQUARE";
UIManager.ELEMENT_TYPE_BUTTON_CIRCLE = "BUTTON_CIRCLE";
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

UIManager.prototype.pushInterface = function(userInterfaceID) {
    const userInterface = this.interfaceTypes[userInterfaceID];

    if(!userInterface) {
        Logger.log(false, "Interface does not exist!", "UIManager.prototype.pushInterface", {userInterfaceID});
        return;
    }

    const uniqueElementIDs = new Set();

    for(const elementID in userInterface) {
        const uniqueID = this.getUniqueID(userInterfaceID, elementID);

        uniqueElementIDs.add(uniqueID);
    }

    this.interfaceStack.push({
        "id": userInterfaceID,
        "elementUIDs": uniqueElementIDs
    });
}

UIManager.prototype.popInterface = function(userInterfaceID) {
    for(let i = 0; i < this.interfaceStack.length; i++) {
        const { id } = this.interfaceStack[i];

        if(id === userInterfaceID) {
            if(i === this.interfaceStack.length - 1) {
                this.previousCollisions.clear();
            }

            this.interfaceStack.splice(i, 1);
            
            break;
        }
    }
}

UIManager.prototype.update = function(gameContext) {
    const { timer, client } = gameContext;
    const { cursor } = client;

    this.updateElementCollisions(cursor.position.x, cursor.position.y, cursor.radius);
}

UIManager.prototype.end = function() {
    this.elements.clear();
    this.origins.clear();
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

UIManager.prototype.getOriginIDs = function() {
    return this.origins;
}

UIManager.prototype.getCollidedElements = function(mouseX, mouseY, mouseRange) {
    const currentInterface = this.getCurrentInterface();

    if(!currentInterface) {
        return [];
    }

    for(const elementUID of this.origins) {
        if(!currentInterface.elementUIDs.has(elementUID)) {
            continue;
        }

        const element = this.elements.get(elementUID);
        const collisions = element.getCollisions(mouseX, mouseY, mouseRange);

        if(collisions.length > 0) {
            return collisions;
        }
    }

    return [];
}

UIManager.prototype.addClick = function(interfaceID, buttonID, callback) {
    const button = this.getElement(interfaceID, buttonID);

    if(!button || !(button instanceof Button)) {
        Logger.log(false, "Button does not exist!", "UIManager.prototype.addClick", { interfaceID, buttonID });
        return;
    }

    button.events.subscribe(UIElement.EVENT_CLICKED, "UI_MANAGER", callback);
}

UIManager.prototype.setText = function(interfaceID, textID, message) {
    const text = this.getElement(interfaceID, textID);

    if(!text || !(text instanceof TextElement)) {
        Logger.log(false, "Text does not exist!", "UIManager.prototype.setText", { interfaceID, textID });
        return;
    }

    text.setText(message);
}

UIManager.prototype.addDynamicText = function(interfaceID, textID, onEvent) {
    const text = this.getElement(interfaceID, textID);

    if(!text || !(text instanceof DynamicTextElement)) {
        Logger.log(false, "Text does not exist!", "UIManager.prototype.addTextRequest", { interfaceID, textID });
        return;
    }

    this.removeDynamicText(interfaceID, textID);

    text.events.subscribe(DynamicTextElement.EVENT_REQUEST_TEXT, "UI_MANAGER", (element) => onEvent(element));
}

UIManager.prototype.removeDynamicText = function(interfaceID, textID) {
    const text = this.getElement(interfaceID, textID);

    if(!text || !(text instanceof DynamicTextElement)) {
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

UIManager.prototype.anchorElement = function(gameContext, element, originalPosition, anchorType = Renderer.ANCHOR_TYPE_TOP_LEFT) {
    const { renderer } = gameContext;
    const { bounds } = element;
    const { w, h } = bounds;
    const { x, y } = originalPosition;

    const uniqueID = element.getID();
    const anchor = renderer.getAnchor(anchorType, x, y, w, h);
            
    element.setPosition(anchor.x, anchor.y);

    renderer.events.subscribe(Renderer.EVENT_SCREEN_RESIZE, uniqueID, (width, height) => {
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

    for(const [configID, element] of elements) {
        const { anchor, effects, position } = userInterface[configID];
        const uniqueID = element.getID();

        this.addEffects(gameContext, element, effects);

        if(!element.hasParent()) {
            this.anchorElement(gameContext, element, position, anchor);
            this.origins.add(uniqueID);
        }
    }

    this.pushInterface(userInterfaceID);
}

UIManager.prototype.unparseUI = function(userInterfaceID, gameContext) {
    const { renderer } = gameContext;
    const userInterface = this.interfaceTypes[userInterfaceID];

    if(!userInterface) {
        Logger.log(false, "Interface does not exist!", "UIManager.prototype.unparseUI", { userInterfaceID });
        return;
    }

    for(const elementID in userInterface) {
        const uniqueID = this.getUniqueID(userInterfaceID, elementID);

        this.destroyElement(uniqueID);

        if(this.origins.has(uniqueID)) {
            this.origins.delete(uniqueID);

            renderer.events.unsubscribe(Renderer.EVENT_SCREEN_RESIZE, uniqueID);
        }
    }

    this.popInterface(userInterfaceID);
}