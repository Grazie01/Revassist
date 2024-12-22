const path = require('path');
const { Lesson } = require(path.resolve(__dirname,"../models/Lesson"));
const { YoutubeTranscript } = require("youtube-transcript")

async function getLesson(req, res) { 
    const { topicid, lessonid } = req.params; 
    try {
        const lesson = await Lesson.findOne({
            where: {
                id: lessonid,
                topic_key: topicid
            }
        });

        if (!lesson) {
            return res.status(404).json({ error: 'Lesson not found' });
        }

        res.json({ lesson });
    } catch (error) {
        res.status(500).json({ 
            error: 'Getting lesson failed', 
            details: error.message 
        });
    }
}

async function getVideo(req, res) {
    const { videoId } = req.body;
    console.log("GET request to /get-video with ID:", videoId);
  
    try {
      if (!videoId || typeof videoId !== 'string') {
          return res.status(400).json({ error: "Invalid video ID" });
      }
      const transcript = await YoutubeTranscript.fetchTranscript(videoId);
  
      if (!transcript) {
        return res.status(404).json({ error: "Transcript not available for this video" });
      }
  
      res.json({ transcript });
    } catch (error) {
      console.error("Error fetching transcript:", error);
      res.status(500).json({
        error: "Failed to fetch transcript",
        details: error.message
      });
    }
}

module.exports = { 
    getLesson,
    getVideo
};