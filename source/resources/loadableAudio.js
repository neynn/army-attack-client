export const LoadableAudio = function(path) {
    this.path = path
    this.state = LoadableAudio.STATE.EMPTY
}

LoadableAudio.STATE = {
    EMPTY: 0,
    LOADING: 1,
    LOADED: 2
};