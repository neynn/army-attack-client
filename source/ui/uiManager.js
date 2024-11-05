import { Camera } from "../camera/camera.js";
import { Logger } from "../logger.js";
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
    this.effectTypes = {
        [UIManager.EFFECT_TYPE_FADE_IN]: { "function": "addFadeInEffect" },
        [UIManager.EFFECT_TYPE_FADE_OUT]: { "function": "addFadeOutEffect" }
    };
    this.interfaceStack = [];
    this.elements = new Map();
    this.drawableElements = new Set();
    this.elementsToUpdate = new Set();
}

UIManager.ELEMENT_TYPE_TEXT = "TEXT";
UIManager.ELEMENT_TYPE_BUTTON = "BUTTON";
UIManager.ELEMENT_TYPE_BUTTON_SQUARE = "BUTTON_SQUARE";
UIManager.ELEMENT_TYPE_BUTTON_CIRCLE = "BUTTON_CIRCLE";
UIManager.ELEMENT_TYPE_CONTAINER = "CONTAINER";
UIManager.ELEMENT_TYPE_ICON = "ICON";
UIManager.EFFECT_TYPE_FADE_IN = "FADE_IN";
UIManager.EFFECT_TYPE_FADE_OUT = "FADE_OUT";

UIManager.prototype.loadInterfaceTypes = function(interfaceTypes) {    
    if(!interfaceTypes) {
        Logger.log(false, "InterfaceTypes cannot be undefined!", "UIManager.prototype.loadInterfaceTypes", null);

        return false;
    }

    this.interfaceTypes = interfaceTypes;

    return true;
}

UIManager.prototype.loadIconTypes = function(icons) {    
    if(!icons) {
        Logger.log(false, "IconTypes cannot be undefined!", "UIManager.prototype.loadIconTypes", null);

        return false;
    }

    this.iconTypes = icons;

    return true;
}

UIManager.prototype.loadFontTypes = function(fonts) {
    if(!fonts) {
        Logger.log(false, "FontTypes cannot be undefined!", "UIManager.prototype.loadFontTypes", null);

        return false;
    }

    this.fontTypes = fonts;

    return true;
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

UIManager.prototype.createElement = function(uniqueID, config) {
    const { type } = config;
    const Type = this.elementTypes[type];

    if(!Type) {
        return null;
    }

    const element = new Type();

    element.loadFromConfig(config);
    element.setID(uniqueID);

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
            this.interfaceStack.splice(i, 1);
            
            return true;
        }
    }

    return false;
}

UIManager.prototype.workEnd = function() {
    this.elements.clear();
    this.elementsToUpdate.clear();
    this.drawableElements.clear();
    this.interfaceStack = [];
}

UIManager.prototype.update = function(gameContext) {
    const { timer, client } = gameContext;
    const { cursor } = client;
    const deltaTime = timer.getDeltaTime();

    for(const elementUID of this.elementsToUpdate) {
        const element = this.elements.get(elementUID);

        if(!element) {
            continue;
        }
        
        const completedGoals = [];

        for(const [goalID, callback] of element.goals) {
            callback(element, deltaTime);

            if(element.goalsReached.has(goalID)) {
                completedGoals.push(goalID);
            }
        }

        for(const goalID of completedGoals) {
            element.goalsReached.delete(goalID);
            element.goals.delete(goalID);
        }

        if(element.goals.size === 0) {
            this.elementsToUpdate.delete(elementUID);
        }
    }

    for(const [elementID, element] of this.elements) {
        if(element instanceof TextElement) {
            element.onUpdate(0, deltaTime);
        }
    }

    const collidedElements = this.checkCollisions(cursor.position.x, cursor.position.y, cursor.radius);

    for(const element of collidedElements) {
        element.events.emit(UIElement.EVENT_COLLIDES);
    }
}

UIManager.prototype.checkCollisions = function(mouseX, mouseY, mouseRange) {
    const collidedElements = [];
    const currentInterface = this.getCurrentInterface();

    if(!currentInterface) {
        return collidedElements;
    }

    for(const elementUID of this.drawableElements) {
        if(!currentInterface.elementUIDs.has(elementUID)) {
            continue;
        }

        const element = this.elements.get(elementUID);

        element.getCollisions(mouseX, mouseY, mouseRange, collidedElements);
    }

    return collidedElements;
}

UIManager.prototype.addClick = function(interfaceID, buttonID, callback) {
    const button = this.getButton(interfaceID, buttonID);

    if(!button) {
        Logger.log(false, "Button does not exist!", "UIManager.prototype.addClick", {interfaceID, buttonID, uniqueID});

        return false;
    }

    button.events.subscribe(UIElement.EVENT_CLICKED, "UI_MANAGER", callback);

    return true;
}

UIManager.prototype.setText = function(interfaceID, textID, message) {
    const text = this.getText(interfaceID, textID);

    if(!text) {
        Logger.log(false, "Text does not exist!", "UIManager.prototype.setText", {interfaceID, textID, uniqueID});

        return false;
    }

    text.setText(message);

    return true;
}

