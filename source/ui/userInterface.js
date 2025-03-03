import { createFadeInEffect } from "../effects/example/fadeIn.js";
import { createFadeOutEffect } from "../effects/example/fadeOut.js";
import { Logger } from "../logger.js";
import { Button } from "./elements/button.js";
import { Container } from "./elements/container.js";
import { DynamicTextElement } from "./elements/dynamicTextElement.js";
import { Icon } from "./elements/icon.js";
import { Scrollbar } from "./elements/scrollbar.js";
import { TextElement } from "./elements/textElement.js";
import { UIElement } from "./uiElement.js";

export const UserInterface = function(id) {
    this.id = id;
    this.roots = [];
    this.idTranslate = new Map();
    this.elements = new Map();
    this.previousCollisions = new Set();
    this.state = UserInterface.STATE.VISIBLE;
}

UserInterface.ELEMENT_BEHAVIOR = {
    NONE: 0,
    COLLIDEABLE: 1 << 0,
    CLICKABLE: 1 << 1
};

UserInterface.ELEMENT_TYPE = {
    NONE: 0,
    TEXT: 1,
    DYNAMIC_TEXT: 2,
    BUTTON: 3,
    ICON: 4,
    CONTAINER: 5,
    SCROLLBAR: 6
};

UserInterface.STATE = {
    HIDDEN: 0,
    VISIBLE: 1,
    VISIBLE_NO_INTERACT: 2
};

UserInterface.EFFECT_CLASS = {
    "FADE_IN": createFadeInEffect,
    "FADE_OUT": createFadeOutEffect
};

UserInterface.ELEMENT_TYPE_MAP = {
    "BUTTON": UserInterface.ELEMENT_TYPE.BUTTON,
    "TEXT": UserInterface.ELEMENT_TYPE.TEXT,
    "DYNAMIC_TEXT": UserInterface.ELEMENT_TYPE.DYNAMIC_TEXT,
    "ICON": UserInterface.ELEMENT_TYPE.ICON,
    "CONTAINER": UserInterface.ELEMENT_TYPE.CONTAINER,
    "SCROLLBAR": UserInterface.ELEMENT_TYPE.SCROLLBAR
};

UserInterface.prototype.clear = function() {
    this.elements.forEach(element => element.closeFamily());
    this.elements.clear();
    this.idTranslate.clear();
    this.roots.length = 0;
}

UserInterface.prototype.destroyElement = function(name) {
    const element = this.getElement(name);

    if(!element) {
        return;
    }

    const elementID = element.getID();

    element.closeFamily();

    this.elements.delete(elementID);
    this.idTranslate.delete(name);
}

UserInterface.prototype.update = function(gameContext) {
    const { client } = gameContext;
    const { cursor } = client;

    this.updateCollisions(cursor.positionX, cursor.positionY, cursor.radius);
}

UserInterface.prototype.debug = function(context) {
    for(let i = 0; i < this.roots.length; i++) {
        const elementID = this.roots[i];
        const element = this.elements.get(elementID);

        element.debug(context, 0, 0);
    }
}

UserInterface.prototype.draw = function(context, realTime, deltaTime) {
    if(this.state === UserInterface.STATE.HIDDEN) {
        return;
    }

    for(let i = 0; i < this.roots.length; i++) {
        const elementID = this.roots[i];
        const element = this.elements.get(elementID);

        element.update(realTime, deltaTime);
        element.draw(context, 0, 0);
    }
}

UserInterface.prototype.getElement = function(name) {
    const elementID = this.idTranslate.get(name);
    const element = this.elements.get(elementID);

    if(!element) {
        return null;
    }

    return element;
}

UserInterface.prototype.updateCollisions = function(mouseX, mouseY, mouseRange) {
    const currentCollisions = new Set();
    const collidedElements = this.getCollidedElements(mouseX, mouseY, mouseRange);

    for(let i = 0; i < collidedElements.length; i++) {
        const element = collidedElements[i];
        const elementID = element.getID();
        const hasPreviousCollision = this.previousCollisions.has(elementID);

        if(hasPreviousCollision) {
            element.onCollision(UIElement.COLLISION_TYPE.REPEATED, mouseX, mouseY, mouseRange);
        } else {
            element.onCollision(UIElement.COLLISION_TYPE.FIRST, mouseX, mouseY, mouseRange);
        }

        currentCollisions.add(elementID);
    }

    for(const elementID of this.previousCollisions) {
        const hasCurrentCollision = currentCollisions.has(elementID);

        if(!hasCurrentCollision) {
            const element = this.elements.get(elementID);

            element.onCollision(UIElement.COLLISION_TYPE.LAST, mouseX, mouseY, mouseRange);
        }
    }

    this.previousCollisions = currentCollisions;
}

UserInterface.prototype.getCollidedElements = function(mouseX, mouseY, mouseRange) {
    if(this.state !== UserInterface.STATE.VISIBLE) {
        return [];
    }

    for(let i = 0; i < this.roots.length; i++) {
        const elementID = this.roots[i];
        const element = this.elements.get(elementID);
        const collisions = element.getCollisions(mouseX, mouseY, mouseRange);

        if(collisions.length > 0) {
            return collisions;
        }
    }

    return [];
}

