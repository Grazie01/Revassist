const { Topic } = require(path.resolve(__dirname,'../models/Topic'));
const { Lesson } = require(path.resolve(__dirname,'../models/Lesson'));

async function getAllTopics(req, res) {
  try {
    const topics = await Topic.findAll({
      include: [
        {
          model: Lesson,
          as: 'lessons',
          attributes: ['id', 'title', 'videoID'], 
        },
      ],
    });
    res.json({ topics });
  } catch (error) {
    res.status(500).json({
      error: 'Getting topics failed',
      details: error.message,
    });
  }
}

module.exports = {
  getAllTopics,
};
