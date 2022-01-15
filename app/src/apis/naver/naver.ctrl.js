'use strcit';

const OAuth = require('../../models/services/OAuth/OAuth');
const logger = require('../../config/logger');
const Student = require('../../models/services/Student/Student');

const process = {
  login: async (req, res) => {
    const oAuth = new OAuth(req);
    const response = await oAuth.naverLogin();

    if (response.success) {
      logger.info(`GET /api/naver/login 200: ${response.msg}`);
      return res.status(200).json(response);
    }
    if (response.isError) {
      logger.error(`GET /api/naver/login 500: \n${response.errMsg.stack}`);
      return res.status(500).json(response.clientMsg);
    }
    logger.error(`GET /api/naver/login 400: ${response.msg}`);
    return res.status(400).json(response);
  },

  signUp: async (req, res) => {
    const oAuth = new OAuth(req);
    const student = new Student(req);
    const response = await oAuth.signUpCheck();

    if (!response.success) {
      if (response.msg) {
        logger.error(`POST /api/naver/sign-up 409: ${response.msg}`);
        return res.status(409).json(response);
      }
      const result = await student.naverSignUp();

      if (result.success) {
        const naverLogin = await student.naverLogin(result.saveInfo);

        if (naverLogin.success) {
          logger.info(`POST /api/naver/sign-up 201: ${naverLogin.msg}`);
          return res.status(201).json(naverLogin);
        }
        if (naverLogin.isError) {
          logger.error(
            `POST /api/naver/sign-up 500: ${naverLogin.errMsg.stack}`
          );
          return res.status(500).json(naverLogin.clientMsg);
        }
        logger.error(`POST /api/naver/sign-up 400: ${naverLogin.msg}`);
        return res.status(400).json(naverLogin);
      }
      if (result.isError) {
        logger.error(`POST /api/naver/sign-up 500: \n${result.errMsg.stack}`);
        return res.status(500).json(result.clientMsg);
      }
      logger.error(`POST /api/naver/sign-up 400: ${result.msg}`);
      return res.status(400).json(result);
    }
    if (response.isError) {
      logger.error(`POST /api/naver/sign-up 500: \n${response.errMsg.stack}`);
      return res.status(500).json(response.clientMsg);
    }

    logger.info(`POST /api/naver/sign-up 200: ${response.msg}`);
    return res.status(200).json(response);
  },
};

module.exports = {
  process,
};
