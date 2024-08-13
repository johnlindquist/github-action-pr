import moment from "moment-timezone";

const convertTime = (time: string, fromZone: string, toZone: string) => {
  const convertedTime = moment
    .tz(time, fromZone)
    .tz(toZone)
    .format("YYYY-MM-DD HH:mm:ss");
  console.log(`Time in ${fromZone}: ${time}`);
  console.log(`Converted time in ${toZone}: ${convertedTime}`);
};

// Example usage
convertTime("2023-10-01 12:00:00", "America/New_York", "Asia/Tokyo");
