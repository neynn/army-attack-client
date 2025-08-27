import { getTeamID } from "../enums.js";
import { ArmyEntity } from "../init/armyEntity.js";

/**
 * Collection of functions revolving around the stat card of an entity.
 */
export const CardSystem = function() {}

CardSystem.CARD_TYPE = {
    LARGE: "stat_card",
    SMALL: "stat_card_small"
};

CardSystem.CARD_SPRITE_CACHE = {};

/**
 * Creates the entities stat card.
 * 
 * @param {*} gameContext 
 * @param {*} entity 
 * @returns 
 */
const createStatCardSprite = function(gameContext, entity) {
    const cardType = entity.hasComponent(ArmyEntity.COMPONENT.ATTACK) ? CardSystem.CARD_TYPE.LARGE : CardSystem.CARD_TYPE.SMALL;
    const teamType = gameContext.getTeamType(getTeamID(entity.teamID));
    const spriteType = teamType.sprites[cardType];

    if(CardSystem.CARD_SPRITE_CACHE[spriteType]) {
        return CardSystem.CARD_SPRITE_CACHE[spriteType];
    }

    const { spriteManager } = gameContext;
    const statCard = spriteManager.createSprite(teamType.sprites[cardType]);

    if(statCard) {
        CardSystem.CARD_SPRITE_CACHE[spriteType] = statCard;
    }

    return statCard;
}

/**
 * Creates and attaches the stat card to the entity.
 * 
 * @param {*} gameContext 
 * @param {*} entity 
 * @returns 
 */
CardSystem.generateStatCard = function(gameContext, entity) {
    if(entity.config.disableCard) {
        return;
    }

    const statCardSprite = createStatCardSprite(gameContext, entity);

    if(statCardSprite) {
        const { transform2D } = gameContext;
        const { x, y } = transform2D.transformSizeToWorldOffset(entity.config.dimX, entity.config.dimY);
        const spriteComponent = entity.getComponent(ArmyEntity.COMPONENT.SPRITE);
        const sprite = spriteComponent.getSprite(gameContext);

        entity.statCard.setPosition(x - transform2D.halfTileWidth, y - transform2D.halfTileHeight);
        entity.statCard.setSprite(statCardSprite);
        entity.updateStatCard();
        sprite.addChild(entity.statCard);
    }
}

/**
 * Clears the cache of shared card sprites.
 */
CardSystem.clearCache = function() {
    for(const spriteID in CardSystem.CARD_SPRITE_CACHE) {
        const sprite = CardSystem.CARD_SPRITE_CACHE[spriteID];

        sprite.terminate();
    }
}