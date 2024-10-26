import { AttackComponent } from "../components/attack.js";
import { HealthComponent } from "../components/health.js";
import { MoveComponent } from "../components/move.js";
import { SpriteComponent } from "../components/sprite.js";
import { TeamComponent } from "../components/team.js";
import { ImageSheet } from "../source/graphics/imageSheet.js";
import { clampValue } from "../source/math/math.js";
import { ConstructionComponent } from "../components/construction.js";
import { PositionComponent } from "../components/position.js";
import { tileToPosition_center } from "../source/camera/helpers.js";
import { DirectionComponent } from "../components/direction.js";
import { SizeComponent } from "../components/size.js";
import { ControllerComponent } from "../components/controller.js";

export const componentSetup = {};

//TODO: stats has to be determined by the game context. in the gameConfig, make a stats setting based on game mode
//"stats": -> { versus, story } whatever game mode is played, the stats will be used.

componentSetup.setupControllerComponent = function() {
    const controllerComponent = new ControllerComponent();

    return controllerComponent;
}

componentSetup.setupDirectionComponent = function() {
    const directionComponent = new DirectionComponent();

    return directionComponent;
}

componentSetup.setupSizeComponent = function(type) {
    const sizeComponent = new SizeComponent();
    const { dimX, dimY } = type;

    sizeComponent.sizeX = dimX;
    sizeComponent.sizeY = dimY;

    return sizeComponent;
}

componentSetup.setupPositionComponent = function(setup) {
    const positionComponent = new PositionComponent();
    const { tileX, tileY } = setup;
    const { x, y } = tileToPosition_center(tileX, tileY);

    positionComponent.positionX = x;
    positionComponent.positionY = y;
    positionComponent.tileX = tileX;
    positionComponent.tileY = tileY;

    return positionComponent;
}

componentSetup.setupSpriteComponent = function(sprite) {
    const spriteComponent = new SpriteComponent();

    spriteComponent.spriteID = sprite.id;
    spriteComponent.spriteType = sprite.typeID;
    spriteComponent.animationType = ImageSheet.DEFAULT_ANIMATION_ID;
    
    return spriteComponent;
}

componentSetup.setupConstructionComponent = function(entitySetup, typeConfig) {
    const constructionComponent = new ConstructionComponent();

    constructionComponent.stepsRequired = typeConfig["constructionSteps"];
    constructionComponent.stepsCompleted = 0; //TODO add saving/reloading method that handles components!
    //get stepsCompleted from entitySetup!

    return constructionComponent;
}

componentSetup.setupTeamComponent = function(setup) {
    const teamComponent = new TeamComponent();

    if(setup.team !== undefined) {
        teamComponent.teamID = setup.team;
    }
    
    if(setup.master !== undefined) {
        teamComponent.masterID = setup.master;
    }

    return teamComponent;
}

componentSetup.setupMoveComponent = function(type, stats) {
    const moveComponent = new MoveComponent();

    if(type.passability !== undefined) {
        for(const passabilityID of type.passability) {
            moveComponent.passability[passabilityID] = true;
        }
    }

    moveComponent.range = stats.moveRange;

    return moveComponent;
}

componentSetup.setupAttackComponent = function(type, stats) {
    const attackComponent = new AttackComponent();

    attackComponent.damage = stats.damage;
    attackComponent.range = stats.attackRange;

    return attackComponent;
}

componentSetup.setupHealthComponent = function(type, stats) {
    const healthComponent = new HealthComponent();

    healthComponent.health = stats.health;
    healthComponent.maxHealth = stats.health;

    healthComponent.health = clampValue(healthComponent.health, healthComponent.maxHealth, 1); //prevents spawning with 0 health
    
    return healthComponent;
}