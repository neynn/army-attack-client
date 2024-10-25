export const GAME_EVENTS = Object.freeze({
    "INSTANCE_ENTITY": "INSTANCE_ENTITY",
    "INSTANCE_MAP": "INSTANCE_MAP",
    "INSTANCE_CONTROLLER": "INSTANCE_CONTROLLER",
    "ENTITY_ACTION": "ENTITY_ACTION",
    "CLIENT_MAP_LOADED": "CLIENT_MAP_LOADED"
});

export const ACTION_TYPES = Object.freeze({
    "MOVE": "MOVE",
    "ATTACK": "ATTACK"
});

export const CONTROLLER_STATES = Object.freeze({
    "IDLE": "IDLE",
    "BUILD": "BUILD",
    "ENTITY_SELECTED": "ENTITY_SELECTED"
});

export const CONTEXT_STATES = Object.freeze({
    "MAIN_MENU": "MAIN_MENU",
    "STORY_MODE": "STORY_MODE",
    "VERSUS_MODE": "VERSUS_MODE",
    "VERSUS_MODE_LOBBY": "VERSUS_MODE_LOBBY",
    "EDIT_MODE": "EDIT_MODE"
});

export const ENTITY_STATES = Object.freeze({
    "IDLE": "IDLE",
    "FIRE": "FIRE",
    "HIT": "HIT",
    "MOVE": "MOVE",
    "DOWN": "DOWN",
    "CONSTRUCTION": "CONSTRUCTION"
});

export const ENTITY_EVENTS = Object.freeze({
    "POSITION_UPDATE": Symbol("POSITION_UPDATE"),
    "DIRECTION_UPDATE": Symbol("DIRECTION_UPDATE"),
    "SPRITE_UPDATE": Symbol("SPRITE_UPDATE"),
    "STAT_UPDATE": Symbol("STAT_UPDATE")
});

export const CONTROLLER_EVENTS = Object.freeze({
    "CLICK": Symbol("CLICK"),
    "SELECT": Symbol("SELECT"),
    "POSITION_UPDATE": Symbol("POSITION_UPDATE")
});