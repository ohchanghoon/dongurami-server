'use strict';

const CommentStorage = require('./CommentStorage');
const BoardStorage = require('../BoardStorage');
const Notification = require('../../Notification/Notification');
const Error = require('../../../utils/Error');
const WriterCheck = require('../../../utils/WriterCheck');
const boardCategory = require('../../Category/board');

class Comment {
  constructor(req) {
    this.req = req;
    this.body = req.body;
    this.params = req.params;
    this.auth = req.auth;
  }

  async createCommentNum() {
    const comment = this.body;
    const user = this.auth;
    const notification = new Notification(this.req);

    try {
      const commentInfo = {
        boardNum: this.params.boardNum,
        id: user.id,
        description: comment.description,
        hiddenFlag: comment.hiddenFlag || 0,
      };

      if (!comment.description) {
        return { success: false, msg: '댓글 본문이 존재하지 않습니다.' };
      }

      const exist = await BoardStorage.existOnlyBoardNum(commentInfo.boardNum);

      if (exist === undefined) {
        return { success: false, msg: '해당 게시글이 존재하지 않습니다.' };
      }

      const commentNum = await CommentStorage.createCommentNum(commentInfo);

      await CommentStorage.updateOnlyGroupNum(commentNum);

      if (commentInfo.hiddenFlag) {
        user.name = '익명';
      }

      const { recipientId, recipientName, title } =
        await BoardStorage.findBoardInfoByBoardNum(commentInfo.boardNum);

      if (user.id !== recipientId) {
        const notificationInfo = {
          title,
          recipientName,
          recipientId,
          senderName: user.name,
          content: commentInfo.description,
        };

        await notification.createNotification(notificationInfo);
      }

      return { success: true, msg: '댓글 생성 성공' };
    } catch (err) {
      return Error.ctrl('서버 에러입니다. 서버 개발자에게 얘기해주세요.', err);
    }
  }

  async createReplyCommentNum() {
    const replyComment = this.body;
    const user = this.auth;
    const { params } = this;
    const notification = new Notification(this.req);

    try {
      const replyCommentInfo = {
        boardNum: params.boardNum,
        cmtNum: params.cmtNum,
        id: user.id,
        description: replyComment.description,
        hiddenFlag: replyComment.hiddenFlag || 0,
      };

      if (!replyComment.description) {
        return { success: false, msg: '답글 본문이 존재하지 않습니다.' };
      }

      const exist = await CommentStorage.existOnlyCmtNum(
        replyCommentInfo.cmtNum,
        replyCommentInfo.boardNum
      );

      if (exist === undefined) {
        return { success: false, msg: '해당 게시글이나 댓글이 없습니다.' };
      }

      await CommentStorage.createReplyCommentNum(replyCommentInfo);

      const recipients =
        await CommentStorage.findRecipientNamesByCmtAndBoardNum(
          replyCommentInfo.cmtNum,
          replyCommentInfo.boardNum
        );

      const senderId = replyCommentInfo.id;

      if (replyCommentInfo.hiddenFlag) {
        user.name = '익명';
      }

      const { title } = await BoardStorage.findBoardInfoByBoardNum(
        replyCommentInfo.boardNum
      );

      recipients.forEach(async (recipient) => {
        if (senderId !== recipient.id) {
          const notificationInfo = {
            title,
            senderName: user.name,
            recipientName: recipient.name,
            recipientId: recipient.id,
            content: replyCommentInfo.description,
          };

          await notification.createNotification(notificationInfo);
        }
      });

      return { success: true, msg: '답글 생성 성공' };
    } catch (err) {
      return Error.ctrl('서버 에러입니다. 서버 개발자에게 얘기해주세요.', err);
    }
  }

  async findAllByBoardNum() {
    const user = this.auth;

    try {
      const boardInfo = {
        boardNum: this.params.boardNum,
        studentId: user ? user.id : 0,
        category: boardCategory[this.params.category],
      };
      const anonymous = {};

      const board = await BoardStorage.findOneByBoardNum(boardInfo);

      if (board.writerHiddenFlag) {
        anonymous[board.studentId] = '익명1';
      }

      const comments = await CommentStorage.findAllByBoardNum(boardInfo);

      for (const comment of comments) {
        comment.isWriter = boardInfo.studentId === comment.studentId ? 1 : 0;
        comment.likedFlag += comment.replyLikedFlag;
        delete comment.replyLikedFlag;

        if (comment.writerHiddenFlag) {
          const samePersonIdx = Object.keys(anonymous).indexOf(
            comment.studentId
          );

          if (samePersonIdx > -1) {
            comment.studentName = anonymous[comment.studentId];
            comment.studentId = anonymous[comment.studentId];
            comment.profileImageUrl = null;
          } else {
            const newPerson = `익명${Object.keys(anonymous).length + 1}`;

            anonymous[comment.studentId] = newPerson;
            comment.studentId = newPerson;
            comment.studentName = newPerson;
            comment.profileImageUrl = null;
          }
        }
      }

      return comments;
    } catch (err) {
      return Error.ctrl('서버 에러입니다. 서버 개발자에게 얘기해주세요.', err);
    }
  }

