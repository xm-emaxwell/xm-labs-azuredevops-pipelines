/*
 Receives a request from an Azure DevOps build task.  The request payload must contain the required
 parameters for other steps to make basic callbacks to update the Azure DevOps task status. The 
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
 
 Optional payload parameters:
 - timeline ID
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
    "JobName": "$(system.JobDisplayName)",
    "TimelineId": "$(system.TimelineId)",
    "TaskInstanceId": "$(system.TaskInstanceId)",
    "AuthToken": "$(system.AccessToken)",
    "BuildId": "$(build.BuildId)",
    "BuildNumber": "$(Build.BuildNumber)",
    "PipelineName": "$(build.DefinitionName)",
    "QueuedBy": "$(build.QueuedBy)",
    "Reason": "$(build.Reason)",
    "RepoName": "$(build.Repository.Name)",
    "Branch": "$(Build.SourceBranchName)",
    "Commit": "$(build.SourceVersion)",
    "CommitMessage": "$(build.SourceVersionMessage)",
    "StageName": "$(system.StageDisplayName)",
    "xmSubject": "Your message subject",
    "xmMessage": "Your message",
    "xmRecipients": "user1,group2,user3,group4"
}
*/

payload = JSON.parse(request.body);

//Check if this is an Azure DevOps build task
if (payload['HubName'] != 'build'){
    throw 'Invalid request type. Must be an Azure DevOps build task request with properly formatted payload.';
}

/*
* Parameters required for a basic callback in another Azure DevOps build task step
*/
//Get Azure DevOps organization name from the callback URL
re = new RegExp('(?<=^https:\/\/dev.azure.com/).+?(?=\/)', 'gs');
organization = payload['PlanUrl'].match(re);
output['organization'] = organization[0];

output['projectID'] = payload['ProjectId'];
output['planID'] = payload['PlanId'];
output['jobID'] = payload['JobId'];
output['taskID'] = payload['TaskInstanceId'];
output['authToken'] = payload['AuthToken'];

/*
* Additional parameters that can be passed to other steps
*/
output['timelineID'] = payload['TimelineId'];
output['projectName'] = payload['ProjectName'];
output['pipelineName'] = payload['PipelineName'];
output['jobName'] = payload['JobName'];
output['buildID'] = payload['BuildId'];
output['buildNumber'] = payload['BuildNumber'];
output['reason'] = payload['Reason'];
output['queuedBy'] = payload['QueuedBy'];
output['repoName'] = payload['RepoName'];
output['branch'] = payload['Branch'];
output['commit'] = payload['Commit'];
output['commitMessage'] = payload['CommitMessage'];
output['stageName'] = payload['StageName'];
output['recipients'] = payload['xmRecipients'];
output['messageSubject'] = payload['xmSubject'];
output['message'] = payload['xmMessage'];

if (payload['Reason'] == 'PullRequest') {
    output['pullRequestId'] = payload['PullRequestId'];
    output['pullRequestNumber'] = payload['PullRequestNumber'];
    output['pullRequestSource'] = payload['PullRequestSource'];
    output['pullRequestTarget'] = payload['PullRequestTarget'];
} else {
    output['pullRequestId'] = "";
    output['pullRequestNumber'] = "";
    output['pullRequestSource'] = "";
    output['pullRequestTarget'] = "";
}