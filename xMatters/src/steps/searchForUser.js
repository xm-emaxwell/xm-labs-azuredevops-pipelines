/**
 * Finds an Azure DevOps user based on the provided search criteria.
 * Returns their Azure DevOps descriptor, display name, and email address.
 */

const organization = input['organization'];
const searchTerm = input['searchTerm'];
//Endpoint must use https://vssps.dev.azure.com as URL
const endpoint = 'Azure DevOps - Management';

function queryUser(organization, searchTerm) {
    console.log('INFO:Searching for user');
    var apiRequest = null;
    var apiResponse = null;
    var payload = null;
    var body = null;

    try {
        var URLPath = encodeURI('/' + organization + '/_apis/graph/subjectquery?api-version=6.0-preview.1');

        apiRequest = http.request({
            'endpoint': endpoint,
            'path': URLPath,
            'method': 'POST',
            'headers': {
                'Content-Type': 'application/json'
            }
        });

        body = {
                	"query": searchTerm,
                	"subjectKind": ["User"]
                };
    } catch (e) {
        console.log('ERROR:Issue setting up query');
        throw e;
    }

    try {
        apiResponse = apiRequest.write(body);
        
        if (apiResponse.statusCode != 200) {
            console.log('ERROR:Received bad response during user search');
            console.log('Response Status Code: ' + apiResponse.statusCode);
            throw apiResponse.body;
        }
    } catch (e) {
        console.log('ERROR:Issue finding user');
        throw e;
    }
    
    return apiResponse;
}

console.log('INFO:Searching for user user term "' + searchTerm + '"');

if (searchTerm !== null && searchTerm != "" && searchTerm !== undefined) {
    var response = queryUser(organization, searchTerm);

    var user = JSON.parse(response.body);
        
    if (user.count == 1) {
        output['descriptor'] = user.value[0].descriptor;
        output['displayName'] = user.value[0].displayName;
        output['email'] = user.value[0].mailAddress;
    } else if (user.count > 1) {
        throw new Error('More than one user matches search ' + searchTerm);
    } else if (user.count == 0) {
        throw new Error('No user matching search ' + searchTerm);
    } else {
        throw new Error('Unknown Error');
    }
} else {
    throw new Error('Must provide a search term');
}
