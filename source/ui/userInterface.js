import { createFadeInEffect } from "../effects/example/fadeIn.js";
import { createFadeOutEffect } from "../effects/example/fadeOut.js";
import { Button } from "./elements/button.js";
import { Container } from "./elements/container.js";
import { DynamicTextElement } from "./elements/dynamicTextElement.js";
import { Icon } from "./elements/icon.js";
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

UserInterface.EFFECT_TYPE = {
    FADE_IN: "FADE_IN",
    FADE_OUT: "FADE_OUT"
};

UserInterface.EFFECT_CLASS = {
    [UserInterface.EFFECT_TYPE.FADE_IN]: createFadeInEffect,
    [UserInterface.EFFECT_TYPE.FADE_OUT]: createFadeOutEffect
};

UserInterface.ELEMENT_TYPE = {
    TEXT: "TEXT",
    DYNAMIC_TEXT: "DYNAMIC_TEXT",
    BUTTON: "BUTTON",
    ICON: "ICON",
    CONTAINER: "CONTAINER"
};

UserInterface.ELEMENT_CLASS = {
    [UserInterface.ELEMENT_TYPE.BUTTON]: Button,
    [UserInterface.ELEMENT_TYPE.TEXT]: TextElement,
    [UserInterface.ELEMENT_TYPE.DYNAMIC_TEXT]: DynamicTextElement,
    [UserInterface.ELEMENT_TYPE.ICON]: Icon,
    [UserInterface.ELEMENT_TYPE.CONTAINER]: Container
};

UserInterface.STATE = {
    HIDDEN: 0,
    VISIBLE: 1,
    VISIBLE_NO_INTERACT: 2
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

    for(const element of collidedElements) {
        const elementID = element.getID();
        const hasPreviousCollision = this.previousCollisions.has(elementID);

        if(hasPreviousCollision) {
            element.events.emit(UIElement.EVENT.COLLISION, mouseX, mouseY, mouseRange);
        } else {
            element.events.emit(UIElement.EVENT.FIRST_COLLISION, mouseX, mouseY, mouseRange);
        }

        currentCollisions.add(elementID);
    }

    for(const elementID of this.previousCollisions) {
        const hasCurrentCollision = currentCollisions.has(elementID);

        if(!hasCurrentCollision) {
            const element = this.elements.get(elementID);

            element.events.emit(UIElement.EVENT.FINAL_COLLISION, mouseX, mouseY, mouseRange);
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

UserInterface.prototype.addClick = function(buttonID, onClick) {
    const button = this.getElement(buttonID);

    if(!(button instanceof Button)) {
        return;
    }

    button.events.subscribe(Button.EVENT.CLICKED, this.id, onClick);
}

UserInterface.prototype.removeClick = function(buttonID) {
    const button = this.getElement(buttonID);

    if(!(button instanceof Button)) {
        return;
    }

    button.events.mute(Button.EVENT.CLICKED);
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

    text.events.subscribe(DynamicTextElement.EVENT_REQUEST_TEXT, this.id, (element) => onCall(element));
}

UserInterface.prototype.removeDynamicText = function(textID) {
    const text = this.getElement(textID);

    if(!(text instanceof DynamicTextElement)) {
        return;
    }

    text.events.mute(DynamicTextElement.EVENT_REQUEST_TEXT);
}

UserInterface.prototype.createElement = function(name, typeID, config) {
    const ElementType = UserInterface.ELEMENT_CLASS[typeID];

    if(!ElementType || this.idTranslate.has(name)) {
        return null;
    }

    const element = new ElementType(name);
    const elementID = element.getID();

    element.init(config);

    this.idTranslate.set(name, elementID);
    this.elements.set(elementID, element);

    return element;
}

UserInterface.prototype.addEffects = function(gameContext, element, effects = []) {
    const { renderer } = gameContext;

    for(let i = 0; i < effects.length; i++) {
        const { type, value, threshold } = effects[i];
        const effectBuilder = UserInterface.EFFECT_CLASS[type];

        if(!effectBuilder) {
            continue;
        }

        const effect = effectBuilder(element, value, threshold);

        renderer.effects.addEffect(effect);
    }
}

UserInterface.prototype.fromConfig = function(gameContext, userInterface) {
    const { renderer } = gameContext;
    const { w, h } = renderer.getWindow();

    for(const elementID in userInterface) {
        const config = userInterface[elementID];
        const { type } = config;

        this.createElement(elementID, type, config);
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

UserInterface.prototype.onWindowResize = function(width, height) {
    for(let i = 0; i < this.roots.length; i++) {
        const elementID = this.roots[i];
        const element = this.elements.get(elementID);

        element.updateAnchor(width, height);
    }
}

UserInterface.prototype.getID = function() {
    return this.id;
}