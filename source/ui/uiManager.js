import { Logger } from "../logger.js";
import { TextureLoader } from "../resources/textureLoader.js";
import { UserInterface } from "./userInterface.js";
import { UIElement } from "./uiElement.js";
import { TextStyle } from "../graphics/textStyle.js";
import { Button } from "./elements/button.js";
import { Container } from "./elements/container.js";
import { Icon } from "./elements/icon.js";
import { Scrollbar } from "./elements/scrollbar.js";
import { TextElement } from "./elements/textElement.js";
import { SHAPE } from "../math/constants.js";

export const UIManager = function() {
    this.resources = new TextureLoader();
    this.interfaceStack = [];
    this.interfaceTypes = {};
}

UIManager.ELEMENT_TYPE = {
    NONE: 0,
    TEXT: 1,
    BUTTON: 2,
    ICON: 3,
    CONTAINER: 4,
    SCROLLBAR: 5
};

UIManager.ELEMENT_TYPE_MAP = {
    "BUTTON": UIManager.ELEMENT_TYPE.BUTTON,
    "TEXT": UIManager.ELEMENT_TYPE.TEXT,
    "ICON": UIManager.ELEMENT_TYPE.ICON,
    "CONTAINER": UIManager.ELEMENT_TYPE.CONTAINER,
    "SCROLLBAR": UIManager.ELEMENT_TYPE.SCROLLBAR
};

UIManager.prototype.load = function(interfaceTypes, iconTypes) {
    if(!interfaceTypes || !iconTypes) {
        Logger.log(Logger.CODE.ENGINE_ERROR, "InterfaceTypes/IconTypes cannot be undefined!", "UIManager.prototype.load", null);
    }

    this.interfaceTypes = interfaceTypes;
    this.resources.createTextures(iconTypes);
}

UIManager.prototype.debug = function(display) {
    for(let i = this.interfaceStack.length - 1; i >= 0; i--) {
        this.interfaceStack[i].debug(display);
    }
}

UIManager.prototype.draw = function(gameContext, display) {
    const { timer } = gameContext;
    const realTime = timer.getRealTime();
    const deltaTime = timer.getDeltaTime();

    for(let i = this.interfaceStack.length - 1; i >= 0; i--) {
        this.interfaceStack[i].draw(display, realTime, deltaTime);
    }
}

UIManager.prototype.getInterfaceIndex = function(interfaceID) {
    for(let i = 0; i < this.interfaceStack.length; i++) {
        const currentID = this.interfaceStack[i].getID();

        if(currentID === interfaceID) {
            return i;
        }
    }

    return -1;
}

UIManager.prototype.update = function(gameContext) {
    for(let i = 0; i < this.interfaceStack.length; i++) {
        this.interfaceStack[i].update(gameContext);
    }
}

UIManager.prototype.exit = function() {
    this.interfaceStack.length = 0;
}

UIManager.prototype.getInterface = function(interfaceID) {
    const interfaceIndex = this.getInterfaceIndex(interfaceID);

    if(interfaceIndex === -1) {
        return null;
    }

    return this.interfaceStack[interfaceIndex];
}

UIManager.prototype.onClick = function(mouseX, mouseY, mouseRange) {
    for(let i = this.interfaceStack.length - 1; i >= 0; i--) {
        const userInterface = this.interfaceStack[i];
        const isAnyColliding = userInterface.isAnyColliding();

        if(isAnyColliding) {
            userInterface.handleClick(mouseX, mouseY, mouseRange);
            break;
        }
    }
}

UIManager.prototype.onWindowResize = function(windowWidth, windowHeight) {
    for(let i = 0; i < this.interfaceStack.length; i++) {
        this.interfaceStack[i].updateRootAnchors(windowWidth, windowHeight);
    }
}

UIManager.prototype.destroyUI = function(interfaceID) {
    const interfaceIndex = this.getInterfaceIndex(interfaceID);

    if(interfaceIndex === -1) {
        Logger.log(Logger.CODE.ENGINE_ERROR, "Interface does not exist!", "UIManager.prototype.destroyUI", { "interfaceID": interfaceID });
        return;
    }

    const userInterface = this.interfaceStack[interfaceIndex];

    userInterface.clear();

    this.interfaceStack.splice(interfaceIndex, 1);
}

