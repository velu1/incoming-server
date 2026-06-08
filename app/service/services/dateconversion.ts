import moment from "moment";

export function convertToMongoDate(dateString: string): string {
  let date: moment.Moment;

  try {
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
      // YYYY-MM-DD
      date = moment(dateString, "YYYY-MM-DD");
    } else if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateString)) {
      // DD/MM/YYYY
      date = moment(dateString, "DD/MM/YYYY");
    } else if (/^\d{2}-\d{2}-\d{4}$/.test(dateString)) {
      // DD-MM-YYYY
      date = moment(dateString, "DD-MM-YYYY");
    } else if (/^\d{4}\/\d{2}\/\d{2}$/.test(dateString)) {
      // YYYY/MM/DD
      date = moment(dateString, "YYYY/MM/DD");
    } else if (/^\d{2}\/\d{2}\/\d{2}$/.test(dateString)) {
      // yy/mm/dd //in sinsera
      const year = Number(dateString.slice(0, 2)) + 2000; // Convert to full year
      const month = Number(dateString.slice(3, 5)) - 1; // Month is zero-indexed in Moment.js
      const day = Number(dateString.slice(6, 8));
      date = moment().year(year).month(month).date(day);
    } else if (dateString.length === 6 && dateString.includes("+")) {
      // YYWW+M //in texas
      const year = Number(dateString.slice(0, 2)) + 2000; // Convert to full year
      const week = Number(dateString.slice(3, 5)); // Convert to number
      date = moment().year(year).isoWeek(week);
    } else if (dateString.length === 4) {
      // YYWW
      const year = Number(dateString.slice(0, 2)) + 2000; // Convert to full year
      const week = Number(dateString.slice(2, 4)); // Convert to number
      date = moment().year(year).isoWeek(week);
    } else if (/^\d{8}$/.test(dateString)) {
      // YYYYMMDD
      date = moment(dateString, "YYYYMMDD");
    } else if (/^\d{2}\d{2}\d{4}$/.test(dateString)) {
      // DDMMYYYY
      date = moment(dateString, "DDMMYYYY");
    } else {
      return "";
    }

    if (!date.isValid()) {
      return "";
    }

    // Return the ISO date string compatible with MongoDB
    return date.toISOString();
  } catch (error) {
    return "";
  }
}
