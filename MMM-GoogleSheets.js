/* eslint-disable no-undef */
/*********************************

  MagicMirror² Module:
  MMM-GoogleSheets
  https://github.com/ryan-d-williams/MMM-GoogleSheets

  By Ryan Williams
  MIT Licensed

*********************************/
Module.register("MMM-GoogleSheets", {
  requiresVersion: "2.2.0",

  defaults: {
    updateInterval: 10, // minutes
    requestDelay: 0,
    language: config.language,
    updateFadeSpeed: 500,
    moduleTimestampIdPrefix: "GOOGLE_SHEETS_TIMESTAMP_",
    cellStyle: "mimic",
    border: "none",
    stylesFromSheet: [], //["background-color","color","text-decoration","font-style","font-size","font-weight","text-align","vertical-align","width","height"]
    customStyles: [],
    headerStyles: [],
    styleFunc: null,
    usePassword: false,
    password: "",
    scroll: false,
    maxTableHeight: 5,
    scrollTime: 1000,
    scrollDelayTime: 5000,
    smoothScroll: false
  },

  validCellStyles: ["mimic", "flat", "text", "invert", "custom"],
  validStylesFromSheet: [
    "background-color",
    "color",
    "text-decoration",
    "font-style",
    "font-size",
    "font-weight",
    "text-align",
    "vertical-align",
    "width",
    "height"
  ],

  getScripts: function () {
    return [];
  },

  getStyles: function () {
    return ["MMM-GoogleSheets.css"];
  },

  getTemplate: function () {
    return "mmm-googlesheets.njk";
  },

  /*
    Data object provided to the Nunjucks template. The template does not
    do any data minipulation; the strings provided here are displayed as-is.
    The only logic in the template are conditional blocks that determine if
    a certain section should be displayed, and simple loops for the hourly
    and daily forecast.
   */
  getTemplateData: function () {
    return {
      phrases: {
        loading: this.translate("LOADING")
      },
      loading: this.sheetData === null,
      config: this.config,
      sheetData: this.sheetData,
      errors: this.errors,
      anyErrors: this.anyErrors,
      paramErrors: this.paramErrors,
      runtimeErrors: this.runtimeErrors,
      runtimeErrorMsg: this.runtimeErrorMsg
    };
  },

  start: function () {
    Log.info("Starting module: " + this.name);

    this.sheetData = null;
    this.anyErrors = false;
    this.paramErrors = false;
    this.runtimeErrors = false;
    this.runtimeErrorMsg = "";
    this.errors = {
      url: false,
      sheet: false,
      range: false
    };

    this.tableScrolling = new TableScrolling(this.config);
    this.dataProcessing = new GoogleSheetsDataProcessing(this.config);

    // Sanitize required parameters
    if (!Object.hasOwn(this.config, "url") || this.config.url.length == 0) {
      this.errors.url = true;
      this.paramErrors = true;
    }

    if (!Object.hasOwn(this.config, "sheet") || this.config.sheet.length == 0) {
      this.errors.sheet = true;
      this.paramErrors = true;
    }

    if (!Object.hasOwn(this.config, "range") || this.config.range.length == 0) {
      this.errors.range = true;
      this.paramErrors = true;
    }

    this.anyErrors = this.paramErrors;

    if (this.anyErrors) {
      this.updateDom(this.config.updateFadeSpeed);
    } else {
      if (this.validCellStyles.indexOf(this.config.cellStyle) == -1) {
        this.config.cellStyle = this.defaults.cellStyle;
      }

      if (this.config.stylesFromSheet.length) {
        this.config.stylesFromSheet = this.config.stylesFromSheet.filter(
          (style) => {
            return this.validStylesFromSheet.indexOf(style) !== -1;
          }
        );
      }

      this.sanitizeNumbers([
        "updateInterval",
        "requestDelay",
        "updateFadeSpeed",
        "maxTableHeight",
        "scrollTime",
        "scrollDelayTime"
      ]);

      let self = this;
      setTimeout(function () {
        //first data pull is delayed by config
        self.getData();

        setInterval(
          function () {
            self.getData();
          },
          self.config.updateInterval * 60 * 1000
        ); //convert to milliseconds
      }, this.config.requestDelay);
    }
  },

  getData: function () {
    this.sendSocketNotification("GOOGLE_SHEETS_GET", {
      url: this.config.url,
      sheet: this.config.sheet,
      range: this.config.range,
      instanceId: this.identifier
    });
  },

  notificationReceived: async function (notification) {
    if (notification == "MODULE_DOM_UPDATED") {
      if (this.config.scroll) {
        this.tableScrolling.doScrolling(this.sheetData.length);
      }
    }
  },

  socketNotificationReceived: async function (notification, payload) {
    if (
      notification == "GOOGLE_SHEETS_DATA" &&
      payload.instanceId == this.identifier
    ) {
      this.runtimeErrors = false;
      this.anyErrors = false;
      if (payload.error) {
        this.runtimeErrors = true;
        this.anyErrors = true;
        this.runtimeErrorMsg = payload.error_msg;
        this.updateDom(this.config.updateFadeSpeed);
      } else {
        let combinedData = this.dataProcessing.combineSheetsData(payload);
        let dataWithMerges = this.dataProcessing.processMerges(
          combinedData,
          payload.merge_data
        );
        this.sheetData = this.dataProcessing.processCellStyles(dataWithMerges);

        this.updateDom(this.config.updateFadeSpeed);
      }
      Log.info("New google sheets data received");
      //this.sendNotification("GOOGLE_SHEETS_DATA_UPDATE", payload);
    }
  },

  /*
    For any config parameters that are expected as integers, this
    routine ensures they are numbers, and if they cannot be
    converted to integers, then the module defaults are used.
   */
  sanitizeNumbers: function (keys) {
    let self = this;
    keys.forEach(function (key) {
      if (isNaN(parseInt(self.config[key]))) {
        self.config[key] = self.defaults[key];
      } else {
        self.config[key] = parseInt(self.config[key]);
      }
    });
  }
});

