const express = require("express");
const app = express();
const mongoose = require("mongoose");
const db = mongoose.connection;
const cors = require("cors");
const path = require("path");
const Bus = require("./models/bus");

require("dotenv").config();

let mongoURI = process.env.DATABASE;

mongoose.set("strictQuery", true);
mongoose.set("runValidators", true);
mongoose.set("debug", true);
console.log(`connecting to ${mongoURI}`);
mongoose.connect(mongoURI);
db.on("open", () => console.log("MongoDB connection established"));

app.use(express.static(path.join(__dirname, "./client/build")));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(
  cors({
    origin: "http://127.0.0.1:3000",
    credentials: true,
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
    preflightContinue: false,
    optionsSuccessStatus: 204,
  })
);

app.get("/api/data", async function (req, res) {
  let result = await Bus.findOne({ order: 0 });
  console.log("Buses:", result.bus.length);
  console.log("Stops:", Object.keys(result.stop).length);
  console.log("Routes:", Object.keys(result.route).length);
  res.status(200).json(result);
});

app.get("/api/admin", async function (req, res) {
  let result = await Bus.find().sort({ order: 1 });
  res.status(200).json(result);
});

app.post("/api/admin", async function (req, res) {
  let bus = await getBusData();
  let stop = await getstop();
  let route = await getBusRoutes(stop);

  await Bus.findOneAndDelete({ order: 2 });
  await Bus.findOneAndUpdate({ order: 1 }, { order: 2 });
  await Bus.findOneAndUpdate({ order: 0 }, { order: 1 });
  await Bus.create({
    order: 0,
    date: new Date(),
    bus: bus,
    stop: stop,
    route: route,
  });
  let result = await Bus.find().sort({ order: 1 });
  res.status(200).json(result);
});

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "./client/build/index.html"));
});

mongoose.connection.once("open", () => {
  app.listen(5000, console.log(`Listening to port 5000...`));
});

async function getBusData() {
  let busList = [];
  let skipNum = 0;
  while (true) {
    const response = await fetch(
      `http://datamall2.mytransport.sg/ltaodataservice/BusServices?$skip=${skipNum}`,
      {
        method: "GET",
        headers: {
          AccountKey: "mWuj2cg8Q4ecpAXyDgRfyA==",
          accept: "application/json",
        },
      }
    );
    let data = await response.json();
    busList = [...busList, ...data.value];
    if (data.value.length !== 500) {
      break;
    } else {
      skipNum += 500;
    }
  }
  busList = busList.sort((a, b) => {
    let letterA = "";
    let letterB = "";
    let numberA = 0;
    let numberB = 0;
    if (isNaN(a.ServiceNo)) {
      letterA = a.ServiceNo[a.ServiceNo.length - 1].toUpperCase();
      numberA = parseInt(a.ServiceNo.substring(0, a.ServiceNo.length - 1));
    } else {
      numberA = parseInt(a.ServiceNo);
    }
    if (isNaN(b.ServiceNo)) {
      letterB = b.ServiceNo[b.ServiceNo.length - 1].toUpperCase();
      numberB = parseInt(b.ServiceNo.substring(0, b.ServiceNo.length - 1));
    } else {
      numberB = parseInt(b.ServiceNo);
    }
    if (numberA > numberB) {
      return 1;
    } else if (numberA === numberB) {
      if (letterA > letterB) {
        return 1;
      } else {
        return -1;
      }
    } else {
      return -1;
    }
  });
  let x = 0;
  while (x < busList.length - 1) {
    if (busList[x].ServiceNo === busList[x + 1].ServiceNo) {
      busList.splice(x + 1, 1);
    } else {
      x++;
    }
  }
  return busList;
}

