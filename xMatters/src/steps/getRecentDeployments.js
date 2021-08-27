const organization = input['Organization Name'];
const project = input['Project Name'];
var pipeline = input['Pipeline Name'];

var daysBack = 7;
if (input['Days Back']) {
    daysBack = parseInt(input['Days Back']) || 7;
}

var releaseDefId = '';
if (pipeline) {
    releaseDefId = getReleaseDefId(organization, project, pipeline);
}

console.log('Release Def ID: ' + releaseDefId);

if (releaseDefId != 'Invalid') {
    console.log('Getting Deployments');
    getDeployments(organization, project, releaseDefId, daysBack);
}

function getReleaseDefId(organization, project, pipeline) {
    let apiRequest = http.request({
        'endpoint': 'Azure DevOps - Release Management',
        'path': '/' + organization + '/' + project + '/_apis/release/definitions?api-version=6.0&searchText=' + pipeline + '&isExactNameMatch=true',
        'method': 'GET',
        'headers': {
            'Content-Type': 'application/json'
        }
    });

    let apiResponse = apiRequest.write();

    if (apiResponse.statusCode >= 200 && apiResponse.statusCode < 300) {
        let payload = JSON.parse(apiResponse.body);

        if (payload.count && payload.count == 1) {
            return payload.value[0].id;
        } else {
            console.log('Unable to find matching Pipeline');
            return '';
        }
    } else if (apiResponse.statusCode == 404) {
        if (apiResponse['body'].includes('The resource cannot be found.')) {
            output['HTML Table'] = "Organization <b>" + organization + "</b> not found. Unable to get recent deployments.";
            output['Slack Message'] = "Organization *" + organization + "* not found. Unable to get recent deployments.";
            output['Slack Attachment'] = JSON.stringify([]);
            return 'Invalid';
        } else {
            let payload = JSON.parse(apiResponse.body);
            if (payload.typeKey == 'ProjectDoesNotExistWithNameException') {
                output['HTML Table'] = "Project <b>" + project + "</b> not found in organization <b>"+ organization +"</b>. Unable to get recent deployments.";
                output['Slack Message'] = "Project *" + project + "* not found in organization *"+ organization +"*. Unable to get recent deployments.";
                output['Slack Attachment'] = JSON.stringify([]);
                return 'Invalid';
            }
        }
    } else {
        console.log('Unable to find matching Pipeline');
        output['HTML Table'] = "Unable to get recent deployments. Organization: <b>"+ organization +"</b><br>Project: <b>" + project + "</b><br>Pipeline: <b>"+ pipeline +"</b>";
        output['Slack Message'] = "Unable to get recent deployments.\nOrganization: *"+ organization +"*\nProject: *" + project + "*\nPipeline: *"+ pipeline +"*";
        output['Slack Attachment'] = JSON.stringify([]);
        return 'Invalid';
    }
}

