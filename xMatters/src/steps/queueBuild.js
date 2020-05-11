const organization = input['organization'];
const projectName = input['project'];
const pipelineName = input['pipeline'];
const endpoint = 'Azure DevOps';

function getPipelineID(organization, projectName, pipelineName) {

    var pipelineID = null;
    var apiRequest = null;
    var apiResponse = null;

    try {
        var URLPath = encodeURI('/' + organization + '/' + projectName + '/_apis/build/definitions?name=' + pipelineName + '&api-version=5.1');

        apiRequest = http.request({
            'endpoint': endpoint,
            'path': URLPath,
            'method': 'GET',
            'headers': {
                'Content-Type': 'application/json'
            }
        });
    } catch (e) {
        console.log('ERROR:Issue setting up request for pipeline ID');
        throw e;
    }

    try {
        apiResponse = apiRequest.write();
    } catch (e) {
        console.log('ERROR:Issue requesting pipeline ID');
        throw e;
    }

    if (apiResponse.statusCode == 200) {
        console.log(apiResponse.body);
        try {
            payload = JSON.parse(apiResponse.body);
        
            var pipelines = payload.value;

            if (payload.count == 1) {
                console.log('INFO:Found ID ' + pipelines[0].id + ' for pipeline ' + pipelineName);
                pipelineID = pipelines[0].id;
            } else if (payload.count > 1) {
                throw 'More than one matching pipelines with name ' + projectName;
            } else {
                throw 'No matching pipelines with name ' + projectName;
            }
        } catch (e) {
            console.log('ERROR:Issue evaluating response');
            throw e;
        }
    } else {
        console.log('ERROR: Received bad response when getting project ID for ' + projectName);
        console.log('Response Status Code: ' + apiResponse.statusCode);
        throw apiResponse.body;
    }

    return pipelineID;

}

function triggerBuild(organization, projectName, pipelineID) {
    console.log('INFO:Starting build');
    var apiRequest = null;
    var apiResponse = null;
    var payload = null;
    var body = null;

    try {
        var URLPath = encodeURI('/' + organization + '/' + projectName + '/_apis/build/builds?api-version=5.1');

        apiRequest = http.request({
            'endpoint': endpoint,
            'path': URLPath,
            'method': 'POST',
            'headers': {
                'Content-Type': 'application/json'
            }
        });

        body = {
            "definition": {
                "id": pipelineID
            }
        };
    } catch (e) {
        console.log('ERROR:Issue setting up request for new build');
        throw e;
    }

    try {
        apiResponse = apiRequest.write(body);
        
        if (apiResponse.statusCode != 200) {
            console.log('ERROR:Received bad response when triggering build');
            console.log('Response Status Code: ' + apiResponse.statusCode);
            throw apiResponse.body;
        }
    } catch (e) {
        console.log('ERROR:Issue triggering build');
        throw e;
    }
    
    return apiResponse;
}

console.log('INFO:Getting ID for pipeline "' + pipelineName + '"');
var pipelineID = getPipelineID(organization, projectName, pipelineName);

if (pipelineID !== null) {
    console.log('INFO:Triggering build for ' + pipelineName);
    var response = triggerBuild(organization, projectName, pipelineID);

    var buildInfo = JSON.parse(response.body);

    output['responseCode'] = response.statusCode;
    output['buildId'] = buildInfo.id;
    output['BuildNumber'] = buildInfo.buildNumber;
}
