const { Assessment } = require("../models/Assessment");
const { AssessmentQuestion } = require("../models/Question");
const { StudentAssessment } = require("../models/StudentAssessment");
const { Topic } = require("../models/Topic");
const { Op } = require('sequelize');

async function getAllAssessments(req, res) {
  try {
    const assessments = await Assessment.findAll({
      include: [
        {
          model: Topic,
          as: "topic",
          attributes: ["id", "title"],
        },
      ],
    });

    if (!assessments) {
      return res.status(404).json({ message: "Assessments not found" });
    }

    res.status(200).json(assessments);
  } catch (error) {
    res.status(500).json({
      error: "Getting assessments failed",
      details: error.message,
    });
  }
}

async function getAssessment(req, res) {
  const { topicId } = req.params;

  try {
    const assessment = await Assessment.findOne({
      where: { module_key: topicId },
      include: [
        {
          model: AssessmentQuestion,
          as: "assessment_questions",
        },
      ],
    });

    if (!assessment) {
      return res.status(404).json({ message: "Assessment not found" });
    }

    res.status(200).json(assessment);
  } catch (error) {
    res.status(500).json({
      error: "Getting assessment failed",
      details: error.message,
    });
  }
}

async function checkAnswer(req, res) {
  const { userAns, questionId, studentId, testId } = req.body;
  console.log("userAns:", userAns, "questionId:", questionId, "studentId:", studentId, "testId:", testId);

  try {
    const question = await AssessmentQuestion.findOne({ where: { id: questionId } });

    if (!question) {
      return res.status(404).json({ error: "Question not found" });
    }

    const isCorrect = userAns === question.answer;
    const scoreDelta = isCorrect ? 1 : 0;

    let studentAssessment = await StudentAssessment.findOne({
      where: { student_key: studentId, id: testId },
    });

    if (!studentAssessment) {
      return res.status(404).json({ error: "Student assessment record not found" });
    }

    studentAssessment.current_score += scoreDelta;
    await studentAssessment.save(); 

    res.status(200).json({
      message: isCorrect ? "Correct" : "Incorrect",
      updatedScore: studentAssessment.current_score, 
    });
  } catch (error) {
    console.error("Error checking answer and updating score:", error);
    res.status(500).json({
      error: "Checking answer and updating score failed",
      details: error.message,
    });
  }
}

async function addStudentAssessment(req, res) {
  const { studentId, testId, score, assessment_key } = req.body;

  try {
    const newRecord = await StudentAssessment.create({
      student_key: studentId,
      id: testId,
      current_score: score,
      assessment_key: assessment_key
    });

    res.status(201).json({
      message: "New assessment record added successfully",
      newRecord,
    });
  } catch (error) {
    console.error("Error adding student assessment:", error);
    res.status(500).json({
      error: "Failed to add assessment record",
      details: error.message,
    });
  }
}

async function getAllStudentAssessments(req, res) {
  const { studentId } = req.params;

  try {
    const assessments = await StudentAssessment.findAll({
      where: {
        student_key: studentId,
        recorded_score: { [Op.ne]: 0 }, 
      },
      include: [
        {
          model: Assessment,
          as: "assessment",
          include: [
            {
              model: Topic,
              as: "topic",
              attributes: ["id", "title"],
            },
          ],
        },
      ],
      order: [['createdAt', 'ASC']],
    });

    if (!assessments || assessments.length === 0) {
      return res.status(404).json({ message: "Assessments not found" });
    }

    const topicGroups = {};

    for (const assessment of assessments) {
      const topicId = assessment.assessment.topic.id;
      const score = assessment.current_score;

      const totalQuestions = await AssessmentQuestion.count({
        where: { assessment_key: assessment.assessment_key },
      });

      const averageScore = totalQuestions > 0 ? (score / totalQuestions) * 100 : 0;
      const formattedAverageScore = Number(averageScore.toFixed(2));

      const assessmentData = {
        averageScore: formattedAverageScore,
        score: score,
        createdAt: assessment.createdAt,
      };

      if (!topicGroups[topicId]) {
        topicGroups[topicId] = {
          topic: {
            id: topicId,
            title: assessment.assessment.topic.title,
          },
          assessments: [],
        };
      }

      topicGroups[topicId].assessments.push(assessmentData);
    }

    const response = Object.values(topicGroups).map((topicGroup) => {
      topicGroup.assessments.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
      return topicGroup;
    });

    res.status(200).json(response);
  } catch (error) {
    console.error("Error getting assessments:", error);
    res.status(500).json({
      error: "Getting assessments failed",
      details: error.message,
    });
  }
}




async function resetCurrentScore(req, res) {
  const { studentId, testId } = req.body;

  try {
    const assessmentRecord = await StudentAssessment.findOne({
      where: { student_key: studentId, id: testId },
    });

    if (!assessmentRecord) {
      return res.status(404).json({ error: "Assessment record not found" });
    }

    assessmentRecord.current_score = 0;
    await assessmentRecord.save();

    res.status(200).json({
      message: "Current score reset successfully",
      assessmentRecord,
    });
  } catch (error) {
    console.error("Error resetting score:", error);
    res.status(500).json({
      error: "Failed to reset score",
      details: error.message,
    });
  }
}


async function getLatestStudentAssessmentId(req, res) {
  const { studentId, moduleId } = req.params;

  try {
    const latestRecord = await StudentAssessment.findOne({
      where: { 
        student_key: studentId,
        assessment_key: moduleId 
      },
      order: [['id', 'DESC']],
    });

    if (!latestRecord) {
      return res.status(404).json({ message: "No assessment found for this student and module" });
    }

    console.log(latestRecord.id)

    res.status(200).json({
      latestAssessmentId: latestRecord.id,
      recorded_score: latestRecord.recorded_score
    });
  } catch (error) {
    console.error("Error retrieving latest student assessment:", error);
    res.status(500).json({
      error: "Failed to retrieve the latest student assessment ID",
      details: error.message,
    });
  }
}

async function updateRecordedScore(req, res) {
  const { studentId, testId } = req.body;
  try {
    const studentAssessment = await StudentAssessment.findOne({
      where: { student_key: studentId, id: testId },
    });

    if (!studentAssessment) {
      return res.status(404).json({ error: "Student assessment record not found" });
    }

    studentAssessment.recorded_score = studentAssessment.current_score; 
    await studentAssessment.save(); // Save the updated record

    return res.status(200).json({ updatedScore: studentAssessment.recorded_score }); 
  } catch (error) {
    console.error("Error updating recorded score:", error);
    return res.status(500).json({ error: "Failed to update recorded score", details: error.message });
  }
}

async function getNextAvailableId(req, res) {
  try {
    const maxId = await StudentAssessment.max('id');

    const nextId = maxId ? maxId + 1 : 1;

    return res.status(200).json({ nextAvailableId: nextId });
  } catch (error) {
    console.error("Error fetching next available ID:", error);
    return res.status(500).json({ error: "Failed to generate next available assessment ID" });
  }
}




module.exports = {
  getAllAssessments,
  getAssessment,
  checkAnswer,
  addStudentAssessment,
  getAllStudentAssessments,
  resetCurrentScore,
  getLatestStudentAssessmentId,
  updateRecordedScore,
  getNextAvailableId
};
