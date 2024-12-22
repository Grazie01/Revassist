const { Assessment } = require(path.resolve(__dirname,"../models/Assessment"));
const { AssessmentAnswers } = require(path.resolve(__dirname,"../models/AssessmentAnswers"));
const { AssessmentQuestion } = require(path.resolve(__dirname,"../models/Question"));
const { StudentAssessment } = require(path.resolve(__dirname,"../models/StudentAssessment"));
const { Topic } = require(path.resolve(__dirname,"../models/Topic"));
const { Op } = require('sequelize');
const { timeToSeconds, secondsToTime, convertTimeToSeconds, calculateConfidenceLevel, calculateModelConfidenceLevel, getNumberOfQuestions } = require(path.resolve(__dirname,"./UtilityFunctions"));

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

async function getLatestStudentAssessment(studentId, assessmentId) {
  try {
    if (!studentId || !assessmentId) {
      return 'studentId and assessmentId are required.';
    }

    const latestAssessment = await StudentAssessment.findOne({
      where: {
        student_key: studentId,
        assessment_key: assessmentId,
      },
      order: [['createdAt', 'DESC']], 
    });

    if (!latestAssessment) {
      return 'No assessment record found for this student and assessment.';
    }

    return latestAssessment; 
  } catch (error) {
    console.error('Error fetching the latest student assessment:', error);
    return 'An error occurred while fetching the latest assessment record.';
  }
}

async function getAssessment(req, res) {
  const { topicId, studentId } = req.params;
  let level = 0;

  try {
    const assessment = await Assessment.findOne({
      where: { id: topicId },
      include: [
        {
          model: AssessmentQuestion,
          as: "assessment_questions",
          include: [
            {
              model: AssessmentAnswers,
              as: "assessment_answer",
              attributes: ["confidence_level", "assessment_question_key"],
            },
          ],
        },
      ],
    });

    if (!assessment) {
      return res.status(404).json({ message: "Assessment not found" });
    }

    let latestAssessment = await getLatestStudentAssessment(studentId, topicId);

    if (latestAssessment && latestAssessment.dataValues) {
      level = latestAssessment.dataValues.review_level;
    }
    

    let questionsAmount = await countQuestionsInAssessment(topicId);
    let partialQuestionAmount = getNumberOfQuestions(level, questionsAmount);

    const questionsToReturn = [];
    const uniqueQuestions = new Set();  
    let totalQuestionsAdded = 0; 

    for (const question of assessment.assessment_questions) {
      if (uniqueQuestions.size >= partialQuestionAmount) break;

      const answers = question.assessment_answer || [];
      const latestAnswer = answers[answers.length - 1]; 
      const confidenceLevel = latestAnswer ? latestAnswer.confidence_level : null;

      let timesToAppear = 1;
      if (confidenceLevel !== null && confidenceLevel <= 60) {
        timesToAppear = 5; 
      } else if (confidenceLevel > 60 && confidenceLevel <= 80 ) {
        timesToAppear = 3; 
      }else if (confidenceLevel > 80 && confidenceLevel <= 95 ) {
        timesToAppear = 2; 
      }

      if (!uniqueQuestions.has(question.id)) {
        questionsToReturn.push({
          id: question.id,
          question_text: question.query, 
          confidence_level: confidenceLevel,
        });
        uniqueQuestions.add(question.id);  
        totalQuestionsAdded++; 
      }

      for (let i = 1; i < timesToAppear; i++) { 
        questionsToReturn.push({
          id: question.id,
          question_text: question.query,
          confidence_level: confidenceLevel,
        });

        if (totalQuestionsAdded >= partialQuestionAmount) break;
      }

      if (totalQuestionsAdded >= partialQuestionAmount) break;
    }

    console.log("this assessment: ", assessment.dataValues)

    res.status(200).json({
      assessment: {
        
        assessment_id: assessment.id,
        module_key: assessment.module_key,
      },
      questions: questionsToReturn,
    });
  } catch (error) {
    console.error("Error fetching assessment:", error);
    res.status(500).json({
      error: "Getting assessment failed",
      details: error.message,
    });
  }
}

