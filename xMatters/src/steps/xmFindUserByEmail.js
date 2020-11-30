/**
 * Finds an xMatters user by email address. Returns thier xMatters User ID and Target Name.
 */

if (input['List of Emails'] !== null && input['List of Emails'] != ""){
    
    var emailList = input['List of Emails'].trim().split(',');
    
    var userIds = '';
    var targetNames = '';
    var totalUsers = 0;
    var noMatches = 'Found All';
    var noMatchCount = 0;
    
    for (var email in emailList) {
        
        var getUserRequest = http.request({
          endpoint: 'xMatters',
          method: 'GET',
          path: '/api/xm/1/people?emailAddress=' + emailList[email].trim()
        });
        
        var response = getUserRequest.write();
        var respBody;
        var cannotParseMsg = 'Unable to parse response body: ';
        
        if (response.statusCode >= 200 && response.statusCode < 300) {
          try {
            respBody = JSON.parse(response.body);
          } catch (e) {
            throw new Error(cannotParseMsg + response.body);
          }
          if (respBody) {
            if (respBody.count != undefined && respBody.count > 0) {
                if (email == 0) {
                    userIds = respBody.data[0].id;
                    targetNames = respBody.data[0].targetName;
                } else {
                    userIds = userIds + ',' + respBody.data[0].id;
                    targetNames = targetNames + ',' + respBody.data[0].targetName;
                }
                totalUsers += 1;
            } else {
                if (noMatchCount == 0) {
                    noMatches = emailList[email];
                } else {
                    noMatches = noMatches + ',' + emailList[email];
                }
                noMatchCount += 1;
            }
          }
        } else {
          var error;
          var parseableRespBody = true;
          try {
            respBody = JSON.parse(response.body);
            error = respBody.message;
          } catch (e) {
            parseableRespBody = false;
            error = cannotParseMsg + response.body;
          }
          console.log(
            'Failed to retrieve a unique user based on the search criteria. '
            + (parseableRespBody ? 'xMatters API returned ' : '')
            + '[' + response.statusCode + '] '
            + (parseableRespBody ? 'and the following message: ' : '')
            + error
          );
        }
    }
    
    output['User IDs'] = userIds;
    output['User Target Names'] = targetNames;
    output['Total User Count'] = totalUsers;
    output['No Matching User'] = noMatches;

} else {
    output['User IDs'] = "";
    output['User Target Names'] = "";
    output['Total User Count'] = 0;
    output['No Matching User'] = "";
}
  