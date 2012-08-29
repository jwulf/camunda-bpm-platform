'use strict';


angular.module('cycle.controllers', []);

function DefaultController($scope, $http, $location) {
  
  // TODO: get from cookie
  $scope.currentUser = null;
  
  $http.get('../../../currentUser').success(function(data) {
    $scope.currentUser = data;
  });
  
  $scope.$on("cycle.userChanged", function(event, user) {
    $scope.currentUser = user;
  });
  
  
  // Bread Crumb 
  var breadCrumbs = $scope.breadCrumbs = [];
  	
  $scope.$on("navigation-changed", function(evt, navigationItem) {
	  if(navigationItem==undefined) {
	    breadCrumbs.splice(0, breadCrumbs.length);
	  } else {
		var contains = false;
		var remove = 0;
		angular.forEach(breadCrumbs, function(item) {
			if(item.name == navigationItem.name) {
				contains = true;			
			}
			if(item.href.indexOf($location.path()) != 0) {
				remove++;
			}
		});
		
		for (var i = 0; i < remove; i++) {
		  breadCrumbs.pop();						
		}		
		
		if(!contains) {
			breadCrumbs.push({name:navigationItem.name, href:$location.path()});
		}		
	  }
  });
  // end Bread Crumb
};

function HomeController($scope, $routeParams) {
  $scope.$emit("navigation-changed");
}

function RoundtripDetailsController($scope, $routeParams, RoundtripDetails, $http) {
  $scope.roundtrip = RoundtripDetails.get({id: $routeParams.roundtripId });

  $scope.side = '';
  $scope.modelerName = '';
  $scope.modelerNames = [];
  $scope.connectors = [];
  $scope.selectedTreeItem = undefined;

  $scope.initModal = function() {
    getModelerNames();
    getConnectors();
  }

  // for debugging
  $scope.$watch('modelerName', function(newValue) {
    console.log("modelerName: " + newValue)
  });
  $scope.$watch('selectedTreeItem', function(newValue) {
    if (newValue) {
      console.log("selectedTreeItem: " + newValue.name)
    }
  });

  function resetModal() {
    $scope.side = '';
    $scope.modelerName = '';
    $scope.modelerNames = [];
    $scope.connectors = [];
    $scope.selectedTreeItem = undefined;
  }

  function getModelerNames() {
    $http.get('../../resources/diagram/modelerNames').success(function(data) {
      $scope.modelerNames = data;
      // set default value, when only one entry
      if (data.length == 1) {
        $scope.modelerName = data[0];
      }
    });
  }

  function getConnectors() {
	  $http.get(APP_ROOT+"secured/connector/list").success(function (data) {
		  $scope.connectors = data;
	  });
  };

  $scope.addBpmnModel = function(side) {
    $scope.side = side;
    if (side == 'rightHandSide') {
      $scope.modelerName = 'fox designer';
    }
    $("#add-model-roundtrip-dialog").modal();
  };

  $scope.cancel = function() {
    $("#add-model-roundtrip-dialog").modal('hide');
  };
  
  /**
   * Saves the roundtrip with updated details
   */
  $scope.save = function() {
//    if (!$scope.addModelRoundtripForm.$valid) {
//      return;
//    }

    console.log("Saving " + $scope.selectedTreeItem + " to Roundtrip " + $scope.roundtrip.name);
    if ($scope.side == 'leftHandSide') {
      $scope.selectedTreeItem.modeller = $scope.modelerName;
      $scope.roundtrip.leftHandSide = $scope.selectedTreeItem;
    } else {
      $scope.roundtrip.rightHandSide = $scope.selectedTreeItem;
    }
    $scope.roundtrip.$save();
    resetModal();
  };

  $scope.changeConnector = function () {
	  console.log($scope.connector);
  };

  // checkFormValid
  // required: selectedTreeItem
  // optional: modelerName
  function checkFormValid() {
    //$scope.addModelRoundtripForm.$valid
  }
};

function CreateNewRoundtripController($scope, $q, $http, $location, debouncer, Roundtrip) {

  $scope.name = '';
  
  $scope.errorClass = function(form) {
    return form.$valid || !form.$dirty ? '' : 'error';
  };
  
  $scope.$watch('name', function(newValue, oldValue) {
    checkName(newValue, oldValue);
  });
  
  $scope.cancel = function() {
    $("#create-roundtrip-dialog").modal('hide'); 
  };
  
  $scope.save = function() {
    if (!$scope.newRoundtripForm.$valid) {
      return;
    }
    
    var roundtrip = new Roundtrip({ name: $scope.name });
    roundtrip.$save(function() {

      $location.path("/roundtrip/" + roundtrip.id);
      $scope.$emit("roundtrip-added", roundtrip);
      $scope.name = '';
    });

    $("#create-roundtrip-dialog").modal('hide');
  };
  
  var checkName = debouncer.debounce(function(name) {
    isNameValid(name).then(function() {
      $scope.newRoundtripForm.name.$setValidity("occupied", true);
    }, function() {
      $scope.newRoundtripForm.name.$setValidity("occupied", false);
    });
  }, 1000);
  
  function isNameValid(name) {
    var deferred = $q.defer();
    
    if (!name || name == "") {
      deferred.resolve();
    }
    
    $http.get("../../resources/roundtrip/isNameValid?name=" + name).success(function(data) {
      if (data == "true") {
        deferred.resolve();
      } else {
        deferred.reject();
      }
    });
    
    return deferred.promise;
  }
};

function ListRoundtripsController($scope, $route, $routeParams, Roundtrip) {
  $scope.roundtrips = Roundtrip.query();
  
  var selectedRoundtripId = -1; // $routeParams.roundtripId;
  
  $scope.$watch(function() { return $routeParams.roundtripId; }, function(newValue, oldValue) {
    selectedRoundtripId = parseInt(newValue);    
    if($routeParams.roundtripId != undefined) {
    	angular.forEach($scope.roundtrips, function(item) {
    		if(item.id == $routeParams.roundtripId) {
	        	// find the roundtripname for this roundtrip-id
	        	$scope.$emit("navigation-changed", {name:item.name});
    		}
    	});
    }
  });
  
  $scope.createNew = function() {
    $("#create-roundtrip-dialog").modal(); 
  };
  
  $scope.activeClass = function(roundtrip) {
    return (roundtrip.id == selectedRoundtripId ? 'active' : '');
  };
  
  $scope.$on("roundtrip-added", function(event, roundtrip) {
    $scope.roundtrips.push(roundtrip);
  });
};
