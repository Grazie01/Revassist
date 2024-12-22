const timeToSeconds = (time) => {
    const [hours, minutes, seconds] = time.split(':').map(Number);
    return (hours * 3600) + (minutes * 60) + seconds;
};
  
const secondsToTime = (totalSeconds) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
};
  
function convertTimeToSeconds(time) {
    const [hours, minutes, seconds] = time.split(':').map(Number);
    return hours * 3600 + minutes * 60 + seconds;
}
  
function calculateConfidenceLevel(answerCards){
    const timeWeight = 0.3
    const scoreWeight = 0.7
    let total_confidence_level = 0;
    let ave_confidence_level = 0;

    let numOfAnswerCards = answerCards.length;
    console.log("numOfAnswerCards: ", numOfAnswerCards)

    for (const answer of answerCards) {
        let score_contribution = (answer.is_correct ? 1 : 0) * scoreWeight;
        let time_contribution = 0;
        let final_time_contribution = 0;
        let confidence_level = 0;
        if (answer.is_correct) {
            const formattedTime = convertTimeToSeconds(answer.time_taken);
            if (formattedTime <= 10){
                final_time_contribution = time_contribution = timeWeight;
            } else {
                time_contribution = (1 - ((formattedTime - 10) / 10)) * timeWeight
                final_time_contribution = time_contribution > 0 ? time_contribution : 0;
            }
            
            confidence_level = (score_contribution + final_time_contribution) * 100
        }
        console.log("confidence level: ", confidence_level)
        total_confidence_level = total_confidence_level + confidence_level;
        ave_confidence_level = total_confidence_level / numOfAnswerCards;
        console.log("score: ", score_contribution, " time weight: ", final_time_contribution)
        console.log("average confidence level: ", ave_confidence_level)
    }

    return ave_confidence_level;
}

function calculateModelConfidenceLevel(answerCards, totalQuestionNum){
    let ave_confidence_level = 0;
    console.log("totalQuestionNum: ", totalQuestionNum)

    for (const answer of answerCards){
        ave_confidence_level = ave_confidence_level + answer.confidence_level
    }

    console.log("total model confidence level: ", ave_confidence_level)
    ave_confidence_level = ave_confidence_level / totalQuestionNum;
    console.log("average model confidence level: ", ave_confidence_level)
    return ave_confidence_level;

}

function getNumberOfQuestions (level, questionsAmount){
    let partialQuestionAmount = 0;
    switch (level) {
        case 0:
          partialQuestionAmount = Math.ceil(questionsAmount / 3);
          break; 
        case 1:
          partialQuestionAmount = Math.ceil(questionsAmount / 2);
          break;
        case 2:
          partialQuestionAmount = questionsAmount;
          break; 
        default:
          partialQuestionAmount = Math.ceil(questionsAmount / 3);
          break; 
      }

    return partialQuestionAmount;
}

module.exports = {
    timeToSeconds,
    secondsToTime,
    convertTimeToSeconds,
    calculateConfidenceLevel,
    getNumberOfQuestions,
    calculateModelConfidenceLevel
};