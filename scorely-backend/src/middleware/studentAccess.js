const { Op } = require('sequelize');
const { InternshipApplication, ProgramCode } = require('../models');
const canAccessStudent = async (req, studentId) => {
  if (!req.user) return false;
  const id = Number(studentId);
  if (!Number.isSafeInteger(id) || id <= 0) return false;
  if (req.user.role === 'admin' || Number(req.user.id) === id) return true;
  if (req.user.role !== 'university_coordinator') return false;
  const programs = await ProgramCode.findAll({ where: { coordinator_id: req.user.id }, attributes: ['code'] });
  if (!programs.length) return false;
  const application = await InternshipApplication.findOne({
    where: { user_id: id, program_code: { [Op.in]: programs.map(p => p.code) } },
    attributes: ['id']
  });
  return !!application;
};
module.exports = { canAccessStudent };
