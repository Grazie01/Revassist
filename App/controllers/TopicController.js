const { Topic } = require('../models/Topic');
const { Lesson } = require('../models/Lesson');

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
