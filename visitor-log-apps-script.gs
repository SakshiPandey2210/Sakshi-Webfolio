/**
 * VISITOR LOG  -  Google Apps Script
 *
 * Setup (2 minutes):
 * 1. Create a new Google Sheet (e.g. "Portfolio Visitors"). If an old "Visitors" tab exists, delete it.
 * 2. Extensions > Apps Script. Delete the sample code and paste this whole file.
 * 3. Change OWNER_KEY below to a private word only you know.
 * 4. Deploy > New deployment > type "Web app".  Execute as: Me   Who has access: Anyone
 * 5. Copy the Web App URL into assets/js/enhance.js:  var VISITOR_LOG_URL = "PASTE_URL_HERE";
 *
 * Every visit becomes a row: time, name (if shared), city, device, browser, OS, source (Instagram, LinkedIn...).
 * OWNER MODE: opening the site with ?owner=YOUR_OWNER_KEY makes that browser "owner":
 *   - your own visits are NOT counted or logged
 *   - the eye panel lists EVERY visitor of today with name, city, device, source and time
 *   (do this once on each of your devices; use ?owner=off to turn it off)
 * Names are NEVER shown to the public. To see names inside the website panel, open your site once as:
 *      https://YOUR-SITE/Index.html?owner=YOUR_OWNER_KEY
 * (your browser remembers it). No IP address is stored.
 */
var SHEET_NAME = "Visitors";
var OWNER_KEY = "change-me-to-a-secret";

function getSheet_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName(SHEET_NAME);
  if (!sh) {
    sh = ss.insertSheet(SHEET_NAME);
    sh.appendRow(["Time", "ID", "Name", "City", "Device", "Browser", "OS", "Source", "Timezone", "Language"]);
    sh.setFrozenRows(1);
  }
  return sh;
}

function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    var d = JSON.parse(e.postData.contents || "{}");
    var sh = getSheet_();
    if (d.action === "name") {                       // visitor shared their name later
      var last = sh.getLastRow();
      var from = Math.max(2, last - 300);
      if (last >= 2) {
        var ids = sh.getRange(from, 2, last - from + 1, 1).getValues();
        for (var i = ids.length - 1; i >= 0; i--) {
          if (ids[i][0] === d.id) { sh.getRange(from + i, 3).setValue(String(d.name || "").slice(0, 40)); break; }
        }
      }
    } else {
      sh.appendRow([new Date(), d.id || "", String(d.name || "").slice(0, 40), d.city || "", d.device || "",
                    d.browser || "", d.os || "", d.ref || "", d.tz || "", d.lang || ""]);
    }
  } finally {
    lock.releaseLock();
  }
  return ContentService.createTextOutput("ok");
}

function doGet(e) {
  var isOwner = e && e.parameter && e.parameter.key === OWNER_KEY;
  var sh = getSheet_();
  var total = Math.max(0, sh.getLastRow() - 1);
  var today = 0, recent = [];
  if (total > 0) {
    var tz = Session.getScriptTimeZone();
    var todayStr = Utilities.formatDate(new Date(), tz, "yyyy-MM-dd");
    var rows = sh.getRange(2, 1, total, 8).getValues();
    rows.forEach(function (r) {
      if (Utilities.formatDate(new Date(r[0]), tz, "yyyy-MM-dd") === todayStr) today++;
    });
    var wantToday = isOwner && e.parameter.scope === "today";
    var list = wantToday
      ? rows.filter(function (r) { return Utilities.formatDate(new Date(r[0]), tz, "yyyy-MM-dd") === todayStr; }).slice(-150)
      : rows.slice(-8);
    list.reverse().forEach(function (r) {
      var item = { time: new Date(r[0]).toISOString(), city: r[3], device: r[4], browser: r[5], source: r[7] };
      if (isOwner) item.name = r[2];
      recent.push(item);
    });
  }
  return ContentService.createTextOutput(JSON.stringify({ total: total, today: today, recent: recent }))
    .setMimeType(ContentService.MimeType.JSON);
}
