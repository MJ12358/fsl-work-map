/* global
  resourceUrl
  userId
  dayjs
  google
  geoXML3
  rivets
  WorkMapController
*/

/* eslint
  no-unused-vars: "warn",
  no-empty: "off"
*/

(function() {
	'use strict';

	//* Config

	const KEYS = {
		// SELECTED_STATUSES: 'vf.workMap.selectedStatuses',
		SELECTED_STYLE: 'vf.workMap.selectedStyle',
	};
  const ELEMENT = document.getElementById('map');
	const CONFIG = {
		fullscreenControlOptions: {
			position: google.maps.ControlPosition.RIGHT_TOP
		},
		gestureHandling: 'greedy',
		mapTypeControlOptions: {
			position: google.maps.ControlPosition.TOP_RIGHT
		},
		streetViewControl: false,
		styles: [],
		zoomControl: false
	};
	const GMAP = new google.maps.Map(ELEMENT, CONFIG);
	const HEATMAP_LAYER = new google.maps.visualization.HeatmapLayer();
	const POLYGON_LAYER = new geoXML3.parser({
		map: null,
		suppressInfoWindows: true,
		zoom: false
	});
	const TRAFFIC_LAYER = new google.maps.TrafficLayer();
	const DRAWING_MANAGER = new google.maps.drawing.DrawingManager({
		drawingMode: google.maps.drawing.OverlayType.MARKER,
		drawingControl: true,
		drawingControlOptions: {
			position: google.maps.ControlPosition.TOP_CENTER,
		},
		markerOptions: {
			icon: `${resourceUrl}/assets/flag.png`
		}
	});
  const EARTH_RADIUS = 3958.8; // miles
	const FEATURES = [
		{
			featureType: 'administrative',
			elementType: 'geometry',
			stylers: [{}]
		},
		{
			featureType: 'administrative.province',
			elementType: 'geometry.stroke',
			stylers: [{}]
		},
		{
			featureType: 'poi',
			stylers: [{}]
		},
		{
			featureType: 'road',
			elementType: 'labels.icon',
			stylers: [{}]
		},
		{
			featureType: 'transit',
			stylers: [{}]
		}
	];

	//* View Model

	function ViewModel() {
		const self = this;

		let activeInfoWindow;
    let appointmentMarkers = [];
    let appointmentStatuses = [];
    let appointmentsSelected = true;
		let drawings = [];
    let locationMarkers = [];
		let resourceMarkers = [];
		let territoryMarkers = [];
    let workOrderMarkers = [];
    let workOrderStatuses = [];

		this.alertOpen = false;
		this.alertTitle = '';
    this.alertMessage = '';

		this.currentTab = 'tab-1';
    this.mouseLocation;
		this.optionControlOpen = false;
    this.polygons = [];
		this.selectedStatuses = [];
		this.selectedStyle = getItem(KEYS.SELECTED_STYLE) || 'default';
		this.searchValue = '';
    this.statuses = [];
    this.visibleMarkers = [];

		this.styles = {
			default: [],
			silver: [
				{
					elementType: 'geometry',
					stylers: [{ color: '#f5f5f5' }],
				},
				{
					elementType: 'labels.text.fill',
					stylers: [{ color: '#616161' }],
				},
				{
					elementType: 'labels.text.stroke',
					stylers: [{ color: '#f5f5f5' }],
				},
				{
					featureType: 'administrative.land_parcel',
					elementType: 'labels.text.fill',
					stylers: [{ color: '#bdbdbd' }],
				},
				{
					featureType: 'poi',
					elementType: 'geometry',
					stylers: [{ color: '#eeeeee' }],
				},
				{
					featureType: 'poi',
					elementType: 'labels.text.fill',
					stylers: [{ color: '#757575' }],
				},
				{
					featureType: 'poi.park',
					elementType: 'geometry',
					stylers: [{ color: '#e5e5e5' }],
				},
				{
					featureType: 'poi.park',
					elementType: 'labels.text.fill',
					stylers: [{ color: '#9e9e9e' }],
				},
				{
					featureType: 'road',
					elementType: 'geometry',
					stylers: [{ color: '#ffffff' }],
				},
				{
					featureType: 'road.arterial',
					elementType: 'labels.text.fill',
					stylers: [{ color: '#757575' }],
				},
				{
					featureType: 'road.highway',
					elementType: 'geometry',
					stylers: [{ color: '#dadada' }],
				},
				{
					featureType: 'road.highway',
					elementType: 'labels.text.fill',
					stylers: [{ color: '#616161' }],
				},
				{
					featureType: 'road.local',
					elementType: 'labels.text.fill',
					stylers: [{ color: '#9e9e9e' }],
				},
				{
					featureType: 'transit.line',
					elementType: 'geometry',
					stylers: [{ color: '#e5e5e5' }],
				},
				{
					featureType: 'transit.station',
					elementType: 'geometry',
					stylers: [{ color: '#eeeeee' }],
				},
				{
					featureType: 'water',
					elementType: 'geometry',
					stylers: [{ color: '#c9c9c9' }],
				},
				{
					featureType: 'water',
					elementType: 'labels.text.fill',
					stylers: [{ color: '#9e9e9e' }],
				},
			],
			dark: [
				{
					elementType: 'geometry',
					stylers: [{ color: '#212121' }]
				},
				{
					elementType: 'labels.text.fill',
					stylers: [{ color: '#757575' }]
				},
				{
					elementType: 'labels.text.stroke',
					stylers: [{ color: '#212121' }]
				},
				{
					featureType: 'administrative',
					elementType: 'geometry',
					stylers: [{ color: '#757575' }]
				},
				{
					featureType: 'administrative.country',
					elementType: 'labels.text.fill',
					stylers: [{ color: '#9e9e9e' }]
				},
				{
					featureType: 'administrative.land_parcel',
					stylers: [{ visibility: 'off' }]
				},
				{
					featureType: 'administrative.locality',
					elementType: 'labels.text.fill',
					stylers: [{ color: '#bdbdbd' }]
				},
				{
					featureType: 'poi',
					elementType: 'labels.text.fill',
					stylers: [{ color: '#757575' }]
				},
				{
					featureType: 'poi.park',
					elementType: 'geometry',
					stylers: [{ color: '#181818' }]
				},
				{
					featureType: 'poi.park',
					elementType: 'labels.text.fill',
					stylers: [{ color: '#616161' }]
				},
				{
					featureType: 'poi.park',
					elementType: 'labels.text.stroke',
					stylers: [{ color: '#1b1b1b' }]
				},
				{
					featureType: 'road',
					elementType: 'geometry.fill',
					stylers: [{ color: '#2c2c2c' }]
				},
				{
					featureType: 'road',
					elementType: 'labels.text.fill',
					stylers: [{ color: '#8a8a8a' }]
				},
				{
					featureType: 'road.arterial',
					elementType: 'geometry',
					stylers: [{ color: '#373737' }]
				},
				{
					featureType: 'road.highway',
					elementType: 'geometry',
					stylers: [{ color: '#3c3c3c' }]
				},
				{
					featureType: 'road.highway.controlled_access',
					elementType: 'geometry',
					stylers: [{ color: '#4e4e4e' }]
				},
				{
					featureType: 'road.local',
					elementType: 'labels.text.fill',
					stylers: [{ color: '#616161' }]
				},
				{
					featureType: 'transit',
					elementType: 'labels.text.fill',
					stylers: [{ color: '#757575' }]
				},
				{
					featureType: 'water',
					elementType: 'geometry',
					stylers: [{ color: '#000000' }]
				},
				{
					featureType: 'water',
					elementType: 'labels.text.fill',
					stylers: [{ color: '#3d3d3d' }]
				}
			],
			night: [
				{
					elementType: 'geometry',
					stylers: [{ color: '#242f3e' }]
				},
				{
					elementType: 'labels.text.stroke',
					stylers: [{ color: '#242f3e' }],
				},
				{
					elementType: 'labels.text.fill',
					stylers: [{ color: '#746855' }],
				},
				{
					featureType: 'administrative.locality',
					elementType: 'labels.text.fill',
					stylers: [{ color: '#d59563' }],
				},
				{
					featureType: 'poi',
					elementType: 'labels.text.fill',
					stylers: [{ color: '#d59563' }],
				},
				{
					featureType: 'poi.park',
					elementType: 'geometry',
					stylers: [{ color: '#263c3f' }],
				},
				{
					featureType: 'poi.park',
					elementType: 'labels.text.fill',
					stylers: [{ color: '#6b9a76' }],
				},
				{
					featureType: 'road',
					elementType: 'geometry',
					stylers: [{ color: '#38414e' }],
				},
				{
					featureType: 'road',
					elementType: 'geometry.stroke',
					stylers: [{ color: '#212a37' }],
				},
				{
					featureType: 'road',
					elementType: 'labels.text.fill',
					stylers: [{ color: '#9ca5b3' }],
				},
				{
					featureType: 'road.highway',
					elementType: 'geometry',
					stylers: [{ color: '#746855' }],
				},
				{
					featureType: 'road.highway',
					elementType: 'geometry.stroke',
					stylers: [{ color: '#1f2835' }],
				},
				{
					featureType: 'road.highway',
					elementType: 'labels.text.fill',
					stylers: [{ color: '#f3d19c' }],
				},
				{
					featureType: 'transit',
					elementType: 'geometry',
					stylers: [{ color: '#2f3948' }],
				},
				{
					featureType: 'transit.station',
					elementType: 'labels.text.fill',
					stylers: [{ color: '#d59563' }],
				},
				{
					featureType: 'water',
					elementType: 'geometry',
					stylers: [{ color: '#17263c' }],
				},
				{
					featureType: 'water',
					elementType: 'labels.text.fill',
					stylers: [{ color: '#515c6d' }],
				},
				{
					featureType: 'water',
					elementType: 'labels.text.stroke',
					stylers: [{ color: '#17263c' }],
				},
			],
			aubergine: [
				{
					elementType: 'geometry',
					stylers: [{ color: '#1d2c4d' }]
				},
				{
					elementType: 'labels.text.fill',
					stylers: [{ color: '#8ec3b9' }]
				},
				{
					elementType: 'labels.text.stroke',
					stylers: [{ color: '#1a3646' }]
				},
				{
					featureType: 'administrative.country',
					elementType: 'geometry.stroke',
					stylers: [{ color: '#4b6878' }]
				},
				{
					featureType: 'administrative.land_parcel',
					elementType: 'labels.text.fill',
					stylers: [{ color: '#64779e' }]
				},
				{
					featureType: 'administrative.province',
					elementType: 'geometry.stroke',
					stylers: [{ color: '#4b6878' }]
				},
				{
					featureType: 'landscape.man_made',
					elementType: 'geometry.stroke',
					stylers: [{ color: '#334e87' }]
				},
				{
					featureType: 'landscape.natural',
					elementType: 'geometry',
					stylers: [{ color: '#023e58' }]
				},
				{
					featureType: 'poi',
					elementType: 'geometry',
					stylers: [{ color: '#283d6a' }]
				},
				{
					featureType: 'poi',
					elementType: 'labels.text.fill',
					stylers: [{ color: '#6f9ba5' }]
				},
				{
					featureType: 'poi',
					elementType: 'labels.text.stroke',
					stylers: [{ color: '#1d2c4d' }]
				},
				{
					featureType: 'poi.park',
					elementType: 'geometry.fill',
					stylers: [{ color: '#023e58' }]
				},
				{
					featureType: 'poi.park',
					elementType: 'labels.text.fill',
					stylers: [{ color: '#3C7680' }]
				},
				{
					featureType: 'road',
					elementType: 'geometry',
					stylers: [{ color: '#304a7d' }]
				},
				{
					featureType: 'road',
					elementType: 'labels.text.fill',
					stylers: [{ color: '#98a5be' }]
				},
				{
					featureType: 'road',
					elementType: 'labels.text.stroke',
					stylers: [{ color: '#1d2c4d' }]
				},
				{
					featureType: 'road.highway',
					elementType: 'geometry',
					stylers: [{ color: '#2c6675' }]
				},
				{
					featureType: 'road.highway',
					elementType: 'geometry.stroke',
					stylers: [{ color: '#255763' }]
				},
				{
					featureType: 'road.highway',
					elementType: 'labels.text.fill',
					stylers: [{ color: '#b0d5ce' }]
				},
				{
					featureType: 'road.highway',
					elementType: 'labels.text.stroke',
					stylers: [{ color: '#023e58' }]
				},
				{
					featureType: 'transit',
					elementType: 'labels.text.fill',
					stylers: [{ color: '#98a5be' }]
				},
				{
					featureType: 'transit',
					elementType: 'labels.text.stroke',
					stylers: [{ color: '#1d2c4d' }]
				},
				{
					featureType: 'transit.line',
					elementType: 'geometry.fill',
					stylers: [{ color: '#283d6a' }]
				},
				{
					featureType: 'transit.station',
					elementType: 'geometry',
					stylers: [{ color: '#3a4762' }]
				},
				{
					featureType: 'water',
					elementType: 'geometry',
					stylers: [{ color: '#0e1626' }]
				},
				{
					featureType: 'water',
					elementType: 'labels.text.fill',
					stylers: [{ color: '#4e6d70' }]
				}
			],
			retro: [
				{
					elementType: 'geometry',
					stylers: [{ color: '#ebe3cd' }]
				},
				{
					elementType: 'labels.text.fill',
					stylers: [{ color: '#523735' }]
				},
				{
					elementType: 'labels.text.stroke',
					stylers: [{ color: '#f5f1e6' }],
				},
				{
					featureType: 'administrative',
					elementType: 'geometry.stroke',
					stylers: [{ color: '#c9b2a6' }],
				},
				{
					featureType: 'administrative.land_parcel',
					elementType: 'geometry.stroke',
					stylers: [{ color: '#dcd2be' }],
				},
				{
					featureType: 'administrative.land_parcel',
					elementType: 'labels.text.fill',
					stylers: [{ color: '#ae9e90' }],
				},
				{
					featureType: 'landscape.natural',
					elementType: 'geometry',
					stylers: [{ color: '#dfd2ae' }],
				},
				{
					featureType: 'poi',
					elementType: 'geometry',
					stylers: [{ color: '#dfd2ae' }],
				},
				{
					featureType: 'poi',
					elementType: 'labels.text.fill',
					stylers: [{ color: '#93817c' }],
				},
				{
					featureType: 'poi.park',
					elementType: 'geometry.fill',
					stylers: [{ color: '#a5b076' }],
				},
				{
					featureType: 'poi.park',
					elementType: 'labels.text.fill',
					stylers: [{ color: '#447530' }],
				},
				{
					featureType: 'road',
					elementType: 'geometry',
					stylers: [{ color: '#f5f1e6' }],
				},
				{
					featureType: 'road.arterial',
					elementType: 'geometry',
					stylers: [{ color: '#fdfcf8' }],
				},
				{
					featureType: 'road.highway',
					elementType: 'geometry',
					stylers: [{ color: '#f8c967' }],
				},
				{
					featureType: 'road.highway',
					elementType: 'geometry.stroke',
					stylers: [{ color: '#e9bc62' }],
				},
				{
					featureType: 'road.highway.controlled_access',
					elementType: 'geometry',
					stylers: [{ color: '#e98d58' }],
				},
				{
					featureType: 'road.highway.controlled_access',
					elementType: 'geometry.stroke',
					stylers: [{ color: '#db8555' }],
				},
				{
					featureType: 'road.local',
					elementType: 'labels.text.fill',
					stylers: [{ color: '#806b63' }],
				},
				{
					featureType: 'transit.line',
					elementType: 'geometry',
					stylers: [{ color: '#dfd2ae' }],
				},
				{
					featureType: 'transit.line',
					elementType: 'labels.text.fill',
					stylers: [{ color: '#8f7d77' }],
				},
				{
					featureType: 'transit.line',
					elementType: 'labels.text.stroke',
					stylers: [{ color: '#ebe3cd' }],
				},
				{
					featureType: 'transit.station',
					elementType: 'geometry',
					stylers: [{ color: '#dfd2ae' }],
				},
				{
					featureType: 'water',
					elementType: 'geometry.fill',
					stylers: [{ color: '#b9d3c2' }],
				},
				{
					featureType: 'water',
					elementType: 'labels.text.fill',
					stylers: [{ color: '#92998d' }],
				},
			]
		};

		this.showAlert = function(title, message) {
			self.alertTitle = title || 'Service Unavailable';
			self.alertMessage = message;
			self.alertOpen = true;
		}

		this.closeAlert = function() {
			self.alertOpen = false;
      self.alertTitle = '';
      self.alertMessage = '';
		};

		this.changeStyle = function(event) {
			self.selectedStyle = event.target.value;
			GMAP.setOptions({
				styles: self.styles[self.selectedStyle]
			});
			setItem(KEYS.SELECTED_STYLE, self.selectedStyle);
		};

		this.toggleOptionControl = function() {
			self.optionControlOpen = !self.optionControlOpen;
		};

		this.openTab = function(event) {
			self.currentTab = event.target.getAttribute('aria-controls');
		};

		this.togglePointsOfInterest = function(event) {
			if (event.target.checked) {
				setFeatures('on');
			} else {
				setFeatures('off');
			}
		};

    this.toggleLocations = function(event) {
      locationMarkers.forEach(v => {
        v.setVisible(event.target.checked);
      });
    }

		this.toggleResources = function(event) {
			resourceMarkers.forEach(v => {
				v.setVisible(event.target.checked);
			});
		};

		this.toggleTerritories = function(event) {
			territoryMarkers.forEach(v => {
				v.setVisible(event.target.checked);
			});
		};

		this.toggleDrawing = function() {
			if (DRAWING_MANAGER.getMap()) {
				DRAWING_MANAGER.setMap(null);
			} else {
				DRAWING_MANAGER.setMap(GMAP);
			}

			drawings.forEach(d => {
				if (d.getMap()) {
					d.setMap(null);
				} else {
					d.setMap(GMAP);
				}
			});
		};

		this.toggleHeatmap = function() {
      let arr = [];
      if (appointmentsSelected) {
        arr = appointmentMarkers;
      } else {
        arr = workOrderMarkers;
      }

			let data = arr.map(v => {
				if (v.getVisible()) {
					return {
						location: v.getPosition(),
						weight: 25
					};
				}
			});

			HEATMAP_LAYER.setOptions({
				data: data
			});

			if (HEATMAP_LAYER.getMap()) {
				HEATMAP_LAYER.setMap(null);
			} else {
				HEATMAP_LAYER.setMap(GMAP);
			}
		}

		this.togglePolygons = function() {
			// set polygons to trigger rivets
			self.polygons = self.polygons.map(p => {
				if (p.getMap()) {
					p.setMap(null);
				} else {
					p.setMap(GMAP);
				}
				return p;
			});
		};

		this.togglePolygon = function(event, polygon) {
			if (polygon.getVisible()) {
				polygon.setVisible(false);
			} else {
				polygon.setVisible(true);
			}
		};

		this.toggleTraffic = function() {
			if (TRAFFIC_LAYER.getMap()) {
				TRAFFIC_LAYER.setMap(null);
			} else {
				TRAFFIC_LAYER.setMap(GMAP);
			}
		};

    this.toggleAppointments = function(event) {
      appointmentsSelected = true;
      let checked = event.target.checked;
      // toggle the workorder checkbox
      document.querySelector('#checkbox-7').checked = !checked;
      // toggle work order markers
      workOrderMarkers.forEach(v => {
        v.setVisible(!checked);
      });
      // toggle appointment markers
			appointmentMarkers.forEach(v => {
				v.setVisible(checked);
			});
      // mark statuses checked
      Array.from(document.querySelectorAll('#tab-2 input[type="checkbox"]')).forEach(el => {
        el.checked = checked;
      });
      if (checked) {
        self.statuses = appointmentStatuses;
			} else {
        self.statuses = workOrderStatuses;
      }
      self.selectedStatuses = [...self.statuses];

      updateVisibleMarkers();
		};

    this.toggleMyAppointments = function(event) {
      appointmentMarkers.forEach(v => {
        if (!event.target.checked) {
          v.setVisible(true);
        } else if (v.ownerId !== userId) {
          v.setVisible(false);
        }
      });
    };

		this.toggleWorkOrders = function(event) {
      appointmentsSelected = false;
      let checked = event.target.checked;
      // toggle the appointment checkbox
      document.querySelector('#checkbox-5').checked = !checked;
      // toggle appointment markers
      appointmentMarkers.forEach(v => {
        v.setVisible(!checked);
      });
      // toggle work order markers
			workOrderMarkers.forEach(v => {
				v.setVisible(checked);
			});
      // mark statuses checked
      Array.from(document.querySelectorAll('#tab-2 input[type="checkbox"]')).forEach(el => {
        el.checked = checked;
      });
			if (checked) {
        self.statuses = workOrderStatuses;
			} else {
        self.statuses = appointmentStatuses;
			}
      self.selectedStatuses = [...self.statuses];

			updateVisibleMarkers();
		};

		this.toggleMyWorkOrders = function(event) {
      workOrderMarkers.forEach(v => {
        if (!event.target.checked) {
          v.setVisible(true);
        } else if (v.ownerId !== userId) {
          v.setVisible(false);
        }
      });

			updateVisibleMarkers();
		};

    this.toggleStatus = function(event, status) {
			if (event[0].target.checked) {
				self.selectedStatuses.push(status);
			} else {
				self.selectedStatuses = self.selectedStatuses.filter(a => a !== status);
			}

      console.log(self.selectedStatuses);
      console.log(status);

      let arr = [];
      if (appointmentsSelected) {
        arr = appointmentMarkers;
      } else {
        arr = workOrderMarkers;
      }

			arr.forEach(v => {
				if (self.selectedStatuses.includes(v.status)) {
					v.setVisible(true);
				} else {
					v.setVisible(false);
				}
			});

			updateVisibleMarkers();
		};

		this.onSearch = function() {
			let value = self.searchValue.toLowerCase();

      let arr = [];
      if (appointmentsSelected) {
        arr = appointmentMarkers;
      } else {
        arr = workOrderMarkers;
      }

			arr.forEach(v => {
				if (!value) {
					v.setVisible(true);
				} else if (v.title.toLowerCase().includes(value)) {
					v.setVisible(true);
				} else {
					v.setVisible(false);
				}
			});

			updateVisibleMarkers();
		};

		//* Getters

		WorkMapController.getServiceAppointments((result, event) => {
			if (event.status) {
        let bounds = new google.maps.LatLngBounds();
				appointmentMarkers = result.map(v => {
					let marker = new google.maps.Marker(new ServiceAppointmentMarker(v));
					addInfoWindow(marker);
          bounds.extend(marker.getPosition());
					return marker;
				});
        GMAP.fitBounds(bounds);
        // not sure i want to use this...
        // new markerClusterer.MarkerClusterer({map: GMAP, markers: appointmentMarkers});
			} else {
        self.showAlert(event.type, event.message);
      }
		});

    // set the appointment statuses (these are shown by default)
    WorkMapController.getAppointmentStatuses((result, event) => {
      if (event.status) {
        appointmentStatuses = result;
        self.statuses = result;
        self.selectedStatuses = result;
      } else {
        self.showAlert(event.type, event.message);
      }
    });

    WorkMapController.getWorkOrders((result, event) => {
			if (event.status) {
				workOrderMarkers = result.map(v => {
					let marker = new google.maps.Marker(new WorkOrderMarker(v));
					addInfoWindow(marker);
          marker.setVisible(false);
					return marker;
				});
			} else {
				self.showAlert(event.type, event.message);
			}
		});

    // only store the work order statuses
    WorkMapController.getWorkOrderStatuses((result, event) => {
      if (event.status) {
        workOrderStatuses = result;
      } else {
        self.showAlert(event.type, event.message);
      }
    });

    WorkMapController.getLocations((result, event) => {
      if (event.status) {
        locationMarkers = result.map(v => {
          let marker = new google.maps.Marker(new LocationMarker(v));
          addInfoWindow(marker);
          marker.setVisible(false);
          return marker;
        });
      } else {
        self.showAlert(event.type, event.message);
      }
    });

		WorkMapController.getResources((result, event) => {
			if (event.status) {
				resourceMarkers = result.map(v => {
					let marker = new google.maps.Marker(new ResourceMarker(v));
					addInfoWindow(marker);
					return marker;
				});
			} else {
				self.showAlert(event.type, event.message);
			}
		});

		WorkMapController.getTerritories((result, event) => {
			if (event.status) {
				territoryMarkers = result.map(v => {
					let marker = new google.maps.Marker(new TerritoryMarker(v));
					addInfoWindow(marker);
					return marker;
				});
			} else {
				self.showAlert(event.type, event.message);
			}
		});

		WorkMapController.getPolygons((result, event) => {
			if (event.status) {
				result.forEach(v => {
					POLYGON_LAYER.parseKmlString(v.FSL__KML__c);
				});

				POLYGON_LAYER.docs.forEach(d => {
					d.gpolygons.forEach(p => {
						self.polygons.push(p);
						addPolygonListener(p);
					});
				});
			} else {
				self.showAlert(event.type, event.message);
			}
		}, { escape: false });

		//* Intervals

		setInterval(() => {
			if (workOrderMarkers.every(m => !m.getVisible())) {
				return;
			}
			WorkMapController.getWorkOrders((result, event) => {
				if (event.status) {
					workOrderMarkers = workOrderMarkers.map(marker => {
						let record = result.find(v => v.Id === marker.id);
						if (record) {
							Object.assign(marker, new WorkOrderMarker(record));
							marker.setIcon(marker.icon); // doesn't update unless called explictly
						} else {
							marker.setMap(null);
						}
						return marker;
					});
				}
			});
		}, 15 * 60 * 1000);

		setInterval(() => {
			if (appointmentMarkers.every(m => !m.getVisible())) {
				return;
			}
			WorkMapController.getServiceAppointments((result, event) => {
				if (event.status) {
					appointmentMarkers = appointmentMarkers.map(marker => {
						let record = result.find(v => v.Id === marker.id);
						if (record) {
							Object.assign(marker, new ServiceAppointmentMarker(record));
							marker.setIcon(marker.icon);
						} else {
							marker.setMap(null);
						}
						return marker;
					});
				}
			});
		}, 15 * 60 * 1000);

		setInterval(() => {
			if (resourceMarkers.every(m => !m.getVisible())) {
				return;
			}
			WorkMapController.getResources((result, event) => {
				if (event.status) {
					resourceMarkers.forEach(marker => {
						let record = result.find(v => v.Id === marker.id);
						if (record) {
							Object.assign(marker, new ResourceMarker(record));
						} else {
							marker.setMap(null);
						}
					});
				}
			});
		}, 5 * 60 * 1000);

		//* Utilities
	
		function updateVisibleMarkers() {
			let bounds = GMAP.getBounds();

      let arr = [];
      if (appointmentsSelected) {
        arr = appointmentMarkers;
      } else {
        arr = workOrderMarkers;
      }

			self.visibleMarkers = arr.filter(m => {
				return bounds.contains(m.getPosition()) && m.getVisible();
			});
		}

		function setFeatures(bol) {
			FEATURES.forEach(v => {
				v.stylers[0].visibility = bol;

				for (let [, value] of Object.entries(self.styles)) {
					let index = value.findIndex(a => {
						return a.featureType === v.featureType && a.elementType === v.elementType;
					});

					if (index === -1) {
						value.push(v);
					} else {
						Object.assign(value[index], v);
					}
				}
			});

			GMAP.setOptions({
				styles: self.styles[self.selectedStyle]
			});
		}

		function addInfoWindow(marker) {
			let infoWindow = new google.maps.InfoWindow();
			google.maps.event.addListener(marker, 'click', function() {
				activeInfoWindow?.close();
				infoWindow.setContent(this.infoWindow);
				infoWindow.open(GMAP, this);
				activeInfoWindow = infoWindow;
			});
		}

		function addDrawingListener(overlay) {
			google.maps.event.addListener(overlay, 'contextmenu', () => {
				drawings = drawings.filter(d => {
					if (d === overlay) {
						d.setMap(null);
						return false;
					}
					return true;
				});
			});
		}

		function addPolygonListener(polygon) {
			let infoWindow = new google.maps.InfoWindow();
			google.maps.event.addListener(polygon, 'click', function(event) {
        let arr = [];
        if (appointmentsSelected) {
          arr = appointmentMarkers;
        } else {
          arr = workOrderMarkers;
        }
				activeInfoWindow?.close();
        // set stroke for all polygons
				self.polygons.map(p => {
					p.setOptions({ strokeWeight: 1 });
				});
        // set stroke for this polygon
				this.setOptions({ strokeWeight: 3 });
        // count the number of work orders in this polygon
				let count = arr.reduce((a, m) => {
					if (m.getVisible() && google.maps.geometry.poly.containsLocation(m.getPosition(), this)) {
						return ++a;
					}
					return a;
				}, 0);
        // get the area of this polygon
				let area = google.maps.geometry.spherical.computeArea(this.getPath(), EARTH_RADIUS).toFixed(2);
        let content = getTooltip({
          'Name': this.title,
          'Work Orders': count,
          'Area': `${area} mi²`,
          'Spread': (area / count).toFixed(2)
        });
				infoWindow.setContent(content);
				infoWindow.setPosition(event.latLng);
				infoWindow.open(GMAP, this);
				activeInfoWindow = infoWindow;
			});
		}

		//* Google Map Events

		google.maps.event.addListener(GMAP, 'bounds_changed', () => {
			updateVisibleMarkers();
		});

		google.maps.event.addListener(GMAP, 'mousemove', event => {
			self.mouseLocation = `${event.latLng.lat().toFixed(4)}°N, ${event.latLng.lng().toFixed(4)}°W`;
		});

		google.maps.event.addListener(DRAWING_MANAGER, 'overlaycomplete', event => {
			DRAWING_MANAGER.setDrawingMode(null);
			drawings.push(event.overlay);
			addDrawingListener(event.overlay);
			event.overlay.setOptions({
				draggable: true
			});
		});

		//* Initialize Map Options

    // default features/points of interest to "off"
    setFeatures('off');

	} // end view model

	//* Models

  function ServiceAppointmentMarker(record) {
    let latitude = record.Latitude + getMarkerOffset();
    let longitude = record.Longitude + getMarkerOffset();
		this.animation = google.maps.Animation.DROP;
		this.icon = getIcon(record.Status);
		this.id = record.Id;
		this.map = GMAP;
		this.ownerId = record.OwnerId;
		this.position = new google.maps.LatLng(latitude, longitude);
    this.status = record.StatusCategory;
		this.title = decodeHtml(record.Label);
    this.infoWindow = getTooltip({
      'Id': record.Id,
      'Number': record.AppointmentNumber,
      'Status': record.Status,
      'Work Type': record.WorkTypeName,
      'Account': record.AccountName,
      'Contact': record.ContactName,
      'Address': getAddress(record)
    });
	}

	function WorkOrderMarker(record) {
    let latitude = record.Latitude + getMarkerOffset();
    let longitude = record.Longitude + getMarkerOffset();
		this.animation = google.maps.Animation.DROP;
		this.icon = getIcon(record.Status);
		this.id = record.Id;
		this.map = GMAP;
		this.ownerId = record.OwnerId;
		this.position = new google.maps.LatLng(latitude, longitude);
		this.status = record.StatusCategory;
		this.title = decodeHtml(record.Label);
    this.infoWindow = getTooltip({
      'Id': record.Id,
      'Number': record.WorkOrderNumber,
      'Status': record.Status,
      'Work Type': record.WorkTypeName,
      'Account': record.AccountName,
      'Contact': record.ContactName,
      'Address': getAddress(record)
    });
	}

  function LocationMarker(record) {
    let latitude = record.Latitude + getMarkerOffset();
    let longitude = record.Longitude + getMarkerOffset();
		this.animation = google.maps.Animation.DROP;
		this.icon = `${resourceUrl}/assets/pin_location.png`;
		this.id = record.Id;
		this.map = GMAP;
		this.position = new google.maps.LatLng(latitude, longitude);
		this.title = decodeHtml(record.Name);
    this.infoWindow = getTooltip({
      'Id': record.Id,
      'Name': record.Name,
      'Type': record.Type,
      'Open Date': formatDate(record.OpenDate),
      'Address': getAddress(record),
    });
  }

	function ResourceMarker(record) {
    let latitude = record.Latitude + getMarkerOffset();
    let longitude = record.Longitude + getMarkerOffset();
		this.animation = google.maps.Animation.DROP;
		this.icon = `${resourceUrl}/assets/pin_resource.png`;
		this.id = record.Id;
		this.map = GMAP;
		this.position = new google.maps.LatLng(latitude, longitude);
		this.title = decodeHtml(record.Name);
    this.infoWindow = getTooltip({
      'Id': record.Id,
      'Name': record.Name,
      'Label': record.Label,
      'Last Seen': formatDate(record.LastKnownLocationDate),
    });
	}

	function TerritoryMarker(record) {
    let latitude = record.Latitude + getMarkerOffset();
    let longitude = record.Longitude + getMarkerOffset();
		this.animation = google.maps.Animation.DROP;
		this.icon = `${resourceUrl}/assets/pin_territory.png`;
		this.id = record.Id;
		this.map = GMAP;
		this.position = new google.maps.LatLng(latitude, longitude);
		this.title = decodeHtml(record.Name);
    this.infoWindow = getTooltip({
      'Id': record.Id,
      'Name': record.Name,
      'Address': getAddress(record)
    });
	}

	//* Google Map Controls

	GMAP.controls[google.maps.ControlPosition.TOP_RIGHT].push(document.getElementById('counter'));
	GMAP.controls[google.maps.ControlPosition.RIGHT_BOTTOM].push(document.getElementById('legend'));
	GMAP.controls[google.maps.ControlPosition.TOP_LEFT].push(document.getElementById('options'));
	GMAP.controls[google.maps.ControlPosition.LEFT_TOP].push(document.getElementById('option-control'));
	GMAP.controls[google.maps.ControlPosition.TOP_LEFT].push(document.getElementById('mouse-location'));
	GMAP.controls[google.maps.ControlPosition.TOP_CENTER].push(document.getElementById('search-bar'));

  //* Utilities

  function decodeHtml(html) {
		let txt = document.createElement('textarea');
		txt.innerHTML = html;
		return txt.value;
	}

  function getAddress(record) {
    let arr = [record.Street, record.City, record.State, record.PostalCode, record.Country];
    return arr.filter(e => e).join(', ');
  }

  function getTooltip(object) {
    let result = '<table>';
    for (let [key, value] of Object.entries(object)) {
      if (!key || !value || key == 'Id') {
        continue;
      }
      result += `<tr>`;
      result += `<th>${key}</th>`;
      result += `<td>${value}</td>`;
      result += `</tr>`;
    }
    result += `</table>`;
    if (object.Id) {
      result += `<a href="/${object.Id}" target="_blank">View in Salesforce</a>`;
    }
    return result;
  }

  // this is to prevent markers from landing on top of each other
  function getMarkerOffset() {
    let offset = Math.random() / 4000;
    let isEven = (offset * 400000) % 2 == 0;
    return isEven ? offset : -offset;
  }

  function formatDate(value, format) {
    if (!value) {
      return '';
    }
    if (!format) {
			format = 'ddd MMM D YYYY h:mm A';
		}
		return dayjs(parseInt(value)).format(format);
  }

	function getItem(key) {
		try {
			if (localStorage !== null) {
				return JSON.parse(localStorage.getItem(key));
			} else if (sessionStorage !== null) {
				return JSON.parse(sessionStorage.getItem(key));
			}
		} catch (ignore) {}
	}

	function setItem(key, value) {
		try {
			value = JSON.stringify(value);
			if (localStorage !== null) {
				localStorage.setItem(key, value);
			} else if (sessionStorage !== null) {
				sessionStorage.setItem(key, value);
			}
		} catch (ignore) {}
	}

  function getIcon(status) {
		switch (status) {
      // appointments
      case 'Scheduled':
				return `${resourceUrl}/assets/pin_scheduled.png`;
			case 'Dispatched':
				return `${resourceUrl}/assets/pin_dispatched.png`;
      // work orders
			case 'New':
				return `${resourceUrl}/assets/pin_new.png`;
			case 'In Progress': // also an appointment status
				return `${resourceUrl}/assets/pin_inprogress.png`;
      case 'On Hold':
        return `${resourceUrl}/assets/pin_onhold.png`;
      case 'None':
      default:
        return `${resourceUrl}/assets/pin_none.png`;
		}
  }

	//* Initialize

	let viewModel = new ViewModel();

	//* Formatters

	rivets.formatters.getIcon = function(status) {
		return getIcon(status);
	};

	rivets.binders.keyupdelay.callback = viewModel.onSearch;

	//* Bind

	rivets.bind(document.body, viewModel);

}());