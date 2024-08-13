import moment from "moment-timezone";

const timezones = moment.tz.names();

console.log("Current times around the world:");

timezones.forEach((timezone) => {
  const time = moment().tz(timezone).format("YYYY-MM-DD HH:mm:ss");
  console.log(`${timezone}: ${time}`);
});
