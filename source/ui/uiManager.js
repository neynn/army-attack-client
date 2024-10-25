import { Camera } from "../camera/camera.js";
import { response } from "../response.js";
import { Button } from "./elements/button.js";
import { ButtonCircle } from "./elements/button/buttonCircle.js";
import { ButtonSquare } from "./elements/button/buttonSquare.js";
import { Container } from "./elements/container.js";
import { Icon } from "./elements/icon.js";
import { TextElement } from "./elements/textElement.js";
import { UIElement } from "./uiElement.js";

export const UIManager = function() {
    this.userInterfaces = {};
    this.iconTypes = {};
    this.fontTypes = {};
    this.interfaceStack = [];
    this.elements = new Map();
    this.drawableElements = new Set();
    this.elementsToUpdate = new Set();
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
}

UIManager.ELEMENT_TYPE_TEXT = "TEXT";
UIManager.ELEMENT_TYPE_BUTTON = "BUTTON";
UIManager.ELEMENT_TYPE_BUTTON_SQUARE = "BUTTON_SQUARE";
UIManager.ELEMENT_TYPE_BUTTON_CIRCLE = "BUTTON_CIRCLE";
UIManager.ELEMENT_TYPE_CONTAINER = "CONTAINER";
UIManager.ELEMENT_TYPE_ICON = "ICON";
UIManager.EFFECT_TYPE_FADE_IN = "FADE_IN";
UIManager.EFFECT_TYPE_FADE_OUT = "FADE_OUT";

UIManager.prototype.loadFontTypes = function(fonts) {
    if(!fonts) {
        return response(false, "FontTypes cannot be undefined!", "UIManager.prototype.loadFontTypes", null, null);
    }

    this.fontTypes = fonts;

    return response(true, "FontTypes have been loaded!", "UIManager.prototype.loadFontTypes", null, null);
}

UIManager.prototype.loadIconTypes = function(icons) {    
    if(!icons) {
        return response(false, "IconTypes cannot be undefined!", "UIManager.prototype.loadIconTypes", null, null);
    }

    this.iconTypes = icons;

    return response(true, "IconTypes have been loaded!", "UIManager.prototype.loadIconTypes", null, null);
}

UIManager.prototype.getElement = function(uniqueID) {
    const element = this.elements.get(uniqueID);

    if(!element) {
        return null;
    }

    return element;
}

UIManager.prototype.loadUserInterfaceTypes = function(userInterfaces) {    
    if(!userInterfaces) {
        return response(false, "UserInterfaceTypes cannot be undefined!", "UIManager.prototype.loadUserInterfaceTypes", null, null);
    }

    this.userInterfaces = userInterfaces;

    return response(true, "UserInterfaceTypes have been loaded!", "UIManager.prototype.loadUserInterfaceTypes", null, null);
}

UIManager.prototype.generateUniqueID = function(interfaceID, elementID) {
    return interfaceID + "-" + elementID;
}

