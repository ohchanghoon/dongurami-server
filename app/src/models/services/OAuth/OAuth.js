'use strict';

const request = require('request');
const Error = require('../../utils/Error');
const Student = require('../Student/Student');
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

  async signUpCheck() {
    const student = new Student(this.req);
    const saveInfo = this.body;

    try {
      const snsJoinedUser = await StudentStorage.findOneBySnsId(saveInfo.snsId);

      if (snsJoinedUser.success) {
        const loginResult = await student.naverLogin(student);

        return loginResult;
      }
      const generalJoinedUser = await StudentStorage.findOneById(saveInfo.id);

      if (generalJoinedUser) {
        return { success: false, msg: '일반회원으로 가입된 회원입니다.' };
      }
      return { success: false };
    } catch (err) {
      return Error.ctrl(
        '알 수 없는 오류입니다. 서버개발자에게 문의하세요.',
        err
      );
    }
  }

  async naverUserCheck() {
    const oAuthUserInfo = this.body;

    try {
      const user = await StudentStorage.findOneBySnsId(oAuthUserInfo.snsId);

      if (user.success) {
        return { success: true, checkedId: user.result.studentId };
      }
      return { success: false, msg: '비회원(회원가입이 필요합니다.)' };
    } catch (err) {
      throw err;
    }
  }

  async naverLogin() {
    const oAuthUserInfo = this.body;

    try {
      const naverUserCheck = await this.naverUserCheck();

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
