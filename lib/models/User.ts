import { Schema, models, model } from "mongoose";

const UserSchema = new Schema({
  name: String,
  email: { type: String, unique: true },
  phone: String,
  passwordHash: String
}, { timestamps: true });

export default models.User || model("User", UserSchema);
