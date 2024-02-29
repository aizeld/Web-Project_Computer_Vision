require("dotenv").config();
const express = require("express");
const fetch = require("node-fetch");
const port = 8080
const bodyParser = require('body-parser');
const { UserCollection, WeatherLogCollection, UserCurrentCollection, imgCollection} = require('./db_control');
const app = express();
const {getTimeCurrent } = require('./helper');
const bcrypt = require('bcrypt');
const fsPromises = require('fs').promises;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
//serve static
app.use(express.static('public'));

// app.get("/", (req, res) => {
//   res.sendFile("index.html", { root: __dirname });
// });

const multer = require('multer');
const fs = require('fs');
const path = require('path');
var upload = multer({
  dest: __dirname + '../public/img/',
})


app.get('/deletePhoto', async (req, res) => {
  const imageName = req.query.imageName;
  try {
      
      const result = await imgCollection.updateOne({}, { $pull: { imgs: imageName } });

      if (result) {
          console.log(`Deleted image: ${imageName}`);
       
          const directoryPath = path.join(__dirname, 'public', 'img', imageName);
          fs.rmdirSync(directoryPath, { recursive: true });
          res.redirect('/photos');
      } else {
          console.log(`Image '${imageName}' not found in collection`);
          res.status(404).send(`Image '${imageName}' not found in collection`);
      }
  } catch (error) {
      console.error('Error deleting image:', error);
      res.status(500).send('Error deleting image'); 
  }
});

app.get("/photos", async (req, res) =>{
  const user = await getUser(req.ip)
  const img = await imgCollection.findOne({}); 
  
  const directoryPath = path.join(__dirname, 'public', 'img');
  const directories = fs.readdirSync(directoryPath, { withFileTypes: true })
                        .filter(dirent => dirent.isDirectory())
                        .map(dirent => dirent.name);

  console.log("Local directories: ", directories)
 var imglist = img ? img.imgs : [];
 imglist = imglist.filter(directory => directories.includes(directory));
  res.render('page/photos.ejs', {activePage: "photo", user: user ? user : null, error: null, imglist:imglist})
})






app.post('/addPhotos', upload.array('photos', 3), async (req, res) => {
  const directoryName = req.body.directoryName;
  console.log(directoryName)

  const directoryPath = path.join(__dirname, 'public', 'img', directoryName);
  if (!fs.existsSync(directoryPath)) {
      fs.mkdirSync(directoryPath, { recursive: true });
  }

  for (let i = 0; i < req.files.length; i++) {
      const file = req.files[i];
      const newName = `${i + 1}.jpg`; 
      const newPath = path.join(directoryPath, newName);
      fs.renameSync(file.path, newPath);
  }

  try {

      const updatedDoc = await imgCollection.findOneAndUpdate(
          {},
          { $addToSet: { imgs: directoryName } },
          { upsert: true, new: true }
      );
      console.log('Directory name added to array in MongoDB:', updatedDoc);
      res.redirect("/photos");
  } catch (error) {
      console.error('Error adding directory name to array in MongoDB:', error);
      res.status(500).send('Error uploading photos');
  }
});


app.post('/updatePhoto', upload.array('editPhotos', 3), async (req, res) => {
  try {
      console.log(req.body);
      const oldDirectoryName = req.body.oldDirectoryName;
      const newDirectoryName = req.body.editDirectoryName;
      console.log(oldDirectoryName);
      console.log(newDirectoryName);
      
      // Construct old and new directory paths
      const oldDirectoryPath = path.join(__dirname, 'public', 'img', oldDirectoryName);
      const newDirectoryPath = path.join(__dirname, 'public', 'img', newDirectoryName);
      // меняю название директорий
      if (oldDirectoryName !== newDirectoryName) {
          fs.renameSync(oldDirectoryPath, newDirectoryPath);
      }

     //меняю название фоток на 1.жпг 2.жпг 3.жпг
      req.files.forEach((file, index) => {
          const newFileName = `${index + 1}.jpg`;
          fs.renameSync(file.path, path.join(newDirectoryPath, newFileName));
      });

      // меняю имя в монго
      await imgCollection.updateOne(
          { imgs: oldDirectoryName },
          { $set: { "imgs.$": newDirectoryName } } 
      );

      console.log('Photos updated successfully');
      res.redirect("/photos");
  } catch (error) {
      console.error('Error updating photos:', error);
      res.status(500).send('Error updating photos');
  }
});


app.get("/detect", async (req, res)=>{
  const user = await getUser(req.ip)
  const img = await imgCollection.findOne({}); 
  
 let imglist = img ? img.imgs : []
 if (imglist.length === 0) {
  imglist = ["Sozdatel"];
}
const directoryPath = path.join(__dirname, 'public', 'img');
  const directories = fs.readdirSync(directoryPath, { withFileTypes: true })
                        .filter(dirent => dirent.isDirectory())
                        .map(dirent => dirent.name);
imglist = imglist.filter(directory => directories.includes(directory));//смотрю если директорий случайно исчезли из-за рендера то удаляю из монго чтобы нейронка работала без траблов
 console.log(imglist)
  res.render('page/detect.ejs', {activePage: "detect", user: user ? user : null, error: null, imglist:imglist})
})






