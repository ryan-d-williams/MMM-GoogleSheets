function doGet(e){

  let params = e.parameters;

  /*if(params["usePassword"][0]){
    if(params["password"][0] !== password){
      return ContentService.createTextOutput(JSON.stringify("Error: Wrong Password")).setMimeType(ContentService.MimeType.JSON);
    }
  }*/

  let sheet_name = params["sheet"][0];
  let rangeA1 = params["range"][0];

  let sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheet_name);

  // Return error of sheet doesn't exist
  if (sheet == null){
    let res = {
      error: true,
      error_msg: `Sheet name "${sheet_name}" does not exist in the spreadsheet`
    }
    return ContentService.createTextOutput(JSON.stringify(res)).setMimeType(ContentService.MimeType.JSON);
  }

  // Return error if the range string is less than 2 characters
  if(rangeA1.length < 2){
    let res = {
      error: true,
      error_msg: "Missing required parameter 'range' or passed value is invalid"
    }
    return ContentService.createTextOutput(JSON.stringify(res)).setMimeType(ContentService.MimeType.JSON);
  }

  // Force the formulas to update
  let originalCellValue = sheet.getRange("A1").getValue()
  sheet.getRange("A1").setValue("update")
  sheet.getRange("A1").setValue(originalCellValue)
  SpreadsheetApp.flush();

  let range;
  if(rangeA1 == "auto"){
    range = sheet.getDataRange(); // getDataRange will get the range for any data available in the sheet
  }else{
    range = sheet.getRange(rangeA1); // Use getRangeList when update to multiple ranges
  }

  let range_values = range.getDisplayValues();
  let cell_sizes = range_values.map((row, i) => {
     return row.map((cell, j) => {
       return {
          height: sheet.getRowHeight(i+1),
          width: sheet.getColumnWidth(j+1)
       }
     });
  });

  let range_start_row = range.getRow();
  let range_start_col = range.getColumn();
  let range_num_rows = range.getNumRows();
  let range_num_cols = range.getNumColumns();

  let merged_ranges = range.getMergedRanges();
  let merge_data = [];
  merged_ranges.forEach(rng => {

     let rng_start_row = rng.getRow();
     let rng_start_col = rng.getColumn();
     let rng_num_rows = rng.getNumRows();
     let rng_num_cols = rng.getNumColumns();
     merge_data.push({start_row: rng_start_row - range_start_row,
                      start_col: rng_start_col - range_start_col,
                      end_row: Math.min((rng_start_row - range_start_row) + (rng_num_rows-1), range_num_rows-1),
                      end_col: Math.min((rng_start_col - range_start_col) + (rng_num_cols-1), range_num_cols-1),
                      num_rows: Math.min(range_num_rows, rng_num_rows),
                      num_cols: Math.min(range_num_cols, rng_num_cols)
                     });
  });

  let res = {
    values: range_values,
    backgrounds: range.getBackgrounds(),
    font_colors: range.getFontColors(),
    font_lines: range.getFontLines(),
    font_styles: range.getFontStyles(),
    font_sizes: range.getFontSizes(),
    font_weights: range.getFontWeights(),
    horiz_align: range.getHorizontalAlignments(),
    vert_align: range.getVerticalAlignments(),
    font_families: range.getFontFamilies(),
    cell_sizes: cell_sizes,
    merge_data: merge_data,
    error: false
  }

 return ContentService.createTextOutput(JSON.stringify(res)).setMimeType(ContentService.MimeType.JSON);
}
