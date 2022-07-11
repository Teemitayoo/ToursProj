const mongoose = require('mongoose');
const morgan = require('morgan');
const dotenv = require('dotenv');
dotenv.config({ path: './config.env' });
const app = require('./app');

const DB = process.env.DATABASE.replace(
  //for databse account, Franklin
  '<PASSWORD>',
  process.env.DATABASE_PASSWORD
);
//connecting to database
mongoose
  .connect(DB, {
    useNewUrlParser: true, //For depreciation, incase of old edition mongoose
    useCreateIndex: true,
    useFindAndModify: false,
    useUnifiedTopology: true,
  })
  .then(() =>
    console.log('DB connection successfull')
  );

/* const testTour = new Tour({
  name: 'The Park Camper',
  price: 497,
});

testTour
  .save()
  .then((doc) => {
    console.log(doc);
  })
  .catch((err) => {
    console.log('ERROR:', err);
  }); //save document to database */

//console.log(process.env);
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Running on port ${port}..`);
});
