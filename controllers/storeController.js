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

