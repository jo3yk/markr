import { Sequelize } from 'sequelize';
import { ExamResultFactory } from './examResult';
import { AnswerFactory } from './answer';
import { StudentFactory } from './student';
import { ExamFactory } from './exam';

const storage = process.env.DATABASE_STORAGE ?? './data/database.sqlite';

export const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage,
  logging: false,
});

export const Student = StudentFactory(sequelize);
export const ExamResult = ExamResultFactory(sequelize);
export const Answer = AnswerFactory(sequelize);
export const Exam = ExamFactory(sequelize);

// Associations
Student.hasMany(ExamResult, { foreignKey: 'studentId', as: 'examResults' });
ExamResult.belongsTo(Student, { foreignKey: 'studentId', as: 'student' });

Exam.hasMany(ExamResult, { foreignKey: 'examId', as: 'examResults' });
ExamResult.belongsTo(Exam, { foreignKey: 'examId', as: 'exam' });

ExamResult.hasMany(Answer, { foreignKey: 'examResultId', as: 'answers' });
Answer.belongsTo(ExamResult, { foreignKey: 'examResultId', as: 'examResult' });
