function doGet(e) {

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
  if (sheet == null) {
    let res = {
      error: true,
      error_msg: `Sheet name "${sheet_name}" does not exist in the spreadsheet`
    }
    return ContentService.createTextOutput(JSON.stringify(res)).setMimeType(ContentService.MimeType.JSON);
  }

  // Return error if the range string is less than 2 characters
  if (rangeA1.length < 2) {
    let res = {
      error: true,
      error_msg: "Missing required parameter 'range' or passed value is invalid"
    }
    return ContentService.createTextOutput(JSON.stringify(res)).setMimeType(ContentService.MimeType.JSON);
  }

  // Force the formulas to update
  SpreadsheetApp.getActiveSpreadsheet().toast("Recalculating...", "Status", 0.1);
  SpreadsheetApp.flush();

  let range;
  if (rangeA1 == "auto") {
    range = sheet.getDataRange();
  } else {
    range = sheet.getRange(rangeA1);
  }

  let range_start_row = range.getRow();
  let range_start_col = range.getColumn();
  let range_num_rows = range.getNumRows();
  let range_num_cols = range.getNumColumns();

  let range_values = range.getDisplayValues();
  let cell_sizes = range_values.map((row, i) => {
    return row.map((cell, j) => {
      return {
        height: sheet.getRowHeight(range_start_row + i),
        width: sheet.getColumnWidth(range_start_col + j)
      }
    });
  });

  let merged_ranges = range.getMergedRanges();
  let merge_data = [];
  merged_ranges.forEach(rng => {

    let rng_start_row = rng.getRow();
    let rng_start_col = rng.getColumn();
    let rng_num_rows = rng.getNumRows();
    let rng_num_cols = rng.getNumColumns();
    merge_data.push({
      start_row: rng_start_row - range_start_row,
      start_col: rng_start_col - range_start_col,
      end_row: Math.min((rng_start_row - range_start_row) + (rng_num_rows - 1), range_num_rows - 1),
      end_col: Math.min((rng_start_col - range_start_col) + (rng_num_cols - 1), range_num_cols - 1),
      num_rows: Math.min(range_num_rows, rng_num_rows),
      num_cols: Math.min(range_num_cols, rng_num_cols)
    });
  });

  let validations = range_values.map((row, i) => {
    return row.map((cell, j) => {
      let cellRange = sheet.getRange(range_start_row + i, range_start_col + j);
      let rule = cellRange.getDataValidation();

      let validation_data = {
        checkbox: false,
        dropdown: false,
        is_checked: false,
        dropdown_options: [],
        dropdown_selected: ""
      };

      if (rule) {
        let criteriaType = rule.getCriteriaType();

        // Check if it's a checkbox
        if (criteriaType === SpreadsheetApp.DataValidationCriteria.CHECKBOX) {
          validation_data.checkbox = true;
          validation_data.is_checked = (cell === "TRUE" || cell === "true" || cell === true);
        }

        // Check if it's a dropdown
        if (criteriaType === SpreadsheetApp.DataValidationCriteria.VALUE_IN_LIST ||
          criteriaType === SpreadsheetApp.DataValidationCriteria.VALUE_IN_RANGE) {
          validation_data.dropdown = true;

          let criteriaValues = rule.getCriteriaValues();
          if (criteriaValues && criteriaValues[0]) {
            if (Array.isArray(criteriaValues[0])) {
              validation_data.dropdown_options = criteriaValues[0];
            } else {
              // If it's a range reference, get the values from that range
              let rangeValues = criteriaValues[0].getValues();
              validation_data.dropdown_options = rangeValues.flat().filter(v => v !== "");
            }
          }
          validation_data.dropdown_selected = cell;
        }
      }

      return validation_data;
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
    validations: validations,              // NEW
    range_start_row: range_start_row,      // NEW
    range_start_col: range_start_col,      // NEW
    error: false
  }

  return ContentService.createTextOutput(JSON.stringify(res)).setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  try {
    let params = JSON.parse(e.postData.contents);

    let sheet_name = params.sheet;
    let row = params.row;
    let col = params.col;
    let updateType = params.updateType; // NEW: "checkbox" or "dropdown"

    let sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheet_name);

    if (sheet == null) {
      let res = {
        error: true,
        error_msg: `Sheet name "${sheet_name}" does not exist in the spreadsheet`
      }
      return ContentService.createTextOutput(JSON.stringify(res)).setMimeType(ContentService.MimeType.JSON);
    }

    // Get the cell and its validation rule
    let cell = sheet.getRange(row, col);
    let rule = cell.getDataValidation();

    if (!rule) {
      let res = {
        error: true,
        error_msg: "Cell does not have data validation"
      }
      return ContentService.createTextOutput(JSON.stringify(res)).setMimeType(ContentService.MimeType.JSON);
    }

    let criteriaType = rule.getCriteriaType();

    // Handle checkbox update
    if (updateType === "checkbox") {
      let checked = params.checked;

      if (criteriaType === SpreadsheetApp.DataValidationCriteria.CHECKBOX) {
        cell.setValue(checked);
        SpreadsheetApp.getActiveSpreadsheet().toast("Recalculating...", "Status", 0.1);
        SpreadsheetApp.flush();

        let res = {
          success: true,
          error: false
        }
        return ContentService.createTextOutput(JSON.stringify(res)).setMimeType(ContentService.MimeType.JSON);
      } else {
        let res = {
          error: true,
          error_msg: "Cell is not a checkbox"
        }
        return ContentService.createTextOutput(JSON.stringify(res)).setMimeType(ContentService.MimeType.JSON);
      }
    }

    // Handle dropdown update (NEW)
    if (updateType === "dropdown") {
      let value = params.value;

      if (criteriaType === SpreadsheetApp.DataValidationCriteria.VALUE_IN_LIST ||
          criteriaType === SpreadsheetApp.DataValidationCriteria.VALUE_IN_RANGE) {

        // Validate that the value is in the allowed list
        let criteriaValues = rule.getCriteriaValues();
        let allowedValues = [];

        if (criteriaValues && criteriaValues[0]) {
          if (Array.isArray(criteriaValues[0])) {
            allowedValues = criteriaValues[0];
          } else {
            let rangeValues = criteriaValues[0].getValues();
            allowedValues = rangeValues.flat().filter(v => v !== "");
          }
        }

        // Only update if value is valid
        if (allowedValues.includes(value)) {
          cell.setValue(value);
          SpreadsheetApp.getActiveSpreadsheet().toast("Recalculating...", "Status", 0.1);
          SpreadsheetApp.flush();

          let res = {
            success: true,
            error: false
          }
          return ContentService.createTextOutput(JSON.stringify(res)).setMimeType(ContentService.MimeType.JSON);
        } else {
          let res = {
            error: true,
            error_msg: `Value "${value}" is not in the allowed dropdown options`
          }
          return ContentService.createTextOutput(JSON.stringify(res)).setMimeType(ContentService.MimeType.JSON);
        }
      } else {
        let res = {
          error: true,
          error_msg: "Cell is not a dropdown"
        }
        return ContentService.createTextOutput(JSON.stringify(res)).setMimeType(ContentService.MimeType.JSON);
      }
    }

    // Unknown update type
    let res = {
      error: true,
      error_msg: `Unknown updateType: ${updateType}`
    }
    return ContentService.createTextOutput(JSON.stringify(res)).setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    let res = {
      error: true,
      error_msg: error.toString()
    }
    return ContentService.createTextOutput(JSON.stringify(res)).setMimeType(ContentService.MimeType.JSON);
  }
}
