import { SpawnSystem } from "../systems/spawn.js";

export const instanceEntity = function(gameContext, payload) {
    SpawnSystem.createEntity(gameContext, payload);
}