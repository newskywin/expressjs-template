import { DataTypes, Model, Sequelize } from "sequelize";

export class PostPersistent extends Model {
  declare created_at: Date;
  declare updated_at: Date;
  declare commentCount: number;
  declare likedCount: number;
  declare isFeatured: boolean;
  declare image: string;
}

export const init = (sequelize: Sequelize) => {
  PostPersistent.init(
    {
      id: {
        type: DataTypes.UUID,
        primaryKey: true,
      },
      authorId: {
        type: DataTypes.UUID,
        allowNull: false,
        field: "author_id",
      },
      content: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      image: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: "",
      },
      isFeatured: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        field: "is_featured",
        defaultValue: false,
      },
      commentCount: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: "comment_count",
        defaultValue: 0,
      },
      likedCount: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: "liked_count",
        defaultValue: 0,
      },
      type: {
        type: DataTypes.STRING,
        allowNull: false,
      },
    },
    {
      sequelize,
      modelName: "Post",
      tableName: "posts",
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
    }
  );
};
