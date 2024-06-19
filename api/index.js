const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const crypto = require("crypto");
const express = require("express");

const cors = require("cors");
const app = express();
const port = 3000;

const jwt = require("jsonwebtoken");

const moment = require("moment");

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cors());
mongoose
  .connect("mongodb+srv://PM:PM@cluster0.98ppkqe.mongodb.net/")
  .then(() => {
    console.log("Connected to MongoDB");
  }).catch((error) => {
    console.log("Connection failed", error);
  });

app.listen(port, () => {
  console.log(`Server started on port ${port}`);
});

const User = require("./models/user");
const Todo = require("./models/todo");

app.post("/register", async (req, res) => {
  try 
  {
    const { name, email, password } = req.body;
    const existingUser = await User.findOne({email});
    if (existingUser) 
    {
      console.log("User already exists");
    }
    const newUser = new User({
      name,
      email,
      password,
    });

    await newUser.save();
    res.status(202).json({ message: "User registered successfully" });

  }
  catch (error) 
  {
    console.log("Error in registering th user", error);
    res.status(500).json({ message: "Registration failed" });
  }

})

const generatesecretkey = () => {
  const secretkey= crypto.randomBytes(64).toString("hex");
  return secretkey;
}

const secretkey=generatesecretkey();

app.post("/login", async (req, res) => {
  try 
  {
    const { email, password } = req.body;
    const user = await  User.findOne  ({ email }); 
    if (!user) 
    {
      console.log("User not found");
      return res.status(401).json({ message: "User not found" });
    }
    if (user.password !== password)
    {
      console.log("Invalid credentials");
      return res.status(401).json({ message: "Invalid credentials" });
    }
    const token=jwt.sign({userId:user._id,},secretkey )
    res.status(200).json({ message: "User logged in successfully", token});
  }
  catch (error) 
  {
    console.log("Error in logging in the user", error);
    res.status(500).json({ message: "Login failed" });
  }
})

app.post("/todos/:userId", async (req, res) => {
  try {
    const userId = req.params.userId;
    const { title, category } = req.body;

    const newTodo = new Todo({
      title,
      category,
      dueDate: moment().format("YYYY-MM-DD"),
    });

    await newTodo.save();

    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({ error: "User not found" });
    }

    user?.todos.push(newTodo._id);
    await user.save();

    res.status(200).json({ message: "Todo added sucessfully", todo: newTodo });
  } catch (error) {
    res.status(200).json({ message: "Todo not added" });
  }
});


app.get("/users/:userId/todos", async (req, res) => {
  try {
    const userId = req.params.userId;

    const user = await User.findById(userId).populate("todos");
    if (!user) {
      return res.status(404).json({ error: "user not found" });
    }

    res.status(200).json({ todos: user.todos });
  } catch (error) {
    res.status(500).json({ error: "Something went wrong" });
  }
});

app.patch("/todos/:todoId/complete", async (req, res) => {
  try {
    const todoId = req.params.todoId;

    const updatedTodo = await Todo.findByIdAndUpdate(
      todoId,
      {
        status: "completed",
      },
      { new: true }
    );

    if (!updatedTodo) {
      return res.status(404).json({ error: "Todo not found" });
    }

    res
      .status(200)
      .json({ message: "Todo marked as complete", todo: updatedTodo });
  } catch (error) {
    res.status(500).json({ error: "Something went wrong" });
  }
});

app.get("/todos/completed/:date", async (req, res) => {
  try {
    const date = req.params.date;

    const completedTodos = await Todo.find({
      status: "completed",
      createdAt: {
        $gte: new Date(`${date}T00:00:00.000Z`), // Start of the selected date
        $lt: new Date(`${date}T23:59:59.999Z`), // End of the selected date
      },
    }).exec();

    res.status(200).json({ completedTodos });
  } catch (error) {
    res.status(500).json({ error: "Something went wrong" });
  }
});

app.get("/todos/count", async (req, res) => {
  try {
    const totalCompletedTodos = await Todo.countDocuments({
      status: "completed",
    }).exec();

    const totalPendingTodos = await Todo.countDocuments({
      status: "pending",
    }).exec();

    res.status(200).json({ totalCompletedTodos, totalPendingTodos });
  } catch (error) {
    res.status(500).json({ error: "Network error" });
  }
});