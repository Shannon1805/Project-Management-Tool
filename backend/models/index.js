import mongoose from "mongoose";

const project = new mongoose.Schema(
  {
    title: {
      type: String,
      unique: true
    },
    description: String,

    task: [
      {
        id: Number,
        title: String,
        description: String,

        // ✨ NEW DATE FIELDS
        startDate: {
          type: Date,
          required: true
        },
        endDate: {
          type: Date,
          required: true
        },

        order: Number,
        stage: String,
        index: Number,

        attachment: [
          {
            type: String,
            url: String
          }
        ],

        created_at: {
          type: Date,
          default: Date.now
        },
        updated_at: {
          type: Date,
          default: Date.now
        }
      }
    ]
  },
  { timestamps: true }
);

export default mongoose.model("Project", project);
