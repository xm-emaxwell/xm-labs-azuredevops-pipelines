/**
 * This step can be used in conjuction with the releaseGate trigger to update Azure DevOps release gate 
 * with the desired result("succeeded" or "failed").
 */

var base64 = require('base64').base64;

const organization = input['organization'];
const projectID = input['projectID'];
const planID = input['planID'];
const jobID = input['jobID'];
const taskID = input['taskID'];
const authToken = input['authToken'];
const result = input['result'];

var URLPath = '/' + organization + '/' + projectID + '/_apis/distributedtask/hubs/gates/plans/' + planID + '/events?api-version=2.0-preview.1';
var authProperty = 'Basic ' + base64.encode(":" + authToken);

var apiRequest = http.request({
    'endpoint': 'Azure DevOps - Release Callback',
    'path': URLPath,
    'method': 'POST',
    'headers': {
        'Content-Type': 'application/json',
        'Authorization': authProperty
    }
});

body =  { name: "TaskCompleted", taskId: taskID, jobId: jobID, result: result };

var apiResponse = apiRequest.write(body);
output['Response Code'] = apiResponse.statusCode;
if(apiResponse.statusCode != 204) {
    throw 'ERROR:Invalid response from Azure DevOps';
}
