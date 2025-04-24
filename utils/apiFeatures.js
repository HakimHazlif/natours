class APIFeatures {
  constructor(query, queryString) {
    this.query = query;
    this.queryString = queryString;
  }

  filter() {
    const queryObj = { ...this.queryString };
    const excludedFields = ['page', 'sort', 'limit', 'fields'];
    excludedFields.forEach((el) => delete queryObj[el]); // ignoring some params that you don't want to includ them

    let queryStr = JSON.stringify(queryObj);
    queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, (match) => `$${match}`); // to {$gte, $gt, $lte, $lt}
    // for example queryStr = {duration: { $gte: 5 }}
    // gte: great than or equal; gt: great than; vice versa to lte and lt

    this.query = this.query.find(JSON.parse(queryStr));

    return this; // return entire object
  }

  sort() {
    if (this.queryString.sort) {
      const sortBy = this.queryString.sort.split(',').join(' ');
      this.query = this.query.sort(sortBy);
    } else {
      this.query = this.query.sort('-createdAt');
    }

    return this;
  }

  limitFields() {
    if (this.queryString.fields) {
      const fields = this.queryString.fields.split(',').join(' ');
      this.query = this.query.select(fields);
    } else {
      this.query = this.query.select('-__v'); // (-) mines for not select or select all except __v
    }

    return this;
  }

  paginate() {
    const page = this.queryString.page * 1 || 1;
    const limit = this.queryString.limit * 1 || 20;
    const skip = (page - 1) * limit;
    // page 1: 1-20 so skip 0, page 2: 21-40 so skip first 20s and so on //
    this.query = this.query.skip(skip).limit(limit);

    // if (this.queryString.page) {
    //   const numTours = await Tour.countDocuments(); // mongoose proprety that calculate number of docs, it's like length
    //   if (skip >= numTours) throw new Error('This page does not exist');
    // }

    return this;
  }
}

module.exports = APIFeatures;
