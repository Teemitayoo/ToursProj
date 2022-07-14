const Tour = require('./../models/tourModel');
const APIFeatures = require('./../utils/apiFeatures');
const catchAsync = require('./../utils/catchAsync');

exports.aliasTopTours = (req, res, next) => {
  req.query.limit = '5';
  req.query.sort = '-ratingsAverage,price';
  req.query.fields =
    'name, price, ratingsAverage,summary,difficulty';
  next();
};

exports.getAllTours = catchAsync(
  async (req, res, next) => {
    // EXECUTE QUERY
    const features = new APIFeatures(
      Tour.find(),
      req.query
    )
      .filter()
      .sort()
      .limitFields()
      .paginate();
    const tours = await features.query;

    // SEND RESPONSE
    res.status(200).json({
      status: 'success',
      results: tours.length,
      data: {
        tours, //cause of es6 should be tours:tours
      },
    });
  }
);
exports.getTours = catchAsync(
  async (req, res, next) => {
    const tour = await Tour.findById(req.params.id); //findbyid works like findone in mongodb shell
    res.status(200).json({
      status: 'success',
      data: {
        tour,
      },
    });
    // console.log(req.params);
    // const id = req.params.id * 1; //javascript trick for turning number in string to integer, '4' to 4
    /*const tour = tours.find((el) => el.id === id);

 */
  }
);

exports.createTour = catchAsync(
  async (req, res, next) => {
    const newTour = await Tour.create(req.body);

    res.status(201).json({
      status: 'success',
      data: {
        tour: newTour,
      },
    });
    // try {
    // } catch (err) {
    //   res.status(400).json({
    //     status: 'fail',
    //     messagae: err,
    //   });
    // }
  }
);

exports.updateTour = catchAsync(
  async (req, res, next) => {
    const tour = await Tour.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true, ///to run validators in the schema when updating like min length
      }
    );
    res.status(200).json({
      status: 'success',
      data: {
        tour,
      },
    });
  }
);

exports.deleteTour = catchAsync(
  async (req, res, next) => {
    await Tour.findByIdAndDelete(req.params.id);

    res.status(204).json({
      status: 'success',
      data: null,
    });
  }
);
//AGGREGATION PIPELINE, FOR STATISTICS

exports.getTourStats = catchAsync(
  async (req, res, next) => {
    const stats = await Tour.aggregate([
      {
        $match: { ratingsAverage: { $gte: 4.5 } },
      },
      {
        $group: {
          _id: { $toUpper: '$difficulty' },
          numTours: { $sum: 1 },
          numRatings: { $sum: '$ratingsQuantity' },
          avgRating: { $avg: '$ratingsAverage' },
          avgPrice: { $avg: '$price' },
          minPrice: { $min: '$price' },
          maxPrice: { $max: '$price' },
        },
      },
      {
        $sort: { avgPrice: 1 },
      },
      // {
      //   $match: {
      //     _id: { $ne: 'EASY' },
      //   },
      // },
    ]);

    res.status(200).json({
      status: 'success',
      data: {
        stats,
      },
    });
  }
);
exports.getMonthlyPlan = catchAsync(
  async (req, res, next) => {
    //for months with highest tours
    const year = req.params.year * 1;
    const plan = await Tour.aggregate([
      {
        $unwind: '$startDates',
      },
      {
        $match: {
          startDates: {
            $gte: new Date(`${year}-01-01`),
            $lte: new Date(`${year}-12-31`),
          },
        },
      },
      {
        $group: {
          _id: { $month: '$startDates' },
          numTourStarts: { $sum: 1 },
          tours: { $push: '$name' },
        },
      },
      {
        $addFields: { month: '$_id' },
      },
      {
        $project: {
          _id: 0,
        },
      },
      {
        $sort: { numTourStarts: -1 },
      },
      {
        $limit: 12, //just for limit not necessary
      },
    ]);
    res.status(200).json({
      status: 'success',
      data: {
        plan,
      },
    });
  }
);
