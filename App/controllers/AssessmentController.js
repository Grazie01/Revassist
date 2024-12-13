const { Assessment } = require("../models/Assessment");
const { AssessmentAnswers } = require("../models/AssessmentAnswers");
const { AssessmentQuestion } = require("../models/Question");
const { StudentAssessment } = require("../models/StudentAssessment");
const { Topic } = require("../models/Topic");
const { Op } = require('sequelize');
const { timeToSeconds, secondsToTime, convertTimeToSeconds, calculateConfidenceLevel, calculateModelConfidenceLevel, getNumberOfQuestions } = require("./UtilityFunctions");

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

    // Fetch the latest student assessment for the given student and assessment
    const latestAssessment = await StudentAssessment.findOne({
      where: {
        student_key: studentId,
        assessment_key: assessmentId,
      },
      order: [['createdAt', 'DESC']], // Order by the latest creation time
    });

    if (!latestAssessment) {
      return 'No assessment record found for this student and assessment.';
    }

    return latestAssessment; // Return the latest student assessment record
  } catch (error) {
    console.error('Error fetching the latest student assessment:', error);
    return 'An error occurred while fetching the latest assessment record.';
  }
}

async function getAssessment(req, res) {
  const { topicId, studentId } = req.params;
  let level = 0;

  try {
    // Fetch the assessment with associated questions and answers
    const assessment = await Assessment.findOne({
      where: { id: topicId }, // topicId corresponds to the Assessment ID
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

    // Prepare the array of questions to return
    const questionsToReturn = [];
    const uniqueQuestions = new Set();  // Track unique question IDs
    let totalQuestionsAdded = 0; // Track total questions added (including repetitions)

    // Iterate over the questions in the assessment
    for (const question of assessment.assessment_questions) {
      // Only proceed if we still have room for unique questions
      if (uniqueQuestions.size >= partialQuestionAmount) break;

      // Extract the confidence levels from related answers
      const answers = question.assessment_answer || [];
      const latestAnswer = answers[answers.length - 1]; // Assuming latest answer determines confidence level
      const confidenceLevel = latestAnswer ? latestAnswer.confidence_level : null;

      // Determine how many times this question should appear based on confidence level
      let timesToAppear = 1; // Default
      if (confidenceLevel !== null && confidenceLevel <= 60) {
        timesToAppear = 5; 
      } else if (confidenceLevel > 60 && confidenceLevel <= 80 ) {
        timesToAppear = 3; 
      }else if (confidenceLevel > 80 && confidenceLevel <= 95 ) {
        timesToAppear = 2; 
      }

      // Add the question once (as a unique question) if it's not already added
      if (!uniqueQuestions.has(question.id)) {
        questionsToReturn.push({
          id: question.id,
          question_text: question.query,  // Assuming `question_text` is `query`
          confidence_level: confidenceLevel,
        });
        uniqueQuestions.add(question.id);  // Mark this question as added
        totalQuestionsAdded++; // Increment the total number of questions added
      }

      // Repeat the question the appropriate number of times (only count towards repetitions)
      for (let i = 1; i < timesToAppear; i++) { // Start from 1 because the first appearance is already added
        questionsToReturn.push({
          id: question.id,
          question_text: question.query,
          confidence_level: confidenceLevel,
        });

        // If we've reached the limit of total questions (including repetitions), stop
        if (totalQuestionsAdded >= partialQuestionAmount) break;
      }

      // If we've reached the limit on total questions (including repetitions), stop
      if (totalQuestionsAdded >= partialQuestionAmount) break;
    }

    console.log("this assessment: ", assessment.dataValues)

    // Return the assessment and formatted questions
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

    // Fetch the latest student assessment for the given student and topic
    const latestAssessment = await StudentAssessment.findOne({
      where: {
        student_key: studentId,
        assessment_key: topicId,
      },
      order: [["createdAt", "DESC"]], // Order by the latest creation time
    });

    if (!latestAssessment) {
      return res.status(404).json({
        error: "No assessment record found for this student and topic.",
      });
    }

    // Return the latest student assessment record
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
    // Fetch the question by ID
    const question = await AssessmentQuestion.findOne({ where: { id: questionId } });
    console.log("question: ", question)
    // Handle case where question is not found
    if (!question) {
      throw new Error("Question not found");
    }

    // Check if the user's answer matches the correct answer
    const isCorrect = userAns === question.answer;

    return isCorrect;
  } catch (error) {
    console.error("Error checking answer:", error.message);
    // Handle error appropriately (return false, or rethrow if needed)
    return null; // Indicates an error occurred
  }
}

async function addStudentAssessment(req, res) {
  const { studentId, topicId } = req.body;

  try {
    // Fetch the latest assessment record for the student and assessment
    let latestrecord = await getLatestStudentAssessment(studentId, topicId);

    // Check if the latest record exists
    let level = 0; // Default level is 0
    if (latestrecord && latestrecord.dataValues) {
      level = latestrecord.dataValues.review_level
    }

    // Create a new assessment record
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
    // Validate that assessmentId is provided
    if (!assessmentId) {
      return res.status(400).json({ error: "Student Assessment ID is required." });
    }

    // Fetch the StudentAssessment record with associated Assessment, Questions, and filtered Answers
    const studentAssessment = await StudentAssessment.findOne({
      where: { id: assessmentId },  // Find the StudentAssessment by its ID
      include: [
        {
          model: Assessment,  // Fetch the associated Assessment
          as: 'assessment',   // Alias for the Assessment
          include: [
            {
              model: AssessmentQuestion,  // Fetch the associated AssessmentQuestions
              as: 'assessment_questions', // Alias for the questions in Assessment
            }
          ]
        },
        {
          model: AssessmentAnswers,  // Fetch the related AssessmentAnswers
          as: 'answers',  // Alias for answers related to the StudentAssessment
          where: { assessment_id_key: assessmentId }, // Correct filtering condition for answers
          required: false  // Allow questions without answers (i.e., optional answers)
        }
      ]
    });

    // Check if the StudentAssessment record exists
    if (!studentAssessment) {
      return res.status(404).json({ message: "Student assessment not found." });
    }

    // Prepare the data to return, including questions and answers grouped together
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

    // Return the grouped questions and answers data
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
    // Count the number of correct answers for the given assessment
    const correctAnswersCount = await AssessmentAnswers.count({
      where: {
        assessment_id_key: assessmentId,
        is_correct: true, // Only count correct answers
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

// Function to calculate total time taken for a StudentAssessment
const calculateTotalTimeTaken = async (assessmentId) => {
  try {
    // Fetch all assessment answers related to the given StudentAssessment
    const answers = await AssessmentAnswers.findAll({
      where: { assessment_id_key: assessmentId },
    });

    // If no answers found, return 0
    if (answers.length === 0) {
      return '00:00:00'; // No time recorded
    }

    // Sum up all the time_taken values in seconds
    const totalTimeInSeconds = answers.reduce((total, answer) => {
      const timeInSeconds = timeToSeconds(answer.time_taken); // Convert each time_taken to seconds
      return total + timeInSeconds;
    }, 0);

    // Convert the total seconds back into HH:MM:SS format
    const totalTimeFormatted = secondsToTime(totalTimeInSeconds);
    return totalTimeFormatted;

  } catch (error) {
    console.error("Error calculating total time taken:", error);
    return '00:00:00'; // Return 0 if error occurs
  }
};

const countQuestionsInAssessment = async (assessmentKey) => {
  try {
    // Ensure the assessmentKey is provided
    if (!assessmentKey) {
      throw new Error("Assessment key is required.");
    }

    // Count the number of questions associated with the assessment key
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
    // Check if the student's assessment record exists
    let studentAssessment = await StudentAssessment.findOne({
      where: { student_key: studentId, id: testId },
    });

    // Calculate score and total time taken
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

    // Update recorded score and total time taken
    studentAssessment.total_confidence_level = confidence_level;
    studentAssessment.recorded_score = score;
    studentAssessment.total_time_taken = totalTime;

    // Save the updated or newly created record
    await studentAssessment.save();

    // Respond with the updated score
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
      order: [['createdAt', 'DESC']], // Sort by createdAt in descending order
    });

    if (!answers || answers.length === 0) {
      return 'No answers found for the given assessment.';
    }

    // To ensure we only return the latest answer for each question
    const latestAnswers = [];
    const seenQuestions = new Set();

    for (const answer of answers) {
      if (!seenQuestions.has(answer.assessment_question_key)) {
        seenQuestions.add(answer.assessment_question_key);
        latestAnswers.push(answer);
      }
    }

    // Log only the confidence level of the latest answers
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
    // Validate input
    if (!assessmentId || !questionId || !timeTaken || answer === undefined) {
      return res.status(400).json({
        error: "Assessment ID, Question ID, Time Taken, and Answer fields are required.",
      });
    }

    // Validate correctness of the answer
    const isCorrect = await checkAnswer(questionId, answer);
    if (isCorrect === null) {
      return res.status(400).json({ error: "Error checking the answer. Please try again." });
    }
    console.log("is correct: ", isCorrect);

    // Create a new answer record
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
