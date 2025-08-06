import { databaseService } from "./DatabaseService";
import { calendarStorage } from "./CalendarStorage";
import { eventStorage } from "./EventStorage";

export const init = async () => {
  await databaseService.init();
  await calendarStorage.init();
  await eventStorage.init();
};
