import moment from "moment-timezone";

const displayCurrentTime = (timezone: string) => {
  const time = moment().tz(timezone).format("YYYY-MM-DD HH:mm:ss");
  console.log(`Current time in ${timezone}: ${time}`);
};

// Example usage
displayCurrentTime("Europe/London");
