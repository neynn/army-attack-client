export const BufferableAudio = function(path) {
    this.path = path
    this.state = BufferableAudio.STATE.EMPTY
}

BufferableAudio.STATE = {
    EMPTY: 0,
    LOADING: 1,
    LOADED: 2
};