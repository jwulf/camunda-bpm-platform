'use strict';

/* Services */

angular
  .module('cycle.services', ['ngResource'])
  .value('debouncer', {
    /**
     * Debounce a function call, making it callable an arbitrary number of times before it is actually executed once. 
     * 
     * @param {function()} func The function to debounce.
     * @param {number} wait The debounce timeout.
     * @return {function()} A function that can be called an arbitrary number
     *         of times within the given time.
     */
    debounce: function(func, wait) {
      var timer;
      return function() {
        var context = this, args = arguments;
        clearTimeout(timer);
        timer = setTimeout(function() {
          timer = null;
          func.apply(context, args);
        }, wait);
      };
    }
  })
  .factory('Roundtrip', function($resource){
    return $resource('../../resources/roundtrip/:id', {id: "@id"}, {});
  })
  .factory('RoundtripDetails', function($resource){
    return $resource('../../resources/roundtrip/:id/details', {id: "@id"}, {});
  });