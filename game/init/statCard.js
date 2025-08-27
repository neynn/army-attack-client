import { Graph } from "../../source/graphics/graph.js";
import { TextStyle } from "../../source/graphics/textStyle.js";

export const StatCard = function() {
    Graph.call(this, "STAT_CARD");
    
    this.sprite = null;
    this.healthText = "";
    this.damageText = "";
}

StatCard.prototype = Object.create(Graph.prototype);
StatCard.prototype.constructor = StatCard;

StatCard.TYPE = {
    LARGE: "stat_card",
    SMALL: "stat_card_small"
};

StatCard.TEXT = {
    COLOR: "rgba(238, 238, 238, 255)",
    FONT: "10px ArmyAttack Arial"
};

StatCard.prototype.onDebug = function(display, localX, localY) {
    if(this.sprite) {
        this.sprite.onDebug(display, localX, localY);
    }
}

StatCard.prototype.onDraw = function(display, localX, localY) {
    if(!this.sprite) {
        return;
    }

    const { context } = display;

    this.sprite.onDraw(display, localX, localY);

    context.font = StatCard.TEXT.FONT;
    context.textAlign = TextStyle.TEXT_ALIGNMENT.RIGHT;
    context.fillStyle = StatCard.TEXT.COLOR;
    context.textBaseline = TextStyle.TEXT_BASELINE.MIDDLE;

    if(this.healthText.length !== 0) {
        context.fillText(this.healthText, localX + 95, localY + 90);
    }

    if(this.damageText.length !== 0) {
        context.fillText(this.damageText, localX + 95, localY + 78);
    }
}

StatCard.prototype.setSprite = function(sprite) {
    this.sprite = sprite;
}

StatCard.prototype.setHealthText = function(healthText) {
    this.healthText = healthText;

    return this;
}

StatCard.prototype.setDamageText = function(damageText) {
    this.damageText = damageText;

    return this;
}