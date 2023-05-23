const express = require("express");
const addDays = require("date-fns/addDays");
const Path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const app = express();
app.use(express.json());

const dbPath = Path.join(__dirname, "todoApplication.db");
let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server is Running at http://localhost:3000");
    });
  } catch (e) {
    console.log(e.message);
    process.exit(1);
  }
};

initializeDBAndServer();

let priorityArray = ["HIGH", "MEDIUM", "LOW"];
let statusArray = ["TO DO", "IN PROGRESS", "DONE"];
let categoryArray = ["WORK", "HOME", "LEARNING"];

const convertToDueDate = (dbObject) => {
  return {
    id: dbObject.id,
    todo: dbObject.todo,
    category: dbObject.category,
    priority: dbObject.priority,
    status: dbObject.status,
    dueDate: dbObject.due_date,
  };
};

app.get("/todos/", async (request, response) => {
  const { category, priority, status, search_q = "" } = request.query;
  let getQuery = "";
  let dbResponse = "";
  if (status !== undefined) {
    getQuery = `
        SELECT * FROM todo WHERE status='${status}';
        `;
    dbResponse = await db.all(getQuery);
    if (statusArray.includes(status)) {
      response.send(dbResponse.map((eachTodo) => convertToDueDate(eachTodo)));
    } else {
      response.status(400);
      response.send("Invalid Todo Status");
    }
  } else if (priority !== undefined) {
    getQuery = `
        SELECT * FROM todo WHERE priority='${priority}';
        `;
    dbResponse = await db.all(getQuery);
    if (priorityArray.includes(priority)) {
      response.send(dbResponse.map((eachTodo) => convertToDueDate(eachTodo)));
    } else {
      response.status(400);
      response.send("Invalid Todo Priority");
    }
  } else if (status !== undefined && priority !== undefined) {
    getQuery = `
        SELECT * FROM todo WHERE priority='${priority}' AND status='${status};
        `;
    dbResponse = await db.all(getQuery);
    response.send(dbResponse.map((eachTodo) => convertToDueDate(eachTodo)));
  } else if (category !== undefined && status !== undefined) {
    getQuery = `
        SELECT * FROM todo WHERE category='${category}' AND status='${status};
        `;
    dbResponse = await db.all(getQuery);
    response.send(dbResponse.map((eachTodo) => convertToDueDate(eachTodo)));
  } else if (category !== undefined) {
    getQuery = `
        SELECT * FROM todo WHERE category='${category}';
        `;
    dbResponse = await db.all(getQuery);
    if (categoryArray.includes(category)) {
      response.send(dbResponse.map((eachTodo) => convertToDueDate(eachTodo)));
    } else {
      response.status(400);
      response.send("Invalid Todo Category");
    }
  } else if (category !== undefined && priority !== undefined) {
    getQuery = `
        SELECT * FROM todo WHERE category='${category}' AND priority='${priority}';
        `;
    dbResponse = await db.all(getQuery);
    response.send(dbResponse.map((eachTodo) => convertToDueDate(eachTodo)));
  } else {
    getQuery = `
        SELECT * FROM todo WHERE todo LIKE '%${search_q}%';
        `;
    dbResponse = await db.all(getQuery);
    response.send(dbResponse.map((eachTodo) => convertToDueDate(eachTodo)));
  }
});

app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const getQueryId = `
  SELECT * FROM todo WHERE id=${todoId};
        `;
  const dbResponseId = await db.get(getQueryId);
  response.send(convertToDueDate(dbResponseId));
});

app.get("/agenda/", async (request, response) => {
  const { date } = request.query;
  const result = addDays(new Date(date), 0);
  const getQueryDate = `
    SELECT * FROM todo WHERE due_date='${`${result.getFullYear()}-${
      result.getMonth() + 1
    }-${result.getDate()}`}';
        `;
  const dbResponseDate = await db.all(getQueryDate);
  response.send(dbResponseDate);
});

app.post("/todos/", async (request, response) => {
  const { id, todo, priority, status, category, dueDate } = request.body;
  if (statusArray.includes(status)) {
  } else {
    response.status(400);
    response.send("Invalid Todo Status");
  }
  const postQuery = `
  INSERT INTO todo(id, todo, priority, status, category, due_date)
  VALUES(
    ${id},
    '${todo}',
    '${priority}',
    '${status}',
    '${category}',
    '${dueDate}'
  );
  `;
  const dbPost = await db.run(postQuery);
  response.send("Todo Successfully Added");
});

app.put("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const { status, priority, todo, category, dueDate } = request.body;
  let updateQuery = "";
  if (status !== undefined) {
    updateQuery = `
      UPDATE todo
      SET status='${status}'
      WHERE id=${todoId};
      `;
    await db.run(updateQuery);
    if (statusArray.includes(status)) {
      response.send("Status Updated");
    } else {
      response.status(400);
      response.send("Invalid Todo Status");
    }
  } else if (priority !== undefined) {
    updateQuery = `
      UPDATE todo
      SET priority='${priority}'
       WHERE id=${todoId};
      `;
    await db.run(updateQuery);
    if (priorityArray.includes(priority)) {
      response.send("Priority Updated");
    } else {
      response.status(400);
      response.send("Invalid Todo Priority");
    }
  } else if (todo !== undefined) {
    updateQuery = `
      UPDATE todo
      SET todo='${todo}'
       WHERE id=${todoId};
      `;
    await db.run(updateQuery);
    response.send("Todo Updated");
  } else if (category !== undefined) {
    updateQuery = `
      UPDATE todo
      SET category='${category}'
       WHERE id=${todoId};
      `;
    await db.run(updateQuery);
    if (categoryArray.includes(category)) {
      response.send("Category Updated");
    } else {
      response.status(400);
      response.send("Invalid Todo Category");
    }
  } else {
    updateQuery = `
      UPDATE todo
      SET due_date='${dueDate}'
       WHERE id=${todoId};
      `;
    await db.run(updateQuery);
    response.send("Due Date Updated");
  }
});

app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const deleteQuery = `
    DELETE FROM todo WHERE id=${todoId};
    `;
  await db.run(deleteQuery);
  response.send("Todo Deleted");
});

module.exports = app;
