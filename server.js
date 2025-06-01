const mongoose = require('mongoose');
const dotenv = require('dotenv');
const app = require('./app');

process.on('uncaughtException', (err) => {
  console.log('Uncaught Exception! 💥 Shutting down...');
  console.log(err.name, err.message);
  process.exit(1); // 0 stands for a success and 1 stands for uncaught exception.
});

dotenv.config({ path: './config.env' }); // environment variables

const DB = process.env.DATABASE.replace(
  '<PASSWORD>',
  process.env.DATABASE_PASSWORD,
); // should do replacement at config.env file but the teacher did that here

mongoose
  // .connect(process.env.DATABASE_LOCAL, {
  // .connect(DB, {
  //   // this is outdate
  //   useNewUrlParser: true,
  //   useUnifiedTopology: true,
  //   // useCreateIndex: true,
  //   // useFindAndModify: false,
  // })
  .connect(DB)
  .then(() => {
    console.log('DB connection successful!');
  });

const port = process.env.PORT || 3000;
const server = app.listen(port, () => {
  console.log(`App running on port ${port}...`);
});

process.on('unhandledRejection', (err) => {
  console.log('Unhandled Rejection! 💥 Shutting down...');
  console.log(err.name, err.message);
  server.close(() => {
    process.exit(1); // 0 stands for a success and 1 stands for uncaught exception.
  });
});
