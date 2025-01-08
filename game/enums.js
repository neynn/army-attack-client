export const GAME_EVENTS = Object.freeze({
    "INSTANCE_TEAM": 0,
    "INSTANCE_ENTITY": 1,
    "INSTANCE_ENTITY_BATCH": 2,
    "INSTANCE_MAP": 3,
    "INSTANCE_MAP_FROM_DATA": 4,
    "INSTANCE_CONTROLLER": 5,
    "ACTION": 6,
    "ACTION_BATCH": 7
});

export const ACTION_TYPES = Object.freeze({
    "MOVE": "MOVE",
    "ATTACK": "ATTACK",
    "CONSTRUCTION": "CONSTRUCTION"
});

export const CONTROLLER_STATES = Object.freeze({
    "IDLE": "IDLE",
    "BUILD": "BUILD",
    "SELECTED": "SELECTED"
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

export const CONTROLLER_EVENTS = Object.freeze({
    "CLICK": "CLICK",
    "SELECT": "SELECT"
});

export const CAMERA_TYPES = Object.freeze({
    "ARMY_CAMERA": "ARMY_CAMERA"
});