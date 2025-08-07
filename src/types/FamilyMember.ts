export interface FamilyMember {
  id: string;
  name: string;
  color: string;
}

export interface CreateFamilyMemberData {
  name: string;
  color: string;
}

export interface UpdateFamilyMemberData extends Partial<CreateFamilyMemberData> {
  id: string;
}