class TableScrolling {
  constructor(config) {
    this.currentRowScroll = config.maxTableHeight + 1;
    this.fullTableLength = 0;
    this.config = config;
  }

  async doScrolling(fullTableLength) {
    this.fullTableLength = fullTableLength;
    this.setTableHeight(this.config.maxTableHeight);
    while (true) {
      if (this.currentRowScroll > this.fullTableLength) {
		this.resetScroll();
        this.currentRowScroll = this.config.maxTableHeight;
      }

      await this.scrollToRow(this.currentRowScroll, this.config.scrollTime);
      this.currentRowScroll++;
      await new Promise((resolve) =>
        setTimeout(resolve, this.config.scrollDelayTime)
      );
    }
  }

  setTableHeight(row_num) {
    let wrapper_el = document.getElementsByClassName("table-wrapper")[0];
    let row_el =
      document.getElementsByClassName("sheets-table-row")[row_num - 1];

    wrapper_el.style.maxHeight = `${row_el.offsetHeight + row_el.offsetTop}px`;
  }

  resetScroll(){
	let wrapper_el = document.getElementsByClassName("table-wrapper")[0];
	wrapper_el.scrollTop = 0;
  }

  async scrollToRow(row_num, duration) {
    let wrapper_el = document.getElementsByClassName("table-wrapper")[0];
    let row_el =
      document.getElementsByClassName("sheets-table-row")[row_num - 1];

    let totalScrollDistance;
    if (this.config.smoothScroll) {
      let tableRows = Array.from(
        document.getElementsByClassName("sheets-table-row")
      );
      totalScrollDistance =
        tableRows.reduce((acc, row) => acc + row.scrollHeight, 0) /
        tableRows.length;
    } else {
      totalScrollDistance =
        row_el.offsetTop -
        wrapper_el.offsetHeight +
        row_el.offsetHeight -
        wrapper_el.scrollTop;
    }
    let scrollY = wrapper_el.scrollTop;
    let newScrollTop = totalScrollDistance + scrollY;
    let oldTimestamp = document.timeline.currentTime;

    await new Promise((resolve) => {
      requestAnimationFrame(resolve);
    });

    while (scrollY < newScrollTop) {
      let newTimestamp = document.timeline.currentTime;
      scrollY +=
        (totalScrollDistance * (newTimestamp - oldTimestamp)) / duration;
      wrapper_el.scrollTop = scrollY;
      oldTimestamp = newTimestamp;

      await new Promise((resolve) => {
        requestAnimationFrame(resolve);
      });
    }
    wrapper_el.scrollTop = newScrollTop;
  }
}

