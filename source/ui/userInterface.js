import { createFadeInEffect } from "../effects/example/fadeIn.js";
import { createFadeOutEffect } from "../effects/example/fadeOut.js";
import { TextStyle } from "../graphics/applyable/textStyle.js";
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
    this.nameMap = new Map();
    this.elements = new Map();
    this.state = UserInterface.STATE.VISIBLE;
    this.previousCollisions = new Set();
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
    this.nameMap.clear();
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
    this.nameMap.delete(name);

    for(let i = 0; i < this.roots.length; i++) {
        const rootID = this.roots[i];

        if(rootID === elementID) {
            this.roots.splice(i, 1);
            break;
        }
    }
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
    const elementID = this.nameMap.get(name);
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

UserInterface.prototype.createElement = function(typeID, config, DEBUG_NAME) {
    const {
        position = { x: 0, y: 0 },
        width = 0,
        height = 0,
        anchor = UIElement.ANCHOR_TYPE.TOP_LEFT,
        opacity = 1
    } = config;

    const { x, y } = position;

    switch(typeID) {
        case UserInterface.ELEMENT_TYPE.BUTTON: {
            const element = new Button(DEBUG_NAME);
            const { shape = Button.SHAPE.RECTANGLE, radius = width } = config;

            element.addBehaviorFlag(UserInterface.ELEMENT_BEHAVIOR.COLLIDEABLE);
            element.addBehaviorFlag(UserInterface.ELEMENT_BEHAVIOR.CLICKABLE);

            element.setPosition(x, y);
            element.setOpacity(opacity);
            element.setOrigin(x, y);
            element.setAnchor(anchor);

            switch(shape) {
                case Button.SHAPE.RECTANGLE: {
                    element.setSize(width, height);
                    element.setShape(Button.SHAPE.RECTANGLE);
                    break;
                }
                case Button.SHAPE.CIRCLE: {
                    element.setSize(radius, radius);
                    element.setShape(Button.SHAPE.CIRCLE);
                    break;
                }
                default: {
                    Logger.log(Logger.CODE.ENGINE_WARN, "Shape does not exist!", "Button.prototype.init", { "shapeID": shape });
                    break;
                }
            }

            return element;
        }
        case UserInterface.ELEMENT_TYPE.CONTAINER: {
            const element = new Container(DEBUG_NAME);

            element.addBehaviorFlag(UserInterface.ELEMENT_BEHAVIOR.COLLIDEABLE);

            element.setPosition(x, y);
            element.setOpacity(opacity);
            element.setOrigin(x, y);
            element.setAnchor(anchor);

            element.setSize(width, height);

            return element;
        }
        case UserInterface.ELEMENT_TYPE.DYNAMIC_TEXT: {
            const element = new DynamicTextElement(DEBUG_NAME);
            const { 
                text = "ERROR",
                fontType = TextStyle.DEFAULT.FONT_TYPE,
                fontSize = TextStyle.DEFAULT.FONT_SIZE,
                align = TextStyle.TEXT_ALIGNMENT.LEFT,
                color = [0, 0, 0, 1]
            } = config;

            element.setPosition(x, y);
            element.setOpacity(opacity);
            element.setOrigin(x, y);
            element.setAnchor(anchor);

            element.setText(text);
            element.style.setFontType(fontType);
            element.style.setFontSize(fontSize);
            element.style.setAlignment(align);
            element.style.color.setColorArray(color);

            return element;
        }
        case UserInterface.ELEMENT_TYPE.ICON: {
            const element = new Icon(DEBUG_NAME);

            element.setPosition(x, y);
            element.setOpacity(opacity);
            element.setOrigin(x, y);
            element.setAnchor(anchor);

            return element;
        }
        case UserInterface.ELEMENT_TYPE.SCROLLBAR: {
            const element = new Scrollbar(DEBUG_NAME);

            element.addBehaviorFlag(UserInterface.ELEMENT_BEHAVIOR.COLLIDEABLE);
            element.addBehaviorFlag(UserInterface.ELEMENT_BEHAVIOR.CLICKABLE);

            element.setPosition(x, y);
            element.setOpacity(opacity);
            element.setOrigin(x, y);
            element.setAnchor(anchor);

            return element;
        }
        case UserInterface.ELEMENT_TYPE.TEXT: {
            const element = new TextElement(DEBUG_NAME);
            const { 
                text = "ERROR",
                fontType = TextStyle.DEFAULT.FONT_TYPE,
                fontSize = TextStyle.DEFAULT.FONT_SIZE,
                align = TextStyle.TEXT_ALIGNMENT.LEFT,
                color = [0, 0, 0, 1]
            } = config;

            element.setPosition(x, y);
            element.setOpacity(opacity);
            element.setOrigin(x, y);
            element.setAnchor(anchor);

            element.setText(text);
            element.style.setFontType(fontType);
            element.style.setFontSize(fontSize);
            element.style.setAlignment(align);
            element.style.color.setColorArray(color);

            return element;
        }
        default: {
            Logger.log(Logger.CODE.ENGINE_WARN, "ElementType does not exist!", "UserInterface.prototype.createElement", { "type": typeID });

            const element = new UIElement(DEBUG_NAME);
    
            element.setPosition(x, y);
            element.setOpacity(opacity);
            element.setOrigin(x, y);
            element.setAnchor(anchor);

            return element;
        }
    }
}

UserInterface.prototype.addElement = function(element, name) {
    if(!this.nameMap.has(name)) {
        const elementID = element.getID();

        this.nameMap.set(name, elementID);
        this.elements.set(elementID, element);
    }
}

UserInterface.prototype.linkElements = function(parentID, children) {
    if(!children) {
        return;
    }

    const parent = this.getElement(parentID);

    if(!parent) {
        return;
    }

    for(let i = 0; i < children.length; i++) {
        const childID = children[i];
        const child = this.getElement(childID);

        if(child) {
            parent.addChild(child, childID);
        }
    }
}

UserInterface.prototype.constructElement = function(elementID, typeID, config) {
    const element = this.createElement(typeID, config, elementID);

    this.addElement(element, elementID);

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
        const typeID = UserInterface.ELEMENT_TYPE_MAP[type];

        if(typeID === undefined) {
            continue;
        }

        this.constructElement(elementID, typeID, config);
    }
    
    for(const elementID in userInterface) {
        const config = userInterface[elementID];
        const { children, effects } = config;
        const element = this.getElement(elementID);

        if(!element) {
            continue;
        }

        this.addEffects(gameContext, element, effects);
        this.linkElements(elementID, children);
    }

    for(const elementKey in userInterface) {
        const element = this.getElement(elementKey);

        if(!element.hasParent()) {
            const elementID = element.getID();

            this.roots.push(elementID);
        }
    }

    this.updateRootAnchors(w, h);
}

UserInterface.prototype.rootElement = function(gameContext, name) {
    const { renderer } = gameContext;
    const element = this.getElement(name);

    if(!element) {
        return;
    }

    const { w, h } = renderer.getWindow();
    const elementID = element.getID();
    
    element.updateAnchor(w, h);

    this.roots.push(elementID);
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