async function getstop() {
  let stopList = [];
  let skipNum = 0;
  while (true) {
    const response = await fetch(
      `http://datamall2.mytransport.sg/ltaodataservice/BusStops?$skip=${skipNum}`,
      {
        method: "GET",
        headers: {
          AccountKey: "mWuj2cg8Q4ecpAXyDgRfyA==",
          accept: "application/json",
        },
      }
    );
    let data = await response.json();
    stopList = [...stopList, ...data.value];
    if (data.value.length !== 500) {
      break;
    } else {
      skipNum += 500;
    }
  }
  let sortedStops = {};
  while (stopList.length > 0) {
    sortedStops[stopList[0].BusStopCode] = {
      RoadName: stopList[0].RoadName,
      Description: stopList[0].Description,
      Latitude: stopList[0].Latitude,
      Longitude: stopList[0].Longitude,
      Buses: [],
    };
    stopList.shift();
  }
  return sortedStops;
}

async function getBusRoutes(stop) {
  if (Object.keys(stop).length === 0) {
    return;
  }
  let routeList = [];
  let skipNum = 0;
  while (true) {
    const response = await fetch(
      `http://datamall2.mytransport.sg/ltaodataservice/BusRoutes?$skip=${skipNum}`,
      {
        method: "GET",
        headers: {
          AccountKey: "mWuj2cg8Q4ecpAXyDgRfyA==",
          accept: "application/json",
        },
      }
    );
    let data = await response.json();
    routeList = [...routeList, ...data.value];
    if (data.value.length !== 500) {
      break;
    } else {
      skipNum += 500;
    }
  }
  let sortedRoutes = {};
  while (routeList.length > 0) {
    if (sortedRoutes[routeList[0].ServiceNo] === undefined) {
      sortedRoutes[routeList[0].ServiceNo] = {
        [routeList[0].Direction]: [
          {
            BusStopCode: routeList[0].BusStopCode,
            RoadName: stop[routeList[0].BusStopCode].RoadName,
            Description: stop[routeList[0].BusStopCode].Description,
            Latitude: stop[routeList[0].BusStopCode].Latitude,
            Longitude: stop[routeList[0].BusStopCode].Longitude,
          },
        ],
      };
    } else if (
      sortedRoutes[routeList[0].ServiceNo][routeList[0].Direction] === undefined
    ) {
      sortedRoutes[routeList[0].ServiceNo][routeList[0].Direction] = [
        {
          BusStopCode: routeList[0].BusStopCode,
          RoadName: stop[routeList[0].BusStopCode].RoadName,
          Description: stop[routeList[0].BusStopCode].Description,
          Latitude: stop[routeList[0].BusStopCode].Latitude,
          Longitude: stop[routeList[0].BusStopCode].Longitude,
        },
      ];
    } else {
      sortedRoutes[routeList[0].ServiceNo][routeList[0].Direction].push({
        BusStopCode: routeList[0].BusStopCode,
        RoadName: stop[routeList[0].BusStopCode].RoadName,
        Description: stop[routeList[0].BusStopCode].Description,
        Latitude: stop[routeList[0].BusStopCode].Latitude,
        Longitude: stop[routeList[0].BusStopCode].Longitude,
      });
    }
    if (
      !stop[routeList[0].BusStopCode].Buses.includes(routeList[0].ServiceNo)
    ) {
      stop[routeList[0].BusStopCode].Buses.push(routeList[0].ServiceNo);
    }
    routeList.shift();
  }

  let stopKeys = Object.keys(stop);
  for (let x = 0; x < stopKeys.length; x++) {
    stop[stopKeys[x]].Buses = stop[stopKeys[x]].Buses.sort((a, b) => {
      let letterA = "";
      let letterB = "";
      let numberA = 0;
      let numberB = 0;
      if (isNaN(a)) {
        letterA = a[a.length - 1].toUpperCase();
        numberA = parseInt(a.substring(0, a.length - 1));
      } else {
        numberA = parseInt(a);
      }
      if (isNaN(b)) {
        letterB = b[b.length - 1].toUpperCase();
        numberB = parseInt(b.substring(0, b.length - 1));
      } else {
        numberB = parseInt(b);
      }
      if (numberA > numberB) {
        return 1;
      } else if (numberA === numberB) {
        if (letterA > letterB) {
          return 1;
        } else {
          return -1;
        }
      } else {
        return -1;
      }
    });
  }
  return sortedRoutes;
}
