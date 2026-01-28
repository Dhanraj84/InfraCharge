// SQL-safe Profile model placeholder (no mongoose)

export interface Profile {
  id?: number;
  userId: string;
  selectedVehicleId?: number;
}

/**
 * This default export exists only to keep
 * existing imports working.
 * Actual DB operations are handled via SQL elsewhere.
 */
const ProfileModel = {} as unknown as Profile;

export default ProfileModel;
