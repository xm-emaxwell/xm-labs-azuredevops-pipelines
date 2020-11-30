/**
 * Updates Azure DevOps pipeline approval status.
 */

 //Release Approval URL will come from a Release Approval Notification to a Release Approval Notice trigger.
const approvalUrl = input['Release Approval URL'];
const comment = input['Comment'];

re = new RegExp('(?<=https:\/\/vsrm\.dev\.azure\.com)(.*)(?=$)', 'gs');

var URLPath = approvalUrl.match(re)[0];

var apiRequest = http.request({
    'endpoint': 'Azure DevOps - Release Management',
    'path': URLPath + '?api-version=5.1',
    'method': 'PATCH',
    'headers': {
        'Content-Type': 'application/json'
    }
});

//Status must be either approved or rejected
body =  {
  "status": input['Status'],
  "comments": input['Comment']
};

var apiResponse = apiRequest.write(body);
output['Response Code'] = apiResponse.statusCode;

if (apiResponse.statusCode < 200 || apiResponse.statusCode >= 300) {
    throw new Error('Error sending release approval status');
}