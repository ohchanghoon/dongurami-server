'use strict';

const makeResponse = require('../../utils/makeResponse');
const StudentStorage = require('../Student/StudentStorage');

class OAuthUtil {
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

  static async naverUserCheck(oAuthUserInfo) {
    try {
      const user = await StudentStorage.findOneBySnsId(oAuthUserInfo.snsId);

      if (user.success) {
        return makeResponse(200, '성공', { checkedId: user.result.studentId });
      }
      return makeResponse(400, '비회원(회원가입이 필요합니다.)');
    } catch (err) {
      throw err;
    }
  }
}

module.exports = OAuthUtil;
