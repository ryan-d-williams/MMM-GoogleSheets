/*********************************

  Magic Mirror Module:
  MMM-GoogleSheets
  https://github.com/jclarke0000/MMM-DarkSkyForecast

  By Ryan Williams
  MIT Licensed

*********************************/

Module.register("MMM-GoogleSheets", {

  /*
    This module uses the Nunjucks templating system introduced in
    version 2.2.0 of MagicMirror.  If you're seeing nothing on your
    display where you expect this module to appear, make sure your
    MagicMirror version is at least 2.2.0.
  */
  requiresVersion: "2.2.0",

  defaults: {
    updateInterval: 10, // minutes
    requestDelay: 0,
    language: config.language,
    updateFadeSpeed: 500,
    moduleTimestampIdPrefix: "GOOGLE_SHEETS_TIMESTAMP_",
    colorMode: "mimic",
    border: "none",
    stylesFromSheet: [], //["background-color","color","text-decoration","font-style","font-size","font-weight","text-align","vertical-align","width","height"]
    customStyles: [],
    headerStyles: [],
    styleFunc: null
  },

  getScripts: function() {
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
      sheetData: this.sheetData

    };
  },

  start: function() {

    Log.info("Starting module: " + this.name);
    
    this.sheetData = null;

    //start data poll
    var self = this;
    setTimeout(function() {

      //first data pull is delayed by config
      self.getData();

      setInterval(function() {
        self.getData();
      }, self.config.updateInterval * 60 * 1000); //convert to milliseconds

    }, this.config.requestDelay);
    

  },

  getData: function() {
    this.sendSocketNotification("GOOGLE_SHEETS_GET", {
      url: this.config.url,
      sheet: this.config.sheet,
      range: this.config.range,
      instanceId: this.identifier
    });
  },

  socketNotificationReceived: function(notification, payload) {

    if (notification == "GOOGLE_SHEETS_DATA" && payload.instanceId == this.identifier) {

      let combinedData = this.combineSheetsData(payload);
      this.sheetData = this.processSheetData(combinedData);

      this.updateDom(this.config.updateFadeSpeed);

      //this.sendNotification("GOOGLE_SHEETS_DATA_UPDATE", payload);

    }

  },
  
  combineSheetsData: function(sheetData){
    let data = sheetData.values.map((row,i) => {
      return row.map((col,j) => {
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
          width: sheetData.cell_sizes[i][j].width
        }
      });
    });
    
    return data;
  },

  processSheetData: function(data) {
    data.forEach((row, i) => {
      row.forEach((col, j) => {
                          
        col.style = "";
        
        if(this.config.colorMode === "flat"){
          //col.style = "padding: 5px 5px 5px 0px;"
        }else if(this.config.colorMode === "invert"){
          col.style = "color: " + col.background_color + ";";
        }else if(this.config.colorMode === "text"){
          col.style = "color: " + col.font_color + ";";
        }
        
        if(this.config.colorMode === "mimic"){
          col.style = "background-color:" + col.background_color + ";" +
                      "color: " + col.color + ";" +
                      "text-decoration:" + col.text_decoration + ";" +
                      "font-style:" + col.font_style + ";" +
                      "font-size:" + col.font_size + "pt;" +
                      "font-weight:" + col.font_weight + ";" +
                      "text-align:" + col.text_align + ";" +
                      "vertical-align:" + col.vertical_align+ ";" +
                      "height:" + col.height + "px;" +
                      "max-height:" + col.height + "px;" +
                      "width:" + col.width + "px;" +
                      "max-width:" + col.width + "px;";
                      
          if(col.font_size * 1.333 > col.height){
            col.style += "line-height:" + (col.font_size * 1.2) + "px;";
          }else{
            col.style += "line-height:" + col.font_size + "pt;";
          }
          
          col.data_style = "text-align:" + col.horiz_align + ";" +
                           "padding: 0.2em 0.07em;";
          
        }else{
          col.data_style = "padding: 2px 8px";
        }
        
        this.config.stylesFromSheet.forEach(style => {
          let suffix = "";
          if(style === "font-size"){
            suffix = "pt";
          }else if(style === "width" || style === "height"){
            suffix = "px";
          }
          col.style += style + ":" + col[style.replace(/-/g,"_")] + suffix + ";";
        });
        
        col.style += this.config.customStyles.join(";");
        
        if(i===0){
          col.style += this.config.headerStyles.join(";");
        }
        
        if(this.config.styleFunc){
          col.style += this.config.styleFunc(i,j,col);
        }
        
        
        if(this.config.border === "dimmed"){
          col.style += "border: 1px solid #666;";
        }else if(this.config.border === "normal"){
          col.style += "border: 1px solid #999;";
        }else if(this.config.border === "bright"){
          col.style += "border: 1px solid #fff;";
        }else if(this.config.border !== "none"){
          col.style += "border:" + this.config.border + ";";
        }
        
        
      });
    });
    
    return data;
  },

  /*
    For any config parameters that are expected as integers, this
    routine ensures they are numbers, and if they cannot be
    converted to integers, then the module defaults are used.
   */
  sanitizeNumbers: function(keys) {

    var self = this;
    keys.forEach(function(key) {
      if (isNaN(parseInt(self.config[key]))) {
        self.config[key] = self.defaults[key];
      } else {
        self.config[key] = parseInt(self.config[key]);
      }
    });
  }




});
