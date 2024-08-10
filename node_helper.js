/*********************************

  Node Helper for MMM-GoogleSheets.

  This helper is responsible for the data pull from Google Apps Script
  At a minimum the sheet and range must be provided.

*********************************/

let NodeHelper = require("node_helper");
let moment = require("moment");
const Log = require("logger");

module.exports = NodeHelper.create({
  start: function () {
    Log.info(`Starting node_helper for module [${this.name}]`);
  },

  socketNotificationReceived: async function (notification, payload) {
    if (notification === "GOOGLE_SHEETS_GET") {
      let self = this;
      let url = `${payload.url}?sheet=${payload.sheet}&range=${payload.range}`;
      Log.log(`[MMM-GoogleSheets] Sending request to ${url}`);

      try {
        let response = await fetch(url);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        try {
          let data = await response.json();
          data.instanceId = payload.instanceId;
          self.sendSocketNotification("GOOGLE_SHEETS_DATA", data);
        } catch (jsonError) {
          Log.error(
            `[MMM-Google-Sheets] **ERROR** There was an error with the request at ${moment().format("D-MMM-YY HH:mm")}. This URL should work in your browser: ${url}`
          );
          Log.error(
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
      } catch (requestError) {
        Log.error(
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
    }
  }
});
