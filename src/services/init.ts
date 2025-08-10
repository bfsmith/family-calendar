import { databaseService } from "./DatabaseService";
import { familyMemberStorage } from "./FamilyMemberStorage";
import { eventStorage } from "./EventStorage";
import { choreStorage } from "./ChoreStorage";

export const init = async () => {
  await databaseService.init();
  await familyMemberStorage.init();
  await eventStorage.init();
  await choreStorage.init();
};
