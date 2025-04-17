import { createFadeInEffect } from "../effects/example/fadeIn.js";
import { createFadeOutEffect } from "../effects/example/fadeOut.js";
import { TextElement } from "./elements/textElement.js";
import { UICollider } from "./uiCollider.js";
import { UIManager } from "./uiManager.js";

export const UserInterface = function(id) {
    this.id = id;
    this.roots = [];
    this.nameMap = new Map();
    this.elements = new Map();
    this.state = UserInterface.STATE.VISIBLE;
}

UserInterface.STATE = {
    HIDDEN: 0,
    VISIBLE: 1,
    VISIBLE_NO_INTERACT: 2
};

UserInterface.EFFECT_CLASS = {
    "FADE_IN": createFadeInEffect,
    "FADE_OUT": createFadeOutEffect
};

UserInterface.prototype.clear = function() {
    this.elements.forEach(element => element.closeGraph());
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

    element.closeGraph();

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
    const { renderer, uiManager } = gameContext;
    const { w, h } = renderer.getWindow();

    for(const elementID in userInterface) {
        const config = userInterface[elementID];
        const { type } = config;
        const typeID = UIManager.ELEMENT_TYPE_MAP[type];

        if(typeID !== undefined) {
            const element = uiManager.createElement(typeID, config, elementID);

            this.addElement(element, elementID);
        }
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

UserInterface.prototype.addClick = function(elementID, onClick, id) {
    const element = this.getElement(elementID);

    if(element.collider) {
        const subscriberID = id === undefined ? this.id : id;

        element.collider.events.on(UICollider.EVENT.CLICKED, onClick, { id: subscriberID });
    }
}

UserInterface.prototype.removeClick = function(elementID, id) {
    const element = this.getElement(elementID);

    if(element.collider) {
        const subscriberID = id === undefined ? this.id : id;

        element.collider.events.unsubscribeAll(UICollider.EVENT.CLICKED, subscriberID);
    }
}

UserInterface.prototype.setText = function(textID, message) {
    const text = this.getElement(textID);

    if(!(text instanceof TextElement)) {
        return;
    }

    text.setText(message);
}