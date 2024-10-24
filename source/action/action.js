export const Action = function() {}

/**
 * 
 * @param {*} gameContext 
 * @param {*} request 
 * @returns {void} 
 */
Action.prototype.onStart = function(gameContext, request) {}

/**
 * 
 * @param {*} gameContext 
 * @param {*} request
 * @returns {void} 
 */
Action.prototype.onEnd = function(gameContext, request) {}

/**
 * 
 * @param {*} gameContext 
 * @param {*} request 
 * @returns {boolean}
 */
Action.prototype.onUpdate = function(gameContext, request) {
    return true;
}

/**
 * 
 * @param {*} gameContext 
 * @param {*} request 
 * @returns {boolean} 
 */
Action.prototype.validate = function(gameContext, request) {}