import { TextStyle } from "../../graphics/textStyle.js";
import { UIElement } from "../uiElement.js";

export const TextElement = function(config) {
    UIElement.call(this, "TEXT_ELEMENT");
    this.style = new TextStyle();
    this.fullText = "";
    this.revealedText = "";
    this.timeElapsed = 0;
    this.isLooping = false;
    this.isRevealing = false;
    this.lettersPerSecond = 2;
    this.isDynamic = false;

    this.events.listen(TextElement.EVENT_REQUEST_TEXT);
    this.loadFromConfig(config);
}

TextElement.prototype = Object.create(UIElement.prototype);
TextElement.prototype.constructor = TextElement;

TextElement.EVENT_REQUEST_TEXT = "TextElement.EVENT_REQUEST_TEXT";

TextElement.prototype.loadFromConfig = function(config) {
    const { id, opacity, position, font, align, color, text } = config;
    const { x, y } = position;

    this.id = id;
    this.DEBUG_NAME = id;
    this.setText(text);
    this.setOpacity(opacity);
    this.setPosition(x, y);
    this.style.setFont(font);
    this.style.setAlignment(align);
    this.style.setColor(color);
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

TextElement.prototype.setDynamic = function(isDynamic) {
    if(isDynamic === undefined) {
        return false;
    }

    this.isDynamic = isDynamic;

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
    if(this.isDynamic) {
        this.events.emit(TextElement.EVENT_REQUEST_TEXT, (textResponse) => this.setText(textResponse));
    }

    this.style.apply(context);

    context.globalAlpha = this.opacity;
    context.fillText(this.revealedText, localX, localY);
}

TextElement.prototype.update = function(deltaTime) {
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