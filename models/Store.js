const mongoose = require('mongoose');

mongoose.Promise = global.Promise;
const slug = require('slugs');

const storeSchema = new mongoose.Schema({
  name: {
    type: String,
    trim: true,
    required: 'Please, enter a store name!'
  },
  slug: String,
  description: {
    type: String,
    trim: true
  },
  tags: [String],
  created: {
    type: Date,
    default: Date.now
  },
  location: {
    type: {
      type: String,
      default: 'Point'
    },
    coordinates: [{
      type: Number,
      required: 'You must supply coordinates!'
    }],
    address: {
      type: String,
      required: 'You must supply address!'
    }
  }
});

storeSchema.pre('save', function (next) {
  if (!this.isModified('name')) {
    next(); // skip it
    return; // storp this function
  }

  this.slug = slug(this.name);
  next();
  // later make it more resilient, so it has unique keys
});

module.exports = mongoose.model('Store', storeSchema);