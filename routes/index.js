const express = require("express");
const Joi = require("joi");
const os = require("os");
const { spawn } = require("child_process");
const axios = require("axios");

const { Server, Instance, Sequelize } = require("../models");

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

  const server = await Server.findOne({ where: { hostname: req.hostname } });
  if (!server) {
    return res.status(400).json({
      Result: "Fail",
      Error: "Invalid Hostname",
    });
  }

  const bestServer = await Server.findOne({
    attributes: {
      include: [[Sequelize.fn("COUNT", Sequelize.col("instances.id")), "instance_count"]],
    },
    where: {
      status: 1,
    },
    include: [
      {
        model: Instance,
        as: "instances",
        attributes: [],
        required: false,
      },
    ],
    group: ["Server.id"],
    having: Sequelize.literal("(`Server`.`limit` IS NULL OR `Server`.`limit` = 0 OR COUNT(`instances`.`id`) < `Server`.`limit`)"),
    order: [[Sequelize.literal("instance_count"), "ASC"]],
    subQuery: false,
    limit: 1,
  });

  if (!bestServer) {
    return res.status(503).json({
      Result: "Fail",
      Error: "No eligible server available",
    });
  }

  if (bestServer.id === server.id) {
    try {
      const server = await Server.findOne({ where: { hostname: req.hostname } });
      if (!server) {
        return res.status(400).json({
          Result: "Fail",
          Error: "Invalid Hostname",
        });
      }

      const instance = await Instance.create({
        server_id: server.id,
        app_name: Type,
      });

      const { pid, err } = await new Promise((resolve) => {
        const process = spawn(os.platform() === "win32" ? "./" + Type + "/" + Type + ".exe" : "./" + Type + "/" + Type + ".x86_64", [
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
          "-instanceid",
          instance.id,
        ]);

        process.on("error", (err) => {
          resolve({ pid: null, err });
        });

        process.stdout.on("data", (data) => {
          resolve({ pid: process.pid, err: null });
          console.log(data.toString());
        });
      });

      if (err) {
        await instance.destroy();
        return res.status(500).json({
          Result: "Fail",
          Error: err.message,
        });
      }

      instance.process_id = pid;
      await instance.save();

      return res.json({
        Result: "Success",
        Data: {
          InstanceID: instance.id,
        },
      });
    } catch (error) {
      return res.status(500).json({
        Result: "Fail",
        Error: error.message,
      });
    }
  } else {
    try {
      const response = await axios.post(bestServer.protocol + "://" + bestServer.hostname + ":" + bestServer.port + "/room-create", payload);
      return res.json(response.data);
    } catch (error) {
      return res.status(500).json({
        Result: "Fail",
        Error: error.message,
      });
    }
  }
});

router.post("/room-end", async (req, res) => {
  const payload = req.body || {};

  const schema = Joi.object({
    InstanceID: Joi.required(),
  });

  const { error } = schema.validate(payload);
  if (error) {
    return res.status(400).json({
      Result: "Fail",
      Error: error.details[0].message,
    });
  }

  const { InstanceID } = payload;

  const server = await Server.findOne({ where: { hostname: req.hostname } });
  if (!server) {
    return res.status(400).json({
      Result: "Fail",
      Error: "Invalid Hostname",
    });
  }

  const instance = await Instance.findByPk(InstanceID, {
    include: [
      {
        model: Server,
        as: "server",
      },
    ],
  });
  if (!instance) {
    return res.status(400).json({
      Result: "Fail",
      Error: "Invalid Instance ID",
    });
  }

  if (instance.server_id === server.id) {
    try {
      process.kill(instance.process_id, "SIGTERM");
      await instance.destroy();
      return res.json({
        Result: "Success",
      });
    } catch (error) {
      return res.status(500).json({
        Result: "Fail",
        Error: error.message,
      });
    }
  } else {
    try {
      const response = await axios.post(instance.server.protocol + "://" + instance.server.hostname + ":" + instance.server.port + "/room-create", payload);
      return res.json(response.data);
    } catch (error) {
      return res.status(500).json({
        Result: "Fail",
        Error: error.message,
      });
    }
  }
});

module.exports = router;
