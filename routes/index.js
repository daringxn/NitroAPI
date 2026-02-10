const express = require("express");
const Joi = require("joi");
const os = require("os");
const { spawn } = require("child_process");

const router = express.Router();

router.post("/room-create", async (req, res) => {
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
    QuickMode: Joi.required(),
  });

  const { error } = schema.validate(payload);
  if (error) {
    return res.status(400).json({
      Result: "Fail",
      Error: error.details[0].message,
    });
  }

  const { Type, RoomName, PlayerCount, GameMode, Passcode, BotMode, MapID, CreatorName, QuickMode } = payload;

  try {
    await new Promise((resolve, reject) => {
      const server = spawn(os.platform() === "win32" ? "./" + Type + "/" + Type + ".exe" : "./" + Type + "/" + Type + ".x86_64", [
        "-batchmode",
        "-nographics",
        "-server",
        "-room",
        RoomName,
        "-count",
        PlayerCount,
        "-gamemode",
        GameMode,
        "-pass",
        Passcode,
        "-bot",
        BotMode,
        "-map",
        MapID,
        "-creator",
        CreatorName,
        "-quickmode",
        QuickMode,
      ]);

      server.on("error", (err) => {
        reject(err);
      });

      server.stdout.on("data", (data) => {
        resolve();
        console.log(data.toString());
      });
    });
  } catch (error) {
    return res.status(500).json({
      Result: "Fail",
      Error: error.message,
    });
  }

  return res.json({ Result: "Success" });
});

module.exports = router;
