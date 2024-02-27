const mongoose = require('mongoose');
require("dotenv").config();
// Connection to mongo cloud database
mongoose.connect('mongodb+srv://Aizel:aizel1516@aizel.sfxhvxo.mongodb.net/?retryWrites=true&w=majority').then(() => console.log('Connected!'));

const Schema = mongoose.Schema;
const ObjectId = Schema.ObjectId;

const CurrentImg = new Schema({
    imgs : [String]
})
const imgCollection = mongoose.model('imgCurrent', CurrentImg);
// создаем коллекцию для юзера
const User = new Schema({
    username: String,
    password: String,
    created_at: Date,
    updated_at: Date,
    deleted_at:Date,
    email: String,
    is_admin: Boolean
});

const UserCollection = mongoose.model('User', User);

// создаем коллекцию запросов юзера
const WeatherLog = new Schema({
    user: ObjectId,
    city: String,
    created_at: Date,
    data: String
});

const WeatherLogCollection = mongoose.model('WeatherLog', WeatherLog);

const UserIp = new Schema({
    ip: String,
    user: ObjectId
});

const UserCurrentCollection= mongoose.model('UserCurrent', UserIp);

module.exports = {
    UserCollection,
    WeatherLogCollection,
    UserCurrentCollection,
    imgCollection
};