UIManager.prototype.createUI = function(interfaceID, onCreate) {
    if(this.getInterfaceIndex(interfaceID) !== -1) {
        return null;
    }

    const userInterface = new UserInterface(interfaceID);

    if(typeof onCreate === "function") {
        onCreate(userInterface);
    }

    this.interfaceStack.push(userInterface);

    return userInterface;
}

UIManager.prototype.createUIByID = function(interfaceID, gameContext) {
    const config = this.interfaceTypes[interfaceID];

    if(!config) {
        Logger.log(Logger.CODE.ENGINE_ERROR, "Interface does not exist!", "UIManager.prototype.createUIByID", { "interfaceID": interfaceID });
        return null;
    }

    const userInterface = this.createUI(interfaceID, (ui) => ui.fromConfig(gameContext, config));

    return userInterface;
}

UIManager.prototype.createElement = function(typeID, config, DEBUG_NAME) {
    const {
        position = { x: 0, y: 0 },
        width = 0,
        height = 0,
        anchor = "TOP_LEFT",
        opacity = 1
    } = config;

    const { x, y } = position;

    switch(typeID) {
        case UIManager.ELEMENT_TYPE.BUTTON: {
            const element = new Button(DEBUG_NAME);
            const { shape = SHAPE.RECTANGLE, radius = width } = config;

            element.setPosition(x, y);
            element.setOpacity(opacity);
            element.setOrigin(x, y);
            element.setAnchor(anchor);

            switch(shape) {
                case SHAPE.RECTANGLE: {
                    element.setSize(width, height);
                    element.setShape(SHAPE.RECTANGLE);
                    break;
                }
                case SHAPE.CIRCLE: {
                    element.setSize(radius, radius);
                    element.setShape(SHAPE.CIRCLE);
                    break;
                }
                default: {
                    Logger.log(Logger.CODE.ENGINE_WARN, "Shape does not exist!", "UIManager.prototype.createElement", { "shapeID": shape });
                    break;
                }
            }

            return element;
        }
        case UIManager.ELEMENT_TYPE.CONTAINER: {
            const element = new Container(DEBUG_NAME);

            element.setPosition(x, y);
            element.setOpacity(opacity);
            element.setOrigin(x, y);
            element.setAnchor(anchor);

            element.setSize(width, height);

            return element;
        }
        case UIManager.ELEMENT_TYPE.ICON: {
            const element = new Icon(DEBUG_NAME);
            const {
                image = null,
                scaleX = 1,
                scaleY = 1
            } = config;

            const texture = this.resources.getTexture(image);

            this.resources.requestBitmap(image);
            
            element.setPosition(x, y);
            element.setOpacity(opacity);
            element.setOrigin(x, y);
            element.setAnchor(anchor);
            element.setSize(width, height);
            element.setTexture(texture);
            element.setScale(scaleX, scaleY);

            return element;
        }
        case UIManager.ELEMENT_TYPE.SCROLLBAR: {
            const element = new Scrollbar(DEBUG_NAME);

            element.setPosition(x, y);
            element.setOpacity(opacity);
            element.setOrigin(x, y);
            element.setAnchor(anchor);

            return element;
        }
        case UIManager.ELEMENT_TYPE.TEXT: {
            const element = new TextElement(DEBUG_NAME);
            const { 
                text = "ERROR",
                fontType = TextStyle.DEFAULT.FONT_TYPE,
                fontSize = TextStyle.DEFAULT.FONT_SIZE,
                align = TextStyle.TEXT_ALIGNMENT.LEFT,
                color = [0, 0, 0, 255]
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
            Logger.log(Logger.CODE.ENGINE_WARN, "ElementType does not exist!", "UIManager.prototype.createElement", { "type": typeID });

            const element = new UIElement(DEBUG_NAME);
    
            element.setPosition(x, y);
            element.setOpacity(opacity);
            element.setOrigin(x, y);
            element.setAnchor(anchor);

            return element;
        }
    }
}