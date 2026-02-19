"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Server extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      Server.hasMany(models.Instance, {
        foreignKey: "server_id",
        as: "instances",
      });
    }
  }
  Server.init(
    {
      protocol: DataTypes.STRING,
      hostname: DataTypes.STRING,
      port: DataTypes.INTEGER,
    },
    {
      sequelize,
      modelName: "Server",
      createdAt: "created_at",
      updatedAt: "updated_at",
    },
  );
  return Server;
};
