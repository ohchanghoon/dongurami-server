'use strict';

const EmotionStorage = require('./EmotionStorage');
const EmotionUtil = require('./utils');
const BoardStorage = require('../Board/BoardStorage');
const CommentStorage = require('../Board/Comment/CommentStorage');
const Notification = require('../Notification/Notification');
const Error = require('../../utils/Error');

class Emotion {
  constructor(req) {
    this.auth = req.auth;
    this.params = req.params;
    this.req = req;
    this.ERRMSG = '서버 에러입니다. 서버 개발자에게 얘기해주세요.';
  }

  async likedByBoardNum() {
    const user = this.auth;
    const notification = new Notification(this.req);
    try {
      const emotionInfo = EmotionUtil.makeEmotionInfo(this.req);

      const isBoardExist = await BoardStorage.existOnlyBoardNum(
        emotionInfo.boardNum
      );

      if (!isBoardExist) {
        return {
          success: false,
          msg: '해당 게시글이 존재하지 않습니다.',
          status: 404,
        };
      }

      const isEmotion = await EmotionStorage.isEmotion(emotionInfo);

      if (isEmotion) {
        return {
          success: false,
          msg: '이미 좋아요를 눌렀습니다.',
          status: 409,
        };
      }

      const isCreat = await EmotionStorage.likedByBoardNum(emotionInfo);

      if (isCreat) {
        const { recipientId, recipientName, title } =
          await BoardStorage.findBoardInfoByBoardNum(emotionInfo.boardNum);

        if (user.id !== recipientId) {
          const notificationInfo = {
            title,
            recipientName,
            recipientId,
            senderName: user.name,
            content: '게시글 좋아요',
          };

          await notification.createNotification(notificationInfo);
        }

        return {
          success: true,
          msg: '해당 게시글에 좋아요를 했습니다.',
          status: 200,
        };
      }
      return {
        success: false,
        msg: '해당 게시글에 좋아요를 실패했습니다.',
        status: 400,
      };
    } catch (err) {
      return Error.ctrl(this.ERRMSG, err);
    }
  }

  async unLikedByBoardNum() {
    try {
      const emotionInfo = EmotionUtil.makeEmotionInfo(this.req);

      const isBoardExist = await BoardStorage.existOnlyBoardNum(
        emotionInfo.boardNum
      );

      if (!isBoardExist) {
        return {
          success: false,
          msg: '해당 게시글이 존재하지 않습니다.',
          status: 404,
        };
      }

      const isEmotion = await EmotionStorage.isEmotion(emotionInfo);

      if (!isEmotion)
        return {
          success: false,
          msg: '좋아요를 누르지 않았습니다.',
          status: 409,
        };

      const isDelete = await EmotionStorage.unLikedByBoardNum(emotionInfo);

      if (isDelete) {
        return {
          success: true,
          msg: '해당 게시글의 좋아요가 취소 되었습니다.',
          status: 200,
        };
      }
      return {
        success: false,
        msg: '해당 게시글의 좋아요가 취소되지 않았습니다.',
        status: 400,
      };
    } catch (err) {
      return Error.ctrl(this.ERRMSG, err);
    }
  }

  async likedByCmtNum() {
    const user = this.auth;
    const notification = new Notification(this.req);

    try {
      const emotionInfo = EmotionUtil.makeEmotionInfo(this.req);

      const isCmtExist = await EmotionStorage.existenceByCmtNumAndDepth(
        emotionInfo.cmtInfo
      );

      if (!isCmtExist) {
        return {
          success: false,
          msg: '해당 댓글이 존재하지 않습니다.',
          status: 404,
        };
      }

      const isEmotion = await EmotionStorage.isEmotion(emotionInfo);

      if (isEmotion) {
        return {
          success: false,
          msg: '이미 좋아요를 눌렀습니다.',
          status: 409,
        };
      }

      const isCreat = await EmotionStorage.likedByCmtNum(emotionInfo);

      if (isCreat) {
        const { recipientId, recipientName, description } =
          await CommentStorage.findAllByCmtNum(emotionInfo.cmtNum);

        if (emotionInfo.studentId !== recipientId) {
          const notificationInfo = {
            title: description,
            recipientName,
            recipientId,
            senderName: user.name,
            content: '댓글 좋아요',
          };

          await notification.createNotification(notificationInfo);
        }

        return {
          success: true,
          msg: '해당 댓글에 좋아요를 했습니다.',
          status: 200,
        };
      }
      return {
        success: false,
        msg: '해당 댓글에 좋아요를 실패했습니다.',
        status: 400,
      };
    } catch (err) {
      return Error.ctrl(this.ERRMSG, err);
    }
  }