app.get("/", async (req, res)=>{
  const user = await getUser(req.ip)

  res.render('page/home.ejs', { activePage: "home", user: user ? user : null, error: null});
})

app.post("/", async (req, res) =>{
  console.log("test")
  const user = await getUser(req.ip);
  const city = req.body.cityInput;

  const weatherData = await getWeatherdata(city);
  
    if (user && weatherData) {
        const weatherLog = new WeatherLogCollection({ user: user, city: city, data: JSON.stringify(weatherData), created_at: new Date()});
        await weatherLog.save();
    }
    
})

app.post("/detailed", async (req, res) =>{
  console.log("test")
  const user = await getUser(req.ip);
  const city = req.body.city;

  const weatherData = await getWeatherdata(city);
  
    if (user && weatherData) {
        const weatherLog = new WeatherLogCollection({ user: user, city: city, data: JSON.stringify(weatherData), created_at: new Date()});
        await weatherLog.save();
    }
    res.render('page/detailed.ejs', { coord: weatherData ?  weatherData.weather.coordinates : null,activePage: "detail", user: user ? user : null, Data: weatherData? weatherData: null, city: city, error: weatherData ? null : "Failed to fetch weather data" });
})


app.get("/detailed", async (req, res)=>{
  const user = await getUser(req.ip)
  res.render('page/detailed.ejs', {activePage:"detail", user:user ? user : null, error:null, Data:null })




})






app.get("/login", async (req, res) => {
  const user = await getUser(req.ip);
  if (user) {
      return res.status(303).redirect("/");
  }

  res.render('page/login.ejs', { activePage: "login", error: null, user: null });
});


app.post("/login", async (req, res) => {
  const username = req.body.username;
  const password = req.body.password;

 
        
 
  if (!username || !password) {
    res.render('page/login.ejs', { activePage: "login", error: "Заполните поля", user: null });
    return;
  }
  let userInstance = await UserCollection.findOne({ username: username }).exec();
  const match = await bcrypt.compare(password, userInstance.password);
  if (!userInstance || !match) {
    res.render('page/login.ejs', { activePage: "login", error: !userInstance ? "Юзера нет в списке" : "Пароль неправильный", user: null });
    return;
  }
  
  await UserCurrentCollection.create({ ip: req.ip, user: userInstance._id });
  res.status(303).redirect("/");
});



app.get("/signup", async (req, res) => {
  const user = await getUser(req.ip);
  if (user) {
      return res.status(303).redirect("/");
  }
  res.render('page/signup.ejs', { activePage: "signup", error: null, user: null });
});




app.post("/signup", async (req, res) => {
  const username = req.body.username;
  const email = req.body.email;
  const password = req.body.password;
  if (!username || !email || !password) {
      res.render('page/signup.ejs', { activePage: "signup", error: "Заполните поля", user: null });
      return;
  }
  let userInstance = await UserCollection.findOne({ username: username }).exec();
  if (userInstance) {
      res.render('page/signup.ejs', { activePage: "signup", error: "Юзер уже есть в списке", user: null });
      return;
  }

  const saltRounds = 10;
  const hashedPassword = await bcrypt.hash(password, saltRounds);


  userInstance = new UserCollection({ username: username, email: email, password: hashedPassword, created_at: new Date(), is_admin : false });
  await userInstance.save();
  await UserCurrentCollection.create({ ip: req.ip, user: userInstance._id });
  res.status(303).redirect("/");
});



app.get("/logout", async (req, res) => {
  await UserCurrentCollection.findOneAndDelete({ ip: req.ip }).exec();
  res.status(303).redirect("/");
});







app.get('/weather', async (req, res) => {
  try {
    const cityName = req.query.city; 
    const data = await getWeatherdata(cityName);
    res.json(data);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Epic Fail" });
  }
});

