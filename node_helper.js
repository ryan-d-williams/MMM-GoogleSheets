/*********************************

  Node Helper for MMM-GoogleSheets.

  This helper is responsible for the data pull from Google Apps Script
  At a minimum the API key, Latitude and Longitude parameters
  must be provided.  If any of these are missing, the request
  to Dark Sky will not be executed, and instead an error
  will be output the the MagicMirror log.

  Additional, this module supplies two optional parameters:

    units - one of "ca", "uk2", "us", or "si"
    lang - Any of the languages Dark Sky supports, as listed here: https://darksky.net/dev/docs#response-format

  The Dark Sky API request looks like this:

    https://api.darksky.net/forecast/API_KEY/LATITUDE,LONGITUDE?units=XXX&lang=YY

*********************************/

var NodeHelper = require("node_helper");
var request = require("request");
var moment = require("moment");

module.exports = NodeHelper.create({

  start: function() {
    console.log("====================== Starting node_helper for module [" + this.name + "]");
  },

  socketNotificationReceived: function(notification, payload){
    
    if (notification === "GOOGLE_SHEETS_GET") {
      
      var self = this;
      
      var url = payload.url + "?" +
        "sheet=" + payload.sheet +
        "&range=" + payload.range;
        
      console.log(url);
        
      request({url: url, method: "GET"}, function( error, response, body) {

        if(!error && response.statusCode == 200) {

          var resp = JSON.parse(body);
          resp.instanceId = payload.instanceId;
          self.sendSocketNotification("GOOGLE_SHEETS_DATA", resp);

        } else {
          console.log( "[MMM-Google-Sheets] " + moment().format("D-MMM-YY HH:mm") + " ** ERROR ** " + error );
        }

      });

      
    }
  },


});