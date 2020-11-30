try {
    payload = JSON.parse(request.body);
} catch (e) {
    throw new Error('Unable to parse response: ' + e.message);
}

output.eventType = payload.eventType;

if (payload.eventType == 'ms.vss-release.deployment-approval-pending-event') {
    try {
        console.log('Subscription ID: ' + payload.subscriptionId);
        console.log('Notification ID: ' + payload.notificationId);
        console.log('Notification GUID: ' + payload.id);
    } catch (e) {
        console.log('WARN: Issue getting notification info, but going to continue.');
        console.log(e.message);
    }

    try {
        re = new RegExp('(?<=^https:\/\/vsrm.dev.azure.com/).+?(?=\/)', 'gs');
        var organization = payload.resourceContainers.project['baseUrl'].match(re)[0];
        output.organization = organization;
        output.projectId = payload.resource.project.id;
        output.projectName = payload.resource.project.name;
    } catch (e) {
        console.log('WARN: Unable to get release Organization or Project, but going to continue.');
        console.log(e.message);
        var organization = 'unknown';
        output.organization = 'Unknown';
        output.projectId = 'Unknown';
        output.projectName = 'Unknown';
    }
    
    output.releaseDefinitionId = payload.resource.release.releaseDefinition.id;
    output.releaseDefinitionName = payload.resource.release.releaseDefinition.name;

    try {
        output.messageText = payload.message.text;
        output.messageHtml = payload.message.html;
        output.messageMarkdown = payload.message.markdown;
    } catch (e) {
        console.log('WARN: Unable to get notification message text. Using default text.');
        console.log(e.message);
        output.messageText = 'Release requires approval.';
        output.messageHtml = '<b>Release requires approval.</b>';
        output.messageMarkdown = '**Release requires approval.**';
    }

    try {
        output.releaseId = payload.resource.release.id;
        output.releaseName = payload.resource.release.name;
        output.releaseUrl = payload.resource.release._links.web.href;
        output.releaseDescription = payload.resource.release.description;
    } catch (e) {
        console.log('WARN: Unable to get release information, but going to continue.');
        console.log(e.message);
        output.releaseId = 'Unknown';
        output.releaseName = 'Unknown';
        output.releaseUrl = 'Unknown';
        output.releaseDescription = '';
    }
    output.approverId = payload.resource.approval.approver.id;
    if (payload.resource.approval.approver.isContainer == undefined) {
        output.approverName = payload.resource.approval.approver.displayName;
        output.approverUniqueName = payload.resource.approval.approver.uniqueName;
        output.isGroup = false;
    } else if (payload.resource.approval.approver.isContainer == true) {
        var displayName = payload.resource.approval.approver.displayName.split('\\');
        var groupName = displayName[displayName.length - 1];
        output.approverName = groupName;
        output.approverUniqueName = organization + '/' + groupName;
        output.isGroup = true;
    }

    output.approverDescriptor = payload.resource.approval.approver.descriptor;

    output.approvalId = payload.resource.approval.id;

    approvalFound = false;
    for (approval in payload.resource.release.environments[0].preDeployApprovals) {
        if (payload.resource.release.environments[0].preDeployApprovals[approval].id == payload.resource.approval.id) {
            output.approvalUrl = payload.resource.release.environments[0].preDeployApprovals[approval].url;
            approvalFound = true;
        }
    }
    for (approval in payload.resource.release.environments[0].postDeployApprovals) {
        if (payload.resource.release.environments[0].postDeployApprovals[approval].id == payload.resource.approval.id) {
            output.approvalUrl = payload.resource.release.environments[0].postDeployApprovals[approval].url;
            approvalFound = true;
        }
    }
    if (approvalFound == false) {
        throw new Error('Unable to find matching approval URL');
    }

    output.status = payload.resource.release.environments[0].status;
} else {
    throw new Error('Unexpected event type: Expecting "ms.vss-release.deployment-approval-pending-event" recieved "' + payload.eventType + '"');
}

