import dotenv from "dotenv";
import connectDB from "./db/index.js";
dotenv.config({
  path: './env'
})  

connectDB(); 

// Connect to MongoDB database
/*
(async () => {
  try {
    // Connect to MongoDB database using the provided URI and database name
    await mongoose.connect(${process.env.MONGODB_URI}/${DB_NAME});
    app.on("error", (error) => {
      console.log("ERROR: ", error);
      throw error;
    });

    app.listen(process.env.PORT, () => {
      console.log(App is running on port ${process.env.PORT});
    });
  } catch (error) {
    console.log("ERROR: ", error);
    throw error;
  }
})();
*/