UserInterface.prototype.createElement = function(typeID, DEBUG_NAME) {
    switch(typeID) {
        case UserInterface.ELEMENT_TYPE.BUTTON: {
            const element = new Button(DEBUG_NAME);

            element.addBehaviorFlag(UserInterface.ELEMENT_BEHAVIOR.COLLIDEABLE);
            element.addBehaviorFlag(UserInterface.ELEMENT_BEHAVIOR.CLICKABLE);

            return element;
        }
        case UserInterface.ELEMENT_TYPE.CONTAINER: {
            const element = new Container(DEBUG_NAME);

            element.addBehaviorFlag(UserInterface.ELEMENT_BEHAVIOR.COLLIDEABLE);

            return element;
        }
        case UserInterface.ELEMENT_TYPE.DYNAMIC_TEXT: {
            const element = new DynamicTextElement(DEBUG_NAME);

            return element;
        }
        case UserInterface.ELEMENT_TYPE.ICON: {
            const element = new Icon(DEBUG_NAME);

            return element;
        }
        case UserInterface.ELEMENT_TYPE.SCROLLBAR: {
            const element = new Scrollbar(DEBUG_NAME);

            element.addBehaviorFlag(UserInterface.ELEMENT_BEHAVIOR.COLLIDEABLE);
            element.addBehaviorFlag(UserInterface.ELEMENT_BEHAVIOR.CLICKABLE);

            return element;
        }
        case UserInterface.ELEMENT_TYPE.TEXT: {
            const element = new TextElement(DEBUG_NAME);

            return element;
        }
        default: {
            Logger.log(Logger.CODE.ENGINE_WARN, "ElementType does not exist!", "UserInterface.prototype.createElement", { "type": typeID });

            const element = new UIElement(DEBUG_NAME);
    
            return element;
        }
    }
}

UserInterface.prototype.addElement = function(element, elementName) {
    if(this.idTranslate.has(elementName)) {
        return;
    }

    const elementID = element.getID();

    this.idTranslate.set(elementName, elementID);
    this.elements.set(elementID, element);
}

UserInterface.prototype.initElement = function(elementName, typeName, config) {
    const typeID = UserInterface.ELEMENT_TYPE_MAP[typeName];

    if(typeID === undefined || this.idTranslate.has(elementName)) {
        return null;
    }

    const element = this.createElement(typeID, elementName);

    element.init(config);

    this.addElement(element, elementName);

    return element;
}

UserInterface.prototype.addEffects = function(gameContext, element, effectList) {
    if(!effectList) {
        return;
    }

    const { renderer } = gameContext;
    const { effects } = renderer;

    for(let i = 0; i < effectList.length; i++) {
        const { type, value, threshold } = effectList[i];
        const effectBuilder = UserInterface.EFFECT_CLASS[type];

        if(effectBuilder) {
            const effect = effectBuilder(element, value, threshold);

            effects.addEffect(effect);
        }
    }
}

UserInterface.prototype.fromConfig = function(gameContext, userInterface) {
    const { renderer } = gameContext;
    const { w, h } = renderer.getWindow();

    for(const elementID in userInterface) {
        const config = userInterface[elementID];
        const { type } = config;

        this.initElement(elementID, type, config);
    }
    
    for(const elementID in userInterface) {
        const config = userInterface[elementID];
        const { children } = config;
        const element = this.getElement(elementID);

        if(!element || !Array.isArray(children)) {
            continue;
        }

        for(let i = 0; i < children.length; i++) {
            const childID = children[i];
            const child = this.getElement(childID);

            if(child) {
                element.addChild(child, childID);
            }
        }
    }

    for(const elementKey in userInterface) {
        const { anchor, effects, position } = userInterface[elementKey];
        const element = this.getElement(elementKey);
        const elementID = element.getID();

        this.addEffects(gameContext, element, effects);

        if(!element.hasParent()) {
            const { x, y } = position;

            element.setOrigin(x, y);
            element.setAnchor(anchor);
            element.updateAnchor(w, h);

            this.roots.push(elementID);
        }
    }
}

UserInterface.prototype.updateRootAnchors = function(width, height) {
    for(let i = 0; i < this.roots.length; i++) {
        const elementID = this.roots[i];
        const element = this.elements.get(elementID);

        element.updateAnchor(width, height);
    }
}

UserInterface.prototype.getID = function() {
    return this.id;
}

UserInterface.prototype.addClick = function(buttonID, onClick) {
    const button = this.getElement(buttonID);

    if(!(button instanceof Button)) {
        return;
    }

    button.events.subscribe(UIElement.EVENT.CLICKED, this.id, onClick);
}

UserInterface.prototype.removeClick = function(buttonID) {
    const button = this.getElement(buttonID);

    if(!(button instanceof Button)) {
        return;
    }

    button.events.mute(UIElement.EVENT.CLICKED);
}

UserInterface.prototype.setText = function(textID, message) {
    const text = this.getElement(textID);

    if(!(text instanceof TextElement)) {
        return;
    }

    text.setText(message);
}

UserInterface.prototype.addDynamicText = function(textID, onCall) {
    const text = this.getElement(textID);

    if(!(text instanceof DynamicTextElement)) {
        return;
    }

    text.events.subscribe(UIElement.EVENT.REQUEST_TEXT, this.id, (element) => onCall(element));
}

UserInterface.prototype.removeDynamicText = function(textID) {
    const text = this.getElement(textID);

    if(!(text instanceof DynamicTextElement)) {
        return;
    }

    text.events.mute(UIElement.EVENT.REQUEST_TEXT);
}