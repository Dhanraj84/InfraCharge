import { Schema, model, models, Types } from "mongoose";

export interface Profile {
  _id?: string;
  userId: string;                      // The logged-in user's ID
  selectedVehicle?: Types.ObjectId;    // Reference to the Vehicle collection
}

const ProfileSchema = new Schema<Profile>(
  {
    userId: { type: String, required: true, unique: true },
    selectedVehicle: { type: Schema.Types.ObjectId, ref: "Vehicle" },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

export default models.Profile || model<Profile>("Profile", ProfileSchema);
