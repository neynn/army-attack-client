import { TextStyle } from "../../graphics/applyable/textStyle.js";
import { UIElement } from "../uiElement.js";

export const TextElement = function(id) {
    UIElement.call(this, id, "TEXT_ELEMENT");
    this.style = new TextStyle();
    this.fullText = "";
    this.revealedText = "";
    this.timeElapsed = 0;
    this.isLooping = false;
    this.isRevealing = false;
    this.lettersPerSecond = 2;
}

TextElement.prototype = Object.create(UIElement.prototype);
TextElement.prototype.constructor = TextElement;

TextElement.prototype.loadFromConfig = function(config) {
    const { id, opacity, position, font, align, color = [0, 0, 0, 0], text } = config;
    const { x, y } = position;

    this.DEBUG_NAME = id;
    this.setText(text);
    this.setOpacity(opacity);
    this.setPosition(x, y);
    this.style.setFont(font);
    this.style.setAlignment(align);
    this.style.setColorArray(color);
}

TextElement.prototype.setRevealSpeed = function(revealSpeed) {
    if(revealSpeed === undefined) {
        return false;
    }

    this.textRevealSpeed = revealSpeed;

    return true;
}

TextElement.prototype.setRevealing = function(isRevealing) {
    if(isRevealing === undefined) {
        return false;
    }

    this.isRevealing = isRevealing;

    return true;
}

TextElement.prototype.setText = function(text) {
    if(text === undefined) {
        return false;
    }

    this.fullText = text;

    if(this.isRevealing) {
        this.timeElapsed = 0;
        this.revealedText = "";
    } else {
        this.revealText();
    }

    return true;
}

TextElement.prototype.revealText = function() {
    this.revealedText = this.fullText;
} 

TextElement.prototype.revealLetter = function() {
    if(this.revealedText.length !== this.fullText.length) {
        this.revealedText += this.fullText[this.revealedText.length];
    }
}

TextElement.prototype.onDraw = function(context, viewportX, viewportY, localX, localY) {
    this.style.apply(context);

    context.globalAlpha = this.opacity;
    context.fillText(this.revealedText, localX, localY);
}

TextElement.prototype.onUpdate = function(timestamp, deltaTime) {
    if(!this.isRevealing) {
        return;
    }

    this.timeElapsed += deltaTime;
    const revealCount = Math.floor(this.lettersPerSecond * this.timeElapsed);

    if(revealCount > 0) {
        this.timeElapsed -= revealCount / this.lettersPerSecond;
        
        for(let i = 0; i < revealCount; i++) {
            if(this.fullText.length !== this.revealedText.length) {
                this.revealLetter();
                continue;
            }
            
            if(this.isLooping) {
                this.revealedText = "";
            } else {
                this.timeElapsed = 0;
            }

            break;
        }
    }
}