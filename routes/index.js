const express = require("express");
const Joi = require("joi");
const { execFile } = require("child_process");

const router = express.Router();

router.post("/room-create", (req, res) => {
  const payload = req.body || {};

  const schema = Joi.object({
    Type: Joi.required(),
    RoomName: Joi.required(),
    PlayerCount: Joi.required(),
    GameMode: Joi.required(),
    Passcode: Joi.required(),
    BotMode: Joi.required(),
    MapID: Joi.required(),
    CreatorName: Joi.required(),
  });

  const { error } = schema.validate(payload);
  if (error) {
    return res.status(400).json({
      Result: "Fail",
      Error: error.details[0].message,
    });
  }

  execFile(payload.Type + ".exe", (error) => {
    if (error) {
      return res.status(500).json({
        Result: "Fail",
        Error: error.message,
      });
    }

    return res.json({ Result: "Success" });
  });
});

module.exports = router;