UIManager.prototype.getCurrentInterface = function() {
    if(this.interfaceStack.length === 0) {
        return null;
    }

    return this.interfaceStack[this.interfaceStack.length - 1];
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

    for(const elementID of this.elementsToUpdate) {
        const element = this.elements.get(elementID);
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
            this.elementsToUpdate.delete(elementID);
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

    for(const elementID of this.drawableElements) {
        const element = this.elements.get(elementID);

        if(element.interfaceID !== currentInterface) {
            continue;
        }

        element.getCollisions(mouseX, mouseY, mouseRange, collidedElements);
    }

    return collidedElements;
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

UIManager.prototype.parseElement = function(uniqueID, config) {
    const { type } = config;
    const Type = this.elementTypes[type];

    if(!Type) {
        return null;
    }

    const element = new Type(config);

    this.elements.set(uniqueID, element);

    return element;
}

UIManager.prototype.loadInterface = function(userInterfaceID, userInterface) {
    const children = new Set();
    const parsedElements = new Map();

    for(const key in userInterface) {
        const config = userInterface[key];

        if(!config.id) {
            console.warn("UIManager.prototype.loadInterface: Key 'id' of 'config' is undefined!");
            continue;
        }

        const uniqueID = this.generateUniqueID(userInterfaceID, config.id);
        const element = this.parseElement(uniqueID, config);

        if(!element) {
            console.warn("UIManager.prototype.loadInterface: Error parsing element!");
            continue;
        }

        if(config.children) {
            for(const childID of config.children) {
                children.add(childID);
            }   
        }

        element.setUniqueID(uniqueID);
        element.setInterfaceID(userInterfaceID);

        parsedElements.set(config.id, { config, element });
    }

    return { children, parsedElements }
}

UIManager.prototype.parseUI = function(userInterfaceID, gameContext) {
    const { renderer } = gameContext;
    const userInterface = this.userInterfaces[userInterfaceID];

    if(!userInterface) {
        return response(false, "Interface does not exist!", "UIManager.prototype.parseUI", null, {userInterfaceID});
    }

    const { children, parsedElements } = this.loadInterface(userInterfaceID, userInterface);

    for(const [key, { config, element }] of parsedElements) {
        this.parseEffects(element, config.effects);

        if(!children.has(element.id)) {
            const uniqueID = element.getUniqueID();

            if(config.anchor) {
                element.adjustAnchor(config.anchor, config.position.x, config.position.y, renderer.viewportWidth, renderer.viewportHeight);
                renderer.events.subscribe(Camera.EVENT_SCREEN_RESIZE, uniqueID, (width, height) => element.adjustAnchor(config.anchor, config.position.x, config.position.y, width, height));    
            }
          
            this.drawableElements.add(uniqueID);
        }

        if(!config.children) {
            continue;
        }

        for(const childID of config.children) {
            if(!parsedElements.has(childID)) {
                continue;
            }

            const child = parsedElements.get(childID);

            if(!element.hasFamily()) {
                element.openFamily();
            }

            element.addChild(child.element, child.element.id);
        }
    }

    this.interfaceStack.push(userInterfaceID);

    return response(true, "UserInterface has been parsed!", "UIManager.prototype.parseUI", null, {userInterfaceID});
}

UIManager.prototype.unparseElement = function(uniqueID) {
    const element = this.elements.get(uniqueID);

    if(!element) {
        return response(false, "Element does not exist!", "UIManager.prototype.unparseElement", null, {uniqueID});
    }

    element.closeFamily();
    this.elements.delete(uniqueID);

    return response(true, "Element has been unparsed!", "UIManager.prototype.unparseElement", null, {uniqueID});
}

UIManager.prototype.unparseUI = function(userInterfaceID, gameContext) {
    const { renderer } = gameContext;
    const userInterface = this.userInterfaces[userInterfaceID];

    if(!userInterface) {
        return response(false, "Interface does not exist!", "UIManager.prototype.unparseUI", null, {userInterfaceID});
    }

    for(const configID in userInterface) {
        const config = userInterface[configID];
        const uniqueID = this.generateUniqueID(userInterfaceID, config.id);

        this.unparseElement(uniqueID);

        if(this.drawableElements.has(uniqueID)) {
            this.drawableElements.delete(uniqueID);
            renderer.events.unsubscribe(Camera.EVENT_SCREEN_RESIZE, uniqueID);
        }
    }

    const interfaceIndex = this.interfaceStack.findIndex(value => value === userInterfaceID);
    this.interfaceStack.splice(interfaceIndex, 1);

    return response(true, "Interface has been unparsed!", "UIManager.prototype.unparseUI", null, {userInterfaceID});
}

UIManager.prototype.addClick = function(interfaceID, buttonID, callback) {
    if(this.userInterfaces[interfaceID] === undefined) {
        return response(false, "Interface does not exist!", "UIManager.prototype.addClick", null, {interfaceID});
    }

    const uniqueID = this.generateUniqueID(interfaceID, buttonID);
    const button = this.elements.get(uniqueID);

    if(!button || !(button instanceof Button)) {
        return response(false, "Button does not exist!", "UIManager.prototype.addClick", null, {interfaceID, buttonID, uniqueID});
    }

    button.events.subscribe(UIElement.EVENT_CLICKED, "UI_MANAGER", callback);

    return response(true, "Callback has been attached to button", "UIManager.prototype.addClick", null, {interfaceID, buttonID, uniqueID});
}

UIManager.prototype.getButton = function(interfaceID, buttonID) {
    if(this.userInterfaces[interfaceID] === undefined) {
        return null;
    }

    const uniqueID = this.generateUniqueID(interfaceID, buttonID);
    const button = this.elements.get(uniqueID);

    if(!button || !(button instanceof Button)) {
        return null;
    }

    return button;
}

UIManager.prototype.getText = function(interfaceID, textID) {
    if(this.userInterfaces[interfaceID] === undefined) {
        return null;
    }

    const uniqueID = this.generateUniqueID(interfaceID, textID);
    const text = this.elements.get(uniqueID);

    if(!text || !(text instanceof TextElement)) {
        return null;
    }

    return text;
}

UIManager.prototype.setText = function(interfaceID, textID, message) {
    if(this.userInterfaces[interfaceID] === undefined) {
        return response(false, "Interface does not exist!", "UIManager.prototype.setText", null, {interfaceID});
    }

    const uniqueID = this.generateUniqueID(interfaceID, textID);
    const text = this.elements.get(uniqueID);

    if(!text || !(text instanceof TextElement)) {
        return response(false, "Text does not exist!", "UIManager.prototype.setText", null, {interfaceID, textID, uniqueID});
    }

    text.setText(message);

    return response(true, "Text has been changed!", "UIManager.prototype.setText", null, {interfaceID, textID, uniqueID, message})
}

UIManager.prototype.removeTextRequest = function(interfaceID, textID) {
    if(this.userInterfaces[interfaceID] === undefined) {
        return response(false, "Interface does not exist!", "UIManager.prototype.removeTextRequest", null, { interfaceID });
    }

    const uniqueID = this.generateUniqueID(interfaceID, textID);
    const text = this.elements.get(uniqueID);

    if(!text || !(text instanceof TextElement)) {
        return response(false, "Text does not exist!", "UIManager.prototype.removeTextRequest", null, { interfaceID, textID, uniqueID });
    }

    text.setDynamic(false);
    text.events.deafen(TextElement.EVENT_REQUEST_TEXT);

    return response(true, "Request has been removed!", "UIManager.prototype.removeTextRequest", null, { interfaceID, textID, uniqueID });
}

UIManager.prototype.addTextRequest = function(interfaceID, textID, callback) {
    if(this.userInterfaces[interfaceID] === undefined) {
        return response(false, "Interface does not exist!", "UIManager.prototype.addTextRequest", null, {interfaceID});
    }

    const uniqueID = this.generateUniqueID(interfaceID, textID);
    const text = this.elements.get(uniqueID);

    if(!text || !(text instanceof TextElement)) {
        return response(false, "Text does not exist!", "UIManager.prototype.addTextRequest", null, {interfaceID, textID, uniqueID});
    }

    this.removeTextRequest(interfaceID, textID);
    text.setDynamic(true);
    text.events.subscribe(TextElement.EVENT_REQUEST_TEXT, "UI_MANAGER", (answer) => answer(callback()));

    return response(true, "Request has been added!", "UIManager.prototype.addTextRequest", null, {textID});
}

UIManager.prototype.addFadeOutEffect = function(element, fadeDecrement, fadeThreshold) {
    const id = Symbol("FadeEffect");
    const uid = element.getUniqueID();

    const fadeFunction = (element, deltaTime) => {
        const opacity = element.opacity - (fadeDecrement * deltaTime);

        element.opacity = Math.max(opacity, fadeThreshold);
        if(element.opacity <= fadeThreshold) {
            element.goalsReached.add(id);
        }
    };

    element.goals.set(id, fadeFunction);

    this.elementsToUpdate.add(uid);
}

UIManager.prototype.addFadeInEffect = function(element, fadeIncrement, fadeThreshold) {
    const id = Symbol("FadeEffect");
    const uid = element.getUniqueID();

    const fadeFunction = (element, deltaTime) => {
        const opacity = element.opacity + (fadeIncrement * deltaTime);

        element.opacity = Math.min(opacity, fadeThreshold);
        if (element.opacity >= fadeThreshold) {
            element.goalsReached.add(id);
        }
    };

    element.goals.set(id, fadeFunction);

    this.elementsToUpdate.add(uid);
}
