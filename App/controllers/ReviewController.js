const { ReviewQuestion } = require("../models/Flashcard_Questions");
const { Review } = require("../models/Flashcard_Review");
const { Lesson } = require("../models/Lesson");
const { ReviewAnswers } = require("../models/ReviewAnswers");
const { StudentReview } = require("../models/Student_Review");
const { calculateConfidenceLevel, getNumberOfQuestions, convertTimeToSeconds, timeToSeconds, secondsToTime } = require("./UtilityFunctions");

async function getReviewQuestions(req, res) {
    const { lessonId } = req.params;

    try {
        const review = await Review.findOne({
            where: { lesson_key: lessonId },
            include: { model: ReviewQuestion, as: "questions" },
        });

        if (!review) {
            return res.status(404).json({ error: "Review not found" });
        }


        res.json({questions: review });
    } catch (error) {
        res.status(500).json({
            error: "Failed to fetch review questions",
            details: error.message,
        });
    }
}

/*==============================================================================================================================*/

async function getReview(req, res) {
    const { reviewId, studentId } = req.params;
    let level = 0;
  
    try {
      const review = await Review.findOne({
        where: { id: reviewId }, 
        include: [
          {
            model: ReviewQuestion,
            as: "questions",
            include: [
              {
                model: ReviewAnswers,
                as: "review_answers", 
                attributes: ["confidence_level", "review_question_key"],
              },
            ],
          },
        ],
      });
  
      if (!review) {
        return res.status(404).json({ message: "review not found" });
      }
  
      let latestReview = await getLatestStudentReview(studentId, reviewId);
      level = latestReview.dataValues.review_level;
      console.log("level: ", level)
      let questionsAmount = await countQuestionsInReview(reviewId);
      let partialQuestionAmount = getNumberOfQuestions(level, questionsAmount);
  
      const questionsToReturn = [];
      const uniqueQuestions = new Set();
      let totalQuestionsAdded = 0; 
  
      for (const question of review.dataValues.questions) {
        if (uniqueQuestions.size >= partialQuestionAmount) break;
  
        const answers = question.review_answers || [];
        const latestAnswer = answers[answers.length - 1]; 
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
  
      res.status(200).json({
        review: {
          id: review.id,
          module_key: review.module_key,
        },
        questions: questionsToReturn,
      });
    } catch (error) {
      console.error("Error fetching review:", error);
      res.status(500).json({
        error: "Getting review failed",
        details: error.message,
      });
    }
  }

async function getLatestStudentReview(studentId, review_key) {
    try {
      if (!studentId || !review_key) {
        return 'studentId and review_key are required.';
      }
  
      const latestReview = await StudentReview.findOne({
        where: {
          student_key: studentId,
          review_key: review_key,
        },
        order: [['createdAt', 'DESC']],
      });
  
      if (!latestReview) {
        return 'No latestReview record found for this student and review.';
      }
  
      return latestReview;
    } catch (error) {
      console.error('Error fetching the latest student review:', error);
      return 'An error occurred while fetching the latest review record.';
    }
  }

async function createStudentReview (req, res) {
    const { studentId, review_key } = req.body;

    try {
      let latestrecord = await getLatestStudentReview(studentId, review_key);
      let level = latestrecord == 0 || latestrecord == 1 || latestrecord == 2 ? latestrecord.dataValues.review_level : 0;
  
      const newRecord = await StudentReview.create({
        student_key: studentId,
        review_key: review_key,
        review_level: level
      });
  
      res.status(201).json({
        message: "New review record added successfully",
        newRecord,
      });
    } catch (error) {
      console.error("Error adding student review:", error);
      res.status(500).json({
        error: "Failed to add review record",
        details: error.message,
      });
    }
}

async function setReviewAnswer(req, res) {
    const { studentReviewId, questionId, timeTaken, answer } = req.body;
    console.log(`Received: studentReviewId=${studentReviewId}, questionId=${questionId}, timeTaken=${timeTaken}, answer=${answer}`);
  
    try {
      if (!studentReviewId || !questionId || !timeTaken || answer === undefined) {
        return res.status(400).json({
          error: "Review ID, Question ID, Time Taken, and Answer fields are required.",
        });
      }
  
      const isCorrect = await checkAnswer(questionId, answer);
      if (isCorrect === null) {
        return res.status(400).json({ error: "Error checking the answer. Please try again." });
      }
      console.log("is correct: ", isCorrect);
  
      console.log("Creating new answer record...");
      const newAnswer = await ReviewAnswers.create({
        review_id_key: studentReviewId,
        review_question_key: questionId,
        is_correct: isCorrect,
        time_taken: timeTaken,
        answer: answer,
      });
  
      const allAnswers = await getReviewAnswersArgument(studentReviewId, questionId);
      let confidence_level = calculateConfidenceLevel(allAnswers);
      console.log("Calculated confidence level: ", confidence_level);
  
      await updateConfidenceLevel(confidence_level, newAnswer.id)
  
      return res.status(201).json({
        message: "Answer submitted successfully",
        newAnswer: newAnswer
      });
  
    } catch (error) {
      console.error("Error handling ReviewAnswers answer:", error.message, error.stack);
      return res.status(500).json({ error: "An error occurred while processing the request." });
    }
  }
  
  async function updateConfidenceLevel(confidence_level, id) {
    try {
      await ReviewAnswers.update(
        { confidence_level: confidence_level },
        { where: { id: id } }
      );
    } catch (error) {
      console.error("Error updating ReviewAnswers answer:", error.message, error.stack);
    }
  }

  async function checkAnswer(questionId, userAns) {
    console.log ("questionid: ", questionId, "user answer: ",userAns)
    try {
      const question = await ReviewQuestion.findOne({ where: { id: questionId } });
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
  
  async function getReviewAnswersArgument(studentReviewId, questionId) {
    try {
        if (!studentReviewId) {
            return 'studentReviewId is required.';
        }
        const answers = await ReviewAnswers.findAll({
            where: {
              review_id_key: studentReviewId,
              review_question_key: questionId
            },
            attributes: ['id', 'is_correct', 'time_taken'], 
        });
        if (!answers || answers.length === 0) {
            return 'No answers found for the given studentReview.';
        }
        return answers;
    } catch (error) {
        console.error('Error fetching studentReview answers:', error);
    }
  }

  async function updateRecordedScore(req, res) {
    const { studentId, studentReviewId, reviewId } = req.body;
    const passingScore = 80;
    try {

      let studentReview = await StudentReview.findOne({
        where: { student_key: studentId, id: studentReviewId },
      });
  
      let score = await calculateScore(studentReviewId); 
      let totalTime = await calculateTotalTimeTaken(studentReviewId); 
      let formattedTotalTime = convertTimeToSeconds(totalTime);
      let questionsAmount = await countQuestionsInReview(reviewId);
      let partialQuestionAmount = getNumberOfQuestions(studentReview.review_level, questionsAmount );
      console.log(formattedTotalTime, " ",  partialQuestionAmount, " ", (formattedTotalTime <= partialQuestionAmount * 10 && studentReview.review_level < 2))
  
      console.log("studentReview.review_level: ", studentReview.review_level)
      console.log("partialQuestionAmount: ", partialQuestionAmount)
      
      const answerCards = await getReviewAnswersOneQuestion(studentReviewId)
      let confidence_level = calculateConfidenceLevel(answerCards.map(card => card.dataValues), partialQuestionAmount);

      let latestReview = await getLatestStudentReview(studentId, reviewId); //
        console.log ("latestReview: ",latestReview )
  
      if (confidence_level >= passingScore)
        studentReview.review_level = latestReview + 1;
  
      studentReview.total_confidence_level = confidence_level;
      studentReview.recorded_score = score;
      studentReview.total_time_taken = totalTime;
  
      await studentReview.save();
  
      return res.status(200).json({ studentReview });
    } catch (error) {
      console.error("Error updating recorded score:", error);
      return res.status(500).json({ error: "Failed to update recorded score", details: error.message });
    }
  }
  
  async function calculateScore(studentReviewId) {
    try {
      const correctAnswersCount = await ReviewAnswers.count({
        where: {
          review_id_key: studentReviewId,
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

const calculateTotalTimeTaken = async (studentReviewId) => {
    try {
      
      const answers = await ReviewAnswers.findAll({
        where: { review_id_key: studentReviewId },
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

  const countQuestionsInReview = async (reviewId) => {
    try {
      if (!reviewId) {
        throw new Error("Review key is required.");
      }
  
      const questionCount = await ReviewQuestion.count({
        where: { flashcard_key: reviewId },
      });
  
      return questionCount;
    } catch (error) {
      console.error("Error counting questions in review:", error.message);
      throw error;
    }
  };

  async function getReviewAnswersOneQuestion(studentReviewId) {
    try {
      if (!studentReviewId) {
        return 'studentReviewId is required.';
      }
  
      const answers = await ReviewAnswers.findAll({
        where: {
          review_id_key: studentReviewId,
        },
        attributes: ['id', 'review_question_key', 'is_correct', 'time_taken', 'confidence_level'],
        order: [['createdAt', 'DESC']], 
      });
  
      if (!answers || answers.length === 0) {
        return 'No answers found for the given review.';
      }
  
      const latestAnswers = [];
      const seenQuestions = new Set();
  
      for (const answer of answers) {
        if (!seenQuestions.has(answer.review_question_key)) {
          seenQuestions.add(answer.review_question_key);
          latestAnswers.push(answer);
        }
      }
  
      latestAnswers.forEach((answer) => {
        console.log(`Confidence Level for Question ID ${answer.review_question_key}: ${answer.confidence_level}`);
      });
  
      return latestAnswers;
    } catch (error) {
      console.error('Error fetching review answers:', error);
      return 'An error occurred while fetching the answers.';
    }
  }

  async function getLatestStudentReviewAPI(req, res) {
    const { lessonId, studentId } = req.params;
  
    try {
      if (!studentId || !lessonId) {
        return res.status(400).json({
          error: "studentId and lessonId are required.",
        });
      }
  
      const latestReview = await StudentReview.findOne({
        where: {
          student_key: studentId,
          review_key: lessonId,
        },
        order: [["createdAt", "DESC"]], 
      });
  
      if (!latestReview) {
        return res.status(404).json({
          error: "No review record found for this student and topic.",
        });
      }
  
      return res.status(200).json(latestReview);
    } catch (error) {
      console.error("Error fetching the latest student review:", error);
      return res.status(500).json({
        error: "An error occurred while fetching the latest review record.",
      });
    }
  }

  async function getReviewRecords(req, res) {
    const { studentId } = req.params;
  
    try {
      // Validate studentId
      if (!studentId) {
        return res.status(400).json({
          error: "Student ID is required.",
        });
      }
  
      // Fetch the review records with associated answers and lesson details
      const reviewRecords = await StudentReview.findAll({
        where: {
          student_key: studentId,
        },
        include: [
          {
            model: Review,
            as: 'review', // Ensure alias matches the association in the Review model
            include: [
              {
                model: Lesson,
                as: 'lesson', // Include lesson information
                attributes: ['title'], // Only include the lesson title
              },
            ],
          },
        ],
      });
  
      // Check if any records were found
      if (!reviewRecords || reviewRecords.length === 0) {
        return res.status(404).json({
          error: "No review records found for this student.",
        });
      }
  
      // Return the review records along with lesson title
      return res.status(200).json({
        message: "Review records retrieved successfully.",
        data: reviewRecords.map(record => ({
          ...record.toJSON(),
          lessonTitle: record.review.lesson.title, // Add lesson title to the result
        })),
      });
    } catch (error) {
      console.error("Error fetching student review records:", error.message);
      return res.status(500).json({
        error: "An error occurred while fetching review records.",
        details: error.message,
      });
    }
  }

  async function getReviewRecord(req, res) {
    const { studentReviewId } = req.params;
  
    try {
      // Validate that studentReviewId is provided
      if (!studentReviewId) {
        return res.status(400).json({ error: "studentReviewId is required." });
      }
  
      // Fetch the StudentReview record with associated Review, Questions, and filtered Answers
      const studentReview = await StudentReview.findOne({
        where: { id: studentReviewId },  // Find the StudentReview by its ID
        include: [
          {
            model: Review, 
            as: 'review',  
            include: [
              {
                model: ReviewQuestion,  // Fetch the associated ReviewQuestions
                as: 'questions', // Alias for the questions in Review
              }
            ]
          },
          {
            model: ReviewAnswers, 
            as: 'answers', 
            where: { review_id_key: studentReviewId }, 
            required: false  
          }
        ]
      });
  
      // Check if the StudentReview record exists
      if (!studentReview) {
        return res.status(404).json({ message: "Student review not found." });
      }
  
      // Prepare the data to return, including questions and answers grouped together
      const reviewData = {
        reviewId: studentReview.id,
        studentId: studentReview.student_key,  
        createdAt: studentReview.createdAt,
        questionsAndAnswers: studentReview.review.questions.map((question) => {
          // Filter the answers that belong to this specific question
          const answersForQuestion = studentReview.answers.filter(answer => answer.review_question_key === question.id);  
          
          // Map answers and include 'isCorrect' and 'answer' field
          const answers = answersForQuestion.map(answer => ({
            answer: answer.answer,
            isCorrect: answer.is_correct,
          }));
  
          // Return the question along with its answers (including the correct answer)
          return {
            question: question.query,  
            answers: answers,         
            correct_answer: question.answer,  // Correct answer for the question
          };
        }).filter(q => q.answers.length > 0),  // Filter out questions without answers
      };
  
      // Return the grouped questions and answers data
      res.status(200).json(reviewData);
  
    } catch (error) {
      console.error("Error getting review record:", error);
      res.status(500).json({
        error: "Failed to fetch review record.",
        details: error.message,
      });
    }
  }
  
  
  

module.exports = {
    getReviewQuestions,
    createStudentReview,
    setReviewAnswer,
    updateRecordedScore,
    getReview,
    getLatestStudentReviewAPI,
    getReviewRecords,
    getReviewRecord
};
