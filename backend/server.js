import express from 'express';
import bodyParser from 'body-parser';
import cookieParser from 'cookie-parser';
import passport from 'passport';
import mongoose from 'mongoose';
import morgan from 'morgan';
import fs from 'fs';
import http from 'http';
import WebSocket from 'ws';
import path from 'path';
import _ from 'lodash';

import {
  facebookLogin,
  facebookMiddleware,
  googleLogin,
  googleMiddleware,
  vkontakteLogin,
  vkontakteMiddleware,
  oauthCallback,
} from './controllers/auth';
import { list } from './controllers/events';

import Event from './models/event';
import Person from './models/person';

import router from './router';

var CLIENTS_QUEUE = [];

mongoose.Promise = global.Promise;
mongoose.connect('mongodb://localhost/events', {
  useMongoClient: true
});

const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));


// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

// Set up auth routes
app.get('/auth/facebook', facebookLogin);
app.get('/auth/google', googleLogin);
app.get('/auth/vkontakte', vkontakteLogin);

app.get('/auth/facebook/callback', facebookMiddleware, oauthCallback);
app.get('/auth/google/callback', googleMiddleware, oauthCallback);
app.get('/auth/vkontakte/callback', vkontakteMiddleware, oauthCallback);

app.get('/logout', function(req, res) {
    req.logout();
    // res.redirect('/');
    res.json("ok");
});

// Logger that outputs all requests into the console
app.use(morgan('combined'));

app.use('/v1', router);


// admin website part 

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.get('/admin', async (req, res) => {
    
    // auth with login and password

    var events = await Event.find().exec();
    var persons = await Person.find().exec();
    // send events , persons to pug template
    // console.log(events)
    // console.log(persons);
    res.render('index', { 
      title: 'Express',
      events: JSON.parse(JSON.stringify(events)),
      persons: JSON.parse(JSON.stringify(persons))
    });
    
});
 // return return events,
// [ list of events          ] 
// [ id | selector(manage_queue_ids) |  manage_ids .. ] [Button - Approve]


app.get('/images', function(req, res) {
    router.getImages(function(err, genres) {
        if (err) {
            throw err;
        }
        res.json(genres);
    });
});

app.get('/images/:id', function(req, res) {
    router.getImageById(req.params.id, function(err, genres) {
        if (err) { throw err; }
        res.contentType('image/png');
        res.send(fs.readFileSync(genres.path));
    });
});

const server = http.createServer(app);
export const wss = new WebSocket.Server({ server });

function mainLogic(ws, obj) {

  if (obj.command == 'start') {
    CLIENTS_QUEUE = [];
    var counter = 0;
    var selected = JSON.stringify({
        type: "selected",
        data: obj.selected
    });
    var next = JSON.stringify({
        // remove current user selected
        type: "next", // add data like this.state.selected[this.state.index]
        data: obj.selected
    });
    var last = JSON.stringify({
        type: "last",
        data: obj.selected
    });

    timeout = (counter) => {
        return JSON.stringify({
          type: "timeout",
          counter: counter
        });
    }
    tick = (seconds) => {
        return JSON.stringify({
          type: "tick",
          seconds: seconds
        });
    }
    wss.broadcast(selected);
    wss.broadcast(next);
    var seconds = 0;
    wss.broadcast(tick(seconds));
    var ticker = setInterval(function () {
        seconds++;
        wss.broadcast(  tick(seconds-counter*(obj.timeout + obj.talk_time)) )
    }, 1000);

    setTimeout(function() {
        wss.broadcast( timeout(counter) )
    }, obj.talk_time * 1000);

    var looper = setInterval(function() { 
        var timer = setTimeout(function() {
            wss.broadcast( timeout(counter) )
        }, obj.talk_time * 1000);
        counter++;
        
        if (counter >= JSON.parse(obj.selected).length - 1 ) // added - 1 
        {
            clearInterval(looper);
            clearTimeout(timer);
            clearTimeout(ticker);
            wss.broadcast(last); 
        } else {
            wss.broadcast(next); 
        }
    }, (obj.timeout + obj.talk_time) * 1000 );
    
  } else if (obj.command == 'connected') {
    
    var connected = JSON.stringify({
        type: "connected", 
        data: obj.data
    });
    wss.broadcast(connected); 

    // save obj.data to queue
    // if (!_.some(CLIENTS_QUEUE, obj.data)) {
      CLIENTS_QUEUE.push(obj.data);
    // }
    
  } else if (obj.command == 'closed') {

    var closed = JSON.stringify({
        // remove current user selected
        type: "closed", // add data like this.state.selected[this.state.index]
        data: obj.data
    });
    wss.broadcast(closed); 
    // remove obj.data to queue
    // if (_.some(CLIENTS_QUEUE, obj.data)) {
        _.remove(CLIENTS_QUEUE, obj.data);
    // }

  } else if (obj.command == 'clients_queue') {

    var response_queue = JSON.stringify({
        type: "response_queue", 
        data: CLIENTS_QUEUE
    });

    console.log('----- before broadcast response_queue ---')
    wss.broadcast(response_queue);

  } else if (obj.command == 'calculate') {
    // search event by id and get likes
    const participantsRelation = {
        path: 'participants', 
        select: ['name', 'avatar', 'likes'],
        model: 'Person',
    };
    Event.findById(obj.event_id).populate(participantsRelation).exec( function (err, event) { // Event.findById(obj.event_id, function (err, event) {
        if (err) {
        console.log(err);
        }
        // console.log(event.likes);    
        let matches = {};
        event.likes.forEach( (object) => {
            console.log('--trace----> ', object)
            // person_likes contains wrong!
            object.person_likes.forEach( (id) => {
                event.likes.forEach( (next) => {
                    if(next.person_id == id) {
                        if( next.person_likes.includes(object.person_id) ) {
                            if (!matches[object.person_id]) {
                                //  || !Array.isArray(matches[object.person_id])
                                matches[object.person_id] = [];
                            }
                            matches[object.person_id].push(id);
                            console.log('matches --> ',object.person_id, id);
                        }
                    }
                })
            })
        })

        console.log(event.participants);
        console.log(matches);
        // from array of ids to array of objects obj.selected
        for (var key in matches) {
            var key_index = _.findIndex(event.participants, function(o) { return o._id == key; });
            matches[key].forEach( (item, i , arr) => {
                var index = _.findIndex(event.participants, function(o) { return o._id == item; });
                arr[i] =  event.participants[index];
            })
            matches[key].unshift(event.participants[key_index]);
        }
        var calculate = JSON.stringify({
            type: "calculate",
            data: JSON.stringify(matches)
        });
        wss.broadcast(calculate);
    });
  }
}

wss.broadcast = function broadcast(data) {
  wss.clients.forEach(function each(client) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(data);
    }
  });
};

wss.on('connection', function connection(ws, req) {
  // const location = url.parse(req.url, true);
  // You might use location.query.access_token to authenticate or share sessions
  // or req.headers.cookie (see http://stackoverflow.com/a/16395220/151312)

  ws.on('message', function incoming(message) {
    console.log('received: %s', message);
    var obj = JSON.parse(message); 
    
    mainLogic(ws, obj);
  });
});


// Launch the server on the port 3000
server.listen(3000, () => {
  const { address, port } = server.address();
  console.log(`Listening at http://${address}:${port}`);
});