async function getWeatherdata(city) {
  try {
    const WeatherMapresponse = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${process.env.openWeatherAPIKey}&units=metric`);
    const weatherData = await WeatherMapresponse.json();

    if (!weatherData.sys) {
      console.error("Failed to fetch weather data");
      return null;
    }

    const country = weatherData.sys.country;

    const NewsDataresponse = await fetch(`https://newsapi.org/v2/top-headlines?country=${country}&category=business&apiKey=${process.env.NewAPIKey}`);
    const NewsData = await NewsDataresponse.json();

    const news = {
      country: country,
      article1: NewsData.articles.length > 0 ? { title: NewsData.articles[0].title, url: NewsData.articles[0].url } : { title: "No data", url: "#" },
      article2: NewsData.articles.length > 1 ? { title: NewsData.articles[1].title, url: NewsData.articles[1].url } : { title: "No data", url: "#" },
      article3: NewsData.articles.length > 2 ? { title: NewsData.articles[2].title, url: NewsData.articles[2].url } : { title: "No data", url: "#" },
      article4: NewsData.articles.length > 3 ? { title: NewsData.articles[3].title, url: NewsData.articles[3].url } : { title: "No data", url: "#" },
      article5: NewsData.articles.length > 4 ? { title: NewsData.articles[4].title, url: NewsData.articles[4].url } : { title: "No data", url: "#" },
      article6: NewsData.articles.length > 5 ? { title: NewsData.articles[5].title, url: NewsData.articles[5].url } : { title: "No data", url: "#" }
    };

    const country_response = await fetch(`https://api.api-ninjas.com/v1/country?name=${country}`, { headers: { "X-Api-Key": process.env.Ninjas } });
    const country_data = await country_response.json();

    return {
      weather: {
        min: weatherData.main.temp_min,
        max: weatherData.main.temp_max,
        temperature: weatherData.main.temp,
        description: weatherData.weather[0].description,
        icon: weatherData.weather[0].icon,
        coordinates: weatherData.coord,
        feelsLike: weatherData.main.feels_like,
        humidity: weatherData.main.humidity,
        pressure: weatherData.main.pressure,
        windSpeed: weatherData.wind.speed,
        countryCode: weatherData.sys.country,
        rainVolume: weatherData.rain && weatherData.rain["3h"],
      },
      news: news,
      country: country_data,
    };
  } catch (error) {
    console.error("Error fetching data:", error);
    return null;
  }
}


app.get("/history", async (req, res) => {
  const user = await getUser(req.ip);
  if (!user) {
      return res.status(303).redirect("/");
  }
  const logs = await WeatherLogCollection.find({ user: user._id }).sort({ _id: -1 }).exec();
 
  res.render('page/history.ejs', { activePage: "history", user: user, logs: logs, error: logs ? null : "No logs found"});
});
app.get("/history/:objectId/delete", async (req, res) => {
  const user = await getUser(req.ip);
  if (!user) {
      return res.status(303).redirect("/");
  }

  const objectId = req.params.objectId;
  const log = await WeatherLogCollection.findById(objectId).exec()
  await WeatherLogCollection.findByIdAndDelete(objectId).exec();
  console.log("deleted " + log.city)
  res.status(303).redirect("/history");
  
});


app.get("/history/deleteAll", async (req, res) => {
  const user = await getUser(req.ip);
  if (!user) {
      return res.status(303).redirect("/");
  }
  try {
    const logs = await WeatherLogCollection.find({ user: user._id }).exec();
    await WeatherLogCollection.deleteMany({ user: user._id }).exec();
    console.log(`Deleted ${logs.length} logs for user ${user.username}`);
    
    // Redirect back to the history page
    res.status(303).redirect("/history");
  } catch (error) {
    console.error("Error deleting logs:", error);
    // Handle error accordingly
    res.status(500).send("Error deleting logs");
  }
});


app.get("/admin", async (req, res) => {
  const user = await getUser(req.ip);

  if (!user || !user.is_admin) {
      return res.status(303).redirect("/");
  }
  const allUsers = await UserCollection.find().exec();
  res.render('page/admin.ejs', { activePage: "admin", user: user, users: allUsers });
});
app.get("/admin/:userid/delete", async (req, res) => {
  const user = await getUser(req.ip);

  if (!user || !user.is_admin) {
      return res.redirect("/");
  }

  const userId = req.params.userid;

  await UserCollection.findByIdAndDelete(userId).exec();
  res.redirect("/admin");
});

app.post("/admin/addUser", async (req, res) => {
  const { username, email, password, is_admin } = req.body;
  const user = await getUser(req.ip);
  const hashedPassword = await bcrypt.hash(password, saltRounds = 10);
  if (!user || !user.is_admin) {
      return res.status(403).redirect("/");
  }

  const userInstance = new UserCollection({ username: username, email: email, password: hashedPassword, is_admin: false });
  await userInstance.save();

  res.status(202).redirect("/admin");
});
app.post('/admin/updateUser', async (req, res) => {
  console.log(req.body)
  try {
      const { userId, username, email, password } = req.body;
    
      const hashedPassword = await bcrypt.hash(password, saltRounds = 10);
      await UserCollection.findByIdAndUpdate(userId, { username, email, hashedPassword });
      res.redirect('/admin');
  } catch (error) {
      // Handle the error here
      console.error("Error updating user:", error);
      res.status(500).send("An error occurred while updating the user.");
  }
});


app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});

async function getUser(ip) {
  let username = await UserCurrentCollection.findOne({ ip: ip }).exec();
  username = username ? username.user : null;

  let userInstance = null;
  if (username) {
      userInstance = await UserCollection.findOne({ _id: username }).exec();
  }

  return userInstance;
}

