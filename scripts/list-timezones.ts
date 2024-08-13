import moment from "moment-timezone";

const listTimezonesByRegion = (region: string) => {
  const timezones = moment.tz.names().filter((tz) => tz.startsWith(region));
  console.log(`Timezones in the ${region} region:`);
  timezones.forEach((tz) => console.log(tz));
};

// Example usage
listTimezonesByRegion("America");
