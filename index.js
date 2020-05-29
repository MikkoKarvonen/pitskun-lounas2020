const express = require("express");
const port = process.env.PORT || 3000;
const app = express();
const fetch = require("node-fetch");
require("dotenv").config();
app.set("view engine", "pug");

let skipped = 0;
let courses = [];
let dayData = [];
const allCategories = [
  "Kotiruoka",
  "Vegaaninen kasvisruoka",
  "Kasviskeitto",
  "Jälkiruoka",
];

let date = new Date();
while (date.getDay() == 0 || date.getDay() == 6) {
  date.setDate(date.getDate() + 1);
}
getMenu(date, 0);
var dayInMilliseconds = 1000 * 60 * 60 * 6;
setInterval(function () {
  console.log(`Fetch data (${new Date()})`);
  html = ``;
  getMenu(date, 0);
}, dayInMilliseconds);

function getMenu(d, index) {
  dParse = d.toISOString().split("T")[0];
  fetch(`https://www.sodexo.fi/ruokalistat/output/daily_json/156/${dParse}`)
    .then((response) => response.json())
    .then((data) => {
      let i = 1;
      arr1 = [];
      if (index == 0) {
        while (true) {
          let course = data.courses[i];
          if (course && allCategories.includes(course.category)) {
            arr1.push(course.category);
          } else if (!course) {
            break;
          }
          i++;
        }
        i = 1;
        courses = arr1;
      }

      if (data.courses) {
        obj = {};
        arr = {};
        allCategories.map((e) => {
          arr[e] = "";
        });
        let dayTxt = d.toLocaleDateString("fi-FI", { weekday: "short" });
        obj.day = dayTxt[0].toUpperCase() + dayTxt.slice(1);
        obj.date = d.getDay();
        obj.dayNum = `${d.getDate()}.${d.getMonth() + 1}.`;
        obj.week = getWeekNumber(d);
        skipped = 0;
        while (true) {
          let course = data.courses[i];
          if (course && allCategories.includes(course.category)) {
            arr[course.category] = `${course.title_fi} (${course.properties})`;
          } else if (!course) {
            break;
          }
          i++;
        }
        obj.meals = arr;
        dayData.push(obj);
      } else {
        skipped++;
        if (skipped >= 3) {
          return true;
        }
      }
    })
    .then((a) => {
      if (index < 20 && !a) {
        d.setDate(date.getDate() + 1);
        while (date.getDay() == 0 || date.getDay() == 6) {
          d.setDate(date.getDate() + 1);
        }
        getMenu(d, index + 1);
      } else {
        let lastDay = 999;
        dayData.map((a) => {
          if (lastDay > a.date) {
            a.isFirst = true;
          }
          lastDay = a.date;
        });
      }
    })
    .catch((err) => {
      console.log(err);
    });
}

function getWeekNumber(d) {
  d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  var yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  var weekNo = Math.ceil(((d - yearStart) / 86400000 + 1) / 7);
  return weekNo;
}

app.get("/", function (req, res) {
  res.render("index", {
    courses: courses,
    dayData: dayData,
  });
});

app.listen(port, function () {
  console.log(`App listening on port ${port}`);
});
