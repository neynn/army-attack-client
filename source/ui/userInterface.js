import { Button } from "./elements/button.js";
import { Container } from "./elements/container.js";
import { DynamicTextElement } from "./elements/dynamicTextElement.js";
import { Icon } from "./elements/icon.js";
import { TextElement } from "./elements/textElement.js";

export const UserInterface = function(id) {
    this.id = id;
    this.elements = [];
    this.roots = [];
}

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

UserInterface.prototype.createElement = function(type, elementID, config) {
    const Type = UserInterface.ELEMENT_CLASS[type];

    if(!Type) {
        return null;
    }

    const element = new Type(elementID);

    element.loadFromConfig(config);

    //set element

    return element;
}

UserInterface.prototype.addElement = function(elementID) {
    this.elements.push(elementID);
}

UserInterface.prototype.addRoot = function(rootID) {
    this.roots.push(rootID);
}

UserInterface.prototype.getElements = function() {
    return this.elements;
}

UserInterface.prototype.getRoots = function() {
    return this.roots;
}

UserInterface.prototype.getID = function() {
    return this.id;
}