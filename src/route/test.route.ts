import { Router } from "express";

import { testController } from "../controller/test.controller";

export var router = Router();

// Basic test route
router.get("/", testController);
