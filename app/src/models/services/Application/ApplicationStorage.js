'use strict';

const mariadb = require('../../../config/mariadb');

class ApplicationStorage {
  static async findAllByClubNum(clubNum) {
    let conn;

    try {
      conn = await mariadb.getConnection();
      const leader = 'SELECT leader FROM clubs WHERE no = ?;'; // 동아리 회장만 수정 가능 -> 동아리 회장 학번 조회
      const qustion =
        'SELECT no, description FROM questions WHERE club_no = ?;';
      const clubLeader = await conn.query(leader, clubNum);

      if (clubLeader[0] === undefined) {
        // 동아리 존재 x
        return { success: false };
      }

      const questions = await conn.query(qustion, clubNum);

      return { success: true, clubLeader, questions };
    } catch (err) {
      throw err;
    } finally {
      conn?.release();
    }
  }

  static async createQuestion(questionInfo) {
    let conn;

    try {
      conn = await mariadb.getConnection();
      const query =
        'INSERT INTO questions (club_no, description) VALUE (?, ?);';

      await conn.query(query, [questionInfo.clubNum, questionInfo.description]);
      return true;
    } catch (err) {
      throw err;
    } finally {
      conn?.release();
    }
  }

  static async updateQuestion(questionInfo) {
    let conn;

    try {
      conn = await mariadb.getConnection();
      const query = 'UPDATE questions SET description = ? WHERE no = ?;';

      await conn.query(query, [questionInfo.description, questionInfo.no]);

      return true;
    } catch (err) {
      throw err;
    } finally {
      conn?.release();
    }
  }

  static async deleteQuestion(no) {
    let conn;

    try {
      conn = await mariadb.getConnection();
      const query = 'DELETE FROM questions WHERE no = ?;';

      await conn.query(query, no);

      return true;
    } catch (err) {
      throw err;
    } finally {
      conn?.release();
    }
  }

  static async findOneByClubNum(clubNum) {
    let conn;
    try {
      conn = await mariadb.getConnection();

      const applicantInfoQuery = `SELECT app.in_date AS inDate, s.name, s.id, s.major, s.grade, s.gender, s.phone_number AS phoneNum 
        FROM students AS s JOIN applicants AS app ON app.club_no = ?
        AND app.student_id = s.id AND app.reading_flag = 0;`;

      const qAndAQuery = `SELECT app.student_id AS studentId, q.description AS question, a.description AS answer 
        FROM answers AS a JOIN applicants AS app ON a.student_id = app.student_id 
        AND app.club_no = ? AND app.reading_flag = 0 JOIN questions AS q ON a.question_no = q.no;`;

      const applicantInfo = await conn.query(applicantInfoQuery, clubNum);
      const qAndAResult = await conn.query(qAndAQuery, clubNum);

      const AllQAndA = [];

      for (let i = 0; i < qAndAResult.length; i += 1) {
        const qAndA = {};
        qAndA.id = qAndAResult[i].studentId;

        for (let j = 0; j < qAndAResult.length; j += 1) {
          if (qAndA.id !== qAndAResult[j].studentId) continue;
          qAndA[qAndAResult[j].question] = qAndAResult[j].answer;
        }
        if (AllQAndA.find((qAndAs) => qAndAs.id === qAndA.id) === undefined) {
          AllQAndA.push(qAndA);
        }
        continue;
      }
      return {
        success: true,
        applicantInfo,
        AllQAndA,
      };
    } catch (err) {
      throw err;
    } finally {
      conn?.release();
    }
  }

  static async updateApprovedApplicantById(userInfo) {
    let conn;
    try {
      conn = await mariadb.getConnection();

      const query =
        'UPDATE applicants SET reading_flag = 1 WHERE club_no = ? AND student_id = ?;';

      await conn.query(query, [userInfo.clubNum, userInfo.id]);

      return true;
    } catch (err) {
      throw err;
    } finally {
      conn?.release();
    }
  }

  static async createMemberById(userInfo) {
    let conn;
    try {
      conn = await mariadb.getConnection();

      const query =
        'INSERT INTO members (student_id, club_no, join_admin_flag, board_admin_flag) VALUES (?, ?, 0, 0);';

      await conn.query(query, [userInfo.id, userInfo.clubNum]);

      return true;
    } catch (err) {
      throw err;
    } finally {
      conn?.release();
    }
  }

  static async updateRejectedApplicantById(userInfo) {
    let conn;
    try {
      conn = await mariadb.getConnection();

      const query =
        'UPDATE applicants SET reading_flag = 2 WHERE club_no = ? AND student_id = ?;';

      await conn.query(query, [userInfo.clubNum, userInfo.id]);

      return true;
    } catch (err) {
      throw err;
    } finally {
      conn?.release();
    }
  }
}

module.exports = ApplicationStorage;
