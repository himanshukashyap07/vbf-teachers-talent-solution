import { Schema, model, models, type InferSchemaType, type Model, type Types } from "mongoose";

/**
 * One row PER RECIPIENT, so each person has their own read state and a list that is a single
 * indexed query. A message sent to 500 people is 500 small rows plus one NotificationBatch for staff history.
 * Rows disappear on their own after 90 days (TTL index on createdAt).
 */
const notificationSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: "User", required: true },
  title: { type: String, required: true, trim: true, maxlength: 120 },
  body: { type: String, required: true, trim: true, maxlength: 1000 },
  level: { type: String, enum: ["info", "success", "warning"], default: "info" },
  link: { type: String, maxlength: 200 }, // same-site path only, validated on creation
  batch: { type: Schema.Types.ObjectId, ref: "NotificationBatch" },
  readAt: Date,
  createdAt: { type: Date, default: Date.now, index: { expireAfterSeconds: 60 * 60 * 24 * 90 } },
});
notificationSchema.index({ user: 1, createdAt: -1 });
notificationSchema.index({ user: 1, readAt: 1 });
notificationSchema.index({ batch: 1 });

export type NotificationDoc = InferSchemaType<typeof notificationSchema> & { _id: Types.ObjectId };

export const Notification: Model<InferSchemaType<typeof notificationSchema>> =
  (models.Notification as Model<InferSchemaType<typeof notificationSchema>>) ||
  model("Notification", notificationSchema);

/** One record per admin "send", for the staff history view. */
const batchSchema = new Schema(
  {
    title: { type: String, required: true },
    body: { type: String, required: true },
    level: { type: String, enum: ["info", "success", "warning"], default: "info" },
    link: String,
    audience: { type: String, required: true }, // human-readable, e.g. "2 people" or "All schools in Lucknow"
    recipientCount: { type: Number, required: true },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true },
);

export const NotificationBatch: Model<InferSchemaType<typeof batchSchema>> =
  (models.NotificationBatch as Model<InferSchemaType<typeof batchSchema>>) ||
  model("NotificationBatch", batchSchema);
