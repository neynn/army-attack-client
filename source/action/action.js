/**
 * Interface Action
 */
export const Action = function() {}

/**
 * Gets called after onEnd to clear state
 * 
 * @returns {void} 
 */
Action.prototype.onClear = function() {}

/**
 * Gets called at the start.
 * 
 * @param {*} gameContext 
 * @param {*} request 
 * @returns {void} 
 */
Action.prototype.onStart = function(gameContext, request) {}

/**
 * Gets called at after onUpdate return true.
 * 
 * @param {*} gameContext 
 * @param {*} request
 * @returns {void} 
 */
Action.prototype.onEnd = function(gameContext, request) {}

/**
 * Gets called every frame. Action ends on true and continues on false.
 * 
 * @param {*} gameContext 
 * @param {*} request 
 * @returns {boolean}
 */
Action.prototype.onUpdate = function(gameContext, request) {}

/**
 * Gets called before processing. Action is processed if true and discarded if false.
 * 
 * @param {*} gameContext 
 * @param {*} request 
 * @returns {boolean}
 */
Action.prototype.validate = function(gameContext, request) {}