function getDeployments(organization, project, releaseDefId, daysBack) {

    maxDate = new Date;
    minDate = new Date(maxDate);
    minDate.setDate(minDate.getDate() - (daysBack + 1));

    console.log('minDate: ' + minDate.toISOString());
    console.log('maxDate: ' + maxDate.toISOString());

    var path = '/' + encodeURIComponent(organization) + '/' + encodeURIComponent(project) + '/_apis/release/deployments?api-version=6.1-preview.2&minStartedTime=' + encodeURIComponent(minDate.toISOString());
    if (releaseDefId) {
        path += '&definitionId=' + releaseDefId;
    }

    let apiRequest = http.request({
        'endpoint': 'Azure DevOps - Release Management',
        'path': path,
        'method': 'GET',
        'headers': {
            'Content-Type': 'application/json'
        }
    });

    let apiResponse = apiRequest.write();

    let deploymentsHTML = "";
    let blocks = [];

    if (apiResponse.statusCode >= 200 || apiResponse.statusCode < 300) {
        let payload = JSON.parse(apiResponse.body);

        if (releaseDefId && pipeline) {
            deploymentsHTML = "Found <b>" + payload.count + " deployments</b> in the last <b>" + daysBack + " days</b> for pipeline <b>" + pipeline + "</b><br>";
            output['Slack Message'] = "Found *" + payload.count + " deployments* in the last *" + daysBack + " days* for pipeline *" + pipeline + "*";
        } else if (!pipeline) {
            deploymentsHTML = "No pipeline supplied. Found <b>" + payload.count + " deployments</b> in the last <b>" + daysBack + " days</b> for all pipelines in project <b>" + project + "</b><br>";
            output['Slack Message'] = "No pipeline supplied. Found *" + payload.count + " deployments* in the last *" + daysBack + " days* for all pipelines in project *" + project + "*";
        } else if (!releaseDefId && pipeline) {
            deploymentsHTML = "Invalid pipeline name <b>" + pipeline + "</b>. Found <b>" + payload.count + " deployments</b> in the last <b>" + daysBack + " days</b> for all pipelines in project <b>" + project + "</b><br>";
            output['Slack Message'] = "Invalid pipeline name *" + pipeline + "*. Found *" + payload.count + " deployments* in the last *" + daysBack + " days* for all pipelines in project *" + project + "*";
        }
        
        deploymentsHTML += "<table><tr><th>ID</th><th>Pipeline</th><th>Release</th><th>Build</th><th>Branch</th><th>Queued on</th></tr>";

        for (deployment of payload.value) {
            let deploymentURL = "https://dev.azure.com/" + encodeURIComponent(organization) + "/" + encodeURIComponent(project) + "/_release?definitionId=" + releaseDefId + "&_a=deployments";
            let deploymentID = deployment.id;
            let deploymentStage = deployment.releaseEnvironment.name;
            let releaseName = deployment.release.name;
            let releaseURL = deployment.release._links.web.href;
            let build = deployment.release.artifacts[0].definitionReference.version.name;
            let buildURL = deployment.release.artifacts[0].definitionReference.artifactSourceVersionUrl.id;
            let branch = deployment.release.artifacts[0].definitionReference.branches.name;
            let queuedOn = deployment.queuedOn;
            let pipeline = deployment.releaseDefinition.name;
            let pipelineURL = deployment.releaseDefinition._links.web.href;
            deploymentsHTML += "<tr><td><a href='" + deploymentURL + "'>" + deploymentID + "</a></td><td><a href='" + pipelineURL + "'>" + pipeline + "</a></td><td><a href='" + releaseURL + "'>" + releaseName + "</a></td><td><a href='" + buildURL + "'>" + build + "</a></td><td>" + branch + "</td><td>" + queuedOn + "</td></tr>";
            blocks.push({
                "type": "divider"
            });
            blocks.push({
                "type": "section",
                "text": {
                    "type": "mrkdwn",
                    "text": "Deployment ID: *<" + deploymentURL + "|" + deploymentID + ">*\nPipeline: *<" + pipelineURL + "|" + pipeline + ">*\nRelease: *<" + releaseURL + "|" + releaseName + ">*\nBuild: *<" + buildURL + "|" + build + ">*\nBranch: *" + branch + "*\nQueued On: *" + queuedOn + "*"
                }
            });
        }
    } else {
        console.log('Unable to find matching Deployments');
        deploymentsHTML = "Found <b>0 deployments</b> in the last <b>" + daysBack + " days</b> for pipeline <b>" + pipeline + "</b><br>";
        output['Slack Message'] = "Found *0 deployments* in the last *" + daysBack + " days* for pipeline *" + pipeline + "*";
    }

    deploymentsHTML += "</table>";

    let slackAttachment = [{
        "blocks": blocks
    }];

    output['HTML Table'] = deploymentsHTML;
    output['Slack Attachment'] = JSON.stringify(slackAttachment);
}