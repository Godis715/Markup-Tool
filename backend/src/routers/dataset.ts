import { Router } from "express";
import * as dataset from "../controllers/dataset";
import { UserRole } from "../enums/appEnums";
import allowForRoles from "../middlewares/allowForRoles";

const datasetRouter = Router();

datasetRouter.post("/", allowForRoles(UserRole.CUSTOMER), dataset.post);
datasetRouter.use("/", dataset.postHandleErrors);

datasetRouter.get("/", allowForRoles(UserRole.CUSTOMER), dataset.getAll);

datasetRouter.get("/:datasetId", allowForRoles(UserRole.CUSTOMER), dataset.getById);

// тип разметки передается в параметре запроса: /api/dataset/:datasetId/markup?type=xyz
datasetRouter.post("/:datasetId/markup", allowForRoles(UserRole.CUSTOMER), dataset.postDatasetMarkup);

// получение списка разметок одного датасета
datasetRouter.get("/:datasetId/markup", allowForRoles(UserRole.CUSTOMER), dataset.getDatasetMarkup);

export default datasetRouter;
