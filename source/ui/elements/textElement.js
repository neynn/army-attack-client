import { TextStyle } from "../../graphics/applyable/textStyle.js";
import { Graph } from "../../graphics/graph.js";
import { UIElement } from "../uiElement.js";

export const TextElement = function(DEBUG_NAME) {
    UIElement.call(this, DEBUG_NAME);
    
    this.style = new TextStyle();
    this.fullText = "";
    this.revealedText = "";
    this.timeElapsed = 0;
    this.isLooping = false;
    this.isRevealing = false;
    this.lettersPerSecond = 2;
    
    this.addDrawHook();
    this.addUpdateHook();
}

TextElement.prototype = Object.create(UIElement.prototype);
TextElement.prototype.constructor = TextElement;

TextElement.prototype.setRevealSpeed = function(revealSpeed) {
    if(revealSpeed !== undefined) {
        this.textRevealSpeed = revealSpeed;
    }
}

TextElement.prototype.setRevealing = function(isRevealing) {
    if(isRevealing !== undefined) {
        this.isRevealing = isRevealing;
    }
}

TextElement.prototype.setText = function(text) {
    if(text === undefined) {
        return;
    }

    this.fullText = text;

    if(this.isRevealing) {
        this.timeElapsed = 0;
        this.revealedText = "";
    } else {
        this.revealText();
    }
}

TextElement.prototype.revealText = function() {
    this.revealedText = this.fullText;
} 

TextElement.prototype.revealLetter = function() {
    if(this.revealedText.length !== this.fullText.length) {
        this.revealedText += this.fullText[this.revealedText.length];
    }
}

TextElement.prototype.isCompleted = function() {
    return this.fullText.length === this.revealedText.length;
}

TextElement.prototype.addDrawHook = function() {
    this.addHook(Graph.HOOK.DRAW, (context, localX, localY) => {
        this.style.apply(context);

        context.fillText(this.revealedText, localX, localY);
    });
}

TextElement.prototype.addUpdateHook = function() {
    this.addHook(Graph.HOOK.UPDATE, (timestamp, deltaTime) => {
        if(!this.isRevealing) {
            return;
        }
    
        this.timeElapsed += deltaTime;
        const revealCount = Math.floor(this.lettersPerSecond * this.timeElapsed);
    
        if(revealCount <= 0) {
            return;
        }
    
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
    });
}