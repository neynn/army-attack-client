export const PathHandler = function() {}

PathHandler.getPath = function(directory, source) {
    return `${directory}/${source}`;
}