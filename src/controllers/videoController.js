const Video = require("../models/videoModel");

// =====================================================
// CREATE VIDEO
// FormData field: video
// =====================================================
exports.createVideo = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Video file is required",
      });
    }

    const videoUrl = `/uploads/videos/${req.file.filename}`;

    const video = await Video.create({
      videoUrl,
    });

    return res.status(201).json({
      success: true,
      message: "Video uploaded successfully",
      data: video,
    });
  } catch (error) {
    console.error("Create Video Error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// =====================================================
// GET ALL VIDEOS
// =====================================================
exports.getVideos = async (req, res) => {
  try {
    const videos = await Video.find().sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      data: videos,
    });
  } catch (error) {
    console.error("Get Videos Error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// =====================================================
// GET VIDEO BY ID
// =====================================================
exports.getVideoById = async (req, res) => {
  try {
    const video = await Video.findById(req.params.id);

    if (!video) {
      return res.status(404).json({
        success: false,
        message: "Video not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: video,
    });
  } catch (error) {
    console.error("Get Video Error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// =====================================================
// UPDATE VIDEO
// FormData field: video
// =====================================================
exports.updateVideo = async (req, res) => {
  try {
    const video = await Video.findById(req.params.id);

    if (!video) {
      return res.status(404).json({
        success: false,
        message: "Video not found",
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "New video file is required",
      });
    }

    // Delete old video
    const fs = require("fs");
    const path = require("path");

    if (video.videoUrl) {
      const oldVideoPath = path.join(
        __dirname,
        "..",
        video.videoUrl
      );

      if (fs.existsSync(oldVideoPath)) {
        fs.unlinkSync(oldVideoPath);
      }
    }

    video.videoUrl = `/uploads/videos/${req.file.filename}`;

    await video.save();

    return res.status(200).json({
      success: true,
      message: "Video updated successfully",
      data: video,
    });
  } catch (error) {
    console.error("Update Video Error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// =====================================================
// DELETE VIDEO
// =====================================================
exports.deleteVideo = async (req, res) => {
  try {
    const video = await Video.findById(req.params.id);

    if (!video) {
      return res.status(404).json({
        success: false,
        message: "Video not found",
      });
    }

    const fs = require("fs");
    const path = require("path");

    if (video.videoUrl) {
      const videoPath = path.join(
        __dirname,
        "..",
        video.videoUrl
      );

      if (fs.existsSync(videoPath)) {
        fs.unlinkSync(videoPath);
      }
    }

    await Video.findByIdAndDelete(req.params.id);

    return res.status(200).json({
      success: true,
      message: "Video deleted successfully",
    });
  } catch (error) {
    console.error("Delete Video Error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};