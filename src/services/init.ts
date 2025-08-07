import { databaseService } from "./DatabaseService";
import { familyMemberStorage } from "./FamilyMemberStorage";
import { eventStorage } from "./EventStorage";

export const init = async () => {
  await databaseService.init();
  await familyMemberStorage.init();
  await eventStorage.init();
};
