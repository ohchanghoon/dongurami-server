'use strict';

const request = require('request');
const Error = require('../../utils/Error');
const Auth = require('../Auth/Auth');
// const Student = require('../Student/Student');
const OAuthUtil = require('./utils');
const StudentStorage = require('../Student/StudentStorage');

class OAuth {
  constructor(req) {
    this.query = req.query;
    this.body = req.body;
    this.req = req;
  }

  findOneByInformation() {
    return new Promise((resolve, reject) => {
      const token = this.query;
      const header = `Bearer ${token.token}`;
      const options = {
        uri: 'https://openapi.naver.com/v1/nid/me',
        headers: { Authorization: `${header}` },
        method: 'GET',
      };

      request.get(options, (error, response, body) => {
        if (!error && response.statusCode === 200) {
          const result = JSON.parse(body);
          resolve(result.response);
        } else {
          reject(JSON.parse(body));
        }
      });
    });
  }

  async naverLogin() {
    const oAuthUserInfo = this.body;

    try {
      const naverUserCheck = await OAuthUtil.naverUserCheck(oAuthUserInfo);

      if (naverUserCheck.success) {
        const clubNum = await StudentStorage.findOneByLoginedId(
          naverUserCheck.checkedId
        );
        const userInfo = await StudentStorage.findOneById(
          naverUserCheck.checkedId
        );

        const jwt = await Auth.createJWT(userInfo, clubNum);

        return { success: true, msg: '로그인에 성공하셨습니다.', jwt };
      }
      return {
        success: false,
        msg: '비회원(회원가입이 필요합니다.)',
        name: oAuthUserInfo.name,
        email: oAuthUserInfo.email,
        snsId: oAuthUserInfo.snsId,
      };
    } catch (err) {
      return Error.ctrl('서버 에러입니다. 서버 개발자에게 얘기해주세요.', err);
    }
  }

  async naverSignUp() {
    const saveInfo = this.body;

    try {
      const checkedIdAndEmail = await Util.checkIdAndEmail(client);

      if (checkedIdAndEmail.saveable) {
        saveInfo.hash = '';
        saveInfo.passwordSalt = '';

        const response = await StudentStorage.snsSave(saveInfo);

        if (response) {
          return { success: true, msg: '회원가입에 성공하셨습니다.', saveInfo };
        }
        return { success: false, msg: '회원가입에 실패하셨습니다.' };
      }
      return checkedIdAndEmail;
    } catch (err) {
      return Error.ctrl('', err);
    }
  }
}
module.exports = OAuth;
