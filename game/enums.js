export const CLIENT_EVENTS = {
    INSTANCE_TEAM: 0,
    INSTANCE_ENTITY_BATCH: 1,
    INSTANCE_MAP: 2,
    INSTANCE_MAP_FROM_DATA: 3,
    INSTANCE_ACTOR: 4,
    ACTION: 5,
    EVENT: 6
};

export const EVENT_TYPES = {
    CLIENT: "Client",
    COUNTER: "Counter",
    CONTROL: "Control",
    RESOURCES_CONSUME: "ResourcesConsume",
    ITEMS_CONSUME: "ItemsConsume",
    ITEMS_OWN: "ItemsOwn",
    MILESTONE: "Milestone"
};

export const ACTION_TYPES = {
    MOVE: "Move",
    ATTACK: "Attack",
    CONSTRUCTION: "Construction",
    COUNTER_ATTACK: "CounterAttack",
    COUNTER_MOVE: "CounterMove",
    DEATH: "Death",
    FIRE_MISSION: "FireMission"
};

export const GAME_EVENT = {
    DROP_HIT_ITEMS: 0,
    DROP_KILL_ITEMS: 1,
    CHOICE_MADE: 2,
    SKIP_TURN: 3
};