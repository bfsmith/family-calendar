export interface FamilyMember {
  id: string;
  name: string;
  color: string;
  points: number; // Current point balance
}

export interface CreateFamilyMemberData {
  name: string;
  color: string;
}

export interface UpdateFamilyMemberData extends Partial<CreateFamilyMemberData> {
  id: string;
}
