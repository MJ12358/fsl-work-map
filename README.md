# Field Service Lightning (FSL) Work Map

This map allows you to view [Service Appointments](https://developer.salesforce.com/docs/atlas.en-us.object_reference.meta/object_reference/sforce_api_objects_serviceappointment.htm) or [Work Orders](https://developer.salesforce.com/docs/atlas.en-us.object_reference.meta/object_reference/sforce_api_objects_workorder.htm) with [Locations](https://developer.salesforce.com/docs/atlas.en-us.object_reference.meta/object_reference/sforce_api_objects_location.htm), [Service Resources](https://developer.salesforce.com/docs/atlas.en-us.object_reference.meta/object_reference/sforce_api_objects_serviceresource.htm) and [Service Territories](https://developer.salesforce.com/docs/atlas.en-us.object_reference.meta/object_reference/sforce_api_objects_serviceterritory.htm)!

You can filter by status, territory or work type and also search.

Add layers like drawing, heatmap, polygons and traffic.

Even choose your map style!

You can even use this without the need for a "Dispatcher License".

## Prerequisites

* Enable Field Service in your org
* [Install the FSL managed package](https://fsl.secure.force.com/install)
* Deploy using the button below
* Assign the "Work Map" permission set to anyone who needs access
* Create a new "Work Map" metadata record called "Default" and add your [Google Api Key](https://developers.google.com/maps/documentation/javascript/get-api-key)
* You _may_ have to adjust "Sharing Settings" to allow public read on "Work Type"

## Deploy

<a href="https://githubsfdeploy.herokuapp.com?owner=MJ12358&repo=fsl-work-map&ref=main">
  <img alt="Deploy to Salesforce"
       src="https://raw.githubusercontent.com/afawcett/githubsfdeploy/master/deploy.png">
</a>

## Screenshots

![Screenshot](images/Capture.PNG)

## Filter by Status

![Screenshot_By_Status](images/Capture_By_Status.PNG)

## Filter by Territory

![Screenshot_By_Territory](images/Capture_By_Territory.PNG)

## Filter by Work Type

![Screenshot_By_WorkType](images/Capture_By_WorkType.PNG)

## Add Layers

![Screenshot_Layers](images/Capture_Layers.PNG)

## Style the map

![Screenshot_Style](images/Capture_Style.PNG)

## Tests

| Class | Percent | Lines |
| ----- | ------- | ----- |
| WorkMapController | 92% | 146/157 |
