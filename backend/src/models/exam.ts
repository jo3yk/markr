import { DataTypes, CreationOptional, InferAttributes, InferCreationAttributes, Model, Sequelize } from 'sequelize';

export class Exam extends Model<InferAttributes<Exam>, InferCreationAttributes<Exam>> {
  public id!: CreationOptional<number>;
  public testId!: string;
  public marksAvailable!: number;
}

export function ExamFactory(sequelize: Sequelize) {
  Exam.init(
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      testId: {
        type: DataTypes.STRING(128),
        allowNull: false,
      },
      marksAvailable: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
    },
    {
      sequelize,
      tableName: 'exams',
      timestamps: true,
      indexes: [
        {
          unique: true,
          fields: ['testId'],
        },
      ],
    }
  )

  return Exam;
}