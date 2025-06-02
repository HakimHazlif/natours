const mongoose = require('mongoose');
const dotenv = require('dotenv');
const fs = require('fs');
const Tour = require('../../models/tourModel');

dotenv.config({ path: `${__dirname}/../../config.env` });

const DB = process.env.DATABASE.replace(
  '<PASSWORD>',
  process.env.DATABASE_PASSWORD,
);

mongoose
  .connect(DB, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log('DB connection successful!');
  });

const importLocation = async () => {
  try {
    const toursData = JSON.parse(
      fs.readFileSync(`${__dirname}/tours.json`, 'utf-8'),
    );

    console.log(`Found ${toursData.length} tours in JSON file`);

    let errors = [];

    const results = await Promise.allSettled(
      toursData.map(async (tourData) => {
        console.log(
          `Updating ${tourData._id} with location:`,
          tourData.locations,
        );

        const result = await Tour.findByIdAndUpdate(
          tourData._id,
          { locations: tourData.locations },
          { new: true, runValidators: true },
        );

        if (!result) errors.push(tourData._id);
        return result;
      }),
    );

    const successful = results.filter(
      (result) => result.status === 'fulfilled',
    ).length;
    const failed = results.filter(
      (result) => result.status === 'rejected',
    ).length;

    console.log('\n=== UPDATE SUMMARY ===');
    console.log(`Total tours in JSON: ${toursData.length}`);
    console.log(`Successfully updated: ${successful}`);
    console.log(`Errors: ${failed}`);
    if (errors.length > 0) {
      console.log('\nErrors encountered:');
      errors.forEach((error) => console.log(`- ${error}`));
    }
  } catch (err) {
    console.error('Error reading JSON file or connecting to database:', err);
  } finally {
    mongoose.connection.close();
  }
};

process.on('unhandledRejection', (err) => {
  console.log('UNHANDLED REJECTION! 💥 Shutting down...');
  console.log(err.name, err.message);
  mongoose.connection.close(() => {
    process.exit(1);
  });
});

importLocation();
