import { createFadeInEffect } from "../effects/example/fadeIn.js";
import { createFadeOutEffect } from "../effects/example/fadeOut.js";
import { Renderer } from "../renderer.js";
import { Button } from "./elements/button.js";
import { Container } from "./elements/container.js";
import { DynamicTextElement } from "./elements/dynamicTextElement.js";
import { Icon } from "./elements/icon.js";
import { TextElement } from "./elements/textElement.js";
import { UIElement } from "./uiElement.js";

export const UserInterface = function(id) {
    this.id = id;
    this.roots = [];
    this.elements = new Map();
    this.previousCollisions = new Set();
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

UserInterface.prototype.unparse = function(gameContext) {
    const { renderer } = gameContext;

    for(let i = 0; i < this.roots.length; i++) {
        const elementID = this.roots[i];

        renderer.events.unsubscribe(Renderer.EVENT.SCREEN_RESIZE, elementID);
    }

    this.elements.forEach(element => element.closeFamily());
    this.elements.clear();
}

UserInterface.prototype.destroyElement = function(elementID) {
    const element = this.elements.get(elementID);

    if(!element) {
        return;
    }

    element.closeFamily();

    this.elements.delete(elementID);
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
    for(let i = 0; i < this.roots.length; i++) {
        const elementID = this.roots[i];
        const element = this.elements.get(elementID);

        element.update(realTime, deltaTime);
        element.draw(context, 0, 0);
    }
}

UserInterface.prototype.getElement = function(elementID) {
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
    //TODO add state handling!
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
    const button = this.elements.get(buttonID);

    if(!(button instanceof Button)) {
        return;
    }

    button.events.subscribe(Button.EVENT_CLICKED, this.id, onClick);
}

UserInterface.prototype.removeClick = function(buttonID) {
    const button = this.elements.get(buttonID);

    if(!(button instanceof Button)) {
        return;
    }

    button.events.mute(Button.EVENT_CLICKED);
}

UserInterface.prototype.setText = function(textID, message) {
    const text = this.elements.get(textID);

    if(!(text instanceof TextElement)) {
        return;
    }

    text.setText(message);
}

UserInterface.prototype.addDynamicText = function(textID, onCall) {
    const text = this.elements.get(textID);

    if(!(text instanceof DynamicTextElement)) {
        return;
    }

    text.events.subscribe(DynamicTextElement.EVENT_REQUEST_TEXT, this.id, (element) => onCall(element));
}

UserInterface.prototype.removeDynamicText = function(textID) {
    const text = this.elements.get(textID);

    if(!(text instanceof DynamicTextElement)) {
        return;
    }

    text.events.mute(DynamicTextElement.EVENT_REQUEST_TEXT);
}

UserInterface.prototype.addElementAnchor = function(gameContext, element, originalPosition, anchorType = Renderer.ANCHOR_TYPE.TOP_LEFT) {
    const { renderer } = gameContext;
    const { x, y } = originalPosition;
    const elementID = element.getID();
    const anchor = renderer.getAnchor(anchorType, x, y, element.width, element.height);
            
    element.setPosition(anchor.x, anchor.y);

    renderer.events.subscribe(Renderer.EVENT.SCREEN_RESIZE, elementID, (width, height) => {
        const anchor = renderer.getAnchor(anchorType, x, y, element.width, element.height);

        element.setPosition(anchor.x, anchor.y);
    });    
}

UserInterface.prototype.createElement = function(typeID, elementID, config) {
    const Type = UserInterface.ELEMENT_CLASS[typeID];

    if(!Type) {
        return null;
    }

    const element = new Type(elementID);

    element.loadFromConfig(config);

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

UserInterface.prototype.createElements = function(gameContext, userInterface) {
    const elements = new Map();

    for(const elementID in userInterface) {
        const config = userInterface[elementID];
        const { type } = config;
        const element = this.createElement(type, elementID, config);

        if(!element) {
            continue;
        }

        elements.set(elementID, element);
    }
    
    for(const elementID in userInterface) {
        const config = userInterface[elementID];
        const { children } = config;
        const element = elements.get(elementID);

        if(!element || !Array.isArray(children)) {
            continue;
        }

        for(let i = 0; i < children.length; i++) {
            const childID = children[i];
            const child = elements.get(childID);

            if(child) {
                element.addChild(child, childID);
            }
        }
    }

    for(const [elementID, element] of elements) {
        const { anchor, effects, position } = userInterface[elementID];

        this.addEffects(gameContext, element, effects);

        if(!element.hasParent()) {
            this.addElementAnchor(gameContext, element, position, anchor);
            this.addRoot(elementID);
        }
    }

    return elements;
}

UserInterface.prototype.addRoot = function(rootID) {
    this.roots.push(rootID);
}

UserInterface.prototype.getID = function() {
    return this.id;
}