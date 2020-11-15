import { Router } from "express";
import * as markup from "../controllers/markup";
import * as markupItem from "../controllers/markupItem";
import { UserRole } from "../enums/appEnums";
import allowForRoles from "../middlewares/allowForRoles";

const markupRouter = Router();

// получение всех разметок экперта
markupRouter.get("/", allowForRoles(UserRole.EXPERT), markup.getForExpert);

// получение разметки по id, результат раличный для эксперта и заказчика
markupRouter.get("/:markupId", allowForRoles(UserRole.EXPERT, UserRole.CUSTOMER), markup.getMarkupById);

// добавить эксперта к разметке. Принимает параметр запроса id: /:markupId/experts?login=...
markupRouter.put("/:markupId/experts", allowForRoles(UserRole.CUSTOMER), markup.addExpertByLogin);

// получение разметки в виде текста
markupRouter.get("/:markupId/result", allowForRoles(UserRole.CUSTOMER), markup.getResult);

// получение элемента разметки
markupRouter.get("/:markupId/item", allowForRoles(UserRole.EXPERT), markupItem.get);

// отправка результата разметки текущего элемента
markupRouter.post("/:markupId/item", allowForRoles(UserRole.EXPERT), markupItem.post);

export default markupRouter;
