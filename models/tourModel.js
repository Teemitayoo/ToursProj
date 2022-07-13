const mongoose = require('mongoose');
const slugify = require('slugify');
const validator = require('validator');

const tourSchema = new mongoose.Schema(
  {
    //schema is created first
    name: {
      type: String,
      required: [true, 'A tour must have a name'],
      unique: true,
      trim: true,
      maxlength: [
        40,
        'A tour name must have less or equal than 40 characters',
      ],
      minlength: [
        10,
        'A tour name must have more or equal than 10 characters',
      ],
      /*validate: [ //removed cause it doesnt allow space in tour names also
        validator.isAlpha,
        'Tour name must only contain characters',
      ],*/
    },
    slug: String,

    duration: {
      type: Number,
      required: [true, 'A tour must have a duration'],
    },
    maxGroupSize: {
      type: Number,
      required: [
        true,
        'A tour must have a group size',
      ],
    },
    difficulty: {
      type: String,
      required: [
        true,
        'A tour must have a difficulty',
      ],
      enum: {
        values: ['easy', 'medium', 'difficult'],
        message:
          'Difficulty is either: easy, medium, difficult',
      },
    },
    ratingsAverage: {
      type: Number,
      default: 4.5,
      min: [1, 'Rating must be above 1.0'],
      max: [5, 'Rating must be below 5.0'],
    },
    ratingsQuantity: {
      type: Number,
      default: 0,
    },
    price: {
      type: Number,
      required: [true, 'A tour must have a price'],
    },
    priceDiscount: {
      type: Number,
      validate: {
        //custom validator
        validator: function (val) {
          //not going to work with update
          return val < this.price; //100<200 true
        },
        message:
          'Discount price ({VALUE}) should be below regular price',
      },
    },
    summary: {
      type: String,
      trim: true, // for removing whitespace
      required: [
        true,
        'A tour must have a description',
      ],
    },
    description: {
      type: String,
      trim: true,
    },
    imageCover: {
      type: String,
      required: [
        true,
        'A tour must have a cover image',
      ],
    },
    images: [String],
    createdAt: {
      type: Date,
      default: Date.now(),
      select: false, //hide from user
    },
    startDates: [Date],
    secretTour: {
      type: Boolean,
      default: false,
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);
tourSchema.virtual('durationWeeks').get(function () {
  return this.duration / 7;
});
//DoCUMENT MIDDLEWARE: RUNS BEFORE THE SAVE AND CREATE COMMAND BUT NOT INSERT MANY

tourSchema.pre('save', function (next) {
  this.slug = slugify(this.name, { lower: true });
  next();
});

// tourSchema.pre('save', function (next) {
//   console.log('Will save document');
//   next();
// });
// tourSchema.post('save', function (doc, next) {
//   console.log(doc);
//   next();
// });

//QUERY MIDDLEWARE
tourSchema.pre(/^find/, function (next) {
  //work for all the strings that start with find /^find/
  this.find({ secretTour: { $ne: true } });
  this.start = Date.now();
  next();
});
tourSchema.post(/^find/, function (docs, next) {
  console.log(Date.now() - this.start);
  next();
});
//AGgregation MIDDLEWARE
tourSchema.pre('aggregate', function (next) {
  this.pipeline().unshift({
    $match: { secretTour: { $ne: true } }, //add to beginning of aggregate array so secret tour wont be use in statistics
  });
  console.log(this.pipeline());
  next();
});

const Tour = mongoose.model('Tour', tourSchema); //create model from schema above

module.exports = Tour;