  async updateByCommentNum() {
    const { params } = this;
    const comment = this.body;

    try {
      const cmtInfo = {
        boardNum: params.boardNum,
        cmtNum: params.cmtNum,
        description: comment.description,
        hiddenFlag: comment.hiddenFlag || 0,
      };

      if (!cmtInfo.description) {
        return { success: false, msg: '댓글 본문이 존재하지 않습니다.' };
      }

      const writerCheck = await WriterCheck.ctrl(
        this.auth.id,
        cmtInfo.cmtNum,
        'comments'
      );

      if (!writerCheck.success) return writerCheck;

      const updateCmtCount = await CommentStorage.updateByCommentNum(cmtInfo);

      if (updateCmtCount === 0) {
        return { success: false, msg: '해당 글에 존재하지 않는 댓글 입니다.' };
      }
      return { success: true, msg: '댓글 수정 성공' };
    } catch (err) {
      return Error.ctrl('서버 에러입니다. 서버 개발자에게 얘기해주세요.', err);
    }
  }

  async updateByReplyCommentNum() {
    const { params } = this;
    const replyComment = this.body;

    try {
      const replyCmtInfo = {
        boardNum: params.boardNum,
        cmtNum: params.cmtNum,
        replyCmtNum: params.replyCmtNum,
        description: replyComment.description,
        hiddenFlag: replyComment.hiddenFlag || 0,
      };

      if (!replyCmtInfo.description) {
        return { success: false, msg: '답글 본문이 존재하지 않습니다.' };
      }

      const writerCheck = await WriterCheck.ctrl(
        this.auth.id,
        replyCmtInfo.replyCmtNum,
        'comments'
      );

      if (!writerCheck.success) return writerCheck;

      const updateReplyCmtCount = await CommentStorage.updateByReplyCommentNum(
        replyCmtInfo
      );

      if (updateReplyCmtCount === 0) {
        return { success: false, msg: '존재하지 않는 답글입니다.' };
      }
      return { success: true, msg: '답글 수정 성공' };
    } catch (err) {
      return Error.ctrl('서버 에러입니다. 서버 개발자에게 얘기해주세요.', err);
    }
  }

  async deleteAllByGroupNum() {
    const { params } = this;

    try {
      const cmtInfo = {
        boardNum: params.boardNum,
        cmtNum: params.cmtNum,
      };

      const writerCheck = await WriterCheck.ctrl(
        this.auth.id,
        cmtInfo.cmtNum,
        'comments'
      );

      if (!writerCheck.success) return writerCheck;

      const deleteCmtCount = await CommentStorage.deleteAllByGroupNum(cmtInfo);

      if (deleteCmtCount === 0) {
        return { success: false, msg: '해당 글에 존재하지 않는 댓글 입니다.' };
      }
      return { success: true, msg: '댓글 삭제 성공' };
    } catch (err) {
      return Error.ctrl('서버 에러입니다. 서버 개발자에게 얘기해주세요.', err);
    }
  }

  async deleteOneReplyCommentNum() {
    const { params } = this;

    try {
      const replyCmtInfo = {
        boardNum: params.boardNum,
        cmtNum: params.cmtNum,
        replyCmtNum: params.replyCmtNum,
      };

      const writerCheck = await WriterCheck.ctrl(
        this.auth.id,
        replyCmtInfo.replyCmtNum,
        'comments'
      );

      if (!writerCheck.success) return writerCheck;

      const deleteReplyCmtCount = await CommentStorage.deleteOneReplyCommentNum(
        replyCmtInfo
      );

      if (deleteReplyCmtCount === 0) {
        return { success: false, msg: '존재하지 않는 답글입니다.' };
      }
      const replyCmtCount = await CommentStorage.existOnlyReplyCmtNum(
        replyCmtInfo
      );

      if (replyCmtCount === undefined) {
        const replyCmt = await CommentStorage.updateOnlyReplyFlag(
          replyCmtInfo.cmtNum
        );

        if (replyCmt === 0) {
          return Error.ctrl(
            '서버에러입니다. 서버 개발자에게 얘기해주세요.',
            err
          );
        }
      }
      return { success: true, msg: '답글 삭제 성공' };
    } catch (err) {
      return Error.ctrl('서버에러입니다. 서버 개발자에게 얘기해주세요.', err);
    }
  }
}

module.exports = Comment;
