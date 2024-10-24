export const response = function(isSuccess, reason, script, responses, attachments) {
    const answer = {
        "response": isSuccess,
        "reason": reason,
        "script": script,
        "chain": responses,
        "attachments": attachments
    }
    
    if(!isSuccess) {
        console.log(answer);
    }    

    return answer;
}