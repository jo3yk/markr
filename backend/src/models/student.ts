import { DataTypes, CreationOptional, InferAttributes, InferCreationAttributes, Model, Sequelize } from 'sequelize';

export class Student extends Model<InferAttributes<Student>, InferCreationAttributes<Student>> {
  public id!: CreationOptional<number>;
  public studentNumber!: string;
  public firstName!: string;
  public lastName!: string;
}

export function StudentFactory(sequelize: Sequelize) {
  Student.init({
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
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
    }
  },
    {
      sequelize,
      tableName: 'students',
      timestamps: true,
      indexes: [
        {
          unique: true,
          fields: ['studentNumber'],
        },
      ],
    });

    return Student;
}