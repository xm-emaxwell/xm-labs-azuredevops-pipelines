var apiRequest = http.request({
    'endpoint': 'xMatters',
    'path': '/api/xm/1/events/' + input['eventID'] + '?embed=properties,recipients,responseOptions,annotations,messages&targeted=true',
    'method': 'GET'
});
var apiResponse = apiRequest.write();

output['statusCode'] = apiResponse.statusCode;

if (apiResponse.statusCode == 200) {
    var responseThresholdsMet = 'TRUE';
    var otherRecipients = 0;
    var response = JSON.parse(apiResponse.body);
    output['eventId'] = response.eventId;
    output['status'] = response.status;
    output['recipients_total'] = response.recipients.total;
    output['otherResponseCountThreshold'] = response.otherResponseCountThreshold;
    output['otherResponseCount'] = response.otherResponseCount;

    if (typeof response.responseOptions !== 'undefined') {
        var responseOptions_array = [];
        for (var a in response.responseOptions.data) {
            responseOptions_array.push(response.responseOptions.data[a]);
        }
        output['responseOptions'] = responseOptions_array;
    }

    if (response.recipients != undefined && response.recipients.total > 0 ){
        for (target in response.recipients.data){
            if (response.recipients.data[target].responseCount != undefined ){
                console.log(response.recipients.data[target].targetName + ' = ' + response.recipients.data[target].responseCount + '/' + response.recipients.data[target].responseCountThreshold);
                if (response.recipients.data[target].responseCount < response.recipients.data[target].responseCountThreshold){
                    responseThresholdsMet = 'FALSE';
                }
            } else {
                otherRecipients += 1;
            }
        }
    }
    if (response.otherResponseCount != undefined && otherRecipients > 0) {
        console.log('Other Responses = ' + response.otherResponseCount + '/' + response.otherResponseCountThreshold);
        if (response.otherResponseCount < response.otherResponseCountThreshold) {
            responseThresholdsMet = 'FALSE';
        }
    }   

    output['responseThresholdsMet'] = responseThresholdsMet;

} else {
    throw 'Invalid response';
}