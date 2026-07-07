import { DataTypes, CreationOptional, InferAttributes, InferCreationAttributes, Model, Sequelize } from 'sequelize';

// This model isn't currently used - from the readme: "you can safely ignore the `<answer>` elements"
// so we won't be using them in the import process. However, we will still define the model for completeness.

export class Answer extends Model<InferAttributes<Answer>, InferCreationAttributes<Answer>>  {
  public id!: CreationOptional<number>;
  public examResultId!: number;
  public question!: number;
  public marksAvailable!: number;
  public marksAwarded!: number;
  public value!: string;
}

export function AnswerFactory(sequelize: Sequelize) {
  Answer.init(
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      examResultId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      question: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      marksAvailable: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      marksAwarded: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      value: {
        type: DataTypes.STRING(32),
        allowNull: true,
      },
    },
    {
      sequelize,
      tableName: 'answers',
      timestamps: true,
      indexes: [
        {
          unique: true,
          fields: ['examResultId', 'question'],
        },
      ],
    }
  );

  return Answer;
}
