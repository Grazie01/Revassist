const { ReviewQuestion } = require("../models/Flashcard_Questions");
const { Review } = require("../models/Flashcard_Review");
const { Lesson } = require("../models/Lesson");
const { StudentReview } = require("../models/Student_Review");

async function getReviewQuestions(req, res) {
    const { lessonId, studentId } = req.params;

    try {
        const review = await Review.findOne({
            where: { lesson_key: lessonId },
            include: { model: ReviewQuestion, as: "questions" },
        });

        if (!review) {
            return res.status(404).json({ error: "Review not found" });
        }

        const studentExists = await StudentReview.findOne({ where: { student_key: studentId } });
        if (!studentExists) {
            return res.status(404).json({ error: "Student not found" });
        }

        let studentReview = await StudentReview.findOne({
            where: { student_key: studentId, review_key: review.id },
        });

        if (!studentReview) {
            studentReview = await StudentReview.create({
                student_key: studentId,
                review_key: review.id,
                review_level: 0,
                time_taken: 0,
                number_of_questions: 0,
            });
        }

        const questions = review.questions;
        const numOfQuestions = questions.length;

        let limit;
        switch (studentReview.review_level) {
            case 0:
                limit = Math.ceil(numOfQuestions / 3);
                break;
            case 1:
                limit = Math.ceil(numOfQuestions / 2);
                break;
            default:
                limit = numOfQuestions;
                break;
        }

        const limitedQuestions = questions.slice(0, limit);

        res.json({ review: { ...review.toJSON(), questions: limitedQuestions } });
    } catch (error) {
        res.status(500).json({
            error: "Failed to fetch review questions",
            details: error.message,
        });
    }
}


async function createReviewRecord(req, res) {
    const { studentId, reviewId, timeTaken, numOfQuestions } = req.body;

    try {
        let studentReview = await StudentReview.findOne({
            where: { student_key: studentId, review_key: reviewId },
        });

        if (studentReview) {
            studentReview.time_taken = timeTaken;
            studentReview.number_of_questions = numOfQuestions;

            if (timeTaken <= numOfQuestions * 10 && studentReview.review_level < 2) {
                studentReview.review_level += 1;
            }

            await studentReview.save();
            return res.status(200).json({
                message: "Review record updated successfully",
                review: studentReview,
            });
        } else {
            const newReview = await StudentReview.create({
                student_key: studentId,
                review_key: reviewId,
                time_taken: timeTaken,
                number_of_questions: numOfQuestions,
                review_level: 0,
            });

            return res.status(201).json({
                message: "Review record created successfully",
                review: newReview,
            });
        }
    } catch (error) {
        console.error("Error creating/updating review record:", error);
        res.status(500).json({
            error: "Failed to create/update review record",
            details: error.message,
        });
    }
}

async function getStudentReview(req, res) {
    const { studentId } = req.params;

    try {
        let studentReview = await StudentReview.findAll({
            where: { 
                student_key: studentId 
            },
            include: { 
                model: Review, 
                as: "review" ,
                include: { 
                    model: Lesson, 
                    as: "lesson" 
                },
            },
        });

        if (studentReview.length === 0) {
            return res.status(404).json({
                message: "No reviews found for this student.",
            });
        }

        return res.status(200).json({
            studentReview: studentReview
        });
    } catch (error) {
        res.status(500).json({
            error: "Failed to fetch student reviews",
            details: error.message,
        });
    }
}


module.exports = {
    getReviewQuestions,
    createReviewRecord,
    getStudentReview
};
