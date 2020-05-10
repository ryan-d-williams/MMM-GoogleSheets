# MMM-GoogleSheets

NOTE: This project is in an alpha / beta state. It has recently been added and needs some real life testing. Thanks in advance for helping to identify bugs and new features.

This a module for <strong>MagicMirror</strong><br>
https://magicmirror.builders/<br>
https://github.com/MichMich/MagicMirror

This module displays data from Google Sheets Spreadsheets on the MagicMirror. Any data that you can display on a spreadsheet you can now display on your MM! Create your own custom dashboard, stay up to date on important data, or even create your own custom modules in Google Sheets without having to write the code.

![Example 1](https://github.com/ryan-d-williams/MMM-GoogleSheets/blob/master/screenshots/Orders_Custom.png?raw=true)
![Example 2](https://github.com/ryan-d-williams/MMM-GoogleSheets/blob/master/screenshots/Orders_Mimic.png?raw=true)
![Example 3](https://github.com/ryan-d-williams/MMM-GoogleSheets/blob/master/screenshots/Projects_Custom.png?raw=true)
![Example 4](https://github.com/ryan-d-williams/MMM-GoogleSheets/blob/master/screenshots/scoreboard.png?raw=true)
![Example 5](https://github.com/ryan-d-williams/MMM-GoogleSheets/blob/master/screenshots/scoreboard_2.png?raw=true)

**NOTE:** This module uses the Nunjucks templating system introduced in version 2.2.0 of MagicMirror.  If you're seeing nothing on your display where you expect this module to appear, make sure your MagicMirror version is at least 2.2.0.


## Installation

This installation process is two steps. Step 1 involves getting Google Apps Script set up to communicate with our MagicMirror module. Step 2 is the standard MagicMirror module installation.

1. Setting up the Google Apps Script
    - Navigate to the Google Sheet that you want to pull data from
    - In the top menu, click on `Tools` and then `Script Editor`
    - In the new script editor window, click on `Resources` and then `Libraries` in the top menu (you might be asked to name the project)
    - Paste the following into the "Add a Library" field `1a6A0PqVebZUkbUC8lq__djKv6y9wZyF8y7v8dIkPpV7-mdmxwrt5SxDK`
    - Click `Add`
    - In the "Version" dropdown, select the highest available version (currently 14)
        - Make sure the "Identifer" field reads `MMMGoogleSheets`
    - Click `Save`
    - Paste the following code into the code editor (you can remove the default code)
        ```
        function doGet(e){
          return MMMGoogleSheets.doGet(e);
        }
        ```
    - At the top menu, click `Publish` and then `Deploy as Web App...`
    - In the menu that pops up, change "Who has access to the app:" to `Anyone, even anonymous`
    - Click `Deploy`
        - If this is your first time deploying the app, it will ask you to grant permissions
        - Click "Review Permissions"
        - Click on your gmail account (the one that owns the spreadsheet)
        - In the popup that says "This app isn't verified" click on "Go to {project name} (unsafe)"
        - Click on Allow
    - __Copy the URL in the following screen, this will be used in your config for the module__

2. Navigate into your MagicMirror `modules` folder and execute<br>
`git clone https://github.com/ryan-d-williams/MMM-GoogleSheets.git`.


## Configuration

At a minimum you need to supply the following required configuration parameters:

* `url` (the URL you got from step 1 of the installation process)
* `sheet` (sheet name you want to get the range from)
* `range` (range of cells you want to display on the MM)

### Other optional parameters

<table>
  <thead>
    <tr>
      <th>Option</th>
      <th>Description</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><code>updateInterval</code></td>
      <td>How frequently, in minutes, to refesh data from Google Sheets.<br><br><strong>Type</strong> <code>Number</code><br>Defaults to <code>10</code></td>
    </tr>
    <tr>
      <td><code>requestDelay</code></td>
      <td>In milliseconds, how long to delay the request.<br><br><strong>Type</strong> <code>Number</code><br>Defaults to <code>0</code></td>
    </tr>
    <tr>
      <td><code>updateFadeSpeed</code></td>
      <td>How quickly in milliseconds to fade the module out and in upon data refresh.  Set this to <code>0</code> for no fade.<br><br><strong>Type</strong> <code>Number</code><br>Defaults to <code>500</code> (i.e.: 1/2 second).</td>
    </tr>
    <tr>
      <td><code>language</code></td>
      <td>The language to be used for display.<br><br><strong>Type</strong> <code>String</code><br>Defaults to the language set for Magic Mirror, but can be overridden with any of the language codes listed here: https://darksky.net/dev/docs#request-parameters.</td>
    </tr>
    <tr>
      <td><code>cellStyle</code></td>
      <td>How to style the spreadsheet data. Options are: <br>
        <code>mimic</code> - Mimics the styling of the Google Sheet<br>
        <code>flat</code> - No styling applied. Data is shown in default MM styling<br>
        <code>text</code> - Only the Google Sheet font colors are applied<br>
        <code>invert</code> - Cell background colors are used for text colors. Good for sheets that have lots of cell colors<br>
        <code>custom</code> - Custom user styling using other config options (below)<br>
        <br><br><strong>Type</strong> <code>String</code><br>Defaults to <code>mimic</code></td>
    </tr>
    <tr>
      <td><code>border</code></td>
      <td>Applies a border to the cells. Options are: <br>
        <code>dimmed</code> - MM dimmed colored border (#666)<br>
        <code>normal</code> - MM normal colored border (#999)<br>
        <code>bright</code> - MM bright colored border (#fff)<br>
        <code>{CUSTOM CSS}</code> - Custom CSS string that will applied as the border property. This string must be a <a href="https://developer.mozilla.org/en-US/docs/Web/CSS/border">valid CSS border property</a> (i.e. "1px solid red").<br>
        <br><br><strong>Type</strong> <code>String</code><br>Defaults to <code>none</code><br /></td>
    </tr>
    <tr>
      <td><code>stylesFromSheet</code></td>
      <td>List of style properties to use from the Google Sheet. This is useful if you want to mimic some of the Google Sheet styling but not all of it. Available properties are <code>background-color</code>, <code>color</code>, <code>text-decoration</code>, <code>font-style</code>, <code>font-size</code>, <code>font-weight</code>, <code>text-align</code>, <code>vertical-align</code>, <code>width</code>, and <code>height</code><br><br>
        Example: <code>["background-color", "font-size"]</code><br><br>
          <b>Note: This property will  override cellStyle properties if there are conflicts</b>.<br><br><strong>Type</strong> <code>String[]</code><br>Defaults to <code>[]</code></td>
    </tr>
    <tr>
      <td><code>customStyles</code></td>
      <td>List of custom CSS styles that will be applied to each cell<br><br>
        Example: <code>["padding: 5px 10px","font-size:25px"]</code><br><br>
        <b>Note: This property will  override cellStyle properties if there are conflicts</b><br><br><strong>Type</strong> <code>String[]</code><br>Defaults to <code>[]</code></td>
    </tr>
    <tr>
      <td><code>headerStyles</code></td>
      <td>Similar to customStyles, but only applied to the first row (header row)<br><br>
          <b>Note: This property will  override cellStyle properties if there are conflicts</b><br><br><strong>Type</strong> <code>String[]</code><br>Defaults to <code>[]</code></td>
    </tr>
    <tr>
      <td><code>styleFunc</code></td>
      <td>Custom function that returns styles for each cell. The function inputs are the row number, column number, and the Google Sheets properties of the cell at that row and column number. The function should return a valid CSS property string that will be applied to that cell.<br><br>
        Example (color every other row text red): <code>(rowNum, colNum, cellProps) => {if(rowNum%2 == 0){return "color:red;"}}</code><br><br>
        The available properties of the third argument to the function are <code>background_color</code>, <code>color</code>, <code>text_decoration</code>, <code>font_style</code>, <code>font_size</code>, <code>font_weight</code>, <code>text_align</code>, <code>vertical_align</code>, <code>height</code>, <code>width</code>, <code>display</code> (true if the cell will be rendered) <br>
        Note that these properties are not CSS properties, but rather the attributes pulled from Google Sheets. These attributes will not be applied to the cell unless you are in a mimic mode with <code>cellStyle</code> or <code>stylesFromSheet</code> <br><br>
        <b>Note: This property will  override cellStyle properties if there are conflicts</b><br><br><strong>Type</strong> <code>Function</code><br>Defaults to <code>null</code></td>
    </tr>
    <tr>
  </tbody>
</table>

## Sample Configuration

```
{
  module: "MMM-GoogleSheets",
  header: "Google Sheets",
  position: "top_right",
  config: {
    url: "URL From Installation Step 1",
    sheet: "Sheet1",
    range: "A1:B6"
  }
}
```
## Using the module for different Google Sheets

If you want to use multiple instances of the module for multiple different Google Sheet ranges, you will need to follow step 1 of the installation process for each sheet (you need to set up a different script for each spreadsheet and get a new url for each instance of the module).

If you are using multiple instances of the module for the same spreadsheet, you can use the same URL and only one script is required.

In the future (if there is demand) I will update the library to use one script for any spreadsheet in Google Drive

## Limitations

- When mimicking cell styling from Google Sheets, I am unable to pull the border styles (it does not exist as an option in the API without a [major hack](https://stackoverflow.com/questions/48754286/retrieving-google-sheets-cell-border-style-programmatically). However, this has been mitigated with the `border` [property above](#other-optional-parameters) where you can add your own custom border
- When mimicking cell styling from Google Sheets, bandings (alternating row / column colors) are not mimicked (yet - in a future version this will be allowed). However, this has been mitigated with the `styleFunc` [property above](#other-optional-parameters) where you can add your own custom function to style bandings (or any other conditional styles that you want).

## In the Wild

Send me pictures of your Google Sheets module and I'll add them here

## Bugs & Feature Requests

If you find an issue or want a new feature, [add it as an issue](https://github.com/ryan-d-williams/MMM-GoogleSheets/issues) and I'll be happy to (try to) make it happen

## Google Apps Script Library

The library feature of google apps script is used to make it easy to update the code in the future for new features or bug fixes. If you feel more comfortable seeing the code yourself, you can copy the code from the file in this repo. Note that if you choose this option, you will need to manually copy-paste future updates in.

### Updating the library

If the libary requires an update (your version is less than the version listed above), you should follow the following steps:
    
1. Open the script file (`Tools` -> `Script Editor` from your spreadsheet)
2. Click on `Resources` -> `Libraries`
3. Update the "Version" dropdown to the latest version
4. __IMPORTANT: You must still redeploy the code as a web app for the changes to take place__
    - Click on `Publish` -> `Deploy as web app...`
    - __ALSO IMPORTANT: You must select a new version (whatever your current version is + 1) for your deployed changes to take affect__
    - Click `Deploy`

## Attributions

I used @jclarke0000's DarkSky module as a template to build this module
https://github.com/jclarke0000/MMM-DarkSkyForecast
