/*
 Receives a request from an Azure DevOps release gate task.  The request payload must contain the required
 parameters for other steps to make basic callbacks to update the Azure DevOps release gate status. The 
 payload must be in JSON format and follow the example below. You could use the Azure DevOps
 "Invoke REST API" task with the example payload.
 
 Required payload parameters:
 - hub name (host type)
 - organization name
 - project ID
 - plan ID
 - job ID
 - task ID
 - callback authentication token
 - timeline ID (this is required because ADO polls release gates.This is the only parameters that is static.)
 
 Optional payload parameters:
 - project Name
 - pipeline Name
 - job nzame
 - build ID
 - build Number
 - reason
 - queued By
 - repository Name
 - branch
 - commit
 - commit Message
 - stage Name

Example payload from Azure DevOps:

{
    "PlanUrl": "$(system.CollectionUri)",
    "ProjectId": "$(system.TeamProjectId)",
    "ProjectName": "$(system.TeamProject)",
    "HubName": "$(system.HostType)",
    "PlanId": "$(system.PlanId)",
    "JobId": "$(system.JobId)",
    "TimelineId": "$(system.TimelineId)",
    "TaskInstanceId": "$(system.TaskInstanceId)",
    "AuthToken": "$(system.AccessToken)",
    "BuildId": "$(build.BuildId)",
    "BuildNumber": "$(Build.BuildNumber)",
    "PipelineName": "$(build.DefinitionName)",
    "RepoName": "$(build.Repository.Name)",
    "Branch": "$(Build.SourceBranchName)",
    "Commit": "$(build.SourceVersion)",
    "DefinitionName": "$(build.DefinitionName)",
    "RepositoryName": "$(build.Repository.Name)",
    "RepositoryProvider": "$(build.Repository.Provider)",
    "RequestedFor": "$(build.RequestedFor)",
    "SourceBranch": "$(build.SourceBranch)",
    "SourceBranchName": "$(build.SourceBranchName)",
    "SourceVersion": "$(build.SourceVersion)",
    "xmSubject": "Your Subject",
    "xmMessage": "Your Message",
    "xmRecipients": "user1,group2,user3,group4"
}
*/

payload = JSON.parse(request.body);

//Check if this is an Azure DevOps release gate task
if (payload['HubName'] != 'gates'){
    throw 'Invalid request type. Must be an Azure DevOps release gate task request with properly formatted payload.';
}

/*
* Parameters required for a basic callback in another Azure DevOps build task step
*/
//Get Azure DevOps organization name from the callback URL
re = new RegExp('(?<=^https:\/\/vsrm.dev.azure.com/).+?(?=\/)', 'gs');
organization = payload['PlanUrl'].match(re);
output['organization'] = organization[0];

output['projectID'] = payload['ProjectId'];
output['planID'] = payload['PlanId'];
output['jobID'] = payload['JobId'];
output['taskID'] = payload['TaskInstanceId'];
output['callbackAuthToken'] = payload['AuthToken'];

//This is the only common value between ADO release gate polls
output['timelineID'] = payload['TimelineId'];

/*
* Additional parameters that can be passed to other steps
*/

output['projectName'] = payload['ProjectName'];
output['recipients'] = payload['xmRecipients'];
output['messageSubject'] = payload['xmSubject'];
output['message'] = payload['xmMessage'];