async function getLatestStudentAssessmentAPI(req, res) {
  const { topicId, studentId } = req.params;

  try {
    if (!studentId || !topicId) {
      return res.status(400).json({
        error: "studentId and topicId are required.",
      });
    }

    const latestAssessment = await StudentAssessment.findOne({
      where: {
        student_key: studentId,
        assessment_key: topicId,
      },
      order: [["createdAt", "DESC"]], 
    });

    if (!latestAssessment) {
      return res.status(404).json({
        error: "No assessment record found for this student and topic.",
      });
    }

    return res.status(200).json(latestAssessment);
  } catch (error) {
    console.error("Error fetching the latest student assessment:", error);
    return res.status(500).json({
      error: "An error occurred while fetching the latest assessment record.",
    });
  }
}


async function checkAnswer(questionId, userAns) {
  console.log ("questionid: ", questionId, "user answer: ",userAns)
  try {
    const question = await AssessmentQuestion.findOne({ where: { id: questionId } });
    console.log("question: ", question)
    if (!question) {
      throw new Error("Question not found");
    }

    const isCorrect = userAns === question.answer;

    return isCorrect;
  } catch (error) {
    console.error("Error checking answer:", error.message);
    return null; 
  }
}

async function addStudentAssessment(req, res) {
  const { studentId, topicId } = req.body;

  try {
    let latestrecord = await getLatestStudentAssessment(studentId, topicId);

    let level = 0;
    if (latestrecord && latestrecord.dataValues) {
      level = latestrecord.dataValues.review_level
    }

    const newRecord = await StudentAssessment.create({
      student_key: studentId,
      assessment_key: topicId,
      review_level: level
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
    //console.log(assessments)

    if (!assessments || assessments.length === 0) {
      return res.status(404).json({ message: "Assessments not found" });
    }

    const topicGroups = {};

    for (const assessment of assessments) {
      const topicId = assessment.assessment.topic.id;
      const score = assessment.recorded_score;
      const confidenceLevel = assessment.total_confidence_level;

      const formattedConfidenceLevel = confidenceLevel != null && !isNaN(confidenceLevel) ? Number(confidenceLevel.toFixed(2)): 0;
      console.log(formattedConfidenceLevel)

      const totalQuestions = await AssessmentQuestion.count({
        where: { assessment_key: assessment.assessment_key },
      });

      const averageScore = totalQuestions > 0 ? (score / totalQuestions) * 100 : 0;
      const formattedAverageScore = Number(averageScore.toFixed(2));

      console.log(assessment)

      const assessmentData = {
        id: assessment.id,
        averageScore: formattedAverageScore,
        score: score,
        confidenceLevel: formattedConfidenceLevel,
        createdAt: assessment.createdAt,
      };
      //console.log(assessmentData)

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

async function getAssessmentRecord(req, res) {
  const { assessmentId } = req.params;

  try {
    if (!assessmentId) {
      return res.status(400).json({ error: "Student Assessment ID is required." });
    }

    const studentAssessment = await StudentAssessment.findOne({
      where: { id: assessmentId },  
      include: [
        {
          model: Assessment, 
          as: 'assessment',  
          include: [
            {
              model: AssessmentQuestion,  
              as: 'assessment_questions',
            }
          ]
        },
        {
          model: AssessmentAnswers, 
          as: 'answers', 
          where: { assessment_id_key: assessmentId },
          required: false  
        }
      ]
    });

    // Check if the StudentAssessment record exists
    if (!studentAssessment) {
      return res.status(404).json({ message: "Student assessment not found." });
    }

    const assessmentData = {
      assessmentId: studentAssessment.id,
      studentId: studentAssessment.student_id,  
      createdAt: studentAssessment.createdAt,
      questionsAndAnswers: studentAssessment.assessment.assessment_questions.map((question) => {
        const answers = studentAssessment.answers
          .filter(answer => answer.assessment_question_key === question.id)  
          .map(answer => ({
            answer: answer.answer,
            isCorrect: answer.is_correct
          })); 

        return {
          question: question.query,  
          answers: answers,         
          correct_answer: question.answer        
        };
      }).filter(q => q.answers.length > 0) 
    };

    res.status(200).json(assessmentData);
  } catch (error) {
    console.error("Error getting assessment record:", error);
    res.status(500).json({
      error: "Failed to fetch assessment record.",
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

async function calculateScore(assessmentId) {
  try {
    const correctAnswersCount = await AssessmentAnswers.count({
      where: {
        assessment_id_key: assessmentId,
        is_correct: true, 
      },
    });

    return correctAnswersCount
  } catch (error) {
    console.error("Error calculating score:", error);
    return {
      error: "An error occurred while calculating the score.",
    };
  }
}

const calculateTotalTimeTaken = async (assessmentId) => {
  try {
    const answers = await AssessmentAnswers.findAll({
      where: { assessment_id_key: assessmentId },
    });

    if (answers.length === 0) {
      return '00:00:00'; 
    }

    const totalTimeInSeconds = answers.reduce((total, answer) => {
      const timeInSeconds = timeToSeconds(answer.time_taken); 
      return total + timeInSeconds;
    }, 0);

    const totalTimeFormatted = secondsToTime(totalTimeInSeconds);
    return totalTimeFormatted;

  } catch (error) {
    console.error("Error calculating total time taken:", error);
    return '00:00:00'; 
  }
};

const countQuestionsInAssessment = async (assessmentKey) => {
  try {
    if (!assessmentKey) {
      throw new Error("Assessment key is required.");
    }

    const questionCount = await AssessmentQuestion.count({
      where: { assessment_key: assessmentKey },
    });

    return questionCount;
  } catch (error) {
    console.error("Error counting questions in assessment:", error.message);
    throw error;
  }
};

async function updateRecordedScore(req, res) {
  const { studentId, testId, topicId } = req.body;
  console.log ("studentId: ", studentId, "testId: ", testId, "topicId: ", topicId)
  const passingScore = 80;
  try {
    let studentAssessment = await StudentAssessment.findOne({
      where: { student_key: studentId, id: testId },
    });

    let score = await calculateScore(testId);
    let totalTime = await calculateTotalTimeTaken(testId);
    let formattedTotalTime = convertTimeToSeconds(totalTime);
    let questionsAmount = await countQuestionsInAssessment(topicId);
    let partialQuestionAmount = getNumberOfQuestions(studentAssessment.review_level, questionsAmount );
    console.log(formattedTotalTime, " ",  partialQuestionAmount, " ", (formattedTotalTime <= partialQuestionAmount * 10 && studentAssessment.review_level < 2))

    console.log("studentAssessment.review_level: ", studentAssessment.review_level)
    console.log("partialQuestionAmount: ", partialQuestionAmount)

    let latestAssessment = await getLatestStudentAssessment(studentId, topicId);
    console.log ("latestAssessment: ",latestAssessment )
    
    const answerCards = await getSingleAssessmentAnswersArguement(testId)
    console.log ("answerCards: ",answerCards )
    let confidence_level = calculateModelConfidenceLevel(answerCards.map(card => card.dataValues), partialQuestionAmount);

    console.log ("do i pass? ", confidence_level >= passingScore, " why? confidence: ", confidence_level)

    if (confidence_level >= passingScore)
        studentAssessment.review_level = latestAssessment.review_level + 1;

    console.log ("revew level: ", studentAssessment.review_level)

    studentAssessment.total_confidence_level = confidence_level;
    studentAssessment.recorded_score = score;
    studentAssessment.total_time_taken = totalTime;

    await studentAssessment.save();

    return res.status(200).json({ studentAssessment });
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

async function getAssessmentAnswersArgument(assessmentId, questionId) {
  try {
      if (!assessmentId) {
          return 'assessmentId is required.';
      }
      const answers = await AssessmentAnswers.findAll({
          where: {
            assessment_id_key: assessmentId,
            assessment_question_key: questionId
          },
          attributes: ['id', 'is_correct', 'time_taken'], 
      });
      if (!answers || answers.length === 0) {
          return 'No answers found for the given assessment.';
      }
      return answers;
  } catch (error) {
      console.error('Error fetching assessment answers:', error);
  }
}

async function getSingleAssessmentAnswersArguement(assessmentId) {
  try {
    console.log ("getsingleassessment: ", assessmentId)
    if (!assessmentId) {
      return 'assessmentId is required.';
    }
    const answers = await AssessmentAnswers.findAll({
      where: {
        assessment_id_key: assessmentId,
      },
      attributes: ['id', 'assessment_question_key', 'is_correct', 'time_taken', 'confidence_level'],
      order: [['createdAt', 'DESC']],
    });

    if (!answers || answers.length === 0) {
      return 'No answers found for the given assessment.';
    }

    const latestAnswers = [];
    const seenQuestions = new Set();

    for (const answer of answers) {
      if (!seenQuestions.has(answer.assessment_question_key)) {
        seenQuestions.add(answer.assessment_question_key);
        latestAnswers.push(answer);
      }
    }

    latestAnswers.forEach((answer) => {
      console.log(`Confidence Level for Question ID ${answer.assessment_question_key}: ${answer.confidence_level}`);
    });

    return latestAnswers;
  } catch (error) {
    console.error('Error fetching assessment answers:', error);
    return 'An error occurred while fetching the answers.';
  }
}



async function getAssessmentAnswers(req, res) {
  const { assessmentId } = req.params;
  try {
      if (!assessmentId) {
          return res.status(400).json({ error: 'assessmentId are required.' });
      }
      const answers = await AssessmentAnswers.findAll({
          where: {
            assessment_id_key: assessmentId,
          },
          attributes: ['id', 'is_correct'], 
      });
      if (!answers || answers.length === 0) {
          return res.status(404).json({ message: 'No answers found for the given assessment and question.' });
      }
      res.status(200).json({ success: true, data: answers });
  } catch (error) {
      console.error('Error fetching assessment answers:', error);
      res.status(500).json({ error: 'An error occurred while fetching the answers.' });
  }
}


async function getAssessmentAnswer(req, res) {
  const { assessmentId, questionId } = req.body;
  try {
      if (!assessmentId || !questionId) {
          return res.status(400).json({ error: 'assessmentId and questionId are required.' });
      }
      const answers = await AssessmentAnswers.findAll({
          where: {
            assessment_id_key: assessmentId,
          },
          include: [
              {
                  model: AssessmentQuestion,
                  where: { id: questionId },
                  attributes: ['query', 'answer'],
              },
          ],
          attributes: ['id', 'is_correct', 'date_created'], 
      });
      if (!answers || answers.length === 0) {
          return res.status(404).json({ message: 'No answers found for the given assessment and question.' });
      }
      res.status(200).json({ success: true, data: answers });
  } catch (error) {
      console.error('Error fetching assessment answers:', error);
      res.status(500).json({ error: 'An error occurred while fetching the answers.' });
  }
}

async function setAssessmentAnswer(req, res) {
  const { assessmentId, questionId, timeTaken, answer } = req.body;
  console.log(`Received: assessmentId=${assessmentId}, questionId=${questionId}, timeTaken=${timeTaken}, answer=${answer}`);

  try {
    if (!assessmentId || !questionId || !timeTaken || answer === undefined) {
      return res.status(400).json({
        error: "Assessment ID, Question ID, Time Taken, and Answer fields are required.",
      });
    }

    const isCorrect = await checkAnswer(questionId, answer);
    if (isCorrect === null) {
      return res.status(400).json({ error: "Error checking the answer. Please try again." });
    }
    console.log("is correct: ", isCorrect);

    console.log("Creating new answer record...");
    const newAnswer = await AssessmentAnswers.create({
      assessment_id_key: assessmentId,
      assessment_question_key: questionId,
      is_correct: isCorrect,
      time_taken: timeTaken,
      answer: answer,
    });

    const allAnswers = await getAssessmentAnswersArgument(assessmentId, questionId);
    let confidence_level = calculateConfidenceLevel(allAnswers);
    console.log("Calculated confidence level: ", confidence_level);

    await updateConfidenceLevel(confidence_level, newAnswer.id)

    return res.status(201).json({
      message: "Answer submitted successfully",
      newAnswer: newAnswer
    });

  } catch (error) {
    console.error("Error handling assessment answer:", error.message, error.stack);
    return res.status(500).json({ error: "An error occurred while processing the request." });
  }
}

async function updateConfidenceLevel(confidence_level, id) {
  try {
    await AssessmentAnswers.update(
      { confidence_level: confidence_level },
      { where: { id: id } }
    );
  } catch (error) {
    console.error("Error updating assessment answer:", error.message, error.stack);
  }
}


module.exports = {
  getAllAssessments,
  getAssessment,
  addStudentAssessment,
  getAllStudentAssessments,
  getLatestStudentAssessmentId,
  updateRecordedScore,
  getNextAvailableId,
  getAssessmentAnswer,
  getAssessmentAnswers,
  setAssessmentAnswer,
  getLatestStudentAssessmentAPI,
  getAssessmentRecord
};
