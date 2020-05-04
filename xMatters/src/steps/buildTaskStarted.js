/**
 * This step can be used in conjuction with the buildTask trigger to update Azure DevOps that the
 * requested task has been started by xMatters.
 */

var base64 = require('base64').base64;

const organization = input['organization'];
const projectID = input['projectID'];
const planID = input['planID'];
const jobID = input['jobID'];
const taskID = input['taskID'];
const authToken = input['authToken'];

var URLPath = '/' + organization + '/' + projectID + '/_apis/distributedtask/hubs/build/plans/' + planID + '/events?api-version=2.0-preview.1';
var authProperty = 'Basic ' + base64.encode(":" + authToken);

var apiRequest = http.request({
    'endpoint': 'Azure DevOps',
    'path': URLPath,
    'method': 'POST',
    'headers': {
        'Content-Type': 'application/json',
        'Authorization': authProperty
    }
});

body =  { name: "TaskStarted", taskId: taskID, jobId: jobID };

var apiResponse = apiRequest.write(body);
output['responseCode'] = apiResponse.statusCode;

if (apiResponse.statusCode > 299) {
    consol.log("");
    console.log("ERROR: Unable to update the Azure DevOps build task status.")
    console.log("ERROR: Azure DevOps returned a bad response.");
    console.log("ERROR: Verify that the correct Azure DevOps organization, projectID, planID, jobID, taskID, and auth token were provided.")
    throw 'Azure DevOps returned a bad response.'
}
