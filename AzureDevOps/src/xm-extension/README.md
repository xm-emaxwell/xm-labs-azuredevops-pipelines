# xMatters - Azure DevOps Extension
This is an example Azure DevOps extension that can be built and installed into your Azure DevOps organization to make configuring integrations with xMatters easier.

### :scroll: DISCLAIMER
<kbd>
  <img src="https://github.com/xmatters/xMatters-Labs/raw/master/media/disclaimer.png">
</kbd>

#### :blue_book: NOTE
> At the time of writing this xMatters does not have an official Azure DevOps extension. So before going through this you may want to verify there is not one available on the Azure Devops [marketplace](https://marketplace.visualstudio.com/azuredevops).

---
# Summary
This extension will add a xMatters service connection type, pipeline task, and release gate. They work in conjunction with the Azure DevOps Pipelines [example](https://github.com/xmatters/xm-labs-azuredevops-pipelines).

The same functionality can be acheived just using a Generic service connection and the Invoke REST API task in Azure DevOps. This extension was created to possibly make it a little easier to maintain these configurations.

This is a very basic extension, so there is no validation of user input and such.

# Documentation
These instructions are intend to just be a summary of how to build and deploy an Azure DevOps extension. They will point out some of the specific modifications you can make for your use case. You can view Microsoft's documentation to get more detail.  Below are links to information I used to create this extension. 

#### :blue_book: NOTE
> These external links may not be maintained in this readme, so they could become invalid

* [Develop a web extension for Azure DevOps Services](https://docs.microsoft.com/en-us/azure/devops/extend/get-started/node?view=azure-devops) - explains how to setup, create, build, and deploy an extension.
* [Source for InvokeRESTAPI](https://github.com/microsoft/azure-pipelines-tasks/blob/master/Tasks/InvokeRestApiV1/task.json) - I mimicked my task after this.
* [Azure DevOps Extension Tasks](https://marketplace.visualstudio.com/items?itemName=ms-devlabs.vsts-developer-tools-build-tasks) - nice extension for Azure DevOps to create a CI/CD pipeline for your Azure DevOps extension development.



## Build and Publish Extension
The instructions in this section are refering to the document located at [Develop a web extension for Azure DevOps Services](https://docs.microsoft.com/en-us/azure/devops/extend/get-started/node?view=azure-devops).

1. Follow the instructions in the **Prerequisites** section to setup your local build environment.

2. You can **skip** the **Create a directory and manifest** section and just clone this directory.

3. Now go to the **Package and publish your extension** section and follow the instructions for setting up your publisher in the Visual Studio Marketplace.

4. Once you have your publisher you can open the **vss-extension.json** in this repo and modify the **id** and **publisher** as described in the **Package and publish your extension**.

5. Continue following the instructions in **Package and publish your extension** to build and upload your extension to the marketplace. If you follow the instructions it will be private.

6. Finally follow **Install your extension** instructions to share your extension with your organizations.

## Verify Components Show Up
We will now verify the components are showing up in your Azure DevOps organization. It is assumed you are familiar with Azure DevOps.

### Service Connection
1. Open one of your Azure DevOps project's settings and go to **Service Connections**
2. 