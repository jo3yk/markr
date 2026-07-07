import { DataTypes, CreationOptional, InferAttributes, InferCreationAttributes, Model, Sequelize } from 'sequelize';

export class ExamResult extends Model<InferAttributes<ExamResult>, InferCreationAttributes<ExamResult>> {
  public id!: CreationOptional<number>;
  public testId!: string;
  public studentNumber!: string;
  public firstName!: string;
  public lastName!: string;
  public scannedOn!: Date;
  public marksAvailable!: number;
  public marksObtained!: number;
}

export function ExamResultFactory(sequelize: Sequelize) {
  // A unique composite index prevents duplicate student submissions for the same test.
  ExamResult.init(
    {
      id: {
        type: DataTypes.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
      },
      testId: {
        type: DataTypes.STRING(128),
        allowNull: false,
      },
      studentNumber: {
        type: DataTypes.STRING(64),
        allowNull: false,
      },
      firstName: {
        type: DataTypes.STRING(128),
        allowNull: false,
      },
      lastName: {
        type: DataTypes.STRING(128),
        allowNull: false,
      },
      scannedOn: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      marksAvailable: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      marksObtained: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
    },
    {
      sequelize,
      tableName: 'exam_results',
      timestamps: true,
      indexes: [
        {
          unique: true,
          fields: ['testId', 'studentNumber'],
        },
      ],
    }
  );

  return ExamResult;
}
