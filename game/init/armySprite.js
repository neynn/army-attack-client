import { Graph } from "../../source/graphics/graph.js";
import { TextStyle } from "../../source/graphics/textStyle.js";

export const ArmySprite = function(mainSprite) {
    Graph.call(this, "STAT_CARD");
    
    this.mainSprite = mainSprite;

    this.card = null;
    this.cardX = 0;
    this.cardY = 0;
    this.healthText = "";
    this.damageText = "";

    this.attention = null;
    this.attentionX = 0;
    this.attentionY = 0;

    //TODO: select sprite
}

ArmySprite.prototype = Object.create(Graph.prototype);
ArmySprite.prototype.constructor = ArmySprite;

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
        this.card.onDebug(display, localX, localY);
    }

    if(this.attention) {
        this.attention.onDebug(display, localX, localY);
    }
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

ArmySprite.prototype.setCard = function(card, positionX, positionY) {
    this.card = card;
    this.cardX = positionX;
    this.cardY = positionY;
}

ArmySprite.prototype.onDraw = function(display, localX, localY) {
    if(this.card) {
        const { context } = display;
        const cardX = localX + this.cardX;
        const cardY = localY + this.cardY;

        this.card.onDraw(display, cardX, cardY);

        context.font = ArmySprite.TEXT.FONT;
        context.textAlign = TextStyle.TEXT_ALIGNMENT.RIGHT;
        context.fillStyle = ArmySprite.TEXT.COLOR;
        context.textBaseline = TextStyle.TEXT_BASELINE.MIDDLE;

        if(this.healthText.length !== 0) {
            context.fillText(this.healthText, cardX + 95, cardY + 90);
        }

        if(this.damageText.length !== 0) {
            context.fillText(this.damageText, cardX + 95, cardY + 78);
        }
    }

    if(this.attention) {
        this.attention.onDraw(display, localX + this.attentionX, localY + this.attentionY);
    }
}

ArmySprite.prototype.setHealthText = function(healthText) {
    this.healthText = healthText;

    return this;
}

ArmySprite.prototype.setDamageText = function(damageText) {
    this.damageText = damageText;

    return this;
}