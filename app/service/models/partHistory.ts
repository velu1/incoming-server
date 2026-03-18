module.exports = (mongoose: any) => {
  let Schema = mongoose.Schema(
    {
      uniqueId: {
        type: String,
        // unique: true,
      },
      reelId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "stock",
      },
      internalPartNo: {
        type: String,
      },
      status: {
        type: String,
      },
      isDeleted: {
        type: Boolean,
        default: false,
      },
      partsInDetails: {
        // operatorId: String,
        createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "users" },
        createdAt: { type: Date, default: new Date() },
      },
      storesInDetails: [
        {
          operatorId: { type: mongoose.Schema.Types.ObjectId, ref: "users" },
          type: { type: String },
          uniqueId: { type: String },
          quantity: { type: Number },
          partNumber: { type: String },
          rackId: { type: String },
          workOrder: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "reelWorkOrder",
          },
          location: {
            type: String,
          },
          rackLocation: {
            rackType: { type: String },
            quantity: { type: Number },
          },
          createdAt: { type: Date },
        },
      ],
      pickUpDetails: [
        {
          _id: false,

          pickUpId: { type: String },
          type: { type: String },
          currentQuantity: { type: Number },
          pickUpQuantity: { type: Number },
          remainingQuantity: { type: Number },
          createdAt: { type: Date },
          operatorId: { type: mongoose.Schema.Types.ObjectId, ref: "users" },
          rackId: { type: String },
          side: { type: String },
          status: { type: String },
        },
      ],
      warningDetails: [
        {
          _id: false,
          operatorId: { type: mongoose.Schema.Types.ObjectId, ref: "users" },
          status: { type: String },
          createdAt: { type: Date },
        },
      ],
    },
    { timestamps: true, strict: false }
  );

  Schema.method("toJSON", function (this: any) {
    const { __v, _id, ...object } = this.toObject();
    object.id = _id;
    return object;
  });

  Schema.index({ uniqueId: 1 });

  const partHistory = mongoose.model("partHistory", Schema);
  return partHistory;
};
