/*********************************

  Node Helper for MMM-GoogleSheets.

  This helper is responsible for the data pull from Google Apps Script
  At a minimum the sheet and range must be provided.

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