class GoogleSheetsDataProcessing {
  constructor(config) {
    this.config = config;
  }

  combineSheetsData(sheetData) {
    let data = sheetData.values.map((row, i) => {
      return row.map((col, j) => {
        return {
          value: col,
          background_color: sheetData.backgrounds[i][j],
          color: sheetData.font_colors[i][j],
          text_decoration: sheetData.font_lines[i][j],
          font_style: sheetData.font_styles[i][j],
          font_size: sheetData.font_sizes[i][j],
          font_weight: sheetData.font_weights[i][j],
          text_align: sheetData.horiz_align[i][j],
          vertical_align: sheetData.vert_align[i][j],
          height: sheetData.cell_sizes[i][j].height,
          width: sheetData.cell_sizes[i][j].width,
          merge: false,
          display: true
        };
      });
    });

    return data;
  }

  processCellStyles(data) {
    data.forEach((row, i) => {
      row.forEach((col, j) => {
        col.style = "";

        if (this.config.cellStyle === "flat") {
          //col.style = "padding: 5px 5px 5px 0px;"
        } else if (this.config.cellStyle === "invert") {
          col.style = "color: " + col.background_color + ";";
        } else if (this.config.cellStyle === "text") {
          col.style = "color: " + col.color + ";";
        }

        if (this.config.cellStyle === "mimic") {
          col.style = `
				background-color: ${col.background_color};
				color: ${col.color};
				text-decoration: ${col.text_decoration};
				font-style: ${col.font_style};
				font-size: ${col.font_size}pt;
				font-weight: ${col.font_weight};
				text-align: ${col.text_align};
				vertical-align: ${col.vertical_align};
				height: ${col.height}px;
				max-height: ${col.height}px;
				width: ${col.width}px;
				max-width: ${col.width}px;
			`;

          if (col.font_size * 1.333 > col.height) {
            col.style += "line-height:" + col.font_size * 1.2 + "px;";
          } else {
            col.style += "line-height:" + col.font_size + "pt;";
          }

          col.data_style = `text-align:${col.horiz_align};padding: 0.2em 0.07em;`;
        } else {
          col.data_style = "padding: 2px 8px";
        }

        this.config.stylesFromSheet.forEach((style) => {
          let suffix = "";
          if (style === "font-size") {
            suffix = "pt";
          } else if (style === "width" || style === "height") {
            suffix = "px";
          }
          col.style +=
            style + ":" + col[style.replace(/-/g, "_")] + suffix + ";";
        });

        col.style += this.config.customStyles.join(";") + ";";

        if (i === 0) {
          col.style += this.config.headerStyles.join(";") + ";";
        }

        if (this.config.styleFunc) {
          col.style += this.config.styleFunc(i, j, col);
        }

        if (this.config.border === "dimmed") {
          col.style += "border: 1px solid #666;";
        } else if (this.config.border === "normal") {
          col.style += "border: 1px solid #999;";
        } else if (this.config.border === "bright") {
          col.style += "border: 1px solid #fff;";
        } else if (this.config.border !== "none") {
          col.style += "border:" + this.config.border + ";";
        }
      });
    });

    return data;
  }

  processMerges(data, merges) {
    merges.forEach((merge) => {
      let row = merge.start_row;
      let col = merge.start_col;
      data[row][col].merge = true;
      data[row][col].merge_data = {
        colspan: merge.num_cols,
        rowspan: merge.num_rows
      };

      let cum_height = 0;
      for (let i = row; i < row + merge.num_rows; i++) {
        let cum_width = 0;
        for (let j = col; j < col + merge.num_cols; j++) {
          data[i][j].display = false;
          cum_width += data[i][j].width;
        }
        data[row][col].width = cum_width;

        cum_height += data[i][col].height;
      }
      data[row][col].height = cum_height;
    });

    return data;
  }
}
