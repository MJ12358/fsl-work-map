@IsTest
public class WorkMapControllerTest {

  private static Double latitude = 47.8438;
  private static Double longitude = -124.7929;

	@TestSetup
	static void testSetup() {
    Account acc = new Account();
    acc.Name = 'Test Company';
    insert acc;

    User usr = new User();
    usr.IsActive = true;
    usr.LastName = 'test';
    usr.Email = 'work_map@test.com';
    usr.Alias = 'wmtest';
    usr.LocaleSidKey = 'en_US';
    usr.EmailEncodingKey = 'UTF-8';
    usr.LanguageLocaleKey = 'en_US';
    usr.ProfileId = System.UserInfo.getProfileId();
    usr.TimeZoneSidKey = System.UserInfo.getTimeZone().getID();
    usr.Username = 'work_map@test.com';
    insert usr;

    Schema.Location loc = new Schema.Location();
    loc.Name = 'Location';
    loc.LocationType = 'Warehouse';
    insert loc;

    Schema.Address addr = new Schema.Address();
    addr.ParentId = loc.Id;
    addr.Latitude = latitude;
    addr.Longitude = longitude;
    insert addr;

    loc.VisitorAddressId = addr.Id;
    update loc;

    WorkType wt = new WorkType();
    wt.Name = 'Work Type';
    wt.EstimatedDuration = 1;
    insert wt;

    ServiceResource sr = new ServiceResource();
    sr.IsActive = true;
    sr.Name = usr.Alias;
    sr.RelatedRecordId = usr.Id;
    sr.LastKnownLatitude = latitude;
    sr.LastKnownLongitude = longitude;
    insert sr;

    ServiceAppointment sa = new ServiceAppointment();
    sa.ParentRecordId = acc.Id;
    sa.DueDate = Datetime.now().addDays(7);
    sa.EarliestStartTime = Datetime.now().addDays(-7);
    sa.Latitude = latitude;
    sa.Longitude = longitude;
    sa.WorkTypeId = wt.Id;
    insert sa;

    WorkOrder wo = new WorkOrder();
    wo.AccountId = acc.Id;
    wo.Latitude = latitude;
    wo.Longitude = longitude;
    wo.WorkTypeId = wt.Id;
    insert wo;

    OperatingHours oh = new OperatingHours();
    oh.Name = 'Operating Hours';
    insert oh;

    ServiceTerritory st = new ServiceTerritory();
    st.IsActive = true;
    st.Name = 'Service Territory';
    st.OperatingHoursId = oh.Id;
    insert st;
	}

	@IsTest
	static void testConstructor() {
		CalloutMock mock = new CalloutMock();
		Test.setMock(HttpCalloutMock.class, mock);
		Test.setCurrentPage(Page.WorkMap);
		Test.startTest();
		WorkMapController controller = new WorkMapController();
		Test.stopTest();
		System.assert(String.isNotEmpty(controller.googleJavascript));
	}

	@IsTest
	static void testGetWorkOrders() {
		Test.startTest();
		List<WorkMapController.WorkOrderWrapper> results = WorkMapController.getWorkOrders();
		Test.stopTest();
		System.assert(results.size() > 0);
	}

	@IsTest
	static void testGetServiceAppointments() {
		Test.startTest();
		List<WorkMapController.ServiceAppointmentWrapper> results = WorkMapController.getServiceAppointments();
		Test.stopTest();
		System.assert(results.size() > 0);
	}

	@IsTest
	static void testGetLocations() {
		Test.startTest();
		List<WorkMapController.LocationWrapper> results = WorkMapController.getLocations();
		Test.stopTest();
		System.assert(results.size() > 0);
	}

	@IsTest
	static void testGetResources() {
		Test.startTest();
		List<WorkMapController.ServiceResourceWrapper> results = WorkMapController.getResources();
		Test.stopTest();
		System.assert(results.size() > 0);
	}

  @IsTest
	static void testGetTerritories() {
		Test.startTest();
		List<WorkMapController.ServiceTerritoryWrapper> results = WorkMapController.getTerritories();
		Test.stopTest();
		System.assert(results.size() > 0);
	}

	@IsTest
	static void testGetPolygons() {
		Test.startTest();
		List<FSL__Polygon__c> results = WorkMapController.getPolygons();
		Test.stopTest();
		System.assertNotEquals(null, results);
	}

  @IsTest
  static void testGetWorkTypes() {
    Test.startTest();
    List<WorkMapController.WorkTypeWrapper> results = WorkMapController.getWorkTypes();
    Test.stopTest();
    System.assert(results.size() > 0);
  }

  @IsTest
  static void testGetStatuses() {
    Test.startTest();
    List<String> appointmentStatuses = WorkMapController.getAppointmentStatuses();
    List<String> workOrderStatuses = WorkMapController.getWorkOrderStatuses();
    Test.stopTest();
    System.assert(appointmentStatuses.size() > 0);
    System.assert(workOrderStatuses.size() > 0);
  }

  private class CalloutMock implements HttpCalloutMock {
    public System.HttpResponse respond(System.HttpRequest request) {
      System.HttpResponse response = new System.HttpResponse();
      response.setBody('{"example": "test"}');
      response.setStatusCode(200);
      return response;
    }
  }

}
