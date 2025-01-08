export const Logger = {
    successfulLogs: 0,
    failedLogs: 0,
    logs: [],
    log: function(isSuccess, reason, script, attachments) {},
    warn: function(isSuccess, reason, script, attachments) {},
    error: function(isSuccess, reason, script, attachments) {},
    clear: function() {},
    exportLogs: function() {}
}

Logger.SHOW_LOGS = false;

Logger.log = function(isSuccess, reason, script, attachments) {
    const logEntry = {
        "success": isSuccess,
        "reason": reason,
        "script": script,
        "attachments": attachments
    }

    if(!isSuccess) {
        logEntry.timestamp = new Date().toISOString();
        Logger.failedLogs++;
        Logger.logs.push(logEntry);
        if(Logger.SHOW_LOGS) {
            console.log(logEntry);
        }
    } else {
        Logger.successfulLogs++;
    }

    return logEntry;
}

Logger.warn = function(isSuccess, reason, script, attachments) {
    const logEntry = {
        "success": isSuccess,
        "reason": reason,
        "script": script,
        "attachments": attachments
    }

    if(!isSuccess) {
        logEntry.timestamp = new Date().toISOString();
        Logger.failedLogs++;
        Logger.logs.push(logEntry);
        if(Logger.SHOW_LOGS) {
            console.warn(logEntry);
        }
    } else {
        Logger.successfulLogs++;
    }

    return logEntry;
}

Logger.error = function(isSuccess, reason, script, attachments) {
    const logEntry = {
        "success": isSuccess,
        "reason": reason,
        "script": script,
        "attachments": attachments
    }

    if(!isSuccess) {
        logEntry.timestamp = new Date().toISOString();
        Logger.failedLogs++;
        Logger.logs.push(logEntry);
        if(Logger.SHOW_LOGS) {
            console.error(logEntry);
        }
    } else {
        Logger.successfulLogs++;
    }

    return logEntry;
}

Logger.clear = function() {
    Logger.successfulLogs = 0;
    Logger.failedLogs = 0;
    Logger.logs = [];
}

Logger.exportLogs = function() {
    return JSON.stringify(Logger.logs, null, 4);
}