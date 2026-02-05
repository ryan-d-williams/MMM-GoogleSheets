/*********************************

  Node Helper for MMM-GoogleSheets.

  This helper is responsible for the data pull from Google Apps Script
  At a minimum the sheet and range must be provided.

*********************************/

let NodeHelper = require("node_helper");
const Log = require("logger");

module.exports = NodeHelper.create({
	start: function () {
		Log.info(`Starting node_helper for module [${this.name}]`);
	},

	socketNotificationReceived: async function (notification, payload) {
		if (notification === "GOOGLE_SHEETS_GET" && !payload.handled) {
			let self = this;

			payload.handled = true;
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
						`[MMM-Google-Sheets] **ERROR** There was an error with the request. This URL should work in your browser: ${url}`
					);
					Log.error(
						`[MMM-Google-Sheets] **ERROR** Are you sure you deployed for 'Anyone'? Check the README: https://github.com/ryan-d-williams/MMM-GoogleSheets.`
					);
					Log.error("Full Error Message:");
					Log.error(jsonError);
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
					`[MMM-Google-Sheets] **ERROR** There was an error with the request. This URL should work in your browser: ${url}`
				);
				Log.error("Full Error Message:");
				Log.error(requestError);
				let resp = {
					error: true,
					error_msg:
						"Request failed. Check the URL and logs for more information.",
					instanceId: payload.instanceId
				};
				self.sendSocketNotification("GOOGLE_SHEETS_DATA", resp);
			}
		} else if (notification === "GOOGLE_SHEETS_UPDATE_CELL" && !payload.handled) {
			let self = this;

			payload.handled = true;
			let url = payload.url;

			Log.log(`[MMM-GoogleSheets] Sending ${payload.updateType} update to ${url}`);
			Log.log(`[MMM-GoogleSheets] Row: ${payload.row}, Col: ${payload.col}`);

			// Build the POST body based on update type
			let postBody = {
				sheet: payload.sheet,
				row: payload.row,
				col: payload.col,
				updateType: payload.updateType
			};

			if (payload.updateType === "checkbox") {
				postBody.checked = payload.checked;
				Log.log(`[MMM-GoogleSheets] Checked: ${payload.checked}`);
			} else if (payload.updateType === "dropdown") {
				postBody.value = payload.value;
				Log.log(`[MMM-GoogleSheets] Value: ${payload.value}`);
			}

			try {
				let response = await fetch(url, {
					method: "POST",
					headers: {
						"Content-Type": "application/json"
					},
					body: JSON.stringify(postBody)
				});

				if (!response.ok) {
					throw new Error(`HTTP error! status: ${response.status}`);
				}

				try {
					let data = await response.json();
					data.instanceId = payload.instanceId;
					self.sendSocketNotification("GOOGLE_SHEETS_UPDATE_RESULT", data);

					if (!data.error) {
						Log.log(`[MMM-GoogleSheets] Checkbox updated successfully`);
					} else {
						Log.error(`[MMM-GoogleSheets] Error updating checkbox: ${data.error_msg}`);
					}
				} catch (jsonError) {
					Log.error(
						`[MMM-Google-Sheets] **ERROR** There was an error parsing the update response.`
					);
					Log.error("Full Error Message:");
					Log.error(jsonError);
					let resp = {
						error: true,
						error_msg: "Failed to parse update response.",
						instanceId: payload.instanceId
					};
					self.sendSocketNotification("GOOGLE_SHEETS_UPDATE_RESULT", resp);
				}
			} catch (requestError) {
				Log.error(
					`[MMM-Google-Sheets] **ERROR** There was an error updating the checkbox.`
				);
				Log.error("Full Error Message:");
				Log.error(requestError);
				let resp = {
					error: true,
					error_msg: "Request failed. Check the logs for more information.",
					instanceId: payload.instanceId
				};
				self.sendSocketNotification("GOOGLE_SHEETS_UPDATE_RESULT", resp);
			}
		}
	}
});
