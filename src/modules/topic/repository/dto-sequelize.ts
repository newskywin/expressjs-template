import { DataTypes, Model, Sequelize } from "sequelize";

export class TopicPersistent extends Model {
  declare created_at: Date;
  declare updated_at: Date;
  declare postCount: number;
}

export const init = (sequelize: Sequelize) => {
  console.log("INIT 1 time");
  TopicPersistent.init(
    {
      id: {
        type: DataTypes.UUID,
        primaryKey: true,
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      color: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      postCount: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: "post_count", //map with to post_count in db
        defaultValue: 0,
      },
    },
    {
      // Other model options go here
      sequelize, // We need to pass the connection instance
      modelName: "Topic", // We need to choose the model name
      tableName: "topics", // table name in db
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at"
    },
  );
};