"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Instance extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      Instance.belongsTo(models.Server, {
        foreignKey: "server_id",
        as: "server",
      });
    }
  }
  Instance.init(
    {
      server_id: DataTypes.INTEGER,
      app_name: DataTypes.STRING,
      args_RoomName: DataTypes.STRING,
      process_id: DataTypes.INTEGER,
    },
    {
      sequelize,
      modelName: "Instance",
      paranoid: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
      deletedAt: "deleted_at",
    },
  );
  return Instance;
};
