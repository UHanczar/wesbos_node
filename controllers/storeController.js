const mongoose = require('mongoose');

const Store = mongoose.model('Store');

exports.homePage = (req, res) => {
  // console.log(res);
  res.render('index');
};

exports.addStore = (req, res) => {
  res.render('editStore', { title: 'Add Store' });
};

exports.createStore = async (req, res) => {
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
  const stores = await Store.find();
  res.render('stores', { title: 'Stores', stores });
};

exports.editStore = async (req, res) => {
  // find the store in Database using id
  const store = await Store.findOne({ _id: req.params.id });
  // confirm they are owner of the store
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
