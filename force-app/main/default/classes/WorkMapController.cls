/**
 * Created on Fri Apr 30 2021
 *
 * Copyright (c) 2021 Matt T. Jants
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without modification, 
 *    are permitted provided that the following conditions are met:
 *
 * - Redistributions of source code must retain the above copyright notice, 
 *    this list of conditions and the following disclaimer.
 * - Redistributions in binary form must reproduce the above copyright notice, 
 *    this list of conditions and the following disclaimer in the documentation 
 *    and/or other materials provided with the distribution.
 * - Neither the name of the company, software or the names of its contributors 
 *    may be used to endorse or promote products derived from this software without 
 *    specific prior written permission.
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED
 *  TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL
 *  THE COPYRIGHT HOLDERS OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL,
 *  EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS
 *  OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY
 *  OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, TORT (INCLUDING NEGLIGENCE) OR OTHERWISE, 
 *  ARISING FROM, OUT OF OR IN CONNECTION WITH THE USE OF THIS SOFTWARE OR OTHER DEALINGS IN THE SOFTWARE, 
 *  EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 **/

public with sharing class WorkMapController {

	public String googleJavascript { get; private set; }
  private transient Work_Map_Settings__mdt setting;
  private transient String url = 'https://maps.googleapis.com/maps/api/js?key={0}&libraries=drawing,geometry,visualization';
  private static transient List<String> restrictedStatuses = new List<String>{'Completed', 'Closed', 'Cannot Complete', 'Canceled'};

  public WorkMapController() {
    try {
      this.setting = [
        SELECT Google_Api_Key__c 
        FROM Work_Map_Settings__mdt 
        WHERE DeveloperName = 'Default' 
        LIMIT 1
      ];
    } catch (QueryException e) {
      throw new VisualforceException('No Work Map setting named "Default" found, please create it and try again.');
    }

    this.url = String.format(this.url, new List<String>{
      this.setting.Google_Api_Key__c
    });

    System.HttpRequest request = new System.HttpRequest();
    request.setEndpoint(url);
    request.setMethod('GET');

    System.Http http = new System.Http();
    System.HttpResponse response = http.send(request);

    if (response.getStatusCode() != 200) {
      throw new VisualforceException('Retrieval of google maps assets failed.');
    }

    this.googleJavascript = response.getBody();
  }

	@RemoteAction
	public static List<ServiceAppointmentWrapper> getServiceAppointments() {
    List<ServiceAppointmentWrapper> results = new List<ServiceAppointmentWrapper>();

    for (ServiceAppointment sa : [
			SELECT Id, Account.Name, Account.BillingLatitude, Account.BillingLongitude, 
        Contact.Name, Contact.MailingLatitude, Contact.MailingLongitude, 
        AppointmentNumber, Latitude, Longitude, Status, toLabel(StatusCategory), 
				FSL__GanttLabel__c, WorkType.Name, Street, City, State, PostalCode, Country, OwnerId 
			FROM ServiceAppointment 
			WHERE ((Latitude != null AND Longitude != null) 
          OR (Account.BillingLatitude != null AND Account.BillingLongitude != null) 
          OR (Contact.MailingLatitude != null AND Contact.MailingLongitude != null)) 
				AND toLabel(StatusCategory) NOT IN :restrictedStatuses 
			WITH SECURITY_ENFORCED
		]) {
      results.add(new ServiceAppointmentWrapper(sa));
    }

    return results;
	}

  @RemoteAction
	public static List<WorkOrderWrapper> getWorkOrders() {
    List<WorkOrderWrapper> results = new List<WorkOrderWrapper>();

    for (WorkOrder wo : [
			SELECT Id, Account.Name, Account.BillingLatitude, Account.BillingLongitude, 
        Contact.Name, Contact.MailingLatitude, Contact.MailingLongitude, 
        Latitude, Longitude, WorkOrderNumber, Status, toLabel(StatusCategory), 
				WorkType.Name, Street, City, State, PostalCode, Country, OwnerId 
			FROM WorkOrder 
			WHERE ((Latitude != null AND Longitude != null) 
          OR (Account.BillingLatitude != null AND Account.BillingLongitude != null) 
          OR (Contact.MailingLatitude != null AND Contact.MailingLongitude != null)) 
				AND toLabel(StatusCategory) NOT IN :restrictedStatuses 
			WITH SECURITY_ENFORCED 
		]) {
      results.add(new WorkOrderWrapper(wo));
    }

    return results;
	}

  @RemoteAction
  public static List<LocationWrapper> getLocations() {
    List<LocationWrapper> results = new List<LocationWrapper>();

    for (Schema.Location loc : [
      SELECT Id, Name, LocationType, OpenDate, VisitorAddress.Latitude, VisitorAddress.Longitude, 
        VisitorAddress.Street, VisitorAddress.City, VisitorAddress.State, VisitorAddress.PostalCode, VisitorAddress.Country
      FROM Location 
      WHERE VisitorAddress.Latitude != null AND VisitorAddress.Longitude != null 
        AND CloseDate = null 
      WITH SECURITY_ENFORCED
    ]) {
      results.add(new LocationWrapper(loc));
    }

    return results;
  }

	@RemoteAction
	public static List<ServiceResourceWrapper> getResources() {
    List<ServiceResourceWrapper> results = new List<ServiceResourceWrapper>();

		for (ServiceResource sr : [
			SELECT Id, Name, FSL__GanttLabel__c, FSL__Picture_Link__c, 
        toLabel(ResourceType), RelatedRecord.Title, RelatedRecord.SmallPhotoUrl, 
        LastKnownLatitude, LastKnownLongitude, LastKnownLocationDate 
			FROM ServiceResource 
			WHERE LastKnownLatitude != null AND LastKnownLongitude != null 
        AND LastKnownLocationDate = LAST_N_DAYS:31 AND IsActive = true 
			WITH SECURITY_ENFORCED 
		]) {
      results.add(new ServiceResourceWrapper(sr));
    }

    return results;
	}

	@RemoteAction
	public static List<ServiceTerritory> getTerritories() {
		return [
			SELECT Id, Name, Street, City, State, PostalCode, Latitude, Longitude 
			FROM ServiceTerritory 
			WHERE Latitude != null AND Longitude != null AND IsActive = true 
			WITH SECURITY_ENFORCED 
		];
	}

	@RemoteAction
	public static List<FSL__Polygon__c> getPolygons() {
		return [
			SELECT Id, FSL__KML__c 
			FROM FSL__Polygon__c 
			WITH SECURITY_ENFORCED
		];
	}

  @RemoteAction
	public static List<String> getAppointmentStatuses() {
    return getStatuses(ServiceAppointment.StatusCategory);
	}

  @RemoteAction
	public static List<String> getWorkOrderStatuses() {
    return getStatuses(WorkOrder.StatusCategory);
	}

  private static List<String> getStatuses(Schema.SObjectField field) {
    List<String> result = new List<String>();
    Schema.DescribeFieldResult fieldResult = field.getDescribe();
    for (Schema.PicklistEntry ple : fieldResult.getPicklistValues()) {
      String label = ple.getLabel().normalizeSpace();
      if (ple.isActive() && !restrictedStatuses.contains(label)) {
        result.add(label);
      }
    }
    return result;
  }

  @TestVisible
  private class ServiceAppointmentWrapper {
    public String Id;
    public String AccountName;
    public String ContactName;
    public String Label;
    public Double Latitude;
    public Double Longitude;
    public String AppointmentNumber;
    public String Status;
    public String StatusCategory;
    public String WorkTypeName;
    public String Street;
    public String City;
    public String State;
    public String PostalCode;
    public String Country;
    public String OwnerId;

    public ServiceAppointmentWrapper(ServiceAppointment sa) {
      this.Id = sa.Id;
      this.AccountName = sa.Account?.Name.normalizeSpace();
      this.ContactName = sa.Contact?.Name.normalizeSpace();
      this.Label = this.AccountName != null 
        ? this.AccountName 
        : (this.ContactName != null ? this.ContactName : sa.AppointmentNumber);
      this.Latitude = sa.Latitude != null 
        ? sa.Latitude 
        : (sa.Account?.BillingLatitude != null ? sa.Account.BillingLatitude : sa.Contact?.MailingLatitude);
      this.Longitude = sa.Longitude != null 
        ? sa.Longitude 
        : (sa.Account?.BillingLongitude != null ? sa.Account.BillingLongitude : sa.Contact?.MailingLongitude);
      this.AppointmentNumber = sa.AppointmentNumber;
      this.Status = sa.Status?.normalizeSpace();
      this.StatusCategory = sa.StatusCategory?.normalizeSpace();
      this.WorkTypeName = sa.WorkType?.Name.normalizeSpace();
      this.Street = sa.Street?.normalizeSpace();
      this.City = sa.City?.normalizeSpace();
      this.State = sa.State?.normalizeSpace();
      this.PostalCode = sa.PostalCode?.normalizeSpace();
      this.Country = sa.Country?.normalizeSpace();
      this.OwnerId = sa.OwnerId;
    }
  }

  @TestVisible
  private class WorkOrderWrapper {
    public String Id;
    public String AccountName;
    public String ContactName;
    public String Label;
    public Double Latitude;
    public Double Longitude;
    public String WorkOrderNumber;
    public String Status;
    public String StatusCategory;
    public String WorkTypeName;
    public String Street;
    public String City;
    public String State;
    public String PostalCode;
    public String Country;
    public String OwnerId;

    public WorkOrderWrapper(WorkOrder wo) {
      this.Id = wo.Id;
      this.AccountName = wo.Account?.Name.normalizeSpace();
      this.ContactName = wo.Contact?.Name.normalizeSpace();
      this.Label = this.AccountName != null 
        ? this.AccountName 
        : (this.ContactName != null ? this.ContactName : wo.WorkOrderNumber);
      this.Latitude = wo.Latitude != null 
        ? wo.Latitude 
        : (wo.Account?.BillingLatitude != null ? wo.Account.BillingLatitude : wo.Contact?.MailingLatitude);
      this.Longitude = wo.Longitude != null 
        ? wo.Longitude 
        : (wo.Account?.BillingLongitude != null ? wo.Account.BillingLongitude : wo.Contact?.MailingLongitude);
      this.WorkOrderNumber = wo.WorkOrderNumber;
      this.Status = wo.Status?.normalizeSpace();
      this.StatusCategory = wo.StatusCategory?.normalizeSpace();
      this.WorkTypeName = wo.WorkType?.Name.normalizeSpace();
      this.Street = wo.Street?.normalizeSpace();
      this.City = wo.City?.normalizeSpace();
      this.State = wo.State?.normalizeSpace();
      this.PostalCode = wo.PostalCode?.normalizeSpace();
      this.Country = wo.Country?.normalizeSpace();
      this.OwnerId = wo.OwnerId;
    }
  }

  @TestVisible
  private class LocationWrapper {
    public String Id;
    public Double Latitude;
    public Double Longitude;
    public String Name;
    public DateTime OpenDate;
    public String Type;
    public String Street;
    public String City;
    public String State;
    public String PostalCode;
    public String Country;

    public LocationWrapper(Schema.Location loc) {
      this.Id = loc.Id;
      this.Latitude = loc.VisitorAddress?.Latitude;
      this.Longitude = loc.VisitorAddress?.Longitude;
      this.Name = loc.Name?.normalizeSpace();
      this.OpenDate = loc.OpenDate;      
      this.Type = loc.LocationType?.normalizeSpace();
      this.Street = loc.VisitorAddress?.Street?.normalizeSpace();
      this.City = loc.VisitorAddress?.City?.normalizeSpace();
      this.State = loc.VisitorAddress?.State?.normalizeSpace();
      this.PostalCode = loc.VisitorAddress?.PostalCode?.normalizeSpace();
      this.Country = loc.VisitorAddress?.Country?.normalizeSpace();
    }
  }

  @TestVisible
  private class ServiceResourceWrapper {
    public String Id;
    public String Name;
    public String Label;
    public String Photo;
    public Double LastKnownLatitude;
    public Double LastKnownLongitude;
    public DateTime LastKnownLocationDate;

    public ServiceResourceWrapper(ServiceResource sr) {
      this.Id = sr.Id;
      this.Name = sr.Name.normalizeSpace();
      this.Label = sr.FSL__GanttLabel__c != null 
        ? sr.FSL__GanttLabel__c.normalizeSpace()
        : (sr.RelatedRecord?.Title != null ? sr.RelatedRecord.Title.normalizeSpace() : sr.ResourceType?.normalizeSpace());
      this.Photo = sr.FSL__Picture_Link__c != null 
        ? sr.FSL__Picture_Link__c 
        : sr.RelatedRecord?.SmallPhotoUrl;
      this.LastKnownLatitude = sr.LastKnownLatitude;
      this.LastKnownLongitude = sr.LastKnownLongitude;
      this.LastKnownLocationDate = sr.LastKnownLocationDate;
    }
  }

}
