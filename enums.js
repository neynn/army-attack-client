export const GAME_EVENTS = Object.freeze({
    "INSTANCE_ENTITY": "INSTANCE_ENTITY",
    "INSTANCE_ENTITY_BATCH": "INSTANCE_ENTITY_BATCH",
    "INSTANCE_MAP": "INSTANCE_MAP",
    "INSTANCE_MAP_FROM_DATA": "INSTANCE_MAP_FROM_DATA",
    "INSTANCE_CONTROLLER": "INSTANCE_CONTROLLER",
    "ENTITY_ACTION": "ENTITY_ACTION",
    "ENTITY_DEATH": "ENTITY_DEATH",
    "DROP_ITEM": "DROP_ITEM"
});

export const ENTITY_ARCHETYPES = Object.freeze({
    "UNIT": "Unit",
    "DEFENSE": "Defense",
    "DECO": "Deco",
    "BUILDING": "Building",
    "CONSTRUCTION": "Construction",
    "HFE": "HFE",
    "TOWN": "Town"
});

export const CONTROLLER_TYPES = Object.freeze({
    "PLAYER": "PLAYER"
});

export const SYSTEM_TYPES = Object.freeze({
    "DOWN": "DOWN",
    "MOVE": "MOVE"
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
    "STORY_MODE_INTRO": "STORY_MODE_INTRO",
    "STORY_MODE_PLAY": "STORY_MODE_PLAY",
    "VERSUS_MODE": "VERSUS_MODE",
    "VERSUS_MODE_LOBBY": "VERSUS_MODE_LOBBY",
    "VERSUS_MODE_PLAY": "VERSUS_MODE_PLAY",
    "EDIT_MODE": "EDIT_MODE"
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