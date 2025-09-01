import { Graph } from "../../source/graphics/graph.js";
import { TextStyle } from "../../source/graphics/textStyle.js";

export const ArmySprite = function() {
    Graph.call(this, "ARMY_SPRITE");

    this.card = null;
    this.cardX = 0;
    this.cardY = 0;
    this.healthText = "";
    this.damageText = "";

    this.attention = null;
    this.attentionX = 0;
    this.attentionY = 0;

    this.other = null;
    this.otherX = 0;
    this.otherY = 0;
}

ArmySprite.prototype = Object.create(Graph.prototype);
ArmySprite.prototype.constructor = ArmySprite;

ArmySprite.OFFSET = {
    HEALTH_Y: 90,
    DAMAGE_Y: 77,
    HEALTH_X: 95,
    DAMAGE_X: 95
};

ArmySprite.TYPE = {
    LARGE: "stat_card",
    SMALL: "stat_card_small"
};

ArmySprite.TEXT = {
    COLOR: "rgba(238, 238, 238, 255)",
    FONT: "10px ArmyAttack Arial"
};

ArmySprite.prototype.onDebug = function(display, localX, localY) {
    if(this.card) {
        this.card.onDebug(display, localX + this.cardX, localY + this.cardY);
    }

    if(this.attention) {
        this.attention.onDebug(display, localX + this.attentionX, localY + this.attentionY);
    }

    if(this.other) {
        this.other.onDebug(display, localX + this.otherX, localY + this.otherY);
    }
}

ArmySprite.prototype.setOther = function(other, positionX, positionY) {
    this.other = other;
    this.otherX = positionX;
    this.otherY = positionY;
}

ArmySprite.prototype.setAttention = function(attention, positionX, positionY) {
    this.attention = attention;
    this.attentionX = positionX;
    this.attentionY = positionY;
}

ArmySprite.prototype.removeAttention = function() {
    this.attention = null;
    this.attentionX = 0;
    this.attentionY = 0;
}

ArmySprite.prototype.removeOther = function() {
    this.other = null;
    this.otherX = 0;
    this.otherY = 0;
}

ArmySprite.prototype.setCard = function(card, positionX, positionY) {
    this.card = card;
    this.cardX = positionX;
    this.cardY = positionY;
}

ArmySprite.prototype.removeCard = function() {
    this.card = null;
    this.cardX = 0;
    this.cardY = 0;
}

ArmySprite.prototype.onDraw = function(display, localX, localY) {
    if(this.card) {
        const { context } = display;
        const cardX = localX + this.cardX;
        const cardY = localY + this.cardY;

        this.card.onDraw(display, cardX, cardY);

        context.font = ArmySprite.TEXT.FONT;
        context.fillStyle = ArmySprite.TEXT.COLOR;
        context.textAlign = TextStyle.TEXT_ALIGNMENT.RIGHT;
        context.textBaseline = TextStyle.TEXT_BASELINE.MIDDLE;

        if(this.healthText.length !== 0) {
            context.fillText(this.healthText, cardX + ArmySprite.OFFSET.HEALTH_X, cardY + ArmySprite.OFFSET.HEALTH_Y);
        }

        if(this.damageText.length !== 0) {
            context.fillText(this.damageText, cardX + ArmySprite.OFFSET.DAMAGE_X, cardY + ArmySprite.OFFSET.DAMAGE_Y);
        }
    }
    
    if(this.attention) {
        this.attention.onDraw(display, localX + this.attentionX, localY + this.attentionY);
    }
    
    if(this.other) {
        this.other.onDraw(display, localX + this.otherX, localY + this.otherY);
    }
}

ArmySprite.prototype.setHealthText = function(healthText) {
    this.healthText = healthText;
}

ArmySprite.prototype.setDamageText = function(damageText) {
    this.damageText = damageText;
}