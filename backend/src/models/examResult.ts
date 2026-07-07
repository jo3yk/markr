import { DataTypes, CreationOptional, InferAttributes, InferCreationAttributes, Model, Sequelize } from 'sequelize';

export class ExamResult extends Model<InferAttributes<ExamResult>, InferCreationAttributes<ExamResult>> {
  public id!: CreationOptional<number>;
  public examId!: number;
  public studentId!: number;
  public scannedOn!: Date;
  public marksObtained!: number;
}

export function ExamResultFactory(sequelize: Sequelize) {
  // A unique composite index prevents duplicate student submissions for the same test.
  ExamResult.init(
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      examId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      studentId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      scannedOn: {
        type: DataTypes.DATE,
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
      timestamps: true
    }
  );

  return ExamResult;
}
