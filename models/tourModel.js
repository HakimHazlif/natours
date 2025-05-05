const mongoose = require('mongoose');
const slugify = require('slugify');
// const User = require('./userModel'); for embedded
// const validator = require('validator');

// I could say that Schema as Typescript
// it's like setting  structure of SQL query
const tourSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'A tour must has a name'],
      uniqued: true,
      trim: true,
      maxlength: [40, 'A tour name must have less than or equal 40 characters'],
      minlength: [10, 'A tour name must have more than or equal 10 characters'],
      // validate: [validator.isAlpha, 'Tour name must only contain characters'], // from validator library
    },
    slug: String,
    duration: {
      type: Number,
      required: [true, 'A tour must has a duration'],
    },
    maxGroupSize: {
      type: Number,
      required: [true, 'A tour must has a group size'],
    },
    difficulty: {
      type: String,
      required: [true, 'A tour must has a difficulty'],
      enum: {
        values: ['easy', 'medium', 'difficult'],
        message: 'Difficulty is either: easy, medium, or difficult',
      },
    },
    ratingAverage: {
      type: Number,
      default: 4.5,
      min: [1, 'Rating must be above 1.0'], // can work with dates as well
      max: [5, 'Rating must be below 5.0'],
      set: (val) => Math.round(val * 10) / 10, // 4.66666666 => 46.66666, 47, 4.7
    },
    ratingQuantity: {
      type: Number,
      default: 0,
    },
    price: {
      type: Number,
      required: [true, 'A tour must has a price'],
    },
    priceDiscount: {
      type: Number,
      validate: {
        // custom validation
        validator: function (val) {
          // this only points to current doc on NEW document creation
          return val < this.price;
        },
        message: 'Discount price ({VALUE}) should be below regular price',
      },
    },
    summary: {
      type: String,
      required: [true, 'A tour must has a summary'],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    imageCover: {
      type: String,
      required: [true, 'A tour must has a cover image'],
    },
    images: [String],
    createdAt: {
      type: Date,
      default: Date.now(),
      select: false,
    },
    startDates: [Date],
    secretTour: {
      type: Boolean,
    },
    startLocation: {
      type: {
        type: String,
        default: 'Point',
        enum: ['Point'],
      },
      coordinates: [Number],
      address: String,
      description: String,
    },
    location: [
      {
        type: {
          type: String,
          default: 'Point',
          enum: ['Point'],
        },
        coordinates: [Number],
        address: String,
        description: String,
        day: Number,
      },
    ],
    // guides: Array, // with embedded
    guides: [
      {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
      },
    ],
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

tourSchema.index({ price: 1, ratingAverage: -1 }); // 1:ascending order ; -1: descending order
tourSchema.index({ slug: 1 });

tourSchema.virtual('durationWeeks').get(function () {
  return this.duration / 7;
});

// Virtual populate to get tour reviews
tourSchema.virtual('reviews', {
  ref: 'Review', // from Review Model
  foreignField: 'tour', // field from Review Model
  localField: '_id', // field from this model that comparing to foreignField
});

// DOCUMENT MIDDLEWARE: runs before .save() and .create()
tourSchema.pre('save', function (next) {
  this.slug = slugify(this.name, { lower: true });
  next();
});

// embedding tour guides
// tourSchema.pre('save', async function (next) {
//   const guidesPromises = this.guides.map(async (id) => await User.findById(id));

//   this.guides = await Promise.all(guidesPromises);

//   next();
// });

// QUERY MIDDLEWARE
tourSchema.pre(/^find/, function (next) {
  // /^find/ means anythig start with 'find' like find and findOne and findOneAndUpdate, etc;
  // tourSchema.pre('find', function (next) {
  this.find({ secretTour: { $ne: true } });

  this.start = Date.now();
  next();
});

tourSchema.pre(/^find/, function (next) {
  this.populate({
    path: 'guides',
    select: '-__v -passwordChangedAt', // don't includes these two columns
  }); // populate: search in associated collection (User in this case) and get the user documents based on ids. look about guides in schema

  next();
});

tourSchema.post(/^find/, function (doc, next) {
  // console.log(`Query took ${Date.now() - this.start} milliseconds`);
  // console.log(doc);

  this.find({ secretTour: { $ne: true } });
  next();
});

// AGGREGATION MIDDLEWARE
tourSchema.pre('aggregate', function (next) {
  this.pipelie().unshift({ $match: { secretTour: { $ne: true } } });
  next();
});

const Tour = mongoose.model('Tour', tourSchema);

module.exports = Tour;

// // creating document by model
// const testTour = new Tour({
//   name: 'The House 33',
// });

// // sava a document in database
// testTour
//   .save()
//   .then((doc) => {
//     console.log(doc);
//   })
//   .catch((err) => console.log('Error:', err));
