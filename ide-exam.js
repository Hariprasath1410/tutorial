const express = require("express");
const app = express();

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");
const dbPath = path.join(__dirname, "todoApplication.db");

const dateFns = require("date-fns");

app.use(express.json());

const initializeDatabaseServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });

    app.listen(3000, () => {
      console.log("Server Running On Port 3000");
    });
  } catch (error) {
    console.log(`DB Error : ${error.message}`);
    process.exit(1);
  }
};

initializeDatabaseServer();

const priorities = ["HIGH", "MEDIUM", "LOW"];
const statuses = ["TO DO", "IN PROGRESS", "DONE"];
const categories = ["WORK", "HOME", "LEARNING"];
const dateFormat = "yyyy-MM-dd";

const checkPriority = (priority) => {
  return priorities.includes(priority);
};
const checkStatus = (status) => {
  return statuses.includes(status);
};
const checkCategory = (category) => {
  return categories.includes(category);
};
const checkDate = () => {
  console.log("Date check");
};

app.get("/todos/", async (request, response) => {
  const {
    status = "",
    priority = "",
    category = "",
    search_q = "",
  } = request.query;

  const initiate = async () => {
    const sqlQuery = `SELECT id,todo,priority,status,category
    ,due_date AS dueDate FROM todo WHERE todo.todo LIKE '%${search_q}%' 
      AND priority LIKE '%${priority}%' AND status LIKE '%${status}%' 
      AND category LIKE '%${category}%';`;
    const result = await db.all(sqlQuery);
    return result;
  };

  if (status !== "" && priority !== "") {
    if (checkStatus(status) === false) {
      response.status(400);
      response.send("Invalid Todo Status");
    } else if (checkPriority(priority) === false) {
      response.status(400);
      response.send("Invalid Todo Priority");
    } else {
      const finalR = await initiate();
      response.send(finalR);
    }
  } else if (status !== "" && category !== "") {
    if (checkStatus(status) === false) {
      response.status(400);
      response.send("Invalid Todo Status");
    } else if (checkCategory(category) === false) {
      response.status(400);
      response.send("Invalid Todo Category");
    } else {
      const finalR = await initiate();
      response.send(finalR);
    }
  } else if (priority !== "" && category !== "") {
    if (checkPriority(priority) === false) {
      response.status(400);
      response.send("Invalid Todo Priority");
    } else if (checkCategory(category) === false) {
      response.status(400);
      response.send("Invalid Todo Category");
    } else {
      const finalR = await initiate();
      response.send(finalR);
    }
  } else if (status !== "") {
    if (checkStatus(status) === false) {
      response.status(400);
      response.send("Invalid Todo Status");
    } else {
      const finalR = await initiate();
      response.send(finalR);
    }
  } else if (priority !== "") {
    if (checkPriority(priority) === false) {
      response.status(400);
      response.send("Invalid Todo Priority");
    } else {
      const finalR = await initiate();
      response.send(finalR);
    }
  } else if (category !== "") {
    if (checkCategory(category) === false) {
      response.status(400);
      response.send("Invalid Todo Category");
    } else {
      const finalR = await initiate();
      response.send(finalR);
    }
  } else {
    const finalR = await initiate();
    response.send(finalR);
  }
});

//To Get a Specific Todo Based On TodoId

app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const toGetATodoQuery = `SELECT id,todo,priority,status,category
  ,due_date AS dueDate FROM todo WHERE id=${todoId};`;
  const result = await db.get(toGetATodoQuery);
  response.send(result);
});

//to Get todos Based on the Given Date

app.get("/agenda/", async (request, response) => {
  const { date } = request.query;
  try {
    const neededFormat = dateFns.format(new Date(date), dateFormat);
    const getTodosBasedOnDateQ = `SELECT id,todo,priority,status
    ,category,due_date AS dueDate FROM todo 
    WHERE due_date='${neededFormat}';`;
    const result = await db.all(getTodosBasedOnDateQ);
    response.send(result);
  } catch (error) {
    response.status(400);
    response.send("Invalid Due Date");
  }
});

//To create a todo

app.post("/todos/", async (request, response) => {
  const { id, todo, priority, status, category, dueDate } = request.body;
  if (checkPriority(priority) === false) {
    response.status(400);
    response.send("Invalid Todo Priority");
  } else if (checkStatus(status) === false) {
    response.status(400);
    response.send("Invalid Todo Status");
  } else if (checkCategory(category) === false) {
    response.status(400);
    response.send("Invalid Todo Category");
  } else {
    try {
      const neededFormatDate = dateFns.format(new Date(dueDate), dateFormat);
      const createNewTodoQuery = `INSERT INTO 
            todo(id,todo,priority,status,category,due_date) 
            VALUES (${id},'${todo}','${priority}','${status}','${category}'
            ,'${neededFormatDate}');`;
      await db.run(createNewTodoQuery);
      response.send("Todo Successfully Added");
    } catch (error) {
      response.status(400);
      response.send("Invalid Due Date");
    }
  }
});

//To Update A Todo
app.put("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const { status, priority, todo, category, dueDate } = request.body;

  if (status !== undefined) {
    if (checkStatus(status) === false) {
      response.status(400);
      response.send("Invalid Todo Status");
    } else {
      const toUpdateStatusQuery = `UPDATE todo SET status='${status}' 
          WHERE id=${todoId};`;
      await db.run(toUpdateStatusQuery);
      response.send("Status Updated");
    }
  } else if (priority !== undefined) {
    if (checkPriority(priority) === false) {
      response.status(400);
      response.send("Invalid Todo Priority");
    } else {
      const toUpdatePriorityQuery = `UPDATE todo SET priority='${priority}' 
          WHERE id=${todoId};`;
      await db.run(toUpdatePriorityQuery);
      response.send("Priority Updated");
    }
  } else if (category !== undefined) {
    if (checkCategory(category) === false) {
      response.status(400);
      response.send("Invalid Todo Category");
    } else {
      const toUpdateCategoryQuery = `UPDATE todo SET category='${category}' 
          WHERE id=${todoId};`;
      await db.run(toUpdateCategoryQuery);
      response.send("Category Updated");
    }
  } else if (dueDate !== undefined) {
    try {
      const neededFormatDate = dateFns.format(new Date(dueDate), dateFormat);
      const toUpdateDueDateQuery = `UPDATE todo SET 
          due_date='${neededFormatDate}' WHERE id=${todoId};`;
      await db.run(toUpdateDueDateQuery);
      response.send("Due Date Updated");
    } catch (error) {
      response.status(400);
      response.send("Invalid Due Date");
    }
  } else {
    const toUpdateTodoQuery = `UPDATE todo SET todo='${todo}' 
      WHERE id=${todoId};`;
    await db.run(toUpdateTodoQuery);
    response.send("Todo Updated");
  }
});

//To Delete A Todo Based On TodoId

app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const toDeleteATodoQuery = `DELETE FROM todo WHERE id=${todoId};`;
  await db.run(toDeleteATodoQuery);
  response.send("Todo Deleted");
});

module.exports = app;
