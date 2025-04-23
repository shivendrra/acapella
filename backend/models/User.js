const mongoose = require("mongoose");
const Joi = require("joi");
const uniqueValidator = require("mongoose-unique-validator");
const { v4: uuidv4 } = require("uuid");
const Schema = mongoose.Schema; // new schema object

const UserSchema = new Schema({
  userID: {
    type: String,
    unique: true,
    default: uuidv4,
    immutable: true,
  },
  name: {
    type: String,
    unique: false,
    required: true,
    immutable: true,
    default: null,
  },
  username: {
    type: String,
    unique: true,
    required: true,
    immutable: false,
    default: null,
  },
  email: {
    type: String,
    unique: true,
    required: true,
    immutable: false,
    default: null,
  },
  password: {
    type: String,
    unique: false,
    required: true,
    immutable: false,
    default: null,
  },
  gender: {
    type: String,
    enum: ["male", "female", "non-binary"],
    unique: false,
    required: false,
    immutable: false,
    default: null,
  },
  dateofbirth: {
    type: Date,
    unique: false,
    required: false,
    immutable: false,
    default: null,
  }
});

// Applying the uniqueValidator plugin
UserSchema.plugin(uniqueValidator, { message: '{PATH} already exists.' });

const validate = (user) => {
  const schema = Joi.object({
    name: Joi.string().min(5).max(20).required(),
    username: Joi.string().alphanum().min(2).max(20).required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(8).max(20).required(),
    gender: Joi.string().valid("male", "female", "non-binary").optional(),
    dateofbirth: Joi.date().less('now').required(),
  });
  return schema.validate(user);
};

const UserModel = mongoose.model("user", UserSchema);
module.exports = { UserModel, validate };