UIManager.prototype.addTextRequest = function(interfaceID, textID, callback) {
    const text = this.getText(interfaceID, textID);

    if(!text) {
        Logger.log(false, "Text does not exist!", "UIManager.prototype.addTextRequest", {interfaceID, textID, uniqueID});

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
        Logger.log(false, "Text does not exist!", "UIManager.prototype.removeTextRequest", {interfaceID, textID, uniqueID});

        return false;
    }

    text.setDynamic(false);
    text.events.deafen(TextElement.EVENT_REQUEST_TEXT);

    return true;
}

UIManager.prototype.parseEffects = function(element, effects) {
    if(!effects) {
        return;
    }

    for(const effect of effects) {
        const { type, value, threshold } = effect;
        const effectType = this.effectTypes[type];

        if(!effectType) {
            continue;
        }

        this[effectType.function](element, value, threshold);
    }
}

UIManager.prototype.createInterface = function(userInterfaceID) {
    const userInterface = this.interfaceTypes[userInterfaceID];
    const elements = new Map();

    if(!userInterface) {
        Logger.log(false, "Interface does not exist!", "UIManager.prototype.createInterface", {userInterfaceID});

        return elements;
    }

    for(const configID in userInterface) {
        const config = userInterface[configID];
        const uniqueID = this.getUniqueID(userInterfaceID, configID);
        const element = this.createElement(uniqueID, config);

        if(!element) {
            Logger.log(false, "Element could not be created!", "UIManager.prototype.createInterface", {userInterfaceID, configID});

            continue;
        }

        elements.set(configID, element);
    }
    
    for(const configID in userInterface) {
        const config = userInterface[configID];
        const element = elements.get(configID);

        if(!element || !config.children || typeof config.children !== "object") {
            continue;
        }

        if(!element.hasFamily()) {
            element.openFamily();
        }

        for(const childID of config.children) {
            const child = elements.get(childID);

            if(!child) {
                Logger.log(false, "Child is not part of the interface!", "UIManager.prototype.createInterface", {configID, childID, userInterfaceID});

                continue;
            }

            element.addChild(child, child.getID());
        }
    }

    return elements;
}

UIManager.prototype.parseUI = function(userInterfaceID, gameContext) {
    const { renderer } = gameContext;
    const userInterface = this.interfaceTypes[userInterfaceID];

    if(!userInterface) {
        Logger.log(false, "Interface does not exist!", "UIManager.prototype.parseUI", {userInterfaceID});

        return false;
    }

    const elements = this.createInterface(userInterfaceID);

    for(const [configID, element] of elements) {
        const config = userInterface[configID];
        const elementID = element.getID();

        this.parseEffects(element, config.effects);

        if(element.hasParent()) {
            continue;
        }

        if(config.anchor) {
            element.adjustAnchor(config.anchor, config.position.x, config.position.y, renderer.viewportWidth, renderer.viewportHeight);
            renderer.events.subscribe(Camera.EVENT_SCREEN_RESIZE, elementID, (width, height) => element.adjustAnchor(config.anchor, config.position.x, config.position.y, width, height));    
        }

        this.drawableElements.add(elementID);
    }

    this.pushInterface(userInterfaceID);

    return true;
}

UIManager.prototype.unparseUI = function(userInterfaceID, gameContext) {
    const { renderer } = gameContext;
    const userInterface = this.interfaceTypes[userInterfaceID];

    if(!userInterface) {
        Logger.log(false, "Interface does not exist!", "UIManager.prototype.unparseUI", {userInterfaceID});

        return false;
    }

    for(const elementID in userInterface) {
        const uniqueID = this.getUniqueID(userInterfaceID, elementID);

        this.destroyElement(uniqueID);

        if(this.drawableElements.has(uniqueID)) {
            this.drawableElements.delete(uniqueID);

            renderer.events.unsubscribe(Camera.EVENT_SCREEN_RESIZE, uniqueID);
        }
    }

    this.popInterface(userInterfaceID);

    return true;
}

UIManager.prototype.addFadeOutEffect = function(element, fadeDecrement, fadeThreshold) {
    const effectID = Symbol("FadeEffect");
    const elementID = element.getID();

    const fadeFunction = (element, deltaTime) => {
        const opacity = element.opacity - (fadeDecrement * deltaTime);

        element.opacity = Math.max(opacity, fadeThreshold);
        if(element.opacity <= fadeThreshold) {
            element.goalsReached.add(effectID);
        }
    };

    element.goals.set(effectID, fadeFunction);

    this.elementsToUpdate.add(elementID);
}

UIManager.prototype.addFadeInEffect = function(element, fadeIncrement, fadeThreshold) {
    const effectID = Symbol("FadeEffect");
    const elementID = element.getID();

    const fadeFunction = (element, deltaTime) => {
        const opacity = element.opacity + (fadeIncrement * deltaTime);

        element.opacity = Math.min(opacity, fadeThreshold);
        if (element.opacity >= fadeThreshold) {
            element.goalsReached.add(effectID);
        }
    };

    element.goals.set(effectID, fadeFunction);

    this.elementsToUpdate.add(elementID);
}
