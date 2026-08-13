import express from "express";
import  userDemo  from "../controllers/user.controller.js";

const route = express.Router();

route.get('/test', userDemo)

export default route;