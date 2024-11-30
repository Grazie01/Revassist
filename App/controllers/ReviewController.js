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
      // Fetch the review with associated questions and answers
      const review = await Review.findOne({
        where: { id: reviewId }, // topicId corresponds to the review ID
        include: [
          {
            model: ReviewQuestion,
            as: "questions",
            include: [
              {
                model: ReviewAnswers,
                as: "review_answers", // Ensure alias matches your associations
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
      let questionsAmount = await countQuestionsInReview(reviewId);
      let partialQuestionAmount = getNumberOfQuestions(level, questionsAmount);
  
      // Prepare the array of questions to return
      const questionsToReturn = [];
      const uniqueQuestions = new Set();  // Track unique question IDs
      let totalQuestionsAdded = 0; // Track total questions added (including repetitions)
  
      // Iterate over the questions in the review
      for (const question of review.dataValues.questions) {
        // Only proceed if we still have room for unique questions
        if (uniqueQuestions.size >= partialQuestionAmount) break;
  
        // Extract the confidence levels from related answers
        const answers = question.review_answers || [];
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
  
      // Return the review and formatted questions
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
        order: [['createdAt', 'DESC']], // Order by the latest creation time
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
      // Validate input
      if (!studentReviewId || !questionId || !timeTaken || answer === undefined) {
        return res.status(400).json({
          error: "Review ID, Question ID, Time Taken, and Answer fields are required.",
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
      // Fetch the question by ID
      const question = await ReviewQuestion.findOne({ where: { id: questionId } });
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
  
      // If the record does not exist, create a new one
      if (!studentReview) {
        console.log("studentReview not found. Creating a new record.");
  
        studentReview= await StudentReview.create({
          student_key: studentId,
          review_key: studentReviewId,
          recorded_score: 0,
          total_time_taken: '00:00:00',
          review_level: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }
  
      // Calculate score and total time taken
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
  
      // Update recorded score and total time taken
      studentReview.total_confidence_level = confidence_level;
      studentReview.recorded_score = score;
      studentReview.total_time_taken = totalTime;
  
      // Save the updated or newly created record
      await studentReview.save();
  
      // Respond with the updated score
      return res.status(200).json({ studentReview });
    } catch (error) {
      console.error("Error updating recorded score:", error);
      return res.status(500).json({ error: "Failed to update recorded score", details: error.message });
    }
  }
  
  async function calculateScore(studentReviewId) {
    try {
      // Count the number of correct answers for the given review
      const correctAnswersCount = await ReviewAnswers.count({
        where: {
          review_id_key: studentReviewId,
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

const calculateTotalTimeTaken = async (studentReviewId) => {
    try {
      
      const answers = await ReviewAnswers.findAll({
        where: { review_id_key: studentReviewId },
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
  
      // Fetch the latest answer for each review question
      const answers = await ReviewAnswers.findAll({
        where: {
          review_id_key: studentReviewId,
        },
        attributes: ['id', 'review_question_key', 'is_correct', 'time_taken', 'confidence_level'],
        order: [['createdAt', 'DESC']], // Sort by createdAt in descending order
      });
  
      if (!answers || answers.length === 0) {
        return 'No answers found for the given review.';
      }
  
      // To ensure we only return the latest answer for each question
      const latestAnswers = [];
      const seenQuestions = new Set();
  
      for (const answer of answers) {
        if (!seenQuestions.has(answer.review_question_key)) {
          seenQuestions.add(answer.review_question_key);
          latestAnswers.push(answer);
        }
      }
  
      // Log only the confidence level of the latest answers
      latestAnswers.forEach((answer) => {
        console.log(`Confidence Level for Question ID ${answer.review_question_key}: ${answer.confidence_level}`);
      });
  
      return latestAnswers;
    } catch (error) {
      console.error('Error fetching review answers:', error);
      return 'An error occurred while fetching the answers.';
    }
  }


module.exports = {
    getReviewQuestions,
    createStudentReview,
    setReviewAnswer,
    updateRecordedScore,
    getReview
};
