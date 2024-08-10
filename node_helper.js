/*********************************

  Node Helper for MMM-GoogleSheets.

  This helper is responsible for the data pull from Google Apps Script
  At a minimum the sheet and range must be provided.

*********************************/

let NodeHelper = require("node_helper");
let request = require("request");
let moment = require("moment");

module.exports = NodeHelper.create({
  start: function () {
    console.log(`Starting node_helper for module [${this.name}]`);
  },

  socketNotificationReceived: function (notification, payload) {
    if (notification === "GOOGLE_SHEETS_GET") {
      let self = this;
      let url = `${payload.url}?sheet=${payload.sheet}&range=${payload.range}`;
      console.log(`[MMM-GoogleSheets] Sending request to ${url}`);

      request({ url: url, method: "GET" }, function (error, response, body) {
        if (!error && response.statusCode == 200) {
          try {
            let resp = JSON.parse(body);
            resp.instanceId = payload.instanceId;
            self.sendSocketNotification("GOOGLE_SHEETS_DATA", resp);
          } catch (e) {
            console.log(
              `[MMM-Google-Sheets] **ERROR** There was an error with the request at ${moment().format("D-MMM-YY HH:mm")}. This URL should work in your browser: ${url}`
            );
            console.log(
              `[MMM-Google-Sheets] **ERROR** Are you sure you deployed for 'Anyone'? Check the README: https://github.com/ryan-d-williams/MMM-GoogleSheets.`
            );
            let resp = {
              error: true,
              error_msg:
                "Request failed. Are you sure you deployed for 'Anyone'? Check the URL and logs for more information.",
              instanceId: payload.instanceId
            };
            self.sendSocketNotification("GOOGLE_SHEETS_DATA", resp);
          }
        } else {
          console.log(
            `[MMM-Google-Sheets] **ERROR** There was an error with the request at ${moment().format("D-MMM-YY HH:mm")}. This URL should work in your browser: ${url}`
          );
          let resp = {
            error: true,
            error_msg:
              "Request failed. Check the URL and logs for more information.",
            instanceId: payload.instanceId
          };
          self.sendSocketNotification("GOOGLE_SHEETS_DATA", resp);
        }
      });
    }
  }
});
