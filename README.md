# Azure DevOps - Pipelines
This is a two-way integration with Azure DevOps Pipelines that provides several different integrations. The first allows you to trigger a pipeline from xMatters. You can have Azure DevOps trigger xMatters from a pipeline task or release gate and use xMatters steps to update the task or gate status.  Finally you can configure Azure DevOps to use xMatters to send approval notifications and receive responses.

### :scroll: DISCLAIMER
<kbd>
  <img src="https://github.com/xmatters/xMatters-Labs/raw/master/media/disclaimer.png">
</kbd>

# Table of Contents
* [Prerequisites](#prerequisites)
* [Files](#files)
* [How it Works](#how-it-works)
* [Installation](#installation)
    * [xMatters - Setup Inbound Trigger](#xmatters---setup-inbound-trigger)
    * [Azure DevOps - Setup Credentials for xMatters](#azure-devops---setup-credentials-for-xmatters)
    * [Azure DevOps - Setup Service Connection](#azure-devops---setup-service-connection)
    * [Azure DevOps - Setup Pipeline Task](#azure-devops---setup-pipeline-task)
    * [Azure DevOps - Configure Release Gate](#azure-devops---configure-release-gate)
    * [Azure DevOps - Configure Release Approvals](#azure-devops---configure-release-approvals)
    * [xMatters - Configure Azure DevOps Endpoints](xmatters---configure-azure-devops-endpoints)
    * [xMatters - Configure Queue Build Flow](xmatters---configure-queue-build-flow)
* [Testing](#testing)
* [Expanding](#expanding)
* [Troubleshooting](#troubleshooting)

---
# Prerequisites
* Azure DevOps
    * Azure DevOps Services account
    * Permission to setup Service Connections
    * Permission to setup/modify pipelines and releases
* xMatters
    * Account - if you don't have one [get one](https://www.xmatters.com) for free
    * Permissions to create/edit Workflows

---
# Files
* xMatters
    * Workflows
        * [AzureDevOpsPipelines.zip](xMatters/workflows/AzureDevOpsPipelines.zip) - example workflow containing all the triggers and steps
    * Triggers
        * [buildTask.js](xMatters/src/triggers/buildTask.js) - source for trigger that recieves Azure DevOps pipeline task notifications
        * [releaseGate.js](xMatters/src/triggers/releaseGate.js) - source for trigger that recieves Azure DevOps release gate notifications
        * [releaseApprovalNotice.js](xMatters/src/triggers/releaseApprovalNotice.js) - source for trigger that recieves Azure DevOps release approval notices
    * Steps
        * [queueBuild.js](xMatters/src/steps/queueBuild.js) - source for step that can trigger an Azure DevOps pipeline
        * [buildTaskStarted.js](xMatters/src/steps/buildTaskStarted.js) - source for step to update that the Azure DevOps pipeline task has started
        * [buildTaskComplete.js](xMatters/src/steps/buildTaskComplete.js) - source for step to update that the Azure DevOps pipeline task has completed and its result
        * [updateReleaseGate.js](xMatters/src/steps/updateReleaseGate.js) - source for step to update the Azure DevOps release gate status
        * [checkResponseCount.js](xMatters/src/steps/checkResponseCounts.js) - source for step that checks if the notification response count meets the configured response threshold for an xMatters event. **Used in the release gate example**
        * [updateReleaseApprovalStatus.js](xMatters/src/steps/updateReleaseApprovalStatus.js) - source for step to update an Azure DevOps release approval status
        * [searchForUser.js](xMatters/src/steps/searchForUser.js) - source for step to search for an Azure DevOps user and get their descriptor, display name, and email address
        * [xmFindUserByEmail.js](xMatters/src/steps/xmFindUserByEmail.js) - source for step to search for an xMatters user by email address and return their username and target name.
    * Shared Libraries
        * [base64.js](xMatters/src/sharedLibs/base64.js) - source for library used by some of the steps to encode the callback authentication token
* Azure DevOps
    * [InvokeRESTAPI_taskPayload.json](AzureDevOps/src/InvokeRESTAPI_taskPayload.json) - body to use with the "Invoke REST API" pipeline task
    * [InvokeRESTAPI_gatePayload.json](AzureDevOps/src/InvokeRESTAPI_gatePayload.json) - body to use with the "Invoke REST API" gate task
    * [azure-pipelines.yml](AzureDevOps/src/azure-pipelines.yml) - an example pipeline yaml config that can be used to setup the demo
    * [xMatters Extension](AzureDevOps/src/xm-extension) - this is an example Azure DevOps extension you can build and install in your organization. The components can be used in place of the Generic service connection and Invoke REST API task/gate in the instructions.

---
# How It Works
#### :blue_book: NOTE
> You do not have to use all of these integrations, but all are contained with in this workflow.
### Start a Pipeline
You can use the ***Azure DevOps - Queue Build*** step to start the configured pipeline. The example flow is triggered by an xMatters event being created, but the trigger could be anything you like. For example if you use Azure DevOps for operational management if xMatters received a notification of an application issue your flow could trigger an Azure DevOps pipeline that restarts a service.

### Trigger xMatters from a Pipeline Task
Using the Azure DevOps Invoke REST API task to send a notification to the ***Azure DevOps - Build Task*** trigger we can start an xMatters flow. You can also configure the Azure DevOps Invoke REST API task to implement a callback and in this case you can use the ***Azure DevOps - Build Task Started*** and ***Azure DevOps - Build Task Completed*** steps to update the build task status.

#### :blue_book: NOTE
> * **Invoke REST API (ApiResponse)** - If you configure the Azure DevOps Invoke REST API task's *Completion event* for ApiResponse it will trigger the xMatters flow, but it will continue on a successful response from the request. Use this when you want to trigger xMatters but do not care the outcome of the xMatters flow. In this case if you use the *Build Task Started* and *Build Task Completed* steps in your flow they will fail because the task will not exist for the callback.
>
> * **Invoke REST API (Callback)** - [Examle uses this] If you configure the Azure DevOps Invoke REST API task's *Completion event* for Callback it will trigger the xMatters flow and wait for a callback containing the task status. Use this when you want the task status to reflect the xMatters flow outcome.

### Send Release Approval Notices to xMatters
Azure DevOps Service Hook sends Release deployment approval pending notifications to the ***Azure DevOps - Approval Notice** xMatter trigger, which xMatters then sends notifications to approvers (groups or individuals) via their configured xMatter devices and policies.  This allows for the notificaiton to follow scheduling and escalation policies.  It also allows for notifications to go out on multiple channels (email, sms, push, voice) and for the approver to respond directly from the notification.  There is a second step called ***Azure DevOps - Update Release Approval Status*** used to update Azure DevOps of the approver's response.

### Trigger xMatters from a Release Gate
Using the Azure DevOps Invoke REST API task as a release gate you can send a notification to the ***Azure DevOps - Release Gate***. In conjunction with the ***Azure DevOps - Update Release Gate*** step you can then update from your flow if the release gate succeeded or failed.

#### :blue_book: NOTE
> * Azure DevOps release gates use a polling mechanism to check the status of the gates. With each poll the callback information changes, so the flow must handle this and be able to respond with the correct callback information.
> * As Azure DevOps polls through the gates it is waiting for all to succeed. It will not continue on until all gates succeed, so if the workflow sends a fail to the gate the release pipeline will not move on but it will continue to run until the gate failure timeout is reached.  This is true for all gates.
> * In most cases when using the Invoke REST API task with a release gate you will want to configure its *Completion event* to Callback or the gate will pass on successful reponse from the trigger request to xMatters. It will not wait for the xMatters flow to update the gate status.



### Example Flow Diagram

<kbd>
    <img src="media/example-flow.png" width="800">
</kbd>


---
# Installation
#### :point_right: OPTION
> These instructions will use the Generic service connection and Invoke REST API task/gate. You can use this [document](AzureDevOps/src/xm-extension/README.md) to build and install an example Azure DevOps extension that will work with this example.

## xMatters - Setup Inbound Trigger
#### :blue_book: NOTE
> If you do not already have an xMatters user specifically for integrations it is recommended to create one. This account should only be used for integrations and not need web login permissions. 
#### :warning: WARNING
> If the account you choose to use for this integration is removed or made inactive then the integration will break.

1. Under this integration user create a new API key to use with Azure DevOps. [Instructions](https://help.xmatters.com/ondemand/user/apikeys.htm)
    > :pencil2: *Make sure to note the key and secret for later when we configure Azure DevOps.*

    <kbd>
        <img src="media/xm-api-key.png" width="700">
    </kbd>

2. Import the example workflow. [Instructions](https://help.xmatters.com/ondemand/xmodwelcome/workflows/manage-workflows.htm)

    <kbd>
        <img src="media/xm-import-workflow.png" width="700">
    </kbd>

3.  Modify the **Build Task**, **Release Gate**, and **Release Approvals** forms in the imported workflow and give the integration user sender permissions on the form. [Instructions](https://help.xmatters.com/ondemand/xmodwelcome/communicationplanbuilder/formpermissions.htm)

    <kbd>
        <img src="media/xm-sender-permissions.png" width="700">
    </kbd>

4. Modify the **Queue Build** form and select the **Enable in Web UI** and **Enable in Mobile App** options.  Also update the sender permissions for this form, but give an actual user permissions. You will later login to xMatters with this account to trigger the flow and the user needs sender permissions on the form. [Instructions](https://help.xmatters.com/ondemand/xmodwelcome/communicationplanbuilder/formpermissions.htm)

    <kbd>
        <img src="media/xm-sender-permissions-2.png" width="700">
    </kbd>

5. Now open the flow **Build Task** and you will see a trigger at the top of the canvas called "**Build Task - Azure DevOps - Build Task**". Hover over the trigger step and select edit.

    <kbd>
        <img src="media/xm-edit-buildtasktrigger.png" width="700">
    </kbd>

6. On the Settings tab copy the trigger's URL and paste it in your notes for later.
    > :pencil2: *Make sure to save in your notes and label something like Build Trigger Endpoint for later when we configure Azure DevOps.*

    <kbd>
        <img src="media/xm-edit-buildtasktrigger-2.png" width="700">
    </kbd>

7. Repeat steps 5 and 6 for the **Release Gate - Azure DevOps - Release Gate** trigger in the **Release Gate** flow.
    > :pencil2: *Make sure to save the trigger URL in your notes and label something like Release Trigger Endpoint for later when we configure Azure DevOps.*

8. Repeat steps 5 and 6 for the **Release Approvals - Azure DevOps - Approval Notice** trigger in the **Release Approvals** flow.
    > :pencil2: *Make sure to save the trigger URL in your notes and label something like Release Approvals Endpoint for later when we configure Azure DevOps.*

## Azure DevOps - Setup Credentials for xMatters
To use the **Azure DevOps - Queue Build**, **Azure DevOps - Update Release Approval Status**, and **Azure DevOps - Search for User** steps we need to setup credentials for xMatters to use to connect to Azure DevOps.

#### :blue_book: NOTE
> We will be using a Personal Access Token and as good practice you probably want to use a specific Azure DevOps account for integrations. 

#### :warning: WARNING
>If you use an actual person's account and it is deactivated or deleted then the integration will break.

1. Login to Azure DevOps as the user you want to create the Personal Access Token under
    #### :blue_book: NOTE
    > If you already have a Personal Access Token setup for xMatters (You are using the Azure DevOps Boards integration) you can use the same PTA, but you may need to skip to step 5 and update the permissions.
2. In the top right select the icon with a person with a gear on it. This will open user settings menu where you will select **Personal access tokens**

    <kbd>
        <img src="media/ado-patsetup-1.png" width="200">
    </kbd>

3. Select **+ New Token** to create a new Personal Access Token

    <kbd>
        <img src="media/ado-patsetup-2.png" width="700">
    </kbd>

4. Set the following values
    * **Name** - Give the token a descriptive name so that you know what it is for like "xMatters"
    * **Organization** - set the Azure DevOps organization you want this token to have access too
        * The user you are creating the token under must have access to the organization for them to show
    * **Expiration** - select **Custom Defined** and set it for the farthest date possible (1 year)

    <br>
    <kbd>
        <img src="media/ado-patsetup-3.png" width="500">
    </kbd>

5. For this integration the token should only need
    * **Build** - Read & execute
    * **Release** - Read, write, execute, & manage
    * **Graph** - Read
    * **Identity** - Read
    * **User Profile** - Read
     
    #### :blue_book: NOTE
    > As of writing this I have only tested with Full Access. If you use this token to perform other actions from xMatters it may need more permissions.

    <kbd>
        <img src="media/ado-patsetup-4.png" width="500">
    </kbd>

6. Now copy the token that is generated.  
    > :pencil2: *Make sure you have a copy because once you close the window you can not see it again and you will need later to finish xMatters integration setup*

    <kbd>
        <img src="media/ado-patsetup-5.png" width="500">
    </kbd>

## Azure DevOps - Setup Service Connection
Azure DevOps will need a Service Connection to connect to xMatters.

#### :point_right: OPTION
> If you install the [example extension](AzureDevOps/src/xm-extension/README.md) you can use the xMatters connection type.

1. Go to **Project Settings** in the Azure DevOps project you want to setup the xMatters integration and open **Service Connections** and select **New service connection**.

    <kbd>
        <img src="media/ado-serviceconn-1.png" width="700">
    </kbd>

2. For connection type select **Generic** and select Next

    <kbd>
        <img src="media/ado-serviceconn-2.png" width="300">
    </kbd>

3. Set the connection settings as follows and click Save.
    * **Server URL** - your xMatters instance URL (https://example.xmatters.com)
    * **Username** - the API key you created earlier in xMatters
    * **Password/Token Key** - the API secret you created earlier in xMatters
    * **Service connection name** - give the connection a name like "xMatters"

    <br>
    <kbd>
        <img src="media/ado-serviceconn-3.png" width="300">
    </kbd>

## Azure DevOps - Setup Pipeline Task
These instructions explain how to setup the Invoke REST API pipeline task to send a notification to the xMatters **Azure DevOps - Build Task** trigger. The instructions will be setting up a new pipeline using the classic method, but you can use the included yaml config if you like.

#### :point_right: OPTION
> If you install the [example extension](AzureDevOps/src/xm-extension/README.md) you can use the "xMatters - Workflow HTTP Trigger" task instead of the Invoke REST API task. The yaml configuration is using the Inovke REST API task.

#### :blue_book: NOTE
> * For learning purposes you probably want to create a Git repo for this example that is accessible from your project. It does not need anything in it.
> * I will not go into all aspects of configuring an Azure DevOps pipeline.
> * I am assuming you are running the example Workflow in xMatters, so we will be setting up a pipeline that essential only interacts with xMatters for demonstration. You can add to your own pipeline if you wish, but make sure you understand how it works.
> * You can use the provided yaml configuration, but be aware that it will be written to the Git repo you have the pipeline configured too.

1. In the project you are setting up the xMatters integration go to Pipelines -> Pipelines and select **New pipeline**

    <kbd>
        <img src="media/ado-pipeline-1.png" width="700">
    </kbd>

2. Select **"Use the classic editor"** at the bottom of the selections. (This is where you can select one of the other options and use the [yaml config](AzureDevOps/src/azure-pipelines.yml))

    <kbd>
        <img src="media/ado-pipeline-2.png" width="500">
    </kbd>

3. Select the repo and default branch you want to connect the pipeline too and select Continue. I am using GitHub, but it can be which ever you like.

    <kbd>
        <img src="media/ado-pipeline-3.png" width="500">
    </kbd>

4. Select **Empty job** at the top of the screen.

    <kbd>
        <img src="media/ado-pipeline-4.png" width="500">
    </kbd>

5. Select **Agent job 1** and then click **Remove** to delete it.

    <kbd>
        <img src="media/ado-pipeline-5.png" width="600">
    </kbd>

6. Open the Pipeline menu and select **Add an agentless job**

    <kbd>
        <img src="media/ado-pipeline-6.png" width="600">
    </kbd>

7. Add a new **"Invoke REST API"** task to the **Agentless job**

    <kbd>
        <img src="media/ado-pipeline-7.png" width="600">
    </kbd>

8. Select the new task and setting the following parameters.
    #### :warning: WARNING
    > Be sure to modify the parameters in the body as specified. Especially the xmRecipients field or no one will receive the notification.

    * **Display name** - set this to whatever you like
    * **Connection type** - Generic
    * **Generic service connection** - select the service connection you setup earlier to your xMatters instance
    * **Method** - POST
    * **Headers** - clear this field except for "Content-Type":"application/json"
    * **Body** - paste the contents from [InvokeRESTAPI_taskPayload.json](AzureDevOps/src/InvokeRESTAPI_taskPayload.json)
        * Update the following fields in the body
            * xmSubject - set this to what you want the xMatters notification subject to be
            * xmMessage - set this to the message you want displayed in the xMatters notification
            * xmRecipients - set this with a comma separated list of xMatters users and/or groups you want to receive the notification
    * **URL suffix and parameters** - enter the xMatters Azure DevOps - Build Task trigger URL path without the instance domain and starting slash
    * **Completion event** - Callback (If you set this to ApiResponse the task will continue on a successful request to xMatters, but not wait on the flow to complete)

    <br>
    <kbd>
        <img src="media/ado-pipeline-8.png" width="600">
    </kbd>

9. We do not want to queue the pipeline yet so select **Save** only.

    <kbd>
        <img src="media/ado-pipeline-9.png" width="600">
    </kbd>

## Azure DevOps - Configure Release Gate
These instructions explain how to setup the Invoke REST API task as a release gate to send a notification to the xMatters **Azure DevOps - Release Gate** trigger.

#### :point_right: OPTION
> If you install the [example extension](AzureDevOps/src/xm-extension/README.md) you can use the "xMatters - Workflow HTTP Trigger" gate instead of the Invoke REST API gate.

1. In the project you are setting up the xMatters integration go to Pipelines -> Releases and select **New -> New release pipeline**

    <kbd>
        <img src="media/ado-release-1.png" width="700">
    </kbd>

2. On the "Select a template" window click **Empty job** at the top.

    <kbd>
        <img src="media/ado-release-2.png" width="500">
    </kbd>

3. Name the stage whatever you like and close the window.

    <kbd>
        <img src="media/ado-release-3.png" width="500">
    </kbd>

4. Select **Add an artifact**

    <kbd>
        <img src="media/ado-release-4.png" width="600">
    </kbd>

5. On the "Add an artifact" window enter the following values and click Add
    * **Source type** - Build
    * **Project** - the project you are integrating with xMatters. Most likely the one you are in now.
    * **Source** - select the example pipeline you created earlier
    * **Default version** - the default is fine (Latest)
    * **Source alias** - default is fine

    <br>
    <kbd>
        <img src="media/ado-release-5.png" width="500">
    </kbd>

6. Select the **Pre-deployment conditions**

    <kbd>
        <img src="media/ado-release-6.png" width="600">
    </kbd>

7. On the "Pre-deployment conditions" window set the trigger to **After release** and enable **Gates**

    <kbd>
        <img src="media/ado-release-7.png" width="500">
    </kbd>

8. Set "The delay before evaluation" to what you like. I set to 1 minute so that it moves on faster for demo purposes.

    <kbd>
        <img src="media/ado-release-8.png" width="500">
    </kbd>

9. Now click **Add** to add a gate and select **Invoke REST API**

    <kbd>
        <img src="media/ado-release-9.png" width="500">
    </kbd>

10. Set the following values for the gate
    #### :warning: WARNING
    > Be sure to modify the parameters in the body as specified. Especially the xmRecipients field or no one will receive the notification.

    * **Display name** - whatever you like
    * **Connection type** - Generic
    * **Generic service connection** - select the service connection you setup to xMatters earlier
    * **Method** - POST
    * **Headers** - clear everything but "Content-Type":"application/json"
    * **Body** - paste the content from [InvokeRESTAPI_gatePayload.json](AzureDevOps/src/InvokeRESTAPI_gatePayload.json)
        * Update the following fields in the body
            * xmSubject - set this to what you want the xMatters notification subject to be
            * xmMessage - set this to the message you want displayed in the xMatters notification
            * xmRecipients - set this with a comma separated list of xMatters users and/or groups you want to receive the notification
    * **URL suffix and parameters** - enter the xMatters Azure DevOps - Release Gate trigger URL path without the instance domain and starting slash
    * **Completion event** - Callback

    <br>
    <kbd>
        <img src="media/ado-release-10.png" width="500">
    </kbd>

11. Scroll down to Evaluation options. These options can be set to whatever you need, but I shortened for the demo.
    * **The time between re-evaluation of gate** - I set to the minimum of 5 mins for the demo
    * **Minimum duration** - I left at the default of 0 (all gates pass in same cycle). You can change if you like.
    * **The timeout after which gates fail** - the release waits for all gates to pass. This timeout is how long it will wait before failing the release. For demo purposes I set to 1 hour, but it does not matter.

    <br>
    <kbd>
        <img src="media/ado-release-11.png" width="500">
    </kbd>

## Azure DevOps - Configure Release Approvals
These instructions explain how to configure Azure DevOps to send release approval pending notifications to the xMatters **Azure DevOps - Approval Notice** trigger.

### Configure Pre/Post Approval

1. Go back to your release pipeline and select the **Pre-deployment conditions**

    <kbd>
        <img src="media/ado-release-6.png" width="600">
    </kbd>

2. Enable Pre-deployment approvals and enter the users and groups you want the approval to be sent oo

    <kbd>
        <img src="media/ado-approvals-1.png" width="600">
    </kbd>

3. Set the other approval conditions how ever you like

### Configure Service Hook

1. Go to **Project Settings** in the Azure DevOps project you want to configure release approval notifications to xMatters and open **Service hooks** and select **Create subscription**.

2. Select **Webhook** as the type then click Next

    <kbd>
        <img src="media/ado-approval-hook-1.png" width="500">
    </kbd>

3. Select **Release deployment approval pending** as the event type. You can set the filters how ever you like and click Next.

    <kbd>
        <img src="media/ado-approval-hook-2.png" width="500">
    </kbd>

4. Set the following values for the Action.  Leave others as default.
    * **URL** - endpoint of the xMatters HTTP Trigger **Release Approvals - Azure DevOps - Approval Notice** you got earlier
    * **Basic authentication username** - the xMatters API key you created earlier
    * **Basic authentication password** - the xMatters API secret you created earlier

    <br>
    <kbd>
        <img src="media/ado-approval-hook-3.png" width="500">
    </kbd>

5. You can either click **Finish** to save or **Test** to verify it successfuly connects to xMatters trigger.

6. In order for xMatters to find the user when notifying an individual of an approval thier xMatters profile must have a work email device that matches their Azure DevOps account email.

    <kbd>
        <img src="media/emailmatch-1.png" width="500">
    </kbd><br>

    <kbd>
        <img src="media/emailmatch-2.png" width="700">
    </kbd>

7. In order for xMatters to find the group when notifying a group of an approval the xMatters group must include the Azure DevOps organization name the group is in.

    <kbd>
        <img src="media/groupmatch-1.png" width="500">
    </kbd><br>

    <kbd>
        <img src="media/groupmatch-2.png" width="500">
    </kbd>

## xMatters - Configure Azure DevOps Endpoints
We will now configure the Endpoints in xMatters so that flow steps can connect to Azure DevOps. 

#### :blue_book: NOTE
> Azure DevOps has several different domains hosting the API endpoints used in these integrations depending on the endpoint function. To use all the integrations in this workflow three endpoints are required (Azure DevOps, Azure DevOps - Management, and Azure DevOps - Release Management).
>
> The pipeline task and update release steps both use the callback token supplied in the Azure DevOps request. They share the same xMatters endpoint because they use the same base URL as actions that require basic authentication. In the case of the pipeline task and release gate the basic auth credentials are ignored by Azure DevOps and it uses the token.

1. Go back to the example workflow in xMatters and select the **FLOWS** tab. In the top right open the **Components** menu and select **Endpoints**

    <kbd>
        <img src="media/xm-taskendpoint-1.png" width="700">
    </kbd>

2. Select the **Azure DevOps** endpoint.
3. Set or verify these basic settings
    * **Name** - I would use "Azure DevOps" because the steps are already set to use this
    * **Base URL** - https://dev.azure.com
    * **Trust self-signed certificates** - disabled

    <br>
    <kbd>
        <img src="media/xm-endpoint-2.png" width="600">
    </kbd>

4. For the endpoint Authentication we need to set the following
    * **Endpoint Type** - Basic
    * **Username** - this will be the Azure DevOps username of the account you created the Personal Access Token
    * **Password** - enter the Personal Access Token
    * **Preemptive** - enabled

    <br>
    <kbd>
        <img src="media/xm-endpoint-3.png" width="600">
    </kbd>

5. Click the **Save** button at the bottom
6. Now select the **Azure DevOps - Release Management** endpoint (Used for interacting with release pipelines). Set or verify these basic settings
    * **Name** - leave as "Azure DevOps - Release Management" because the steps are already configured for this
    * **Base URL** - https://vsrm.dev.azure.com
    * **Trust self-signed certificates** - disabled

    <br>
    <kbd>
        <img src="media/xm-releaseendpoint-1.png" width="600">
    </kbd>

7. For the endpoint Authentication we need to set the following
    * **Endpoint Type** - Basic
    * **Username** - this will be the Azure DevOps username of the account you created the Personal Access Token
    * **Password** - enter the Personal Access Token
    * **Preemptive** - enabled

    <br>
    <kbd>
        <img src="media/xm-releaseendpoint-2.png" width="600">
    </kbd>

8. Click the **Save** button at the bottom

9. Now select the **Azure DevOps - Management** endpoint (Used for ADO management). Set or verify these basic settings
    * **Name** - leave as "Azure DevOps - Management" because the steps are already configured for this
    * **Base URL** - https://vssps.dev.azure.com
    * **Trust self-signed certificates** - disabled

    <br>
    <kbd>
        <img src="media/xm-managementendpoint-1.png" width="600">
    </kbd>

10. For the endpoint Authentication we need to set the following
    * **Endpoint Type** - Basic
    * **Username** - this will be the Azure DevOps username of the account you created the Personal Access Token
    * **Password** - enter the Personal Access Token
    * **Preemptive** - enabled

    <br>
    <kbd>
        <img src="media/xm-managementendpoint-2.png" width="600">
    </kbd>

11. Click the **Save** button at the bottom

## xMatters - Configure Queue Build Flow
You now need to configure the Queue Build flow to point to the example Azure DevOps pipeline you created earlier.

1. Open the **Queue Build** flow
2. On the canvas hover over the **Azure DevOps - Queue Build** step and select edit.

    <kbd>
        <img src="media/xm-queuebuild-1.png" width="600">
    </kbd>

3. Now set the values for the step as follows.
    * **organization** - set to the Azure DevOps organization name you created your example pipeline in
    * **projectName** - set to the Azure DevOps project name you created your example pipeline in
    * **pipelineName** - set to the name you gave your example pipeline

    <br>
    <kbd>
        <img src="media/xm-queuebuild-2.png" width="600">
    </kbd>

4. Now click **Done**, **Save** the flow, and you are done with configuration.

---
# Testing


### Example Flow Diagram
In this test we will follow the path that gets all passing results so that you can see all the integrations work.

<kbd>
    <img src="media/example-flow.png" width="800">
</kbd>

1. Login to xMatters as one of the users you gave send permission to the Queue Build form
2. Go to **Messaging** and select **Queue Build** under the **AZURE DEVOPS PIPELINES**

    <kbd>
        <img src="media/xm-testing-1.png" width="300">
    </kbd>

3. No need to add recipients here. Just click the **Send Message** button.

    <kbd>
        <img src="media/xm-testing-2.png" width="600">
    </kbd>

4. Ignore the warning we do not actually want to send a notification for this initial event. This is triggering the Queue Build flow to start which will trigger the example pipeline you created earlier to start.

    <kbd>
        <img src="media/xm-testing-3.png" width="300">
    </kbd>

5. You should see your example pipeline in Azure DevOps start and if you drill into the details you will see it is waiting on the InvokeRESTAPI task. It is waiting on a reply from xMatters.

    <kbd>
        <img src="media/xm-testing-4.png" width="300">
    </kbd>

6. After a short time one of the notification targets you configured in the pipeline task payload field xmRecipients should recieve a notification similar to below (This is viewed from with xMatters app)

    <kbd>
        <img src="media/xm-testing-5.jpg" width="300">
    </kbd>

7. There will be two options, but select **Continue Build** for this test.  If you select **Stop Build** it will fail the build.

    <kbd>
        <img src="media/xm-testing-6.jpg" width="300">
    </kbd>

8. After a short time you should see your example pipeline complete successfully.

    <kbd>
        <img src="media/xm-testing-7.png" width="300">
    </kbd>

9. Now the example release pipeline should be triggered and start, but you will see it waiting for the pre-approvals.

10. After a short time the users you configured to get pre-approvals should begin to recieve notifications from xMatters.

11. If they approve and the approval conditions you set are met the release pipeline will continue.

12. You now should see it waiting on the release gate to pass.

    <kbd>
        <img src="media/xm-testing-8.png" width="700">
    </kbd>

13. After a short time one of the notification targets you configured in the release gate payload field xmRecipients should recieve a notification similar to below (This is viewed from with xMatters app)

    <kbd>
        <img src="media/xm-testing-9.jpg" width="300">
    </kbd>

14. There will be two options, select **Approve**.  If you select **Decline** the gate will never pass and you will have to wait the timeout period for the release to fail.

    <kbd>
        <img src="media/xm-testing-10.jpg" width="300">
    </kbd>

15. You should now see your release complete. Timing can vary especially if you changed the gate evaluation times.

    <kbd>
        <img src="media/xm-testing-11.png" width="700">
    </kbd>

---
# Expanding
The example is using an approval type workflows to demonstrate triggering flows, sending notifications, user responses, and updating Azure DevOps. The xMatters flows can include other steps as well.  This includes things like creating a ServiceNow ticket, Jira Issue, update a Slack/MS Teams channel, update status page, triggering other automation, of course sending notifications, etc.

#### :blue_book: NOTE
> * **Invoke REST API (ApiResponse)** - If you configure the Azure DevOps Invoke REST API task's *Completion event* for ApiResponse it will trigger the xMatters flow, but it will continue on a successful response from the request. Use this when you want to trigger xMatters but do not care the outcome of the xMatters flow. In this case if you use the *Build Task Started* and *Build Task Completed* steps in your flow they will fail because the task will not exist for the callback.
>
> * **Invoke REST API (Callback)** - [Examples use this setting] If you configure the Azure DevOps Invoke REST API task's *Completion event* for Callback it will trigger the xMatters flow and wait for a callback containing the task status. Use this when you want the task status to reflect the xMatters flow outcome.

#### :warning: WARNING
> When customizing for your use cases keep in mind that the Azure DevOps release gates use a polling mechanism. Keep the following points in mind when building or modifying a flow that is triggered by a release gate. The demo workflow tries to manage all these.
> * The callback information, except Timeline ID, changes with each poll request and any updates must use this new information. The xMatters flow must take this into account.
> * If the flow replies back to the gate poll with a failure the release gate polling will continue. That callback information will no longer be valid, so inorder to later reply with a success the flow must wait for another poll from Azure DevOps. The demo workflow never replies on a failure, because by default no reply is considered a failure by Azure DevOps.

---
# Troubleshooting

## Build is not queued by the xMatters Queue Build step

* xMatters
    * You can view the log in the Workflow Activity panel to help troubleshoot. [Instructions](https://help.xmatters.com/ondemand/xmodwelcome/flowdesigner/activity-panel.htm)
    * Verify that you entered the correct organization, project, and pipeline names
    * Verify that you have entered the correct credentials when setting up the **Azure DevOps** endpoint
* Azure DevOps
    * Verify the user and Persnal Access Token have the required permissions


## Pipeline Task is not triggering xMatters flow

* Azure DevOps
    * Drill into the the build logs and check if there are any errors
    * Verify that you entered the correct trigger endpoint URL. Do not include the xMatters instance domain and first slash, because this is supplied by the Service Connection. 
    * Verify the **Service Connection** is configured with the correct credentials
* xMatters
    * Verify the xMatters account used for the Azure DevOps Service Connection has send permissions on the **Build Task** flow

## xMatters flow not updating pipeline task correctly

* xMatters
    * You can view the log in the Workflow Activity panel to help troubleshoot. [Instructions](https://help.xmatters.com/ondemand/xmodwelcome/flowdesigner/activity-panel.htm)
    * Verify the build task update steps are configured for the **Azure DevOps** endpoint.  Not the Azure DevOps - Release Gate endpoint.
    * Verify that the **Azure DevOps** endpoint is configured correctly. This endpoint will be configured for Basic Auth, but the build task update steps use the auth token that Azure DevOps sends in the request to trigger the flow.
    * Make sure the correct outputs of the trigger step are mapped to the inputs of the update steps.
* Azure DevOps
    * Make sure you configured the **Invoke REST API** task to use **Callback** as the **Completion event**.  If you leave it as ApiResponse it will succeed on a successful response to the initial request to xMatters, which if everything is configured correctly should be every time. Basically it will ignore the workflow outcome.

## Release Gate is not triggering xMatters flow

* Azure DevOps
    * Drill into the the logs and check if there are any errors
    * Verify that you entered the correct trigger endpoint URL. Do not include the xMatters instance domain and first slash, because this is supplied by the Service Connection. 
    * Verify the **Service Connection** is configured with the correct credentials
* xMatters
    * Verify the xMatters account used for the Azure DevOps Service Connection has send permissions on the **Release Gate** flow

## xMatters flow not updating gate correctly

#### :blue_book: NOTE
> Release gates work differently than pipeline tasks. Azure DevOps release polls the release gate endpoints waiting for a success status. So keep in mind.
> * With each poll the callback information to update the gate changes except for the timeline ID, so this new information must be used to update the gate.
> * If the xMatters flow replies with a failure the Azure DevOps release will continue to run and poll the gates, because it waits for all successes or it's configured timeout.
> * If the xMatters flow replies with a failure the callback information will no longer be valid. If the flow then later needs to update the gate as success it will have to wait for a new poll with new callback information.

* xMatters
    * You can view the log in the Workflow Activity panel to help troubleshoot. [Instructions](https://help.xmatters.com/ondemand/xmodwelcome/flowdesigner/activity-panel.htm)
    * Verify the release gate update steps are configured for the **Azure DevOps - Release Gate** endpoint.  Not the Azure DevOps.
    * Verify that the **Azure DevOps - Release Gate** endpoint is configured correctly. This endpoint will be configured for No Auth and the release gate update steps use the auth token that Azure DevOps sends in the poll request to trigger the flow.
    * Make sure the correct outputs of the trigger step are mapped to the inputs of the update steps.
* Azure DevOps
    * Make sure you configured the **Invoke REST API** task to use **Callback** as the **Completion event**.  If you leave it as ApiResponse it will succeed on a successful response to the initial request to xMatters, which if everything is configured correctly should be every time. Basically it will ignore the workflow outcome.

## Users not receiving approval notifications

* Azure DevOps
    * Verify the service hook is configured correctly and using the correct xMatters **Azure DevOps - Approval Notice** HTTP trigger URL along with the API key credentials
    * Verify the groups and users configured for approvals are also configured in xMatters
* xMatters
    * You can view the log in the Workflow Activity panel to help troubleshoot. [Instructions](https://help.xmatters.com/ondemand/xmodwelcome/flowdesigner/activity-panel.htm)
    * Verify that the xMatters user profiles have a work email device configured with the same email address as their Azure DevOps account
    * Verify that the xMatters groups are named **adoOrganization/adoGroupName** and the group contains members