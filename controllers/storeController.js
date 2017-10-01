const mongoose = require('mongoose');
const multer = require('multer');
const jimp = require('jimp');
const uuid = require('uuid');

const multerOptions = {
  storage: multer.memoryStorage(),
  fileFilter(req, file, next) {
    const isPhoto = file.mimetype.startsWith('image/');

    if (isPhoto) {
      next(null, true);
    } else {
      next({ message: 'That filetype is\'t allowed!' }, false);
    }
  }
};

const Store = mongoose.model('Store');
const User = mongoose.model('User');

exports.homePage = (req, res) => {
  // console.log(res);
  res.render('index');
};

exports.addStore = (req, res) => {
  res.render('editStore', { title: 'Add Store' });
};

exports.upload = multer(multerOptions).single('photo');

exports.resize = async (req, res, next) => {
  // check if there is file to resize
  if (!req.file) {
    next();
    return;
  }

  const extension = req.file.mimetype.split('/')[1];
  req.body.photo = `${uuid.v4()}.${extension}`;
  
  // now we should resize it
  const photo = await jimp.read(req.file.buffer);
  await photo.resize(800, jimp.AUTO);
  await photo.write(`./public/uploads/${req.body.photo}`);
  
  // when we write a photo keep going
  next();
};

exports.createStore = async (req, res) => {
  req.body.author = req.user._id;
  // try {
  const store = await (new Store(req.body)).save();
  // await store.save();
  req.flash('success', `Successfully Created ${store.name}. Care to leave a review?`);
  console.log(req.body);
  res.redirect(`/store/${store.slug}`);
  console.log('Store saved!');
  // } catch (err) {
  //   throw Error(err);
  // }
  // it should place right after save() if not use async/await
  // .then(store => {
  //   return Store.find();
  // })
  // .then(stores => res.render('storeList', { stores: stores }))
  // .catch(err => {
  //   throw Error(err);
  // });
};

exports.getStores = async (req, res) => {
  const page = req.params.page || 1;
  const limit = 4;
  const skip = (page * limit) - limit;
  const storesPromise = Store
    .find()
    .skip(skip)
    .limit(limit)
    .sort({ created: 'desc' });

  const countPropmise = Store.count();
  const [stores, count] = await Promise.all([storesPromise, countPropmise]);
  const pages = Math.ceil(count / limit);

  if (!stores.length && skip) {
    req.flash('info', `Hey! You asked for page ${page}. But that doesn't exist. So I put you on page ${pages}`);
    res.redirect(`/stores/page/${page}`);
    return;
  }

  res.render('stores', { title: 'Stores', stores, page, pages, count });
};

const confirmOwner = (store, user) => {
  if (!store.author.equals(user._id)) {
    throw Error('You must own a store in order to edit it!');
  }
};

exports.editStore = async (req, res) => {
  // find the store in Database using id
  const store = await Store.findOne({ _id: req.params.id });
  // confirm they are owner of the store
  confirmOwner(store, req.user);
  // render userForm so user can update store
  res.render('editStore', { title: `Edit ${store.name}`, store });
};

exports.updateStore = async (req, res) => {
  // set the location data to be a Point
  req.body.location.type = 'Point';
  // find and update the store
  const store = await Store.findOneAndUpdate({ _id: req.params.id }, req.body, { new: true, runValidators: true }).exec();
  req.flash('success', `Successfully updated <strong>${store.name}</strong>. <a href="/stores/${store.slug}">View Store</a>`); // return new store instead old one
  // redirect them to store and tell them it works
  res.redirect(`/stores/${store._id}/edit`);
};

exports.getStoreBySlug = async (req, res) => {
  const store = await Store.findOne({ slug: req.params.slug }).populate('author reviews');
  
  if (!store) return next();
  
  res.render('store', { store, title: store.name });
};

exports.getStoresByTag = async (req, res) => {
  const tag = req.params.tag;
  const tagQuery = tag || { $exists: true }
  const tagsPromise = Store.getTagsList();
  const storePromise = Store.find({ tags: tagQuery });

  const [tags, stores] = await Promise.all([tagsPromise, storePromise]);

  res.render('tags', { tags, title: 'Tags', tag, stores });
};

exports.searchStores = async (req, res) => {
  const stores = await Store.find({
    $text: {
      $search: req.query.q
    }
  }, {
    score: { $meta: 'textScore'}
  })
  .sort({
    score: { $meta: 'textScore' }
  })
  .limit(5);

  res.json(stores);
};

exports.mapStores = async (req, res) => {
  const coordinates = [req.query.lng, req.query.lat].map(parseFloat);

  const q = {
    location: {
      $near: {
        $geometry: {
          type: 'Point',
          coordinates
        },
        $maxDistance: 10000 // 10km
      }
    }
  };

  const stores = await Store.find(q).select('slug name description location').limit(10);
  res.json(stores);
};

exports.mapPage = (req, res) => {
  res.render('map', { title: 'Map' });
};

exports.heartStore = async (req, res) => {
  const hearts = req.user.hearts.map(obj => obj.toString());
  const operator = hearts.includes(req.params.id) ? '$pull' : '$addToSet';
  const user = await User.findByIdAndUpdate(req.user._id, 
    { [operator]: { hearts: req.params.id } },
    { new: true }
  );

  res.json(user);
};

exports.getHearts = async (req, res) => {
  const stores = await Store.find({
    _id: { $in: req.user.hearts }
  });

  res.render('stores', { title: 'Hearted Stores', stores });
};

exports.getTopStores = async (req, res) => {
  const stores = await Store.getTopStores();
  // res.json(stores);
  res.render('topStores', { stores, title: '★ Top Stores' });
};
