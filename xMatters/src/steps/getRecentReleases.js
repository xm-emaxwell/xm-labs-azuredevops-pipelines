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

if (releaseDefId != 'Invalid') {
    getReleases(organization, project, releaseDefId, daysBack);
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
            output['HTML Table'] = "Organization <b>" + organization + "</b> not found. Unable to get recent releases.";
            output['Slack Message'] = "Organization *" + organization + "* not found. Unable to get recent releases.";
            output['Slack Attachment'] = JSON.stringify([]);
            return 'Invalid';
        } else {
            let payload = JSON.parse(apiResponse.body);
            if (payload.typeKey == 'ProjectDoesNotExistWithNameException') {
                output['HTML Table'] = "Project <b>" + project + "</b> not found in organization <b>" + organization + "</b>. Unable to get recent releases.";
                output['Slack Message'] = "Project *" + project + "* not found in organization *" + organization + "*. Unable to get recent releases.";
                output['Slack Attachment'] = JSON.stringify([]);
                return 'Invalid';
            }
        }
    } else {
        console.log('Unable to find matching Release');
        output['HTML Table'] = "Unable to get recent releases. Organization: <b>" + organization + "</b><br>Project: <b>" + project + "</b><br>Pipeline: <b>" + pipeline + "</b>";
        output['Slack Message'] = "Unable to get recent releases.\nOrganization: *" + organization + "*\nProject: *" + project + "*\nPipeline: *" + pipeline + "*";
        output['Slack Attachment'] = JSON.stringify([]);
        return 'Invalid';
    }
}

function getReleases(organization, project, releaseDefId, daysBack) {

    maxDate = new Date;
    minDate = new Date(maxDate);
    minDate.setDate(minDate.getDate() - (daysBack + 1));

    console.log('minDate: ' + minDate.toISOString());
    console.log('maxDate: ' + maxDate.toISOString());

    var path = '/' + encodeURIComponent(organization) + '/' + encodeURIComponent(project) + '/_apis/release/releases?api-version=6.1-preview.8&minCreatedTime=' + encodeURIComponent(minDate.toISOString());
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

    let releasesHTML = "";
    let blocks = [];


    if (apiResponse.statusCode >= 200 || apiResponse.statusCode < 300) {
        let payload = JSON.parse(apiResponse.body);

        if (releaseDefId && pipeline) {
            releasesHTML = "Found <b>" + payload.count + " releases</b> in the last <b>" + daysBack + " days</b> for pipeline <b>" + pipeline + "</b><br>";
            output['Slack Message'] = "Found *" + payload.count + " releases* in the last *" + daysBack + " days* for pipeline *" + pipeline + "*";
        } else if (!pipeline) {
            releasesHTML = "No pipeline supplied. Found <b>" + payload.count + " releases</b> in the last <b>" + daysBack + " days</b> for all pipelines in project <b>" + project + "</b><br>";
            output['Slack Message'] = "No pipeline supplied. Found *" + payload.count + " releases* in the last *" + daysBack + " days* for all pipelines in project *" + project + "*";
        } else if (!releaseDefId && pipeline) {
            releasesHTML = "Invalid pipeline name <b>" + pipeline + "</b>. Found <b>" + payload.count + " releases</b> in the last <b>" + daysBack + " days</b> for all pipelines in project <b>" + project + "</b><br>";
            output['Slack Message'] = "Invalid pipeline name *" + pipeline + "*. Found *" + payload.count + " releases* in the last *" + daysBack + " days* for all pipelines in project *" + project + "*";
        }

        releasesHTML += "<table><tr><th>ID</th><th>Pipeline</th><th>Name</th><th>Status</th><th>Created</th></tr>";

        for (release of payload.value) {
            let releaseId = release.id;
            let releaseURL = release._links.web.href;
            let releaseName = release.name;
            let releaseStatus = release.status;
            let createdOn = release.createdOn;
            let pipeline = release.releaseDefinition.name;
            let pipelineURL = release.releaseDefinition._links.web.href;
            releasesHTML += "<tr><td><a href='"+ releaseURL +"'>" + releaseId + "</a></td><td><a href='" + pipelineURL + "'>" + pipeline + "</a></td><td><a href='" + releaseURL + "'>" + releaseName + "</a></td><td>" + releaseStatus + "</td><td>" + createdOn + "</td></tr>";
            blocks.push({
                "type": "divider"
            });
            blocks.push({
                "type": "section",
                "text": {
                    "type": "mrkdwn",
                    "text": "Release ID: *<"+ releaseURL +"|" + releaseId + ">*\nPipeline: *<" + pipelineURL + "|" + pipeline + ">*\nName: *<" + releaseURL + "|" + releaseName + ">*\nStatus: *" + releaseStatus + "*\nCreated On: *" + createdOn + "*"
                }
            });
        }
    } else {
        console.log('Unable to find matching Releases');
        releasesHTML = "Found <b>0 releases</b> in the last <b>" + daysBack + " days</b> for pipeline <b>" + pipeline + "</b><br>";
        output['Slack Message'] = "Found *0 releases* in the last *" + daysBack + " days* for pipeline *" + pipeline + "*";
    }

    releasesHTML += "</table>";
    
    let slackAttachment = [{
        "blocks": blocks
    }];

    output['HTML Table'] = releasesHTML;
    output['Slack Attachment'] = JSON.stringify(slackAttachment);
}