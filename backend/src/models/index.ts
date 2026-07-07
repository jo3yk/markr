import { Sequelize } from 'sequelize';
import { ExamResultFactory } from './examResult';
import { AnswerFactory } from './answer';

const storage = process.env.DATABASE_STORAGE ?? './data/database.sqlite';

export const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage,
  logging: false,
});

export const ExamResult = ExamResultFactory(sequelize);
export const Answer = AnswerFactory(sequelize);

// Associations
ExamResult.hasMany(Answer, { foreignKey: 'examResultId', as: 'answers' });
Answer.belongsTo(ExamResult, { foreignKey: 'examResultId', as: 'examResult' });