  async unLikedByCmtNum() {
    try {
      const emotionInfo = EmotionUtil.makeEmotionInfo(this.req);

      const isCmtExist = await EmotionStorage.existenceByCmtNumAndDepth(
        emotionInfo.cmtInfo
      );

      if (!isCmtExist) {
        return {
          success: false,
          msg: '해당 댓글이 존재하지 않습니다.',
          status: 404,
        };
      }

      const isEmotion = await EmotionStorage.isEmotion(emotionInfo);

      if (!isEmotion) {
        return {
          success: false,
          msg: '좋아요를 누르지 않았습니다.',
          status: 409,
        };
      }

      const isDelete = await EmotionStorage.unLikedByCmtNum(emotionInfo);

      if (isDelete) {
        return {
          success: true,
          msg: '해당 댓글의 좋아요가 취소 되었습니다.',
          status: 200,
        };
      }
      return {
        success: false,
        msg: '해당 댓글의 좋아요가 취소되지 않았습니다.',
        status: 400,
      };
    } catch (err) {
      return Error.ctrl(this.ERRMSG, err);
    }
  }

  async likedByReplyCmtNum() {
    const user = this.auth;
    const notification = new Notification(this.req);

    try {
      const emotionInfo = EmotionUtil.makeEmotionInfo(this.req);

      const isReplyCmtExist = await EmotionStorage.existenceByCmtNumAndDepth(
        emotionInfo.cmtInfo
      );

      if (!isReplyCmtExist) {
        return {
          success: false,
          msg: '해당 답글이 존재하지 않습니다.',
          status: 404,
        };
      }

      const isEmotion = await EmotionStorage.isEmotion(emotionInfo);

      if (isEmotion) {
        return {
          success: false,
          msg: '이미 좋아요를 눌렀습니다.',
          status: 409,
        };
      }

      const isCreat = await EmotionStorage.likedByReplyCmtNum(emotionInfo);

      if (isCreat) {
        const { recipientId, recipientName, description } =
          await CommentStorage.findAllByCmtNum(emotionInfo.replyCmtNum);

        if (emotionInfo.studentId !== recipientId) {
          const notificationInfo = {
            title: description,
            recipientName,
            recipientId,
            senderName: user.name,
            content: '답글 좋아요',
          };

          await notification.createNotification(notificationInfo);
        }
        return {
          success: true,
          msg: '해당 답글에 좋아요를 했습니다.',
          status: 200,
        };
      }
      return {
        success: false,
        msg: '해당 답글에 좋아요를 실패했습니다.',
        status: 400,
      };
    } catch (err) {
      return Error.ctrl(this.ERRMSG, err);
    }
  }

  async unLikedByReplyCmtNum() {
    try {
      const emotionInfo = EmotionUtil.makeEmotionInfo(this.req);

      const isReplyCmtExist = await EmotionStorage.existenceByCmtNumAndDepth(
        emotionInfo.cmtInfo
      );

      if (!isReplyCmtExist) {
        return {
          success: false,
          msg: '해당 답글이 존재하지 않습니다.',
          status: 404,
        };
      }

      const isEmotion = await EmotionStorage.isEmotion(emotionInfo);

      if (!isEmotion) {
        return {
          success: false,
          msg: '좋아요를 누르지 않았습니다.',
          status: 409,
        };
      }

      const isDelete = await EmotionStorage.unLikedByReplyCmtNum(emotionInfo);

      if (isDelete) {
        return {
          success: true,
          msg: '해당 답글의 좋아요가 취소 되었습니다.',
          status: 200,
        };
      }
      return {
        success: false,
        msg: '해당 답글의 좋아요가 취소되지 않았습니다.',
        status: 400,
      };
    } catch (err) {
      return Error.ctrl(this.ERRMSG, err);
    }
  }
}

module.exports = Emotion;
